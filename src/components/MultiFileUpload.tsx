import { useState, useCallback, useRef } from 'react';
import { X, Upload, FileSpreadsheet, AlertCircle, Check, Loader2, Trash2, Plus, Merge } from 'lucide-react';
import { ParsedData, VarianceRow } from '../types';
import { parseFile } from '../utils/fileParser';
import { generateId } from '../utils/helpers';

interface MultiFileUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: ParsedData) => void;
}

interface UploadedFile {
  id: string;
  file: File;
  status: 'pending' | 'parsing' | 'parsed' | 'error';
  data?: ParsedData;
  error?: string;
  rowCount?: number;
}

type MergeStrategy = 'stack' | 'budget-actual';

export default function MultiFileUpload({ isOpen, onClose, onImport }: MultiFileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [mergeStrategy, setMergeStrategy] = useState<MergeStrategy>('stack');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFiles([]);
    setMergeStrategy('stack');
    setError(null);
    setIsProcessing(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileSelect = useCallback(async (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    
    const newFiles: UploadedFile[] = [];
    const currentCount = files.length;
    const maxFiles = 3;
    
    for (let i = 0; i < Math.min(selectedFiles.length, maxFiles - currentCount); i++) {
      const file = selectedFiles[i];
      const ext = file.name.split('.').pop()?.toLowerCase();
      
      if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
        continue;
      }
      
      newFiles.push({
        id: generateId(),
        file,
        status: 'pending',
      });
    }

    if (newFiles.length === 0) return;

    setFiles(prev => [...prev, ...newFiles]);

    // Parse each file
    for (const uploadedFile of newFiles) {
      setFiles(prev => prev.map(f => 
        f.id === uploadedFile.id ? { ...f, status: 'parsing' } : f
      ));

      try {
        const data = await parseFile(uploadedFile.file);
        setFiles(prev => prev.map(f => 
          f.id === uploadedFile.id ? { 
            ...f, 
            status: 'parsed', 
            data, 
            rowCount: data.rows.length 
          } : f
        ));
      } catch (err) {
        setFiles(prev => prev.map(f => 
          f.id === uploadedFile.id ? { 
            ...f, 
            status: 'error', 
            error: err instanceof Error ? err.message : 'Failed to parse file' 
          } : f
        ));
      }
    }
  }, [files.length]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const mergeFiles = (): ParsedData | null => {
    const parsedFiles = files.filter(f => f.status === 'parsed' && f.data);
    
    if (parsedFiles.length === 0) return null;
    if (parsedFiles.length === 1) return parsedFiles[0].data!;

    if (mergeStrategy === 'stack') {
      // Stack rows from all files
      const allRows: VarianceRow[] = [];
      let hasCostCenter = false;
      let hasGLAccount = false;
      let hasPeriod = false;
      const allPeriods = new Set<string>();
      const allColumns = new Set<string>();

      parsedFiles.forEach(f => {
        if (f.data) {
          f.data.rows.forEach(row => {
            allRows.push({ ...row, id: generateId() });
          });
          if (f.data.hasCostCenter) hasCostCenter = true;
          if (f.data.hasGLAccount) hasGLAccount = true;
          if (f.data.hasPeriod) hasPeriod = true;
          f.data.periods.forEach(p => allPeriods.add(p));
          f.data.columns.forEach(c => allColumns.add(c));
        }
      });

      return {
        rows: allRows,
        columns: Array.from(allColumns),
        hasCostCenter,
        hasGLAccount,
        hasPeriod,
        periods: Array.from(allPeriods).sort(),
      };
    } else {
      // Budget + Actual merge (first file = budget, second file = actual)
      // This assumes both files have same categories
      const budgetFile = parsedFiles[0].data!;
      const actualFile = parsedFiles[1].data!;

      // Create a map of categories from actual file
      const actualMap = new Map<string, number>();
      actualFile.rows.forEach(row => {
        const key = [row.category, row.costCenter, row.glAccount, row.period].filter(Boolean).join('|');
        actualMap.set(key, row.actual);
      });

      // Update budget rows with actuals
      const mergedRows = budgetFile.rows.map(row => {
        const key = [row.category, row.costCenter, row.glAccount, row.period].filter(Boolean).join('|');
        const actual = actualMap.get(key) ?? row.budget; // Use budget if no actual found
        const dollarVariance = actual - row.budget;
        const percentVariance = row.budget !== 0 ? (dollarVariance / row.budget) * 100 : 0;

        return {
          ...row,
          id: generateId(),
          actual,
          dollarVariance,
          percentVariance,
          isSignificant: Math.abs(percentVariance) > 10 || Math.abs(dollarVariance) > 50000,
        };
      });

      return {
        ...budgetFile,
        rows: mergedRows,
      };
    }
  };

  const handleImport = () => {
    setIsProcessing(true);
    setError(null);

    try {
      const mergedData = mergeFiles();
      if (!mergedData) {
        setError('No valid data to import');
        setIsProcessing(false);
        return;
      }

      onImport(mergedData);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to merge files');
      setIsProcessing(false);
    }
  };

  const parsedCount = files.filter(f => f.status === 'parsed').length;
  const totalRows = files.reduce((sum, f) => sum + (f.rowCount || 0), 0);
  const canImport = parsedCount > 0 && !files.some(f => f.status === 'parsing');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-[#0F0F12] rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#1F1F23]">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upload Multiple Files</h2>
          </div>
          <button onClick={handleClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1F1F23]">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
            </div>
          )}

          {/* Drop Zone */}
          {files.length < 3 && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-[#2A2A2E] rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-colors mb-4"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                multiple
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Drop files here or click to browse
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Upload up to {3 - files.length} more file{3 - files.length !== 1 ? 's' : ''} (CSV or Excel)
              </p>
            </div>
          )}

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Uploaded Files</h3>
              
              {files.map((f, index) => (
                <div 
                  key={f.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#1F1F23] rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      f.status === 'parsed' ? 'bg-green-100 dark:bg-green-900/30' :
                      f.status === 'error' ? 'bg-red-100 dark:bg-red-900/30' :
                      'bg-blue-100 dark:bg-blue-900/30'
                    }`}>
                      {f.status === 'parsing' && <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />}
                      {f.status === 'parsed' && <Check className="w-4 h-4 text-green-600" />}
                      {f.status === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
                      {f.status === 'pending' && <FileSpreadsheet className="w-4 h-4 text-blue-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{f.file.name}</p>
                      <p className="text-xs text-gray-500">
                        {f.status === 'parsing' && 'Parsing...'}
                        {f.status === 'parsed' && `${f.rowCount} rows`}
                        {f.status === 'error' && f.error}
                        {f.status === 'pending' && 'Waiting...'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {mergeStrategy === 'budget-actual' && index < 2 && (
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        index === 0 ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {index === 0 ? 'Budget' : 'Actual'}
                      </span>
                    )}
                    <button
                      onClick={() => removeFile(f.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Merge Strategy */}
          {files.length >= 2 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">How to combine files?</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setMergeStrategy('stack')}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    mergeStrategy === 'stack' 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-200 dark:border-[#2A2A2E] hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Plus className="w-4 h-4" />
                    <span className="font-medium text-sm">Stack Rows</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Combine all rows from each file (e.g., multiple departments)
                  </p>
                </button>
                
                <button
                  onClick={() => setMergeStrategy('budget-actual')}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    mergeStrategy === 'budget-actual' 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-200 dark:border-[#2A2A2E] hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Merge className="w-4 h-4" />
                    <span className="font-medium text-sm">Budget + Actual</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    First file = Budget, Second file = Actuals (matched by category)
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Summary */}
          {parsedCount > 0 && (
            <div className="mt-6 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                Ready to import <strong>{totalRows}</strong> rows from <strong>{parsedCount}</strong> file{parsedCount !== 1 ? 's' : ''}
                {mergeStrategy === 'budget-actual' && parsedCount >= 2 && ' (merging budget with actuals)'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-[#1F1F23] bg-gray-50 dark:bg-[#1F1F23]/50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2A2A2E] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!canImport || isProcessing}
            className="btn-primary disabled:opacity-50"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Import {totalRows} Rows
          </button>
        </div>
      </div>
    </div>
  );
}

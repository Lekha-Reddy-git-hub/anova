import { useState, useRef, useCallback } from 'react';
import { X, Image, Upload, Loader2, AlertCircle, Check, FileSpreadsheet } from 'lucide-react';
import { ParsedData, VarianceRow } from '../types';
import { getApiKey, extractDataFromImage } from '../utils/gemini';
import { generateId } from '../utils/helpers';

interface ScreenshotImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: ParsedData) => void;
}

export default function ScreenshotImport({ isOpen, onClose, onImport }: ScreenshotImportProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<{ base64: string; mimeType: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedCSV, setExtractedCSV] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasApiKey = !!getApiKey();

  const resetState = () => {
    setImagePreview(null);
    setImageData(null);
    setExtractedCSV(null);
    setError(null);
    setStep('upload');
    setIsProcessing(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, etc.)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      
      // Extract base64 and mime type
      const base64 = dataUrl.split(',')[1];
      const mimeType = file.type;
      setImageData({ base64, mimeType });
      setStep('preview');
      setError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleExtract = async () => {
    if (!imageData || !hasApiKey) return;

    setIsProcessing(true);
    setError(null);

    try {
      const result = await extractDataFromImage(imageData.base64, imageData.mimeType);
      
      if (result.startsWith('ERROR:')) {
        throw new Error(result.replace('ERROR:', '').trim());
      }

      setExtractedCSV(result);
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract data from image');
    } finally {
      setIsProcessing(false);
    }
  };

  const parseCSVToData = (csv: string): ParsedData => {
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Find column indices
    const categoryIdx = headers.findIndex(h => h.includes('category') || h.includes('description') || h.includes('name') || h.includes('item'));
    const budgetIdx = headers.findIndex(h => h.includes('budget') || h.includes('plan'));
    const actualIdx = headers.findIndex(h => h.includes('actual') || h.includes('spent'));
    const costCenterIdx = headers.findIndex(h => h.includes('cost') || h.includes('department') || h.includes('center'));
    const glAccountIdx = headers.findIndex(h => h.includes('gl') || h.includes('account'));
    const periodIdx = headers.findIndex(h => h.includes('period') || h.includes('month'));

    if (categoryIdx === -1 || budgetIdx === -1 || actualIdx === -1) {
      throw new Error('Could not identify Category, Budget, and Actual columns in extracted data');
    }

    const rows: VarianceRow[] = [];
    const periods = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length < 3) continue;

      const category = values[categoryIdx] || `Row ${i}`;
      const budget = parseFloat(values[budgetIdx]?.replace(/[$,]/g, '') || '0') || 0;
      const actual = parseFloat(values[actualIdx]?.replace(/[$,]/g, '') || '0') || 0;
      const dollarVariance = actual - budget;
      const percentVariance = budget !== 0 ? (dollarVariance / budget) * 100 : 0;
      const period = periodIdx !== -1 ? values[periodIdx] : undefined;
      
      if (period) periods.add(period);

      rows.push({
        id: generateId(),
        category,
        costCenter: costCenterIdx !== -1 ? values[costCenterIdx] : undefined,
        glAccount: glAccountIdx !== -1 ? values[glAccountIdx] : undefined,
        period,
        budget,
        actual,
        dollarVariance,
        percentVariance,
        isSignificant: Math.abs(percentVariance) > 10 || Math.abs(dollarVariance) > 50000,
        isStarred: false,
        comments: [],
        status: 'new',
        owner: '',
        rootCause: '',
        dueDate: '',
        explanation: '',
      });
    }

    return {
      rows,
      columns: headers,
      hasCostCenter: costCenterIdx !== -1,
      hasGLAccount: glAccountIdx !== -1,
      hasPeriod: periodIdx !== -1,
      periods: Array.from(periods).sort(),
    };
  };

  const handleImport = () => {
    if (!extractedCSV) return;

    try {
      const data = parseCSVToData(extractedCSV);
      if (data.rows.length === 0) {
        throw new Error('No valid data rows found');
      }
      onImport(data);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse extracted data');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-[#0F0F12] rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#1F1F23]">
          <div className="flex items-center gap-3">
            <Image className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Import from Screenshot</h2>
          </div>
          <button onClick={handleClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1F1F23]">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {!hasApiKey && (
            <div className="mb-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400">API Key Required</p>
                  <p className="text-sm text-amber-600 dark:text-amber-500 mt-1">
                    Add your Gemini API key in the AI chat settings to use screenshot import.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
            </div>
          )}

          {step === 'upload' && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-[#2A2A2E] rounded-xl p-12 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
              />
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-4" />
              <p className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                Drop a screenshot or click to browse
              </p>
              <p className="text-sm text-gray-500">
                Take a screenshot of your spreadsheet and we'll extract the data using AI
              </p>
            </div>
          )}

          {step === 'preview' && imagePreview && (
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-[#1F1F23]">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full max-h-64 object-contain bg-gray-50 dark:bg-[#1F1F23]"
                />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                The AI will analyze this image and extract the table data. This works best with clear, readable spreadsheet screenshots.
              </p>
            </div>
          )}

          {step === 'result' && extractedCSV && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <Check className="w-5 h-5" />
                <span className="font-medium">Data extracted successfully!</span>
              </div>
              
              <div className="rounded-lg border border-gray-200 dark:border-[#1F1F23] overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 dark:bg-[#1F1F23] border-b border-gray-200 dark:border-[#2A2A2E]">
                  <span className="text-xs font-medium text-gray-500">Extracted Data (CSV)</span>
                </div>
                <pre className="p-3 text-xs font-mono text-gray-700 dark:text-gray-300 overflow-x-auto max-h-48 bg-white dark:bg-[#0F0F12]">
                  {extractedCSV}
                </pre>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400">
                {extractedCSV.split('\n').length - 1} rows detected. Click Import to load this data.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-[#1F1F23] bg-gray-50 dark:bg-[#1F1F23]/50">
          <button
            onClick={() => step === 'upload' ? handleClose() : resetState()}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2A2A2E] rounded-lg transition-colors"
          >
            {step === 'upload' ? 'Cancel' : 'Start Over'}
          </button>

          {step === 'preview' && (
            <button
              onClick={handleExtract}
              disabled={isProcessing || !hasApiKey}
              className="btn-primary disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Extract Data
                </>
              )}
            </button>
          )}

          {step === 'result' && (
            <button onClick={handleImport} className="btn-primary">
              <Check className="w-4 h-4 mr-2" />
              Import Data
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

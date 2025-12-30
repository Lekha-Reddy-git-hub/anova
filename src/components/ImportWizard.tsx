import { useState, useCallback } from 'react';
import { X, Clipboard, ArrowRight, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { ColumnMapping, ParsedData, VarianceRow } from '../types';

interface ImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: ParsedData) => void;
}

type Step = 'paste' | 'map' | 'preview';

const COMMON_COLUMN_NAMES: Record<string, string[]> = {
  category: ['category', 'description', 'name', 'account', 'line item', 'item', 'gl description', 'account name'],
  budget: ['budget', 'budgeted', 'planned', 'plan', 'forecast', 'target', 'annual budget', 'ytd budget'],
  actual: ['actual', 'actuals', 'spent', 'ytd actual', 'ytd actuals', 'current', 'real'],
  costCenter: ['cost center', 'costcenter', 'department', 'dept', 'division', 'business unit', 'bu'],
  glAccount: ['gl account', 'glaccount', 'gl code', 'account code', 'gl', 'account number', 'acct'],
  period: ['period', 'month', 'date', 'fiscal period', 'quarter', 'year'],
};

export default function ImportWizard({ isOpen, onClose, onImport }: ImportWizardProps) {
  const [step, setStep] = useState<Step>('paste');
  const [pastedText, setPastedText] = useState('');
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    category: '',
    budget: '',
    actual: '',
  });
  const [error, setError] = useState<string | null>(null);

  const resetWizard = () => {
    setStep('paste');
    setPastedText('');
    setParsedRows([]);
    setDetectedColumns([]);
    setMapping({ category: '', budget: '', actual: '' });
    setError(null);
  };

  const handleClose = () => {
    resetWizard();
    onClose();
  };

  const parseClipboardText = useCallback((text: string) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      setError('Need at least a header row and one data row');
      return;
    }

    // Detect delimiter (tab or comma)
    const firstLine = lines[0];
    const delimiter = firstLine.includes('\t') ? '\t' : ',';
    
    const headers = firstLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter).map(v => v.trim().replace(/^["']|["']$/g, ''));
      if (values.length === headers.length && values.some(v => v)) {
        const row: Record<string, string> = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx] || '';
        });
        rows.push(row);
      }
    }

    if (rows.length === 0) {
      setError('No valid data rows found');
      return;
    }

    setDetectedColumns(headers);
    setParsedRows(rows);
    
    // Auto-detect column mappings
    const autoMapping: ColumnMapping = { category: '', budget: '', actual: '' };
    
    headers.forEach(header => {
      const lowerHeader = header.toLowerCase();
      for (const [field, aliases] of Object.entries(COMMON_COLUMN_NAMES)) {
        if (aliases.some(alias => lowerHeader.includes(alias))) {
          (autoMapping as any)[field] = header;
          break;
        }
      }
    });

    setMapping(autoMapping);
    setError(null);
    setStep('map');
  }, []);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setPastedText(text);
      parseClipboardText(text);
    } catch {
      setError('Could not read clipboard. Please paste manually in the text area.');
    }
  };

  const handleTextChange = (text: string) => {
    setPastedText(text);
    if (text.trim()) {
      parseClipboardText(text);
    }
  };

  const validateMapping = (): boolean => {
    if (!mapping.category || !mapping.budget || !mapping.actual) {
      setError('Please map Category, Budget, and Actual columns');
      return false;
    }
    setError(null);
    return true;
  };

  const handleProceedToPreview = () => {
    if (validateMapping()) {
      setStep('preview');
    }
  };

  const handleImport = () => {
    const rows: VarianceRow[] = parsedRows.map((row, index) => {
      const budget = parseFloat(row[mapping.budget]?.replace(/[$,]/g, '') || '0') || 0;
      const actual = parseFloat(row[mapping.actual]?.replace(/[$,]/g, '') || '0') || 0;
      const dollarVariance = actual - budget;
      const percentVariance = budget !== 0 ? (dollarVariance / budget) * 100 : 0;

      return {
        id: `imported-${index}-${Date.now()}`,
        category: row[mapping.category] || `Row ${index + 1}`,
        costCenter: mapping.costCenter ? row[mapping.costCenter] : undefined,
        glAccount: mapping.glAccount ? row[mapping.glAccount] : undefined,
        period: mapping.period ? row[mapping.period] : undefined,
        budget,
        actual,
        dollarVariance,
        percentVariance,
        isSignificant: false,
        isStarred: false,
        comments: [],
        status: 'new',
        owner: '',
        rootCause: '',
        dueDate: '',
        explanation: '',
      };
    });

    const data: ParsedData = {
      rows,
      columns: detectedColumns,
      hasCostCenter: !!mapping.costCenter,
      hasGLAccount: !!mapping.glAccount,
      hasPeriod: !!mapping.period,
      periods: mapping.period ? [...new Set(rows.map(r => r.period).filter(Boolean) as string[])] : [],
    };

    onImport(data);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-[#0F0F12] rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#1F1F23]">
          <div className="flex items-center gap-3">
            <Clipboard className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Paste from Spreadsheet</h2>
              <p className="text-xs text-gray-500">Copy data from Excel and paste here</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1F1F23]">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-[#1F1F23]/50 border-b border-gray-200 dark:border-[#1F1F23]">
          <div className="flex items-center gap-2">
            {['paste', 'map', 'preview'].map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s ? 'bg-blue-600 text-white' : 
                  ['paste', 'map', 'preview'].indexOf(step) > i ? 'bg-green-500 text-white' : 
                  'bg-gray-200 dark:bg-[#2A2A2E] text-gray-500'
                }`}>
                  {['paste', 'map', 'preview'].indexOf(step) > i ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`ml-2 text-sm ${step === s ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500'}`}>
                  {s === 'paste' ? 'Paste Data' : s === 'map' ? 'Map Columns' : 'Preview & Import'}
                </span>
                {i < 2 && <ArrowRight className="w-4 h-4 mx-3 text-gray-300" />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
            </div>
          )}

          {step === 'paste' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Copy data from Excel or any spreadsheet and paste it below. Include the header row.
              </p>
              
              <button
                onClick={handlePaste}
                className="w-full py-8 border-2 border-dashed border-gray-300 dark:border-[#2A2A2E] rounded-xl hover:border-blue-400 dark:hover:border-blue-600 transition-colors flex flex-col items-center gap-3"
              >
                <Clipboard className="w-8 h-8 text-gray-400" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Click to paste from clipboard</span>
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-[#1F1F23]"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-white dark:bg-[#0F0F12] text-sm text-gray-500">or paste manually</span>
                </div>
              </div>

              <textarea
                value={pastedText}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="Paste your data here (tab or comma separated)..."
                className="w-full h-48 p-4 text-sm font-mono bg-gray-50 dark:bg-[#1F1F23] border border-gray-200 dark:border-[#2A2A2E] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          )}

          {step === 'map' && (
            <div className="space-y-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Map your columns to our fields. We've auto-detected some based on column names.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {/* Required fields */}
                <div className="col-span-2">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Required Fields</h3>
                </div>
                
                {(['category', 'budget', 'actual'] as const).map(field => (
                  <div key={field} className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">
                      {field} <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={mapping[field]}
                      onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-[#1F1F23] border border-gray-200 dark:border-[#2A2A2E] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Select column --</option>
                      {detectedColumns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                ))}

                {/* Optional fields */}
                <div className="col-span-2 mt-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Optional Fields</h3>
                </div>
                
                {(['costCenter', 'glAccount', 'period'] as const).map(field => (
                  <div key={field} className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                      {field === 'costCenter' ? 'Cost Center' : field === 'glAccount' ? 'GL Account' : 'Period'}
                    </label>
                    <select
                      value={mapping[field] || ''}
                      onChange={(e) => setMapping({ ...mapping, [field]: e.target.value || undefined })}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-[#1F1F23] border border-gray-200 dark:border-[#2A2A2E] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Not mapped --</option>
                      {detectedColumns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Sample data preview */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sample Data (first 3 rows)</h3>
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-[#1F1F23]">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-[#1F1F23]">
                      <tr>
                        {detectedColumns.slice(0, 6).map(col => (
                          <th key={col} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-[#1F1F23]">
                      {parsedRows.slice(0, 3).map((row, i) => (
                        <tr key={i}>
                          {detectedColumns.slice(0, 6).map(col => (
                            <td key={col} className="px-3 py-2 text-gray-600 dark:text-gray-400">{row[col]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ready to import {parsedRows.length} rows
                </p>
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                  All columns mapped
                </span>
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-[#1F1F23]">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-[#1F1F23]">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Budget</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actual</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Variance</th>
                      {mapping.costCenter && <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cost Center</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#1F1F23]">
                    {parsedRows.slice(0, 10).map((row, i) => {
                      const budget = parseFloat(row[mapping.budget]?.replace(/[$,]/g, '') || '0') || 0;
                      const actual = parseFloat(row[mapping.actual]?.replace(/[$,]/g, '') || '0') || 0;
                      const variance = actual - budget;
                      return (
                        <tr key={i}>
                          <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{row[mapping.category]}</td>
                          <td className="px-3 py-2 text-right font-mono">${budget.toLocaleString()}</td>
                          <td className="px-3 py-2 text-right font-mono">${actual.toLocaleString()}</td>
                          <td className={`px-3 py-2 text-right font-mono font-medium ${variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {variance >= 0 ? '+' : ''}${variance.toLocaleString()}
                          </td>
                          {mapping.costCenter && <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{row[mapping.costCenter]}</td>}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {parsedRows.length > 10 && (
                <p className="text-xs text-gray-500 text-center">Showing 10 of {parsedRows.length} rows</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-[#1F1F23] bg-gray-50 dark:bg-[#1F1F23]/50">
          <button
            onClick={() => step === 'paste' ? handleClose() : setStep(step === 'preview' ? 'map' : 'paste')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2A2A2E] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {step === 'paste' ? 'Cancel' : 'Back'}
          </button>

          {step === 'paste' && (
            <button
              onClick={() => pastedText && parseClipboardText(pastedText)}
              disabled={!pastedText}
              className="btn-primary disabled:opacity-50"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          )}

          {step === 'map' && (
            <button onClick={handleProceedToPreview} className="btn-primary">
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          )}

          {step === 'preview' && (
            <button onClick={handleImport} className="btn-primary">
              <Check className="w-4 h-4 mr-2" />
              Import {parsedRows.length} Rows
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

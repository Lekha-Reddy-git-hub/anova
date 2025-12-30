import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { VarianceRow, ParsedData } from '../types';
import { generateId } from './helpers';

export const parseFile = async (file: File): Promise<ParsedData> => {
  const ext = file.name.split('.').pop()?.toLowerCase();
  
  if (ext === 'csv') {
    return parseCSV(file);
  } else if (ext === 'xlsx' || ext === 'xls') {
    return parseExcel(file);
  }
  throw new Error('Unsupported file type. Please upload CSV or Excel files.');
};

const parseCSV = (file: File): Promise<ParsedData> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = processRawData(results.data as Record<string, unknown>[], results.meta.fields || []);
          resolve(data);
        } catch (err) {
          reject(err);
        }
      },
      error: (err) => reject(err),
    });
  });
};

const parseExcel = async (file: File): Promise<ParsedData> => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
  
  if (data.length < 2) throw new Error('File must have header and data rows');
  
  const headers = (data[0] as string[]).map(h => String(h || ''));
  const rawData = data.slice(1).map(row => {
    const obj: Record<string, unknown> = {};
    headers.forEach((h, i) => { obj[h] = (row as unknown[])[i]; });
    return obj;
  });
  
  return processRawData(rawData, headers);
};

const findColumn = (headers: string[], options: string[]): string | null => {
  const lower = headers.map(h => h.toLowerCase());
  for (const opt of options) {
    const idx = lower.findIndex(h => h.includes(opt.toLowerCase()));
    if (idx !== -1) return headers[idx];
  }
  return null;
};

const parseNumber = (val: unknown): number => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const cleaned = val.replace(/[$,()]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : (val.includes('(') ? -Math.abs(num) : num);
  }
  return 0;
};

const processRawData = (rawData: Record<string, unknown>[], headers: string[]): ParsedData => {
  const categoryCol = findColumn(headers, ['category', 'description', 'name', 'item']);
  const budgetCol = findColumn(headers, ['budget', 'budgeted', 'planned']);
  const actualCol = findColumn(headers, ['actual', 'actuals', 'spent']);
  const costCenterCol = findColumn(headers, ['cost center', 'costcenter', 'department']);
  const glAccountCol = findColumn(headers, ['gl account', 'glaccount', 'account']);
  const periodCol = findColumn(headers, ['period', 'month', 'date']);

  if (!categoryCol || !budgetCol || !actualCol) {
    throw new Error('Missing required columns: Category, Budget, Actual');
  }

  const periods = new Set<string>();
  const rows: VarianceRow[] = rawData
    .filter(row => row[categoryCol])
    .map(row => {
      const budget = parseNumber(row[budgetCol!]);
      const actual = parseNumber(row[actualCol!]);
      const dollarVariance = actual - budget;
      const percentVariance = budget !== 0 ? ((actual - budget) / budget) * 100 : 0;
      const period = periodCol ? String(row[periodCol] || '') : undefined;
      if (period) periods.add(period);

      return {
        id: generateId(),
        category: String(row[categoryCol!]),
        costCenter: costCenterCol ? String(row[costCenterCol] || '') : undefined,
        glAccount: glAccountCol ? String(row[glAccountCol] || '') : undefined,
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
      };
    });

  return {
    rows,
    columns: headers,
    hasCostCenter: !!costCenterCol,
    hasGLAccount: !!glAccountCol,
    hasPeriod: !!periodCol,
    periods: Array.from(periods).sort(),
  };
};

export const isExcelFile = (file: File): boolean => {
  const ext = file.name.split('.').pop()?.toLowerCase();
  return ext === 'xlsx' || ext === 'xls';
};

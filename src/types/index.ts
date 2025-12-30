export type VarianceStatus = 'new' | 'investigating' | 'explained' | 'closed';
export type RootCause = 'timing' | 'volume' | 'price' | 'mix' | 'one-time' | 'fx' | 'other' | '';

export interface VarianceRow {
  id: string;
  category: string;
  costCenter?: string;
  glAccount?: string;
  period?: string;
  budget: number;
  actual: number;
  dollarVariance: number;
  percentVariance: number;
  isSignificant: boolean;
  isStarred: boolean;
  comments: Comment[];
  // New fields for workflow
  status: VarianceStatus;
  owner: string;
  rootCause: RootCause;
  dueDate: string;
  explanation: string;
}

export interface Comment {
  id: string;
  text: string;
  author: string;
  timestamp: Date;
}

export interface ParsedData {
  rows: VarianceRow[];
  columns: string[];
  hasCostCenter: boolean;
  hasGLAccount: boolean;
  hasPeriod: boolean;
  periods: string[];
}

export interface Project {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  data: ParsedData;
  settings: ProjectSettings;
  chatHistory: ChatMessage[];
}

export interface ProjectSettings {
  varianceThresholdPercent: number;
  varianceThresholdDollar: number;
  groupBy: GroupByOption;
  viewMode: ViewMode;
}

export type GroupByOption = 'none' | 'costCenter' | 'glAccount';
export type ViewMode = 'full' | 'monthly' | 'quarterly' | 'yearly';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface GroupedData {
  key: string;
  label: string;
  rows: VarianceRow[];
  totalBudget: number;
  totalActual: number;
  totalDollarVariance: number;
  totalPercentVariance: number;
  isExpanded: boolean;
}

export interface FilterState {
  search: string;
  costCenters: string[];
  glAccounts: string[];
  periods: string[];
  showOnlySignificant: boolean;
  showOnlyStarred: boolean;
  statuses: VarianceStatus[];
  owners: string[];
}

export interface ColumnMapping {
  category: string;
  budget: string;
  actual: string;
  costCenter?: string;
  glAccount?: string;
  period?: string;
}

export interface KPIData {
  totalVariances: number;
  explainedCount: number;
  explainedPercent: number;
  overdueCount: number;
  byStatus: { status: VarianceStatus; count: number }[];
  byRootCause: { cause: RootCause; count: number; amount: number }[];
  topOverspends: VarianceRow[];
  topSavings: VarianceRow[];
  runRateProjection: number;
  annualBudget: number;
  ytdActual: number;
  projectedVariance: number;
}

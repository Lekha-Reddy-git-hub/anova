import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Search,
  Target,
  Calendar,
  Users
} from 'lucide-react';
import { VarianceRow, KPIData, VarianceStatus, RootCause } from '../types';
import { formatCurrency, formatPercent } from '../utils/helpers';

interface KPIDashboardProps {
  data: VarianceRow[];
  monthsElapsed?: number; // How many months into the year (for run-rate)
}

const STATUS_LABELS: Record<VarianceStatus, string> = {
  new: 'New',
  investigating: 'Investigating',
  explained: 'Explained',
  closed: 'Closed',
};

const STATUS_COLORS: Record<VarianceStatus, string> = {
  new: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  investigating: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  explained: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  closed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const ROOT_CAUSE_LABELS: Record<RootCause, string> = {
  timing: 'Timing',
  volume: 'Volume',
  price: 'Price',
  mix: 'Mix',
  'one-time': 'One-time',
  fx: 'FX',
  other: 'Other',
  '': 'Untagged',
};

export default function KPIDashboard({ data, monthsElapsed = new Date().getMonth() + 1 }: KPIDashboardProps) {
  // Calculate KPIs
  const calculateKPIs = (): KPIData => {
    const totalVariances = data.length;
    const explainedCount = data.filter(r => r.status === 'explained' || r.status === 'closed').length;
    const explainedPercent = totalVariances > 0 ? (explainedCount / totalVariances) * 100 : 0;
    
    const today = new Date();
    const overdueCount = data.filter(r => {
      if (!r.dueDate || r.status === 'closed' || r.status === 'explained') return false;
      return new Date(r.dueDate) < today;
    }).length;

    // Status breakdown
    const byStatus = (['new', 'investigating', 'explained', 'closed'] as VarianceStatus[]).map(status => ({
      status,
      count: data.filter(r => r.status === status).length,
    }));

    // Root cause breakdown
    const rootCauses: RootCause[] = ['timing', 'volume', 'price', 'mix', 'one-time', 'fx', 'other', ''];
    const byRootCause = rootCauses.map(cause => ({
      cause,
      count: data.filter(r => r.rootCause === cause).length,
      amount: data.filter(r => r.rootCause === cause).reduce((sum, r) => sum + Math.abs(r.dollarVariance), 0),
    })).filter(c => c.count > 0);

    // Top overspends and savings
    const topOverspends = [...data].filter(r => r.dollarVariance > 0).sort((a, b) => b.dollarVariance - a.dollarVariance).slice(0, 5);
    const topSavings = [...data].filter(r => r.dollarVariance < 0).sort((a, b) => a.dollarVariance - b.dollarVariance).slice(0, 5);

    // Run-rate projection
    const annualBudget = data.reduce((sum, r) => sum + r.budget, 0);
    const ytdActual = data.reduce((sum, r) => sum + r.actual, 0);
    const monthlyRunRate = monthsElapsed > 0 ? ytdActual / monthsElapsed : 0;
    const runRateProjection = monthlyRunRate * 12;
    const projectedVariance = runRateProjection - annualBudget;

    return {
      totalVariances,
      explainedCount,
      explainedPercent,
      overdueCount,
      byStatus,
      byRootCause,
      topOverspends,
      topSavings,
      runRateProjection,
      annualBudget,
      ytdActual,
      projectedVariance,
    };
  };

  const kpis = calculateKPIs();

  return (
    <div className="space-y-4">
      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Explained % */}
        <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-4 border border-gray-200 dark:border-[#1F1F23]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Explained</span>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {kpis.explainedPercent.toFixed(0)}%
          </div>
          <div className="mt-2 h-2 bg-gray-100 dark:bg-[#1F1F23] rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${kpis.explainedPercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{kpis.explainedCount} of {kpis.totalVariances}</p>
        </div>

        {/* Overdue */}
        <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-4 border border-gray-200 dark:border-[#1F1F23]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Overdue</span>
            <Clock className={`w-4 h-4 ${kpis.overdueCount > 0 ? 'text-red-500' : 'text-gray-400'}`} />
          </div>
          <div className={`text-2xl font-bold ${kpis.overdueCount > 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
            {kpis.overdueCount}
          </div>
          <p className="text-xs text-gray-500 mt-1">explanations pending</p>
        </div>

        {/* Run-rate Projection */}
        <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-4 border border-gray-200 dark:border-[#1F1F23]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Year-End Projection</span>
            <Target className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(kpis.runRateProjection)}
          </div>
          <p className="text-xs mt-1">
            <span className={kpis.projectedVariance > 0 ? 'text-red-600' : 'text-green-600'}>
              {kpis.projectedVariance >= 0 ? '+' : ''}{formatCurrency(kpis.projectedVariance)}
            </span>
            <span className="text-gray-500 ml-1">vs budget</span>
          </p>
        </div>

        {/* Significant Items */}
        <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-4 border border-gray-200 dark:border-[#1F1F23]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Significant</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {data.filter(r => r.isSignificant).length}
          </div>
          <p className="text-xs text-gray-500 mt-1">items flagged</p>
        </div>
      </div>

      {/* Status & Root Cause Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* By Status */}
        <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-4 border border-gray-200 dark:border-[#1F1F23]">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Search className="w-4 h-4" />
            By Status
          </h3>
          <div className="space-y-2">
            {kpis.byStatus.map(({ status, count }) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[status]}`}>
                    {STATUS_LABELS[status]}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-100 dark:bg-[#1F1F23] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${kpis.totalVariances > 0 ? (count / kpis.totalVariances) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Root Cause */}
        <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-4 border border-gray-200 dark:border-[#1F1F23]">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            By Root Cause
          </h3>
          <div className="space-y-2">
            {kpis.byRootCause.slice(0, 5).map(({ cause, count, amount }) => (
              <div key={cause || 'untagged'} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{ROOT_CAUSE_LABELS[cause]}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">{formatCurrency(amount)}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Variances */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Overspends */}
        <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-4 border border-gray-200 dark:border-[#1F1F23]">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-red-500" />
            Top Overspends
          </h3>
          <div className="space-y-2">
            {kpis.topOverspends.length === 0 ? (
              <p className="text-sm text-gray-500">No overspends</p>
            ) : (
              kpis.topOverspends.map((row) => (
                <div key={row.id} className="flex items-center justify-between py-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1 mr-2">{row.category}</span>
                  <span className="text-sm font-medium text-red-600">+{formatCurrency(row.dollarVariance)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Savings */}
        <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-4 border border-gray-200 dark:border-[#1F1F23]">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-green-500" />
            Top Savings
          </h3>
          <div className="space-y-2">
            {kpis.topSavings.length === 0 ? (
              <p className="text-sm text-gray-500">No savings</p>
            ) : (
              kpis.topSavings.map((row) => (
                <div key={row.id} className="flex items-center justify-between py-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1 mr-2">{row.category}</span>
                  <span className="text-sm font-medium text-green-600">{formatCurrency(row.dollarVariance)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

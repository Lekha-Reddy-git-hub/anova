import { VarianceRow, GroupedData, FilterState } from '../types';

// Generate unique ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

// Format currency
export const formatCurrency = (value: number, compact?: boolean): string => {
  if (compact) {
    const absValue = Math.abs(value);
    if (absValue >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (absValue >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Format percentage
export const formatPercent = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
};

// Format large numbers
export const formatCompact = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(value);
};

// Calculate summary statistics
export const calculateSummary = (rows: VarianceRow[]) => {
  const totalBudget = rows.reduce((sum, r) => sum + r.budget, 0);
  const totalActual = rows.reduce((sum, r) => sum + r.actual, 0);
  const totalDollarVariance = totalActual - totalBudget;
  const totalPercentVariance = totalBudget !== 0 
    ? ((totalActual - totalBudget) / totalBudget) * 100 
    : 0;
  
  return {
    totalBudget,
    totalActual,
    totalDollarVariance,
    totalPercentVariance,
    significantCount: rows.filter(r => r.isSignificant).length,
    overBudgetCount: rows.filter(r => r.dollarVariance > 0).length,
    underBudgetCount: rows.filter(r => r.dollarVariance < 0).length,
  };
};

// Group data by specified key
export const groupData = (
  rows: VarianceRow[],
  groupBy: 'costCenter' | 'glAccount'
): GroupedData[] => {
  const groups = new Map<string, VarianceRow[]>();
  
  rows.forEach(row => {
    const key = groupBy === 'costCenter' 
      ? row.costCenter || 'Unassigned'
      : row.glAccount || 'Unassigned';
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(row);
  });
  
  return Array.from(groups.entries()).map(([key, groupRows]) => {
    const totalBudget = groupRows.reduce((sum, r) => sum + r.budget, 0);
    const totalActual = groupRows.reduce((sum, r) => sum + r.actual, 0);
    const totalDollarVariance = totalActual - totalBudget;
    const totalPercentVariance = totalBudget !== 0 
      ? ((totalActual - totalBudget) / totalBudget) * 100 
      : 0;
    
    return {
      key,
      label: key,
      rows: groupRows,
      totalBudget,
      totalActual,
      totalDollarVariance,
      totalPercentVariance,
      isExpanded: false,
    };
  }).sort((a, b) => Math.abs(b.totalDollarVariance) - Math.abs(a.totalDollarVariance));
};

// Filter data
export const filterData = (rows: VarianceRow[], filters: FilterState): VarianceRow[] => {
  return rows.filter(row => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const text = [row.category, row.costCenter, row.glAccount, row.owner, row.explanation].filter(Boolean).join(' ').toLowerCase();
      if (!text.includes(searchLower)) return false;
    }
    if (filters.costCenters.length > 0 && row.costCenter && !filters.costCenters.includes(row.costCenter)) return false;
    if (filters.glAccounts.length > 0 && row.glAccount && !filters.glAccounts.includes(row.glAccount)) return false;
    if (filters.periods.length > 0 && row.period && !filters.periods.includes(row.period)) return false;
    if (filters.statuses && filters.statuses.length > 0 && !filters.statuses.includes(row.status)) return false;
    if (filters.owners && filters.owners.length > 0 && !filters.owners.includes(row.owner)) return false;
    if (filters.showOnlySignificant && !row.isSignificant) return false;
    if (filters.showOnlyStarred && !row.isStarred) return false;
    return true;
  });
};

// Recalculate significant items based on thresholds
export const applyThresholds = (rows: VarianceRow[], thresholdPercent: number, thresholdDollar: number): VarianceRow[] => {
  return rows.map(row => ({
    ...row,
    isSignificant: Math.abs(row.percentVariance) > thresholdPercent || Math.abs(row.dollarVariance) > thresholdDollar,
  }));
};

// Get top variances
export const getTopVariances = (rows: VarianceRow[], count = 5) => {
  const sorted = [...rows].sort((a, b) => b.dollarVariance - a.dollarVariance);
  return {
    positive: sorted.filter(r => r.dollarVariance > 0).slice(0, count),
    negative: sorted.filter(r => r.dollarVariance < 0).sort((a, b) => a.dollarVariance - b.dollarVariance).slice(0, count),
  };
};

// Prepare bar chart data
export const prepareBarChartData = (rows: VarianceRow[], limit = 10) => {
  return [...rows]
    .sort((a, b) => Math.abs(b.dollarVariance) - Math.abs(a.dollarVariance))
    .slice(0, limit)
    .map(row => ({
      name: row.category.length > 15 ? row.category.substring(0, 12) + '...' : row.category,
      fullName: row.category,
      variance: row.dollarVariance,
      fill: row.dollarVariance > 0 ? '#ef4444' : '#10b981',
    }));
};

// Export starred items and comments
export const exportAnalysis = (rows: VarianceRow[]) => {
  const starred = rows.filter(r => r.isStarred);
  const withComments = rows.filter(r => r.comments && r.comments.length > 0);
  const summary = calculateSummary(rows);
  
  let content = `ANOVA - VARIANCE ANALYSIS EXPORT\n`;
  content += `Generated: ${new Date().toLocaleString()}\n`;
  content += `${'='.repeat(50)}\n\n`;
  
  // Summary
  content += `EXECUTIVE SUMMARY\n`;
  content += `${'-'.repeat(30)}\n`;
  content += `Total Budget: ${formatCurrency(summary.totalBudget)}\n`;
  content += `Total Actual: ${formatCurrency(summary.totalActual)}\n`;
  content += `Net Variance: ${formatCurrency(summary.totalDollarVariance)} (${formatPercent(summary.totalPercentVariance)})\n`;
  content += `Significant Items: ${summary.significantCount}\n\n`;
  
  // Starred Items
  content += `STARRED ITEMS (${starred.length})\n`;
  content += `${'-'.repeat(30)}\n`;
  if (starred.length === 0) {
    content += `No starred items.\n\n`;
  } else {
    starred.forEach((item, i) => {
      content += `${i + 1}. ${item.category}\n`;
      content += `   Cost Center: ${item.costCenter || 'N/A'}\n`;
      content += `   GL Account: ${item.glAccount || 'N/A'}\n`;
      content += `   Budget: ${formatCurrency(item.budget)} | Actual: ${formatCurrency(item.actual)}\n`;
      content += `   Variance: ${formatCurrency(item.dollarVariance)} (${formatPercent(item.percentVariance)})\n`;
      if (item.comments && item.comments.length > 0) {
        content += `   Comments:\n`;
        item.comments.forEach(c => {
          content += `     - ${c.text} (${c.author}, ${new Date(c.timestamp).toLocaleDateString()})\n`;
        });
      }
      content += `\n`;
    });
  }
  
  // Items with Comments
  const commentedNotStarred = withComments.filter(r => !r.isStarred);
  if (commentedNotStarred.length > 0) {
    content += `OTHER ITEMS WITH COMMENTS (${commentedNotStarred.length})\n`;
    content += `${'-'.repeat(30)}\n`;
    commentedNotStarred.forEach((item, i) => {
      content += `${i + 1}. ${item.category} (${item.costCenter || 'N/A'})\n`;
      content += `   Variance: ${formatCurrency(item.dollarVariance)}\n`;
      item.comments.forEach(c => {
        content += `   - ${c.text}\n`;
      });
      content += `\n`;
    });
  }
  
  // Download
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `variance-analysis-${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

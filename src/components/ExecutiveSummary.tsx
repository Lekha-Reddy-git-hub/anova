import { useState } from 'react';
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Loader2, Wand2, Copy, Check } from 'lucide-react';
import { VarianceRow } from '../types';
import { calculateSummary, formatCurrency, formatPercent } from '../utils/helpers';
import { getApiKey, generateNarrative } from '../utils/gemini';

interface ExecutiveSummaryProps {
  data: VarianceRow[];
}

export default function ExecutiveSummary({ data }: ExecutiveSummaryProps) {
  const [aiNarrative, setAiNarrative] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const summary = calculateSummary(data);
  const hasApiKey = !!getApiKey();
  
  const insights: { type: 'positive' | 'negative' | 'warning' | 'info'; text: string }[] = [];
  
  if (summary.totalDollarVariance > 0) {
    insights.push({
      type: 'negative',
      text: `Overall spending is ${formatCurrency(summary.totalDollarVariance)} (${formatPercent(summary.totalPercentVariance)}) over budget`,
    });
  } else {
    insights.push({
      type: 'positive',
      text: `Overall spending is ${formatCurrency(Math.abs(summary.totalDollarVariance))} (${formatPercent(Math.abs(summary.totalPercentVariance))}) under budget`,
    });
  }
  
  if (summary.significantCount > 0) {
    const pct = ((summary.significantCount / data.length) * 100).toFixed(0);
    insights.push({
      type: 'warning',
      text: `${summary.significantCount} items (${pct}%) flagged as significant variances`,
    });
  } else {
    insights.push({
      type: 'positive',
      text: `No significant variances detected`,
    });
  }
  
  const overBudget = data.filter(r => r.dollarVariance > 0).sort((a, b) => b.dollarVariance - a.dollarVariance);
  if (overBudget.length > 0) {
    const top = overBudget[0];
    insights.push({
      type: 'info',
      text: `Largest overspend: ${top.category} at +${formatCurrency(top.dollarVariance)}`,
    });
  }
  
  const underBudget = data.filter(r => r.dollarVariance < 0).sort((a, b) => a.dollarVariance - b.dollarVariance);
  if (underBudget.length > 0) {
    const top = underBudget[0];
    insights.push({
      type: 'positive',
      text: `Largest savings: ${top.category} at ${formatCurrency(top.dollarVariance)}`,
    });
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'positive': return CheckCircle;
      case 'negative': return TrendingUp;
      case 'warning': return AlertTriangle;
      default: return TrendingDown;
    }
  };

  const getColors = (type: string) => {
    switch (type) {
      case 'positive': return { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400' };
      case 'negative': return { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400' };
      case 'warning': return { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400' };
      default: return { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' };
    }
  };

  const buildDataContext = (): string => {
    const costCenterTotals = new Map<string, { budget: number; actual: number; variance: number }>();
    data.forEach(r => {
      if (r.costCenter) {
        const existing = costCenterTotals.get(r.costCenter) || { budget: 0, actual: 0, variance: 0 };
        costCenterTotals.set(r.costCenter, {
          budget: existing.budget + r.budget,
          actual: existing.actual + r.actual,
          variance: existing.variance + r.dollarVariance,
        });
      }
    });

    return `
SUMMARY:
- Total Budget: ${formatCurrency(summary.totalBudget)}
- Total Actual: ${formatCurrency(summary.totalActual)}  
- Net Variance: ${formatCurrency(summary.totalDollarVariance)} (${formatPercent(summary.totalPercentVariance)})
- Items Over Budget: ${summary.overBudgetCount} of ${data.length}
- Significant Items: ${summary.significantCount}

TOP OVERSPENDS:
${overBudget.slice(0, 5).map((r, i) => `${i + 1}. ${r.category} (${r.costCenter || 'N/A'}): +${formatCurrency(r.dollarVariance)} (${formatPercent(r.percentVariance)})`).join('\n')}

TOP UNDERSPENDS:
${underBudget.slice(0, 5).map((r, i) => `${i + 1}. ${r.category} (${r.costCenter || 'N/A'}): ${formatCurrency(r.dollarVariance)} (${formatPercent(r.percentVariance)})`).join('\n')}

COST CENTER BREAKDOWN:
${Array.from(costCenterTotals.entries()).map(([cc, t]) => `- ${cc}: Variance ${formatCurrency(t.variance)} (${t.variance > 0 ? 'over' : 'under'})`).join('\n')}
`;
  };

  const handleGenerateNarrative = async () => {
    if (!hasApiKey) {
      setError('Please add your Gemini API key in the AI chat settings first.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const context = buildDataContext();
      const narrative = await generateNarrative(context);
      setAiNarrative(narrative);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate narrative');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (aiNarrative) {
      navigator.clipboard.writeText(aiNarrative);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-4 sm:p-5 border border-gray-200 dark:border-[#1F1F23]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Executive Summary</h2>
        </div>
        <button
          onClick={handleGenerateNarrative}
          disabled={isGenerating}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors disabled:opacity-50"
        >
          {isGenerating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Wand2 className="w-3.5 h-3.5" />
          )}
          {aiNarrative ? 'Regenerate' : 'Write Summary'}
        </button>
      </div>
      
      {/* Quick Insights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {insights.map((insight, index) => {
          const Icon = getIcon(insight.type);
          const colors = getColors(insight.type);
          return (
            <div key={index} className={`flex items-start gap-3 p-3 rounded-lg ${colors.bg}`}>
              <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${colors.text}`} />
              <p className="text-sm text-gray-700 dark:text-gray-300">{insight.text}</p>
            </div>
          );
        })}
      </div>

      {/* AI Generated Narrative */}
      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {aiNarrative && (
        <div className="mt-4 p-4 rounded-lg bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-medium text-purple-700 dark:text-purple-400">AI-Generated Narrative</span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 text-xs text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded transition-colors"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
            {aiNarrative}
          </p>
        </div>
      )}

      {!aiNarrative && !error && hasApiKey && (
        <p className="mt-3 text-xs text-center text-gray-500">
          Click "Write Summary" to generate an AI-powered executive narrative
        </p>
      )}

      {!hasApiKey && (
        <p className="mt-3 text-xs text-center text-gray-500">
          💡 Add your Gemini API key in the AI chat to enable narrative generation
        </p>
      )}
    </div>
  );
}

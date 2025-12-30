import { TrendingUp, TrendingDown, AlertTriangle, DollarSign } from 'lucide-react';
import { VarianceRow } from '../types';
import { calculateSummary, formatCompact } from '../utils/helpers';

interface SummaryCardsProps {
  data: VarianceRow[];
}

export default function SummaryCards({ data }: SummaryCardsProps) {
  const summary = calculateSummary(data);
  const isOverBudget = summary.totalDollarVariance > 0;

  const cards = [
    { 
      title: 'Total Budget', 
      value: formatCompact(summary.totalBudget), 
      icon: DollarSign,
      changeType: 'neutral' as const,
    },
    { 
      title: 'Total Actual', 
      value: formatCompact(summary.totalActual), 
      icon: DollarSign,
      changeType: 'neutral' as const,
    },
    { 
      title: 'Net Variance', 
      value: `${isOverBudget ? '+' : ''}${formatCompact(summary.totalDollarVariance)}`,
      change: `${summary.totalPercentVariance >= 0 ? '+' : ''}${summary.totalPercentVariance.toFixed(1)}%`,
      icon: isOverBudget ? TrendingUp : TrendingDown, 
      changeType: isOverBudget ? 'increase' as const : 'decrease' as const,
    },
    { 
      title: 'Significant Items', 
      value: summary.significantCount.toString(), 
      change: `of ${data.length}`,
      icon: AlertTriangle, 
      changeType: summary.significantCount > 0 ? 'warning' as const : 'neutral' as const,
    },
  ];

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-white dark:bg-[#0F0F12] rounded-xl p-4 sm:p-5 border border-gray-200 dark:border-[#1F1F23] hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">{card.title}</span>
            <card.icon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="space-y-1">
            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{card.value}</div>
            {card.change && (
              <div className="flex items-center text-xs">
                {card.changeType === 'increase' && <TrendingUp className="w-3 h-3 text-red-500 mr-1" />}
                {card.changeType === 'decrease' && <TrendingDown className="w-3 h-3 text-green-500 mr-1" />}
                <span className={`font-medium ${
                  card.changeType === 'increase' ? 'text-red-600' : 
                  card.changeType === 'decrease' ? 'text-green-600' : 
                  card.changeType === 'warning' ? 'text-amber-600' :
                  'text-gray-500 dark:text-gray-400'
                }`}>
                  {card.change}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

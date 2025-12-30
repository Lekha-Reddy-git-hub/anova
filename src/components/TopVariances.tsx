import { TrendingUp, TrendingDown } from 'lucide-react';
import { VarianceRow } from '../types';
import { getTopVariances, formatCurrency, formatPercent } from '../utils/helpers';

interface TopVariancesProps {
  data: VarianceRow[];
}

export default function TopVariances({ data }: TopVariancesProps) {
  const { positive, negative } = getTopVariances(data, 3);

  if (positive.length === 0 && negative.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30">
            <TrendingUp className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Top Overspends</h3>
        </div>
        {positive.length === 0 ? (
          <p className="text-sm text-gray-500">No items over budget</p>
        ) : (
          <div className="space-y-2">
            {positive.map((item, i) => (
              <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-red-50 dark:bg-red-900/10">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-red-600">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.category}</p>
                    {item.costCenter && <p className="text-xs text-gray-500">{item.costCenter}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-600">+{formatCurrency(item.dollarVariance)}</p>
                  <p className="text-xs text-red-500">{formatPercent(item.percentVariance)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
            <TrendingDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Top Underspends</h3>
        </div>
        {negative.length === 0 ? (
          <p className="text-sm text-gray-500">No items under budget</p>
        ) : (
          <div className="space-y-2">
            {negative.map((item, i) => (
              <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/10">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-emerald-600">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.category}</p>
                    {item.costCenter && <p className="text-xs text-gray-500">{item.costCenter}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-600">{formatCurrency(item.dollarVariance)}</p>
                  <p className="text-xs text-emerald-500">{formatPercent(item.percentVariance)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

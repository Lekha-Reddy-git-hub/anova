import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { VarianceRow } from '../types';
import { prepareBarChartData } from '../utils/helpers';

interface VarianceChartsProps {
  data: VarianceRow[];
}

export default function VarianceCharts({ data }: VarianceChartsProps) {
  const chartData = prepareBarChartData(data, 10);

  const formatTooltip = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="card p-4">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Top 10 Variances</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
            <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} tick={{ fill: '#64748b', fontSize: 12 }} />
            <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#64748b', fontSize: 12 }} />
            <Tooltip formatter={(value: number) => formatTooltip(value)} />
            <ReferenceLine x={0} stroke="#94a3b8" />
            <Bar dataKey="variance" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-red-500" /><span className="text-gray-600 dark:text-gray-400">Over Budget</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-500" /><span className="text-gray-600 dark:text-gray-400">Under Budget</span></div>
      </div>
    </div>
  );
}

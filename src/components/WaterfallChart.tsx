import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { VarianceRow } from '../types';
import { formatCurrency } from '../utils/helpers';

interface WaterfallChartProps {
  data: VarianceRow[];
  maxItems?: number;
}

interface WaterfallDataPoint {
  name: string;
  value: number;
  start: number;
  end: number;
  isTotal: boolean;
  isPositive: boolean;
}

export default function WaterfallChart({ data, maxItems = 8 }: WaterfallChartProps) {
  const waterfallData = useMemo(() => {
    // Calculate totals
    const totalBudget = data.reduce((sum, row) => sum + row.budget, 0);
    const totalActual = data.reduce((sum, row) => sum + row.actual, 0);
    
    // Sort by absolute variance and take top items
    const sortedByVariance = [...data]
      .sort((a, b) => Math.abs(b.dollarVariance) - Math.abs(a.dollarVariance))
      .slice(0, maxItems);
    
    // Calculate "Other" variance if we have more items
    const topItemsVariance = sortedByVariance.reduce((sum, row) => sum + row.dollarVariance, 0);
    const otherVariance = (totalActual - totalBudget) - topItemsVariance;
    
    // Build waterfall data
    const result: WaterfallDataPoint[] = [];
    let runningTotal = totalBudget;
    
    // Start with Budget
    result.push({
      name: 'Budget',
      value: totalBudget,
      start: 0,
      end: totalBudget,
      isTotal: true,
      isPositive: true,
    });
    
    // Add each variance
    sortedByVariance.forEach((row) => {
      const start = runningTotal;
      runningTotal += row.dollarVariance;
      result.push({
        name: row.category.length > 12 ? row.category.substring(0, 12) + '...' : row.category,
        value: row.dollarVariance,
        start: Math.min(start, runningTotal),
        end: Math.max(start, runningTotal),
        isTotal: false,
        isPositive: row.dollarVariance <= 0, // Under budget is positive (green)
      });
    });
    
    // Add "Other" if significant
    if (Math.abs(otherVariance) > 100) {
      const start = runningTotal;
      runningTotal += otherVariance;
      result.push({
        name: 'Other',
        value: otherVariance,
        start: Math.min(start, runningTotal),
        end: Math.max(start, runningTotal),
        isTotal: false,
        isPositive: otherVariance <= 0,
      });
    }
    
    // End with Actual
    result.push({
      name: 'Actual',
      value: totalActual,
      start: 0,
      end: totalActual,
      isTotal: true,
      isPositive: totalActual <= totalBudget,
    });
    
    return result;
  }, [data, maxItems]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as WaterfallDataPoint;
      return (
        <div className="bg-white dark:bg-[#1F1F23] p-3 rounded-lg shadow-lg border border-gray-200 dark:border-[#2A2A2E]">
          <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
          <p className={`text-sm ${item.isTotal ? 'text-gray-600 dark:text-gray-400' : item.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
            {item.isTotal ? formatCurrency(item.value) : (item.value >= 0 ? '+' : '') + formatCurrency(item.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-[#0F0F12] rounded-xl border border-gray-200 dark:border-[#1F1F23] p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Budget to Actual Bridge</h3>
        <p className="text-gray-500 text-center py-8">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#0F0F12] rounded-xl border border-gray-200 dark:border-[#1F1F23] p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Budget to Actual Bridge</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">How we got from budget to actual</p>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={waterfallData}
            margin={{ top: 20, right: 20, left: 20, bottom: 60 }}
          >
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 11, fill: '#6b7280' }}
              angle={-45}
              textAnchor="end"
              height={60}
              interval={0}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickFormatter={(value) => formatCurrency(value, true)}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#e5e7eb" />
            
            {/* Invisible bar for positioning */}
            <Bar dataKey="start" stackId="stack" fill="transparent" />
            
            {/* Visible bar */}
            <Bar 
              dataKey={(entry: WaterfallDataPoint) => entry.end - entry.start} 
              stackId="stack"
              radius={[4, 4, 0, 0]}
            >
              {waterfallData.map((entry, index) => (
                <Cell 
                  key={index}
                  fill={
                    entry.isTotal 
                      ? '#1e40af' // Blue for totals
                      : entry.isPositive 
                        ? '#10b981' // Green for favorable
                        : '#ef4444' // Red for unfavorable
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-[#1e40af]" />
          <span className="text-gray-600 dark:text-gray-400">Total</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-emerald-500" />
          <span className="text-gray-600 dark:text-gray-400">Under Budget</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span className="text-gray-600 dark:text-gray-400">Over Budget</span>
        </div>
      </div>
    </div>
  );
}

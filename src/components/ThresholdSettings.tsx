import { useState } from 'react';
import { Settings, ChevronRight, ChevronDown } from 'lucide-react';
import { ProjectSettings } from '../types';

interface ThresholdSettingsProps {
  settings: ProjectSettings;
  onUpdateSettings: (updates: Partial<ProjectSettings>) => void;
}

export default function ThresholdSettings({ settings, onUpdateSettings }: ThresholdSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-[#0F0F12] rounded-xl border border-gray-200 dark:border-[#1F1F23] overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#1F1F23] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Settings className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">Threshold Settings</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-200 dark:border-[#1F1F23]">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Items exceeding these thresholds will be flagged as significant variances.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Percentage Threshold
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={settings.varianceThresholdPercent}
                  onChange={(e) => onUpdateSettings({ varianceThresholdPercent: Number(e.target.value) })}
                  min={0}
                  max={100}
                  className="input-field pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Dollar Threshold
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                <input
                  type="number"
                  value={settings.varianceThresholdDollar}
                  onChange={(e) => onUpdateSettings({ varianceThresholdDollar: Number(e.target.value) })}
                  min={0}
                  step={1000}
                  className="input-field pl-7"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Flagging variances over <strong>{settings.varianceThresholdPercent}%</strong> or <strong>${settings.varianceThresholdDollar.toLocaleString()}</strong>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

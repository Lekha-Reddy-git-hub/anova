import { Search, Filter, Save, Star, AlertTriangle, ChevronDown, Download } from 'lucide-react';
import { FilterState, ProjectSettings, GroupByOption } from '../types';

interface FiltersPanelProps {
  filters: FilterState;
  settings: ProjectSettings;
  onUpdateFilters: (updates: Partial<FilterState>) => void;
  onUpdateSettings: (updates: Partial<ProjectSettings>) => void;
  costCenters: string[];
  glAccounts: string[];
  hasCostCenter: boolean;
  hasGLAccount: boolean;
  totalRows: number;
  filteredRows: number;
  onSaveProject: () => void;
  onExport: () => void;
}

export default function FiltersPanel({
  filters,
  settings,
  onUpdateFilters,
  onUpdateSettings,
  costCenters,
  glAccounts,
  hasCostCenter,
  hasGLAccount,
  totalRows,
  filteredRows,
  onSaveProject,
  onExport,
}: FiltersPanelProps) {
  return (
    <div className="card p-4 space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -trangray-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onUpdateFilters({ search: e.target.value })}
            placeholder="Search..."
            className="input-field pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <select
              value={settings.groupBy}
              onChange={(e) => onUpdateSettings({ groupBy: e.target.value as GroupByOption })}
              className="input-field appearance-none pr-10"
            >
              <option value="none">No Grouping</option>
              {hasCostCenter && <option value="costCenter">By Cost Center</option>}
              {hasGLAccount && <option value="glAccount">By GL Account</option>}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -trangray-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          
          <button onClick={onExport} className="btn-secondary flex items-center gap-2" title="Export starred items & comments">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          
          <button onClick={onSaveProject} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Save</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <span className="text-sm text-gray-500">
          Showing <span className="font-medium text-gray-700 dark:text-gray-300">{filteredRows}</span> of {totalRows}
        </span>
        
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.showOnlySignificant}
            onChange={(e) => onUpdateFilters({ showOnlySignificant: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-blue-600"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
            <AlertTriangle className="w-4 h-4 text-amber-500" />Significant only
          </span>
        </label>
        
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.showOnlyStarred}
            onChange={(e) => onUpdateFilters({ showOnlyStarred: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-blue-600"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
            <Star className="w-4 h-4 text-amber-500" />Starred only
          </span>
        </label>
      </div>
    </div>
  );
}

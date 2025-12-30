import { useState, Fragment } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Star, 
  AlertTriangle,
  Calendar,
  User,
  Tag,
  MessageSquare,
  Check,
  X,
  Mail
} from 'lucide-react';
import { VarianceRow, GroupByOption, VarianceStatus, RootCause } from '../types';
import { groupData, formatCurrency, formatPercent } from '../utils/helpers';

interface VarianceTableProps {
  data: VarianceRow[];
  groupBy: GroupByOption;
  onUpdateRow: (rowId: string, updates: Partial<VarianceRow>) => void;
}

const STATUS_OPTIONS: { value: VarianceStatus; label: string; color: string }[] = [
  { value: 'new', label: 'New', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  { value: 'investigating', label: 'Investigating', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { value: 'explained', label: 'Explained', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'closed', label: 'Closed', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
];

const ROOT_CAUSE_OPTIONS: { value: RootCause; label: string }[] = [
  { value: '', label: 'Select...' },
  { value: 'timing', label: 'Timing' },
  { value: 'volume', label: 'Volume' },
  { value: 'price', label: 'Price' },
  { value: 'mix', label: 'Mix' },
  { value: 'one-time', label: 'One-time' },
  { value: 'fx', label: 'FX' },
  { value: 'other', label: 'Other' },
];

const EXPLANATION_TEMPLATES = [
  { short: 'Invoice early', full: 'Timing - Invoice received earlier than expected' },
  { short: 'Reverses next period', full: 'Timing - Expense will reverse next period' },
  { short: 'High demand', full: 'Volume - Higher demand than forecasted' },
  { short: 'Low activity', full: 'Volume - Lower activity than planned' },
  { short: 'Rate increase', full: 'Price - Vendor rate increase' },
  { short: 'Contract change', full: 'Price - Contract renegotiation savings' },
  { short: 'Unplanned cost', full: 'One-time - Unplanned expense' },
  { short: 'Project accelerated', full: 'One-time - Project acceleration' },
  { short: 'Currency impact', full: 'FX - Currency fluctuation impact' },
  { short: 'Mix shift', full: 'Mix - Product/service mix shift' },
];

export default function VarianceTable({ data, groupBy, onUpdateRow }: VarianceTableProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [editingOwner, setEditingOwner] = useState<string | null>(null);
  const [ownerValue, setOwnerValue] = useState('');
  
  const groupedData = groupBy !== 'none' ? groupData(data, groupBy) : null;

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleOwnerEdit = (row: VarianceRow) => {
    setEditingOwner(row.id);
    setOwnerValue(row.owner);
  };

  const handleOwnerSave = (rowId: string) => {
    onUpdateRow(rowId, { owner: ownerValue });
    setEditingOwner(null);
    setOwnerValue('');
  };

  const handleRequestExplanation = (row: VarianceRow) => {
    const subject = `Variance Explanation Needed: ${row.category}`;
    const body = `Hi ${row.owner || '[Owner]'},

Please provide an explanation for the following variance:

Category: ${row.category}
Budget: ${formatCurrency(row.budget)}
Actual: ${formatCurrency(row.actual)}
Variance: ${row.dollarVariance >= 0 ? '+' : ''}${formatCurrency(row.dollarVariance)} (${formatPercent(row.percentVariance)})
${row.dueDate ? `Due Date: ${new Date(row.dueDate).toLocaleDateString()}` : ''}

Please reply with:
1. Root cause (Timing/Volume/Price/Mix/One-time/FX)
2. Brief explanation
3. Expected resolution (if applicable)

Thank you!`;
    
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const renderRow = (row: VarianceRow, indent = false) => {
    const isExpanded = expandedRow === row.id;
    const isOverdue = row.dueDate && new Date(row.dueDate) < new Date() && row.status !== 'closed' && row.status !== 'explained';
    
    return (
      <Fragment key={row.id}>
        <tr 
          className={`hover:bg-gray-50 dark:hover:bg-[#1F1F23]/50 cursor-pointer ${isExpanded ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
          onClick={() => setExpandedRow(isExpanded ? null : row.id)}
        >
          <td className="px-4 py-3">
            <div className="flex items-center gap-2">
              {indent && <span className="w-4" />}
              <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              <span className="font-medium text-gray-900 dark:text-white">{row.category}</span>
              {row.isSignificant && (
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              )}
            </div>
          </td>
          {groupBy !== 'costCenter' && <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{row.costCenter || '-'}</td>}
          <td className="px-4 py-3 text-right font-mono text-sm">{formatCurrency(row.budget)}</td>
          <td className="px-4 py-3 text-right font-mono text-sm">{formatCurrency(row.actual)}</td>
          <td className={`px-4 py-3 text-right font-mono text-sm font-medium ${row.dollarVariance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {row.dollarVariance >= 0 ? '+' : ''}{formatCurrency(row.dollarVariance)}
          </td>
          <td className="px-4 py-3">
            <select
              value={row.status}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onUpdateRow(row.id, { status: e.target.value as VarianceStatus })}
              className={`text-xs font-medium px-2 py-1 rounded border-0 cursor-pointer ${STATUS_OPTIONS.find(s => s.value === row.status)?.color}`}
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </td>
          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
            {editingOwner === row.id ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={ownerValue}
                  onChange={(e) => setOwnerValue(e.target.value)}
                  placeholder="Enter name..."
                  className="w-24 px-2 py-1 text-xs bg-white dark:bg-[#1F1F23] border border-gray-300 dark:border-[#2A2A2E] rounded"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleOwnerSave(row.id);
                    if (e.key === 'Escape') setEditingOwner(null);
                  }}
                />
                <button onClick={() => handleOwnerSave(row.id)} className="p-1 text-green-600 hover:bg-green-50 rounded">
                  <Check className="w-3 h-3" />
                </button>
                <button onClick={() => setEditingOwner(null)} className="p-1 text-gray-400 hover:bg-gray-50 rounded">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              row.owner ? (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-700 dark:text-gray-300">{row.owner}</span>
                  <button
                    onClick={() => onUpdateRow(row.id, { owner: '' })}
                    className="p-0.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    title="Remove owner"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleOwnerEdit(row)}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <User className="w-3 h-3" />
                  Assign
                </button>
              )
            )}
          </td>
          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
            <select
              value={row.rootCause}
              onChange={(e) => onUpdateRow(row.id, { rootCause: e.target.value as RootCause })}
              className="text-xs text-gray-600 dark:text-gray-400 bg-transparent border border-gray-200 dark:border-[#2A2A2E] rounded px-2 py-1 cursor-pointer"
            >
              {ROOT_CAUSE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </td>
          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
            <input
              type="date"
              value={row.dueDate}
              onChange={(e) => onUpdateRow(row.id, { dueDate: e.target.value })}
              className={`text-xs bg-transparent border rounded px-2 py-1 cursor-pointer ${
                isOverdue 
                  ? 'border-red-300 text-red-600 dark:border-red-800 dark:text-red-400' 
                  : 'border-gray-200 dark:border-[#2A2A2E] text-gray-600 dark:text-gray-400'
              }`}
            />
          </td>
          <td className="px-4 py-3">
            <button
              onClick={(e) => { e.stopPropagation(); onUpdateRow(row.id, { isStarred: !row.isStarred }); }}
              className={`p-1.5 rounded-lg ${row.isStarred ? 'text-amber-500' : 'text-gray-400 hover:text-amber-500'}`}
            >
              <Star className={`w-4 h-4 ${row.isStarred ? 'fill-current' : ''}`} />
            </button>
          </td>
        </tr>
        
        {/* Expanded Row Detail */}
        {isExpanded && (
          <tr className="bg-gray-50 dark:bg-[#1F1F23]/30">
            <td colSpan={10} className="px-6 py-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left: Variance Details */}
                <div className="bg-white dark:bg-[#0F0F12] rounded-lg p-3 border border-gray-200 dark:border-[#2A2A2E]">
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Variance Details</h4>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">% Variance</span>
                      <span className={`font-medium ${row.dollarVariance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatPercent(row.percentVariance)}
                      </span>
                    </div>
                    {row.glAccount && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">GL Account</span>
                        <span className="text-gray-900 dark:text-white">{row.glAccount}</span>
                      </div>
                    )}
                    {row.period && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Period</span>
                        <span className="text-gray-900 dark:text-white">{row.period}</span>
                      </div>
                    )}
                    {row.costCenter && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Cost Center</span>
                        <span className="text-gray-900 dark:text-white">{row.costCenter}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Center: Explanation */}
                <div className="lg:col-span-1">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      Explanation
                    </label>
                    {row.explanation && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Saved
                      </span>
                    )}
                  </div>
                  <textarea
                    value={row.explanation}
                    onChange={(e) => onUpdateRow(row.id, { explanation: e.target.value })}
                    placeholder="Enter explanation for this variance..."
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-[#0F0F12] border border-gray-200 dark:border-[#2A2A2E] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                  />
                  
                  {/* Templates */}
                  <div className="mt-2">
                    <span className="text-xs text-gray-500">Insert template:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {EXPLANATION_TEMPLATES.slice(0, 6).map((template, i) => (
                        <button
                          key={i}
                          onClick={() => onUpdateRow(row.id, { explanation: template.full })}
                          className="text-xs px-2 py-1 bg-gray-100 dark:bg-[#2A2A2E] text-gray-600 dark:text-gray-400 rounded hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-colors"
                          title={template.full}
                        >
                          {template.short}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Right: Actions */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Quick Actions</label>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleRequestExplanation(row)}
                      className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Request Explanation (via email)
                    </button>
                    <button
                      onClick={() => onUpdateRow(row.id, { status: 'explained' })}
                      className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Mark as Explained
                    </button>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        )}
      </Fragment>
    );
  };

  return (
    <div className="bg-white dark:bg-[#0F0F12] rounded-xl border border-gray-200 dark:border-[#1F1F23] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-[#1F1F23]/50 border-b border-gray-200 dark:border-[#1F1F23]">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Category</th>
              {groupBy !== 'costCenter' && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Cost Center</th>}
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Budget</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Actual</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Variance</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Owner</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Root Cause</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Due Date</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Star</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-[#1F1F23]">
            {groupBy === 'none' ? (
              data.map(row => renderRow(row))
            ) : (
              groupedData?.map(group => (
                <Fragment key={group.key}>
                  <tr className="bg-gray-100 dark:bg-[#1F1F23] cursor-pointer" onClick={() => toggleGroup(group.key)}>
                    <td className="px-4 py-3" colSpan={2}>
                      <div className="flex items-center gap-2">
                        {expandedGroups.has(group.key) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        <span className="font-semibold">{group.label}</span>
                        <span className="text-sm text-gray-500">({group.rows.length} items)</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm font-medium">{formatCurrency(group.totalBudget)}</td>
                    <td className="px-4 py-3 text-right font-mono text-sm font-medium">{formatCurrency(group.totalActual)}</td>
                    <td className={`px-4 py-3 text-right font-mono text-sm font-bold ${group.totalDollarVariance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {group.totalDollarVariance >= 0 ? '+' : ''}{formatCurrency(group.totalDollarVariance)}
                    </td>
                    <td colSpan={5}></td>
                  </tr>
                  {expandedGroups.has(group.key) && group.rows.map(row => renderRow(row, true))}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
      {data.length === 0 && <div className="py-12 text-center text-gray-500">No data matches your filters</div>}
    </div>
  );
}

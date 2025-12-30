import { VarianceRow, ParsedData, VarianceStatus, RootCause } from '../types';
import { generateId } from './helpers';

export const generateSampleData = (): ParsedData => {
  const costCenters = [
    '1001 - Marketing',
    '1002 - Sales',
    '2001 - Engineering',
    '3001 - Operations',
    '4001 - Finance',
  ];

  const glAccounts: Record<string, string[]> = {
    '1001 - Marketing': ['51000 - Advertising', '51010 - Events', '51020 - Digital Marketing'],
    '1002 - Sales': ['52000 - Travel', '52010 - Commissions', '52020 - Client Gifts'],
    '2001 - Engineering': ['61000 - Cloud Infra', '61010 - Software Licenses', '61020 - Hardware'],
    '3001 - Operations': ['71000 - Facilities', '71010 - Utilities', '71020 - Supplies'],
    '4001 - Finance': ['81000 - Audit Fees', '81010 - Banking Fees', '81020 - Insurance'],
  };

  const owners = ['Sarah Chen', 'Mike Johnson', 'Lisa Park', 'David Kim', 'Emily Taylor', ''];
  const statuses: VarianceStatus[] = ['new', 'investigating', 'explained', 'closed'];
  const rootCauses: RootCause[] = ['timing', 'volume', 'price', 'mix', 'one-time', 'fx', ''];

  const periods = ['2024-01', '2024-02', '2024-03'];
  const rows: VarianceRow[] = [];

  costCenters.forEach((costCenter) => {
    const gls = glAccounts[costCenter] || [];
    gls.forEach((glAccount) => {
      periods.forEach((period) => {
        const baseBudget = Math.floor(Math.random() * 100000) + 10000;
        const varianceFactor = (Math.random() - 0.5) * 0.4;
        const actual = Math.floor(baseBudget * (1 + varianceFactor));
        
        const dollarVariance = actual - baseBudget;
        const percentVariance = baseBudget !== 0 ? ((actual - baseBudget) / baseBudget) * 100 : 0;
        const isSignificant = Math.abs(percentVariance) > 10 || Math.abs(dollarVariance) > 50000;

        // Randomly assign workflow data
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const owner = owners[Math.floor(Math.random() * owners.length)];
        const rootCause = status === 'explained' || status === 'closed' 
          ? rootCauses[Math.floor(Math.random() * (rootCauses.length - 1))] 
          : '';
        
        // Set due date for items that need attention
        const today = new Date();
        const dueDate = status === 'new' || status === 'investigating'
          ? new Date(today.getTime() + (Math.random() * 14 - 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          : '';

        rows.push({
          id: generateId(),
          category: glAccount.split(' - ')[1] || glAccount,
          costCenter,
          glAccount,
          period,
          budget: baseBudget,
          actual,
          dollarVariance,
          percentVariance,
          isSignificant,
          isStarred: false,
          comments: [],
          status,
          owner,
          rootCause,
          dueDate,
          explanation: status === 'explained' || status === 'closed' 
            ? `${rootCause ? rootCause.charAt(0).toUpperCase() + rootCause.slice(1) : 'Timing'} variance due to ${Math.random() > 0.5 ? 'earlier than expected' : 'delayed'} activity.`
            : '',
        });
      });
    });
  });

  return {
    rows,
    columns: ['Category', 'Cost Center', 'GL Account', 'Period', 'Budget', 'Actual'],
    hasCostCenter: true,
    hasGLAccount: true,
    hasPeriod: true,
    periods,
  };
};

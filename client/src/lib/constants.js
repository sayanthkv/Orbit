export const EXPENSE_CATEGORIES = [
  { id: 'Food & Dining', name: 'Food & Dining', color: '#f97316', icon: 'Utensils', bg: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' },
  { id: 'Shopping', name: 'Shopping', color: '#ec4899', icon: 'ShoppingBag', bg: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20' },
  { id: 'Housing', name: 'Housing', color: '#3b82f6', icon: 'Home', bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  { id: 'Utilities', name: 'Utilities', color: '#06b6d4', icon: 'Zap', bg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20' },
  { id: 'Transportation', name: 'Transportation', color: '#eab308', icon: 'Car', bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  { id: 'Entertainment', name: 'Entertainment', color: '#a855f7', icon: 'Film', bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
  { id: 'Health & Fitness', name: 'Health & Fitness', color: '#ef4444', icon: 'HeartPulse', bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
  { id: 'Education', name: 'Education', color: '#6366f1', icon: 'GraduationCap', bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
  { id: 'Bills', name: 'Bills', color: '#f43f5e', icon: 'FileText', bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
  { id: 'Travel', name: 'Travel', color: '#14b8a6', icon: 'Plane', bg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20' },
  { id: 'Other', name: 'Other', color: '#71717a', icon: 'MoreHorizontal', bg: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20' },
];

export const INCOME_CATEGORIES = [
  { id: 'Salary', name: 'Salary', color: '#10b981', icon: 'Briefcase', bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  { id: 'Freelance', name: 'Freelance', color: '#06b6d4', icon: 'Laptop', bg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20' },
  { id: 'Investment', name: 'Investment', color: '#8b5cf6', icon: 'TrendingUp', bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
  { id: 'Gift', name: 'Gift', color: '#ec4899', icon: 'Gift', bg: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20' },
  { id: 'Refund', name: 'Refund', color: '#14b8a6', icon: 'RotateCcw', bg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20' },
  { id: 'Other Income', name: 'Other Income', color: '#64748b', icon: 'Coins', bg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' },
];

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export const getCategoryMeta = (name, type = 'expense') => {
  const match = ALL_CATEGORIES.find(
    (c) => c.name.toLowerCase() === (name || '').toLowerCase()
  );
  if (match) return match;

  return type === 'income'
    ? { id: 'Other Income', name: name || 'Income', color: '#10b981', icon: 'Coins', bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' }
    : { id: 'Other', name: name || 'Expense', color: '#71717a', icon: 'Receipt', bg: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' };
};

export const ACCOUNT_TYPES = ['Savings', 'Current', 'Salary', 'Investment', 'Other'];

export const ORBIT_TOOLS = [
  {
    id: 'expense-tracker',
    name: 'Expense Tracker',
    tagline: 'Track bank accounts, cash in hand, and personal flow.',
    path: '/tools/expense-tracker',
    icon: 'Wallet',
    gradient: 'from-emerald-600 to-teal-500',
    status: 'active',
    badge: 'Active Tool',
  },
  {
    id: 'vehicle-log',
    name: 'Vehicle Log',
    tagline: 'Mileage tester, fuel ledger, service intervals, and document expiries.',
    path: '/tools/vehicle-log',
    icon: 'Car',
    gradient: 'from-cyan-600 to-emerald-500',
    status: 'active',
    badge: 'Active Tool',
  },
  {
    id: 'reminders',
    name: 'Smart Reminders',
    tagline: 'Bill payment alerts and scheduled recurring tasks.',
    path: '#',
    icon: 'BellRing',
    gradient: 'from-amber-600 to-orange-500',
    status: 'coming_soon',
    badge: 'Coming Soon',
  },
  {
    id: 'vault',
    name: 'Secure Vault',
    tagline: 'Private encrypted records and critical identity notes.',
    path: '#',
    icon: 'Shield',
    gradient: 'from-violet-600 to-purple-700',
    status: 'coming_soon',
    badge: 'Coming Soon',
  },
];

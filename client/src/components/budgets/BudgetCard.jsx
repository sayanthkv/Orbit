import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { getCategoryIcon } from '../../utils/iconMap';
import { AlertTriangle, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';

export const BudgetCard = ({ budget, onDelete }) => {
  const { user } = useAuth();
  const category = budget.category || {};
  const percentage = Math.min(budget.percentage || 0, 100);

  // Determine state: Exceeded, Warning (80%+), or Healthy
  let statusColor = 'bg-emerald-500';
  let badgeColor = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
  let badgeText = 'On Track';
  let BadgeIcon = CheckCircle;

  if (budget.isExceeded) {
    statusColor = 'bg-rose-500';
    badgeColor = 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
    badgeText = 'Budget Exceeded!';
    BadgeIcon = AlertCircle;
  } else if (budget.isWarning) {
    statusColor = 'bg-amber-500';
    badgeColor = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    badgeText = '80% Limit Reached';
    BadgeIcon = AlertTriangle;
  }

  return (
    <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm"
            style={{
              backgroundColor: `${category.color || '#10B981'}20`,
              color: category.color || '#10B981',
            }}
          >
            {getCategoryIcon(category.icon, 'w-5 h-5')}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {category.name || 'Category'}
            </h4>
            <span className="text-xs text-slate-400">
              Limit: {formatCurrency(budget.monthlyLimit, user?.currency)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${badgeColor}`}
          >
            <BadgeIcon className="w-3.5 h-3.5" />
            {badgeText}
          </span>
          {onDelete && (
            <button
              onClick={() => onDelete(budget)}
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Remove budget"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Spent: {formatCurrency(budget.spent, user?.currency)}
          </span>
          <span className="font-bold text-slate-500 dark:text-slate-400">
            {budget.percentage}%
          </span>
        </div>

        <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${statusColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
          <span>
            {budget.remaining > 0
              ? `${formatCurrency(budget.remaining, user?.currency)} remaining`
              : '₹0 remaining'}
          </span>
          <span>Target: {formatCurrency(budget.monthlyLimit, user?.currency)}</span>
        </div>
      </div>
    </div>
  );
};

export default BudgetCard;

import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { getCategoryIcon } from '../../utils/iconMap';
import { AlertTriangle, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';

export const BudgetCard = ({ budget, onDelete }) => {
  const { user } = useAuth();
  const category = budget.category || {};
  const percentage = Math.min(budget.percentage || 0, 100);
  const catColor = category.color || '#10B981';

  let barColor = '#10b981';
  let badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
  let badgeText = 'On Track';
  let BadgeIcon = CheckCircle;

  if (budget.isExceeded) {
    barColor = '#f43f5e';
    badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
    badgeText = 'Exceeded!';
    BadgeIcon = AlertCircle;
  } else if (budget.isWarning) {
    barColor = '#f59e0b';
    badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
    badgeText = '80% Reached';
    BadgeIcon = AlertTriangle;
  }

  return (
    <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-xs hover:border-zinc-300 dark:bg-[#111113] dark:border-white/8 dark:hover:border-white/16 transition-all duration-200 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
            style={{ backgroundColor: `${catColor}18`, boxShadow: `0 0 0 1px ${catColor}30` }}
          >
            <span style={{ color: catColor }}>
              {getCategoryIcon(category.icon, 'w-5 h-5')}
            </span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{category.name || 'Category'}</h4>
            <span className="text-xs text-zinc-500">
              Limit: {formatCurrency(budget.monthlyLimit, user?.currency)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${badgeStyle}`}
          >
            <BadgeIcon className="w-3 h-3" />
            {badgeText}
          </span>
          {onDelete && (
            <button
              onClick={() => onDelete(budget)}
              className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:text-zinc-600 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
              title="Remove budget"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-zinc-600 dark:text-zinc-400">
            {formatCurrency(budget.spent, user?.currency)} spent
          </span>
          <span
            className="font-black text-sm tabular-nums"
            style={{ color: barColor }}
          >
            {budget.percentage}%
          </span>
        </div>

        {/* Track bar */}
        <div className="w-full h-2 rounded-full overflow-hidden bg-zinc-100 dark:bg-white/8">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${percentage}%`,
              background: `linear-gradient(90deg, ${barColor}cc, ${barColor})`,
              boxShadow: `0 0 8px ${barColor}60`,
            }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-600">
          <span>
            {budget.remaining > 0
              ? `${formatCurrency(budget.remaining, user?.currency)} left`
              : 'No budget left'}
          </span>
          <span>of {formatCurrency(budget.monthlyLimit, user?.currency)}</span>
        </div>
      </div>
    </div>
  );
};

export default BudgetCard;

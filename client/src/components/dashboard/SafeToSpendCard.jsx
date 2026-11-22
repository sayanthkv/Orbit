import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';
import { ShieldCheck, AlertTriangle, AlertCircle, ArrowRight, Calendar, Sparkles } from 'lucide-react';

export const SafeToSpendCard = ({ safeToSpend, budgetAlerts = [], currency = 'INR' }) => {
  if (!safeToSpend) return null;

  const {
    dailyAmount = 0,
    daysRemaining = 0,
    remainingPool = 0,
    poolType = 'budget',
    poolTotal = 0,
  } = safeToSpend;

  const hasAlerts = budgetAlerts && budgetAlerts.length > 0;
  const exceededAlerts = budgetAlerts.filter((a) => a.type === 'danger');
  const warningAlerts = budgetAlerts.filter((a) => a.type === 'warning');

  return (
    <div className="space-y-3">
      {/* Safe to Spend Widget */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-zinc-200/90 shadow-xs dark:bg-[#141418] dark:border-white/10 relative overflow-hidden transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Safe to Spend Today
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  {daysRemaining > 0 ? `${daysRemaining} days left` : 'Month ended'}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mt-0.5">
                <h3 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                  {formatCurrency(dailyAmount, currency)}
                  <span className="text-xs font-semibold text-zinc-400 ml-1">/ day</span>
                </h3>
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {poolType === 'budget'
                  ? `${formatCurrency(remainingPool, currency)} remaining of monthly budget pool`
                  : `${formatCurrency(remainingPool, currency)} remaining from monthly net income`}
              </p>
            </div>
          </div>

          {/* Action Link to Budgets */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-100 dark:border-white/5">
            <Link
              to="/budgets"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-900 hover:text-black dark:text-zinc-200 dark:hover:text-white px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 dark:bg-white/10 dark:hover:bg-white/15 transition-all"
            >
              <span>Manage Budgets</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* In-app Budget Alerts Banner (80% warning and 100% exceeded) */}
      {hasAlerts && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/5 border border-amber-500/25 dark:border-amber-500/20 text-zinc-900 dark:text-zinc-100 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {exceededAlerts.length > 0 ? (
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              )}
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                Budget Threshold Alerts ({budgetAlerts.length})
              </h4>
            </div>
            <Link
              to="/budgets"
              className="text-[11px] font-bold text-amber-900 dark:text-amber-300 hover:underline"
            >
              View details →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {budgetAlerts.slice(0, 4).map((alert) => (
              <div
                key={alert.id || alert.category}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border ${
                  alert.type === 'danger'
                    ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-300'
                    : 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-900/50 dark:text-amber-300'
                }`}
              >
                <span className="truncate font-semibold">{alert.category}</span>
                <span className="font-black shrink-0 ml-2">
                  {alert.percentage}% {alert.type === 'danger' ? 'Exceeded' : 'Used'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SafeToSpendCard;

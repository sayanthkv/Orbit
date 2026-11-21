import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, TrendingUp, Wallet } from 'lucide-react';

export const StatCards = ({ summary = {} }) => {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';

  const spent = summary.totalExpense || 0;
  const income = summary.totalIncome || 0;
  const balance = summary.netBalance || 0;
  const savingsRate = summary.savingsRate || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* 1. Total Spent (Primary Metric) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total Spent
          </span>
          <div className="w-9 h-9 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <CreditCard className="w-4 h-4" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {formatCurrency(spent, currency)}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Total expenses this month
          </p>
        </div>
      </div>

      {/* 2. Total Inflow */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total Income
          </span>
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
            +{formatCurrency(income, currency)}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Total incoming funds
          </p>
        </div>
      </div>

      {/* 3. Net Balance */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Net Balance
          </span>
          <div className="w-9 h-9 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div>
          <h3
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              balance >= 0
                ? 'text-slate-900 dark:text-white'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {balance >= 0 ? '+' : ''}{formatCurrency(balance, currency)}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {savingsRate > 0 ? `${savingsRate}% saved of income` : 'Cash flow status'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatCards;

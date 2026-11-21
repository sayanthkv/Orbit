import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import {
  Edit2,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  TrendingUp,
  TrendingDown,
  Layers,
} from 'lucide-react';

export const HeroBalanceCard = ({
  summary = {},
  selectedAccount = null,
  onAddExpense,
  onAddIncome,
  onEditBalance,
  onSetInitialBalance,
}) => {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';

  const initialBal = selectedAccount
    ? (selectedAccount.initialBalance || 0)
    : (user?.initialBalance || 0);
  const hasSetInitial = selectedAccount ? true : Boolean(user?.hasSetInitialBalance);

  const balance = summary.allTimeBalance !== undefined
    ? summary.allTimeBalance
    : (initialBal + (summary.netBalance || 0));

  const monthSpent = summary.totalExpense || 0;
  const monthIncome = summary.totalIncome || 0;
  const isPositive = balance >= 0;

  return (
    <div className="relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-white border border-zinc-200/90 shadow-sm dark:bg-gradient-to-br dark:from-[#111118] dark:via-[#0e0e15] dark:to-[#0a0a10] dark:border-white/10 dark:shadow-[0_24px_64px_rgba(0,0,0,0.6)] transition-all">
      {/* Top ambient glow */}
      <div 
        className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-36 rounded-full blur-3xl pointer-events-none opacity-20 dark:opacity-30 transition-opacity"
        style={{
          background: selectedAccount
            ? `radial-gradient(ellipse, ${selectedAccount.color || '#10b981'} 0%, transparent 70%)`
            : 'radial-gradient(ellipse, #10b981 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-widest uppercase text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
              {selectedAccount ? (
                <>
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: selectedAccount.color || '#10b981' }}
                  />
                  <span>{selectedAccount.bankName || selectedAccount.name} Balance</span>
                </>
              ) : (
                <>
                  <Layers className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Total Net Worth (Combined)</span>
                </>
              )}
            </span>
            {hasSetInitial && onEditBalance && (
              <button
                onClick={onEditBalance}
                type="button"
                className="p-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] dark:text-zinc-400 dark:hover:text-zinc-200 transition-all cursor-pointer"
                title={selectedAccount ? "Edit account" : "Edit starting balance"}
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {!hasSetInitial && onSetInitialBalance ? (
            <button
              onClick={onSetInitialBalance}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-zinc-950 text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              Set Baseline Balance
            </button>
          ) : (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200/80 dark:bg-white/[0.06] dark:text-zinc-300 dark:border-white/[0.08]">
              {currency}
            </span>
          )}
        </div>

        {/* Hero Balance */}
        <div>
          <h2
            className={`text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none ${
              isPositive ? 'text-zinc-950 dark:text-white' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatCurrency(balance, currency)}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
            {selectedAccount
              ? `Account: ${selectedAccount.type} • Baseline: ${formatCurrency(selectedAccount.initialBalance || 0, currency)}`
              : 'Aggregated net worth across all your active accounts'}
          </p>
        </div>

        {/* Income & Expense Stats */}
        <div className="grid grid-cols-2 gap-3">
          {/* Income */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 dark:bg-emerald-500/10 dark:border-emerald-500/20 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400/80 uppercase tracking-wider">Inflow (Month)</p>
              <p className="text-base font-bold text-emerald-700 dark:text-emerald-400 truncate">
                +{formatCurrency(monthIncome, currency)}
              </p>
            </div>
          </div>

          {/* Expenses */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/70 dark:bg-rose-500/10 dark:border-rose-500/20 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 flex items-center justify-center shrink-0">
              <TrendingDown className="w-4.5 h-4.5 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-rose-700 dark:text-rose-400/80 uppercase tracking-wider">Outflow (Month)</p>
              <p className="text-base font-bold text-rose-700 dark:text-rose-400 truncate">
                −{formatCurrency(monthSpent, currency)}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-2 border-t border-zinc-100 dark:border-white/[0.06]">
          <button
            onClick={onAddExpense}
            type="button"
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all active:scale-95 cursor-pointer bg-rose-600 hover:bg-rose-500 text-white shadow-sm shadow-rose-500/20"
          >
            <ArrowDownRight className="w-4 h-4" />
            Add Expense
          </button>

          <button
            onClick={onAddIncome}
            type="button"
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all active:scale-95 cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
          >
            <ArrowUpRight className="w-4 h-4" />
            Add Income
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeroBalanceCard;

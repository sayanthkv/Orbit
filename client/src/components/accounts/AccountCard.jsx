import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import {
  Building,
  Banknote,
  CreditCard,
  PiggyBank,
  Wallet,
  Layers,
  Edit2,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  CreditCard as CardIcon,
} from 'lucide-react';

const ACCOUNT_ICONS = {
  bank: Building,
  cash: Banknote,
  card: CreditCard,
  savings: PiggyBank,
  wallet: Wallet,
  other: Layers,
};

export const AccountCard = ({
  account,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';

  const IconComponent = ACCOUNT_ICONS[account.type] || Building;
  const color = account.color || '#10B981';
  const balance = account.currentBalance ?? (account.initialBalance || 0);
  const isPositive = balance >= 0;
  const bankTitle = account.bankName || account.name;
  const lastFour = account.accountNumber ? `•••• ${account.accountNumber}` : null;

  return (
    <div
      onClick={onSelect}
      className={`group relative overflow-hidden rounded-3xl p-5 sm:p-6 transition-all duration-300 ease-out cursor-pointer border ${
        isSelected
          ? 'bg-white dark:bg-[#16161c] border-zinc-900 dark:border-white/50 shadow-lg ring-2 ring-zinc-900/10 dark:ring-white/20 scale-[1.01]'
          : 'bg-white dark:bg-[#111114] border-zinc-200/90 dark:border-white/8 hover:border-zinc-400 dark:hover:border-white/20 hover:shadow-md'
      }`}
    >
      {/* Top ambient glow based on account theme */}
      <div
        className="absolute -top-12 -right-12 w-36 h-36 rounded-full blur-2xl pointer-events-none opacity-20 dark:opacity-30 transition-opacity"
        style={{ backgroundColor: color }}
      />

      {/* Top indicator & icon */}
      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs transition-transform duration-300 group-hover:scale-105"
            style={{
              backgroundColor: `${color}18`,
              boxShadow: `0 0 0 1px ${color}35`,
            }}
          >
            <IconComponent className="w-5 h-5" style={{ color }} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-zinc-950 dark:text-white leading-tight">
                {bankTitle}
              </h3>
              {account.isDefault && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Primary
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
              {account.name && account.name !== bankTitle && (
                <>
                  <span>{account.name}</span>
                  <span>•</span>
                </>
              )}
              <span className="capitalize">{account.type}</span>
              {lastFour && (
                <>
                  <span>•</span>
                  <span className="font-mono text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                    {lastFour}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onEdit(account)}
            type="button"
            className="p-1.5 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/[0.08] rounded-xl transition-all cursor-pointer"
            title="Edit Account"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          {onDelete && !account.isDefault && (
            <button
              onClick={() => onDelete(account)}
              type="button"
              className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:text-zinc-500 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
              title="Delete Account"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Account Balance */}
      <div className="relative z-10 space-y-1 mb-4">
        <span className="text-[11px] font-bold tracking-wider uppercase text-zinc-500 dark:text-zinc-400">
          Available Balance
        </span>
        <h4
          className={`text-2xl sm:text-3xl font-black tracking-tight ${
            isPositive ? 'text-zinc-950 dark:text-white' : 'text-rose-600 dark:text-rose-400'
          }`}
        >
          {formatCurrency(balance, currency)}
        </h4>
      </div>

      {/* Month Overview Mini Stats */}
      <div className="relative z-10 grid grid-cols-2 gap-2 pt-3 border-t border-zinc-100 dark:border-white/5 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold">Inflow</p>
            <p className="font-bold text-zinc-900 dark:text-zinc-200">
              {formatCurrency(account.monthIncome || 0, currency)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold">Outflow</p>
            <p className="font-bold text-zinc-900 dark:text-zinc-200">
              {formatCurrency(account.monthExpense || 0, currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Active state footer */}
      <div className="relative z-10 mt-4 flex items-center justify-between text-xs font-semibold">
        <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">
          Starting: {formatCurrency(account.initialBalance || 0, currency)}
        </span>
        {isSelected ? (
          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Active Tracker
          </span>
        ) : (
          <span className="text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-950 dark:group-hover:text-white transition-colors text-[11px]">
            Track this account →
          </span>
        )}
      </div>
    </div>
  );
};

export default AccountCard;

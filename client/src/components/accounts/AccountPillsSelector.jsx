import React from 'react';
import { useAccounts } from '../../context/AccountContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatters';
import { Layers, Plus, Building, Banknote, CreditCard, PiggyBank, Wallet } from 'lucide-react';

const ACCOUNT_ICONS = {
  bank: Building,
  cash: Banknote,
  card: CreditCard,
  savings: PiggyBank,
  wallet: Wallet,
  other: Layers,
};

export const AccountPillsSelector = ({ onOpenAddAccount, className = '' }) => {
  const { accounts, selectedAccountId, selectAccount, combinedSummary } = useAccounts();
  const { user } = useAuth();
  const currency = user?.currency || 'INR';

  return (
    <div className={`flex items-center gap-2 overflow-x-auto no-scrollbar py-1 transition-all duration-300 ${className}`}>
      {/* All Accounts (Sum) Pill */}
      <button
        type="button"
        onClick={() => selectAccount('all')}
        className={`shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
          selectedAccountId === 'all'
            ? 'bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-950 dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)] scale-[1.02]'
            : 'bg-white text-zinc-600 border border-zinc-200/90 hover:text-zinc-950 hover:bg-zinc-50 dark:bg-[#18181b] dark:border-white/10 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/[0.06]'
        }`}
      >
        <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>All Accounts (Sum)</span>
        <span
          className={`text-[11px] font-extrabold px-1.5 py-0.2 rounded-full transition-colors duration-200 ${
            selectedAccountId === 'all'
              ? 'bg-white/20 text-white dark:bg-zinc-900/15 dark:text-zinc-950'
              : 'bg-zinc-100 text-zinc-700 dark:bg-white/[0.08] dark:text-zinc-300'
          }`}
        >
          {formatCurrency(combinedSummary.totalNetWorth || 0, currency)}
        </span>
      </button>

      {/* Specific Accounts */}
      {accounts.map((acc) => {
        const IconComponent = ACCOUNT_ICONS[acc.type] || Building;
        const isSelected = selectedAccountId === acc._id;
        const color = acc.color || '#10B981';
        const displayName = acc.bankName || acc.name;

        return (
          <button
            key={acc._id}
            type="button"
            onClick={() => selectAccount(acc._id)}
            className={`shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
              isSelected
                ? 'bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-950 dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)] scale-[1.02]'
                : 'bg-white text-zinc-600 border border-zinc-200/90 hover:text-zinc-950 hover:bg-zinc-50 dark:bg-[#18181b] dark:border-white/10 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/[0.06]'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0 transition-transform duration-200 group-hover:scale-125"
              style={{ backgroundColor: color }}
            />
            <IconComponent className="w-3.5 h-3.5 stroke-[2]" />
            <span>{displayName}</span>
            {acc.accountNumber && (
              <span className="font-mono text-[10px] opacity-70">
                ••••{acc.accountNumber}
              </span>
            )}
            <span
              className={`text-[11px] font-extrabold px-1.5 py-0.2 rounded-full transition-colors duration-200 ${
                isSelected
                  ? 'bg-white/20 text-white dark:bg-zinc-900/15 dark:text-zinc-950'
                  : 'bg-zinc-100 text-zinc-700 dark:bg-white/[0.08] dark:text-zinc-300'
              }`}
            >
              {formatCurrency(acc.currentBalance ?? (acc.initialBalance || 0), currency)}
            </span>
          </button>
        );
      })}

      {/* Add New Account Button */}
      {onOpenAddAccount && (
        <button
          type="button"
          onClick={onOpenAddAccount}
          className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-zinc-600 border border-dashed border-zinc-300 hover:border-zinc-500 hover:text-zinc-950 hover:bg-zinc-50 dark:text-zinc-400 dark:border-white/20 dark:hover:border-white/40 dark:hover:text-white dark:hover:bg-white/[0.04] transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>New Bank Account</span>
        </button>
      )}
    </div>
  );
};

export default AccountPillsSelector;

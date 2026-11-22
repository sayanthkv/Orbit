import React from 'react';
import { getCategoryIcon } from '../../utils/iconMap';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { useAccounts } from '../../context/AccountContext';
import { Edit2, Trash2, CreditCard, Banknote, Smartphone, Building, ArrowRightLeft } from 'lucide-react';

const PAYMENT_METHOD_ICONS = {
  UPI: Smartphone,
  card: CreditCard,
  cash: Banknote,
  bank: Building,
};

export const TransactionItem = ({ transaction, onEdit, onDelete }) => {
  const { user } = useAuth();
  const { activeDashboardAccountId, selectedAccountId } = useAccounts();
  
  const isTransfer = transaction.type === 'transfer';
  const isIncome = transaction.type === 'income';
  const category = transaction.category || {};
  const PaymentIcon = PAYMENT_METHOD_ICONS[transaction.paymentMethod] || Smartphone;

  const currentViewAccountId = activeDashboardAccountId || (selectedAccountId !== 'all' ? selectedAccountId : null);

  // Determine transfer direction if on a specific account page
  let isTransferOutflow = false;
  let isTransferInflow = false;
  if (isTransfer && currentViewAccountId) {
    const fromId = transaction.account?._id || transaction.account;
    const toId = transaction.toAccount?._id || transaction.toAccount;
    if (fromId === currentViewAccountId) isTransferOutflow = true;
    if (toId === currentViewAccountId) isTransferInflow = true;
  }

  const catColor = isTransfer
    ? '#8B5CF6'
    : category.color || (isIncome ? '#10b981' : '#f43f5e');

  const fromAccName = transaction.account?.bankName || transaction.account?.name || 'Account';
  const toAccName = transaction.toAccount?.bankName || transaction.toAccount?.name || 'Account';

  return (
    <div className="group flex items-center justify-between px-4 py-3.5 rounded-2xl bg-white border border-zinc-200/80 shadow-xs hover:border-zinc-300 dark:bg-[#111113] dark:border-white/8 dark:hover:border-white/16 dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-all duration-200">
      <div className="flex items-center gap-3.5 min-w-0">
        {/* Category / Transfer Icon */}
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
          style={{
            backgroundColor: `${catColor}18`,
            boxShadow: `0 0 0 1px ${catColor}30`,
          }}
        >
          <span style={{ color: catColor }}>
            {isTransfer ? (
              <ArrowRightLeft className="w-5 h-5" />
            ) : (
              getCategoryIcon(category.icon, 'w-5 h-5')
            )}
          </span>
        </div>

        {/* Details */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {isTransfer
                ? transaction.note || `Transfer to ${toAccName}`
                : transaction.note || category.name || 'Untitled'}
            </h4>

            {/* Account pill or Transfer route */}
            {isTransfer ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800/40">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                <span>{fromAccName}</span>
                <span className="text-violet-400">→</span>
                <span>{toAccName}</span>
              </span>
            ) : (
              transaction.account && (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${transaction.account.color || '#3b82f6'}18`,
                    color: transaction.account.color || '#3b82f6',
                    border: `1px solid ${transaction.account.color || '#3b82f6'}35`,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: transaction.account.color || '#3b82f6' }}
                  />
                  {transaction.account.bankName || transaction.account.name}
                </span>
              )
            )}

            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 dark:bg-white/[0.05] dark:text-zinc-400">
              <PaymentIcon className="w-2.5 h-2.5" />
              {transaction.paymentMethod}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            <span
              className="font-semibold text-[11px] px-1.5 py-0.5 rounded-md"
              style={{ color: catColor, background: `${catColor}18` }}
            >
              {isTransfer ? 'Transfer' : category.name || 'Uncategorized'}
            </span>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <span>{formatDate(transaction.date)}</span>

            {/* Tags Pills */}
            {transaction.tags && transaction.tags.length > 0 && (
              <div className="hidden md:flex items-center gap-1 ml-1">
                {transaction.tags.slice(0, 3).map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-white/8 px-1.5 py-0.5 rounded-md"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Amount & Actions */}
      <div className="flex items-center gap-2 shrink-0 pl-3">
        <p
          className={`text-base sm:text-lg font-black tracking-tight ${
            isTransfer
              ? isTransferInflow
                ? 'text-emerald-600 dark:text-emerald-400'
                : isTransferOutflow
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-violet-600 dark:text-violet-400'
              : isIncome
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-rose-600 dark:text-rose-400'
          }`}
        >
          {isTransfer
            ? isTransferInflow
              ? '+'
              : isTransferOutflow
              ? '−'
              : '⇄ '
            : isIncome
            ? '+'
            : '−'}
          {formatCurrency(transaction.amount, user?.currency)}
        </p>

        <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(transaction)}
            type="button"
            className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-600 dark:hover:text-zinc-200 dark:hover:bg-white/[0.08] rounded-lg transition-all cursor-pointer"
            title="Edit"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(transaction)}
            type="button"
            className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:text-zinc-600 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionItem;

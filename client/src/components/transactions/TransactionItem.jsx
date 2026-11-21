import React from 'react';
import { getCategoryIcon } from '../../utils/iconMap';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { Edit2, Trash2, CreditCard, Banknote, Smartphone, Building } from 'lucide-react';

const PAYMENT_METHOD_ICONS = {
  UPI: Smartphone,
  card: CreditCard,
  cash: Banknote,
  bank: Building,
};

export const TransactionItem = ({ transaction, onEdit, onDelete }) => {
  const { user } = useAuth();
  const isIncome = transaction.type === 'income';
  const category = transaction.category || {};
  const PaymentIcon = PAYMENT_METHOD_ICONS[transaction.paymentMethod] || Smartphone;
  const catColor = category.color || (isIncome ? '#10b981' : '#f43f5e');

  return (
    <div className="group flex items-center justify-between px-4 py-3.5 rounded-2xl bg-white border border-zinc-200/80 shadow-xs hover:border-zinc-300 dark:bg-[#111113] dark:border-white/8 dark:hover:border-white/16 dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-all duration-200">
      <div className="flex items-center gap-3.5 min-w-0">
        {/* Category Icon */}
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
          style={{
            backgroundColor: `${catColor}18`,
            boxShadow: `0 0 0 1px ${catColor}30`,
          }}
        >
          <span style={{ color: catColor }}>
            {getCategoryIcon(category.icon, 'w-5 h-5')}
          </span>
        </div>

        {/* Details */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {transaction.note || category.name || 'Untitled'}
            </h4>
            {transaction.account && (
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
              {category.name || 'Uncategorized'}
            </span>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <span>{formatDate(transaction.date)}</span>
          </div>
        </div>
      </div>

      {/* Amount & Actions */}
      <div className="flex items-center gap-2 shrink-0 pl-3">
        <p
          className={`text-base sm:text-lg font-black tracking-tight ${
            isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}
        >
          {isIncome ? '+' : '−'}{formatCurrency(transaction.amount, user?.currency)}
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

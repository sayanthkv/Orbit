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

  return (
    <div className="group flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/70 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700/80 hover:shadow-xs transition-all duration-150">
      <div className="flex items-center gap-3.5 min-w-0">
        {/* Category Icon */}
        <div
          className="w-10 sm:w-11 h-10 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-105"
          style={{
            backgroundColor: `${category.color || '#10B981'}18`,
            color: category.color || '#10B981',
          }}
        >
          {getCategoryIcon(category.icon, 'w-5 h-5')}
        </div>

        {/* Details */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {transaction.note || category.name || 'Untitled'}
            </h4>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              <PaymentIcon className="w-3 h-3" />
              {transaction.paymentMethod}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
            <span className="font-medium text-slate-600 dark:text-slate-400">
              {category.name || 'Uncategorized'}
            </span>
            <span>&bull;</span>
            <span>{formatDate(transaction.date)}</span>
          </div>
        </div>
      </div>

      {/* Amount & Actions */}
      <div className="flex items-center gap-2.5 sm:gap-4 shrink-0 pl-3">
        <div className="text-right">
          <p
            className={`text-sm sm:text-base font-bold tracking-tight ${
              isIncome
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {isIncome ? '+' : '-'} {formatCurrency(transaction.amount, user?.currency)}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(transaction)}
            type="button"
            className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Edit transaction"
            aria-label="Edit transaction"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(transaction)}
            type="button"
            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Delete transaction"
            aria-label="Delete transaction"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionItem;

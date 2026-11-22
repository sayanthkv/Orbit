import React, { useState, useMemo } from 'react';
import { parseQuickAdd } from '../../utils/naturalLanguageParser';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { transactionApi } from '../../api/transactionApi';
import { Zap, CornerDownLeft, Sparkles, Check, ArrowRight } from 'lucide-react';

export const QuickAddBar = ({ categories = [], accounts = [], onTransactionLogged }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const draft = useMemo(() => {
    return parseQuickAdd(input, categories, accounts);
  }, [input, categories, accounts]);

  const categoryObj = categories.find((c) => c._id === draft?.category);
  const accountObj = accounts.find((a) => a._id === draft?.account);

  const handleQuickSubmit = async (e) => {
    e.preventDefault();
    if (!draft || !draft.amount || draft.amount <= 0) {
      toast.error('Please enter an expression with an amount (e.g. "coffee 150 yesterday")');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await transactionApi.createTransaction({
        type: draft.type,
        amount: draft.amount,
        category: draft.category,
        account: draft.account,
        date: draft.date,
        note: draft.note,
        paymentMethod: 'UPI',
      });

      if (res?.success) {
        toast.success(`Logged ${formatCurrency(draft.amount, user?.currency)} for "${draft.note}"!`);
        setInput('');
        if (onTransactionLogged) onTransactionLogged();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-3.5 sm:p-4 rounded-3xl bg-white border border-zinc-200/90 shadow-xs dark:bg-[#141418] dark:border-white/10 transition-all">
      <form onSubmit={handleQuickSubmit} className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Zap className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-500" />
            <input
              type="text"
              placeholder="Quick Add: type e.g. 'chai 40 yesterday' or 'zomato 450 food'..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full pl-10 pr-20 py-2.5 text-xs sm:text-sm rounded-2xl border border-zinc-200 bg-zinc-50/80 text-zinc-900 placeholder:text-zinc-400 outline-none focus:bg-white focus:border-zinc-400 dark:border-white/10 dark:bg-[#1c1c20] dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-white/20 transition-all"
            />
            {draft?.amount > 0 && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-bold shadow-xs hover:scale-102 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
              >
                <span>Save</span>
                <CornerDownLeft className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Live Parsed Preview Chips */}
        {input.trim().length > 0 && draft && (
          <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px] animate-fade-in">
            <span className="font-bold text-zinc-400 uppercase text-[9px] tracking-wider">
              Parsed:
            </span>

            {/* Amount */}
            <span
              className={`font-black px-2 py-0.5 rounded-md ${
                draft.amount > 0
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-zinc-100 text-zinc-500 dark:bg-white/5'
              }`}
            >
              {draft.amount > 0 ? formatCurrency(draft.amount, user?.currency) : 'Amount missing'}
            </span>

            {/* Category */}
            {categoryObj && (
              <span className="font-semibold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 dark:bg-white/5 dark:text-zinc-300">
                {categoryObj.name}
              </span>
            )}

            {/* Account */}
            {accountObj && (
              <span className="font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300">
                {accountObj.bankName || accountObj.name}
              </span>
            )}

            {/* Date */}
            <span className="text-zinc-400">
              on {formatDate(draft.date)}
            </span>
          </div>
        )}
      </form>
    </div>
  );
};

export default QuickAddBar;

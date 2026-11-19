import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, PiggyBank, CreditCard } from 'lucide-react';

export const StatCards = ({ summary }) => {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';

  const cards = [
    {
      title: 'Total Income',
      amount: summary.totalIncome || 0,
      icon: TrendingUp,
      color: 'emerald',
      change: summary.incomeChangeMoM,
      prefix: '+',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
      borderColor: 'border-emerald-100 dark:border-emerald-900/50',
    },
    {
      title: 'Total Expenses',
      amount: summary.totalExpense || 0,
      icon: CreditCard,
      color: 'rose',
      change: summary.expenseChangeMoM,
      prefix: '-',
      textColor: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-50 dark:bg-rose-950/40',
      borderColor: 'border-rose-100 dark:border-rose-900/50',
    },
    {
      title: 'Net Balance',
      amount: summary.netBalance || 0,
      icon: Wallet,
      color: summary.netBalance >= 0 ? 'emerald' : 'rose',
      prefix: summary.netBalance >= 0 ? '+' : '',
      textColor:
        summary.netBalance >= 0
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-slate-50 dark:bg-slate-900/60',
      borderColor: 'border-slate-200 dark:border-slate-800',
    },
    {
      title: 'Savings Rate',
      amount: `${summary.savingsRate || 0}%`,
      isPercentage: true,
      icon: PiggyBank,
      color: 'teal',
      textColor: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-50 dark:bg-teal-950/40',
      borderColor: 'border-teal-100 dark:border-teal-900/50',
      subtitle: summary.savingsRate >= 30 ? 'High savings' : summary.savingsRate > 0 ? 'Moderate' : 'Negative flow',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border ${card.borderColor} shadow-sm transition-all hover:shadow-md duration-200`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {card.title}
              </span>
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center ${card.bgColor} ${card.textColor}`}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3">
              <h3 className={`text-2xl font-extrabold tracking-tight ${card.textColor}`}>
                {card.isPercentage
                  ? card.amount
                  : `${card.prefix || ''}${formatCurrency(card.amount, currency)}`}
              </h3>
            </div>

            <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-400">
              {card.change !== undefined && card.change !== 0 ? (
                <span
                  className={`inline-flex items-center gap-0.5 font-semibold ${
                    card.change > 0
                      ? card.title === 'Total Expenses'
                        ? 'text-rose-500'
                        : 'text-emerald-500'
                      : card.title === 'Total Expenses'
                      ? 'text-emerald-500'
                      : 'text-rose-500'
                  }`}
                >
                  {card.change > 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {Math.abs(card.change)}% MoM
                </span>
              ) : (
                <span>{card.subtitle || 'Selected month'}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatCards;

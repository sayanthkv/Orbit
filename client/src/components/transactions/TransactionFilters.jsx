import React from 'react';
import { Search, X, RotateCcw, Filter } from 'lucide-react';
import { PAYMENT_METHODS } from '../../utils/constants';
import { useAccounts } from '../../context/AccountContext';

export const TransactionFilters = ({
  filters,
  onChange,
  onReset,
  categories = [],
}) => {
  const { accounts } = useAccounts();

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.type ||
      filters.categoryId ||
      filters.accountId ||
      filters.paymentMethod ||
      filters.startDate ||
      filters.endDate ||
      filters.minAmount ||
      filters.maxAmount ||
      filters.tag
  );

  const selectClass =
    'w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-zinc-200 bg-white text-zinc-900 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-400/10 dark:border-white/12 dark:bg-[#18181e] dark:text-zinc-100 dark:focus:border-white/30 dark:focus:ring-white/10 transition-all cursor-pointer';

  const optionClass = 'bg-white text-zinc-900 dark:bg-[#18181e] dark:text-zinc-100';

  return (
    <div className="bg-white border border-zinc-200/90 shadow-sm dark:bg-[#111114] dark:border-white/10 rounded-2xl p-4 sm:p-5 space-y-3.5 transition-colors">
      {/* Search & Type Toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search transactions by note, keyword, or store..."
            value={filters.search || ''}
            onChange={(e) => onChange('search', e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 outline-none focus:bg-white focus:border-zinc-400 dark:border-white/10 dark:bg-[#18181e] dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-white/25 transition-all"
          />
          {filters.search && (
            <button
              onClick={() => onChange('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Type Segmented Control */}
        <div className="flex p-1 bg-zinc-100 border border-zinc-200/80 rounded-xl shrink-0 dark:bg-[#18181e] dark:border-white/10 transition-colors overflow-x-auto">
          {[
            { value: '', label: 'All Types' },
            { value: 'expense', label: 'Expenses' },
            { value: 'income', label: 'Income' },
            { value: 'transfer', label: 'Transfers' },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => onChange('type', tab.value)}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filters.type === tab.value
                  ? 'bg-zinc-950 text-white shadow-xs dark:bg-white dark:text-zinc-950 dark:shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dropdown Filters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Bank Account Filter */}
        <div>
          <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
            Bank / Account
          </label>
          <select
            value={filters.accountId || ''}
            onChange={(e) => onChange('accountId', e.target.value)}
            className={selectClass}
          >
            <option value="" className={optionClass}>All Accounts (Combined)</option>
            {accounts.map((acc) => (
              <option key={acc._id} value={acc._id} className={optionClass}>
                {acc.bankName || acc.name} ({acc.type})
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
            Category
          </label>
          <select
            value={filters.categoryId || ''}
            onChange={(e) => onChange('categoryId', e.target.value)}
            className={selectClass}
          >
            <option value="" className={optionClass}>All Categories</option>
            {categories
              .filter((c) => !filters.type || c.type === filters.type)
              .map((cat) => (
                <option key={cat._id} value={cat._id} className={optionClass}>
                  {cat.name} ({cat.type})
                </option>
              ))}
          </select>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
            Payment Method
          </label>
          <select
            value={filters.paymentMethod || ''}
            onChange={(e) => onChange('paymentMethod', e.target.value)}
            className={selectClass}
          >
            <option value="" className={optionClass}>All Payment Methods</option>
            {PAYMENT_METHODS.map((pm) => (
              <option key={pm.value} value={pm.value} className={optionClass}>
                {pm.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date Filter Range */}
        <div>
          <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
            Date Range
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => onChange('startDate', e.target.value)}
              className={selectClass}
              title="From date"
            />
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => onChange('endDate', e.target.value)}
              className={selectClass}
              title="To date"
            />
          </div>
        </div>
      </div>

      {/* Advanced Filters: Amount Range & Tag Search */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
        {/* Min & Max Amount */}
        <div className="lg:col-span-2">
          <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
            Amount Range
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Min amount (0.00)"
              value={filters.minAmount || ''}
              onChange={(e) => onChange('minAmount', e.target.value)}
              className={selectClass}
            />
            <input
              type="number"
              placeholder="Max amount (e.g. 5000)"
              value={filters.maxAmount || ''}
              onChange={(e) => onChange('maxAmount', e.target.value)}
              className={selectClass}
            />
          </div>
        </div>

        {/* Tag Filter */}
        <div>
          <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
            Tag Filter
          </label>
          <input
            type="text"
            placeholder="e.g. vacation, bills"
            value={filters.tag || ''}
            onChange={(e) => onChange('tag', e.target.value)}
            className={selectClass}
          />
        </div>
      </div>

      {/* Reset Row */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-2.5 border-t border-zinc-100 dark:border-white/8 text-xs">
          <span className="text-zinc-500 dark:text-zinc-400 font-semibold flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Active filters applied</span>
          </span>
          <button
            onClick={onReset}
            type="button"
            className="flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset all filters
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionFilters;

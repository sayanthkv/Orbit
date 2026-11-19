import React from 'react';
import { Search, X, RotateCcw, Calendar, SlidersHorizontal } from 'lucide-react';
import { PAYMENT_METHODS } from '../../utils/constants';

export const TransactionFilters = ({
  filters,
  onChange,
  onReset,
  categories = [],
}) => {
  const hasActiveFilters = Boolean(
    filters.search ||
      filters.type ||
      filters.categoryId ||
      filters.paymentMethod ||
      filters.startDate ||
      filters.endDate
  );

  return (
    <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
      {/* Top Search & Type Control */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search notes or keywords..."
            value={filters.search || ''}
            onChange={(e) => onChange('search', e.target.value)}
            className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
          />
          {filters.search && (
            <button
              onClick={() => onChange('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Type Filter Segmented Control */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl shrink-0">
          {[
            { value: '', label: 'All' },
            { value: 'expense', label: 'Expenses' },
            { value: 'income', label: 'Income' },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => onChange('type', tab.value)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filters.type === tab.value
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dropdown Filters Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Category Selector */}
        <div>
          <select
            value={filters.categoryId || ''}
            onChange={(e) => onChange('categoryId', e.target.value)}
            className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500"
          >
            <option value="">All Categories</option>
            {categories
              .filter((c) => !filters.type || c.type === filters.type)
              .map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name} ({cat.type})
                </option>
              ))}
          </select>
        </div>

        {/* Payment Method Selector */}
        <div>
          <select
            value={filters.paymentMethod || ''}
            onChange={(e) => onChange('paymentMethod', e.target.value)}
            className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500"
          >
            <option value="">All Payment Methods</option>
            {PAYMENT_METHODS.map((pm) => (
              <option key={pm.value} value={pm.value}>
                {pm.label}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => onChange('startDate', e.target.value)}
            className="w-full px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500"
            title="Start date"
          />
        </div>

        {/* End Date */}
        <div>
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => onChange('endDate', e.target.value)}
            className="w-full px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500"
            title="End date"
          />
        </div>
      </div>

      {/* Active Filter Clear indicator */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-400 font-medium">
            Filters currently applied
          </span>
          <button
            onClick={onReset}
            type="button"
            className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
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

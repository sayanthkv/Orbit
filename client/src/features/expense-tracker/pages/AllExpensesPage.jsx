import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../lib/api';
import { formatCurrency, formatDate } from '../../../lib/formatters';
import Button from '../../../components/Button';
import Spinner from '../../../components/Spinner';
import Table from '../../../components/Table';
import EmptyState from '../../../components/EmptyState';
import MonthlyReportModal from '../../../components/MonthlyReportModal';
import { useToast } from '../../../components/Toast';
import {
  Receipt,
  Download,
  Filter,
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Landmark,
  Banknote,
  Tag,
  Paperclip,
  Repeat,
  Archive,
  ExternalLink,
} from 'lucide-react';

export const AllExpensesPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [source, setSource] = useState('all'); // 'all' | 'cash' | accountId
  const [category, setCategory] = useState('all');
  const [tag, setTag] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Metadata
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    Promise.all([
      api.get('/accounts?includeArchived=true'),
      api.get('/categories?type=expense'),
      api.get('/search/tags'),
    ]).then(([accRes, catRes, tagRes]) => {
      if (accRes.success) setAccounts(accRes.data?.accounts || []);
      if (catRes.success) setCategories(catRes.data?.categories || []);
      if (tagRes.success) setAvailableTags(tagRes.data?.tags || []);
    }).catch(() => {});
  }, []);

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 25,
        sortBy,
        sortOrder,
      };

      if (source !== 'all') params.source = source;
      if (category !== 'all') params.category = category;
      if (tag) params.tag = tag;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (minAmount) params.minAmount = minAmount;
      if (maxAmount) params.maxAmount = maxAmount;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/expenses', { params });
      if (res.success) {
        setExpenses(res.data.expenses || []);
        setTotalAmount(res.data.totalAmount || 0);
        setTotalCount(res.data.totalCount || 0);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [page, source, category, tag, startDate, endDate, minAmount, maxAmount, search, sortBy, sortOrder, toast]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSource('all');
    setCategory('all');
    setTag('');
    setMinAmount('');
    setMaxAmount('');
    setSearch('');
    setSortBy('date');
    setSortOrder('desc');
    setPage(1);
  };

  const columns = [
    {
      header: 'Category & Details',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold flex items-center justify-center shrink-0">
            <Receipt className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-zinc-900 dark:text-white truncate">
                {row.category}
              </span>
              {row.recurringRuleId && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center gap-1">
                  <Repeat className="w-2.5 h-2.5" /> Recurring
                </span>
              )}
              {row.attachment?.url && (
                <a
                  href={row.attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline"
                >
                  <Paperclip className="w-2.5 h-2.5" /> Receipt
                </a>
              )}
            </div>
            {row.note && (
              <p className="text-[11px] text-zinc-500 truncate max-w-xs">{row.note}</p>
            )}
            {row.tags?.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap mt-0.5">
                {row.tags.map((t) => (
                  <span key={t} className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Source / Institution',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          {row.sourceType === 'bank' ? (
            <Landmark className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          ) : (
            <Banknote className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          )}
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">
            {row.sourceName}
          </span>
          {row.isArchived && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-white/10 text-zinc-500 uppercase">
              Archived
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Date',
      accessor: (row) => (
        <span className="text-xs text-zinc-500 font-medium">
          {formatDate(row.date)}
        </span>
      ),
    },
    {
      header: 'Amount',
      className: 'text-right',
      accessor: (row) => (
        <span className="font-black tabular-nums font-mono text-rose-600 dark:text-rose-400">
          -{formatCurrency(row.amount)}
        </span>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight font-display">
            All Expenses
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Unified ledger across all bank accounts and cash in hand
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right pr-4 border-r border-zinc-200 dark:border-white/10">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              Filtered Total Outflow
            </span>
            <span className="text-base font-black tabular-nums font-mono text-rose-600 dark:text-rose-400">
              {formatCurrency(totalAmount)}
            </span>
          </div>

          <Button
            variant="outline"
            icon={Download}
            onClick={() => setIsReportModalOpen(true)}
            className="text-xs"
          >
            Export Statement
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-[#121216] border border-zinc-200/90 dark:border-white/10 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-emerald-600" /> Filter & Search
          </span>
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-white flex items-center gap-1 font-medium transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {/* Search by note */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search note or details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* Source Dropdown */}
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl font-bold"
          >
            <option value="all">All Sources</option>
            <option value="cash">Cash in Hand</option>
            {accounts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name} {a.isArchived ? '(Archived)' : ''}
              </option>
            ))}
          </select>

          {/* Category Dropdown */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl font-bold"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Tag Dropdown */}
          <select
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl font-bold"
          >
            <option value="">All Tags</option>
            {availableTags.map((t) => (
              <option key={t} value={t}>
                #{t}
              </option>
            ))}
          </select>

          {/* Date range */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="From Date"
            className="w-full px-3 py-2 text-xs bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl font-medium"
          />
        </div>
      </div>

      {/* Expenses Table */}
      {loading ? (
        <div className="p-16 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : expenses.length === 0 ? (
        <div className="bg-white dark:bg-[#121216] border border-zinc-200/90 dark:border-white/10 rounded-3xl p-12">
          <EmptyState
            icon={Receipt}
            title="No expense records found"
            description="Adjust your search filters or record a new expense to see it here."
            action={{
              label: 'Reset Filters',
              onClick: handleResetFilters,
            }}
          />
        </div>
      ) : (
        <div className="bg-white dark:bg-[#121216] border border-zinc-200/90 dark:border-white/10 rounded-3xl shadow-xs overflow-hidden">
          <Table columns={columns} data={expenses} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-zinc-100 dark:border-white/6 flex items-center justify-between text-xs text-zinc-500">
              <span>
                Showing page {page} of {totalPages} ({totalCount} total)
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  icon={ChevronLeft}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  icon={ChevronRight}
                  iconPosition="right"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Statement Export Modal */}
      <MonthlyReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
};

export default AllExpensesPage;

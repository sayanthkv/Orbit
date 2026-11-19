import React, { useState, useEffect, useCallback } from 'react';
import { transactionApi } from '../api/transactionApi';
import { categoryApi } from '../api/categoryApi';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';
import TransactionItem from '../components/transactions/TransactionItem';
import TransactionFilters from '../components/transactions/TransactionFilters';
import TransactionFormModal from '../components/transactions/TransactionFormModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import { TableSkeleton } from '../components/common/Skeleton';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Download,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';

export const TransactionsPage = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    total: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0,
  });

  const [filters, setFilters] = useState({
    search: '',
    type: '',
    categoryId: '',
    paymentMethod: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load categories
  const fetchCategories = async () => {
    try {
      const res = await categoryApi.getCategories();
      if (res && res.success) {
        setCategories(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  // Load transactions with filters
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await transactionApi.getTransactions(filters);
      if (res && res.success && res.data) {
        setTransactions(res.data.transactions || []);
        setPagination(
          res.data.pagination || {
            page: 1,
            limit: 10,
            totalPages: 1,
            total: 0,
            hasNextPage: false,
            hasPrevPage: false,
          }
        );
        setSummary(
          res.data.summary || {
            totalIncome: 0,
            totalExpense: 0,
            netBalance: 0,
          }
        );
      }
    } catch (err) {
      console.error('Transaction fetch error:', err);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Listen for transactions created globally via AppLayout
  useEffect(() => {
    const handleTransactionCreated = () => {
      fetchTransactions();
    };
    window.addEventListener('orbit:transaction-created', handleTransactionCreated);
    return () => {
      window.removeEventListener('orbit:transaction-created', handleTransactionCreated);
    };
  }, [fetchTransactions]);

  const handleExportCSV = () => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.type) params.append('type', filters.type);
    if (filters.categoryId) params.append('categoryId', filters.categoryId);

    const exportUrl = `${import.meta.env.VITE_API_URL || '/api'}/export/csv?${params.toString()}`;
    window.open(exportUrl, '_blank');
    toast.success('Downloading transactions CSV...');
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      type: '',
      categoryId: '',
      paymentMethod: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 10,
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleOpenCreate = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tx) => {
    setEditingTransaction(tx);
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      if (editingTransaction) {
        const res = await transactionApi.updateTransaction(editingTransaction._id, formData);
        if (res.success) {
          toast.success('Transaction updated!');
          setIsModalOpen(false);
          fetchTransactions();
        }
      } else {
        const res = await transactionApi.createTransaction(formData);
        if (res.success) {
          toast.success(res.message || 'Transaction recorded!');
          setIsModalOpen(false);
          fetchTransactions();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTransaction) return;
    try {
      setIsDeleting(true);
      const res = await transactionApi.deleteTransaction(deletingTransaction._id);
      if (res.success) {
        toast.success('Transaction deleted');
        setDeletingTransaction(null);
        fetchTransactions();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete transaction');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Transactions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Keep clear track of all your income, expenses, and cash flow
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={handleExportCSV}
            icon={Download}
            disabled={transactions.length === 0}
          >
            Export CSV
          </Button>
          <Button onClick={handleOpenCreate} icon={Plus} size="md">
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Total Inflow
            </span>
            <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              +{formatCurrency(summary.totalIncome, user?.currency)}
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Total Outflow
            </span>
            <p className="text-base sm:text-lg font-bold text-rose-600 dark:text-rose-400 mt-0.5">
              -{formatCurrency(summary.totalExpense, user?.currency)}
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Net Balance
            </span>
            <p
              className={`text-base sm:text-lg font-bold mt-0.5 ${
                summary.netBalance >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {summary.netBalance >= 0 ? '+' : ''}
              {formatCurrency(summary.netBalance, user?.currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <TransactionFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        categories={categories}
      />

      {/* Transactions Feed */}
      <div className="space-y-3">
        {loading ? (
          <TableSkeleton rows={6} />
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No transactions found"
            description={
              filters.search || filters.type || filters.categoryId || filters.startDate
                ? 'No transactions match your current search or filter criteria.'
                : 'Your ledger is fresh and clean! Record your first transaction to get started.'
            }
            actionLabel={
              filters.search || filters.type || filters.categoryId || filters.startDate
                ? 'Reset Filters'
                : 'Add Transaction'
            }
            onAction={
              filters.search || filters.type || filters.categoryId || filters.startDate
                ? handleResetFilters
                : handleOpenCreate
            }
          />
        ) : (
          <div className="space-y-2.5">
            {transactions.map((tx) => (
              <TransactionItem
                key={tx._id}
                transaction={tx}
                onEdit={handleOpenEdit}
                onDelete={setDeletingTransaction}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} records
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrevPage}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-700 dark:text-slate-300 px-2">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Transaction Modal */}
      <TransactionFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        categories={categories}
        initialData={editingTransaction}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingTransaction}
        title="Delete Transaction?"
        message={`Are you sure you want to delete this ${deletingTransaction?.type} of ${formatCurrency(
          deletingTransaction?.amount,
          user?.currency
        )}? This cannot be undone.`}
        confirmText="Delete"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingTransaction(null)}
      />
    </div>
  );
};

export default TransactionsPage;

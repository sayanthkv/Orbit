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
import { Plus, ChevronLeft, ChevronRight, Receipt, Download } from 'lucide-react';

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleExportCSV = () => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.type) params.append('type', filters.type);
    if (filters.categoryId) params.append('categoryId', filters.categoryId);

    const exportUrl = `${import.meta.env.VITE_API_URL || '/api'}/export/csv?${params.toString()}`;
    window.open(exportUrl, '_blank');
    toast.success('Downloading CSV export...');
  };

  // Load categories for selector
  const fetchCategories = async () => {
    try {
      const res = await categoryApi.getCategories();
      if (res.success) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  // Load transactions with current filters
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await transactionApi.getTransactions(filters);
      if (res.success) {
        setTransactions(res.data.transactions);
        setPagination(res.data.pagination);
        setSummary(res.data.summary);
      }
    } catch (err) {
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

  // Listen for global "orbit:open-add-transaction" event from sidebar or mobile plus button
  useEffect(() => {
    const handleGlobalAdd = () => {
      setEditingTransaction(null);
      setIsModalOpen(true);
    };
    window.addEventListener('orbit:open-add-transaction', handleGlobalAdd);
    return () => window.removeEventListener('orbit:open-add-transaction', handleGlobalAdd);
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // reset to page 1 on filter change
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Transactions
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Keep track of all your incoming and outgoing money flows
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

      {/* Filter and Search Bar */}
      <TransactionFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        categories={categories}
      />

      {/* Mini Summary Ribbon */}
      <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Total Income
          </span>
          <p className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            +{formatCurrency(summary.totalIncome, user?.currency)}
          </p>
        </div>
        <div className="border-x border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Total Expenses
          </span>
          <p className="text-sm sm:text-base font-bold text-rose-600 dark:text-rose-400 mt-0.5">
            -{formatCurrency(summary.totalExpense, user?.currency)}
          </p>
        </div>
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Net Flow
          </span>
          <p
            className={`text-sm sm:text-base font-bold mt-0.5 ${
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

      {/* Transactions Feed */}
      <div className="space-y-3">
        {loading ? (
          <TableSkeleton rows={6} />
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No transactions found"
            description={
              filters.search || filters.type || filters.categoryId
                ? 'No transactions match your current search or filter criteria.'
                : 'You have not added any transactions yet. Record your first expense or income to begin!'
            }
            actionLabel={
              filters.search || filters.type || filters.categoryId
                ? 'Clear Filters'
                : 'Add Transaction'
            }
            onAction={
              filters.search || filters.type || filters.categoryId
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
          <span className="text-slate-500 dark:text-slate-400">
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

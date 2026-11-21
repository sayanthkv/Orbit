import React, { useState, useEffect, useCallback } from 'react';
import { transactionApi } from '../api/transactionApi';
import { categoryApi } from '../api/categoryApi';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useAccounts } from '../context/AccountContext';
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
} from 'lucide-react';

export const TransactionsPage = () => {
  const { user } = useAuth();
  const { selectedAccountId, fetchAccounts } = useAccounts();
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
    accountId: selectedAccountId !== 'all' ? selectedAccountId : '',
    paymentMethod: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10,
  });

  // Sync with global account selector
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      accountId: selectedAccountId !== 'all' ? selectedAccountId : '',
      page: 1,
    }));
  }, [selectedAccountId]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
    toast.success('Downloading CSV...');
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
          toast.success('Updated successfully!');
          setIsModalOpen(false);
          fetchTransactions();
          fetchAccounts();
        }
      } else {
        const res = await transactionApi.createTransaction(formData);
        if (res.success) {
          toast.success(res.message || 'Saved successfully!');
          setIsModalOpen(false);
          fetchTransactions();
          fetchAccounts();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save');
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
        toast.success('Deleted successfully');
        setDeletingTransaction(null);
        fetchTransactions();
        fetchAccounts();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Expenses
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Track and manage your everyday spending
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
            Export
          </Button>
          <Button onClick={handleOpenCreate} icon={Plus} size="md">
            Add Expense
          </Button>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-white border border-zinc-200/90 shadow-sm dark:bg-[#111113] dark:border-white/8 text-center transition-colors">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            Total Spent
          </span>
          <p className="text-base sm:text-lg font-bold text-rose-600 dark:text-rose-400 mt-0.5">
            -{formatCurrency(summary.totalExpense, user?.currency)}
          </p>
        </div>
        <div className="border-x border-zinc-100 dark:border-white/8">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            Total Inflow
          </span>
          <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            +{formatCurrency(summary.totalIncome, user?.currency)}
          </p>
        </div>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            Net Flow
          </span>
          <p
            className={`text-base sm:text-lg font-bold mt-0.5 ${
              summary.netBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {summary.netBalance >= 0 ? '+' : ''}
            {formatCurrency(summary.netBalance, user?.currency)}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <TransactionFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        categories={categories}
      />

      {/* Transactions Feed */}
      <div className="space-y-2.5">
        {loading ? (
          <TableSkeleton rows={5} />
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No records found"
            description={
              filters.search || filters.type || filters.categoryId || filters.startDate
                ? 'No expenses match your search.'
                : 'No expenses recorded yet. Click below to add your first one!'
            }
            actionLabel={
              filters.search || filters.type || filters.categoryId || filters.startDate
                ? 'Reset Filters'
                : 'Add First Expense'
            }
            onAction={
              filters.search || filters.type || filters.categoryId || filters.startDate
                ? handleResetFilters
                : handleOpenCreate
            }
          />
        ) : (
          <div className="space-y-2">
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
        <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-white/8 text-xs">
          <span className="text-zinc-500 font-medium">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrevPage}
              className="p-2 rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed dark:border-white/10 dark:bg-[#1c1c20] dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
              className="p-2 rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed dark:border-white/10 dark:bg-[#1c1c20] dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      <TransactionFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        categories={categories}
        initialData={editingTransaction}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingTransaction}
        title="Delete Expense?"
        message={`Are you sure you want to delete this ${deletingTransaction?.type} of ${formatCurrency(
          deletingTransaction?.amount,
          user?.currency
        )}?`}
        confirmText="Delete"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingTransaction(null)}
      />
    </div>
  );
};

export default TransactionsPage;

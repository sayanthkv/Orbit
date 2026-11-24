import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../../lib/api';
import { formatCurrency, formatDate } from '../../../lib/formatters';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import Modal from '../../../components/Modal';
import ConfirmDialog from '../../../components/ConfirmDialog';
import Spinner from '../../../components/Spinner';
import Table from '../../../components/Table';
import EmptyState from '../../../components/EmptyState';
import ReceiptUpload from '../../../components/ReceiptUpload';
import { useToast } from '../../../components/Toast';
import {
  Landmark,
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Calendar,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Receipt,
  Paperclip,
  Repeat,
} from 'lucide-react';

export const AccountDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getUTCMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getUTCFullYear());

  const [account, setAccount] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Transaction Modal State (Add / Edit)
  const [txModal, setTxModal] = useState({
    isOpen: false,
    isEdit: false,
    txId: null,
  });
  const [txForm, setTxForm] = useState({
    type: 'expense',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
    tags: [],
    attachment: null,
  });
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Transaction State
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    txId: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    api.get('/categories')
      .then((res) => {
        if (res.success) setCategories(res.data?.categories || []);
      })
      .catch(() => {});
  }, []);

  const fetchAccountDetails = useCallback(async () => {
    try {
      const res = await api.get(`/accounts/${id}`, {
        params: { month: selectedMonth, year: selectedYear },
      });
      if (res.success) {
        setAccount(res.data.account);
        setMonthlyStats(res.data.monthlyStats);
      }
    } catch {
      toast.error('Failed to load account details');
      navigate('/tools/expense-tracker/accounts');
    }
  }, [id, selectedMonth, selectedYear, toast, navigate]);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (typeFilter !== 'all') params.type = typeFilter;
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.get(`/accounts/${id}/transactions`, { params });
      if (res.success) {
        setTransactions(res.data.transactions || []);
        setTransfers(res.data.transfers || []);
      }
    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [id, typeFilter, categoryFilter, search, toast]);

  useEffect(() => {
    fetchAccountDetails();
    fetchTransactions();
  }, [fetchAccountDetails, fetchTransactions]);

  const openAddModal = (initialType = 'expense') => {
    const cats = categories.filter((c) => c.type === initialType && !c.isHidden);
    setTxForm({
      type: initialType,
      amount: '',
      category: cats[0]?.name || 'Other',
      date: new Date().toISOString().split('T')[0],
      note: '',
      tags: [],
      attachment: null,
    });
    setTagInput('');
    setTxModal({ isOpen: true, isEdit: false, txId: null });
  };

  const openEditModal = (tx) => {
    setTxForm({
      type: tx.type,
      amount: tx.amount,
      category: tx.category,
      date: tx.date.split('T')[0],
      note: tx.note || '',
      tags: tx.tags || [],
      attachment: tx.attachment || null,
    });
    setTagInput('');
    setTxModal({ isOpen: true, isEdit: true, txId: tx._id });
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !txForm.tags.includes(trimmed)) {
      setTxForm({ ...txForm, tags: [...txForm.tags, trimmed] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (t) => {
    setTxForm({ ...txForm, tags: txForm.tags.filter((tag) => tag !== t) });
  };

  const handleTxSubmit = async (e) => {
    e.preventDefault();
    if (!txForm.amount || Number(txForm.amount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    try {
      setIsSubmitting(true);
      if (txModal.isEdit) {
        const res = await api.put(`/accounts/${id}/transactions/${txModal.txId}`, {
          type: txForm.type,
          amount: Number(txForm.amount),
          category: txForm.category,
          date: txForm.date,
          note: txForm.note,
          tags: txForm.tags,
          attachment: txForm.attachment,
        });
        if (res.success) {
          toast.success('Transaction updated!');
          setTxModal({ isOpen: false, isEdit: false, txId: null });
          fetchAccountDetails();
          fetchTransactions();
        }
      } else {
        const res = await api.post(`/accounts/${id}/transactions`, {
          type: txForm.type,
          amount: Number(txForm.amount),
          category: txForm.category,
          date: txForm.date,
          note: txForm.note,
          tags: txForm.tags,
          attachment: txForm.attachment,
        });
        if (res.success) {
          toast.success('Transaction recorded!');
          setTxModal({ isOpen: false, isEdit: false, txId: null });
          fetchAccountDetails();
          fetchTransactions();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteTx = async () => {
    try {
      setIsDeleting(true);
      const res = await api.delete(`/accounts/${id}/transactions/${deleteDialog.txId}`);
      if (res.success) {
        toast.success('Transaction deleted');
        setDeleteDialog({ isOpen: false, txId: null });
        fetchAccountDetails();
        fetchTransactions();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete transaction');
    } finally {
      setIsDeleting(false);
    }
  };

  // Combine transactions and transfers for unified ledger
  const unifiedEntries = [
    ...transactions.map((t) => ({ ...t, isTransfer: false })),
    ...transfers.map((tr) => ({ ...tr, isTransfer: true })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const columns = [
    {
      header: 'Category & Details',
      accessor: (row) => {
        if (row.isTransfer) {
          return (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold flex items-center justify-center shrink-0">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-cyan-600 dark:text-cyan-400 text-xs">
                  {row.transferDirection === 'in' ? 'Transfer In (Deposit)' : 'Transfer Out'}
                </span>
                <p className="text-[11px] text-zinc-500">{row.note}</p>
              </div>
            </div>
          );
        }

        const isIncome = row.type === 'income';
        return (
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center shrink-0 ${
                isIncome
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}
            >
              {isIncome ? '+' : '-'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-zinc-900 dark:text-white truncate">
                  {row.category}
                </span>
                {row.recurringRuleId && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 flex items-center gap-1">
                    <Repeat className="w-2.5 h-2.5" /> Recurring
                  </span>
                )}
                {row.attachment?.url && (
                  <a
                    href={row.attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center gap-1 hover:underline"
                  >
                    <Paperclip className="w-2.5 h-2.5" /> Receipt
                  </a>
                )}
              </div>
              {row.note && <p className="text-[11px] text-zinc-500 truncate max-w-xs">{row.note}</p>}
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
        );
      },
    },
    {
      header: 'Date',
      accessor: (row) => (
        <span className="text-xs text-zinc-500 font-medium">{formatDate(row.date)}</span>
      ),
    },
    {
      header: 'Amount',
      className: 'text-right',
      accessor: (row) => {
        if (row.isTransfer) {
          const isIn = row.transferDirection === 'in';
          return (
            <span className={`font-black tabular-nums font-mono text-cyan-600 dark:text-cyan-400`}>
              {isIn ? '+' : '-'}{formatCurrency(row.amount)}
            </span>
          );
        }

        const isIncome = row.type === 'income';
        return (
          <span
            className={`font-black tabular-nums font-mono ${
              isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {isIncome ? '+' : '-'}{formatCurrency(row.amount)}
          </span>
        );
      },
    },
    {
      header: '',
      className: 'text-right',
      accessor: (row) => {
        if (row.isTransfer) return null;
        return (
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => openEditModal(row)}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDeleteDialog({ isOpen: true, txId: row._id })}
              className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Return to Accounts */}
      <Link
        to="/tools/expense-tracker/accounts"
        className="inline-flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Accounts</span>
      </Link>

      {/* Account Hero Summary Card */}
      {account && (
        <div className="bg-white dark:bg-[#121216] border border-zinc-200/90 dark:border-white/10 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight font-display">
                  {account.name}
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 uppercase">
                  {account.type}
                </span>
                {account.isArchived && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 uppercase">
                    Archived
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Initial Opening: {formatCurrency(account.openingBalance)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Current Live Balance
              </span>
              <span className="text-2xl sm:text-3xl font-black tabular-nums font-mono text-zinc-900 dark:text-white">
                {formatCurrency(account.currentBalance)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => openAddModal('expense')}
                className="shadow-sm shadow-emerald-600/20 text-xs"
              >
                Add Transaction
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Unified Transactions & Transfers Table */}
      <div className="bg-white dark:bg-[#121216] border border-zinc-200/90 dark:border-white/10 rounded-3xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-white/6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white font-display">
            Account Activity & Transfers
          </h2>
          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl font-bold"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-16 flex justify-center">
            <Spinner size="lg" />
          </div>
        ) : unifiedEntries.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={Receipt}
              title="No transactions yet"
              description="Record income, expense, or transfers on this bank account."
              action={{
                label: 'Add First Transaction',
                onClick: () => openAddModal('expense'),
              }}
            />
          </div>
        ) : (
          <Table columns={columns} data={unifiedEntries} />
        )}
      </div>

      {/* Add / Edit Transaction Modal */}
      <Modal
        isOpen={txModal.isOpen}
        onClose={() => setTxModal({ isOpen: false, isEdit: false, txId: null })}
        title={txModal.isEdit ? 'Edit Transaction' : `Add ${txForm.type === 'income' ? 'Income' : 'Expense'}`}
        description={`Record entry against ${account?.name || 'this account'}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleTxSubmit} className="space-y-4">
          <div className="flex p-1 bg-zinc-100 dark:bg-white/5 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                const cats = categories.filter((c) => c.type === 'expense' && !c.isHidden);
                setTxForm({ ...txForm, type: 'expense', category: cats[0]?.name || 'Other' });
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                txForm.type === 'expense' ? 'bg-rose-600 text-white shadow-xs' : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => {
                const cats = categories.filter((c) => c.type === 'income' && !c.isHidden);
                setTxForm({ ...txForm, type: 'income', category: cats[0]?.name || 'Other' });
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                txForm.type === 'income' ? 'bg-emerald-600 text-white shadow-xs' : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              Income
            </button>
          </div>

          <Input
            label="Amount (INR)"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="0.00"
            value={txForm.amount}
            onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
          />

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Category
            </label>
            <select
              value={txForm.category}
              onChange={(e) => setTxForm({ ...txForm, category: e.target.value })}
              required
              className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 font-bold"
            >
              {categories.filter((c) => c.type === txForm.type && !c.isHidden).map((c) => (
                <option key={c._id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Date"
              type="date"
              required
              value={txForm.date}
              onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
            />
            <Input
              label="Note / Reference"
              placeholder="e.g. Electricity bill, Project advance"
              value={txForm.note}
              onChange={(e) => setTxForm({ ...txForm, note: e.target.value })}
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Tags
            </label>
            <div className="flex items-center gap-2">
              <Input
                placeholder="e.g. food, office, trip"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddTag}>
                Add
              </Button>
            </div>
            {txForm.tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {txForm.tags.map((t) => (
                  <span
                    key={t}
                    onClick={() => handleRemoveTag(t)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 cursor-pointer"
                  >
                    #{t} ×
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Receipt Upload */}
          <ReceiptUpload
            value={txForm.attachment}
            onChange={(att) => setTxForm({ ...txForm, attachment: att })}
            disabled={isSubmitting}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setTxModal({ isOpen: false, isEdit: false, txId: null })}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {txModal.isEdit ? 'Save Changes' : 'Record Entry'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, txId: null })}
        onConfirm={confirmDeleteTx}
        title="Delete Transaction"
        message="Are you sure you want to remove this transaction? The account balance will be automatically adjusted."
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default AccountDetailPage;

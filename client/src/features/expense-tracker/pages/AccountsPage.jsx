import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../lib/api';
import { formatCurrency } from '../../../lib/formatters';
import { ACCOUNT_TYPES } from '../../../lib/constants';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import Modal from '../../../components/Modal';
import ConfirmDialog from '../../../components/ConfirmDialog';
import Spinner from '../../../components/Spinner';
import EmptyState from '../../../components/EmptyState';
import ParallaxSection from '../../../components/parallax/ParallaxSection';
import ParallaxCard from '../../../components/parallax/ParallaxCard';
import { useToast } from '../../../components/Toast';
import {
  Landmark,
  Plus,
  ArrowRight,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  Archive,
  ArchiveRestore,
} from 'lucide-react';

export const AccountsPage = () => {
  const [activeAccounts, setActiveAccounts] = useState([]);
  const [archivedAccounts, setArchivedAccounts] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Create / Edit Modal State
  const [modalState, setModalState] = useState({
    isOpen: false,
    isEdit: false,
    accountId: null,
  });
  const [formData, setFormData] = useState({
    name: '',
    type: 'Savings',
    openingBalance: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Dialog State
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    accountId: null,
    accountName: '',
    deleteTransactions: true,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/accounts?includeArchived=true');
      if (res.success) {
        setActiveAccounts(res.data.activeAccounts || []);
        setArchivedAccounts(res.data.archivedAccounts || []);
        setTotalBalance(res.data.totalBankBalance || 0);
      }
    } catch {
      toast.error('Failed to load bank accounts');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const openCreateModal = () => {
    setFormData({ name: '', type: 'Savings', openingBalance: '' });
    setModalState({ isOpen: true, isEdit: false, accountId: null });
  };

  const openEditModal = (acc) => {
    setFormData({
      name: acc.name,
      type: acc.type,
      openingBalance: acc.openingBalance,
    });
    setModalState({ isOpen: true, isEdit: true, accountId: acc._id });
  };

  const handleArchiveToggle = async (acc) => {
    if (!acc.isArchived && activeAccounts.length <= 1) {
      toast.error('Cannot archive this account. You must have at least one active bank account.');
      return;
    }

    try {
      const res = await api.patch(`/accounts/${acc._id}/archive`);
      if (res.success) {
        toast.success(res.message);
        fetchAccounts();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update account archive status');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Account name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      if (modalState.isEdit) {
        const res = await api.put(`/accounts/${modalState.accountId}`, {
          name: formData.name.trim(),
          type: formData.type,
          openingBalance: Number(formData.openingBalance) || 0,
        });
        if (res.success) {
          toast.success('Account updated successfully!');
          setModalState({ isOpen: false, isEdit: false, accountId: null });
          fetchAccounts();
        }
      } else {
        const res = await api.post('/accounts', {
          name: formData.name.trim(),
          type: formData.type,
          openingBalance: Number(formData.openingBalance) || 0,
        });
        if (res.success) {
          toast.success('Account added successfully!');
          setModalState({ isOpen: false, isEdit: false, accountId: null });
          fetchAccounts();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      const res = await api.delete(
        `/accounts/${deleteDialog.accountId}?deleteTransactions=${deleteDialog.deleteTransactions}`
      );
      if (res.success) {
        toast.success(res.message || 'Account deleted');
        setDeleteDialog({ isOpen: false, accountId: null, accountName: '', deleteTransactions: true });
        fetchAccounts();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Top Section */}
      <ParallaxSection depth={-12}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight font-display">
              Bank Accounts
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Manage your liquid bank accounts, salary accounts, and balances
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right pr-4 border-r border-zinc-200 dark:border-white/10">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Total Active Bank Balance
              </span>
              <span className="text-base font-black tabular-nums font-mono text-zinc-900 dark:text-white">
                {formatCurrency(totalBalance)}
              </span>
            </div>

            <Button
              variant="primary"
              icon={Plus}
              onClick={openCreateModal}
              className="shadow-sm shadow-emerald-600/20"
            >
              Add Account
            </Button>
          </div>
        </div>
      </ParallaxSection>

      {/* Active Accounts Grid */}
      {activeAccounts.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="No bank accounts yet"
          description="Create your first bank account to begin tracking deposits, withdrawals, and balances."
          action={{
            label: 'Add First Bank Account',
            onClick: openCreateModal,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeAccounts.map((acc) => (
            <ParallaxCard
              key={acc._id}
              depth={12}
              className="group relative bg-white/90 dark:bg-[#141418]/90 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 rounded-3xl p-5 shadow-xs transition-all hover:shadow-xl flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 flex items-center justify-center text-zinc-700 dark:text-zinc-300 group-hover:bg-emerald-500/10 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-zinc-900 dark:text-white tracking-tight truncate max-w-[150px] font-display">
                        {acc.name}
                      </h3>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                        {acc.type} Account
                      </span>
                    </div>
                  </div>

                  {/* Actions Dropdown / Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(acc)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      title="Edit Account"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleArchiveToggle(acc)}
                      className="p-1.5 text-zinc-400 hover:text-amber-600 rounded-lg hover:bg-amber-500/10 transition-colors cursor-pointer"
                      title="Archive Account"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteDialog({
                          isOpen: true,
                          accountId: acc._id,
                          accountName: acc.name,
                          deleteTransactions: true,
                        })
                      }
                      className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                      title="Delete Account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Available Balance
                  </span>
                  <div className="text-2xl font-black tabular-nums font-mono text-zinc-900 dark:text-white tracking-tight">
                    {formatCurrency(acc.currentBalance)}
                  </div>
                </div>

                {/* Sub statistics */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100 dark:border-white/6 text-[11px]">
                  <div>
                    <span className="text-zinc-500 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Income
                    </span>
                    <span className="font-bold tabular-nums font-mono text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(acc.totalIncome)}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 flex items-center gap-1">
                      <TrendingDown className="w-3 h-3 text-rose-600 dark:text-rose-400" /> Expense
                    </span>
                    <span className="font-bold tabular-nums font-mono text-rose-600 dark:text-rose-400">
                      -{formatCurrency(acc.totalExpense)}
                    </span>
                  </div>
                </div>
              </div>

              {/* View Details Link */}
              <div className="pt-4 mt-3 border-t border-zinc-100 dark:border-white/6">
                <Link
                  to={`/tools/expense-tracker/accounts/${acc._id}`}
                  className="flex items-center justify-between text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 group/link"
                >
                  <span>View Statement & Transactions</span>
                  <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            </ParallaxCard>
          ))}
        </div>
      )}

      {/* Archived Accounts Section */}
      {archivedAccounts.length > 0 && (
        <div className="pt-6 space-y-3">
          <div className="flex items-center gap-2">
            <Archive className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
              Archived Accounts ({archivedAccounts.length})
            </h2>
          </div>
          <p className="text-xs text-zinc-500">
            Archived accounts are hidden from pickers and dashboard balance totals. Their transaction history remains intact.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {archivedAccounts.map((acc) => (
              <div
                key={acc._id}
                className="p-4 rounded-2xl bg-zinc-100/60 dark:bg-white/3 border border-zinc-200/60 dark:border-white/6 flex items-center justify-between gap-3 opacity-80 hover:opacity-100 transition-opacity"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                      {acc.name}
                    </span>
                    <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-white/10 text-zinc-600 dark:text-zinc-400 uppercase">
                      Archived
                    </span>
                  </div>
                  <p className="text-xs font-bold tabular-nums font-mono text-zinc-500 mt-0.5">
                    {formatCurrency(acc.currentBalance)}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  icon={ArchiveRestore}
                  onClick={() => handleArchiveToggle(acc)}
                  className="text-xs shrink-0"
                >
                  Restore
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Account Modal */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, isEdit: false, accountId: null })}
        title={modalState.isEdit ? 'Edit Bank Account' : 'Add Bank Account'}
        description={
          modalState.isEdit
            ? 'Update account information and initial balance'
            : 'Add a new bank account or institutional source'
        }
        maxWidth="max-w-md"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Input
            label="Account / Institution Name"
            placeholder="e.g. HDFC Bank, SBI, ICICI"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Account Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 font-bold"
            >
              {ACCOUNT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Opening / Current Available Balance (INR)"
            type="number"
            step="0.01"
            placeholder="0.00"
            required
            value={formData.openingBalance}
            onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalState({ isOpen: false, isEdit: false, accountId: null })}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {modalState.isEdit ? 'Save Changes' : 'Create Account'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() =>
          setDeleteDialog({ isOpen: false, accountId: null, accountName: '', deleteTransactions: true })
        }
        onConfirm={confirmDelete}
        title="Delete Bank Account"
        message={`Are you sure you want to delete "${deleteDialog.accountName}"? You can choose whether to also remove all associated transactions.`}
        confirmText="Delete Account"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default AccountsPage;

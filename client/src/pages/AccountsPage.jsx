import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAccounts } from '../context/AccountContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { accountApi } from '../api/accountApi';
import { transactionApi } from '../api/transactionApi';
import { categoryApi } from '../api/categoryApi';
import { formatCurrency } from '../utils/formatters';
import AccountCard from '../components/accounts/AccountCard';
import AccountFormModal from '../components/accounts/AccountFormModal';
import TransactionItem from '../components/transactions/TransactionItem';
import TransactionFormModal from '../components/transactions/TransactionFormModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import {
  Plus,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Wallet,
  Building,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  Banknote,
  PiggyBank,
  Edit2,
  PieChart,
} from 'lucide-react';

const ACCOUNT_ICONS = {
  bank: Building,
  cash: Banknote,
  card: CreditCard,
  savings: PiggyBank,
  wallet: Wallet,
  other: Layers,
};

export const AccountsPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const currency = user?.currency || 'INR';

  const {
    accounts,
    combinedSummary,
    selectedAccountId,
    selectedAccount,
    selectAccount,
    fetchAccounts,
    loadingAccounts,
  } = useAccounts();

  // Transactions list state
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [categories, setCategories] = useState([]);

  // Account modal states
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [deletingAccount, setDeletingAccount] = useState(null);
  const [isSubmittingAccount, setIsSubmittingAccount] = useState(false);

  // Transaction modal states
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [modalDefaultType, setModalDefaultType] = useState('expense');
  const [editingTx, setEditingTx] = useState(null);
  const [deletingTx, setDeletingTx] = useState(null);
  const [isSubmittingTx, setIsSubmittingTx] = useState(false);

  // Smooth transaction fetch without layout jumps
  const fetchTransactions = useCallback(async () => {
    try {
      setLoadingTx(true);
      const accId = selectedAccountId && selectedAccountId !== 'all' ? selectedAccountId : accounts[0]?._id;
      const params = {
        limit: 30,
        accountId: accId || undefined,
      };
      const res = await transactionApi.getTransactions(params);
      if (res && res.success && res.data) {
        setTransactions(res.data.transactions || []);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoadingTx(false);
    }
  }, [selectedAccountId, accounts]);

  // Load categories
  useEffect(() => {
    categoryApi.getCategories().then((res) => {
      if (res?.success) setCategories(res.data || []);
    });
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Account Handlers
  const handleOpenCreateAccount = () => {
    setEditingAccount(null);
    setIsAccountModalOpen(true);
  };

  const handleOpenEditAccount = (acc) => {
    setEditingAccount(acc);
    setIsAccountModalOpen(true);
  };

  const handleSubmitAccount = async (formData) => {
    try {
      setIsSubmittingAccount(true);
      if (editingAccount) {
        const res = await accountApi.updateAccount(editingAccount._id, formData);
        if (res?.success) {
          toast.success('Account updated successfully!');
          fetchAccounts();
          setIsAccountModalOpen(false);
        }
      } else {
        const res = await accountApi.createAccount(formData);
        if (res?.success) {
          toast.success('Bank account added successfully!');
          fetchAccounts();
          setIsAccountModalOpen(false);
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save account';
      toast.error(msg);
    } finally {
      setIsSubmittingAccount(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletingAccount) return;
    try {
      const res = await accountApi.deleteAccount(deletingAccount._id);
      if (res?.success) {
        toast.success('Account removed successfully');
        if (selectedAccountId === deletingAccount._id) {
          selectAccount('all');
        }
        fetchAccounts();
        setDeletingAccount(null);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Cannot delete account with transactions';
      toast.error(msg);
      setDeletingAccount(null);
    }
  };

  // Transaction Handlers
  const handleSubmitTx = async (formData) => {
    try {
      setIsSubmittingTx(true);
      const payload = {
        ...formData,
        account: formData.account || (selectedAccountId !== 'all' ? selectedAccountId : undefined),
      };
      if (editingTx) {
        await transactionApi.updateTransaction(editingTx._id, payload);
        toast.success('Transaction updated');
      } else {
        await transactionApi.createTransaction(payload);
        toast.success('Transaction recorded');
      }
      setIsTxModalOpen(false);
      setEditingTx(null);
      fetchTransactions();
      fetchAccounts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record transaction');
    } finally {
      setIsSubmittingTx(false);
    }
  };

  const handleDeleteTx = async () => {
    if (!deletingTx) return;
    try {
      await transactionApi.deleteTransaction(deletingTx._id);
      toast.success('Transaction deleted');
      setDeletingTx(null);
      fetchTransactions();
      fetchAccounts();
    } catch (err) {
      toast.error('Failed to delete transaction');
      setDeletingTx(null);
    }
  };

  const isAllSelected = selectedAccountId === 'all';
  const totalNetWorth = combinedSummary.totalNetWorth || 0;
  const activeIcon = selectedAccount
    ? ACCOUNT_ICONS[selectedAccount.type] || Building
    : Layers;
  const ActiveIconComponent = activeIcon;
  const activeThemeColor = selectedAccount?.color || '#10B981';

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16 max-w-6xl mx-auto">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 dark:text-white tracking-tight flex items-center gap-2.5">
            <span>Accounts & Institutions</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 dark:bg-white/[0.08] dark:text-zinc-300">
              {accounts.length} Active
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
            Manage your bank accounts, cards, and cash wallets with dedicated and combined tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setEditingTx(null);
              setModalDefaultType('expense');
              setIsTxModalOpen(true);
            }}
            className="text-xs font-bold"
          >
            <Receipt className="w-3.5 h-3.5 mr-1.5" />
            Quick Entry
          </Button>

          <Button
            variant="primary"
            onClick={handleOpenCreateAccount}
            className="text-xs font-bold"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5 stroke-[2.5]" />
            New Bank Account
          </Button>
        </div>
      </div>

      {/* DEDICATED COMBINED PORTFOLIO BANNER (View-only on separate page) */}
      <div className="relative overflow-hidden rounded-3xl p-5 sm:p-7 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 text-white border border-zinc-800 shadow-md dark:border-white/10 dark:from-[#131318] dark:via-[#16161d] dark:to-[#111115] transition-all">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
              <Layers className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Combined Portfolio & Multi-Account Overview
                </h3>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {accounts.length} Accounts Connected
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 max-w-xl font-normal leading-relaxed">
                View your aggregated net worth ({formatCurrency(totalNetWorth, currency)}), asset distribution across institutions, and unified multi-account transaction ledger in a dedicated view-only dashboard.
              </p>
            </div>
          </div>

          <Link
            to="/accounts/combined"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white text-zinc-950 hover:bg-zinc-100 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 text-xs sm:text-sm font-bold shadow-md active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            <span>Open Combined View</span>
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
          </Link>
        </div>
      </div>

      {/* DEDICATED BANK ACCOUNTS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-zinc-950 dark:text-white tracking-tight">
              Bank Accounts & Cards ({accounts.length})
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              Click any card to track its dedicated transaction history below.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenCreateAccount}
            className="text-xs font-bold"
          >
            <Plus className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />
            Add Account
          </Button>
        </div>

        {/* Account Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => (
            <AccountCard
              key={acc._id}
              account={acc}
              isSelected={selectedAccountId === acc._id}
              onSelect={() => selectAccount(acc._id)}
              onEdit={handleOpenEditAccount}
              onDelete={accounts.length > 1 ? setDeletingAccount : null}
            />
          ))}

          {/* Add Another Account Card */}
          <button
            type="button"
            onClick={handleOpenCreateAccount}
            className="flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-white/10 hover:border-zinc-400 dark:hover:border-white/25 hover:bg-zinc-50 dark:hover:bg-white/[0.02] text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-all cursor-pointer min-h-[170px]"
          >
            <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-white/[0.06] flex items-center justify-center mb-2">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-sm font-bold">Add Another Bank Account</span>
            <span className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
              Chase, HDFC, SBI, Cash, Credit Card
            </span>
          </button>
        </div>
      </div>

      {/* DEDICATED TRANSACTION LEDGER SECTION */}
      <div className="space-y-4 pt-2">
        {/* Ledger Header & Account Switcher Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-zinc-950 dark:text-white tracking-tight flex items-center gap-2">
              <Receipt className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              <span>{selectedAccount?.bankName || selectedAccount?.name || 'Account'} Ledger</span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              Showing transaction records specifically linked to {selectedAccount?.bankName || selectedAccount?.name || 'this account'}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingTx(null);
                setModalDefaultType('expense');
                setIsTxModalOpen(true);
              }}
              className="text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />
              Log Transaction
            </Button>
          </div>
        </div>

        {/* Ledger Filter Tabs (Dedicated Account Selection) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {accounts.map((acc) => {
            const isSelected = selectedAccountId === acc._id || (!selectedAccountId && accounts[0]?._id === acc._id);
            return (
              <button
                key={acc._id}
                type="button"
                onClick={() => selectAccount(acc._id)}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-950 text-white shadow-xs dark:bg-white dark:text-zinc-950'
                    : 'bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-950 dark:bg-[#18181e] dark:border-white/10 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: acc.color || '#10B981' }}
                />
                <span>{acc.bankName || acc.name}</span>
              </button>
            );
          })}
        </div>

        {/* Transactions list with smooth opacity transition */}
        <div
          className={`space-y-2 transition-opacity duration-300 ${
            loadingTx ? 'opacity-60' : 'opacity-100'
          }`}
        >
          {transactions.length > 0 ? (
            transactions.map((tx) => (
              <TransactionItem
                key={tx._id}
                transaction={tx}
                onEdit={(item) => {
                  setEditingTx(item);
                  setIsTxModalOpen(true);
                }}
                onDelete={(item) => setDeletingTx(item)}
              />
            ))
          ) : !loadingTx ? (
            <div className="bg-white dark:bg-[#111114] border border-zinc-200/90 dark:border-white/8 rounded-2xl p-8 text-center animate-fade-in">
              <EmptyState
                title={isAllSelected ? 'No transactions recorded yet' : `No entries for ${selectedAccount?.bankName || selectedAccount?.name}`}
                description="Record income or expenses to track balance changes in this account."
                actionLabel="Log Transaction"
                onAction={() => {
                  setEditingTx(null);
                  setIsTxModalOpen(true);
                }}
              />
            </div>
          ) : (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800/40 animate-pulse"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Account Modal */}
      <AccountFormModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSubmit={handleSubmitAccount}
        initialData={editingAccount}
        isLoading={isSubmittingAccount}
      />

      {/* Delete Account Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingAccount)}
        onClose={() => setDeletingAccount(null)}
        onConfirm={handleDeleteAccount}
        title="Delete Bank Account?"
        message={`Are you sure you want to remove "${deletingAccount?.name}"? You can only delete an account if it has no associated transactions.`}
        confirmText="Delete Account"
        confirmVariant="danger"
      />

      {/* Transaction Modal */}
      <TransactionFormModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTx(null);
        }}
        onSubmit={handleSubmitTx}
        categories={categories}
        initialData={editingTx}
        defaultType={modalDefaultType}
        isLoading={isSubmittingTx}
      />

      {/* Delete Transaction Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingTx)}
        onClose={() => setDeletingTx(null)}
        onConfirm={handleDeleteTx}
        title="Delete Transaction?"
        message="Are you sure you want to delete this transaction record? This action cannot be undone."
        confirmText="Delete Record"
        confirmVariant="danger"
      />
    </div>
  );
};

export default AccountsPage;

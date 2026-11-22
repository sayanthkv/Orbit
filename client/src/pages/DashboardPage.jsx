import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { analyticsApi } from '../api/analyticsApi';
import { transactionApi } from '../api/transactionApi';
import { categoryApi } from '../api/categoryApi';
import { useAuth } from '../context/AuthContext';
import { useAccounts } from '../context/AccountContext';
import { useToast } from '../context/ToastContext';
import MonthSelector from '../components/dashboard/MonthSelector';
import HeroBalanceCard from '../components/dashboard/HeroBalanceCard';
import SafeToSpendCard from '../components/dashboard/SafeToSpendCard';
import BalanceModal from '../components/dashboard/BalanceModal';
import CategoryDonutChart from '../components/dashboard/CategoryDonutChart';
import SpendingTrendChart from '../components/dashboard/SpendingTrendChart';
import CashflowTrendChart from '../components/dashboard/CashflowTrendChart';
import TransactionItem from '../components/transactions/TransactionItem';
import TransactionFormModal from '../components/transactions/TransactionFormModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Button from '../components/common/Button';
import { CardSkeleton, TableSkeleton } from '../components/common/Skeleton';
import {
  Plus,
  ArrowRight,
  Receipt,
  Layers,
} from 'lucide-react';

export const DashboardPage = () => {
  const { user, refreshUser } = useAuth();
  const {
    accounts,
    activeDashboardAccountId,
    activeDashboardAccount,
    selectDashboardAccount,
    fetchAccounts,
  } = useAccounts();
  const toast = useToast();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [summary, setSummary] = useState({});
  const [breakdownType, setBreakdownType] = useState('expense');
  const [breakdown, setBreakdown] = useState({ items: [], totalSum: 0 });
  const [trends, setTrends] = useState({ dailyTrend: [], sixMonthsTrend: [] });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Balance modal & alert confirmation states
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [isEditAlertOpen, setIsEditAlertOpen] = useState(false);

  // Transaction Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaultType, setModalDefaultType] = useState('expense');
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Dynamic time greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const accId = activeDashboardAccountId || undefined;
      const [sumRes, breakRes, trendRes, txRes, catRes] = await Promise.all([
        analyticsApi.getSummary(selectedMonth, selectedYear, accId),
        analyticsApi.getCategoryBreakdown(selectedMonth, selectedYear, breakdownType, accId),
        analyticsApi.getTrends(selectedMonth, selectedYear, accId),
        transactionApi.getTransactions({ limit: 8, accountId: accId }),
        categoryApi.getCategories(),
      ]);

      if (sumRes?.success) setSummary(sumRes.data || {});
      if (breakRes?.success) setBreakdown(breakRes.data || { items: [], totalSum: 0 });
      if (trendRes?.success) setTrends(trendRes.data || { dailyTrend: [], sixMonthsTrend: [] });
      if (txRes?.success) setRecentTransactions(txRes.data?.transactions || []);
      if (catRes?.success) setCategories(catRes.data || []);
    } catch (err) {
      console.error('Dashboard load error', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, breakdownType, activeDashboardAccountId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    const handleTransactionCreated = () => {
      loadDashboardData();
      fetchAccounts();
      if (refreshUser) refreshUser();
    };
    window.addEventListener('orbit:transaction-created', handleTransactionCreated);
    return () => {
      window.removeEventListener('orbit:transaction-created', handleTransactionCreated);
    };
  }, [loadDashboardData, fetchAccounts, refreshUser]);

  const handleMonthChange = (m, y) => {
    setSelectedMonth(m);
    setSelectedYear(y);
  };

  const handleInitiateEditBalance = () => {
    setIsEditAlertOpen(true);
  };

  const handleConfirmEditAlert = () => {
    setIsEditAlertOpen(false);
    setIsBalanceModalOpen(true);
  };

  const handleOpenSetInitialBalance = () => {
    setIsBalanceModalOpen(true);
  };

  const handleBalanceUpdated = () => {
    loadDashboardData();
    fetchAccounts();
    if (refreshUser) refreshUser();
  };

  const handleOpenAddExpense = () => {
    setEditingTransaction(null);
    setModalDefaultType('expense');
    setIsModalOpen(true);
  };

  const handleOpenAddIncome = () => {
    setEditingTransaction(null);
    setModalDefaultType('income');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tx) => {
    setEditingTransaction(tx);
    setModalDefaultType(tx.type || 'expense');
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        account: formData.account || activeDashboardAccountId || undefined,
      };
      if (editingTransaction) {
        const res = await transactionApi.updateTransaction(editingTransaction._id, payload);
        if (res.success) {
          toast.success('Updated successfully!');
          setIsModalOpen(false);
          loadDashboardData();
          fetchAccounts();
        }
      } else {
        const res = await transactionApi.createTransaction(payload);
        if (res.success) {
          toast.success(res.message || 'Saved successfully!');
          setIsModalOpen(false);
          loadDashboardData();
          fetchAccounts();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save');
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
        loadDashboardData();
        fetchAccounts();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredRecent = selectedCategoryFilter
    ? recentTransactions.filter((tx) => tx.category?._id === selectedCategoryFilter || tx.category?.name === selectedCategoryFilter)
    : recentTransactions;

  return (
    <div className="space-y-5 sm:space-y-6 max-w-4xl mx-auto pb-6">
      {/* Top Header: Greeting + Avatar + Month selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-200 border border-zinc-300 text-zinc-900 dark:bg-[#28282d] dark:border-white/15 dark:text-zinc-200 font-black text-sm flex items-center justify-center shadow-xs">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-medium">
              {getGreeting()}! 👋
            </p>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight">
              {user?.name || 'My Finances'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <MonthSelector
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onChange={handleMonthChange}
          />
        </div>
      </div>

      {/* Dedicated Account Switcher on Home Page */}
      {accounts.length > 0 && (
        <div className="flex items-center justify-between gap-2.5 bg-white border border-zinc-200/90 dark:bg-[#141418] dark:border-white/10 rounded-2xl p-2 sm:p-2.5 shadow-xs transition-all">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1">
            {accounts.map((acc) => {
              const isActive = activeDashboardAccountId === acc._id;
              return (
                <button
                  key={acc._id}
                  onClick={() => selectDashboardAccount(acc._id)}
                  type="button"
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-zinc-950 text-white shadow-xs dark:bg-white dark:text-zinc-950'
                      : 'bg-zinc-100 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/70 dark:bg-white/[0.05] dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/[0.1]'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: acc.color || '#10b981' }}
                  />
                  <span>{acc.bankName || acc.name}</span>
                  {acc.accountNumber && (
                    <span className={`text-[10px] font-normal ${isActive ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400 dark:text-zinc-500'}`}>
                      ••{acc.accountNumber.slice(-4)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <Link
            to="/accounts"
            className="text-xs font-bold text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white shrink-0 px-2.5 py-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors"
            title="Manage Accounts"
          >
            All Accounts →
          </Link>
        </div>
      )}

      {/* Balance Card (Strictly reflects the selected single account) */}
      {loading ? (
        <CardSkeleton className="h-56 rounded-3xl" />
      ) : (
        <>
          <HeroBalanceCard
            summary={summary}
            selectedAccount={activeDashboardAccount}
            onAddExpense={handleOpenAddExpense}
            onAddIncome={handleOpenAddIncome}
            onEditBalance={handleInitiateEditBalance}
            onSetInitialBalance={handleOpenSetInitialBalance}
          />
          <SafeToSpendCard
            safeToSpend={summary.safeToSpend}
            budgetAlerts={summary.budgetAlerts}
            currency={user?.currency}
          />
        </>
      )}

      {/* Category Pills Quick Filter Bar */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedCategoryFilter('')}
            type="button"
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategoryFilter === ''
                ? 'bg-zinc-900 text-white shadow-xs dark:bg-white dark:text-zinc-950 dark:shadow-sm'
                : 'bg-white border border-zinc-200 text-zinc-700 hover:text-zinc-950 dark:bg-[#1c1c20] dark:border-white/8 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setSelectedCategoryFilter(cat._id === selectedCategoryFilter ? '' : cat._id)}
              type="button"
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategoryFilter === cat._id
                  ? 'bg-zinc-900 text-white shadow-xs dark:bg-white dark:text-zinc-950 dark:shadow-sm'
                  : 'bg-white border border-zinc-200 text-zinc-700 hover:text-zinc-950 dark:bg-[#1c1c20] dark:border-white/8 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: cat.color || '#10B981' }}
              />
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Visual Analytics & Detailed Charts */}
      <div className="space-y-4 sm:space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          <CategoryDonutChart
            data={breakdown.items}
            totalSum={breakdown.totalSum}
            breakdownType={breakdownType}
            onToggleType={(type) => setBreakdownType(type)}
          />
          <SpendingTrendChart data={trends.dailyTrend} />
        </div>

        {/* 6-Month Income vs Expense Cashflow Comparison */}
        <CashflowTrendChart data={trends.sixMonthsTrend} />
      </div>

      {/* Transactions Section */}
      <div className="bg-white border border-zinc-200/90 shadow-sm dark:bg-[#111113] dark:border-white/8 rounded-3xl p-5 sm:p-6 space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Transactions
            </h3>
            <p className="text-xs text-zinc-500">Recent expenses & income</p>
          </div>
          <Link
            to="/transactions"
            className="flex items-center gap-1 text-xs font-bold text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            <span>See all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <TableSkeleton rows={4} />
        ) : filteredRecent.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-zinc-200 dark:border-white/8">
            <Receipt className="w-8 h-8 mx-auto text-zinc-400 dark:text-zinc-700 mb-2" />
            <p className="font-semibold text-zinc-700 dark:text-zinc-400 text-sm">No transactions recorded yet</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-600 mt-1 mb-4">Click below to log your first expense.</p>
            <Button onClick={handleOpenAddExpense} icon={Plus} size="sm">
              Add Expense
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredRecent.map((tx) => (
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

      {/* Starting Balance Modal */}
      <BalanceModal
        isOpen={isBalanceModalOpen}
        onClose={() => setIsBalanceModalOpen(false)}
        onSuccess={handleBalanceUpdated}
        currentBalance={user?.initialBalance || 0}
      />

      {/* Edit Balance Warning Alert Dialog */}
      <ConfirmDialog
        isOpen={isEditAlertOpen}
        title="Adjust Starting Balance?"
        message="⚠️ Editing your starting balance will recalculate your overall net worth across all your recorded expenses and income. Are you sure you want to adjust your starting balance?"
        confirmText="Proceed to Edit"
        cancelText="Cancel"
        isDestructive={false}
        onConfirm={handleConfirmEditAlert}
        onClose={() => setIsEditAlertOpen(false)}
      />

      {/* Add / Edit Transaction Modal */}
      <TransactionFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        categories={categories}
        defaultType={modalDefaultType}
        initialData={editingTransaction}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingTransaction}
        title="Delete Record?"
        message={`Are you sure you want to delete this ${deletingTransaction?.type} record?`}
        confirmText="Delete"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingTransaction(null)}
      />
    </div>
  );
};

export default DashboardPage;

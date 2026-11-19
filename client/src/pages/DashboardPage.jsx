import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { analyticsApi } from '../api/analyticsApi';
import { transactionApi } from '../api/transactionApi';
import { categoryApi } from '../api/categoryApi';
import { budgetApi } from '../api/budgetApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import MonthSelector from '../components/dashboard/MonthSelector';
import StatCards from '../components/dashboard/StatCards';
import SmartInsights from '../components/dashboard/SmartInsights';
import CategoryDonutChart from '../components/dashboard/CategoryDonutChart';
import SpendingTrendChart from '../components/dashboard/SpendingTrendChart';
import IncomeExpenseBarChart from '../components/dashboard/IncomeExpenseBarChart';
import BudgetCard from '../components/budgets/BudgetCard';
import TransactionItem from '../components/transactions/TransactionItem';
import TransactionFormModal from '../components/transactions/TransactionFormModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Button from '../components/common/Button';
import { CardSkeleton, TableSkeleton } from '../components/common/Skeleton';
import {
  Plus,
  ArrowRight,
  Sparkles,
  Receipt,
  PieChart,
  Tags,
  CheckCircle2,
} from 'lucide-react';

export const DashboardPage = () => {
  const { user } = useAuth();
  const toast = useToast();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [summary, setSummary] = useState({});
  const [breakdown, setBreakdown] = useState({ items: [], totalSum: 0 });
  const [trends, setTrends] = useState({ dailyTrend: [], sixMonthsTrend: [] });
  const [insights, setInsights] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [budgetOverview, setBudgetOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [sumRes, breakRes, trendRes, insRes, txRes, catRes, budRes] = await Promise.all([
        analyticsApi.getSummary(selectedMonth, selectedYear),
        analyticsApi.getCategoryBreakdown(selectedMonth, selectedYear, 'expense'),
        analyticsApi.getTrends(selectedMonth, selectedYear),
        analyticsApi.getInsights(selectedMonth, selectedYear),
        transactionApi.getTransactions({ limit: 5 }),
        categoryApi.getCategories(),
        budgetApi.getBudgets(selectedMonth, selectedYear),
      ]);

      if (sumRes?.success) setSummary(sumRes.data || {});
      if (breakRes?.success) setBreakdown(breakRes.data || { items: [], totalSum: 0 });
      if (trendRes?.success) setTrends(trendRes.data || { dailyTrend: [], sixMonthsTrend: [] });
      if (insRes?.success) setInsights(insRes.data || []);
      if (txRes?.success) setRecentTransactions(txRes.data?.transactions || []);
      if (catRes?.success) setCategories(catRes.data || []);
      if (budRes?.success) {
        setBudgets(budRes.data?.budgets || []);
        setBudgetOverview(budRes.data?.overview || null);
      }
    } catch (err) {
      console.error('Dashboard load error', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Listen for transactions created globally
  useEffect(() => {
    const handleTransactionCreated = () => {
      loadDashboardData();
    };
    window.addEventListener('orbit:transaction-created', handleTransactionCreated);
    return () => {
      window.removeEventListener('orbit:transaction-created', handleTransactionCreated);
    };
  }, [loadDashboardData]);

  const handleMonthChange = (m, y) => {
    setSelectedMonth(m);
    setSelectedYear(y);
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
          loadDashboardData();
        }
      } else {
        const res = await transactionApi.createTransaction(formData);
        if (res.success) {
          toast.success(res.message || 'Transaction recorded!');
          setIsModalOpen(false);
          loadDashboardData();
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
        loadDashboardData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete transaction');
    } finally {
      setIsDeleting(false);
    }
  };

  const isBrandNewUser = !loading && recentTransactions.length === 0 && (summary.totalIncome === 0 && summary.totalExpense === 0);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Controls: Greeting & Month Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Hi, {user?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Here is your financial pulse and overview
          </p>
        </div>

        <div className="flex items-center gap-3">
          <MonthSelector
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onChange={handleMonthChange}
          />
          <Button onClick={handleOpenCreate} icon={Plus} size="md">
            Add
          </Button>
        </div>
      </div>

      {/* Fresh Onboarding Card for New Users */}
      {isBrandNewUser && (
        <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/30 border border-emerald-500/30 shadow-lg relative overflow-hidden animate-fade-in">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Clean Slate &bull; Fresh Start</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Welcome to Orbit! Your finances are ready to track.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Log your initial income or first expense to begin unlocking real-time spending analytics, category breakdowns, and monthly budget alerts.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button onClick={handleOpenCreate} icon={Plus} size="sm">
                Record First Transaction
              </Button>
              <Link
                to="/categories"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-colors"
              >
                Explore Categories
              </Link>
              <Link
                to="/budgets"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-colors"
              >
                Set a Budget
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 4 Key Metric KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <CardSkeleton key={i} className="h-32 rounded-3xl" />
          ))}
        </div>
      ) : (
        <StatCards summary={summary} />
      )}

      {/* Smart Insights Alert Ribbon */}
      {!loading && <SmartInsights insights={insights} />}

      {/* Monthly Budget Warnings & Progress (Shown on Dashboard) */}
      {!loading && budgets && budgets.length > 0 && (
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Monthly Budget Alerts & Status
              </h3>
              <p className="text-xs text-slate-400">
                Warning triggers at 80% and 100% of category limits
              </p>
            </div>
            <Link
              to="/budgets"
              className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <span>Manage Budgets</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.slice(0, 3).map((b) => (
              <BudgetCard key={b._id} budget={b} />
            ))}
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryDonutChart
          data={breakdown.items}
          totalSum={breakdown.totalSum}
        />
        <SpendingTrendChart data={trends.dailyTrend} />
      </div>

      {/* Multi-Month Income vs Expense Bar Chart */}
      <IncomeExpenseBarChart data={trends.sixMonthsTrend} />

      {/* Recent Activity Section */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Activity
            </h3>
            <p className="text-xs text-slate-400">Latest transactions recorded in Orbit</p>
          </div>
          <Link
            to="/transactions"
            className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <TableSkeleton rows={4} />
        ) : recentTransactions.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400 space-y-2">
            <Receipt className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">No transactions recorded yet</p>
            <p>Click below to log your first income or expense.</p>
            <div className="pt-2">
              <Button onClick={handleOpenCreate} icon={Plus} size="sm">
                Add Transaction
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentTransactions.map((tx) => (
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

      {/* Add / Edit Transaction Modal */}
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
        title="Delete Transaction?"
        message="Are you sure you want to delete this transaction record?"
        confirmText="Delete"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingTransaction(null)}
      />
    </div>
  );
};

export default DashboardPage;

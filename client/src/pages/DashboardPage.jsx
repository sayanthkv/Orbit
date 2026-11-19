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
import { Plus, ArrowRight, Sparkles } from 'lucide-react';

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

      if (sumRes.success) setSummary(sumRes.data);
      if (breakRes.success) setBreakdown(breakRes.data);
      if (trendRes.success) setTrends(trendRes.data);
      if (insRes.success) setInsights(insRes.data);
      if (txRes.success) setRecentTransactions(txRes.data.transactions);
      if (catRes.success) setCategories(catRes.data);
      if (budRes.success) {
        setBudgets(budRes.data.budgets || []);
        setBudgetOverview(budRes.data.overview || null);
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

  // Global "orbit:open-add-transaction" listener
  useEffect(() => {
    const handleGlobalAdd = () => {
      setEditingTransaction(null);
      setIsModalOpen(true);
    };
    window.addEventListener('orbit:open-add-transaction', handleGlobalAdd);
    return () => window.removeEventListener('orbit:open-add-transaction', handleGlobalAdd);
  }, []);

  const handleMonthChange = (m, y) => {
    setSelectedMonth(m);
    setSelectedYear(y);
  };

  const handleOpenAdd = () => {
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
        await transactionApi.updateTransaction(editingTransaction._id, formData);
        toast.success('Transaction updated!');
      } else {
        await transactionApi.createTransaction(formData);
        toast.success('Transaction added!');
      }
      setIsModalOpen(false);
      loadDashboardData();
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTransaction) return;
    try {
      setIsDeleting(true);
      await transactionApi.deleteTransaction(deletingTransaction._id);
      toast.success('Transaction deleted');
      setDeletingTransaction(null);
      loadDashboardData();
    } catch (err) {
      toast.error('Failed to delete transaction');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome & Month Selector Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Hi, {user?.name || 'Explorer'}
            </h1>
            <Sparkles className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Overview of your financial orbit and monthly trends
          </p>
        </div>

        <div className="flex items-center gap-3">
          <MonthSelector
            month={selectedMonth}
            year={selectedYear}
            onChange={handleMonthChange}
          />
          <Button onClick={handleOpenAdd} icon={Plus} size="md">
            Add
          </Button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <StatCards summary={summary} />
      )}

      {/* Smart Insights Alert Ribbon */}
      {!loading && <SmartInsights insights={insights} />}

      {/* Monthly Budget Warnings & Progress (Shown on Dashboard as required) */}
      {!loading && budgets && budgets.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
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
          <div className="text-center py-8 text-xs text-slate-400">
            No recent activity. Click "+ Add" to log your first transaction.
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

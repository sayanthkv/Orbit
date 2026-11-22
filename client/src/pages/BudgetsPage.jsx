import React, { useState, useEffect, useCallback } from 'react';
import { budgetApi } from '../api/budgetApi';
import { categoryApi } from '../api/categoryApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/formatters';
import MonthSelector from '../components/dashboard/MonthSelector';
import BudgetCard from '../components/budgets/BudgetCard';
import BudgetFormModal from '../components/budgets/BudgetFormModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import { CardSkeleton } from '../components/common/Skeleton';
import { Plus, Target, AlertTriangle, ShieldCheck } from 'lucide-react';

export const BudgetsPage = () => {
  const { user } = useAuth();
  const toast = useToast();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [budgets, setBudgets] = useState([]);
  const [overview, setOverview] = useState({
    totalLimit: 0,
    totalSpent: 0,
    totalRemaining: 0,
    overallPercentage: 0,
    warningsCount: 0,
    exceededCount: 0,
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingBudget, setDeletingBudget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await budgetApi.getBudgets(selectedMonth, selectedYear);
      if (res.success) {
        setBudgets(res.data.budgets);
        setOverview(res.data.overview);
      }
    } catch (err) {
      toast.error('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, toast]);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await categoryApi.getCategories('expense');
        if (res.success) setCategories(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCats();
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      const res = await budgetApi.setBudget(formData);
      if (res.success) {
        toast.success(res.message || 'Budget saved!');
        setIsModalOpen(false);
        fetchBudgets();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save budget');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingBudget) return;
    try {
      setIsDeleting(true);
      const res = await budgetApi.deleteBudget(deletingBudget._id);
      if (res.success) {
        toast.success('Budget removed');
        setDeletingBudget(null);
        fetchBudgets();
      }
    } catch (err) {
      toast.error('Failed to remove budget');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Monthly Budgets
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Set and track spending limits with 80% & 100% threshold warnings
          </p>
        </div>

        <div className="flex items-center gap-3">
          <MonthSelector
            month={selectedMonth}
            year={selectedYear}
            onChange={(m, y) => {
              setSelectedMonth(m);
              setSelectedYear(y);
            }}
          />
          <Button onClick={() => setIsModalOpen(true)} icon={Plus} size="md">
            Set Budget
          </Button>
        </div>
      </div>

      {/* Warning Alert Banner */}
      {(overview.exceededCount > 0 || overview.warningsCount > 0) && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-900 dark:bg-amber-500/10 dark:border-amber-500/25 dark:text-amber-300 flex items-start gap-3 transition-colors">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <h4 className="font-bold">
              Budget Alert for Selected Month
            </h4>
            <p className="text-amber-800 dark:text-amber-400/80">
              {overview.exceededCount > 0 && (
                <span className="font-semibold text-rose-600 dark:text-rose-400 mr-2">
                  • {overview.exceededCount} category budget(s) have been exceeded!
                </span>
              )}
              {overview.warningsCount > 0 && (
                <span>
                  • {overview.warningsCount} category budget(s) have crossed 80% of limit.
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Top Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Budget Progress Card */}
        <div className="md:col-span-2 p-5 sm:p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-sm dark:bg-[#111113] dark:border-white/8 space-y-4 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Total Monthly Budget
              </span>
              <h3 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-1">
                {formatCurrency(overview.totalSpent, user?.currency)}{' '}
                <span className="text-base font-medium text-zinc-400 dark:text-zinc-500">
                  / {formatCurrency(overview.totalLimit, user?.currency)}
                </span>
              </h3>
            </div>

            <div className="text-right">
              <span className="text-xs text-zinc-500">Remaining</span>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(overview.totalRemaining, user?.currency)}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-white/8 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  overview.overallPercentage >= 100
                    ? 'bg-rose-500'
                    : overview.overallPercentage >= 80
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(overview.overallPercentage, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>{overview.overallPercentage}% of overall budget utilized</span>
              <span>{budgets.length} Category Target(s)</span>
            </div>
          </div>
        </div>

        {/* Safe to Spend Per Day Metric Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-sm dark:bg-[#111113] dark:border-white/8 flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Safe to Spend
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="my-2">
            <h4 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
              {formatCurrency(overview.safeToSpendDaily || 0, user?.currency)}
              <span className="text-xs font-semibold text-zinc-400 ml-1">/ day</span>
            </h4>
            <p className="text-xs text-zinc-500 mt-1">
              {overview.daysRemaining ? `${overview.daysRemaining} days remaining in month` : 'Current period'}
            </p>
          </div>

          <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 pt-2 border-t border-zinc-100 dark:border-white/5">
            Daily limit to stay strictly within budget
          </div>
        </div>
      </div>

      {/* Category Budgets Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No category budgets set"
          description="Establish monthly spending caps on groceries, dining, shopping, and more."
          actionLabel="Set First Budget"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b) => (
            <BudgetCard key={b._id} budget={b} onDelete={setDeletingBudget} />
          ))}
        </div>
      )}

      {/* Set Budget Modal */}
      <BudgetFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        categories={categories}
        month={selectedMonth}
        year={selectedYear}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingBudget}
        title="Remove Budget Target?"
        message={`Are you sure you want to remove the monthly limit for ${deletingBudget?.category?.name}?`}
        confirmText="Remove"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingBudget(null)}
      />
    </div>
  );
};

export default BudgetsPage;

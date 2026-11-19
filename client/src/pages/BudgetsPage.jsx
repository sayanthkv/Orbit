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
import { Plus, Target, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Monthly Budgets
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
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

      {/* Warning Alert Banner (if any budget hit 80% or exceeded) */}
      {(overview.exceededCount > 0 || overview.warningsCount > 0) && (
        <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-amber-900 dark:text-amber-200">
              Budget Alert for Selected Month
            </h4>
            <p className="text-amber-800 dark:text-amber-300">
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

      {/* Total Budget Progress Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Monthly Budget Limit
            </span>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {formatCurrency(overview.totalSpent, user?.currency)}{' '}
              <span className="text-base font-medium text-slate-400">
                / {formatCurrency(overview.totalLimit, user?.currency)}
              </span>
            </h3>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400">Remaining</span>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(overview.totalRemaining, user?.currency)}
            </p>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full h-3.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5">
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
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{overview.overallPercentage}% of overall budget utilized</span>
            <span>{budgets.length} Category Target(s)</span>
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

import React, { useState, useEffect } from 'react';
import { goalApi } from '../api/goalApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import GoalFormModal from '../components/goals/GoalFormModal';
import DepositModal from '../components/goals/DepositModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import { CardSkeleton } from '../components/common/Skeleton';
import { Plus, Target, PiggyBank, Calendar, CheckCircle2, Trophy, Trash2, Edit2 } from 'lucide-react';

export const GoalsPage = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [depositingGoal, setDepositingGoal] = useState(null);
  const [deletingGoal, setDeletingGoal] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await goalApi.getGoals();
      if (res.success) {
        setGoals(res.data);
      }
    } catch (err) {
      toast.error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleFormSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      if (editingGoal) {
        const res = await goalApi.updateGoal(editingGoal._id, formData);
        if (res.success) {
          toast.success('Goal updated!');
          setIsFormOpen(false);
          fetchGoals();
        }
      } else {
        const res = await goalApi.createGoal(formData);
        if (res.success) {
          toast.success(res.message || 'Savings goal created!');
          setIsFormOpen(false);
          fetchGoals();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDepositSubmit = async (amount) => {
    try {
      setIsDepositing(true);
      const res = await goalApi.deposit(depositingGoal._id, amount);
      if (res.success) {
        toast.success(res.message || 'Funds deposited!');
        setDepositingGoal(null);
        fetchGoals();
      }
    } catch (err) {
      toast.error(err.message || 'Deposit failed');
    } finally {
      setIsDepositing(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingGoal) return;
    try {
      setIsDeleting(true);
      const res = await goalApi.deleteGoal(deletingGoal._id);
      if (res.success) {
        toast.success('Goal deleted');
        setDeletingGoal(null);
        fetchGoals();
      }
    } catch (err) {
      toast.error('Failed to delete goal');
    } finally {
      setIsDeleting(false);
    }
  };

  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const completedGoalsCount = goals.filter((g) => g.isCompleted).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Savings Goals
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track your financial dreams, emergency cushions, and major milestones
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingGoal(null);
            setIsFormOpen(true);
          }}
          icon={Plus}
          size="md"
        >
          New Goal
        </Button>
      </div>

      {/* Overview Stat Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-400">Total Saved Towards Goals</span>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(totalSaved, user?.currency)}
          </p>
        </div>
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-400">Total Target Amount</span>
          <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-200 mt-1">
            {formatCurrency(totalTarget, user?.currency)}
          </p>
        </div>
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-400">Milestones Reached</span>
          <p className="text-2xl font-extrabold text-teal-600 dark:text-teal-400 mt-1 flex items-center gap-2">
            <span>{completedGoalsCount} / {goals.length}</span>
            {completedGoalsCount > 0 && <Trophy className="w-5 h-5 text-amber-500" />}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No savings goals yet"
          description="Create savings targets for an emergency fund, travel, electronics, or personal investments."
          actionLabel="Create First Goal"
          onAction={() => {
            setEditingGoal(null);
            setIsFormOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => (
            <div
              key={goal._id}
              className={`p-6 rounded-3xl bg-white dark:bg-slate-900 border shadow-sm space-y-4 hover:shadow-md transition-all ${
                goal.isCompleted
                  ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/20'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                    style={{
                      backgroundColor: `${goal.color || '#10B981'}20`,
                      color: goal.color || '#10B981',
                    }}
                  >
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      {goal.title}
                      {goal.isCompleted && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      )}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Target: {formatCurrency(goal.targetAmount, user?.currency)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingGoal(goal);
                      setIsFormOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                    title="Edit goal"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingGoal(goal)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                    title="Delete goal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatCurrency(goal.currentAmount, user?.currency)}
                  </span>
                  <span className="font-bold text-slate-500 dark:text-slate-400">
                    {goal.percentage}%
                  </span>
                </div>

                <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      backgroundColor: goal.color || '#10B981',
                      width: `${goal.percentage}%`,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                  <span>
                    {goal.isCompleted
                      ? 'Goal Completed!'
                      : `${formatCurrency(goal.remaining, user?.currency)} remaining`}
                  </span>
                  {goal.targetDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {goal.daysRemaining !== null && goal.daysRemaining >= 0
                        ? `${goal.daysRemaining} days left`
                        : formatDate(goal.targetDate)}
                    </span>
                  )}
                </div>
              </div>

              {/* Deposit Button */}
              <button
                onClick={() => setDepositingGoal(goal)}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                <PiggyBank className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Deposit Savings</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Goal Modal */}
      <GoalFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingGoal}
        isLoading={isSubmitting}
      />

      {/* Deposit Modal */}
      <DepositModal
        isOpen={!!depositingGoal}
        onClose={() => setDepositingGoal(null)}
        onSubmit={handleDepositSubmit}
        goal={depositingGoal}
        isLoading={isDepositing}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingGoal}
        title="Delete Goal?"
        message={`Are you sure you want to remove the goal "${deletingGoal?.title}"?`}
        confirmText="Delete"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingGoal(null)}
      />
    </div>
  );
};

export default GoalsPage;

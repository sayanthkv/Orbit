import React, { useState, useEffect } from 'react';
import goalApi from '../../api/goalApi';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  Target,
  Plus,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  Calendar,
  PiggyBank,
} from 'lucide-react';

export const SavingsGoalsWidget = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    color: '#10B981',
  });

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await goalApi.getGoals();
      if (res?.success) {
        setGoals(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching goals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.targetAmount) {
      toast.error('Title and target amount are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await goalApi.createGoal({
        title: formData.title.trim(),
        targetAmount: Number(formData.targetAmount),
        currentAmount: Number(formData.currentAmount || 0),
        targetDate: formData.targetDate || null,
        color: formData.color,
      });

      if (res?.success) {
        toast.success(`Savings goal "${formData.title}" created!`);
        setIsModalOpen(false);
        setFormData({ title: '', targetAmount: '', currentAmount: '', targetDate: '', color: '#10B981' });
        fetchGoals();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save goal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeposit = async (goalId, amount) => {
    try {
      const res = await goalApi.depositToGoal(goalId, amount);
      if (res?.success) {
        toast.success(`Added ${formatCurrency(amount, user?.currency)} to savings goal!`);
        fetchGoals();
      }
    } catch (err) {
      toast.error('Failed to update progress');
    }
  };

  if (loading && goals.length === 0) return null;

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-white border border-zinc-200/90 shadow-xs dark:bg-[#141418] dark:border-white/10 space-y-4 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
            <Target className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
            Savings Goals & Milestones
          </h4>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          type="button"
          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Goal</span>
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="p-6 rounded-2xl border border-dashed border-zinc-200 dark:border-white/10 text-center">
          <PiggyBank className="w-8 h-8 text-zinc-400 mx-auto mb-1.5" />
          <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            No active savings goals
          </p>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Set a target for an emergency fund, travel, or vehicle purchase with calculated monthly savings.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            type="button"
            className="mt-3 text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
          >
            + Create your first savings goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {goals.map((g) => (
            <div
              key={g._id}
              className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 dark:bg-white/[0.02] dark:border-white/8 space-y-2.5 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h5 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {g.title}
                  </h5>
                  <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                    <span>Target: {formatCurrency(g.targetAmount, user?.currency)}</span>
                    {g.daysRemaining !== null && (
                      <>
                        <span>•</span>
                        <span>{g.daysRemaining > 0 ? `${g.daysRemaining}d left` : 'Target passed'}</span>
                      </>
                    )}
                  </div>
                </div>

                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                  {g.percentage}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${Math.min(g.percentage, 100)}%` }}
                />
              </div>

              {/* Suggested Monthly Contribution Pill */}
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-zinc-200/60 dark:border-white/5">
                {g.suggestedMonthlyContribution > 0 ? (
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                    💡 Save {formatCurrency(g.suggestedMonthlyContribution, user?.currency)}/mo to hit goal
                  </span>
                ) : (
                  <span className="text-zinc-400 font-medium">
                    {formatCurrency(g.currentAmount, user?.currency)} saved so far
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => handleDeposit(g._id, 500)}
                  className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 font-bold hover:bg-emerald-500/20 cursor-pointer"
                  title="Quick add ₹500 to savings progress"
                >
                  + Deposit ₹500
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Goal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Savings Goal"
        description="Plan a financial milestone with an automated suggested monthly contribution."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateGoal} className="space-y-3.5">
          <Input
            label="Goal Title"
            placeholder="e.g. Emergency Fund, Vacation Trip, New Laptop"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={`Target Amount (${user?.currency === 'INR' ? '₹' : '$'})`}
              type="number"
              min="1"
              placeholder="50000"
              value={formData.targetAmount}
              onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
              required
            />

            <Input
              label="Already Saved"
              type="number"
              min="0"
              placeholder="0.00"
              value={formData.currentAmount}
              onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
            />
          </div>

          <Input
            label="Target Deadline (Optional)"
            type="date"
            value={formData.targetDate}
            onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
            helperText="Used to compute your recommended monthly savings rate"
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-white/8">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Create Goal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SavingsGoalsWidget;

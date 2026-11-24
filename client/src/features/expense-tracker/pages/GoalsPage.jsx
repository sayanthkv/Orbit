import React, { useState, useEffect } from 'react';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import Modal from '../../../components/Modal';
import Input from '../../../components/Input';
import Spinner from '../../../components/Spinner';
import EmptyState from '../../../components/EmptyState';
import { useToast } from '../../../components/Toast';
import api from '../../../lib/api';
import { formatCurrency, formatDate } from '../../../lib/formatters';
import { Target, Plus, Trash2, ArrowUpRight, ArrowDownLeft, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const GoalsPage = () => {
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New goal state
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');

  // Contribution state
  const [contribAmount, setContribAmount] = useState('');
  const [contribType, setContribType] = useState('add');
  const [contribNote, setContribNote] = useState('');

  const toast = useToast();

  const fetchGoals = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/goals');
      if (res.success) setGoals(res.data?.goals || []);
    } catch {
      toast.error('Failed to load goals');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleOpenContribution = async (goal) => {
    setSelectedGoal(goal);
    setIsContributionModalOpen(true);
    setContribAmount('');
    setContribNote('');
    try {
      const res = await api.get(`/goals/${goal._id}/contributions`);
      if (res.success) setContributions(res.data?.contributions || []);
    } catch {}
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!name || !targetAmount || Number(targetAmount) < 1) {
      toast.error('Enter valid goal name and target amount');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/goals', {
        name,
        targetAmount: Number(targetAmount),
        targetDate: targetDate || undefined,
      });

      if (res.success) {
        toast.success(`Goal "${name}" created!`);
        setIsModalOpen(false);
        setName('');
        setTargetAmount('');
        setTargetDate('');
        fetchGoals();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create goal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddContribution = async (e) => {
    e.preventDefault();
    if (!contribAmount || Number(contribAmount) <= 0) {
      toast.error('Enter valid contribution amount');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post(`/goals/${selectedGoal._id}/contributions`, {
        amount: Number(contribAmount),
        type: contribType,
        note: contribNote,
      });

      if (res.success) {
        toast.success(res.message);
        setIsContributionModalOpen(false);
        fetchGoals();
      }
    } catch (err) {
      toast.error(err.message || 'Contribution failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGoal = async (id, goalName) => {
    if (!window.confirm(`Delete goal "${goalName}"?`)) return;
    try {
      const res = await api.delete(`/goals/${id}`);
      if (res.success) {
        toast.success('Goal deleted');
        fetchGoals();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete goal');
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight font-display">
            Savings Goals
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Track allocations toward long-term targets, emergency funds, and major milestones
          </p>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setIsModalOpen(true)}
          className="shadow-sm shadow-emerald-600/20"
        >
          New Goal
        </Button>
      </div>

      {/* Goals Grid */}
      {isLoading ? (
        <div className="p-16 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : goals.length === 0 ? (
        <Card>
          <EmptyState
            icon={Target}
            title="No savings goals yet"
            description="Set a target for an emergency fund, travel, electronics, or personal investments."
            action={{
              label: 'Create Your First Goal',
              onClick: () => setIsModalOpen(true),
            }}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((g) => (
            <Card key={g._id} className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white font-display">
                      {g.name}
                    </h3>
                    {g.targetDate && (
                      <p className="text-[11px] text-zinc-500">
                        Target Date: {formatDate(g.targetDate)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleDeleteGoal(g._id, g.name)}
                    className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress and Numbers */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold tabular-nums font-mono text-zinc-900 dark:text-white">
                    {formatCurrency(g.savedAmount)}
                  </span>
                  <span className="text-zinc-500 tabular-nums font-mono">
                    Target: {formatCurrency(g.targetAmount)}
                  </span>
                </div>

                <div className="w-full h-3 bg-zinc-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, g.percentage)}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="h-full bg-emerald-500 rounded-full"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-0.5">
                  <span>{g.percentage}% Completed</span>
                  <span>Remaining: {formatCurrency(g.remaining)}</span>
                </div>
              </div>

              {/* Target Pace Metric */}
              {g.monthlyNeeded && (
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-white/3 border border-zinc-200/60 dark:border-white/6 text-xs text-zinc-600 dark:text-zinc-400 flex items-center justify-between">
                  <span>Required monthly pace:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums font-mono">
                    {formatCurrency(g.monthlyNeeded)}/mo
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-1 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleOpenContribution(g)}
                >
                  Manage Contributions
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* New Goal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Savings Goal"
        description="Define a target amount and milestone date"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateGoal} className="space-y-4">
          <Input
            label="Goal Name"
            placeholder="e.g. MacBook Pro, Vacation in Japan, Emergency Fund"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="Target Amount (INR)"
            type="number"
            min="1"
            required
            placeholder="e.g. 150000"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
          />

          <Input
            label="Target Completion Date (Optional)"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Save Goal
            </Button>
          </div>
        </form>
      </Modal>

      {/* Contribution Modal */}
      <Modal
        isOpen={isContributionModalOpen}
        onClose={() => setIsContributionModalOpen(false)}
        title={selectedGoal ? `Contributions: ${selectedGoal.name}` : 'Contributions'}
        description="Allocate or withdraw funds from this goal"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <form onSubmit={handleAddContribution} className="p-3.5 bg-zinc-50 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 rounded-2xl space-y-3">
            <div className="flex p-1 bg-zinc-200/60 dark:bg-white/10 rounded-xl">
              <button
                type="button"
                onClick={() => setContribType('add')}
                className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all ${
                  contribType === 'add'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                + Add Allocation
              </button>
              <button
                type="button"
                onClick={() => setContribType('withdraw')}
                className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all ${
                  contribType === 'withdraw'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                - Withdraw Allocation
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Amount (INR)"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={contribAmount}
                onChange={(e) => setContribAmount(e.target.value)}
              />
              <Input
                label="Note (Optional)"
                placeholder="e.g. Monthly bonus, festival gift"
                value={contribNote}
                onChange={(e) => setContribNote(e.target.value)}
              />
            </div>

            <Button type="submit" variant="primary" size="sm" className="w-full" isLoading={isSubmitting}>
              Record {contribType === 'add' ? 'Allocation' : 'Withdrawal'}
            </Button>
          </form>

          {/* History */}
          <div>
            <h4 className="text-xs font-bold text-zinc-900 dark:text-white mb-2">
              Allocation History
            </h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
              {contributions.length === 0 ? (
                <p className="text-center text-xs text-zinc-500 py-4">No contributions recorded yet</p>
              ) : (
                contributions.map((c) => (
                  <div
                    key={c._id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-white/2 border border-zinc-200/60 dark:border-white/6 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-zinc-900 dark:text-white">
                        {c.type === 'add' ? 'Added Allocation' : 'Withdrawn'}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        {formatDate(c.date)} {c.note ? `• ${c.note}` : ''}
                      </p>
                    </div>
                    <span
                      className={`font-black tabular-nums font-mono ${
                        c.type === 'add' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {c.type === 'add' ? '+' : '-'}
                      {formatCurrency(c.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GoalsPage;

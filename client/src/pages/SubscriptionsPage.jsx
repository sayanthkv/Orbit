import React, { useState, useEffect, useCallback } from 'react';
import recurringApi from '../api/recurringApi';
import { categoryApi } from '../api/categoryApi';
import { useAccounts } from '../context/AccountContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import RecurringFormModal from '../components/subscriptions/RecurringFormModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import { CardSkeleton } from '../components/common/Skeleton';
import {
  RotateCcw,
  Plus,
  Play,
  Pause,
  Calendar,
  Edit2,
  Trash2,
  Sparkles,
  CreditCard,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  Zap,
} from 'lucide-react';

export const SubscriptionsPage = () => {
  const { user } = useAuth();
  const { accounts } = useAccounts();
  const toast = useToast();

  const [rules, setRules] = useState([]);
  const [summary, setSummary] = useState({
    monthlyCommittedSpend: 0,
    activeCount: 0,
    pausedCount: 0,
    totalCount: 0,
    nextUpcoming: null,
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, paused

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingRule, setDeletingRule] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      const res = await recurringApi.getRecurringRules();
      if (res.success) {
        setRules(res.data.rules || []);
        setSummary(res.data.summary || {});
      }
    } catch (err) {
      toast.error('Failed to load subscriptions & recurring schedules');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await categoryApi.getCategories();
        if (res.success) setCategories(res.data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCats();
    fetchRules();
  }, [fetchRules]);

  const handleToggleActive = async (rule) => {
    try {
      const res = await recurringApi.updateRecurringRule(rule._id, {
        isActive: !rule.isActive,
      });
      if (res.success) {
        toast.success(
          `Schedule "${rule.note || 'Subscription'}" ${rule.isActive ? 'paused' : 'resumed'}!`
        );
        fetchRules();
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleRunNow = async (rule) => {
    try {
      const res = await recurringApi.runRuleNow(rule._id);
      if (res.success) {
        toast.success(res.message || 'Transaction executed and logged!');
        fetchRules();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to trigger run');
    }
  };

  const handleProcessMissed = async () => {
    try {
      setIsProcessing(true);
      const res = await recurringApi.triggerProcess();
      if (res.success) {
        toast.success(res.message || 'Checked and processed due transactions!');
        fetchRules();
      }
    } catch (err) {
      toast.error('Failed to process recurring transactions');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingRule) return;
    try {
      setIsDeleting(true);
      const res = await recurringApi.deleteRecurringRule(deletingRule._id);
      if (res.success) {
        toast.success('Recurring schedule removed.');
        setDeletingRule(null);
        fetchRules();
      }
    } catch (err) {
      toast.error('Failed to delete schedule');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmitModal = async (formData) => {
    try {
      setIsSubmitting(true);
      if (editingRule) {
        const res = await recurringApi.updateRecurringRule(editingRule._id, formData);
        if (res.success) {
          toast.success('Subscription updated successfully.');
          setIsModalOpen(false);
          setEditingRule(null);
          fetchRules();
        }
      } else {
        const res = await recurringApi.createRecurringRule(formData);
        if (res.success) {
          toast.success('New subscription schedule active!');
          setIsModalOpen(false);
          fetchRules();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save subscription');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRules = rules.filter((r) => {
    if (filterStatus === 'active') return r.isActive;
    if (filterStatus === 'paused') return !r.isActive;
    return true;
  });

  const getDaysUntil = (dateStr) => {
    if (!dateStr) return '';
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diffDays = Math.round((target - now) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays < 0) return `Past due (${Math.abs(diffDays)}d ago)`;
    return `In ${diffDays} days`;
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
              Subscriptions & Recurring
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/40">
              {summary.activeCount} Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Track committed monthly expenses, upcoming renewals, and auto-generated transactions.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleProcessMissed}
            isLoading={isProcessing}
            icon={Zap}
            className="text-xs font-bold"
            title="Check for any due transactions and generate them"
          >
            Check & Catch-up
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingRule(null);
              setIsModalOpen(true);
            }}
            icon={Plus}
            className="text-xs font-bold"
          >
            Add Subscription
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Monthly Committed Spend */}
        <div className="p-5 rounded-3xl bg-white border border-zinc-200/80 shadow-xs dark:bg-[#111114] dark:border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            <span>Committed Monthly Spend</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <h3 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
              {formatCurrency(summary.monthlyCommittedSpend, user?.currency)}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Fixed normalized monthly outflow
            </p>
          </div>
        </div>

        {/* Active Schedules */}
        <div className="p-5 rounded-3xl bg-white border border-zinc-200/80 shadow-xs dark:bg-[#111114] dark:border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            <span>Active vs Paused</span>
            <RotateCcw className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2">
            <h3 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
              {summary.activeCount}{' '}
              <span className="text-sm font-semibold text-zinc-400">
                / {summary.totalCount} total
              </span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {summary.pausedCount} schedule{summary.pausedCount === 1 ? '' : 's'} paused
            </p>
          </div>
        </div>

        {/* Next Upcoming Bill */}
        <div className="p-5 rounded-3xl bg-white border border-zinc-200/80 shadow-xs dark:bg-[#111114] dark:border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            <span>Next Renewal</span>
            <Calendar className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2">
            {summary.nextUpcoming ? (
              <>
                <h3 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white truncate">
                  {summary.nextUpcoming.note || 'Upcoming Charge'}
                </h3>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                  {formatCurrency(summary.nextUpcoming.amount, user?.currency)} •{' '}
                  {getDaysUntil(summary.nextUpcoming.nextRunDate)}
                </p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-zinc-400">None upcoming</h3>
                <p className="text-xs text-zinc-500 mt-0.5">All caught up or paused</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200/80 dark:border-white/10 pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl dark:bg-[#18181e]">
          {[
            { id: 'all', label: 'All' },
            { id: 'active', label: 'Active' },
            { id: 'paused', label: 'Paused' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterStatus === tab.id
                  ? 'bg-white text-zinc-950 shadow-xs dark:bg-white/15 dark:text-white'
                  : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Subscriptions List */}
      {loading ? (
        <div className="space-y-3">
          <CardSkeleton count={4} />
        </div>
      ) : filteredRules.length === 0 ? (
        <EmptyState
          icon={RotateCcw}
          title="No subscription rules found"
          description={
            filterStatus !== 'all'
              ? `No ${filterStatus} subscriptions right now.`
              : 'Add your first recurring subscription, streaming service, gym pass, or SIP.'
          }
          actionLabel="Add Subscription"
          onAction={() => {
            setEditingRule(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredRules.map((rule) => {
            const isTransfer = rule.type === 'transfer';
            const isIncome = rule.type === 'income';
            const isExpense = rule.type === 'expense';
            const category = rule.category || {};
            const account = rule.account || {};
            const toAccount = rule.toAccount || {};
            const daysLabel = getDaysUntil(rule.nextRunDate);

            return (
              <div
                key={rule._id}
                className={`p-4 sm:p-5 rounded-3xl border transition-all ${
                  rule.isActive
                    ? 'bg-white border-zinc-200/90 shadow-xs hover:border-zinc-300 dark:bg-[#111114] dark:border-white/10 dark:hover:border-white/20'
                    : 'bg-zinc-50 border-zinc-200/60 opacity-75 dark:bg-[#0c0c0e] dark:border-white/5'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-bold text-zinc-900 dark:text-white truncate">
                        {rule.note || 'Subscription'}
                      </h4>

                      {/* Frequency Badge */}
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-300">
                        {rule.frequency}
                      </span>

                      {/* Status indicator */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          rule.isActive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}
                      >
                        {rule.isActive ? 'Active' : 'Paused'}
                      </span>
                    </div>

                    {/* Metadata tags */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap text-xs text-zinc-500 dark:text-zinc-400">
                      {isTransfer ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-600 dark:text-violet-400">
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>
                            {account.bankName || account.name} → {toAccount.bankName || toAccount.name}
                          </span>
                        </span>
                      ) : (
                        <>
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                            {category.name || 'Expense'}
                          </span>
                          <span>•</span>
                          <span>{account.bankName || account.name || 'Default Account'}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right shrink-0">
                    <p
                      className={`text-lg font-black tracking-tight ${
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isExpense
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-violet-600 dark:text-violet-400'
                      }`}
                    >
                      {isIncome ? '+' : isExpense ? '−' : '⇄ '}
                      {formatCurrency(rule.amount, user?.currency)}
                    </p>
                    <p className="text-[11px] text-zinc-400 font-medium capitalize">
                      per {rule.frequency.replace('ly', '')}
                    </p>
                  </div>
                </div>

                {/* Footer: Renewal Info & Actions */}
                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Next: {formatDate(rule.nextRunDate)}</span>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 ml-1">
                      ({daysLabel})
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    {/* Run Now Trigger */}
                    <button
                      type="button"
                      onClick={() => handleRunNow(rule)}
                      title="Trigger transaction right now"
                      className="p-1.5 text-zinc-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>

                    {/* Pause/Resume Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(rule)}
                      title={rule.isActive ? 'Pause schedule' : 'Resume schedule'}
                      className="p-1.5 text-zinc-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition-colors cursor-pointer"
                    >
                      <Pause className="w-3.5 h-3.5" />
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRule(rule);
                        setIsModalOpen(true);
                      }}
                      title="Edit schedule"
                      className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-white dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => setDeletingRule(rule)}
                      title="Delete schedule"
                      className="p-1.5 text-zinc-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Create/Edit */}
      <RecurringFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRule(null);
        }}
        onSubmit={handleSubmitModal}
        initialData={editingRule}
        categories={categories}
        accounts={accounts}
        isLoading={isSubmitting}
      />

      {/* Confirm Deletion Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingRule)}
        onClose={() => setDeletingRule(null)}
        onConfirm={handleDelete}
        title="Delete Recurring Schedule?"
        message={`Are you sure you want to delete "${deletingRule?.note || 'this subscription'}"? Future automatic transactions will no longer be generated.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default SubscriptionsPage;

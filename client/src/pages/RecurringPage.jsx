import React, { useState, useEffect } from 'react';
import { recurringApi } from '../api/recurringApi';
import { categoryApi } from '../api/categoryApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getCategoryIcon } from '../utils/iconMap';
import RecurringFormModal from '../components/recurring/RecurringFormModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import { TableSkeleton } from '../components/common/Skeleton';
import { Plus, Repeat, Play, Pause, Trash2, Calendar, Clock, RefreshCw } from 'lucide-react';

export const RecurringPage = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [rules, setRules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [deletingRule, setDeletingRule] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await recurringApi.getRules();
      if (res.success) {
        setRules(res.data);
      }
    } catch (err) {
      toast.error('Failed to load recurring rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await categoryApi.getCategories();
        if (res.success) setCategories(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCats();
    fetchRules();
  }, []);

  const handleToggleActive = async (rule) => {
    try {
      const res = await recurringApi.updateRule(rule._id, {
        isActive: !rule.isActive,
      });
      if (res.success) {
        toast.info(`Rule ${!rule.isActive ? 'resumed' : 'paused'}`);
        fetchRules();
      }
    } catch (err) {
      toast.error('Failed to toggle status');
    }
  };

  const handleTriggerProcess = async () => {
    try {
      setIsProcessing(true);
      const res = await recurringApi.triggerProcess();
      if (res.success) {
        toast.success(
          res.data.processedCount > 0
            ? `Successfully created ${res.data.processedCount} due transaction(s)!`
            : 'All recurring schedules are up to date.'
        );
        fetchRules();
      }
    } catch (err) {
      toast.error('Failed to process recurring rules');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      if (editingRule) {
        const res = await recurringApi.updateRule(editingRule._id, formData);
        if (res.success) {
          toast.success('Recurring rule updated!');
          setIsModalOpen(false);
          fetchRules();
        }
      } else {
        const res = await recurringApi.createRule(formData);
        if (res.success) {
          toast.success(res.message || 'Recurring rule created!');
          setIsModalOpen(false);
          fetchRules();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingRule) return;
    try {
      setIsDeleting(true);
      const res = await recurringApi.deleteRule(deletingRule._id);
      if (res.success) {
        toast.success('Recurring rule deleted');
        setDeletingRule(null);
        fetchRules();
      }
    } catch (err) {
      toast.error('Failed to delete rule');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Recurring Transactions
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Automate monthly rent, subscriptions, salary, and utility payments via node-cron
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={handleTriggerProcess}
            isLoading={isProcessing}
            icon={RefreshCw}
          >
            Process Due Now
          </Button>
          <Button
            onClick={() => {
              setEditingRule(null);
              setIsModalOpen(true);
            }}
            icon={Plus}
            size="md"
          >
            New Schedule
          </Button>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={4} />
      ) : rules.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="No recurring schedules"
          description="Create recurring entries so subscriptions and predictable expenses are recorded automatically."
          actionLabel="Schedule First Entry"
          onAction={() => {
            setEditingRule(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((rule) => {
            const category = rule.category || {};
            const isIncome = rule.type === 'income';

            return (
              <div
                key={rule._id}
                className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border transition-all ${
                  rule.isActive
                    ? 'border-slate-200 dark:border-slate-800 shadow-sm'
                    : 'border-slate-100 dark:border-slate-900 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${category.color || '#10B981'}20`,
                        color: category.color || '#10B981',
                      }}
                    >
                      {getCategoryIcon(category.icon, 'w-5 h-5')}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {rule.note || category.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
                          {rule.frequency}
                        </span>
                        <span className="text-xs text-slate-400">
                          via {rule.paymentMethod}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-base font-bold ${
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isIncome ? '+' : '-'} {formatCurrency(rule.amount, user?.currency)}
                    </p>
                    <span
                      className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        rule.isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {rule.isActive ? 'Active' : 'Paused'}
                    </span>
                  </div>
                </div>

                {/* Footer Next execution & Controls */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Next: {formatDate(rule.nextRunDate)}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleActive(rule)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title={rule.isActive ? 'Pause rule' : 'Resume rule'}
                    >
                      {rule.isActive ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => setDeletingRule(rule)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Delete rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <RecurringFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        categories={categories}
        initialData={editingRule}
        isLoading={isSubmitting}
      />

      <ConfirmDialog
        isOpen={!!deletingRule}
        title="Delete Recurring Schedule?"
        message={`Are you sure you want to stop recurring automation for "${deletingRule?.note || deletingRule?.category?.name}"?`}
        confirmText="Delete"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingRule(null)}
      />
    </div>
  );
};

export default RecurringPage;

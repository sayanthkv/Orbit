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
import { Repeat, Plus, Trash2, Play, Pause, Calendar, Landmark, Banknote } from 'lucide-react';

export const RecurringPage = () => {
  const [rules, setRules] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [target, setTarget] = useState('account');
  const [targetAccountId, setTargetAccountId] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [note, setNote] = useState('');

  const toast = useToast();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [rulesRes, accountsRes, categoriesRes] = await Promise.all([
        api.get('/recurring'),
        api.get('/accounts'),
        api.get('/categories'),
      ]);

      if (rulesRes.success) setRules(rulesRes.data?.rules || []);
      if (accountsRes.success) {
        const accs = accountsRes.data?.accounts || [];
        setAccounts(accs);
        if (accs.length > 0 && !targetAccountId) {
          setTargetAccountId(accs[0]._id);
        }
      }
      if (categoriesRes.success) setCategories(categoriesRes.data?.categories || []);
    } catch {
      toast.error('Failed to load recurring rules');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggle = async (id) => {
    try {
      const res = await api.patch(`/recurring/${id}/toggle`);
      if (res.success) {
        toast.info(res.message);
        fetchData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to toggle rule');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this recurring rule? Existing transactions will remain.')) return;
    try {
      const res = await api.delete(`/recurring/${id}`);
      if (res.success) {
        toast.success('Recurring rule deleted');
        fetchData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete rule');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !category) {
      toast.error('Please enter amount and category');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/recurring', {
        type,
        amount: Number(amount),
        category,
        target,
        targetAccountId: target === 'account' ? targetAccountId : undefined,
        frequency,
        startDate,
        endDate: endDate || undefined,
        note,
      });

      if (res.success) {
        toast.success('Recurring rule created!');
        setIsModalOpen(false);
        setAmount('');
        setNote('');
        fetchData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight font-display">
            Recurring Transactions
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Automate daily, weekly, monthly, or yearly bills, salaries, and subscriptions
          </p>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setIsModalOpen(true)}
          className="shadow-sm shadow-emerald-600/20"
        >
          New Recurring Rule
        </Button>
      </div>

      {/* Rules List */}
      <Card>
        {isLoading ? (
          <div className="p-16 flex justify-center">
            <Spinner size="lg" />
          </div>
        ) : rules.length === 0 ? (
          <EmptyState
            icon={Repeat}
            title="No recurring rules active"
            description="Set up automatic rules for recurring rent, subscriptions, salary, or utility bills."
            action={{
              label: 'Create First Rule',
              onClick: () => setIsModalOpen(true),
            }}
          />
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-white/6">
            {rules.map((r) => (
              <div
                key={r._id}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-zinc-50 dark:hover:bg-white/2 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-bold ${
                      r.type === 'income'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    <Repeat className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-zinc-900 dark:text-white">
                        {r.category}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/10 uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                        {r.frequency}
                      </span>
                      {!r.active && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          Paused
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5 flex-wrap">
                      <span>Target: {r.target === 'cash' ? 'Cash in Hand' : r.targetAccountId?.name || 'Bank'}</span>
                      <span>•</span>
                      <span>Next Run: {formatDate(r.nextRunDate)}</span>
                      {r.note && (
                        <>
                          <span>•</span>
                          <span className="truncate">{r.note}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`text-sm font-black tabular-nums font-mono ${
                      r.type === 'income'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {r.type === 'income' ? '+' : '-'}
                    {formatCurrency(r.amount)}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleToggle(r._id)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
                    title={r.active ? 'Pause rule' : 'Resume rule'}
                  >
                    {r.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-emerald-600" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(r._id)}
                    className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-500/10 transition-colors"
                    title="Delete rule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create Recurring Rule Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Recurring Rule"
        description="Set up automatic scheduled transactions"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Toggle */}
          <div className="flex p-1 bg-zinc-100 dark:bg-white/5 rounded-xl">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                type === 'expense'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Income
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
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 font-bold"
              >
                <option value="">-- Choose Category --</option>
                {categories.filter((c) => c.type === type).map((c) => (
                  <option key={c._id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Target Source
              </label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 font-bold"
              >
                <option value="account">Bank Account</option>
                <option value="cash">Cash in Hand</option>
              </select>
            </div>

            {target === 'account' ? (
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Bank Account
                </label>
                <select
                  value={targetAccountId}
                  onChange={(e) => setTargetAccountId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 font-bold"
                  required
                >
                  {accounts.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Frequency
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 font-bold"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <Input
              label="Start Date"
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="End Date (Optional)"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <Input
              label="Note"
              placeholder="e.g. WiFi Bill, Netflix subscription"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Create Rule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RecurringPage;

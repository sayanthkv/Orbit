import React, { useState, useEffect } from 'react';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import Modal from '../../../components/Modal';
import Input from '../../../components/Input';
import Spinner from '../../../components/Spinner';
import EmptyState from '../../../components/EmptyState';
import ParallaxSection from '../../../components/parallax/ParallaxSection';
import ParallaxCard from '../../../components/parallax/ParallaxCard';
import { useToast } from '../../../components/Toast';
import api from '../../../lib/api';
import { formatCurrency } from '../../../lib/formatters';
import { PieChart, Plus, Trash2, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const BudgetsPage = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getUTCMonth() + 1);
  const [year, setYear] = useState(now.getUTCFullYear());
  const [data, setData] = useState({ budgets: [], totalBudget: 0, totalSpent: 0, totalPercentage: 0 });
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');

  const toast = useToast();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [budgetsRes, categoriesRes] = await Promise.all([
        api.get(`/budgets?month=${month}&year=${year}`),
        api.get('/categories?type=expense'),
      ]);

      if (budgetsRes.success) setData(budgetsRes.data);
      if (categoriesRes.success) setCategories(categoriesRes.data?.categories || []);
    } catch {
      toast.error('Failed to load budgets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month, year]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category || !amount || Number(amount) < 1) {
      toast.error('Please enter a valid category and budget limit');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/budgets', {
        category,
        amount: Number(amount),
      });

      if (res.success) {
        toast.success(`Budget for "${category}" saved!`);
        setIsModalOpen(false);
        setCategory('');
        setAmount('');
        fetchData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save budget');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, catName) => {
    if (!window.confirm(`Delete budget for "${catName}"?`)) return;
    try {
      const res = await api.delete(`/budgets/${id}`);
      if (res.success) {
        toast.success('Budget deleted');
        fetchData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete budget');
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight font-display">
            Monthly Budgets
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Set spending limits per category and track your progress live
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Month & Year Selectors */}
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#141418] border border-zinc-200 dark:border-white/10 font-bold"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
              <option key={m} value={m}>
                {new Date(2026, m - 1).toLocaleString('default', { month: 'short' })}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#141418] border border-zinc-200 dark:border-white/10 font-bold"
          >
            {[2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setIsModalOpen(true)}
            className="shadow-sm shadow-emerald-600/20"
          >
            Set Budget
          </Button>
        </div>
      </div>

      {/* Aggregate Overview Card */}
      <ParallaxSection depth={-12}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ParallaxCard depth={8} className="p-4 sm:p-5 bg-white/90 dark:bg-[#141418]/90 backdrop-blur-md border border-zinc-200/90 dark:border-white/10 rounded-2xl shadow-xs">
            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Total Allocated</p>
            <p className="text-xl sm:text-2xl font-black tabular-nums font-mono text-zinc-900 dark:text-white mt-1">
              {formatCurrency(data.totalBudget)}
            </p>
          </ParallaxCard>
          <ParallaxCard depth={8} className="p-4 sm:p-5 bg-white/90 dark:bg-[#141418]/90 backdrop-blur-md border border-zinc-200/90 dark:border-white/10 rounded-2xl shadow-xs">
            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Total Spent</p>
            <p className="text-xl sm:text-2xl font-black tabular-nums font-mono text-zinc-900 dark:text-white mt-1">
              {formatCurrency(data.totalSpent)}
            </p>
          </ParallaxCard>
          <ParallaxCard depth={8} className="p-4 sm:p-5 bg-white/90 dark:bg-[#141418]/90 backdrop-blur-md border border-zinc-200/90 dark:border-white/10 rounded-2xl shadow-xs">
            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Overall Pace</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xl sm:text-2xl font-black tabular-nums font-mono text-zinc-900 dark:text-white">
                {data.totalPercentage}%
              </p>
              {data.totalPercentage >= 100 ? (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  Over Limit
                </span>
              ) : data.totalPercentage >= 80 ? (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  Warning
                </span>
              ) : (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  On Track
                </span>
              )}
            </div>
          </ParallaxCard>
        </div>
      </ParallaxSection>

      {/* Category Budgets Grid */}
      {isLoading ? (
        <div className="p-16 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : data.budgets.length === 0 ? (
        <Card>
          <EmptyState
            icon={PieChart}
            title="No budgets configured"
            description="Create monthly limits for groceries, bills, dining, or shopping to keep your spending controlled."
            action={{
              label: 'Set Your First Budget',
              onClick: () => setIsModalOpen(true),
            }}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.budgets.map((b) => {
            const isDanger = b.status === 'danger';
            const isWarning = b.status === 'warning';

            return (
              <Card key={b._id} className="p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white">{b.category}</h3>
                    <p className="text-[11px] text-zinc-500">
                      Spent {formatCurrency(b.spent)} of {formatCurrency(b.amount)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-full ${
                        isDanger
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : isWarning
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {b.percentage}%
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(b._id, b.category)}
                      className="p-1 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-500/10 transition-colors"
                      title="Delete budget"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2.5 bg-zinc-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, b.percentage)}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      isDanger
                        ? 'bg-rose-500'
                        : isWarning
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-500">
                  <span>Remaining: {formatCurrency(b.remaining)}</span>
                  {isDanger && (
                    <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold">
                      <AlertTriangle className="w-3 h-3" /> Exceeded by {formatCurrency(b.spent - b.amount)}
                    </span>
                  )}
                  {isWarning && (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                      <AlertCircle className="w-3 h-3" /> Nearing monthly limit
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Set Budget Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Set Category Budget"
        description="Allocate monthly limit for an expense category"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Expense Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 font-bold"
            >
              <option value="">-- Choose Category --</option>
              {categories.map((c) => (
                <option key={c._id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Monthly Limit (INR)"
            type="number"
            min="1"
            required
            placeholder="e.g. 5000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Save Budget
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BudgetsPage;

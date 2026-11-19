import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { PAYMENT_METHODS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import { Repeat, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

const FREQUENCIES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export const RecurringFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  categories = [],
  initialData = null,
  isLoading = false,
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: '',
    frequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    note: '',
    paymentMethod: 'UPI',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        type: initialData.type || 'expense',
        amount: initialData.amount || '',
        category: initialData.category?._id || initialData.category || '',
        frequency: initialData.frequency || 'monthly',
        startDate: initialData.startDate
          ? new Date(initialData.startDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        note: initialData.note || '',
        paymentMethod: initialData.paymentMethod || 'UPI',
      });
    } else {
      const defaultCat = categories.find((c) => c.type === 'expense');
      setFormData({
        type: 'expense',
        amount: '',
        category: defaultCat ? defaultCat._id : '',
        frequency: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        note: '',
        paymentMethod: 'UPI',
      });
    }
    setErrors({});
  }, [initialData, isOpen, categories]);

  const validate = () => {
    const errs = {};
    if (!formData.amount || Number(formData.amount) <= 0) {
      errs.amount = 'Amount must be greater than 0';
    }
    if (!formData.category) {
      errs.category = 'Please select a category';
    }
    if (!formData.startDate) {
      errs.startDate = 'Start date is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...formData,
      amount: Number(formData.amount),
    });
  };

  const filteredCategories = categories.filter((c) => c.type === formData.type);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Recurring Schedule' : 'Schedule Recurring Entry'}
      description="Automate recurring expenses or regular income with node-cron"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: 'expense' })}
            className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
              formData.type === 'expense'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" />
            Recurring Expense
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: 'income' })}
            className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
              formData.type === 'income'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" />
            Recurring Income
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label={`Amount (${user?.currency || 'INR'})`}
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            required
            error={errors.amount}
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          />

          <Select
            label="Frequency"
            options={FREQUENCIES}
            value={formData.frequency}
            onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Category"
            required
            error={errors.category}
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={[
              { value: '', label: 'Select Category' },
              ...filteredCategories.map((c) => ({
                value: c._id,
                label: c.name,
              })),
            ]}
          />

          <Select
            label="Payment Method"
            options={PAYMENT_METHODS}
            value={formData.paymentMethod}
            onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="First Run / Start Date"
            type="date"
            required
            error={errors.startDate}
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />

          <Input
            label="Note / Tag"
            placeholder="e.g. Netflix, Wifi, House Rent"
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" size="md" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" size="md" isLoading={isLoading} icon={Repeat}>
            {initialData ? 'Save Changes' : 'Create Recurring Rule'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RecurringFormModal;

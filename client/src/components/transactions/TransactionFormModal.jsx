import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { PAYMENT_METHODS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import { Plus, Check, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

export const TransactionFormModal = ({
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
    date: new Date().toISOString().split('T')[0],
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
        date: initialData.date
          ? new Date(initialData.date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        note: initialData.note || '',
        paymentMethod: initialData.paymentMethod || 'UPI',
      });
    } else {
      // Default initial state
      const defaultCat = categories.find((c) => c.type === 'expense');
      setFormData({
        type: 'expense',
        amount: '',
        category: defaultCat ? defaultCat._id : '',
        date: new Date().toISOString().split('T')[0],
        note: '',
        paymentMethod: 'UPI',
      });
    }
    setErrors({});
  }, [initialData, isOpen, categories]);

  // When type changes, adjust category selection to first matching category
  const handleTypeChange = (newType) => {
    const matchingCat = categories.find((c) => c.type === newType);
    setFormData((prev) => ({
      ...prev,
      type: newType,
      category: matchingCat ? matchingCat._id : '',
    }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.amount || Number(formData.amount) <= 0) {
      errs.amount = 'Please enter a valid amount greater than 0';
    }
    if (!formData.category) {
      errs.category = 'Please select a category';
    }
    if (!formData.date) {
      errs.date = 'Date is required';
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
      title={initialData ? 'Edit Transaction' : 'Record Transaction'}
      description="Track where your money came from or where it went"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          <button
            type="button"
            onClick={() => handleTypeChange('expense')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              formData.type === 'expense'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" />
            Expense
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('income')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              formData.type === 'income'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" />
            Income
          </button>
        </div>

        {/* Amount Input */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Amount ({user?.currency || 'INR'}) <span className="text-rose-500">*</span>
          </label>
          <div className="relative mt-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
              {user?.currency === 'INR' ? '₹' : '$'}
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className={`w-full rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 pl-8 pr-3.5 py-2.5 text-base font-semibold outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-slate-950 ${
                errors.amount
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                  : 'border-slate-200 dark:border-slate-800 focus:border-emerald-500 focus:ring-emerald-500/20'
              }`}
            />
          </div>
          {errors.amount && (
            <p className="text-xs text-rose-500 font-medium mt-1">{errors.amount}</p>
          )}
        </div>

        {/* Category & Payment Method in grid */}
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
            required
            value={formData.paymentMethod}
            onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
            options={PAYMENT_METHODS}
          />
        </div>

        {/* Date & Note */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Date"
            type="date"
            required
            error={errors.date}
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />

          <Input
            label="Note / Description"
            type="text"
            placeholder="e.g. Swiggy lunch, Taxi fare"
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3">
          <Button variant="outline" size="md" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="md"
            isLoading={isLoading}
            icon={initialData ? Check : Plus}
          >
            {initialData ? 'Save Changes' : 'Add Transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TransactionFormModal;

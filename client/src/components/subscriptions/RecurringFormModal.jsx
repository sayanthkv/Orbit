import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { PAYMENT_METHODS } from '../../utils/constants';
import {
  Plus,
  Check,
  RotateCcw,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowRightLeft,
  Calendar,
} from 'lucide-react';

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily (Every Day)' },
  { value: 'weekly', label: 'Weekly (Every 7 Days)' },
  { value: 'monthly', label: 'Monthly (Every Month)' },
  { value: 'yearly', label: 'Yearly (Annual Renewal)' },
];

export const RecurringFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  categories = [],
  accounts = [],
  isLoading = false,
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    type: 'expense',
    note: '',
    amount: '',
    frequency: 'monthly',
    category: '',
    account: '',
    toAccount: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    paymentMethod: 'card',
    isActive: true,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        type: initialData.type || 'expense',
        note: initialData.note || '',
        amount: initialData.amount !== undefined ? String(initialData.amount) : '',
        frequency: initialData.frequency || 'monthly',
        category: initialData.category?._id || initialData.category || '',
        account: initialData.account?._id || initialData.account || accounts[0]?._id || '',
        toAccount: initialData.toAccount?._id || initialData.toAccount || '',
        startDate: initialData.startDate
          ? new Date(initialData.startDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        endDate: initialData.endDate
          ? new Date(initialData.endDate).toISOString().split('T')[0]
          : '',
        paymentMethod: initialData.paymentMethod || 'card',
        isActive: initialData.isActive !== undefined ? initialData.isActive : true,
      });
    } else {
      const defaultCat = categories.find((c) => c.type === 'expense')?._id || categories[0]?._id || '';
      const defaultAcc = accounts.find((a) => a.isDefault)?._id || accounts[0]?._id || '';
      const altAcc = accounts.find((a) => a._id !== defaultAcc)?._id || '';

      setFormData({
        type: 'expense',
        note: '',
        amount: '',
        frequency: 'monthly',
        category: defaultCat,
        account: defaultAcc,
        toAccount: altAcc,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        paymentMethod: 'card',
        isActive: true,
      });
    }
    setErrors({});
  }, [initialData, isOpen, categories, accounts]);

  const validate = () => {
    const errs = {};
    if (!formData.note.trim()) {
      errs.note = 'Please enter a name or description (e.g. Netflix, Gym, Rent)';
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      errs.amount = 'Please enter a valid amount greater than 0';
    }
    if (!formData.account) {
      errs.account = 'Please select an account';
    }
    if (formData.type === 'transfer') {
      if (!formData.toAccount) {
        errs.toAccount = 'Destination account is required for transfer';
      } else if (formData.toAccount === formData.account) {
        errs.toAccount = 'Destination must be different from source account';
      }
    } else {
      if (!formData.category) {
        errs.category = 'Please select a category';
      }
    }
    if (!formData.startDate) {
      errs.startDate = 'Start date is required';
    }
    if (formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      errs.endDate = 'End date cannot be earlier than start date';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      ...formData,
      amount: Number(formData.amount),
      endDate: formData.endDate ? formData.endDate : null,
    };
    if (formData.type === 'transfer') {
      delete payload.category;
    } else {
      delete payload.toAccount;
    }
    onSubmit(payload);
  };

  const isExpense = formData.type === 'expense';
  const isIncome = formData.type === 'income';
  const isTransfer = formData.type === 'transfer';

  const filteredCategories = categories.filter((c) =>
    isTransfer ? false : c.type === formData.type
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Recurring Schedule' : 'New Subscription / Recurring Rule'}
      description="Automate repetitive charges, bills, and scheduled inter-account transfers"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Toggle Pills */}
        <div className="flex p-1 bg-zinc-100 border border-zinc-200/80 rounded-2xl gap-1 dark:bg-[#1c1c20] dark:border-white/8 transition-colors">
          <button
            type="button"
            onClick={() => setFormData((p) => ({ ...p, type: 'expense' }))}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isExpense
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>Expense</span>
          </button>
          <button
            type="button"
            onClick={() => setFormData((p) => ({ ...p, type: 'income' }))}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isIncome
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" />
            <span>Income</span>
          </button>
          <button
            type="button"
            onClick={() => setFormData((p) => ({ ...p, type: 'transfer' }))}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isTransfer
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Transfer</span>
          </button>
        </div>

        {/* Subscription Name / Service Note */}
        <Input
          label="Subscription / Bill Name"
          placeholder="e.g. Netflix, Spotify, Gym Membership, House Rent"
          value={formData.note}
          error={errors.note}
          onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          required
        />

        {/* Amount & Frequency */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider block mb-1">
              Amount ({user?.currency === 'INR' ? '₹' : '$'})
            </label>
            <input
              type="number"
              step="any"
              min="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className={`w-full rounded-xl border bg-white border-zinc-200 text-zinc-900 px-3.5 py-2.5 text-base font-bold outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-400/15 dark:bg-[#1c1c20] dark:text-zinc-100 dark:border-white/10 transition-all ${
                errors.amount ? 'border-rose-400 dark:border-rose-500/50' : ''
              }`}
            />
            {errors.amount && (
              <p className="text-xs text-rose-500 font-medium mt-1">{errors.amount}</p>
            )}
          </div>

          <Select
            label="Billing Frequency"
            value={formData.frequency}
            onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
            options={FREQUENCY_OPTIONS}
            required
          />
        </div>

        {/* Account & Category (or Destination Account for transfers) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Select
            label={isTransfer ? 'From Account' : 'Account'}
            value={formData.account}
            error={errors.account}
            onChange={(e) => setFormData({ ...formData, account: e.target.value })}
            options={[
              { value: '', label: 'Select Account' },
              ...accounts.map((acc) => ({
                value: acc._id,
                label: `${acc.bankName || acc.name}${acc.accountNumber ? ` (•••• ${acc.accountNumber})` : ''}`,
              })),
            ]}
            required
          />

          {isTransfer ? (
            <Select
              label="To Account (Destination)"
              value={formData.toAccount}
              error={errors.toAccount}
              onChange={(e) => setFormData({ ...formData, toAccount: e.target.value })}
              options={[
                { value: '', label: 'Select Destination' },
                ...accounts
                  .filter((a) => a._id !== formData.account)
                  .map((acc) => ({
                    value: acc._id,
                    label: `${acc.bankName || acc.name}${acc.accountNumber ? ` (•••• ${acc.accountNumber})` : ''}`,
                  })),
              ]}
              required
            />
          ) : (
            <Select
              label="Category"
              value={formData.category}
              error={errors.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={[
                { value: '', label: 'Select Category' },
                ...filteredCategories.map((c) => ({
                  value: c._id,
                  label: c.name,
                })),
              ]}
              required
            />
          )}
        </div>

        {/* Start Date & Optional End Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Input
            label="First Billing Date"
            type="date"
            value={formData.startDate}
            error={errors.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />

          <Input
            label="End Date (Optional)"
            type="date"
            value={formData.endDate}
            error={errors.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            helperText="Leave empty to renew indefinitely"
          />
        </div>

        {/* Payment Method & Active Toggle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 items-center">
          <Select
            label="Payment Channel"
            value={formData.paymentMethod}
            onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
            options={PAYMENT_METHODS}
          />

          <div className="pt-4">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 border-zinc-300 focus:ring-emerald-500 dark:border-white/20 dark:bg-zinc-800"
              />
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Rule is currently Active
              </span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-4 border-t border-zinc-100 dark:border-white/8 mt-4">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto text-xs font-bold"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="md"
            isLoading={isLoading}
            variant="primary"
            icon={initialData ? Check : Plus}
            className="w-full sm:w-auto text-xs font-bold"
          >
            {initialData ? 'Save Changes' : 'Create Recurring Rule'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RecurringFormModal;

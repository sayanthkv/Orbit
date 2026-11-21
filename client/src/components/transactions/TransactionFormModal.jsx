import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { PAYMENT_METHODS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import { useAccounts } from '../../context/AccountContext';
import { Plus, Check, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

export const TransactionFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  categories = [],
  initialData = null,
  defaultType = 'expense',
  isLoading = false,
}) => {
  const { user } = useAuth();
  const { accounts, selectedAccountId, activeDashboardAccountId } = useAccounts();
  const [formData, setFormData] = useState({
    type: defaultType,
    amount: '',
    category: '',
    account: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
    paymentMethod: 'UPI',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const preferredAccId =
      activeDashboardAccountId ||
      (selectedAccountId !== 'all' ? selectedAccountId : '') ||
      accounts.find((a) => a.isDefault)?._id ||
      accounts[0]?._id ||
      '';

    if (initialData) {
      setFormData({
        type: initialData.type || defaultType,
        amount: initialData.amount || '',
        category: initialData.category?._id || initialData.category || '',
        account: initialData.account?._id || initialData.account || preferredAccId,
        date: initialData.date
          ? new Date(initialData.date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        note: initialData.note || '',
        paymentMethod: initialData.paymentMethod || 'UPI',
      });
    } else {
      const defaultCat = categories.find((c) => c.type === defaultType);
      setFormData({
        type: defaultType,
        amount: '',
        category: defaultCat ? defaultCat._id : '',
        account: preferredAccId,
        date: new Date().toISOString().split('T')[0],
        note: '',
        paymentMethod: 'UPI',
      });
    }
    setErrors({});
  }, [initialData, isOpen, categories, defaultType, accounts, selectedAccountId, activeDashboardAccountId]);

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
      errs.amount = 'Please enter an amount';
    }
    if (!formData.category) {
      errs.category = 'Select a category';
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
  const isExpense = formData.type === 'expense';

  const modalTitle = initialData
    ? isExpense ? 'Edit Expense' : 'Edit Income'
    : isExpense ? 'Log Expense' : 'Log Income';

  const modalDescription = isExpense
    ? 'Record an outflow transaction against your chosen account'
    : 'Record an inflow or credit to your chosen account';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      description={modalDescription}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Toggle Pills */}
        <div className="flex p-1 sm:p-1.5 bg-zinc-100 border border-zinc-200/80 rounded-full gap-1 dark:bg-[#1c1c20] dark:border-white/8 transition-colors">
          <button
            type="button"
            onClick={() => handleTypeChange('expense')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 sm:py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
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
            onClick={() => handleTypeChange('income')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 sm:py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              !isExpense
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" />
            <span>Income</span>
          </button>
        </div>

        {/* Amount Input */}
        <div>
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider block mb-1">
            Amount
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-zinc-400 dark:text-zinc-500">
              {user?.currency === 'INR' ? '₹' : '$'}
            </span>
            <input
              type="number"
              step="any"
              min="0.01"
              inputMode="decimal"
              autoFocus
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className={`w-full rounded-2xl border bg-white border-zinc-200 text-zinc-900 pl-11 pr-4 py-3 sm:py-3.5 text-2xl sm:text-3xl font-black tracking-tight outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-400/15 dark:bg-[#1c1c20] dark:text-zinc-100 dark:border-white/10 dark:focus:border-white/30 dark:focus:ring-white/10 transition-all ${
                errors.amount ? 'border-rose-400 dark:border-rose-500/50' : ''
              }`}
            />
          </div>
          {errors.amount && (
            <p className="text-xs text-rose-500 font-medium mt-1">{errors.amount}</p>
          )}
        </div>

        {/* Account & Category (Responsive 1-col on mobile, 2-col on tablet/desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Select
            label="Account / Institution"
            value={formData.account}
            onChange={(e) => setFormData({ ...formData, account: e.target.value })}
            options={accounts.map((acc) => ({
              value: acc._id,
              label: `${acc.bankName || acc.name}${acc.accountNumber ? ` (•••• ${acc.accountNumber})` : ` (${acc.type})`}`,
            }))}
          />

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
        </div>

        {/* Payment Method & Date (Responsive 1-col on mobile, 2-col on tablet/desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Select
            label="Payment Method"
            required
            value={formData.paymentMethod}
            onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
            options={PAYMENT_METHODS}
          />

          <Input
            label="Date"
            type="date"
            required
            error={errors.date}
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>

        {/* Note / Description */}
        <Input
          label="Note / Description"
          type="text"
          placeholder="e.g. Groceries, Rent, Salary, Coffee"
          value={formData.note}
          onChange={(e) => setFormData({ ...formData, note: e.target.value })}
        />

        {/* Action Buttons (Full width on mobile, right-aligned on tablet/desktop) */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-4 border-t border-zinc-100 dark:border-white/8 mt-4">
          <Button
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
            variant={isExpense ? 'danger' : 'primary'}
            icon={initialData ? Check : Plus}
            className="w-full sm:w-auto text-xs font-bold"
          >
            {initialData
              ? isExpense ? 'Update Expense' : 'Update Income'
              : isExpense ? 'Record Expense' : 'Record Income'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TransactionFormModal;

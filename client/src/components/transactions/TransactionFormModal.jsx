import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { PAYMENT_METHODS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import { useAccounts } from '../../context/AccountContext';
import { Plus, Check, ArrowDownCircle, ArrowUpCircle, ArrowRightLeft } from 'lucide-react';

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
    toAccount: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
    paymentMethod: 'UPI',
    tags: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const preferredAccId =
      activeDashboardAccountId ||
      (selectedAccountId !== 'all' ? selectedAccountId : '') ||
      accounts.find((a) => a.isDefault)?._id ||
      accounts[0]?._id ||
      '';

    // Pick a distinct default toAccount if available for transfer
    const otherAccount = accounts.find((a) => a._id !== preferredAccId)?._id || '';

    if (initialData) {
      setFormData({
        type: initialData.type || defaultType,
        amount: initialData.amount || '',
        category: initialData.category?._id || initialData.category || '',
        account: initialData.account?._id || initialData.account || preferredAccId,
        toAccount: initialData.toAccount?._id || initialData.toAccount || otherAccount,
        date: initialData.date
          ? new Date(initialData.date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        note: initialData.note || '',
        paymentMethod: initialData.paymentMethod || (initialData.type === 'transfer' ? 'bank' : 'UPI'),
        tags: Array.isArray(initialData.tags) ? initialData.tags.join(', ') : initialData.tags || '',
      });
    } else {
      const defaultCat = categories.find((c) => c.type === defaultType);
      setFormData({
        type: defaultType,
        amount: '',
        category: defaultCat ? defaultCat._id : '',
        account: preferredAccId,
        toAccount: otherAccount,
        date: new Date().toISOString().split('T')[0],
        note: '',
        paymentMethod: defaultType === 'transfer' ? 'bank' : 'UPI',
        tags: '',
      });
    }
    setErrors({});
  }, [initialData, isOpen, categories, defaultType, accounts, selectedAccountId, activeDashboardAccountId]);

  const handleTypeChange = (newType) => {
    if (newType === 'transfer') {
      const otherAccount = accounts.find((a) => a._id !== formData.account)?._id || '';
      setFormData((prev) => ({
        ...prev,
        type: 'transfer',
        toAccount: prev.toAccount && prev.toAccount !== prev.account ? prev.toAccount : otherAccount,
        paymentMethod: 'bank',
      }));
    } else {
      const matchingCat = categories.find((c) => c.type === newType);
      setFormData((prev) => ({
        ...prev,
        type: newType,
        category: matchingCat ? matchingCat._id : '',
      }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.amount || Number(formData.amount) <= 0) {
      errs.amount = 'Please enter an amount greater than 0';
    }
    if (!formData.account) {
      errs.account = 'Please select a source account';
    }

    if (formData.type === 'transfer') {
      if (!formData.toAccount) {
        errs.toAccount = 'Please select a destination account';
      } else if (formData.toAccount === formData.account) {
        errs.toAccount = 'Destination must be different from source account';
      }
    } else {
      if (!formData.category) {
        errs.category = 'Select a category';
      }
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
    const payload = {
      ...formData,
      amount: Number(formData.amount),
      tags: formData.tags
        ? formData.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
        : [],
    };
    if (formData.type === 'transfer') {
      delete payload.category; // Backend handles transfer category resolution automatically
    } else {
      delete payload.toAccount;
    }
    onSubmit(payload);
  };

  const isExpense = formData.type === 'expense';
  const isIncome = formData.type === 'income';
  const isTransfer = formData.type === 'transfer';

  const filteredCategories = categories.filter((c) => c.type === formData.type);

  const modalTitle = initialData
    ? isTransfer
      ? 'Edit Transfer'
      : isExpense
      ? 'Edit Expense'
      : 'Edit Income'
    : isTransfer
    ? 'Transfer Between Accounts'
    : isExpense
    ? 'Log Expense'
    : 'Log Income';

  const modalDescription = isTransfer
    ? 'Move money between your accounts without affecting your net worth'
    : isExpense
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
        {/* Type Toggle Pills: 3-Way Split (Expense | Income | Transfer) */}
        <div className="flex p-1 sm:p-1.5 bg-zinc-100 border border-zinc-200/80 rounded-2xl gap-1 dark:bg-[#1c1c20] dark:border-white/8 transition-colors">
          <button
            type="button"
            onClick={() => handleTypeChange('expense')}
            className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isExpense
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4 shrink-0" />
            <span>Expense</span>
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('income')}
            className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isIncome
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4 shrink-0" />
            <span>Income</span>
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('transfer')}
            className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isTransfer
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4 shrink-0" />
            <span>Transfer</span>
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

        {/* Transfer Mode Accounts Selector */}
        {isTransfer ? (
          <div className="space-y-3 p-3.5 rounded-2xl bg-violet-50/60 border border-violet-100 dark:bg-violet-950/20 dark:border-violet-800/30">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="From Account (Source)"
                value={formData.account}
                error={errors.account}
                onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                options={[
                  { value: '', label: 'Select Source Account' },
                  ...accounts.map((acc) => ({
                    value: acc._id,
                    label: `${acc.bankName || acc.name}${acc.accountNumber ? ` (•••• ${acc.accountNumber})` : ''}`,
                  })),
                ]}
              />

              <Select
                label="To Account (Destination)"
                value={formData.toAccount}
                error={errors.toAccount}
                onChange={(e) => setFormData({ ...formData, toAccount: e.target.value })}
                options={[
                  { value: '', label: 'Select Destination Account' },
                  ...accounts
                    .filter((acc) => acc._id !== formData.account)
                    .map((acc) => ({
                      value: acc._id,
                      label: `${acc.bankName || acc.name}${acc.accountNumber ? ` (•••• ${acc.accountNumber})` : ''}`,
                    })),
                ]}
              />
            </div>
            <p className="text-[11px] text-violet-700 dark:text-violet-300 font-medium flex items-center gap-1.5">
              <ArrowRightLeft className="w-3.5 h-3.5 shrink-0" />
              <span>Transfers update account balances atomically and are neutral to net worth.</span>
            </p>
          </div>
        ) : (
          /* Standard Expense / Income: Account & Category */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Select
              label="Account / Institution"
              value={formData.account}
              error={errors.account}
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
        )}

        {/* Payment Method & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Select
            label="Payment Method / Channel"
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
          placeholder={
            isTransfer
              ? 'e.g. Monthly savings transfer, Credit card bill payoff'
              : 'e.g. Groceries, Rent, Salary, Coffee'
          }
          value={formData.note}
          onChange={(e) => setFormData({ ...formData, note: e.target.value })}
        />

        {/* Tags */}
        <Input
          label="Tags (Optional)"
          type="text"
          placeholder="e.g. vacation, weekend, tax-deductible (comma-separated)"
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
        />

        {/* Action Buttons */}
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
            variant={isTransfer ? 'primary' : isExpense ? 'danger' : 'primary'}
            icon={initialData ? Check : Plus}
            className={`w-full sm:w-auto text-xs font-bold ${
              isTransfer ? '!bg-violet-600 hover:!bg-violet-700 !text-white' : ''
            }`}
          >
            {initialData
              ? isTransfer
                ? 'Update Transfer'
                : isExpense
                ? 'Update Expense'
                : 'Update Income'
              : isTransfer
              ? 'Complete Transfer'
              : isExpense
              ? 'Record Expense'
              : 'Record Income'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TransactionFormModal;

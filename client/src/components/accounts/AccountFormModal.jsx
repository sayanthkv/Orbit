import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import {
  Building,
  Banknote,
  CreditCard,
  PiggyBank,
  Wallet,
  Layers,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

const ACCOUNT_TYPE_OPTIONS = [
  { value: 'bank', label: 'Bank Account' },
  { value: 'card', label: 'Credit / Debit Card' },
  { value: 'savings', label: 'Savings & Deposit' },
  { value: 'cash', label: 'Cash / Physical Wallet' },
  { value: 'wallet', label: 'Digital Wallet (UPI/Paytm)' },
  { value: 'other', label: 'Other Account' },
];

const PRESET_BANKS = [
  { name: 'HDFC Bank', type: 'bank', color: '#004C8F' },
  { name: 'State Bank of India', type: 'bank', color: '#280071' },
  { name: 'ICICI Bank', type: 'bank', color: '#F37021' },
  { name: 'Axis Bank', type: 'bank', color: '#97144D' },
  { name: 'Chase', type: 'bank', color: '#117ACA' },
  { name: 'Revolut', type: 'bank', color: '#0075EB' },
  { name: 'Cash Wallet', type: 'cash', color: '#10B981' },
  { name: 'Credit Card', type: 'card', color: '#6366F1' },
];

const PRESET_COLORS = [
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#64748B', // Slate
];

export const AccountFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isLoading = false,
}) => {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';

  const [formData, setFormData] = useState({
    name: '',
    bankName: '',
    accountNumber: '',
    type: 'bank',
    initialBalance: '',
    color: '#10B981',
    isDefault: false,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        bankName: initialData.bankName || initialData.name || '',
        accountNumber: initialData.accountNumber || '',
        type: initialData.type || 'bank',
        initialBalance: initialData.initialBalance !== undefined ? String(initialData.initialBalance) : '0',
        color: initialData.color || '#10B981',
        isDefault: Boolean(initialData.isDefault),
      });
    } else {
      setFormData({
        name: '',
        bankName: '',
        accountNumber: '',
        type: 'bank',
        initialBalance: '0',
        color: '#10B981',
        isDefault: false,
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const handleSelectBankPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      bankName: preset.name,
      name: prev.name && prev.name !== prev.bankName ? prev.name : preset.name,
      type: preset.type || prev.type,
      color: preset.color || prev.color,
    }));
  };

  const validate = () => {
    const errs = {};
    const finalName = formData.name.trim() || formData.bankName.trim();
    if (!finalName) {
      errs.name = 'Please provide an account or bank name';
    }
    if (formData.initialBalance === '' || isNaN(Number(formData.initialBalance))) {
      errs.initialBalance = 'Please enter a valid number';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!validate()) return;
    const finalName = formData.name.trim() || formData.bankName.trim();
    onSubmit({
      ...formData,
      name: finalName,
      bankName: formData.bankName.trim() || finalName,
      accountNumber: formData.accountNumber.trim(),
      initialBalance: Number(formData.initialBalance),
    });
  };

  const footerAction = (
    <div className="flex items-center justify-end gap-2 w-full">
      <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading} className="w-1/3 sm:w-auto">
        Cancel
      </Button>
      <Button type="button" onClick={handleSubmit} variant="primary" isLoading={isLoading} className="flex-1 sm:flex-initial shadow-md">
        {initialData ? 'Save Changes' : 'Create Account'}
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Bank Account' : 'Add New Bank / Account'}
      description="Track distinct bank accounts, cards, or cash wallets"
      footer={footerAction}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Quick Bank Presets */}
        <div>
          <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Quick Select Institution</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_BANKS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleSelectBankPreset(preset)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                  formData.bankName === preset.name
                    ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-950 dark:border-white'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:bg-white/[0.04] dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/[0.08]'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Bank Name */}
        <Input
          label="Bank / Institution Name"
          placeholder="e.g. HDFC Bank, Chase, SBI, Revolut, Cash"
          value={formData.bankName}
          onChange={(e) => {
            const val = e.target.value;
            setFormData((prev) => ({
              ...prev,
              bankName: val,
              name: prev.name === prev.bankName || !prev.name ? val : prev.name,
            }));
          }}
          helperText="The financial institution or wallet provider"
          required
        />

        {/* Account Display Name / Label */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Account Display Name"
            placeholder="e.g. Primary Salary, Daily Spending"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            error={errors.name}
            required
          />

          {/* Last 4 Digits (Optional) */}
          <Input
            label="Card / Account Last 4 (Optional)"
            placeholder="e.g. 9286"
            maxLength={4}
            value={formData.accountNumber}
            onChange={(e) => setFormData((prev) => ({ ...prev, accountNumber: e.target.value.replace(/\D/g, '') }))}
            helperText="Renders as •••• 9286 on your card"
          />
        </div>

        {/* Type */}
        <Select
          label="Account Type"
          value={formData.type}
          onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
          options={ACCOUNT_TYPE_OPTIONS}
          required
        />

        {/* Starting / Initial Balance */}
        <div>
          <Input
            label={`Starting Balance (${currency})`}
            type="number"
            step="any"
            placeholder="0.00"
            value={formData.initialBalance}
            onChange={(e) => setFormData((prev) => ({ ...prev, initialBalance: e.target.value }))}
            error={errors.initialBalance}
            helperText="Initial balance before any recorded expenses or deposits."
          />
          {initialData && (
            <div className="flex items-start gap-2 mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Note: Updating starting balance adjusts this account's live balance.
              </span>
            </div>
          )}
        </div>

        {/* Color Palette */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
            Card Accent Color
          </label>
          <div className="flex flex-wrap gap-2.5 items-center">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, color: c }))}
                className={`w-7 h-7 rounded-full transition-all cursor-pointer ${
                  formData.color === c
                    ? 'ring-2 ring-offset-2 ring-zinc-950 dark:ring-white dark:ring-offset-zinc-900 scale-110'
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>

        {/* Is Default Checkbox */}
        <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={formData.isDefault}
            onChange={(e) => setFormData((prev) => ({ ...prev, isDefault: e.target.checked }))}
            className="w-4 h-4 rounded text-zinc-900 border-zinc-300 focus:ring-zinc-900 dark:border-white/20 dark:bg-zinc-800"
          />
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Set as Primary / Default Account
          </span>
        </label>
      </form>
    </Modal>
  );
};

export default AccountFormModal;

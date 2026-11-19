import React, { useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatters';
import { PiggyBank, Plus } from 'lucide-react';

export const DepositModal = ({
  isOpen,
  onClose,
  onSubmit,
  goal,
  isLoading = false,
}) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError('Please enter an amount greater than 0');
      return;
    }
    onSubmit(Number(amount));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Savings to "${goal?.title}"`}
      description="Record funds added towards reaching your target"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1">
          <p className="font-semibold text-emerald-900 dark:text-emerald-200">
            Current Progress: {formatCurrency(goal?.currentAmount, user?.currency)} of{' '}
            {formatCurrency(goal?.targetAmount, user?.currency)} ({goal?.percentage}%)
          </p>
          <p className="text-emerald-700 dark:text-emerald-300">
            Remaining: {formatCurrency(goal?.remaining, user?.currency)}
          </p>
        </div>

        <Input
          label={`Deposit Amount (${user?.currency || 'INR'})`}
          type="number"
          min="1"
          placeholder="e.g. 5000"
          required
          error={error}
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setError('');
          }}
        />

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" size="md" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" size="md" isLoading={isLoading} icon={Plus}>
            Deposit Funds
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default DepositModal;

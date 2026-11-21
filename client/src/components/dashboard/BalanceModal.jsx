import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Check } from 'lucide-react';

export const BalanceModal = ({ isOpen, onClose, onSuccess, currentBalance = 0 }) => {
  const { user, updatePreferences } = useAuth();
  const [balance, setBalance] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      setBalance(currentBalance ? String(currentBalance) : '');
    }
  }, [isOpen, currentBalance]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const num = Number(balance);
    if (isNaN(num)) {
      toast.error('Please enter a valid number');
      return;
    }

    try {
      setIsLoading(true);
      const res = await updatePreferences({
        initialBalance: num,
        hasSetInitialBalance: true,
      });

      if (res && res.success) {
        toast.success('Starting balance saved successfully!');
        if (onSuccess) onSuccess(num);
        onClose();
      }
    } catch (err) {
      toast.error('Failed to update balance');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={user?.hasSetInitialBalance ? 'Edit Starting Balance' : 'Add Starting Balance'}
      description="Set your account's opening balance to accurately track total net worth"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-5 pt-1">
        <div>
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
            Starting Balance Amount ({user?.currency || 'INR'})
          </label>
          <div className="relative mt-2">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-zinc-400 dark:text-zinc-500">
              {user?.currency === 'INR' ? '₹' : '$'}
            </span>
            <input
              type="number"
              step="any"
              autoFocus
              placeholder="0.00"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="w-full rounded-2xl border border-zinc-200 bg-white text-zinc-900 pl-10 pr-4 py-3.5 text-2xl font-bold tracking-tight outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-400/15 dark:border-white/10 dark:bg-[#1c1c20] dark:text-zinc-100 dark:focus:border-white/30 dark:focus:ring-white/10 transition-all"
            />
          </div>
          <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">
            Your total net worth will automatically equal this starting balance plus all income minus your tracked expenses.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button variant="outline" size="md" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" size="md" isLoading={isLoading} icon={Check}>
            Save Balance
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default BalanceModal;

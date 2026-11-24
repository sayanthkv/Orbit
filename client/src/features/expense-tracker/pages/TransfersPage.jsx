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
import { ArrowLeftRight, Plus, Trash2, Landmark, Banknote, Calendar, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const TransfersPage = () => {
  const [transfers, setTransfers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [cashBalance, setCashBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Transfer form state
  const [fromType, setFromType] = useState('account');
  const [fromAccount, setFromAccount] = useState('');
  const [toType, setToType] = useState('cash');
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  const toast = useToast();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [transfersRes, accountsRes, cashRes] = await Promise.all([
        api.get('/transfers'),
        api.get('/accounts'),
        api.get('/cash'),
      ]);

      if (transfersRes.success) setTransfers(transfersRes.data?.transfers || []);
      if (accountsRes.success) {
        const accs = accountsRes.data?.accounts || [];
        setAccounts(accs);
        if (accs.length > 0 && !fromAccount) {
          setFromAccount(accs[0]._id);
        }
      }
      if (cashRes.success) {
        setCashBalance(cashRes.data?.profile?.currentBalance || 0);
      }
    } catch {
      toast.error('Failed to load transfers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute selected source balance
  const sourceBalance = fromType === 'cash'
    ? cashBalance
    : accounts.find((a) => a._id === fromAccount)?.currentBalance || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Enter a valid transfer amount');
      return;
    }

    if (numAmount > sourceBalance) {
      toast.error(`Transfer amount exceeds available balance (₹${sourceBalance.toFixed(2)})`);
      return;
    }

    if (fromType === toType && fromType === 'account' && fromAccount === toAccount) {
      toast.error('Source and destination account cannot be the same');
      return;
    }

    if (fromType === toType && fromType === 'cash') {
      toast.error('Cannot transfer from cash to cash');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/transfers', {
        fromType,
        fromAccount: fromType === 'account' ? fromAccount : undefined,
        toType,
        toAccount: toType === 'account' ? toAccount : undefined,
        amount: numAmount,
        date,
        note,
      });

      if (res.success) {
        toast.success('Transfer completed successfully!');
        setIsModalOpen(false);
        setAmount('');
        setNote('');
        fetchData();
      }
    } catch (err) {
      toast.error(err.message || 'Transfer failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transfer? The balances will be reversed.')) return;
    try {
      const res = await api.delete(`/transfers/${id}`);
      if (res.success) {
        toast.success('Transfer deleted and balance reversed');
        fetchData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete transfer');
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight font-display">
            Transfers
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Move money between bank accounts and cash without affecting income or expense totals
          </p>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setIsModalOpen(true)}
          className="shadow-sm shadow-emerald-600/20"
        >
          Transfer Money
        </Button>
      </div>

      {/* Transfers List */}
      <Card>
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Spinner size="lg" />
          </div>
        ) : transfers.length === 0 ? (
          <EmptyState
            icon={ArrowLeftRight}
            title="No transfers yet"
            description="Transfer money between your bank accounts, withdraw cash from an ATM, or deposit cash to a bank."
            action={{
              label: 'Make a Transfer',
              onClick: () => setIsModalOpen(true),
            }}
          />
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-white/6">
            {transfers.map((t) => (
              <div
                key={t._id}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-zinc-50 dark:hover:bg-white/2 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                    <ArrowLeftRight className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap text-xs font-bold text-zinc-900 dark:text-white">
                      <span>{t.fromType === 'cash' ? 'Cash in Hand' : t.fromAccount?.name || 'Bank'}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{t.toType === 'cash' ? 'Cash in Hand' : t.toAccount?.name || 'Bank'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                      <span>{formatDate(t.date)}</span>
                      {t.note && (
                        <>
                          <span>•</span>
                          <span className="truncate">{t.note}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-black tabular-nums font-mono text-cyan-600 dark:text-cyan-400">
                    {formatCurrency(t.amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(t._id)}
                    className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Reverse transfer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* New Transfer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Transfer Funds"
        description="Shift liquidity between accounts or cash"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Source Selector */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                From (Source)
              </label>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold tabular-nums font-mono">
                Available: {formatCurrency(sourceBalance)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFromType('account')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  fromType === 'account'
                    ? 'border-emerald-600 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <Landmark className="w-4 h-4" />
                <span>Bank Account</span>
              </button>
              <button
                type="button"
                onClick={() => setFromType('cash')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  fromType === 'cash'
                    ? 'border-emerald-600 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Cash in Hand</span>
              </button>
            </div>

            {fromType === 'account' && (
              <select
                value={fromAccount}
                onChange={(e) => setFromAccount(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 font-bold mt-1"
              >
                {accounts.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name} ({formatCurrency(a.currentBalance)})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Destination Selector */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
              To (Destination)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setToType('account')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  toType === 'account'
                    ? 'border-emerald-600 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <Landmark className="w-4 h-4" />
                <span>Bank Account</span>
              </button>
              <button
                type="button"
                onClick={() => setToType('cash')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  toType === 'cash'
                    ? 'border-emerald-600 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Cash in Hand</span>
              </button>
            </div>

            {toType === 'account' && (
              <select
                value={toAccount}
                onChange={(e) => setToAccount(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 font-bold mt-1"
                required
              >
                <option value="">-- Choose destination bank account --</option>
                {accounts.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name} ({formatCurrency(a.currentBalance)})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Amount */}
          <Input
            label="Transfer Amount (INR)"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          {/* Date & Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <Input
              label="Note / Reference"
              placeholder="e.g. ATM withdrawal, rent deposit"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Confirm Transfer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TransfersPage;

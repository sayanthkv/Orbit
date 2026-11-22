import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAccounts } from '../context/AccountContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { transactionApi } from '../api/transactionApi';
import { categoryApi } from '../api/categoryApi';
import { analyticsApi } from '../api/analyticsApi';
import { formatCurrency } from '../utils/formatters';
import TransactionItem from '../components/transactions/TransactionItem';
import TransactionFormModal from '../components/transactions/TransactionFormModal';
import AssetAllocationPieChart from '../components/accounts/AssetAllocationPieChart';
import CashflowTrendChart from '../components/dashboard/CashflowTrendChart';
import NetWorthTrendChart from '../components/dashboard/NetWorthTrendChart';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import {
  ArrowLeft,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Building,
  Receipt,
  Plus,
  PieChart,
  Search,
  X,
} from 'lucide-react';

export const CombinedAccountsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const currency = user?.currency || 'INR';

  const {
    accounts,
    combinedSummary,
    fetchAccounts,
  } = useAccounts();

  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [combinedTrends, setCombinedTrends] = useState({ dailyTrend: [], sixMonthsTrend: [] });

  // Transaction modal states
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [deletingTx, setDeletingTx] = useState(null);
  const [isSubmittingTx, setIsSubmittingTx] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoadingTx(true);
      // 'all' accounts combined: omit accountId filter
      const res = await transactionApi.getTransactions({ limit: 50 });
      if (res && res.success && res.data) {
        setTransactions(res.data.transactions || []);
      }
    } catch (err) {
      console.error('Failed to load combined transactions:', err);
    } finally {
      setLoadingTx(false);
    }
  }, []);

  const fetchCombinedTrends = useCallback(async () => {
    try {
      const now = new Date();
      const res = await analyticsApi.getTrends(now.getMonth() + 1, now.getFullYear());
      if (res && res.success && res.data) {
        setCombinedTrends(res.data);
      }
    } catch (err) {
      console.error('Failed to load combined trends:', err);
    }
  }, []);

  useEffect(() => {
    categoryApi.getCategories().then((res) => {
      if (res?.success) setCategories(res.data || []);
    });
    fetchTransactions();
    fetchCombinedTrends();
  }, [fetchTransactions, fetchCombinedTrends]);

  const handleSubmitTx = async (formData) => {
    try {
      setIsSubmittingTx(true);
      if (editingTx) {
        await transactionApi.updateTransaction(editingTx._id, formData);
        toast.success('Transaction updated');
      } else {
        await transactionApi.createTransaction(formData);
        toast.success('Transaction recorded');
      }
      setIsTxModalOpen(false);
      setEditingTx(null);
      fetchTransactions();
      fetchAccounts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record transaction');
    } finally {
      setIsSubmittingTx(false);
    }
  };

  const handleDeleteTx = async () => {
    if (!deletingTx) return;
    try {
      await transactionApi.deleteTransaction(deletingTx._id);
      toast.success('Transaction deleted');
      setDeletingTx(null);
      fetchTransactions();
      fetchAccounts();
    } catch (err) {
      toast.error('Failed to delete transaction');
      setDeletingTx(null);
    }
  };

  const totalNetWorth = combinedSummary.totalNetWorth || 0;
  const filteredTransactions = searchTerm.trim()
    ? transactions.filter((t) =>
        (t.note || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.category?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.account?.bankName || t.account?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : transactions;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16 max-w-6xl mx-auto">
      {/* Top Navigation & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/accounts')}
            type="button"
            className="p-2 rounded-full bg-white border border-zinc-200/90 hover:bg-zinc-100 dark:bg-[#18181e] dark:border-white/10 dark:hover:bg-white/[0.08] text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer"
            title="Back to Accounts"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 dark:text-white tracking-tight flex items-center gap-2.5">
              <span>Combined Portfolio</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Sum of {accounts.length} Accounts
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
              Aggregated view of your total wealth, multi-account cashflow, and unified spending history.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            onClick={() => {
              setEditingTx(null);
              setIsTxModalOpen(true);
            }}
            className="text-xs font-bold"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5 stroke-[2.5]" />
            Log Entry
          </Button>
        </div>
      </div>

      {/* COMBINED HERO CARD - PURE VIEW-ONLY (No edit/add balance buttons) */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-white border border-zinc-200/90 shadow-sm dark:bg-[#121216] dark:border-white/10 dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] transition-all">
        {/* Glow ambient background */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 rounded-full blur-3xl pointer-events-none opacity-20 dark:opacity-30"
          style={{ background: 'radial-gradient(ellipse, #10b981 0%, transparent 70%)' }}
        />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-500" />
                <span>Aggregated Total Net Worth</span>
              </span>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Sum total across all your banks, cash wallets, cards, and deposits.
              </p>
            </div>

            <span className="self-start sm:self-auto text-xs font-bold px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 dark:bg-white/[0.08] dark:text-zinc-300">
              {currency}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline gap-3">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none text-zinc-950 dark:text-white">
              {formatCurrency(totalNetWorth, currency)}
            </h2>
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              across {accounts.length} active institution{accounts.length === 1 ? '' : 's'}
            </span>
          </div>

          {/* Combined Inflow / Outflow Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-zinc-100 dark:border-white/10">
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-100 dark:border-white/5">
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-semibold mb-1">
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" />
                <span>Total Inflow (Month)</span>
              </div>
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                +{formatCurrency(combinedSummary.monthIncome || 0, currency)}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-100 dark:border-white/5">
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-semibold mb-1">
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-500 stroke-[2.5]" />
                <span>Total Outflow (Month)</span>
              </div>
              <p className="text-lg font-black text-rose-600 dark:text-rose-400">
                −{formatCurrency(combinedSummary.monthExpense || 0, currency)}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-100 dark:border-white/5">
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-semibold mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-blue-500 stroke-[2]" />
                <span>Net Month Savings</span>
              </div>
              <p
                className={`text-lg font-black ${
                  (combinedSummary.monthIncome || 0) >= (combinedSummary.monthExpense || 0)
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {(combinedSummary.monthIncome || 0) >= (combinedSummary.monthExpense || 0) ? '+' : ''}
                {formatCurrency((combinedSummary.monthIncome || 0) - (combinedSummary.monthExpense || 0), currency)}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-100 dark:border-white/5">
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-semibold mb-1">
                <Building className="w-3.5 h-3.5 text-purple-500 stroke-[2]" />
                <span>Institutions</span>
              </div>
              <p className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                {accounts.length} Accounts
              </p>
            </div>
          </div>

          {/* Visual Asset Allocation Bar */}
          {accounts.length > 0 && totalNetWorth > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span className="font-semibold flex items-center gap-1.5">
                  <PieChart className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Asset Distribution Across Accounts</span>
                </span>
                <span>100% Allocated</span>
              </div>
              <div className="h-3 w-full rounded-full bg-zinc-100 dark:bg-white/[0.06] overflow-hidden flex shadow-inner">
                {accounts.map((acc) => {
                  const balance = Math.max(0, acc.currentBalance ?? (acc.initialBalance || 0));
                  const percentage = totalNetWorth > 0 ? (balance / totalNetWorth) * 100 : 0;
                  if (percentage <= 0) return null;
                  return (
                    <div
                      key={acc._id}
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: acc.color || '#10B981',
                      }}
                      title={`${acc.bankName || acc.name}: ${percentage.toFixed(1)}% (${formatCurrency(balance, currency)})`}
                      className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full hover:opacity-85"
                    />
                  );
                })}
              </div>
              {/* Asset distribution legend */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                {accounts.map((acc) => {
                  const balance = Math.max(0, acc.currentBalance ?? (acc.initialBalance || 0));
                  const percentage = totalNetWorth > 0 ? ((balance / totalNetWorth) * 100).toFixed(0) : 0;
                  return (
                    <div key={acc._id} className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: acc.color || '#10B981' }}
                      />
                      <span>{acc.bankName || acc.name}</span>
                      <span className="text-zinc-400 font-normal">({percentage}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DETAILED VISUAL ANALYTICS: NET WORTH TRAJECTORY, ASSET ALLOCATION & CASHFLOW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <NetWorthTrendChart data={combinedTrends.netWorthTrend || combinedTrends.sixMonthsTrend} />
        <AssetAllocationPieChart accounts={accounts} totalNetWorth={totalNetWorth} />
        <div className="lg:col-span-2">
          <CashflowTrendChart data={combinedTrends.sixMonthsTrend} />
        </div>
      </div>

      {/* DEDICATED COMBINED TRANSACTION LEDGER */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-zinc-950 dark:text-white tracking-tight flex items-center gap-2">
              <Receipt className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              <span>Combined Multi-Account Spending History</span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              Every transaction across your accounts in one unified chronological feed. Each row shows its bank badge.
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search combined ledger..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-zinc-200 bg-white text-zinc-900 dark:bg-[#18181e] dark:border-white/10 dark:text-zinc-100 outline-none focus:border-zinc-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Transactions list */}
        <div
          className={`space-y-2 transition-opacity duration-300 ${
            loadingTx ? 'opacity-60' : 'opacity-100'
          }`}
        >
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((tx) => (
              <TransactionItem
                key={tx._id}
                transaction={tx}
                onEdit={(item) => {
                  setEditingTx(item);
                  setIsTxModalOpen(true);
                }}
                onDelete={(item) => setDeletingTx(item)}
              />
            ))
          ) : !loadingTx ? (
            <div className="bg-white dark:bg-[#111114] border border-zinc-200/90 dark:border-white/8 rounded-2xl p-8 text-center animate-fade-in">
              <EmptyState
                title="No transactions found"
                description="Start logging expenses or deposits across your bank accounts."
                actionLabel="Log Transaction"
                onAction={() => {
                  setEditingTx(null);
                  setIsTxModalOpen(true);
                }}
              />
            </div>
          ) : (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800/40 animate-pulse"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transaction Modal */}
      <TransactionFormModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTx(null);
        }}
        onSubmit={handleSubmitTx}
        categories={categories}
        initialData={editingTx}
        defaultType="expense"
        isLoading={isSubmittingTx}
      />

      {/* Delete Transaction Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingTx)}
        onClose={() => setDeletingTx(null)}
        onConfirm={handleDeleteTx}
        title="Delete Transaction?"
        message="Are you sure you want to delete this transaction record? This action cannot be undone."
        confirmText="Delete Record"
        confirmVariant="danger"
      />
    </div>
  );
};

export default CombinedAccountsPage;

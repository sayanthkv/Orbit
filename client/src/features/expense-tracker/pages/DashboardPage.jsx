import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../../lib/api';
import { formatCurrency, formatCompactCurrency } from '../../../lib/formatters';
import AnimatedCounter from '../../../components/AnimatedCounter';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import Modal from '../../../components/Modal';
import Spinner from '../../../components/Spinner';
import ReceiptUpload from '../../../components/ReceiptUpload';
import CategoryModal from '../../../components/CategoryModal';
import MonthlyReportModal from '../../../components/MonthlyReportModal';
import ParallaxSection from '../../../components/parallax/ParallaxSection';
import ParallaxCard from '../../../components/parallax/ParallaxCard';
import { useToast } from '../../../components/Toast';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import {
  Landmark,
  Banknote,
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowRight,
  Sparkles,
  Calendar,
  Receipt,
  ArrowLeftRight,
  PieChart as PieChartIcon,
  Tag,
  AlertTriangle,
  AlertCircle,
  FileDown,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { motion } from 'framer-motion';

export const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [insights, setInsights] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getUTCMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getUTCFullYear());

  // Onboarding
  const [onboardingData, setOnboardingData] = useState({ name: '', type: 'Savings', currentBalance: '' });
  const [isOnboardingSubmitting, setIsOnboardingSubmitting] = useState(false);

  // Quick Add Modal
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickTab, setQuickTab] = useState('expense'); // 'expense' | 'income' | 'transfer'
  const [quickSource, setQuickSource] = useState('bank'); // 'bank' | 'cash'
  const [quickAccountId, setQuickAccountId] = useState('');
  const [quickToType, setQuickToType] = useState('cash');
  const [quickToAccountId, setQuickToAccountId] = useState('');
  const [quickAmount, setQuickAmount] = useState('');
  const [quickCategory, setQuickCategory] = useState('');
  const [quickDate, setQuickDate] = useState(new Date().toISOString().split('T')[0]);
  const [quickNote, setQuickNote] = useState('');
  const [quickTagInput, setQuickTagInput] = useState('');
  const [quickTags, setQuickTags] = useState([]);
  const [quickAttachment, setQuickAttachment] = useState(null);
  const [isQuickSubmitting, setIsQuickSubmitting] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const { isOnline } = useNetworkStatus();

  // Modals
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Listen to deep-linked PWA shortcuts (?action=add-expense or ?action=add-income)
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'add-expense') {
      setQuickTab('expense');
      setIsQuickAddOpen(true);
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    } else if (action === 'add-income') {
      setQuickTab('income');
      setIsQuickAddOpen(true);
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Refetch when coming back online
  useEffect(() => {
    const handleReconnect = () => {
      fetchSummary();
    };
    window.addEventListener('orbit:network-reconnected', handleReconnect);
    return () => window.removeEventListener('orbit:network-reconnected', handleReconnect);
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const [summaryRes, insightsRes, categoriesRes] = await Promise.all([
        api.get('/summary', { params: { month: selectedMonth, year: selectedYear } }),
        api.get('/insights'),
        api.get('/categories'),
      ]);

      if (summaryRes.success) {
        setData(summaryRes.data);
        if (summaryRes.data.accounts?.length > 0 && !quickAccountId) {
          setQuickAccountId(summaryRes.data.accounts[0]._id);
        }
      }
      if (insightsRes.success) setInsights(insightsRes.data?.insights || []);
      if (categoriesRes.success) {
        const cats = categoriesRes.data?.categories || [];
        setCategories(cats);
        if (cats.length > 0 && !quickCategory) {
          const first = cats.find((c) => c.type === quickTab);
          if (first) setQuickCategory(first.name);
        }
      }
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, toast, quickAccountId, quickCategory, quickTab]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleOnboardingSubmit = async (e) => {
    e.preventDefault();
    if (!onboardingData.name.trim()) {
      toast.error('Please enter a bank account name');
      return;
    }

    try {
      setIsOnboardingSubmitting(true);
      const res = await api.post('/accounts', {
        name: onboardingData.name.trim(),
        type: onboardingData.type,
        openingBalance: Number(onboardingData.currentBalance) || 0,
      });

      if (res.success) {
        toast.success('Primary account created! Welcome to your dashboard.');
        fetchSummary();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to setup account');
    } finally {
      setIsOnboardingSubmitting(false);
    }
  };

  const handleAddTag = () => {
    const trimmed = quickTagInput.trim().replace(/^#/, '');
    if (trimmed && !quickTags.includes(trimmed)) {
      setQuickTags([...quickTags, trimmed]);
      setQuickTagInput('');
    }
  };

  const handleRemoveTag = (t) => {
    setQuickTags(quickTags.filter((tag) => tag !== t));
  };

  const handleQuickTxSubmit = async (e) => {
    e.preventDefault();
    if (!isOnline) {
      toast.error("You're offline. Please reconnect to submit transactions.");
      return;
    }
    const numAmount = Number(quickAmount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    try {
      setIsQuickSubmitting(true);

      if (quickTab === 'transfer') {
        const res = await api.post('/transfers', {
          fromType: quickSource === 'cash' ? 'cash' : 'account',
          fromAccount: quickSource === 'bank' ? quickAccountId : undefined,
          toType: quickToType,
          toAccount: quickToType === 'account' ? quickToAccountId : undefined,
          amount: numAmount,
          date: quickDate,
          note: quickNote,
        });
        if (res.success) {
          toast.success('Transfer recorded!');
        }
      } else if (quickSource === 'bank') {
        const res = await api.post(`/accounts/${quickAccountId}/transactions`, {
          type: quickTab,
          amount: numAmount,
          category: quickCategory || 'Other',
          date: quickDate,
          note: quickNote,
          tags: quickTags,
          attachment: quickAttachment,
        });
        if (res.success) {
          toast.success(`${quickTab === 'income' ? 'Income' : 'Expense'} recorded!`);
        }
      } else {
        const res = await api.post('/cash/transactions', {
          type: quickTab,
          amount: numAmount,
          category: quickCategory || 'Other',
          date: quickDate,
          note: quickNote,
          tags: quickTags,
          attachment: quickAttachment,
        });
        if (res.success) {
          toast.success(`Cash ${quickTab} recorded!`);
        }
      }

      setIsQuickAddOpen(false);
      setQuickAmount('');
      setQuickNote('');
      setQuickTags([]);
      setQuickAttachment(null);
      fetchSummary();
    } catch (err) {
      toast.error(err.message || 'Failed to record entry');
    } finally {
      setIsQuickSubmitting(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <Spinner size="lg" />
      </div>
    );
  }

  // First-time Onboarding Screen if user has 0 bank accounts
  if (!data?.accounts || data.accounts.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-[#121216] border border-zinc-200/90 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <Landmark className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight font-display">
              Welcome to Orbit Finance
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Set up your primary bank account to establish your baseline balance.
            </p>
          </div>

          <form onSubmit={handleOnboardingSubmit} className="space-y-4">
            <Input
              label="Bank / Institution Name"
              placeholder="e.g. HDFC Bank, SBI, ICICI"
              required
              value={onboardingData.name}
              onChange={(e) => setOnboardingData({ ...onboardingData, name: e.target.value })}
            />

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Account Type
              </label>
              <select
                value={onboardingData.type}
                onChange={(e) => setOnboardingData({ ...onboardingData, type: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 font-bold"
              >
                <option value="Savings">Savings Account</option>
                <option value="Salary">Salary Account</option>
                <option value="Current">Current Account</option>
                <option value="Investment">Investment</option>
              </select>
            </div>

            <Input
              label="Current Available Balance (INR)"
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={onboardingData.currentBalance}
              onChange={(e) => setOnboardingData({ ...onboardingData, currentBalance: e.target.value })}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isOnboardingSubmitting}
            >
              Get Started
            </Button>
          </form>
        </div>
      </div>
    );
  }

  const {
    totalBankBalance,
    cashInHand,
    grandTotal,
    monthlyIncome,
    monthlyExpense,
    netSavings,
    accounts = [],
    categoryBreakdown = [],
    spendingTrend = [],
    recentTransactions = [],
    budgetSummary = [],
  } = data;

  const CHART_COLORS = ['#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#eab308', '#64748b'];

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Date Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight font-display">
            Financial Overview
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Your real-time net worth, accounts, flow, and category allocations
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Month / Year Filter */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-[#141418] border border-zinc-200/90 dark:border-white/10 rounded-2xl p-1 shadow-xs">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-xs font-bold px-2 py-1 focus:outline-none cursor-pointer"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={m} className="dark:bg-[#141418]">
                  {new Date(2026, m - 1).toLocaleString('default', { month: 'short' })}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-xs font-bold px-2 py-1 focus:outline-none cursor-pointer"
            >
              {[2025, 2026, 2027].map((y) => (
                <option key={y} value={y} className="dark:bg-[#141418]">{y}</option>
              ))}
            </select>
          </div>

          <Button
            variant="outline"
            icon={FileDown}
            onClick={() => setIsReportModalOpen(true)}
            className="text-xs"
          >
            Export
          </Button>

          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setIsQuickAddOpen(true)}
            className="shadow-sm shadow-emerald-600/25"
          >
            Quick Add
          </Button>
        </div>
      </div>

      {/* Parallax Hero Balance Area */}
      <ParallaxSection offset={18} speed={0.06} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Dominant Hero Net Worth Card with 3D Parallax Tilt */}
        <ParallaxCard depth={8} className="lg:col-span-8 bg-white/90 dark:bg-[#121217]/90 border border-zinc-200/90 dark:border-white/10 shadow-xl backdrop-blur-xl">
          <div className="p-6 sm:p-7 flex flex-col justify-between h-full space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Total Net Liquidity
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase tracking-wider border border-emerald-500/20">
                  Live Server Balance
                </span>
              </div>

              <div>
                <div className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tight">
                  <AnimatedCounter value={grandTotal} />
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  Computed dynamically: opening + income - expense + transfers
                </p>
              </div>
            </div>

            {/* Sub Liquidity Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-zinc-100 dark:border-white/6 text-xs">
              <div>
                <span className="text-[11px] text-zinc-500 block">Bank Accounts</span>
                <span className="text-sm font-bold tabular-nums font-mono text-zinc-900 dark:text-white">
                  {formatCurrency(totalBankBalance)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-zinc-500 block">Cash in Hand</span>
                <span className="text-sm font-bold tabular-nums font-mono text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(cashInHand)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-zinc-500 block">This Month Flow</span>
                <span className={`text-sm font-bold tabular-nums font-mono ${netSavings >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {netSavings >= 0 ? '+' : ''}{formatCurrency(netSavings)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-zinc-500 block">Active Accounts</span>
                <span className="text-sm font-bold tabular-nums font-mono text-zinc-700 dark:text-zinc-300">
                  {accounts.length}
                </span>
              </div>
            </div>
          </div>
        </ParallaxCard>

        {/* Monthly Inflow / Outflow Cards with 3D Depth */}
        <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          <ParallaxCard depth={7} className="bg-white/90 dark:bg-[#121217]/90 border border-zinc-200/90 dark:border-white/10 shadow-md backdrop-blur-xl">
            <div className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" /> Income ({new Date(2026, selectedMonth - 1).toLocaleString('default', { month: 'short' })})
                </span>
              </div>
              <div className="text-2xl font-black tabular-nums font-mono text-emerald-600 dark:text-emerald-400 mt-2">
                +{formatCurrency(monthlyIncome)}
              </div>
            </div>
          </ParallaxCard>

          <ParallaxCard depth={7} className="bg-white/90 dark:bg-[#121217]/90 border border-zinc-200/90 dark:border-white/10 shadow-md backdrop-blur-xl">
            <div className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-rose-600" /> Expense ({new Date(2026, selectedMonth - 1).toLocaleString('default', { month: 'short' })})
                </span>
              </div>
              <div className="text-2xl font-black tabular-nums font-mono text-rose-600 dark:text-rose-400 mt-2">
                -{formatCurrency(monthlyExpense)}
              </div>
            </div>
          </ParallaxCard>
        </div>
      </ParallaxSection>

      {/* AI Spending Insights Parallax Section */}
      {insights.length > 0 && (
        <ParallaxSection offset={26} speed={0.1} className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
              Smart Spending Insights
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {insights.map((ins) => {
              const isDanger = ins.type === 'danger';
              const isWarning = ins.type === 'warning';
              const isSuccess = ins.type === 'success';

              return (
                <ParallaxCard
                  key={ins.id}
                  depth={5}
                  className={`border backdrop-blur-md transition-all ${
                    isDanger
                      ? 'bg-rose-500/5 border-rose-500/30'
                      : isWarning
                      ? 'bg-amber-500/5 border-amber-500/30'
                      : isSuccess
                      ? 'bg-emerald-500/5 border-emerald-500/30'
                      : 'bg-white/80 dark:bg-[#141418]/80 border-zinc-200/80 dark:border-white/8'
                  }`}
                >
                  <div className="p-4 flex items-start gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isDanger
                          ? 'bg-rose-500/20 text-rose-600'
                          : isWarning
                          ? 'bg-amber-500/20 text-amber-600'
                          : isSuccess
                          ? 'bg-emerald-500/20 text-emerald-600'
                          : 'bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
                        {ins.title}
                      </h4>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5 leading-relaxed">
                        {ins.text}
                      </p>
                    </div>
                  </div>
                </ParallaxCard>
              );
            })}
          </div>
        </ParallaxSection>
      )}

      {/* Visual Charts Parallax Section */}
      <ParallaxSection offset={36} speed={0.15} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Spending Trend Area Chart */}
        <ParallaxCard depth={6} className="lg:col-span-8 bg-white/90 dark:bg-[#121216]/90 border border-zinc-200/90 dark:border-white/10 shadow-lg backdrop-blur-xl">
          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white font-display">
                  Daily Spending Rhythm
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Inflow vs Outflow trajectory through the month
                </p>
              </div>
            </div>

            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spendingTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.12)" />
                  <XAxis dataKey="day" stroke="#888" fontSize={10} tickLine={false} />
                  <YAxis stroke="#888" fontSize={10} tickLine={false} tickFormatter={formatCompactCurrency} />
                  <Tooltip
                    formatter={(val, name) => [formatCurrency(val), name === 'income' ? 'Income' : 'Expense']}
                    labelFormatter={(day) => `Day ${day}`}
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      fontSize: '11px',
                      color: '#fff',
                    }}
                  />
                  <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#incomeFill)" />
                  <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#expenseFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ParallaxCard>

        {/* Category Allocation Donut Chart */}
        <ParallaxCard depth={6} className="lg:col-span-4 bg-white/90 dark:bg-[#121216]/90 border border-zinc-200/90 dark:border-white/10 shadow-lg backdrop-blur-xl">
          <div className="p-5 sm:p-6 space-y-4 flex flex-col justify-between h-full">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white font-display">
                Expense Distribution
              </h3>
              <p className="text-[11px] text-zinc-500">Top outflow categories</p>
            </div>

            <div className="h-48 w-full relative flex items-center justify-center">
              {categoryBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      dataKey="amount"
                      nameKey="category"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => formatCurrency(val)}
                      contentStyle={{
                        backgroundColor: '#18181b',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        fontSize: '11px',
                        color: '#fff',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-zinc-400">No expenses recorded for this month</p>
              )}
            </div>

            {/* Breakdown legend list */}
            <div className="space-y-1.5 max-h-32 overflow-y-auto no-scrollbar text-xs">
              {categoryBreakdown.slice(0, 5).map((cat, idx) => (
                <div key={cat.category} className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                    />
                    <span className="truncate">{cat.category}</span>
                  </span>
                  <span className="font-bold tabular-nums font-mono">{formatCurrency(cat.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </ParallaxCard>
      </ParallaxSection>

      {/* Compact Budgets and Recent Transactions Parallax Section */}
      <ParallaxSection offset={46} speed={0.2} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Compact Budgets Widget */}
        <div className="lg:col-span-5 bg-white dark:bg-[#121216] border border-zinc-200/90 dark:border-white/10 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white font-display">
                Monthly Budget Watch
              </h3>
              <p className="text-[11px] text-zinc-500">Tracking category limits</p>
            </div>
            <Link
              to="/tools/expense-tracker/budgets"
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline"
            >
              <span>All Budgets</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {budgetSummary.length === 0 ? (
              <div className="text-center py-6 text-xs text-zinc-400">
                <p>No monthly category budgets set yet.</p>
                <Link to="/tools/expense-tracker/budgets" className="text-emerald-600 font-bold underline mt-1 block">
                  Set category budgets
                </Link>
              </div>
            ) : (
              budgetSummary.slice(0, 4).map((b) => (
                <div key={b._id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{b.category}</span>
                    <span className="text-[11px] tabular-nums font-mono text-zinc-500">
                      {formatCurrency(b.spent)} / {formatCurrency(b.amount)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-zinc-100 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        b.status === 'danger'
                          ? 'bg-rose-500'
                          : b.status === 'warning'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, b.percentage)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-7 bg-white dark:bg-[#121216] border border-zinc-200/90 dark:border-white/10 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white font-display">
                Recent Transactions
              </h3>
              <p className="text-[11px] text-zinc-500">Across all bank accounts and cash in hand</p>
            </div>
            <Link
              to="/tools/expense-tracker/expenses"
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-white/6">
            {recentTransactions.length === 0 ? (
              <p className="text-center py-6 text-xs text-zinc-400">No transactions recorded yet</p>
            ) : (
              recentTransactions.map((tx) => (
                <div key={tx._id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        tx.type === 'income'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-rose-500/10 text-rose-600'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-zinc-900 dark:text-white truncate">
                        {tx.category} {tx.note ? `— ${tx.note}` : ''}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        {tx.sourceName} • {new Date(tx.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`font-black tabular-nums font-mono shrink-0 ${
                      tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </ParallaxSection>

      {/* Quick Add Universal Modal */}
      <Modal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        title={
          quickTab === 'transfer'
            ? 'Transfer Funds'
            : `Add ${quickTab === 'income' ? 'Income' : 'Expense'}`
        }
        description="Quickly record cash, bank outflow, income, or liquidity transfer"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleQuickTxSubmit} className="space-y-4">
          {/* Main Action Tabs: Expense | Income | Transfer */}
          <div className="flex p-1 bg-zinc-100 dark:bg-white/5 rounded-2xl">
            <button
              type="button"
              onClick={() => setQuickTab('expense')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                quickTab === 'expense'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setQuickTab('income')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                quickTab === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => setQuickTab('transfer')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                quickTab === 'transfer'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Transfer
            </button>
          </div>

          {/* Source Selection (Bank vs Cash) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
              {quickTab === 'transfer' ? 'From (Source)' : 'Account / Source'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setQuickSource('bank')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  quickSource === 'bank'
                    ? 'border-emerald-600 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <Landmark className="w-4 h-4" />
                <span>Bank Account</span>
              </button>
              <button
                type="button"
                onClick={() => setQuickSource('cash')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  quickSource === 'cash'
                    ? 'border-emerald-600 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Cash in Hand</span>
              </button>
            </div>

            {quickSource === 'bank' && (
              <select
                value={quickAccountId}
                onChange={(e) => setQuickAccountId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 font-bold mt-1"
                required
              >
                {accounts.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name} ({formatCurrency(a.currentBalance)})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Transfer Destination Selection if Transfer tab */}
          {quickTab === 'transfer' && (
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                To (Destination)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setQuickToType('account')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    quickToType === 'account'
                      ? 'border-cyan-600 bg-cyan-500/10 text-cyan-600'
                      : 'border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <Landmark className="w-4 h-4" />
                  <span>Bank Account</span>
                </button>
                <button
                  type="button"
                  onClick={() => setQuickToType('cash')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    quickToType === 'cash'
                      ? 'border-cyan-600 bg-cyan-500/10 text-cyan-600'
                      : 'border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>Cash in Hand</span>
                </button>
              </div>

              {quickToType === 'account' && (
                <select
                  value={quickToAccountId}
                  onChange={(e) => setQuickToAccountId(e.target.value)}
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
          )}

          {/* Amount */}
          <Input
            label="Amount (INR)"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="0.00"
            value={quickAmount}
            onChange={(e) => setQuickAmount(e.target.value)}
          />

          {/* Category Picker (only for income/expense) */}
          {quickTab !== 'transfer' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Category
                </label>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  + Manage Categories
                </button>
              </div>
              <select
                value={quickCategory}
                onChange={(e) => setQuickCategory(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 font-bold"
              >
                {categories.filter((c) => c.type === quickTab && !c.isHidden).map((c) => (
                  <option key={c._id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date & Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Date"
              type="date"
              required
              value={quickDate}
              onChange={(e) => setQuickDate(e.target.value)}
            />
            <Input
              label="Note"
              placeholder="e.g. Dinner, ATM withdraw, Metro recharge"
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
            />
          </div>

          {/* Tags Chips Input (for income/expense) */}
          {quickTab !== 'transfer' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Tags (Press Enter to add)
              </label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="e.g. weekend, trip, dining"
                  value={quickTagInput}
                  onChange={(e) => setQuickTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="sm" onClick={handleAddTag}>
                  Add
                </Button>
              </div>

              {quickTags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {quickTags.map((t) => (
                    <span
                      key={t}
                      onClick={() => handleRemoveTag(t)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 cursor-pointer hover:bg-rose-500/10 hover:text-rose-600 hover:border-rose-500/20 transition-colors"
                      title="Click to remove"
                    >
                      #{t} ×
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Receipt Attachment Upload */}
          {quickTab !== 'transfer' && (
            <ReceiptUpload
              value={quickAttachment}
              onChange={setQuickAttachment}
              disabled={isQuickSubmitting}
            />
          )}

          {!isOnline && (
            <p className="text-[11px] text-amber-500 font-semibold text-center pb-1">
              Offline mode: Form details are preserved, but saving requires network connection.
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsQuickAddOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!isOnline || isQuickSubmitting}
              isLoading={isQuickSubmitting}
            >
              {!isOnline ? 'Offline' : 'Record Entry'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Categories Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onCategoriesUpdated={fetchSummary}
      />

      {/* Monthly Report Statement Modal */}
      <MonthlyReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
};

export default DashboardPage;

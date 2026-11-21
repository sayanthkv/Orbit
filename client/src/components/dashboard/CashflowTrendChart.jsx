import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { BarChart3 } from 'lucide-react';
import EmptyState from '../common/EmptyState';

export const CashflowTrendChart = ({ data = [] }) => {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';

  const hasData = Array.isArray(data) && data.some((d) => (d.income > 0 || d.expense > 0));

  if (!hasData) {
    return (
      <div className="rounded-3xl p-6 bg-white border border-zinc-200/90 shadow-sm dark:bg-[#111113] dark:border-white/8 dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] transition-colors">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-200 mb-1">
          Income vs Outflow Comparison
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-4">
          6-month cashflow velocity
        </p>
        <EmptyState
          icon={BarChart3}
          title="No multi-month cashflow history"
          description="Log income and expenses over time to compare monthly trends."
          className="border-none py-6"
        />
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const incomeVal = payload.find((p) => p.dataKey === 'income')?.value || 0;
      const expenseVal = payload.find((p) => p.dataKey === 'expense')?.value || 0;
      const netSavings = incomeVal - expenseVal;

      return (
        <div className="px-4 py-3 rounded-2xl text-xs space-y-1.5 bg-white text-zinc-900 border border-zinc-200 shadow-xl dark:bg-[#1c1c20] dark:text-white dark:border-white/10 dark:shadow-[0_8px_24px_rgba(0,0,0,0.6)] backdrop-blur-md">
          <p className="font-bold text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-white/10 pb-1">
            {label}
          </p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Inflow:
            </span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100">
              +{formatCurrency(incomeVal, currency)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
              Outflow:
            </span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100">
              −{formatCurrency(expenseVal, currency)}
            </span>
          </div>
          <div className="pt-1 border-t border-zinc-100 dark:border-white/10 flex items-center justify-between gap-4">
            <span className="text-zinc-500 font-semibold">Net Savings:</span>
            <span
              className={`font-black ${
                netSavings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {netSavings >= 0 ? '+' : ''}
              {formatCurrency(netSavings, currency)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-3xl p-6 bg-white border border-zinc-200/90 shadow-sm dark:bg-[#111113] dark:border-white/8 dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] transition-colors flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-200">
            Cash Flow Trends (Last 6 Months)
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            Monthly Inflow vs Outflow comparison
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Inflow
          </span>
          <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Outflow
          </span>
        </div>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="currentColor"
              className="text-zinc-200 dark:text-white/[0.04]"
            />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#71717a' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: '#71717a' }}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="income"
              name="Inflow"
              fill="#10b981"
              radius={[6, 6, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              dataKey="expense"
              name="Outflow"
              fill="#f43f5e"
              radius={[6, 6, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CashflowTrendChart;

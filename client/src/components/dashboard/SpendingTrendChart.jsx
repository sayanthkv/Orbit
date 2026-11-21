import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { TrendingUp, Activity } from 'lucide-react';
import EmptyState from '../common/EmptyState';

export const SpendingTrendChart = ({ data = [] }) => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState('daily'); // 'daily' or 'cumulative'
  const isDaily = viewMode === 'daily';

  const hasExpenses = data.some((d) => d.amount > 0);

  if (!hasExpenses) {
    return (
      <div className="rounded-3xl p-6 bg-white border border-zinc-200/90 shadow-sm dark:bg-[#111113] dark:border-white/8 dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] transition-colors">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-200 mb-1">Daily Spending Curve</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-4">Day-by-day expense outflow</p>
        <EmptyState
          icon={TrendingUp}
          title="No daily spending data"
          description="Daily expense curves will appear here once expenses are logged."
          className="border-none py-6"
        />
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="px-3.5 py-2.5 rounded-2xl text-xs space-y-1 bg-white text-zinc-900 border border-zinc-200 shadow-xl dark:bg-[#1c1c20] dark:text-white dark:border-white/10 dark:shadow-[0_8px_24px_rgba(0,0,0,0.6)] backdrop-blur-md">
          <p className="font-bold text-zinc-800 dark:text-zinc-300">Day {label}</p>
          <p className="text-rose-600 dark:text-rose-400 font-semibold">
            {isDaily ? 'Outflow: ' : 'Cumulative: '}
            {formatCurrency(payload[0]?.value, user?.currency)}
          </p>
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
            {isDaily ? 'Daily Spending Velocity' : 'Cumulative Spending Burn'}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            {isDaily ? 'Day-by-day expense outflow' : 'Month-to-date accumulated expenses'}
          </p>
        </div>

        <div className="flex items-center bg-zinc-100 dark:bg-white/[0.06] rounded-full p-1">
          <button
            type="button"
            onClick={() => setViewMode('daily')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              isDaily
                ? 'bg-zinc-950 text-white shadow-xs dark:bg-white dark:text-zinc-950'
                : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            Daily
          </button>
          <button
            type="button"
            onClick={() => setViewMode('cumulative')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              !isDaily
                ? 'bg-zinc-950 text-white shadow-xs dark:bg-white dark:text-zinc-950'
                : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            Cumulative
          </button>
        </div>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-zinc-200 dark:text-white/[0.04]" />
            <XAxis
              dataKey="dayNumber"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: '#71717a' }}
              interval="preserveStartEnd"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: '#71717a' }}
              tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey={isDaily ? 'amount' : 'cumulative'}
              stroke="#f43f5e"
              strokeWidth={2.2}
              fillOpacity={1}
              fill="url(#spendGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#f43f5e', stroke: 'rgba(244,63,94,0.3)', strokeWidth: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SpendingTrendChart;

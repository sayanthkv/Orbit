import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { TrendingUp } from 'lucide-react';
import EmptyState from '../common/EmptyState';

export const SpendingTrendChart = ({ data = [] }) => {
  const { user } = useAuth();
  const hasExpenses = data.some((d) => d.amount > 0);

  if (!hasExpenses) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          Daily Spending Trend
        </h3>
        <EmptyState
          icon={TrendingUp}
          title="No daily spending data"
          description="Daily expense curves will appear here once expenses are logged."
          className="border-none py-8"
        />
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 text-white backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-700 shadow-xl text-xs space-y-1">
          <p className="font-bold">{label}</p>
          <p className="text-rose-400">
            Day: {formatCurrency(payload[0]?.value, user?.currency)}
          </p>
          {payload[1] && (
            <p className="text-slate-300">
              Cumulative: {formatCurrency(payload[1]?.value, user?.currency)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Daily Spending Curve
          </h3>
          <p className="text-xs text-slate-400">
            Day-by-day expense outflow throughout the month
          </p>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33415520" />
            <XAxis
              dataKey="dayNumber"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              interval="preserveStartEnd"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#f43f5e"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#spendingGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SpendingTrendChart;

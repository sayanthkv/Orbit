import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { BarChart3 } from 'lucide-react';
import EmptyState from '../common/EmptyState';

export const IncomeExpenseBarChart = ({ data = [] }) => {
  const { user } = useAuth();

  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          Income vs Expenses (6 Months)
        </h3>
        <EmptyState
          icon={BarChart3}
          title="No comparison data"
          description="Historical comparisons appear once transactions span multiple months."
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
          <p className="text-emerald-400">
            Income: {formatCurrency(payload[0]?.value, user?.currency)}
          </p>
          <p className="text-rose-400">
            Expense: {formatCurrency(payload[1]?.value, user?.currency)}
          </p>
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
            Income vs Expenses Comparison
          </h3>
          <p className="text-xs text-slate-400">
            Multi-month financial balance overview
          </p>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33415520" />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
              formatter={(value) => (value === 'income' ? 'Income' : 'Expense')}
            />
            <Bar dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={30} />
            <Bar dataKey="expense" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default IncomeExpenseBarChart;

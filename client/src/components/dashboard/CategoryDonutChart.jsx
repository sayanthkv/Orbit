import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { getCategoryIcon } from '../../utils/iconMap';
import { PieChart as PieChartIcon } from 'lucide-react';
import EmptyState from '../common/EmptyState';

export const CategoryDonutChart = ({ data = [], totalSum = 0 }) => {
  const { user } = useAuth();

  if (!data || data.length === 0 || totalSum === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          Spending by Category
        </h3>
        <EmptyState
          icon={PieChartIcon}
          title="No expenses this month"
          description="Log expenses to visualize category spending proportions."
          className="border-none py-8"
        />
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900/90 text-white backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-700 shadow-xl text-xs space-y-1">
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="font-bold">{item.name}</span>
          </div>
          <p className="text-slate-300">
            {formatCurrency(item.totalAmount, user?.currency)} ({item.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Spending by Category
          </h3>
          <p className="text-xs text-slate-400">Where your money went this month</p>
        </div>
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
          Total: {formatCurrency(totalSum, user?.currency)}
        </span>
      </div>

      <div className="h-64 relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={data}
              dataKey="totalAmount"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={3}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || '#10B981'}
                  stroke="transparent"
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-[11px] font-semibold text-slate-400">Total</span>
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            {formatCurrency(totalSum, user?.currency)}
          </span>
        </div>
      </div>

      {/* Category Legend list */}
      <div className="mt-4 grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 max-h-48 overflow-y-auto">
        {data.map((item) => (
          <div key={item._id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-850/60 text-xs">
            <div className="flex items-center gap-2 truncate pr-2">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                {item.name}
              </span>
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200 shrink-0">
              {item.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryDonutChart;

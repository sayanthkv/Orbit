import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { PieChart as PieChartIcon, TrendingDown, TrendingUp } from 'lucide-react';
import EmptyState from '../common/EmptyState';

export const CategoryDonutChart = ({
  data = [],
  totalSum = 0,
  breakdownType = 'expense',
  onToggleType,
}) => {
  const { user } = useAuth();
  const isExpense = breakdownType === 'expense';

  if (!data || data.length === 0 || totalSum === 0) {
    return (
      <div className="rounded-3xl p-6 bg-white border border-zinc-200/90 shadow-sm dark:bg-[#111113] dark:border-white/8 dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-200">
              {isExpense ? 'Spending by Category' : 'Income Sources Breakdown'}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              {isExpense ? 'Where your money went this month' : 'Where your income arrived from'}
            </p>
          </div>
          {onToggleType && (
            <div className="flex items-center bg-zinc-100 dark:bg-white/[0.06] rounded-full p-1">
              <button
                type="button"
                onClick={() => onToggleType('expense')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isExpense
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => onToggleType('income')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  !isExpense
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                Income
              </button>
            </div>
          )}
        </div>
        <EmptyState
          icon={PieChartIcon}
          title={isExpense ? 'No expenses this month' : 'No income recorded this month'}
          description={
            isExpense
              ? 'Log expenses to visualize category spending.'
              : 'Log income entries to visualize your earnings sources.'
          }
          className="border-none py-6"
        />
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="px-3.5 py-2.5 rounded-2xl text-xs space-y-1 bg-white text-zinc-900 border border-zinc-200 shadow-xl dark:bg-[#1c1c20] dark:text-white dark:border-white/10 dark:shadow-[0_8px_24px_rgba(0,0,0,0.6)] backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="font-bold text-zinc-900 dark:text-zinc-100">{item.name}</span>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 font-medium">
            {formatCurrency(item.totalAmount, user?.currency)} · {item.percentage}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-3xl p-6 flex flex-col justify-between bg-white border border-zinc-200/90 shadow-sm dark:bg-[#111113] dark:border-white/8 dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-200">
            {isExpense ? 'Spending by Category' : 'Income Sources Breakdown'}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            {isExpense ? 'Category allocation this month' : 'Earnings distribution this month'}
          </p>
        </div>

        {onToggleType ? (
          <div className="flex items-center bg-zinc-100 dark:bg-white/[0.06] rounded-full p-1">
            <button
              type="button"
              onClick={() => onToggleType('expense')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                isExpense
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => onToggleType('income')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                !isExpense
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              Income
            </button>
          </div>
        ) : (
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200/80 dark:bg-white/[0.06] dark:text-zinc-300 dark:border-white/[0.08]">
            {formatCurrency(totalSum, user?.currency)}
          </span>
        )}
      </div>

      <div className="h-56 relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={data}
              dataKey="totalAmount"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || '#10B981'} stroke="transparent" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            {isExpense ? 'Total Spent' : 'Total Inflow'}
          </span>
          <span className="text-sm font-black text-zinc-900 dark:text-zinc-100 mt-0.5">
            {formatCurrency(totalSum, user?.currency)}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-1.5 pt-4 border-t border-zinc-100 dark:border-white/[0.06]">
        {data.slice(0, 6).map((item) => (
          <div
            key={item._id}
            className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 border border-zinc-100 dark:bg-white/[0.025] dark:border-transparent transition-colors"
          >
            <div className="flex items-center gap-2 truncate pr-2">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-400 truncate">
                {item.name}
              </span>
            </div>
            <span className="text-xs font-black text-zinc-900 dark:text-zinc-300 shrink-0 ml-1">
              {item.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryDonutChart;

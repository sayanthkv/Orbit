import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { PieChart as PieIcon, Wallet } from 'lucide-react';
import EmptyState from '../common/EmptyState';

export const AssetAllocationPieChart = ({ accounts = [], totalNetWorth = 0 }) => {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';

  const chartData = accounts
    .map((acc) => {
      const balance = Math.max(0, acc.currentBalance ?? (acc.initialBalance || 0));
      const percentage = totalNetWorth > 0 ? Number(((balance / totalNetWorth) * 100).toFixed(1)) : 0;
      return {
        _id: acc._id,
        name: acc.bankName || acc.name,
        accountNumber: acc.accountNumber,
        type: acc.type,
        color: acc.color || '#10b981',
        balance,
        percentage,
      };
    })
    .filter((acc) => acc.balance > 0);

  if (!chartData || chartData.length === 0 || totalNetWorth <= 0) {
    return (
      <div className="rounded-3xl p-6 bg-white border border-zinc-200/90 shadow-sm dark:bg-[#111113] dark:border-white/8 dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] transition-colors">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-200 mb-1">
          Asset Allocation
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-4">
          Distribution across bank accounts
        </p>
        <EmptyState
          icon={Wallet}
          title="No positive balances recorded"
          description="Add initial balances or income to accounts to see your asset distribution pie chart."
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
            {item.accountNumber && (
              <span className="text-[10px] text-zinc-400">••{item.accountNumber.slice(-4)}</span>
            )}
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 font-medium">
            {formatCurrency(item.balance, currency)} · {item.percentage}% of portfolio
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
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-200 flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-emerald-500" />
            <span>Asset Allocation Pie Chart</span>
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            Portfolio spread across {chartData.length} active institution{chartData.length === 1 ? '' : 's'}
          </p>
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200/80 dark:bg-white/[0.06] dark:text-zinc-300 dark:border-white/[0.08]">
          Total: {formatCurrency(totalNetWorth, currency)}
        </span>
      </div>

      <div className="h-60 relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={chartData}
              dataKey="balance"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={3}
              strokeWidth={0}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || '#10b981'} stroke="transparent" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Net Worth
          </span>
          <span className="text-base font-black text-zinc-900 dark:text-zinc-100 mt-0.5">
            {formatCurrency(totalNetWorth, currency)}
          </span>
        </div>
      </div>

      {/* Legend Grid */}
      <div className="mt-4 grid grid-cols-2 gap-2 pt-4 border-t border-zinc-100 dark:border-white/[0.06]">
        {chartData.map((item) => (
          <div
            key={item._id}
            className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 border border-zinc-100 dark:bg-white/[0.025] dark:border-transparent transition-colors"
          >
            <div className="flex items-center gap-2 truncate pr-2">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <div className="truncate">
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-300 truncate block">
                  {item.name}
                </span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-normal">
                  {formatCurrency(item.balance, currency)}
                </span>
              </div>
            </div>
            <span className="text-xs font-black text-zinc-900 dark:text-zinc-200 shrink-0">
              {item.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssetAllocationPieChart;

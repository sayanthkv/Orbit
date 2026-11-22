import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { TrendingUp, ShieldCheck } from 'lucide-react';

export const NetWorthTrendChart = ({ data = [] }) => {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';

  if (!data || data.length === 0) return null;

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white border border-zinc-200/90 shadow-xs dark:bg-[#111114] dark:border-white/10 space-y-4 transition-all">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>Net Worth Over Time</span>
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Historical portfolio trajectory based on cumulative cashflow
          </p>
        </div>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const pt = payload[0].payload;
                return (
                  <div className="p-2.5 rounded-xl bg-zinc-900 text-white text-xs shadow-lg border border-white/10">
                    <p className="font-semibold text-zinc-400">{pt.name}</p>
                    <p className="font-black text-sm text-emerald-400 mt-0.5">
                      Net Worth: {formatCurrency(pt.netWorth, currency)}
                    </p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="netWorth"
              stroke="#10B981"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#netWorthGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default NetWorthTrendChart;

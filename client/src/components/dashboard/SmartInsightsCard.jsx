import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../../api/analyticsApi';
import {
  Sparkles,
  TrendingUp,
  Calendar,
  PieChart,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';

const INSIGHT_ICONS = {
  TrendingUp: TrendingUp,
  Calendar: Calendar,
  PieChart: PieChart,
  ShieldCheck: ShieldCheck,
  AlertTriangle: AlertTriangle,
  Sparkles: Sparkles,
};

export const SmartInsightsCard = ({ month, year, accountId }) => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        const fetchFn = analyticsApi.getSmartInsights || analyticsApi.getInsights;
        if (!fetchFn) {
          setInsights([]);
          return;
        }
        const res = await fetchFn(month, year, accountId);
        if (res?.success) {
          setInsights(res.data || []);
        }
      } catch (err) {
        console.error('Error fetching smart insights:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, [month, year, accountId]);

  if (loading || insights.length === 0) return null;

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-white border border-zinc-200/90 shadow-xs dark:bg-[#141418] dark:border-white/10 space-y-3 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
            Smart Financial Insights
          </h4>
        </div>
        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
          Rule-Based AI
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {insights.map((item, idx) => {
          const IconComponent = INSIGHT_ICONS[item.icon] || Lightbulb;
          const isWarning = item.type === 'warning' || item.type === 'danger';
          const isSuccess = item.type === 'success';

          return (
            <div
              key={item.id || idx}
              className={`p-3 sm:p-3.5 rounded-2xl border flex items-start gap-3 transition-colors ${
                isWarning
                  ? 'bg-amber-50/50 border-amber-200/70 text-amber-950 dark:bg-amber-950/20 dark:border-amber-800/30 dark:text-amber-200'
                  : isSuccess
                  ? 'bg-emerald-50/50 border-emerald-200/70 text-emerald-950 dark:bg-emerald-950/20 dark:border-emerald-800/30 dark:text-emerald-200'
                  : 'bg-zinc-50 border-zinc-200/70 text-zinc-900 dark:bg-white/[0.03] dark:border-white/8 dark:text-zinc-100'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  isWarning
                    ? 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
                    : isSuccess
                    ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                    : 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400'
                }`}
              >
                <IconComponent className="w-3.5 h-3.5" />
              </div>

              <div className="min-w-0">
                <h5 className="text-xs font-bold truncate leading-tight">
                  {item.title}
                </h5>
                <p className="text-[11px] opacity-80 mt-0.5 leading-normal">
                  {item.message || item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SmartInsightsCard;

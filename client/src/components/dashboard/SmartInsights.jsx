import React from 'react';
import { Lightbulb, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export const SmartInsights = ({ insights = [] }) => {
  if (!insights || insights.length === 0) return null;

  const ICONS = {
    warning: AlertTriangle,
    success: CheckCircle2,
    danger: AlertTriangle,
    info: Lightbulb,
  };

  const STYLES = {
    warning: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200',
    success: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200',
    danger: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200',
    info: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200',
  };

  const ICON_COLORS = {
    warning: 'text-amber-600 dark:text-amber-400',
    success: 'text-emerald-600 dark:text-emerald-400',
    danger: 'text-rose-600 dark:text-rose-400',
    info: 'text-blue-600 dark:text-blue-400',
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
          <Lightbulb className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Smart Financial Insights
          </h3>
          <p className="text-xs text-slate-400">
            Automated spending alerts & month-over-month analysis
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {insights.map((item, index) => {
          const Icon = ICONS[item.type] || Info;
          const style = STYLES[item.type] || STYLES.info;
          const iconColor = ICON_COLORS[item.type] || ICON_COLORS.info;

          return (
            <div
              key={index}
              className={`p-4 rounded-2xl border ${style} flex items-start gap-3 transition-all hover:scale-[1.01]`}
            >
              <div className={`p-1.5 rounded-xl bg-white/60 dark:bg-slate-900/60 shrink-0 ${iconColor}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold leading-tight">{item.title}</h4>
                <p className="text-xs opacity-90 leading-relaxed">{item.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SmartInsights;

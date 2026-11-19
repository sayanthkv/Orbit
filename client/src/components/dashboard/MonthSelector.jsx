import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { getMonthName } from '../../utils/formatters';

export const MonthSelector = ({
  month,
  year,
  selectedMonth,
  selectedYear,
  onChange,
}) => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const activeMonth = month || selectedMonth || currentMonth;
  const activeYear = year || selectedYear || currentYear;

  const isCurrentMonth = activeMonth === currentMonth && activeYear === currentYear;

  const handlePrev = () => {
    let newMonth = activeMonth - 1;
    let newYear = activeYear;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    onChange(newMonth, newYear);
  };

  const handleNext = () => {
    let newMonth = activeMonth + 1;
    let newYear = activeYear;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    onChange(newMonth, newYear);
  };

  const handleCurrent = () => {
    onChange(currentMonth, currentYear);
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-1.5 shadow-xs">
      <button
        onClick={handlePrev}
        type="button"
        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
        aria-label="Previous month"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-1.5 px-2">
        <Calendar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">
          {getMonthName(activeMonth)} {activeYear}
        </span>
      </div>

      <button
        onClick={handleNext}
        type="button"
        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
        aria-label="Next month"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {!isCurrentMonth && (
        <button
          onClick={handleCurrent}
          type="button"
          className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-colors ml-1 hidden sm:inline-block"
        >
          Today
        </button>
      )}
    </div>
  );
};

export default MonthSelector;

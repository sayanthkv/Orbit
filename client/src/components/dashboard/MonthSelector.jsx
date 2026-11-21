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
    <div className="flex items-center gap-1 bg-white border border-zinc-200 shadow-xs dark:bg-[#18181A] dark:border-white/12 dark:shadow-md rounded-full p-1 transition-colors">
      <button
        onClick={handlePrev}
        type="button"
        className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-white/8 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
        aria-label="Previous month"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-1.5 px-2.5">
        <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
          {getMonthName(activeMonth)} {activeYear}
        </span>
      </div>

      <button
        onClick={handleNext}
        type="button"
        className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-white/8 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
        aria-label="Next month"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {!isCurrentMonth && (
        <button
          onClick={handleCurrent}
          type="button"
          className="text-[11px] font-bold px-3 py-1 rounded-full bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 transition-colors cursor-pointer ml-0.5 hidden sm:inline-block"
        >
          Today
        </button>
      )}
    </div>
  );
};

export default MonthSelector;

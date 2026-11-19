import React from 'react';

export const Skeleton = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800 ${className}`}
    />
  );
};

export const CardSkeleton = () => (
  <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex flex-col gap-4">
    <div className="flex items-center justify-between">
      <Skeleton className="w-24 h-4" />
      <Skeleton className="w-8 h-8 rounded-full" />
    </div>
    <Skeleton className="w-36 h-8" />
    <Skeleton className="w-full h-3" />
  </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="w-full space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900/40"
      >
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="w-32 h-4" />
            <Skeleton className="w-20 h-3" />
          </div>
        </div>
        <Skeleton className="w-24 h-5" />
      </div>
    ))}
  </div>
);

export default Skeleton;

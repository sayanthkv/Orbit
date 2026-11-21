import React from 'react';

export const Skeleton = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse rounded-xl bg-zinc-200 dark:bg-white/[0.06] ${className}`}
    />
  );
};

export const CardSkeleton = ({ className = '' }) => (
  <div className={`p-6 rounded-2xl border border-zinc-200/90 bg-white dark:border-white/8 dark:bg-[#111113] flex flex-col gap-4 shadow-sm ${className}`}>
    <div className="flex items-center justify-between">
      <Skeleton className="w-24 h-4" />
      <Skeleton className="w-8 h-8 rounded-full" />
    </div>
    <Skeleton className="w-36 h-8" />
    <Skeleton className="w-full h-3" />
  </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="w-full space-y-2.5">
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className="flex items-center justify-between p-4 rounded-2xl border border-zinc-200/80 bg-white dark:border-white/8 dark:bg-[#111113] shadow-xs"
      >
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-2xl" />
          <div className="space-y-1.5">
            <Skeleton className="w-32 h-4" />
            <Skeleton className="w-20 h-3" />
          </div>
        </div>
        <Skeleton className="w-20 h-5 rounded-full" />
      </div>
    ))}
  </div>
);

export default Skeleton;

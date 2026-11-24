import React from 'react';
import Button from './Button';

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-white/15 bg-zinc-50/50 dark:bg-white/[0.02] ${className}`}
    >
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-white/10 flex items-center justify-center text-zinc-500 dark:text-zinc-400 mb-3.5 shadow-xs">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h4 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
        {title}
      </h4>
      {description && (
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mt-1">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;

import React from 'react';

export const OrbitLoader = ({
  size = 'md',
  label = null,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'loader-sm',
    md: 'loader-md',
    lg: 'loader-lg',
    xl: 'loader-xl',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3.5 ${className}`}>
      <div
        className={`loader ${sizeClasses[size] || 'loader-md'}`}
        role="status"
        aria-label="Loading"
      />
      {label && (
        <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 tracking-wide font-display animate-pulse">
          {label}
        </p>
      )}
    </div>
  );
};

export default OrbitLoader;

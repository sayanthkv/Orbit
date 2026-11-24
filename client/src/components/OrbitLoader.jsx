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
    <div className={`flex flex-col items-center justify-center gap-2.5 ${className}`}>
      <div
        className={`loader ${sizeClasses[size] || 'loader-md'}`}
        role="status"
        aria-label="Loading"
      />
      {label && (
        <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 tracking-wider font-display uppercase">
          {label}
        </p>
      )}
    </div>
  );
};

export default OrbitLoader;

import React from 'react';

export const Spinner = ({ size = 'md', variant = 'orbit', className = '' }) => {
  // Orbit Cosmic Liquid Metaball Loader
  if (variant === 'orbit') {
    const sizeClasses = {
      sm: 'loader-sm',
      md: 'loader-md',
      lg: 'loader-lg',
      xl: 'loader-xl',
    };

    return (
      <div
        className={`loader ${sizeClasses[size] || 'loader-md'} ${className}`}
        role="status"
        aria-label="Loading"
      />
    );
  }

  // Classic compact circular spinner for inline button states
  const classicSizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  return (
    <div
      className={`inline-block animate-spin rounded-full border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ${
        classicSizes[size] || classicSizes.md
      } ${className}`}
      role="status"
    >
      <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
        Loading...
      </span>
    </div>
  );
};

export default Spinner;

import React from 'react';
import { APP_NAME, APP_TAGLINE } from '../../utils/constants';

export const Logo = ({ size = 'md', showTagline = false, className = '' }) => {
  const sizeMap = {
    sm: {
      icon: 'w-6 h-6',
      text: 'text-lg',
      tagline: 'text-[10px]',
      dot: 'w-1.5 h-1.5',
    },
    md: {
      icon: 'w-8 h-8',
      text: 'text-xl',
      tagline: 'text-xs',
      dot: 'w-2 h-2',
    },
    lg: {
      icon: 'w-12 h-12',
      text: 'text-3xl',
      tagline: 'text-sm',
      dot: 'w-3 h-3',
    },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Modern Planetary Orbit Icon */}
      <div className={`relative flex items-center justify-center ${currentSize.icon} shrink-0`}>
        <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30 dark:border-emerald-400/20 rotate-45" />
        <div className="absolute inset-1 rounded-full border-2 border-dashed border-emerald-500 dark:border-emerald-400 animate-[spin_12s_linear_infinite]" />
        <div className={`rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-md shadow-emerald-500/20 ${currentSize.dot}`} />
      </div>

      <div className="flex flex-col">
        <span className={`font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-0.5 ${currentSize.text}`}>
          {APP_NAME}
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block ml-0.5" />
        </span>
        {showTagline && (
          <span className={`text-slate-500 dark:text-slate-400 font-medium tracking-tight -mt-0.5 ${currentSize.tagline}`}>
            {APP_TAGLINE}
          </span>
        )}
      </div>
    </div>
  );
};

export default Logo;

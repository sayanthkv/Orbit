import React from 'react';

export const Card = ({
  children,
  className = '',
  title,
  subtitle,
  action,
  headerBorder = true,
  ...props
}) => {
  return (
    <div
      className={`bg-white/90 dark:bg-[#141418]/90 backdrop-blur-md border border-zinc-200/90 dark:border-white/10 rounded-2xl shadow-xs hover:border-zinc-300 dark:hover:border-white/20 transition-all duration-200 overflow-hidden ${className}`}
      {...props}
    >
      {(title || subtitle || action) && (
        <div
          className={`px-5 py-4 flex items-center justify-between gap-3 ${
            headerBorder ? 'border-b border-zinc-100 dark:border-white/8' : ''
          }`}
        >
          <div>
            {title && (
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
};

export default Card;

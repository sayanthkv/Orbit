import React from 'react';

export const Select = ({
  label,
  error,
  options = [],
  className = '',
  id,
  required = false,
  ...props
}) => {
  const selectId = id || props.name || Math.random().toString(36).substring(7);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full rounded-2xl px-4 py-2.5 text-sm font-medium transition-all outline-none border ${
          error
            ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
            : 'border-zinc-200 bg-white text-zinc-900 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-400/15 dark:border-white/10 dark:bg-[#1c1c20] dark:text-zinc-100 dark:focus:border-white/30 dark:focus:ring-white/10'
        } ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option 
            key={opt.value} 
            value={opt.value}
            className="bg-white text-zinc-900 dark:bg-[#1c1c20] dark:text-zinc-100"
          >
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
    </div>
  );
};

export default Select;

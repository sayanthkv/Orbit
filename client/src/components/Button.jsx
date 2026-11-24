import React from 'react';
import Spinner from './Spinner';

export const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  onClick,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-bold tracking-tight rounded-xl transition-all duration-200 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

  const variants = {
    primary:
      'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30 focus:ring-emerald-500 border border-emerald-500/30',
    secondary:
      'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 dark:bg-white/10 dark:hover:bg-white/15 dark:text-white focus:ring-zinc-400 border border-zinc-200/80 dark:border-white/10',
    outline:
      'bg-transparent hover:bg-zinc-100 text-zinc-700 dark:hover:bg-white/5 dark:text-zinc-300 border border-zinc-300 dark:border-white/15 focus:ring-zinc-400',
    danger:
      'bg-rose-600 hover:bg-rose-500 text-white shadow-sm shadow-rose-600/30 focus:ring-rose-500 border border-rose-500/30',
    ghost:
      'bg-transparent hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 dark:hover:bg-white/5 dark:text-zinc-400 dark:hover:text-white',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Spinner size="sm" variant="classic" className="mr-1.5" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
        </>
      )}
    </button>
  );
};

export default Button;

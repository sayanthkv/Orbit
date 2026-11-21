import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  icon: Icon,
  type = 'button',
  onClick,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-bold rounded-full transition-all duration-200 focus:outline-none active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none select-none cursor-pointer';

  const variants = {
    primary: 'bg-zinc-900 hover:bg-black text-white shadow-sm dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 dark:shadow-[0_4px_16px_rgba(255,255,255,0.12)]',
    secondary: 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 dark:border-white/10',
    outline: 'border border-zinc-300 hover:bg-zinc-100 text-zinc-700 dark:border-white/15 dark:hover:bg-white/[0.06] dark:text-zinc-300 dark:hover:text-white',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm shadow-rose-500/20',
    ghost: 'bg-transparent hover:bg-zinc-100 text-zinc-600 dark:hover:bg-white/[0.06] dark:text-zinc-400 dark:hover:text-white',
    success: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-500/20',
  };

  const sizes = {
    sm: 'text-xs px-4 py-1.5 gap-1.5',
    md: 'text-sm px-5 py-2.5 gap-2',
    lg: 'text-sm px-6 py-3 gap-2',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;

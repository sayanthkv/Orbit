import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Sun,
  Moon,
  LogOut,
  Menu,
  Plus,
  LayoutDashboard,
  Receipt,
  PieChart,
  Repeat,
  Tags,
  Target,
  Settings,
} from 'lucide-react';
import Logo from '../common/Logo';

const ROUTE_CONFIG = {
  '/': { title: 'Dashboard', icon: LayoutDashboard },
  '/transactions': { title: 'Transactions', icon: Receipt },
  '/budgets': { title: 'Budgets', icon: PieChart },
  '/recurring': { title: 'Recurring Rules', icon: Repeat },
  '/categories': { title: 'Categories', icon: Tags },
  '/goals': { title: 'Savings Goals', icon: Target },
  '/settings': { title: 'Settings', icon: Settings },
};

export const Header = ({ onOpenAddModal, onToggleMobileMenu }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const currentRoute = ROUTE_CONFIG[location.pathname] || {
    title: 'Orbit',
    icon: LayoutDashboard,
  };
  const RouteIcon = currentRoute.icon;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 md:px-8 py-3.5 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      {/* Mobile Left: Menu Toggle + Logo */}
      <div className="flex items-center gap-3 md:hidden">
        <button
          onClick={onToggleMobileMenu}
          type="button"
          aria-label="Open navigation menu"
          className="p-2 -ml-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Logo size="sm" />
      </div>

      {/* Desktop Left: Current Page Title & Breadcrumb */}
      <div className="hidden md:flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
          <RouteIcon className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
            {currentRoute.title}
          </h2>
          <span className="text-[11px] text-slate-400 font-medium">
            Personal Finance &bull; Orbit
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Add Button */}
        <button
          onClick={onOpenAddModal}
          type="button"
          className="flex items-center gap-1.5 py-1.5 px-3 sm:px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs shadow-sm shadow-emerald-600/25 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden sm:inline">Add Transaction</span>
          <span className="sm:hidden">Add</span>
        </button>

        {/* Currency Pill */}
        <span className="hidden sm:inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
          {user?.currency || 'INR'}
        </span>

        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleTheme}
          type="button"
          aria-label="Toggle dark mode"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Mini Avatar & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <button
            onClick={logout}
            type="button"
            title="Log Out"
            aria-label="Log Out"
            className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

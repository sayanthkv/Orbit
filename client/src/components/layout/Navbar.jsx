import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, LogOut, Plus } from 'lucide-react';
import Logo from '../common/Logo';

export const NAV_ITEMS = [
  { to: '/', label: 'Home' },
  { to: '/accounts', label: 'Accounts' },
  { to: '/transactions', label: 'Expenses' },
  { to: '/budgets', label: 'Budgets' },
  { to: '/categories', label: 'Categories' },
  { to: '/settings', label: 'Settings' },
];

export const Navbar = ({ onOpenAddModal }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 w-full pt-3 sm:pt-5 pb-2 px-3 sm:px-6 md:px-8">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand Logo on Left */}
        <div className="flex items-center gap-2 shrink-0">
          <Logo size="sm" showTagline={false} />
        </div>

        {/* Center: Floating Capsule Navbar (Faithful to capsule reference) */}
        <div className="hidden md:flex items-center justify-center flex-1 mx-4">
          {/* Outer Capsule Container */}
          <div className="bg-white/95 border border-zinc-200/90 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:bg-[#18181c] dark:border-white/12 dark:shadow-[0_16px_40px_rgba(0,0,0,0.7)] rounded-[28px] p-2 flex items-center transition-all">
            {/* Inner Pill Track */}
            <nav className="bg-[#c8c8cc] dark:bg-[#86868b] rounded-full p-1 flex items-center gap-1 transition-colors">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `px-4 sm:px-5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 select-none ${
                      isActive
                        ? 'bg-[#f4f4f6] text-[#0f0f11] font-black shadow-sm scale-100'
                        : 'text-[#1d1d20] hover:text-black hover:bg-black/5 dark:text-[#18181b] dark:hover:text-black dark:hover:bg-black/10'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}

              {/* Action Button Capsule (matches Contact dark pill from image) */}
              <button
                onClick={onOpenAddModal}
                type="button"
                className="ml-1 px-4 sm:px-5 py-1.5 rounded-full bg-[#18181b] hover:bg-black text-white text-xs sm:text-sm font-bold shadow-sm ring-1 ring-white/10 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Log Entry</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Right User & Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Add button on mobile top bar */}
          <button
            onClick={onOpenAddModal}
            type="button"
            className="md:hidden flex items-center gap-1 px-3 py-1.5 rounded-full bg-zinc-900 text-white dark:bg-[#18181B] dark:border dark:border-white/15 dark:text-white text-xs font-bold shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add</span>
          </button>

          {/* Theme toggle - visible on all screen sizes */}
          <button
            onClick={toggleTheme}
            type="button"
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
            className="p-2 rounded-full text-zinc-700 hover:text-zinc-950 bg-white border border-zinc-200/90 shadow-xs dark:bg-[#18181B] dark:border-white/10 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer flex items-center justify-center"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
          </button>

          {/* User avatar & logout pill */}
          <div className="flex items-center gap-1.5 bg-white border border-zinc-200/90 shadow-xs dark:bg-[#18181B] dark:border-white/15 rounded-full p-1 pr-2">
            <div className="w-7 h-7 rounded-full bg-zinc-200 text-zinc-900 dark:bg-gradient-to-tr dark:from-zinc-200 dark:to-zinc-400 dark:text-zinc-950 font-black text-xs flex items-center justify-center">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <button
              onClick={logout}
              type="button"
              title="Log Out"
              className="p-1 text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

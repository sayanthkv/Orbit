import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
import { Sun, Moon, LogOut, LayoutGrid, ChevronLeft, Search, FileDown } from 'lucide-react';
import GlobalSearchModal from '../components/GlobalSearchModal';
import MonthlyReportModal from '../components/MonthlyReportModal';
import ScrollProgressIndicator from '../components/parallax/ScrollProgressIndicator';
import ParallaxBackground from '../components/parallax/ParallaxBackground';

export const AppLayout = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const isExpenseTracker = location.pathname.startsWith('/tools/expense-tracker');

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 flex flex-col transition-colors selection:bg-emerald-500 selection:text-white relative overflow-x-hidden">
      {/* Top Parallax Progress Indicator */}
      <ScrollProgressIndicator />

      {/* Global Ambient Parallax Cosmic Background */}
      <ParallaxBackground />

      {/* Top Floating Glass Navbar */}
      <header className="sticky top-0 z-40 bg-white/70 dark:bg-[#09090b]/75 backdrop-blur-xl border-b border-zinc-200/80 dark:border-white/10 px-4 sm:px-6 h-16 flex items-center justify-between shadow-xs">
        {/* Brand / Hub Navigation */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-emerald-600/30 group-hover:scale-105 group-hover:shadow-emerald-500/50 transition-all font-display">
              O
            </div>
            <div className="flex flex-col">
              <span className="text-base font-black tracking-tight leading-none text-zinc-900 dark:text-white font-display">
                Orbit
              </span>
              <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase mt-0.5">
                Personal Suite
              </span>
            </div>
          </Link>

          {isExpenseTracker && (
            <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-zinc-200 dark:border-white/10">
              <Link
                to="/"
                className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Hub</span>
              </Link>
              <span className="text-zinc-300 dark:text-zinc-700">/</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-display">
                Expense Tracker
              </span>
            </div>
          )}
        </div>

        {/* Global Search Bar (Trigger) */}
        <div className="hidden md:flex items-center flex-1 max-w-xs mx-4">
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium text-zinc-400 bg-zinc-100/80 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 rounded-xl hover:border-zinc-300 dark:hover:border-white/20 transition-all cursor-pointer backdrop-blur-md"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-emerald-500" />
              <span>Search transactions & tags...</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] font-bold bg-white dark:bg-white/10 border border-zinc-200 dark:border-white/10 rounded text-zinc-500 font-mono">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* User Menu & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mobile Search Icon */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="md:hidden p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Statement Export Button */}
          {isExpenseTracker && (
            <button
              type="button"
              onClick={() => setIsReportOpen(true)}
              className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title="Export Statement (PDF / CSV)"
            >
              <FileDown className="w-4 h-4" />
            </button>
          )}

          {/* Quick Hub button on mobile if in a tool */}
          {isExpenseTracker && (
            <Link
              to="/"
              className="sm:hidden p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
              title="Return to Hub"
            >
              <LayoutGrid className="w-4 h-4" />
            </Link>
          )}

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User badge */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-white/10">
              <div className="w-8 h-8 rounded-full bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center font-display uppercase border border-emerald-500/20">
                {user.name ? user.name[0] : 'U'}
              </div>
              <span className="hidden lg:inline text-xs font-bold text-zinc-700 dark:text-zinc-300">
                {user.name}
              </span>

              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="p-2 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10">
        <Outlet />
      </main>

      {/* Global Modals */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <MonthlyReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />
    </div>
  );
};

export default AppLayout;

import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  Plus,
  Menu,
} from 'lucide-react';

export const BottomNav = ({ onOpenAddModal, onToggleMobileMenu }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-1.5 flex items-center justify-around shadow-lg">
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-semibold transition-all ${
            isActive
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`
        }
      >
        <LayoutDashboard className="w-5 h-5" />
        <span>Home</span>
      </NavLink>

      <NavLink
        to="/transactions"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-semibold transition-all ${
            isActive
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`
        }
      >
        <Receipt className="w-5 h-5" />
        <span>Transactions</span>
      </NavLink>

      {/* Center Floating Plus CTA */}
      <button
        onClick={onOpenAddModal}
        type="button"
        className="-mt-5 w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-600/40 active:scale-90 transition-transform cursor-pointer border-2 border-white dark:border-slate-950"
        aria-label="Add transaction"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

      <NavLink
        to="/budgets"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-semibold transition-all ${
            isActive
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`
        }
      >
        <PieChart className="w-5 h-5" />
        <span>Budgets</span>
      </NavLink>

      <button
        onClick={onToggleMobileMenu}
        type="button"
        className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all cursor-pointer"
        aria-label="Open more menu"
      >
        <Menu className="w-5 h-5" />
        <span>Menu</span>
      </button>
    </nav>
  );
};

export default BottomNav;

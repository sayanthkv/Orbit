import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  PieChart,
  Plus,
} from 'lucide-react';

export const BottomNav = ({ onOpenAddModal }) => {
  return (
    <div className="fixed bottom-2.5 inset-x-3 max-w-md mx-auto z-30 md:hidden pb-[env(safe-area-inset-bottom)]">
      {/* Outer Floating Pill Container */}
      <div className="bg-white/95 border border-zinc-200/90 shadow-[0_12px_36px_rgba(0,0,0,0.18)] dark:bg-[#141418]/95 dark:border-white/12 dark:shadow-[0_20px_48px_rgba(0,0,0,0.85)] rounded-full p-1.5 backdrop-blur-xl transition-all">
        {/* Inner Track */}
        <nav className="bg-zinc-100/90 dark:bg-[#1c1c24] rounded-full p-1 flex items-center justify-between transition-colors">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 px-3 rounded-full text-[10px] font-bold transition-all duration-200 select-none ${
                isActive
                  ? 'bg-zinc-950 text-white shadow-xs dark:bg-white dark:text-zinc-950 scale-100'
                  : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white'
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-[9px] mt-0.5 font-bold">Home</span>
          </NavLink>

          <NavLink
            to="/accounts"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 px-3 rounded-full text-[10px] font-bold transition-all duration-200 select-none ${
                isActive
                  ? 'bg-zinc-950 text-white shadow-xs dark:bg-white dark:text-zinc-950 scale-100'
                  : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white'
              }`
            }
          >
            <Wallet className="w-4 h-4" />
            <span className="text-[9px] mt-0.5 font-bold">Accounts</span>
          </NavLink>

          {/* Action Button Capsule in Center */}
          <button
            onClick={onOpenAddModal}
            type="button"
            className="px-4 py-2.5 rounded-full bg-zinc-900 text-white hover:bg-black dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 shadow-lg shadow-black/20 dark:shadow-white/10 active:scale-90 transition-transform cursor-pointer flex items-center justify-center"
            aria-label="Add transaction"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
          </button>

          <NavLink
            to="/transactions"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 px-3 rounded-full text-[10px] font-bold transition-all duration-200 select-none ${
                isActive
                  ? 'bg-zinc-950 text-white shadow-xs dark:bg-white dark:text-zinc-950 scale-100'
                  : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white'
              }`
            }
          >
            <Receipt className="w-4 h-4" />
            <span className="text-[9px] mt-0.5 font-bold">Expenses</span>
          </NavLink>

          <NavLink
            to="/budgets"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 px-3 rounded-full text-[10px] font-bold transition-all duration-200 select-none ${
                isActive
                  ? 'bg-zinc-950 text-white shadow-xs dark:bg-white dark:text-zinc-950 scale-100'
                  : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white'
              }`
            }
          >
            <PieChart className="w-4 h-4" />
            <span className="text-[9px] mt-0.5 font-bold">Budgets</span>
          </NavLink>
        </nav>
      </div>
    </div>
  );
};

export default BottomNav;

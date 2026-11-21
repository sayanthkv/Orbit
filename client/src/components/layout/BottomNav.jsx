import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  PieChart,
  Tag,
  Plus,
} from 'lucide-react';

export const BottomNav = ({ onOpenAddModal }) => {
  return (
    <div className="fixed bottom-3 left-3 right-3 z-30 md:hidden">
      {/* Outer Pill */}
      <div className="bg-white/95 border border-zinc-200/90 shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:bg-[#141418] dark:border-white/12 dark:shadow-[0_16px_40px_rgba(0,0,0,0.85)] rounded-full p-1.5 backdrop-blur-md transition-colors">
        {/* Inner Track */}
        <nav className="bg-zinc-100/90 dark:bg-[#1e1e26] rounded-full p-1 flex items-center justify-between transition-colors">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 px-3 rounded-full text-[10px] font-bold transition-all ${
                isActive
                  ? 'bg-zinc-950 text-white shadow-sm dark:bg-white dark:text-zinc-950'
                  : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white'
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-[9px] mt-0.5">Home</span>
          </NavLink>

          <NavLink
            to="/accounts"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 px-3 rounded-full text-[10px] font-bold transition-all ${
                isActive
                  ? 'bg-zinc-950 text-white shadow-sm dark:bg-white dark:text-zinc-950'
                  : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white'
              }`
            }
          >
            <Wallet className="w-4 h-4" />
            <span className="text-[9px] mt-0.5">Accounts</span>
          </NavLink>

          {/* Action Capsule in Center */}
          <button
            onClick={onOpenAddModal}
            type="button"
            className="px-3.5 py-2 rounded-full bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-950 shadow-md active:scale-90 transition-transform cursor-pointer flex items-center justify-center"
            aria-label="Add transaction"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>

          <NavLink
            to="/transactions"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 px-3 rounded-full text-[10px] font-bold transition-all ${
                isActive
                  ? 'bg-zinc-950 text-white shadow-sm dark:bg-white dark:text-zinc-950'
                  : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white'
              }`
            }
          >
            <Receipt className="w-4 h-4" />
            <span className="text-[9px] mt-0.5">Expenses</span>
          </NavLink>

          <NavLink
            to="/budgets"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 px-3 rounded-full text-[10px] font-bold transition-all ${
                isActive
                  ? 'bg-zinc-950 text-white shadow-sm dark:bg-white dark:text-zinc-950'
                  : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white'
              }`
            }
          >
            <PieChart className="w-4 h-4" />
            <span className="text-[9px] mt-0.5">Budgets</span>
          </NavLink>
        </nav>
      </div>
    </div>
  );
};

export default BottomNav;

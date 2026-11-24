import React, { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Landmark,
  Banknote,
  Receipt,
  ArrowLeft,
  Wallet,
  ArrowLeftRight,
  PieChart,
  Repeat,
  Target,
  Tags,
  Plus,
  MoreHorizontal,
  User,
  X
} from 'lucide-react';
import CategoryModal from '../../components/CategoryModal';
import Modal from '../../components/Modal';

export const ExpenseTrackerLayout = () => {
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const mainNavItems = [
    {
      to: '/tools/expense-tracker',
      end: true,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      to: '/tools/expense-tracker/accounts',
      label: 'Bank Accounts',
      icon: Landmark,
    },
    {
      to: '/tools/expense-tracker/cash',
      label: 'Cash in Hand',
      icon: Banknote,
    },
    {
      to: '/tools/expense-tracker/transfers',
      label: 'Transfers',
      icon: ArrowLeftRight,
    },
    {
      to: '/tools/expense-tracker/budgets',
      label: 'Budgets',
      icon: PieChart,
    },
    {
      to: '/tools/expense-tracker/recurring',
      label: 'Recurring',
      icon: Repeat,
    },
    {
      to: '/tools/expense-tracker/goals',
      label: 'Savings Goals',
      icon: Target,
    },
    {
      to: '/tools/expense-tracker/expenses',
      label: 'All Expenses',
      icon: Receipt,
    },
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-0">
      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#111115] p-4 shrink-0">
        <div className="space-y-6 flex-1">
          {/* Module Banner */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white truncate font-display">
                Expense Tracker
              </h2>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                Personal Finance Tool
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 font-extrabold'
                        : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}

            {/* Custom Categories Trigger */}
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(true)}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-all text-left"
            >
              <Tags className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>Categories</span>
            </button>
          </nav>
        </div>

        {/* Bottom Back to Hub */}
        <div className="pt-4 border-t border-zinc-100 dark:border-white/6">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Hub</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <section className="flex-1 flex flex-col min-w-0 pb-24 md:pb-8">
        <Outlet />
      </section>

      {/* Mobile Floating Bottom Navigation (Hidden whenever any modal is open via orbit-modal-open) */}
      <nav
        data-orbit-bottom-nav
        className="md:hidden fixed bottom-3 inset-x-3 z-40 max-w-md mx-auto orbit-bottom-nav transition-all duration-200"
      >
        <div className="bg-white/95 dark:bg-[#141418]/95 border border-zinc-200/90 dark:border-white/10 rounded-2xl p-1.5 shadow-2xl backdrop-blur-xl flex items-center justify-around">
          <NavLink
            to="/tools/expense-tracker"
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl text-[10px] font-bold transition-all ${
                isActive ? 'bg-emerald-600 text-white shadow-xs' : 'text-zinc-500 dark:text-zinc-400'
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-[9px] mt-0.5">Home</span>
          </NavLink>

          <NavLink
            to="/tools/expense-tracker/accounts"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl text-[10px] font-bold transition-all ${
                isActive ? 'bg-emerald-600 text-white shadow-xs' : 'text-zinc-500 dark:text-zinc-400'
              }`
            }
          >
            <Landmark className="w-4 h-4" />
            <span className="text-[9px] mt-0.5">Accounts</span>
          </NavLink>

          <NavLink
            to="/tools/expense-tracker/transfers"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl text-[10px] font-bold transition-all ${
                isActive ? 'bg-emerald-600 text-white shadow-xs' : 'text-zinc-500 dark:text-zinc-400'
              }`
            }
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span className="text-[9px] mt-0.5">Transfer</span>
          </NavLink>

          <NavLink
            to="/tools/expense-tracker/expenses"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl text-[10px] font-bold transition-all ${
                isActive ? 'bg-emerald-600 text-white shadow-xs' : 'text-zinc-500 dark:text-zinc-400'
              }`
            }
          >
            <Receipt className="w-4 h-4" />
            <span className="text-[9px] mt-0.5">Expenses</span>
          </NavLink>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl text-[10px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          >
            <MoreHorizontal className="w-4 h-4" />
            <span className="text-[9px] mt-0.5">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile More Sheet */}
      <Modal
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        title="More Features"
        maxWidth="max-w-sm"
      >
        <div className="grid grid-cols-2 gap-2.5 py-1">
          <Link
            to="/tools/expense-tracker/cash"
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 flex flex-col items-center text-center gap-2 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
          >
            <Banknote className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-bold text-zinc-900 dark:text-white">Cash in Hand</span>
          </Link>

          <Link
            to="/tools/expense-tracker/budgets"
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 flex flex-col items-center text-center gap-2 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
          >
            <PieChart className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-bold text-zinc-900 dark:text-white">Budgets</span>
          </Link>

          <Link
            to="/tools/expense-tracker/recurring"
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 flex flex-col items-center text-center gap-2 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
          >
            <Repeat className="w-5 h-5 text-purple-500" />
            <span className="text-xs font-bold text-zinc-900 dark:text-white">Recurring</span>
          </Link>

          <Link
            to="/tools/expense-tracker/goals"
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 flex flex-col items-center text-center gap-2 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
          >
            <Target className="w-5 h-5 text-blue-500" />
            <span className="text-xs font-bold text-zinc-900 dark:text-white">Savings Goals</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(false);
              setIsCategoryModalOpen(true);
            }}
            className="col-span-2 p-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 flex items-center justify-center gap-2 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
          >
            <Tags className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-zinc-900 dark:text-white">Manage Categories</span>
          </button>

          <Link
            to="/profile"
            onClick={() => setIsMobileMenuOpen(false)}
            className="col-span-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center gap-2 hover:bg-emerald-500/15 transition-colors"
          >
            <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Profile & Settings</span>
          </Link>
        </div>
      </Modal>

      {/* Category Manager Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />
    </div>
  );
};

export default ExpenseTrackerLayout;

import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AppLayout from './AppLayout';
import Spinner from '../components/Spinner';

// Lazy loaded page components
const LoginPage = lazy(() => import('../features/auth/LoginPage'));
const RegisterPage = lazy(() => import('../features/auth/RegisterPage'));
const HubPage = lazy(() => import('../features/hub/HubPage'));
const ProfilePage = lazy(() => import('../features/profile/ProfilePage'));

// Expense Tracker Feature Modules
const ExpenseTrackerLayout = lazy(() => import('../features/expense-tracker/ExpenseTrackerLayout'));
const DashboardPage = lazy(() => import('../features/expense-tracker/pages/DashboardPage'));
const AccountsPage = lazy(() => import('../features/expense-tracker/pages/AccountsPage'));
const AccountDetailPage = lazy(() => import('../features/expense-tracker/pages/AccountDetailPage'));
const CashPage = lazy(() => import('../features/expense-tracker/pages/CashPage'));
const AllExpensesPage = lazy(() => import('../features/expense-tracker/pages/AllExpensesPage'));
const TransfersPage = lazy(() => import('../features/expense-tracker/pages/TransfersPage'));
const BudgetsPage = lazy(() => import('../features/expense-tracker/pages/BudgetsPage'));
const RecurringPage = lazy(() => import('../features/expense-tracker/pages/RecurringPage'));
const GoalsPage = lazy(() => import('../features/expense-tracker/pages/GoalsPage'));

// Vehicle Log & Mileage Tracker Feature Modules
const VehicleLogLayout = lazy(() => import('../features/vehicle-log/VehicleLogLayout'));
const VehicleOverviewPage = lazy(() => import('../features/vehicle-log/VehicleOverviewPage'));
const MileageTesterPage = lazy(() => import('../features/vehicle-log/MileageTesterPage'));
const FuelLogPage = lazy(() => import('../features/vehicle-log/FuelLogPage'));
const ServiceLogPage = lazy(() => import('../features/vehicle-log/ServiceLogPage'));
const DocumentsPage = lazy(() => import('../features/vehicle-log/DocumentsPage'));
const VehicleAnalyticsPage = lazy(() => import('../features/vehicle-log/VehicleAnalyticsPage'));

const PageLoader = () => (
  <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
    <div className="loader loader-lg" role="status" aria-label="Loading page" />
  </div>
);

export const AppRouter = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Authentication Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Tool Suite Routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Hub Home (Multi-tool launcher) */}
          <Route path="/" element={<HubPage />} />

          {/* User Profile Section */}
          <Route path="/profile" element={<ProfilePage />} />

          {/* Tool: Expense Tracker (Modular plug-in layout & routes) */}
          <Route path="/tools/expense-tracker" element={<ExpenseTrackerLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="accounts" element={<AccountsPage />} />
            <Route path="accounts/:id" element={<AccountDetailPage />} />
            <Route path="cash" element={<CashPage />} />
            <Route path="expenses" element={<AllExpensesPage />} />
            <Route path="transfers" element={<TransfersPage />} />
            <Route path="budgets" element={<BudgetsPage />} />
            <Route path="recurring" element={<RecurringPage />} />
            <Route path="goals" element={<GoalsPage />} />
          </Route>

          {/* Tool: Vehicle Log & Mileage Tracker (Modular plug-in layout & routes) */}
          <Route path="/tools/vehicle-log" element={<VehicleLogLayout />}>
            <Route index element={<VehicleOverviewPage />} />
            <Route path="mileage-tester" element={<MileageTesterPage />} />
            <Route path="fuel" element={<FuelLogPage />} />
            <Route path="service" element={<ServiceLogPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="analytics" element={<VehicleAnalyticsPage />} />
          </Route>

          {/* Legacy redirects */}
          <Route path="/dashboard" element={<Navigate to="/tools/expense-tracker" replace />} />
          <Route path="/accounts" element={<Navigate to="/tools/expense-tracker/accounts" replace />} />
          <Route path="/transactions" element={<Navigate to="/tools/expense-tracker/expenses" replace />} />
        </Route>

        {/* Global Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRouter;

import React, { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { VehicleLogProvider, useVehicleLog } from './VehicleLogContext';
import VehicleModal from './components/VehicleModal';
import VehicleAlertsDrawer from './components/VehicleAlertsDrawer';
import ParallaxBackground from '../../components/parallax/ParallaxBackground';
import {
  Car,
  Gauge,
  Fuel,
  Wrench,
  Shield,
  BarChart3,
  Plus,
  Bell,
  ChevronDown,
  ArrowLeft,
} from 'lucide-react';

const VehicleLogContent = () => {
  const {
    vehicles,
    activeVehicle,
    activeVehicleId,
    selectVehicle,
    createVehicle,
    alerts,
    dismissAlert,
  } = useVehicleLog();

  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);

  const navItems = [
    { label: 'Overview', to: '/tools/vehicle-log', end: true, icon: Car },
    { label: 'Mileage Tester', to: '/tools/vehicle-log/mileage-tester', icon: Gauge },
    { label: 'Fuel Log', to: '/tools/vehicle-log/fuel', icon: Fuel },
    { label: 'Service Log', to: '/tools/vehicle-log/service', icon: Wrench },
    { label: 'Documents', to: '/tools/vehicle-log/documents', icon: Shield },
    { label: 'Analytics & TCO', to: '/tools/vehicle-log/analytics', icon: BarChart3 },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden bg-zinc-50 dark:bg-[#09090b]">
      <ParallaxBackground />

      {/* Top Header / Vehicle Switcher */}
      <div className="relative z-20 border-b border-zinc-200/80 dark:border-white/10 bg-white/70 dark:bg-[#0e0e12]/70 backdrop-blur-xl sticky top-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
              title="Back to Orbit Command Deck"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            {/* Vehicle Selector Dropdown */}
            {vehicles.length > 0 ? (
              <div className="flex items-center gap-2">
                <select
                  value={activeVehicleId || ''}
                  onChange={(e) => selectVehicle(e.target.value)}
                  className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black font-display bg-zinc-100 dark:bg-white/10 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {vehicles.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.nickname} ({v.make} {v.model})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setIsAddVehicleOpen(true)}
                  className="p-1.5 text-zinc-400 hover:text-emerald-500 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                  title="Add another vehicle"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddVehicleOpen(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20"
              >
                <Plus className="w-3.5 h-3.5" /> Add Your First Vehicle
              </button>
            )}
          </div>

          {/* Right actions: Alerts */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAlertsOpen(true)}
              className="relative p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
              title="View Alerts"
            >
              <Bell className="w-4 h-4" />
              {alerts.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto no-scrollbar pt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap font-display ${
                    isActive
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Main Feature Content Container */}
      <div className="relative z-10 flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 md:p-8">
        <Outlet />
      </div>

      <VehicleModal
        isOpen={isAddVehicleOpen}
        onClose={() => setIsAddVehicleOpen(false)}
        onSave={createVehicle}
      />

      <VehicleAlertsDrawer
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        alerts={alerts}
        onDismiss={dismissAlert}
      />
    </div>
  );
};

export const VehicleLogLayout = () => {
  return (
    <VehicleLogProvider>
      <VehicleLogContent />
    </VehicleLogProvider>
  );
};

export default VehicleLogLayout;

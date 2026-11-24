import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useVehicleLog } from './VehicleLogContext';
import Button from '../../components/Button';
import ParallaxCard from '../../components/parallax/ParallaxCard';
import ParallaxSection from '../../components/parallax/ParallaxSection';
import FuelModal from './components/FuelModal';
import VehicleModal from './components/VehicleModal';
import api from '../../lib/api';
import { useToast } from '../../components/Toast';
import {
  Car,
  Fuel,
  Gauge,
  Wrench,
  FileText,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Plus,
  Compass,
  Calendar,
  Sparkles,
} from 'lucide-react';

export const VehicleOverviewPage = () => {
  const {
    activeVehicle,
    vehicleDetails,
    alerts,
    updateVehicle,
    refreshDetails,
    todayFuelPrice,
  } = useVehicleLog();

  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const toast = useToast();

  const handleSaveFuel = async (data) => {
    try {
      const res = await api.post(`/vehicles/${activeVehicle._id}/fuel`, data);
      if (res.success) {
        toast.success('Fuel entry recorded successfully!');
        refreshDetails();
        return true;
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save fuel entry');
      return false;
    }
  };

  const handleUpdateVehicle = async (data) => {
    return await updateVehicle(activeVehicle._id, data);
  };

  if (!activeVehicle) {
    return (
      <div className="p-12 text-center bg-white/60 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/10 rounded-3xl backdrop-blur-xl space-y-4">
        <Car className="w-12 h-12 text-zinc-400 mx-auto" />
        <h3 className="text-lg font-black text-zinc-900 dark:text-white font-display">No Vehicles Added Yet</h3>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto">
          Add your motorcycle, scooter, or car to track actual fuel mileage, log maintenance intervals, and never miss document expiries.
        </p>
      </div>
    );
  }

  const stats = vehicleDetails?.stats || {};
  const nextService = vehicleDetails?.nextService;
  const upcomingDocs = vehicleDetails?.upcomingDocs || [];

  return (
    <div className="space-y-8">
      {/* Vehicle Hero Header Card */}
      <ParallaxSection offset={20} speed={0.1}>
        <ParallaxCard depth={10} className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-[#121217]/90 border border-zinc-200/90 dark:border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-cyan-500/10 blur-[80px] pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-emerald-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
                <Car className="w-8 h-8" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight font-display truncate">
                    {activeVehicle.nickname}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase">
                    {activeVehicle.fuelType}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 font-medium mt-1">
                  {activeVehicle.make} {activeVehicle.model} ({activeVehicle.year || 'Standard'}) • <span className="font-bold tracking-wider">{activeVehicle.registrationNumber}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Button
                variant="primary"
                size="md"
                icon={Plus}
                onClick={() => setIsFuelModalOpen(true)}
                className="font-bold shadow-md shadow-emerald-500/20"
              >
                Log Fuel
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsEditModalOpen(true)}
                className="font-bold"
              >
                Edit Vehicle
              </Button>
            </div>
          </div>
        </ParallaxCard>
      </ParallaxSection>

      {/* Primary Metrics Grid */}
      <ParallaxSection offset={30} speed={0.12}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <ParallaxCard depth={6} className="p-5 rounded-2xl bg-white/80 dark:bg-[#121217]/80 border border-zinc-200/80 dark:border-white/10 backdrop-blur-md">
            <p className="text-[11px] font-black uppercase tracking-wider text-zinc-500 font-display">Odometer</p>
            <p className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tabular-nums mt-1 font-display">
              {Number(activeVehicle.currentOdometer).toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-zinc-400 font-medium">km recorded</p>
          </ParallaxCard>

          <ParallaxCard depth={6} className="p-5 rounded-2xl bg-white/80 dark:bg-[#121217]/80 border border-zinc-200/80 dark:border-white/10 backdrop-blur-md">
            <p className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-display">
              Avg Mileage
            </p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-1 font-display">
              {stats.averageMileage ? `${stats.averageMileage}` : '--'}
            </p>
            <p className="text-[11px] text-zinc-400 font-medium">km / litre</p>
          </ParallaxCard>

          <ParallaxCard depth={6} className="p-5 rounded-2xl bg-white/80 dark:bg-[#121217]/80 border border-zinc-200/80 dark:border-white/10 backdrop-blur-md">
            <p className="text-[11px] font-black uppercase tracking-wider text-zinc-500 font-display">Total Fuel Spend</p>
            <p className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tabular-nums mt-1 font-display">
              ₹{Number(stats.totalFuelSpent || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-zinc-400 font-medium">{stats.totalFills || 0} fill-ups</p>
          </ParallaxCard>

          <ParallaxCard depth={6} className="p-5 rounded-2xl bg-white/80 dark:bg-[#121217]/80 border border-zinc-200/80 dark:border-white/10 backdrop-blur-md">
            <p className="text-[11px] font-black uppercase tracking-wider text-zinc-500 font-display">Running Cost</p>
            <p className="text-2xl sm:text-3xl font-black text-cyan-600 dark:text-cyan-400 tabular-nums mt-1 font-display">
              ₹{stats.costPerKm ? stats.costPerKm : '--'}
            </p>
            <p className="text-[11px] text-zinc-400 font-medium">per kilometer</p>
          </ParallaxCard>
        </div>
      </ParallaxSection>

      {/* Star Highlight: Mileage Tester Quick Launch Banner */}
      <ParallaxSection offset={25} speed={0.1}>
        <Link to="/tools/vehicle-log/mileage-tester" className="block group">
          <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-transparent border border-emerald-500/20 hover:border-emerald-500/50 transition-all duration-300 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Gauge className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-zinc-900 dark:text-white font-display group-hover:text-emerald-500 transition-colors">
                  Open Mileage Tester & Range Estimator
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Calculate full-to-full trip efficiency, test top-up costs, and estimate passenger travel splits.
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span>Launch Tool</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
      </ParallaxSection>

      {/* Upcomings: Service Due & Documents Expiry */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ParallaxCard depth={8} className="p-6 rounded-3xl bg-white/80 dark:bg-[#121217]/80 border border-zinc-200/80 dark:border-white/10 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2 font-display">
              <Wrench className="w-4 h-4 text-emerald-500" />
              <span>Next Service Due</span>
            </h3>
            <Link to="/tools/vehicle-log/service" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
              View Log →
            </Link>
          </div>

          {nextService ? (
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/60 dark:border-white/5 space-y-2">
              <p className="text-xs font-bold text-zinc-900 dark:text-white">Scheduled Maintenance</p>
              <div className="flex items-center gap-4 text-xs text-zinc-500 font-medium">
                {nextService.nextDueOdometer && (
                  <span>Due at: <strong className="text-zinc-900 dark:text-white">{nextService.nextDueOdometer} km</strong></span>
                )}
                {nextService.nextDueDate && (
                  <span>Date: <strong className="text-zinc-900 dark:text-white">{new Date(nextService.nextDueDate).toLocaleDateString()}</strong></span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-400 italic">No scheduled maintenance recorded yet.</p>
          )}
        </ParallaxCard>

        <ParallaxCard depth={8} className="p-6 rounded-3xl bg-white/80 dark:bg-[#121217]/80 border border-zinc-200/80 dark:border-white/10 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2 font-display">
              <FileText className="w-4 h-4 text-cyan-500" />
              <span>Upcoming Document Expiries</span>
            </h3>
            <Link to="/tools/vehicle-log/documents" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
              All Docs →
            </Link>
          </div>

          {upcomingDocs.length > 0 ? (
            <div className="space-y-2">
              {upcomingDocs.map((doc) => (
                <div key={doc._id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/60 dark:border-white/5">
                  <span className="text-xs font-bold text-zinc-900 dark:text-white">
                    {doc.customName || doc.documentType.toUpperCase()}
                  </span>
                  <span className="text-xs text-zinc-500 font-medium">
                    Expires {new Date(doc.expiryDate).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-400 italic">All vehicle documents are up to date.</p>
          )}
        </ParallaxCard>
      </div>

      <FuelModal
        isOpen={isFuelModalOpen}
        onClose={() => setIsFuelModalOpen(false)}
        onSave={handleSaveFuel}
        activeVehicle={activeVehicle}
        defaultPrice={todayFuelPrice}
      />

      <VehicleModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleUpdateVehicle}
        initialData={activeVehicle}
      />
    </div>
  );
};

export default VehicleOverviewPage;

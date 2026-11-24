import React, { useState, useEffect } from 'react';
import { useVehicleLog } from './VehicleLogContext';
import ParallaxCard from '../../components/parallax/ParallaxCard';
import ParallaxSection from '../../components/parallax/ParallaxSection';
import api from '../../lib/api';
import { BarChart3, TrendingUp, IndianRupee, Wrench, Fuel, Shield, Layers } from 'lucide-react';

export const VehicleAnalyticsPage = () => {
  const { activeVehicle } = useVehicleLog();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeVehicle) return;
    api.get(`/vehicles/${activeVehicle._id}/analytics`)
      .then((res) => {
        if (res.success && res.data) {
          setAnalytics(res.data);
        }
      })
      .finally(() => setLoading(false));
  }, [activeVehicle]);

  if (!activeVehicle) {
    return <div className="p-8 text-center text-zinc-500">Please select a vehicle first.</div>;
  }

  const tco = analytics?.tco || {};

  return (
    <div className="space-y-8">
      <ParallaxSection offset={15} speed={0.08}>
        <div>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white font-display flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-emerald-500" />
            <span>Total Cost of Ownership (TCO)</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Comprehensive lifecycle breakdown across fuel, maintenance, and compliance premiums.
          </p>
        </div>
      </ParallaxSection>

      {/* TCO Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ParallaxCard depth={8} className="p-6 rounded-3xl bg-white/90 dark:bg-[#121217]/90 border border-zinc-200/90 dark:border-white/10 backdrop-blur-xl shadow-xl space-y-2">
          <p className="text-xs font-black uppercase tracking-wider text-zinc-500 font-display">Cumulative Spent</p>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums font-display">
            ₹{Number(tco.total || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-zinc-400 font-medium">all logged vehicle expenses</p>
        </ParallaxCard>

        <ParallaxCard depth={8} className="p-6 rounded-3xl bg-white/90 dark:bg-[#121217]/90 border border-zinc-200/90 dark:border-white/10 backdrop-blur-xl shadow-xl space-y-2">
          <p className="text-xs font-black uppercase tracking-wider text-zinc-500 font-display">Running Cost</p>
          <p className="text-3xl font-black text-cyan-600 dark:text-cyan-400 tabular-nums font-display">
            ₹{tco.runningCostPerKm ? tco.runningCostPerKm : '--'}
          </p>
          <p className="text-[11px] text-zinc-400 font-medium">overall cost per kilometer</p>
        </ParallaxCard>

        <ParallaxCard depth={8} className="p-6 rounded-3xl bg-white/90 dark:bg-[#121217]/90 border border-zinc-200/90 dark:border-white/10 backdrop-blur-xl shadow-xl space-y-2">
          <p className="text-xs font-black uppercase tracking-wider text-zinc-500 font-display">Distance Logged</p>
          <p className="text-3xl font-black text-zinc-900 dark:text-white tabular-nums font-display">
            {Number(tco.totalDistance || 0).toLocaleString('en-IN')} km
          </p>
          <p className="text-[11px] text-zinc-400 font-medium">tracked in fuel log</p>
        </ParallaxCard>
      </div>

      {/* Expense Allocation Breakdown */}
      <ParallaxCard depth={10} className="p-6 rounded-3xl bg-white/90 dark:bg-[#121217]/90 border border-zinc-200/90 dark:border-white/10 backdrop-blur-xl shadow-xl space-y-6">
        <h3 className="text-sm font-black uppercase tracking-wider text-zinc-500 font-display">
          Category Allocation
        </h3>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                <Fuel className="w-4 h-4 text-emerald-500" /> Fuel
              </span>
              <span className="text-emerald-600 dark:text-emerald-400">₹{Number(tco.fuel || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-white/5 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${tco.total > 0 ? (tco.fuel / tco.total) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                <Wrench className="w-4 h-4 text-cyan-500" /> Service & Repairs
              </span>
              <span className="text-cyan-600 dark:text-cyan-400">₹{Number(tco.service || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-white/5 overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full"
                style={{ width: `${tco.total > 0 ? (tco.service / tco.total) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                <Shield className="w-4 h-4 text-indigo-500" /> Insurance & Documents
              </span>
              <span className="text-indigo-600 dark:text-indigo-400">₹{Number(tco.documents || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-white/5 overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full"
                style={{ width: `${tco.total > 0 ? (tco.documents / tco.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </ParallaxCard>
    </div>
  );
};

export default VehicleAnalyticsPage;

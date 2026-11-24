import React, { useState, useEffect } from 'react';
import { useVehicleLog } from './VehicleLogContext';
import Button from '../../components/Button';
import ParallaxCard from '../../components/parallax/ParallaxCard';
import ParallaxSection from '../../components/parallax/ParallaxSection';
import FuelModal from './components/FuelModal';
import api from '../../lib/api';
import { useToast } from '../../components/Toast';
import {
  Fuel,
  Plus,
  Trash2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Gauge,
  Receipt,
} from 'lucide-react';

export const FuelLogPage = () => {
  const { activeVehicle, todayFuelPrice, refreshDetails } = useVehicleLog();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toast = useToast();

  const fetchEntries = async () => {
    if (!activeVehicle) return;
    try {
      setLoading(true);
      const res = await api.get(`/vehicles/${activeVehicle._id}/fuel`);
      if (res.success && res.data) {
        setEntries(res.data);
      }
    } catch {
      toast.error('Failed to load fuel entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [activeVehicle]);

  const handleSaveFuel = async (formData) => {
    try {
      const res = await api.post(`/vehicles/${activeVehicle._id}/fuel`, formData);
      if (res.success) {
        toast.success('Fuel entry saved successfully!');
        await fetchEntries();
        refreshDetails();
        return true;
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save fuel entry');
      return false;
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this fuel entry?')) return;
    try {
      const res = await api.delete(`/vehicles/${activeVehicle._id}/fuel/${id}`);
      if (res.success) {
        toast.success('Fuel entry removed');
        await fetchEntries();
        refreshDetails();
      }
    } catch {
      toast.error('Failed to delete fuel entry');
    }
  };

  if (!activeVehicle) {
    return (
      <div className="p-8 text-center text-zinc-500 font-medium">
        Please select or add a vehicle first.
      </div>
    );
  }

  // Calculate lifetime stats from entries
  const validMileages = entries.filter((e) => e.mileage && e.mileage > 0).map((e) => e.mileage);
  const bestMileage = validMileages.length > 0 ? Math.max(...validMileages) : 0;
  const worstMileage = validMileages.length > 0 ? Math.min(...validMileages) : 0;
  const totalLitres = entries.reduce((acc, curr) => acc + (curr.litres || 0), 0);
  const totalSpent = entries.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

  return (
    <div className="space-y-8">
      {/* Top Header & Quick Stats */}
      <ParallaxSection offset={15} speed={0.08}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white font-display flex items-center gap-2.5">
              <Fuel className="w-6 h-6 text-emerald-500" />
              <span>Fuel Log & Efficiency</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              History of all fuel fill-ups and automated full-to-full mileage calculation.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => setIsModalOpen(true)}
            className="font-bold shadow-md shadow-emerald-500/20"
          >
            Log Fuel Fill
          </Button>
        </div>
      </ParallaxSection>

      {/* Fuel Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <ParallaxCard depth={6} className="p-5 rounded-2xl bg-white/80 dark:bg-[#121217]/80 border border-zinc-200/80 dark:border-white/10 backdrop-blur-md">
          <p className="text-[11px] font-black uppercase tracking-wider text-zinc-500">Total Litres</p>
          <p className="text-2xl font-black text-zinc-900 dark:text-white tabular-nums mt-1 font-display">
            {totalLitres.toFixed(1)} L
          </p>
          <p className="text-[11px] text-zinc-400 font-medium">fuel pumped</p>
        </ParallaxCard>

        <ParallaxCard depth={6} className="p-5 rounded-2xl bg-white/80 dark:bg-[#121217]/80 border border-zinc-200/80 dark:border-white/10 backdrop-blur-md">
          <p className="text-[11px] font-black uppercase tracking-wider text-zinc-500">Total Spent</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-1 font-display">
            ₹{Math.round(totalSpent).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-zinc-400 font-medium">{entries.length} entries</p>
        </ParallaxCard>

        <ParallaxCard depth={6} className="p-5 rounded-2xl bg-white/80 dark:bg-[#121217]/80 border border-zinc-200/80 dark:border-white/10 backdrop-blur-md">
          <p className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Best Mileage</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-1 font-display">
            {bestMileage > 0 ? `${bestMileage.toFixed(1)}` : '--'}
          </p>
          <p className="text-[11px] text-zinc-400 font-medium">km / litre</p>
        </ParallaxCard>

        <ParallaxCard depth={6} className="p-5 rounded-2xl bg-white/80 dark:bg-[#121217]/80 border border-zinc-200/80 dark:border-white/10 backdrop-blur-md">
          <p className="text-[11px] font-black uppercase tracking-wider text-zinc-500">Lowest Mileage</p>
          <p className="text-2xl font-black text-zinc-900 dark:text-white tabular-nums mt-1 font-display">
            {worstMileage > 0 ? `${worstMileage.toFixed(1)}` : '--'}
          </p>
          <p className="text-[11px] text-zinc-400 font-medium">km / litre</p>
        </ParallaxCard>
      </div>

      {/* Fuel Entries Ledger */}
      <ParallaxCard depth={10} className="p-6 rounded-3xl bg-white/90 dark:bg-[#121217]/90 border border-zinc-200/90 dark:border-white/10 backdrop-blur-xl shadow-xl space-y-4">
        {entries.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 text-xs">
            No fuel fill-ups recorded for {activeVehicle.nickname} yet. Click "Log Fuel Fill" to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-white/10 text-[11px] font-black uppercase tracking-wider text-zinc-400">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Odometer</th>
                  <th className="pb-3">Litres</th>
                  <th className="pb-3">Price/L</th>
                  <th className="pb-3">Total Cost</th>
                  <th className="pb-3">Calculated Mileage</th>
                  <th className="pb-3">Cost / Km</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                {entries.map((entry) => (
                  <tr key={entry._id} className="hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 font-bold text-zinc-900 dark:text-white whitespace-nowrap">
                      {new Date(entry.date).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 tabular-nums text-zinc-700 dark:text-zinc-300 font-medium">
                      {Number(entry.odometer).toLocaleString('en-IN')} km
                    </td>
                    <td className="py-3.5 tabular-nums font-bold text-zinc-900 dark:text-white">
                      {entry.litres} L
                    </td>
                    <td className="py-3.5 tabular-nums text-zinc-500">
                      ₹{entry.pricePerLitre}
                    </td>
                    <td className="py-3.5 tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{entry.totalAmount}
                    </td>
                    <td className="py-3.5">
                      {entry.mileage ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-black tabular-nums">
                          {entry.mileage.toFixed(1)} km/l
                        </span>
                      ) : (
                        <span className="text-zinc-400 italic">
                          {entry.isFullTank ? 'First fill' : 'Partial fill'}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 tabular-nums text-zinc-500 font-medium">
                      {entry.costPerKm ? `₹${entry.costPerKm.toFixed(2)}` : '--'}
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(entry._id)}
                        className="p-1 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-colors"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ParallaxCard>

      <FuelModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveFuel}
        activeVehicle={activeVehicle}
        defaultPrice={todayFuelPrice}
      />
    </div>
  );
};

export default FuelLogPage;

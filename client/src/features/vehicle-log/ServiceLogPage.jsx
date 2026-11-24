import React, { useState, useEffect } from 'react';
import { useVehicleLog } from './VehicleLogContext';
import Button from '../../components/Button';
import ParallaxCard from '../../components/parallax/ParallaxCard';
import ParallaxSection from '../../components/parallax/ParallaxSection';
import ServiceModal from './components/ServiceModal';
import api from '../../lib/api';
import { useToast } from '../../components/Toast';
import { Wrench, Plus, Calendar, Gauge, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const ServiceLogPage = () => {
  const { activeVehicle, refreshDetails } = useVehicleLog();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toast = useToast();

  const fetchServices = async () => {
    if (!activeVehicle) return;
    try {
      setLoading(true);
      const res = await api.get(`/vehicles/${activeVehicle._id}/services`);
      if (res.success && res.data) {
        setEntries(res.data.entries || []);
      }
    } catch {
      toast.error('Failed to load service entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [activeVehicle]);

  const handleSaveService = async (formData) => {
    try {
      const res = await api.post(`/vehicles/${activeVehicle._id}/services`, formData);
      if (res.success) {
        toast.success('Service log recorded!');
        await fetchServices();
        refreshDetails();
        return true;
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save service');
      return false;
    }
  };

  if (!activeVehicle) {
    return <div className="p-8 text-center text-zinc-500">Please select a vehicle first.</div>;
  }

  const latestService = entries[0];
  const nextDueKm = latestService?.nextDueOdometer;
  const kmRemaining = nextDueKm ? nextDueKm - (activeVehicle.currentOdometer || 0) : null;
  const isOverdue = kmRemaining !== null && kmRemaining <= 0;

  return (
    <div className="space-y-8">
      <ParallaxSection offset={15} speed={0.08}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white font-display flex items-center gap-2.5">
              <Wrench className="w-6 h-6 text-emerald-500" />
              <span>Service & Maintenance</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Keep your vehicle in prime mechanical condition with scheduled interval tracking.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => setIsModalOpen(true)}
            className="font-bold shadow-md shadow-emerald-500/20"
          >
            Log Service
          </Button>
        </div>
      </ParallaxSection>

      {/* Service Interval Progress Banner */}
      {nextDueKm && (
        <ParallaxCard depth={8} className="p-6 rounded-3xl bg-white/90 dark:bg-[#121217]/90 border border-zinc-200/90 dark:border-white/10 backdrop-blur-xl shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-emerald-500" />
              <h3 className="text-sm font-black text-zinc-900 dark:text-white font-display">
                Next Periodic Service Interval
              </h3>
            </div>
            <span
              className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                isOverdue
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              }`}
            >
              {isOverdue ? 'Service Overdue' : `${kmRemaining} km remaining`}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500 font-medium">
            <span>Current: {Number(activeVehicle.currentOdometer).toLocaleString('en-IN')} km</span>
            <span>Target: {Number(nextDueKm).toLocaleString('en-IN')} km</span>
          </div>
        </ParallaxCard>
      )}

      {/* Service Timeline */}
      <ParallaxCard depth={10} className="p-6 rounded-3xl bg-white/90 dark:bg-[#121217]/90 border border-zinc-200/90 dark:border-white/10 backdrop-blur-xl shadow-xl space-y-4">
        {entries.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 text-xs">
            No service records logged yet. Click "Log Service" to record past or current maintenance.
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((item) => (
              <div
                key={item._id}
                className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/60 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-zinc-900 dark:text-white capitalize">
                      {item.serviceType} Service
                    </span>
                    <span className="text-xs text-zinc-400">• {new Date(item.date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-zinc-500 font-medium">
                    At {Number(item.odometer).toLocaleString('en-IN')} km {item.workshop ? `• ${item.workshop}` : ''}
                  </p>
                  {item.notes && <p className="text-xs text-zinc-600 dark:text-zinc-400 pt-1">{item.notes}</p>}
                </div>

                <div className="text-right shrink-0">
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums font-display">
                    ₹{item.cost ? Number(item.cost).toLocaleString('en-IN') : '0'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </ParallaxCard>

      <ServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveService}
        activeVehicle={activeVehicle}
      />
    </div>
  );
};

export default ServiceLogPage;

import React, { useState, useEffect } from 'react';
import { useVehicleLog } from './VehicleLogContext';
import Button from '../../components/Button';
import ParallaxCard from '../../components/parallax/ParallaxCard';
import ParallaxSection from '../../components/parallax/ParallaxSection';
import DocumentModal from './components/DocumentModal';
import api from '../../lib/api';
import { useToast } from '../../components/Toast';
import { Shield, Plus, Calendar, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export const DocumentsPage = () => {
  const { activeVehicle } = useVehicleLog();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'urgent' | 'expired'
  const toast = useToast();

  const fetchDocs = async () => {
    if (!activeVehicle) return;
    try {
      setLoading(true);
      const res = await api.get(`/vehicles/${activeVehicle._id}/documents`);
      if (res.success && res.data) {
        setDocs(res.data);
      }
    } catch {
      toast.error('Failed to load vehicle documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [activeVehicle]);

  const handleSaveDoc = async (data) => {
    try {
      const res = await api.post(`/vehicles/${activeVehicle._id}/documents`, data);
      if (res.success) {
        toast.success('Document saved successfully!');
        await fetchDocs();
        return true;
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save document');
      return false;
    }
  };

  if (!activeVehicle) {
    return <div className="p-8 text-center text-zinc-500">Please select a vehicle first.</div>;
  }

  const filteredDocs = docs.filter((d) => {
    if (filter === 'expired') return d.urgency === 'expired';
    if (filter === 'urgent') return d.urgency === 'urgent' || d.urgency === 'warning';
    return true;
  });

  return (
    <div className="space-y-8">
      <ParallaxSection offset={15} speed={0.08}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white font-display flex items-center gap-2.5">
              <Shield className="w-6 h-6 text-emerald-500" />
              <span>Documents & Expiries</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Track Insurance, PUC, RC, and Road Tax with timely renewal warnings.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => setIsModalOpen(true)}
            className="font-bold shadow-md shadow-emerald-500/20"
          >
            Add Document
          </Button>
        </div>
      </ParallaxSection>

      {/* Filter Chips */}
      <div className="flex gap-2">
        {['all', 'urgent', 'expired'].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
              filter === t
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'bg-zinc-100 dark:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            {t === 'urgent' ? 'Expiring Soon' : t}
          </button>
        ))}
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDocs.map((doc) => {
          const isExp = doc.urgency === 'expired';
          const isUrg = doc.urgency === 'urgent' || doc.urgency === 'warning';

          return (
            <ParallaxCard
              key={doc._id}
              depth={8}
              className="p-5 rounded-3xl bg-white/90 dark:bg-[#121217]/90 border border-zinc-200/90 dark:border-white/10 backdrop-blur-xl shadow-lg space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-black text-zinc-900 dark:text-white capitalize font-display">
                    {doc.customName || doc.documentType.replace('_', ' ')}
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium">
                    {doc.issuer ? `${doc.issuer} • ` : ''}Policy #{doc.policyNumber || 'N/A'}
                  </p>
                </div>

                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                    isExp
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                      : isUrg
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  }`}
                >
                  {isExp
                    ? 'Expired'
                    : doc.daysRemaining !== undefined
                    ? `${doc.daysRemaining} days left`
                    : 'Valid'}
                </span>
              </div>

              <div className="pt-2 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between text-xs text-zinc-500">
                <span>Expires on: <strong className="text-zinc-900 dark:text-white">{new Date(doc.expiryDate).toLocaleDateString()}</strong></span>
                {doc.premiumAmount > 0 && (
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    Premium: ₹{doc.premiumAmount}
                  </span>
                )}
              </div>
            </ParallaxCard>
          );
        })}
      </div>

      <DocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveDoc}
        activeVehicle={activeVehicle}
      />
    </div>
  );
};

export default DocumentsPage;

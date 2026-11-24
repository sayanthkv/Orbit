import React, { useState, useEffect } from 'react';
import Modal from '../../../components/Modal';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import api from '../../../lib/api';
import { Fuel, Check, Wallet, Landmark } from 'lucide-react';

export const FuelModal = ({ isOpen, onClose, onSave, activeVehicle, defaultPrice = 102 }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    odometer: activeVehicle?.currentOdometer || '',
    litres: '',
    pricePerLitre: defaultPrice || 102,
    totalAmount: '',
    isFullTank: true,
    stationName: '',
    note: '',
    alsoRecordExpense: true,
    expenseSource: 'cash',
    expenseAccountId: '',
  });

  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (activeVehicle) {
      setFormData((prev) => ({
        ...prev,
        odometer: activeVehicle.currentOdometer || '',
        pricePerLitre: defaultPrice || prev.pricePerLitre,
      }));
    }
  }, [activeVehicle, defaultPrice]);

  useEffect(() => {
    // Fetch user accounts for expense linking
    if (isOpen) {
      api.get('/accounts').then((res) => {
        if (res.success && res.data?.accounts) {
          setAccounts(res.data.accounts);
          if (res.data.accounts.length > 0) {
            setFormData((prev) => ({ ...prev, expenseAccountId: res.data.accounts[0]._id }));
          }
        }
      }).catch(() => {});
    }
  }, [isOpen]);

  const handleLitresChange = (val) => {
    const l = val;
    const p = formData.pricePerLitre;
    const total = l && p ? (Number(l) * Number(p)).toFixed(2) : '';
    setFormData((prev) => ({ ...prev, litres: l, totalAmount: total }));
  };

  const handlePriceChange = (val) => {
    const p = val;
    const l = formData.litres;
    const total = l && p ? (Number(l) * Number(p)).toFixed(2) : '';
    setFormData((prev) => ({ ...prev, pricePerLitre: p, totalAmount: total }));
  };

  const handleTotalChange = (val) => {
    const t = val;
    const p = formData.pricePerLitre;
    const l = t && p && Number(p) > 0 ? (Number(t) / Number(p)).toFixed(2) : '';
    setFormData((prev) => ({ ...prev, totalAmount: t, litres: l }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.odometer) errs.odometer = 'Odometer reading is required';
    if (!formData.litres || Number(formData.litres) <= 0) errs.litres = 'Enter litres filled';
    if (!formData.pricePerLitre || Number(formData.pricePerLitre) <= 0) errs.pricePerLitre = 'Enter price per litre';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    const success = await onSave(formData);
    setIsLoading(false);
    if (success) {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Fuel Fill" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Date"
            type="date"
            required
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
          <Input
            label="Current Odometer (km)"
            type="number"
            placeholder="e.g. 18950"
            required
            value={formData.odometer}
            error={errors.odometer}
            onChange={(e) => setFormData({ ...formData, odometer: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Litres Filled"
            type="number"
            step="0.01"
            placeholder="25.5"
            required
            value={formData.litres}
            error={errors.litres}
            onChange={(e) => handleLitresChange(e.target.value)}
          />
          <Input
            label="Price / Litre (₹)"
            type="number"
            step="0.01"
            placeholder="102.50"
            required
            value={formData.pricePerLitre}
            error={errors.pricePerLitre}
            onChange={(e) => handlePriceChange(e.target.value)}
          />
          <Input
            label="Total Cost (₹)"
            type="number"
            step="0.01"
            placeholder="2613.75"
            required
            value={formData.totalAmount}
            onChange={(e) => handleTotalChange(e.target.value)}
          />
        </div>

        {/* Full Tank Toggle */}
        <div className="p-3.5 rounded-2xl bg-zinc-100/70 dark:bg-white/5 border border-zinc-200/70 dark:border-white/10 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-zinc-900 dark:text-white">Did you fill to full tank?</p>
            <p className="text-[11px] text-zinc-500">Required for accurate automatic mileage calculation.</p>
          </div>
          <button
            type="button"
            onClick={() => setFormData((p) => ({ ...p, isFullTank: !p.isFullTank }))}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              formData.isFullTank
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'bg-zinc-200 text-zinc-600 dark:bg-white/10 dark:text-zinc-400'
            }`}
          >
            {formData.isFullTank ? 'Yes (Full Tank)' : 'Partial Fill'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Fuel Station (Optional)"
            placeholder="e.g. IndianOil, Shell, BPCL"
            value={formData.stationName}
            onChange={(e) => setFormData({ ...formData, stationName: e.target.value })}
          />
          <Input
            label="Note (Optional)"
            placeholder="e.g. Highway trip refuel"
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          />
        </div>

        {/* Link with Expense Tracker Option */}
        <div className="p-3.5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.alsoRecordExpense}
              onChange={(e) => setFormData({ ...formData, alsoRecordExpense: e.target.checked })}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-zinc-300 dark:border-white/20"
            />
            <span className="text-xs font-bold text-zinc-900 dark:text-white">
              Also record as an expense in Expense Tracker
            </span>
          </label>

          {formData.alsoRecordExpense && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                  Paid From
                </label>
                <div className="flex rounded-xl bg-zinc-200/50 dark:bg-white/5 p-1 border border-zinc-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, expenseSource: 'cash' })}
                    className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all ${
                      formData.expenseSource === 'cash'
                        ? 'bg-white dark:bg-zinc-800 text-emerald-600 shadow-sm'
                        : 'text-zinc-500'
                    }`}
                  >
                    Cash in Hand
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, expenseSource: 'account' })}
                    className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all ${
                      formData.expenseSource === 'account'
                        ? 'bg-white dark:bg-zinc-800 text-emerald-600 shadow-sm'
                        : 'text-zinc-500'
                    }`}
                  >
                    Bank Account
                  </button>
                </div>
              </div>

              {formData.expenseSource === 'account' && (
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                    Select Bank Account
                  </label>
                  <select
                    value={formData.expenseAccountId}
                    onChange={(e) => setFormData({ ...formData, expenseAccountId: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#141418] text-xs text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
                  >
                    {accounts.map((acc) => (
                      <option key={acc._id} value={acc._id}>
                        {acc.bankName} - {acc.accountName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading} icon={Fuel}>
            Save Fuel Fill
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default FuelModal;

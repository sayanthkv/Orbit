import React, { useState } from 'react';
import Modal from '../../../components/Modal';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import { Wrench } from 'lucide-react';

export const ServiceModal = ({ isOpen, onClose, onSave, activeVehicle }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    odometer: activeVehicle?.currentOdometer || '',
    serviceType: 'regular',
    workshop: '',
    cost: '',
    notes: '',
    nextDueOdometer: (activeVehicle?.currentOdometer || 0) + 5000,
    nextDueDate: '',
    alsoRecordExpense: true,
    expenseSource: 'cash',
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const success = await onSave(formData);
    setIsLoading(false);
    if (success) onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Vehicle Service" size="md">
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
            label="Odometer (km)"
            type="number"
            required
            value={formData.odometer}
            onChange={(e) => setFormData({ ...formData, odometer: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5 font-display">
              Service Type
            </label>
            <select
              value={formData.serviceType}
              onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#141418] text-sm text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
            >
              <option value="regular">Periodic Maintenance</option>
              <option value="repair">Mechanical Repair</option>
              <option value="tyre">Tyre Replacement / Alignment</option>
              <option value="battery">Battery Service</option>
              <option value="inspection">General Inspection</option>
              <option value="other">Other</option>
            </select>
          </div>

          <Input
            label="Total Cost (₹)"
            type="number"
            placeholder="e.g. 4500"
            required
            value={formData.cost}
            onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
          />
        </div>

        <Input
          label="Workshop / Service Center Name"
          placeholder="e.g. Authorized Service Center, Popular Garage"
          value={formData.workshop}
          onChange={(e) => setFormData({ ...formData, workshop: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Next Service Due Odometer (km)"
            type="number"
            placeholder="e.g. 23500"
            value={formData.nextDueOdometer}
            onChange={(e) => setFormData({ ...formData, nextDueOdometer: e.target.value })}
          />
          <Input
            label="Next Service Due Date"
            type="date"
            value={formData.nextDueDate}
            onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
          />
        </div>

        <Input
          label="Notes & Parts Replaced"
          placeholder="Engine oil, oil filter, air filter, brake pad inspection"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />

        <div className="flex items-center justify-end gap-3 pt-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading} icon={Wrench}>
            Save Service Record
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ServiceModal;

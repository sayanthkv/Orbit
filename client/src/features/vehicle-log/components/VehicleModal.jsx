import React, { useState } from 'react';
import Modal from '../../../components/Modal';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import { Car, Bike, Shield, Calendar, Fuel } from 'lucide-react';

export const VehicleModal = ({ isOpen, onClose, onSave, initialData = null }) => {
  const [formData, setFormData] = useState({
    nickname: initialData?.nickname || '',
    type: initialData?.type || 'car',
    make: initialData?.make || '',
    model: initialData?.model || '',
    year: initialData?.year || new Date().getFullYear(),
    registrationNumber: initialData?.registrationNumber || '',
    fuelType: initialData?.fuelType || 'petrol',
    tankCapacity: initialData?.tankCapacity || '',
    currentOdometer: initialData?.currentOdometer || '',
    notes: initialData?.notes || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!formData.nickname.trim()) errs.nickname = 'Nickname is required';
    if (!formData.make.trim()) errs.make = 'Make is required';
    if (!formData.model.trim()) errs.model = 'Model is required';
    if (!formData.registrationNumber.trim()) errs.registrationNumber = 'Registration number is required';
    if (!formData.tankCapacity || Number(formData.tankCapacity) <= 0) {
      errs.tankCapacity = 'Valid tank capacity is required';
    }
    if (formData.currentOdometer === '' || Number(formData.currentOdometer) < 0) {
      errs.currentOdometer = 'Odometer reading is required';
    }
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Vehicle' : 'Add New Vehicle'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nickname / Display Name"
          placeholder="e.g. My City Cruiser, Beast, Commuter"
          required
          value={formData.nickname}
          error={errors.nickname}
          onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5 font-display">
              Vehicle Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#141418] text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="car">Car</option>
              <option value="bike">Motorcycle / Bike</option>
              <option value="scooter">Scooter</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5 font-display">
              Fuel Type
            </label>
            <select
              value={formData.fuelType}
              onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#141418] text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="petrol">Petrol</option>
              <option value="diesel">Diesel</option>
              <option value="CNG">CNG</option>
              <option value="electric">Electric (EV)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Make / Brand"
            placeholder="e.g. Honda, Hyundai, Tata"
            required
            value={formData.make}
            error={errors.make}
            onChange={(e) => setFormData({ ...formData, make: e.target.value })}
          />
          <Input
            label="Model"
            placeholder="e.g. City, Creta, Activa"
            required
            value={formData.model}
            error={errors.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Registration / Number Plate"
            placeholder="e.g. KL 07 CA 1234"
            required
            value={formData.registrationNumber}
            error={errors.registrationNumber}
            onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value.toUpperCase() })}
          />
          <Input
            label="Manufacturing Year"
            type="number"
            min="1970"
            max={new Date().getFullYear() + 2}
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label={formData.fuelType === 'electric' ? 'Battery Capacity (kWh)' : 'Tank Capacity (Litres)'}
            type="number"
            step="0.1"
            placeholder={formData.fuelType === 'bike' ? '12' : '45'}
            required
            value={formData.tankCapacity}
            error={errors.tankCapacity}
            onChange={(e) => setFormData({ ...formData, tankCapacity: e.target.value })}
          />
          <Input
            label="Current Odometer (km)"
            type="number"
            placeholder="e.g. 18500"
            required
            value={formData.currentOdometer}
            error={errors.currentOdometer}
            onChange={(e) => setFormData({ ...formData, currentOdometer: e.target.value })}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {initialData ? 'Save Changes' : 'Add Vehicle'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default VehicleModal;

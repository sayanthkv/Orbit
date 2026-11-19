import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { Target, Check } from 'lucide-react';

const PRESET_COLORS = [
  '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6',
  '#EC4899', '#F97316', '#EAB308', '#14B8A6'
];

export const GoalFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isLoading = false,
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    color: '#10B981',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        targetAmount: initialData.targetAmount || '',
        currentAmount: initialData.currentAmount || 0,
        targetDate: initialData.targetDate
          ? new Date(initialData.targetDate).toISOString().split('T')[0]
          : '',
        color: initialData.color || '#10B981',
      });
    } else {
      setFormData({
        title: '',
        targetAmount: '',
        currentAmount: 0,
        targetDate: '',
        color: '#10B981',
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = 'Goal title is required';
    if (!formData.targetAmount || Number(formData.targetAmount) <= 0) {
      errs.targetAmount = 'Please enter a target amount greater than 0';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...formData,
      targetAmount: Number(formData.targetAmount),
      currentAmount: Number(formData.currentAmount || 0),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Savings Goal' : 'Create Savings Target'}
      description="Plan for vacations, emergency savings, devices, or investments"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Goal Title"
          placeholder="e.g. Emergency Fund, MacBook Pro, Trip to Japan"
          required
          error={errors.title}
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label={`Target Amount (${user?.currency || 'INR'})`}
            type="number"
            min="1"
            required
            error={errors.targetAmount}
            value={formData.targetAmount}
            onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
          />

          <Input
            label={`Current Saved (${user?.currency || 'INR'})`}
            type="number"
            min="0"
            value={formData.currentAmount}
            onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
          />
        </div>

        <Input
          label="Target Date (Optional)"
          type="date"
          value={formData.targetDate}
          onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
        />

        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
            Target Theme Color
          </label>
          <div className="flex gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setFormData({ ...formData, color: c })}
                className={`w-7 h-7 rounded-xl flex items-center justify-center transition-transform hover:scale-110 ${
                  formData.color === c ? 'ring-2 ring-offset-2 ring-emerald-500 scale-105' : ''
                }`}
                style={{ backgroundColor: c }}
              >
                {formData.color === c && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" size="md" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" size="md" isLoading={isLoading} icon={Target}>
            {initialData ? 'Save Changes' : 'Create Goal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default GoalFormModal;

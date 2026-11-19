import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { AVAILABLE_ICONS, getCategoryIcon } from '../../utils/iconMap';
import { Plus, Check, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

const PRESET_COLORS = [
  '#10B981', '#059669', '#06B6D4', '#3B82F6',
  '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E',
  '#F97316', '#EAB308', '#14B8A6', '#64748B',
];

export const CategoryFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
    color: '#10B981',
    icon: 'Tag',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        type: initialData.type || 'expense',
        color: initialData.color || '#10B981',
        icon: initialData.icon || 'Tag',
      });
    } else {
      setFormData({
        name: '',
        type: 'expense',
        color: '#10B981',
        icon: 'Tag',
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'Category name is required';
    } else if (formData.name.trim().length < 2) {
      errs.name = 'Category name must be at least 2 characters';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Category' : 'Create Custom Category'}
      description="Organize your expenses and income with your own tags"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: 'expense' })}
            className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
              formData.type === 'expense'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" />
            Expense Category
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: 'income' })}
            className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
              formData.type === 'income'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" />
            Income Category
          </button>
        </div>

        <Input
          label="Category Name"
          placeholder="e.g. Subscriptions, Groceries, Pet Care"
          required
          value={formData.name}
          error={errors.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />

        {/* Color Palette Picker */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
            Accent Color
          </label>
          <div className="flex flex-wrap gap-2">
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

        {/* Icon Grid Picker */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
            Select Icon
          </label>
          <div className="grid grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-850">
            {AVAILABLE_ICONS.map((iconName) => (
              <button
                type="button"
                key={iconName}
                onClick={() => setFormData({ ...formData, icon: iconName })}
                className={`p-2 rounded-xl flex items-center justify-center transition-colors ${
                  formData.icon === iconName
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
                title={iconName}
              >
                {getCategoryIcon(iconName, 'w-4 h-4')}
              </button>
            ))}
          </div>
        </div>

        {/* Live Preview */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: `${formData.color}20`,
              color: formData.color,
            }}
          >
            {getCategoryIcon(formData.icon, 'w-5 h-5')}
          </div>
          <div>
            <span className="text-xs text-slate-400">Preview:</span>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {formData.name || 'Category Name'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" size="md" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="md"
            isLoading={isLoading}
            icon={initialData ? Check : Plus}
          >
            {initialData ? 'Save Changes' : 'Create Category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CategoryFormModal;

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
        <div className="flex p-1.5 bg-zinc-100 border border-zinc-200/80 rounded-full gap-1 dark:bg-[#1c1c20] dark:border-white/8 transition-colors">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: 'expense' })}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              formData.type === 'expense'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-500 dark:hover:text-zinc-200'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" />
            Expense
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: 'income' })}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              formData.type === 'income'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-500 dark:hover:text-zinc-200'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" />
            Income
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
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider block mb-2">
            Accent Color
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setFormData({ ...formData, color: c })}
                className={`w-7 h-7 rounded-xl flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${
                  formData.color === c ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#131315] ring-zinc-900 dark:ring-white scale-105' : ''
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
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider block mb-2">
            Select Icon
          </label>
          <div className="grid grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1 border border-zinc-200 bg-zinc-50 rounded-xl dark:border-white/8 dark:bg-[#1c1c20]">
            {AVAILABLE_ICONS.map((iconName) => (
              <button
                type="button"
                key={iconName}
                onClick={() => setFormData({ ...formData, icon: iconName })}
                className={`p-2 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                  formData.icon === iconName
                    ? 'bg-zinc-900 text-white shadow-xs dark:bg-white dark:text-zinc-950 dark:shadow-sm'
                    : 'text-zinc-600 hover:bg-zinc-200/60 dark:text-zinc-500 dark:hover:bg-white/8 dark:hover:text-zinc-200'
                }`}
                title={iconName}
              >
                {getCategoryIcon(iconName, 'w-4 h-4')}
              </button>
            ))}
          </div>
        </div>

        {/* Live Preview */}
        <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200/80 dark:bg-white/[0.03] dark:border-white/8 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs"
            style={{
              backgroundColor: `${formData.color}20`,
              color: formData.color,
            }}
          >
            {getCategoryIcon(formData.icon, 'w-5 h-5')}
          </div>
          <div>
            <span className="text-xs text-zinc-500">Preview:</span>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">
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

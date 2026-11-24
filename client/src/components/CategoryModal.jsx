import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
import api from '../lib/api';
import { useToast } from './Toast';
import { Tag, Plus, Trash2, Eye, EyeOff, AlertTriangle } from 'lucide-react';

const PRESET_COLORS = [
  '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6',
  '#ec4899', '#f43f5e', '#f97316', '#eab308', '#64748b'
];

export const CategoryModal = ({ isOpen, onClose, onCategoriesUpdated }) => {
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('expense');
  const [isLoading, setIsLoading] = useState(false);

  // New category state
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#10b981');

  // Deletion reassignment state
  const [deletingCat, setDeletingCat] = useState(null);
  const [reassignTarget, setReassignTarget] = useState('');

  const toast = useToast();

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/categories?includeHidden=true');
      if (res.success && res.data?.categories) {
        setCategories(res.data.categories);
      }
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      setIsAdding(false);
      setDeletingCat(null);
    }
  }, [isOpen]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      const res = await api.post('/categories', {
        name: newName.trim(),
        type: activeTab,
        color: newColor,
        icon: 'Tag',
      });
      if (res.success) {
        toast.success(`Category "${newName.trim()}" created!`);
        setNewName('');
        setIsAdding(false);
        fetchCategories();
        onCategoriesUpdated?.();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create category');
    }
  };

  const handleToggleHide = async (cat) => {
    try {
      const res = await api.put(`/categories/${cat._id}`, {
        isHidden: !cat.isHidden,
      });
      if (res.success) {
        toast.info(`Category "${cat.name}" is now ${!cat.isHidden ? 'hidden' : 'visible'}.`);
        fetchCategories();
        onCategoriesUpdated?.();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update category');
    }
  };

  const handleDelete = async (cat, replacement = null) => {
    try {
      const payload = replacement ? { reassignTo: replacement } : {};
      const res = await api.delete(`/categories/${cat._id}`, { data: payload });
      if (res.success) {
        toast.success(res.message || 'Category deleted');
        setDeletingCat(null);
        fetchCategories();
        onCategoriesUpdated?.();
      }
    } catch (err) {
      if (err.requiresReassignment) {
        setDeletingCat(cat);
      } else {
        toast.error(err.message || 'Failed to delete category');
      }
    }
  };

  const filteredCategories = categories.filter((c) => c.type === activeTab);
  const eligibleReplacements = filteredCategories.filter(
    (c) => deletingCat && c._id !== deletingCat._id && !c.isHidden
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Categories"
      description="Create custom categories or reassign and clean up defaults"
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        {/* Type Selector Tabs */}
        <div className="flex p-1 bg-zinc-100 dark:bg-white/5 rounded-xl">
          <button
            type="button"
            onClick={() => { setActiveTab('expense'); setIsAdding(false); }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'expense'
                ? 'bg-white dark:bg-[#18181b] text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Expense Categories
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('income'); setIsAdding(false); }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'income'
                ? 'bg-white dark:bg-[#18181b] text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Income Categories
          </button>
        </div>

        {/* Add New Category Button / Inline Form */}
        {!isAdding ? (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="w-full py-2.5 px-3 border border-dashed border-zinc-300 dark:border-white/10 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/5 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create New {activeTab === 'income' ? 'Income' : 'Expense'} Category</span>
          </button>
        ) : (
          <form onSubmit={handleCreate} className="p-3.5 bg-zinc-50 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
              New {activeTab === 'income' ? 'Income' : 'Expense'} Category
            </h4>
            <Input
              placeholder="e.g. Subscriptions, Groceries, Pet Care"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              autoFocus
            />
            <div>
              <label className="block text-[11px] font-bold text-zinc-500 mb-1.5">Color Accent</label>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      newColor === c ? 'scale-125 ring-2 ring-zinc-900 dark:ring-white ring-offset-2' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Category
              </Button>
            </div>
          </form>
        )}

        {/* Reassignment Warning Modal Dialog */}
        {deletingCat && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-rose-700 dark:text-rose-300">
                  Reassign Records for "{deletingCat.name}"
                </h5>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                  This category has existing transactions or budgets. Select a replacement category to migrate them to:
                </p>
              </div>
            </div>
            <select
              value={reassignTarget}
              onChange={(e) => setReassignTarget(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-white/10 font-medium"
            >
              <option value="">-- Choose replacement category --</option>
              {eligibleReplacements.map((c) => (
                <option key={c._id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setDeletingCat(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                disabled={!reassignTarget}
                onClick={() => handleDelete(deletingCat, reassignTarget)}
              >
                Reassign & Delete
              </Button>
            </div>
          </div>
        )}

        {/* Categories List */}
        <div className="space-y-1.5 max-h-72 overflow-y-auto no-scrollbar pt-1">
          {filteredCategories.map((cat) => (
            <div
              key={cat._id}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                cat.isHidden
                  ? 'bg-zinc-100/50 dark:bg-white/2 border-zinc-200/40 opacity-60'
                  : 'bg-white dark:bg-[#141418] border-zinc-200/80 dark:border-white/8'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: cat.color || '#10b981' }}
                />
                <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                  {cat.name}
                </span>
                {cat.isDefault && (
                  <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-white/10 text-zinc-500">
                    System
                  </span>
                )}
                {cat.isHidden && (
                  <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    Hidden
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {/* Hide / Unhide button */}
                <button
                  type="button"
                  onClick={() => handleToggleHide(cat)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
                  title={cat.isHidden ? 'Unhide category' : 'Hide category'}
                >
                  {cat.isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>

                {/* Delete button (only custom categories) */}
                {!cat.isDefault && (
                  <button
                    type="button"
                    onClick={() => handleDelete(cat)}
                    className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-500/10 transition-colors"
                    title="Delete custom category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default CategoryModal;

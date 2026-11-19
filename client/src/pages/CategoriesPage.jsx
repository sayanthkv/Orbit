import React, { useState, useEffect } from 'react';
import { categoryApi } from '../api/categoryApi';
import { useToast } from '../context/ToastContext';
import { getCategoryIcon } from '../utils/iconMap';
import Button from '../components/common/Button';
import CategoryFormModal from '../components/categories/CategoryFormModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { Skeleton } from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import { Plus, Edit2, Trash2, ShieldCheck, Tag } from 'lucide-react';

export const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all, expense, income
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await categoryApi.getCategories();
      if (res.success) {
        setCategories(res.data);
      }
    } catch (err) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      if (editingCategory) {
        const res = await categoryApi.updateCategory(editingCategory._id, formData);
        if (res.success) {
          toast.success('Category updated successfully!');
          setIsModalOpen(false);
          fetchCategories();
          window.dispatchEvent(new CustomEvent('orbit:categories-updated'));
        }
      } else {
        const res = await categoryApi.createCategory(formData);
        if (res.success) {
          toast.success('Category created successfully!');
          setIsModalOpen(false);
          fetchCategories();
          window.dispatchEvent(new CustomEvent('orbit:categories-updated'));
        }
      }
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    try {
      setIsDeleting(true);
      const res = await categoryApi.deleteCategory(deletingCategory._id);
      if (res.success) {
        toast.success('Category removed successfully.');
        setDeletingCategory(null);
        fetchCategories();
        window.dispatchEvent(new CustomEvent('orbit:categories-updated'));
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete category');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCategories = categories.filter((c) => {
    if (activeTab === 'expense') return c.type === 'expense';
    if (activeTab === 'income') return c.type === 'income';
    return true;
  });

  const defaultCategories = filteredCategories.filter((c) => c.isDefault);
  const customCategories = filteredCategories.filter((c) => !c.isDefault);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Category Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse default spending categories and create custom categories
          </p>
        </div>

        <Button onClick={handleOpenCreate} icon={Plus} size="md">
          New Category
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl w-fit">
        {[
          { key: 'all', label: 'All Categories' },
          { key: 'expense', label: 'Expenses' },
          { key: 'income', label: 'Income' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab.key
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Custom Categories Section */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Custom Categories ({customCategories.length})
              </h2>
            </div>

            {customCategories.length === 0 ? (
              <EmptyState
                icon={Tag}
                title="No custom categories yet"
                description="Create your own custom tags to match your unique spending habits."
                actionLabel="Create First Category"
                onAction={handleOpenCreate}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {customCategories.map((cat) => (
                  <div
                    key={cat._id}
                    className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                        style={{
                          backgroundColor: `${cat.color}20`,
                          color: cat.color,
                        }}
                      >
                        {getCategoryIcon(cat.icon, 'w-5 h-5')}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                          {cat.name}
                        </h4>
                        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                          {cat.type}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Edit category"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingCategory(cat)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* System Default Categories Section */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                System Default Categories ({defaultCategories.length})
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" /> Default
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {defaultCategories.map((cat) => (
                <div
                  key={cat._id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-white/70 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${cat.color}15`,
                        color: cat.color,
                      }}
                    >
                      {getCategoryIcon(cat.icon, 'w-5 h-5')}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {cat.name}
                      </h4>
                      <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                        {cat.type}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">Standard</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Category Modal */}
      <CategoryFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={editingCategory}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingCategory}
        title={`Delete "${deletingCategory?.name}"?`}
        message="Are you sure you want to delete this custom category? If there are transactions linked to it, deletion will be safely prevented."
        confirmText="Delete Category"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingCategory(null)}
      />
    </div>
  );
};

export default CategoriesPage;

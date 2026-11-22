import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import BottomNav from './BottomNav';
import TransactionFormModal from '../transactions/TransactionFormModal';
import { categoryApi } from '../../api/categoryApi';
import { transactionApi } from '../../api/transactionApi';
import { useToast } from '../../context/ToastContext';

export const AppLayout = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const fetchCategories = async () => {
    try {
      const res = await categoryApi.getCategories();
      if (res.success) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error('Failed to load categories for quick transaction modal', err);
    }
  };

  useEffect(() => {
    fetchCategories();

    const handleGlobalOpen = () => {
      setIsAddModalOpen(true);
    };

    const handleCategoriesUpdated = () => {
      fetchCategories();
    };

    window.addEventListener('orbit:open-add-transaction', handleGlobalOpen);
    window.addEventListener('orbit:categories-updated', handleCategoriesUpdated);

    return () => {
      window.removeEventListener('orbit:open-add-transaction', handleGlobalOpen);
      window.removeEventListener('orbit:categories-updated', handleCategoriesUpdated);
    };
  }, []);

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  const handleCreateTransaction = async (formData) => {
    try {
      setIsSubmitting(true);
      const res = await transactionApi.createTransaction(formData);
      if (res.success) {
        toast.success(res.message || 'Transaction recorded successfully!');
        setIsAddModalOpen(false);
        window.dispatchEvent(
          new CustomEvent('orbit:transaction-created', { detail: res.data })
        );
      }
    } catch (err) {
      toast.error(err.message || 'Failed to record transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-[#09090b] dark:text-[#f4f4f5] relative overflow-x-hidden flex flex-col selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-black transition-colors duration-150">
      {/* Top subtle spotlight beam for dark mode */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] max-w-[100vw] h-[450px] pointer-events-none opacity-0 dark:opacity-100 transition-opacity duration-300"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.04) 45%, transparent 75%)',
        }}
      />
      {/* Soft warm/clean gradient for light mode */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] max-w-[100vw] h-[350px] pointer-events-none dark:opacity-0 transition-opacity duration-300"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(16, 185, 129, 0.05) 0%, rgba(0, 0, 0, 0.02) 50%, transparent 80%)',
        }}
      />

      {/* Floating Capsule Navbar */}
      <Navbar onOpenAddModal={handleOpenAddModal} />

      {/* Main Page Content */}
      <main className="flex-1 p-3.5 sm:p-6 md:p-8 max-w-5xl w-full mx-auto pb-28 md:pb-12 animate-fade-in">
        <Outlet />
      </main>

      {/* Mobile Floating Bottom Navigation */}
      <BottomNav onOpenAddModal={handleOpenAddModal} />

      {/* Global Quick Add Transaction Modal */}
      <TransactionFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateTransaction}
        categories={categories}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default AppLayout;

import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';
import MobileDrawer from './MobileDrawer';
import TransactionFormModal from '../transactions/TransactionFormModal';
import { categoryApi } from '../../api/categoryApi';
import { transactionApi } from '../../api/transactionApi';
import { useToast } from '../../context/ToastContext';

export const AppLayout = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
        // Dispatch global notification so active pages reload their data
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
    <div className="flex min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Desktop Sidebar */}
      <Sidebar onOpenAddModal={handleOpenAddModal} />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        <Header
          onOpenAddModal={handleOpenAddModal}
          onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        onOpenAddModal={handleOpenAddModal}
        onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
      />

      {/* Mobile Slide-Over Drawer */}
      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onOpenAddModal={handleOpenAddModal}
      />

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

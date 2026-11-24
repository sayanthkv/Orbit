import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'max-w-lg',
  footer = null,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('orbit-modal-open');
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      // Check if other dialogs are still active before removing modal open class
      const otherModals = document.querySelectorAll('[role="dialog"]');
      if (otherModals.length <= 1) {
        document.body.style.overflow = 'unset';
        document.body.classList.remove('orbit-modal-open');
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[999999] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Panel */}
          <motion.div
            initial={{ y: '100%', opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className={`relative bg-white dark:bg-[#141418] border-t sm:border border-zinc-200 dark:border-white/10 rounded-t-[28px] sm:rounded-2xl w-full ${maxWidth} max-h-[92dvh] sm:max-h-[88vh] flex flex-col shadow-2xl overflow-hidden z-10`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Pill */}
            <div className="w-12 h-1.5 bg-zinc-300 dark:bg-white/20 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-100 dark:border-white/8 shrink-0 bg-white dark:bg-[#141418]">
              <div className="pr-4 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight truncate font-display">
                  {title}
                </h3>
                {description && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1 font-medium">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer shrink-0"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 overscroll-contain">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="shrink-0 p-4 sm:p-5 border-t border-zinc-100 dark:border-white/8 bg-zinc-50/60 dark:bg-[#111115] pb-[max(1rem,env(safe-area-inset-bottom))]">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};

export default Modal;

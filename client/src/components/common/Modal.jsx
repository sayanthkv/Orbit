import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'max-w-lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/75 dark:bg-black/85 backdrop-blur-md p-3 sm:p-6 transition-all duration-300 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="min-h-full flex items-center justify-center py-2 sm:py-6">
        <div
          className={`relative bg-white dark:bg-[#141418] border border-zinc-200/90 dark:border-white/12 rounded-[28px] w-full ${maxWidth} p-5 sm:p-7 shadow-[0_25px_70px_rgba(0,0,0,0.55)] dark:shadow-[0_25px_80px_rgba(0,0,0,0.95)] animate-scale-up my-auto transition-all max-h-[calc(100vh-2.5rem)] flex flex-col`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-start justify-between pb-4 border-b border-zinc-100 dark:border-white/8 shrink-0">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                {title}
              </h3>
              {description && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:text-zinc-500 dark:hover:text-white dark:hover:bg-white/8 rounded-xl transition-colors cursor-pointer shrink-0 ml-3"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body - Scrollable if content exceeds screen height */}
          <div className="mt-4 overflow-y-auto pr-1 no-scrollbar flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;

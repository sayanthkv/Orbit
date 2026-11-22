import React, { useEffect } from 'react';
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`relative bg-white dark:bg-[#141418] border-t sm:border border-zinc-200/90 dark:border-white/12 rounded-t-[32px] sm:rounded-[28px] w-full ${maxWidth} max-h-[92dvh] sm:max-h-[88vh] flex flex-col shadow-[0_25px_80px_rgba(0,0,0,0.85)] animate-slide-up sm:animate-scale-up transition-all overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag / Grab Handle Indicator */}
        <div className="w-12 h-1.5 bg-zinc-300 dark:bg-white/20 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 pb-3 sm:pb-4 border-b border-zinc-100 dark:border-white/8 shrink-0 bg-white dark:bg-[#141418]">
          <div className="pr-4 min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight truncate">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium line-clamp-1 sm:line-clamp-2">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-4 sm:p-6 pt-3 sm:pt-4 overflow-y-auto flex-1 min-h-0 overscroll-contain">
          {children}
        </div>

        {/* Optional Sticky Footer */}
        {footer && (
          <div className="shrink-0 p-4 sm:p-5 border-t border-zinc-100 dark:border-white/8 bg-zinc-50/90 dark:bg-[#16161c]/90 backdrop-blur-md pb-[max(1rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;

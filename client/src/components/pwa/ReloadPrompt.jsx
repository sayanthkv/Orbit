import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Sparkles, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ReloadPrompt = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        // Periodic check for SW update every 60 minutes
        setInterval(() => {
          r.update().catch(() => {});
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.warn('SW registration error:', error);
    },
  });

  const handleRefresh = () => {
    // Check if user is currently filling out a form or in a modal
    const isModalOpen = document.body.classList.contains('orbit-modal-open');
    const isInputActive = ['INPUT', 'TEXTAREA', 'SELECT'].includes(
      document.activeElement?.tagName || ''
    );

    if (isModalOpen || isInputActive) {
      const confirmUpdate = window.confirm(
        'A new version of Orbit is ready. Reload now? Any unsaved changes in open forms may be lost.'
      );
      if (!confirmUpdate) return;
    }

    updateServiceWorker(true);
  };

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="fixed bottom-6 left-3 md:left-6 z-50 max-w-sm w-[calc(100%-1.5rem)] md:w-auto"
        >
          <div className="bg-zinc-900/95 dark:bg-[#141418]/95 border border-emerald-500/30 rounded-2xl p-4 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold font-display truncate">
                  Update Available
                </h4>
                <p className="text-[11px] text-zinc-400 truncate">
                  New version of Orbit is ready
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleRefresh}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
              <button
                type="button"
                onClick={() => setNeedRefresh(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReloadPrompt;

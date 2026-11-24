import React, { useState, useEffect } from 'react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { WifiOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const OfflineBanner = () => {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowRestored(true);
      const timer = setTimeout(() => {
        setShowRestored(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          key="offline"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed top-2 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-zinc-900/90 dark:bg-zinc-800/95 border border-zinc-700/80 shadow-2xl backdrop-blur-xl text-xs font-semibold text-zinc-100 max-w-md pointer-events-none"
        >
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="truncate">You're offline, showing last synced data</span>
        </motion.div>
      )}

      {isOnline && showRestored && (
        <motion.div
          key="restored"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed top-2 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-950/90 border border-emerald-500/40 shadow-2xl backdrop-blur-xl text-xs font-semibold text-emerald-200 max-w-md pointer-events-none"
        >
          <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin shrink-0" />
          <span>Back online — synced with Orbit cloud</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineBanner;

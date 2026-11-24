import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import Button from '../Button';

export const OfflineFallback = ({ onRetry }) => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-3xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-400 mb-4 shadow-sm">
        <WifiOff className="w-8 h-8 text-amber-500" />
      </div>
      <h2 className="text-lg font-black text-zinc-900 dark:text-white font-display">
        You're Offline
      </h2>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mt-1.5 mb-6">
        This view hasn't been cached locally yet. Reconnect to the internet to load and sync it.
      </p>
      <Button
        variant="primary"
        icon={RefreshCw}
        onClick={() => {
          if (onRetry) onRetry();
          else window.location.reload();
        }}
      >
        Retry Connection
      </Button>
    </div>
  );
};

export default OfflineFallback;

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-24 md:bottom-6 right-4 left-4 md:left-auto md:w-96 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto flex items-center justify-between p-4 rounded-2xl shadow-xl border backdrop-blur-xl transition-all duration-300 animate-slide-in ${
              item.type === 'success'
                ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900 dark:bg-[#111113]/95 dark:border-emerald-500/30 dark:text-emerald-300'
                : item.type === 'error'
                ? 'bg-rose-50/95 border-rose-200 text-rose-900 dark:bg-[#111113]/95 dark:border-rose-500/30 dark:text-rose-300'
                : item.type === 'warning'
                ? 'bg-amber-50/95 border-amber-200 text-amber-900 dark:bg-[#111113]/95 dark:border-amber-500/30 dark:text-amber-300'
                : 'bg-white/95 border-zinc-200 text-zinc-900 dark:bg-[#111113]/95 dark:border-white/12 dark:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {item.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
              {item.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />}
              {item.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />}
              {item.type === 'info' && <Info className="w-4 h-4 text-blue-600 dark:text-zinc-400 shrink-0" />}
              <p className="text-sm font-medium">{item.message}</p>
            </div>
            <button
              onClick={() => removeToast(item.id)}
              className="p-1 text-zinc-400 hover:text-zinc-700 dark:text-zinc-600 dark:hover:text-white transition-colors rounded-lg cursor-pointer ml-2"
              aria-label="Dismiss toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastProvider;

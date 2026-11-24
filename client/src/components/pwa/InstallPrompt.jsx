import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X, Smartphone, Check } from 'lucide-react';
import Button from '../Button';
import Modal from '../Modal';
import { motion, AnimatePresence } from 'framer-motion';

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // 1. Detect if running in standalone mode (already installed)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;
      setIsStandalone(isStandaloneMode);
      return isStandaloneMode;
    };

    if (checkStandalone()) return;

    // 2. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !window.MSStream;
    setIsIOS(isIosDevice);

    // 3. Track session count (increment only once per browser session via sessionStorage)
    try {
      const sessionMarked = sessionStorage.getItem('orbit_session_marked');
      let sessionCount = parseInt(localStorage.getItem('orbit_session_count') || '0', 10);
      if (!sessionMarked) {
        sessionCount += 1;
        localStorage.setItem('orbit_session_count', sessionCount.toString());
        sessionStorage.setItem('orbit_session_marked', 'true');
      }

      // Check dismissal expiration (14 days)
      const dismissedUntil = localStorage.getItem('orbit_install_dismissed_until');
      const isDismissed = dismissedUntil && Date.now() < parseInt(dismissedUntil, 10);

      // Show automatic banner on/after 2nd session if not dismissed
      if (sessionCount >= 2 && !isDismissed) {
        setShowBanner(true);
      }
    } catch {}

    // 4. Capture beforeinstallprompt event (Android / Chromium)
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      window.__orbitDeferredInstallPrompt = e;
      window.dispatchEvent(new CustomEvent('orbit:can-install'));
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setShowBanner(false);
      setDeferredPrompt(null);
      window.__orbitDeferredInstallPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      setShowBanner(false);
      return;
    }

    const promptEvent = deferredPrompt || window.__orbitDeferredInstallPrompt;
    if (!promptEvent) {
      return;
    }

    try {
      promptEvent.prompt();
      const choiceResult = await promptEvent.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
      window.__orbitDeferredInstallPrompt = null;
    } catch (err) {
      console.warn('Install prompt error:', err);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Dismiss for 14 days
    const fourteenDays = Date.now() + 14 * 24 * 60 * 60 * 1000;
    try {
      localStorage.setItem('orbit_install_dismissed_until', fourteenDays.toString());
    } catch {}
  };

  if (isStandalone) return null;

  return (
    <>
      {/* Tasteful Unobtrusive Install Banner (Shown after 2nd session) */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-20 md:bottom-6 right-3 md:right-6 z-50 max-w-sm w-[calc(100%-1.5rem)] md:w-auto"
          >
            <div className="bg-white/95 dark:bg-[#141418]/95 border border-zinc-200/90 dark:border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white font-display truncate">
                    Install Orbit App
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                    Instant access & offline tools
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleInstallClick}
                  className="text-xs font-bold px-3 py-1.5"
                >
                  Install
                </Button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  title="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Safari Instruction Modal Sheet */}
      <Modal
        isOpen={showIOSModal}
        onClose={() => setShowIOSModal(false)}
        title="Install Orbit on iOS"
        description="Add Orbit to your home screen for native fullscreen experience"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4 py-1">
          <div className="space-y-3">
            <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold text-xs">
                1
              </div>
              <div className="text-xs">
                <p className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  Tap the Share button
                  <Share className="w-4 h-4 text-emerald-600 dark:text-emerald-400 inline" />
                </p>
                <p className="text-zinc-500 mt-0.5">
                  Located in the bottom toolbar of Safari on iPhone (or top right on iPad).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold text-xs">
                2
              </div>
              <div className="text-xs">
                <p className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  Scroll and tap 'Add to Home Screen'
                  <PlusSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 inline" />
                </p>
                <p className="text-zinc-500 mt-0.5">
                  Choose the option with the plus icon in the share menu sheet.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold text-xs">
                3
              </div>
              <div className="text-xs">
                <p className="font-bold text-zinc-900 dark:text-white">
                  Confirm by tapping 'Add'
                </p>
                <p className="text-zinc-500 mt-0.5">
                  Orbit will appear on your home screen like any native mobile app.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button
              variant="primary"
              className="w-full font-bold"
              onClick={() => setShowIOSModal(false)}
            >
              Got it
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default InstallPrompt;

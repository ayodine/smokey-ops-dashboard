import React, { useEffect, useState } from 'react';
import {
  subscribePwaInstall,
  promptPwaInstall,
  isStandalonePwa,
  isIosDevice,
} from '../../lib/registerServiceWorker';
import { Smartphone, Download, X, Share, PlusSquare } from 'lucide-react';

const DISMISSED_STORAGE_KEY = 'smokey_pwa_install_dismissed_at';

export const PwaInstallPrompt: React.FC = () => {
  const [canInstall, setCanInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  useEffect(() => {
    // Strictly restrict to mobile screen viewports (< 768px)
    const checkMobile = () => {
      if (typeof window === 'undefined') return;
      setIsMobileScreen(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Check if running as standalone PWA
    const standalone = isStandalonePwa();
    setIsStandalone(standalone);
    if (standalone) return;

    // Check if dismissed recently (within 3 days)
    const dismissedAt = localStorage.getItem(DISMISSED_STORAGE_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10);
      if (elapsed < 3 * 24 * 60 * 60 * 1000) {
        setIsDismissed(true);
      }
    }

    setIsIos(isIosDevice());

    const unsubscribe = subscribePwaInstall((available) => {
      setCanInstall(available);
    });

    return () => {
      window.removeEventListener('resize', checkMobile);
      unsubscribe();
    };
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(DISMISSED_STORAGE_KEY, Date.now().toString());
  };

  const handleInstallClick = async () => {
    if (canInstall) {
      const outcome = await promptPwaInstall();
      if (outcome === 'accepted') {
        setIsDismissed(true);
      }
    } else if (isIos) {
      setShowIosGuide(true);
    }
  };

  // Only visible on mobile screens, strictly excluded on desktop
  if (!isMobileScreen || isStandalone || isDismissed) {
    return null;
  }

  // Show if either native prompt is ready OR on iOS mobile browser
  if (!canInstall && !isIos) {
    return null;
  }

  return (
    <>
      <div className="md:hidden fixed bottom-20 left-3 right-3 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700/60 p-4 backdrop-blur-md">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#c0201f] text-white flex items-center justify-center shrink-0 shadow-md">
              <Smartphone className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold tracking-tight text-white truncate">
                  Install SmokeyOps App
                </h4>
                <button
                  onClick={handleDismiss}
                  className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors -mr-1"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Add to your home screen for instantaneous 1-tap dispatch access and offline trip visibility.
              </p>

              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleInstallClick}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-[#c0201f] hover:bg-[#a01817] active:scale-[0.98] text-white text-xs font-semibold rounded-xl shadow transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{canInstall ? 'Install App' : 'Add to Home Screen'}</span>
                </button>

                <button
                  onClick={handleDismiss}
                  className="py-2 px-3 text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* iOS Safari Installation Walkthrough Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#c0201f]" />
                Install on iPhone / iPad
              </h3>
              <button
                onClick={() => setShowIosGuide(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-[#c0201f] shrink-0">
                  1
                </div>
                <div className="text-slate-600 dark:text-slate-300">
                  Tap the <strong className="text-slate-900 dark:text-white">Share</strong> button{' '}
                  <Share className="w-4 h-4 inline-block text-blue-500 mx-0.5" /> at the bottom of Safari.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-[#c0201f] shrink-0">
                  2
                </div>
                <div className="text-slate-600 dark:text-slate-300">
                  Scroll down the share sheet and select{' '}
                  <strong className="text-slate-900 dark:text-white">Add to Home Screen</strong>{' '}
                  <PlusSquare className="w-4 h-4 inline-block text-slate-500 mx-0.5" />.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-[#c0201f] shrink-0">
                  3
                </div>
                <div className="text-slate-600 dark:text-slate-300">
                  Tap <strong className="text-slate-900 dark:text-white">Add</strong> in the top right corner. SmokeyOps will install to your device.
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowIosGuide(false);
                handleDismiss();
              }}
              className="w-full py-2.5 bg-[#c0201f] text-white font-semibold rounded-xl text-sm hover:bg-[#a01817] transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};


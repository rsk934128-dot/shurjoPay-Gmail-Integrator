import React, { useState } from 'react';
import { Download, X, Share } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { motion, AnimatePresence } from 'motion/react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-500/20 active:scale-95"
      >
        <Download className="w-4 h-4" />
        INSTALL APP
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg active:scale-95 border border-neutral-700"
        >
          <Download className="w-4 h-4" />
          INSTALL ON IOS
        </button>

        <AnimatePresence>
          {showIOSGuide && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Install App</h3>
                  <button onClick={() => setShowIOSGuide(false)} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-neutral-500" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    To install this app on your iPhone or iPad:
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</div>
                      <p className="text-sm text-neutral-700 dark:text-neutral-300">
                        Tap the <span className="font-bold inline-flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded"><Share className="w-3 h-3" /> Share</span> button in the Safari toolbar.
                      </p>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</div>
                      <p className="text-sm text-neutral-700 dark:text-neutral-300">
                        Scroll down and tap <span className="font-bold bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">Add to Home Screen</span>.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowIOSGuide(false)}
                    className="mt-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all"
                  >
                    GOT IT
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return null;
};

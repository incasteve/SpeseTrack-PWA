import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share2, PlusSquare, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, do not display
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-sky-500 transition active:scale-95 cursor-pointer"
        title="Installa SpeseTrack sulla tua schermata home"
      >
        <Download className="w-4 h-4" />
        <span>Installa App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-lg border border-sky-300 dark:border-sky-700 bg-sky-50 dark:bg-sky-950/40 px-3 py-1.5 text-xs sm:text-sm font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-100 transition cursor-pointer"
          title="Installa SpeseTrack su iPhone / iPad"
        >
          <Download className="w-4 h-4" />
          <span>Installa PWA</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Download className="w-5 h-5 text-sky-600" />
                  Installa su iPhone / iPad
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="p-2 rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-900/50">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">1. Tocca Condividi</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Premi l'icona di condivisione nella barra in basso di Safari.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50">
                    <PlusSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">2. Aggiungi alla Schermata Home</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Scorri il menu e seleziona "Aggiungi a Schermata Home".</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-sky-600 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 transition"
              >
                Ho Capito
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

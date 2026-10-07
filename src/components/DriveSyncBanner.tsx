import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { DriveSyncState, Expense } from '../types';
import { exportExpensesToCSV } from '../lib/drive';
import {
  Cloud,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Download,
  FileSpreadsheet,
  FileJson,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface DriveSyncBannerProps {
  user: User | null;
  onLogin: () => void;
  driveSync: DriveSyncState;
  onManualSync: () => void;
  expenses: Expense[];
}

export const DriveSyncBanner: React.FC<DriveSyncBannerProps> = ({
  user,
  onLogin,
  driveSync,
  onManualSync,
  expenses,
}) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadCSV = () => {
    const csvData = exportExpensesToCSV(expenses);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SpeseTrack_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadJSON = () => {
    const data = {
      appName: 'SpeseTrack PWA',
      exportDate: new Date().toISOString(),
      expenses,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SpeseTrack_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-gradient-to-r from-sky-900 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-sky-800/60 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-400/30">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>Sincronizzazione Parallela Google Drive</span>
                {user && driveSync.status === 'synced' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" />
                    In Tempo Reale
                  </span>
                )}
              </h3>
              <p className="text-xs text-sky-200/80">
                Ogni spesa inserita viene salvata istantaneamente sia sul tuo dispositivo che nel file{' '}
                <span className="font-mono text-white bg-white/10 px-1 py-0.5 rounded text-[11px]">
                  Spese_Personali_App.json
                </span>{' '}
                del tuo Google Drive personale.
              </p>
            </div>
          </div>

          {user ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 pt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Account: <strong className="text-white">{user.email}</strong></span>
              </span>
              {driveSync.lastSyncedAt && (
                <span className="text-slate-400">
                  Ultimo sync: {new Date(driveSync.lastSyncedAt).toLocaleTimeString('it-IT')}
                </span>
              )}
              {driveSync.fileInfo.webViewLink && (
                <a
                  href={driveSync.fileInfo.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sky-300 hover:text-white underline decoration-sky-400 font-semibold transition"
                >
                  <span>Apri file su Drive</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-amber-200/90 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl w-fit">
              <AlertCircle className="w-4 h-4 text-amber-300 shrink-0" />
              <span>
                Non sei ancora autenticato con Google. I dati sono al sicuro nella cache locale del browser.
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {user ? (
            <button
              onClick={onManualSync}
              disabled={driveSync.status === 'syncing'}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-98 text-white text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${driveSync.status === 'syncing' ? 'animate-spin' : ''}`} />
              <span>{driveSync.status === 'syncing' ? 'Sincronizzazione...' : 'Sincronizza Ora'}</span>
            </button>
          ) : (
            <button
              onClick={onLogin}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-slate-900 hover:bg-slate-100 active:scale-98 text-xs font-bold transition shadow-md cursor-pointer"
            >
              <Cloud className="w-4 h-4 text-sky-600" />
              <span>Collega Google Drive</span>
            </button>
          )}

          {/* Export CSV / JSON */}
          <div className="flex items-center gap-1 bg-white/10 rounded-xl p-0.5 border border-white/10">
            <button
              onClick={handleDownloadCSV}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/15 text-[11px] font-semibold text-slate-200 transition cursor-pointer"
              title="Esporta spese in formato Excel / CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV</span>
            </button>
            <button
              onClick={handleDownloadJSON}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/15 text-[11px] font-semibold text-slate-200 transition cursor-pointer"
              title="Scarica backup JSON"
            >
              <FileJson className="w-3.5 h-3.5 text-amber-400" />
              <span>JSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

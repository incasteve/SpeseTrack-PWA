import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  Cloud,
  CloudUpload,
  CloudOff,
  CheckCircle2,
  Bell,
  LogOut,
  ChevronDown,
  Sparkles,
  Wifi,
  WifiOff,
  ShieldCheck,
} from 'lucide-react';
import { DriveSyncState } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { InAppNotification, triggerTestPushNotification } from '../lib/notifications';

interface NavbarProps {
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  isLoggingIn: boolean;
  driveSync: DriveSyncState;
  onManualSync: () => void;
  notifications: InAppNotification[];
  onMarkNotificationRead: (id: string) => void;
  onClearNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogin,
  onLogout,
  isLoggingIn,
  driveSync,
  onManualSync,
  notifications,
  onMarkNotificationRead,
  onClearNotifications,
}) => {
  const isOnline = useOnlineStatus();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [isTestingNotif, setIsTestingNotif] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleTestNotification = async () => {
    setIsTestingNotif(true);
    await triggerTestPushNotification();
    setTimeout(() => setIsTestingNotif(false), 800);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-teal-600 flex items-center justify-center shadow-md shadow-sky-500/20 text-white font-black text-xl tracking-tight">
            €
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white">
                Spese<span className="text-sky-600 dark:text-sky-400">Track</span>
              </span>
              <span className="hidden xs:inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block leading-none">
              Controllo spese personali & Google Drive
            </p>
          </div>
        </div>

        {/* Center / Right utilities */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Drive Sync status badge */}
          <div
            onClick={user ? onManualSync : undefined}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
              !user
                ? 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                : driveSync.status === 'syncing'
                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 animate-pulse'
                : driveSync.status === 'synced'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 cursor-pointer hover:bg-emerald-100'
                : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 cursor-pointer'
            }`}
            title={
              user
                ? driveSync.fileInfo.webViewLink
                  ? `Sincronizzato su Drive. Clicca per sincronizzare subito.`
                  : 'Sincronizzazione Drive attiva'
                : 'Accedi con Google per sincronizzare su Google Drive'
            }
          >
            {!user ? (
              <>
                <CloudOff className="w-3.5 h-3.5 text-slate-400" />
                <span>Drive offline</span>
              </>
            ) : driveSync.status === 'syncing' ? (
              <>
                <CloudUpload className="w-3.5 h-3.5 animate-spin" />
                <span>Salvataggio su Drive...</span>
              </>
            ) : driveSync.status === 'synced' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Drive sincronizzato</span>
              </>
            ) : (
              <>
                <Cloud className="w-3.5 h-3.5" />
                <span>Errore Sync (clicca)</span>
              </>
            )}
          </div>

          {/* Online/Offline status pill */}
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
              isOnline
                ? 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                : 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300'
            }`}
            title={isOnline ? 'Connessione attiva' : 'Dispositivo offline'}
          >
            {isOnline ? (
              <Wifi className="w-3 h-3 text-emerald-500" />
            ) : (
              <WifiOff className="w-3 h-3 text-rose-500" />
            )}
            <span className="hidden lg:inline">{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* Notifications menu toggle */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifMenu(!showNotifMenu);
                setShowUserMenu(false);
              }}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Notifiche Budget"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-sky-600" />
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      Notifiche Budget
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleTestNotification}
                      disabled={isTestingNotif}
                      className="text-xs text-sky-600 hover:text-sky-700 font-medium px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 transition cursor-pointer"
                    >
                      {isTestingNotif ? 'Inviando...' : 'Test Notifica'}
                    </button>
                    {notifications.length > 0 && (
                      <button
                        onClick={onClearNotifications}
                        className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        Cancella
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3 max-h-72 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      Nessuna notifica presente. Riceverai avvisi push quando ti avvicini o superi il budget mensile.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => onMarkNotificationRead(n.id)}
                        className={`p-2.5 rounded-xl text-xs transition cursor-pointer border ${
                          n.type === 'danger'
                            ? 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-200'
                            : n.type === 'warning'
                            ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-200'
                            : 'bg-slate-50 border-slate-200 text-slate-800 dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span>{n.title}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(n.timestamp).toLocaleTimeString('it-IT', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] leading-tight text-slate-600 dark:text-slate-300">
                          {n.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Google OAuth Profile or Sign-in Button */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotifMenu(false);
                }}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Utente'}
                    className="w-8 h-8 rounded-full border border-sky-300 dark:border-sky-600 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center text-xs">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 hidden md:inline max-w-[120px] truncate">
                  {user.displayName?.split(' ')[0] || user.email}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="Avatar"
                        className="w-10 h-10 rounded-full border border-sky-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center">
                        {(user.displayName || user.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {user.displayName || 'Utente Google'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="py-2.5 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>Google Drive OAuth Attivo</span>
                    </div>
                    {driveSync.fileInfo.webViewLink && (
                      <a
                        href={driveSync.fileInfo.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sky-600 hover:underline text-[11px] truncate pt-1"
                      >
                        Vedi file su Drive ↗
                      </a>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Disconnetti</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Official Google Sign-in button per workspace-integration skill */
            <button
              onClick={onLogin}
              disabled={isLoggingIn}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs sm:text-sm font-medium shadow-xs hover:bg-slate-50 hover:border-slate-400 transition active:scale-98 cursor-pointer disabled:opacity-60"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
              <span>{isLoggingIn ? 'Accesso...' : 'Accedi con Google'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

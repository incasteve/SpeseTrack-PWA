import React, { useState } from 'react';
import { BudgetConfig } from '../types';
import {
  Bell,
  Check,
  Edit2,
  AlertTriangle,
  Sparkles,
  ShieldAlert,
  BellRing,
} from 'lucide-react';
import {
  requestNotificationPermission,
  getNotificationPermission,
  triggerTestPushNotification,
} from '../lib/notifications';

interface BudgetProgressBarProps {
  currentSpent: number;
  budget: BudgetConfig;
  onUpdateBudget: (newBudget: Partial<BudgetConfig>) => void;
  activeMonthLabel: string;
}

export const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({
  currentSpent,
  budget,
  onUpdateBudget,
  activeMonthLabel,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputBudget, setInputBudget] = useState(budget.monthlyBudget.toString());
  const [notifPerm, setNotifPerm] = useState(getNotificationPermission());
  const [testSent, setTestSent] = useState(false);

  const percentage = Math.min(Math.round((currentSpent / budget.monthlyBudget) * 100), 200);
  const isExceeded = currentSpent > budget.monthlyBudget;
  const isWarning = !isExceeded && percentage >= budget.warningThresholdPercentage;

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(inputBudget);
    if (!isNaN(val) && val > 0) {
      onUpdateBudget({ monthlyBudget: val });
      setIsEditing(false);
    }
  };

  const handleEnablePush = async () => {
    const res = await requestNotificationPermission();
    setNotifPerm(res);
    if (res === 'granted') {
      await triggerTestPushNotification();
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Controllo Budget Mensile ({activeMonthLabel})
            </h3>
            {isExceeded ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" />
                Budget Superato
              </span>
            ) : isWarning ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5" />
                Attenzione ({percentage}%)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                Entro i limiti
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ricevi una notifica push istantanea sul tuo dispositivo non appena le spese superano questa soglia.
          </p>
        </div>

        {/* Edit budget or Push Notification Action */}
        <div className="flex items-center gap-2 shrink-0">
          {isEditing ? (
            <form onSubmit={handleSaveBudget} className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
                  €
                </span>
                <input
                  type="number"
                  min="10"
                  step="50"
                  value={inputBudget}
                  onChange={(e) => setInputBudget(e.target.value)}
                  className="w-28 pl-6 pr-2 py-1 text-sm font-bold border border-sky-400 rounded-lg dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="p-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg cursor-pointer"
                title="Salva Budget"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1"
              >
                Annulla
              </button>
            </form>
          ) : (
            <button
              onClick={() => {
                setInputBudget(budget.monthlyBudget.toString());
                setIsEditing(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Modifica Budget (€{budget.monthlyBudget})</span>
            </button>
          )}

          {/* Push notification permission activator */}
          {notifPerm !== 'granted' ? (
            <button
              onClick={handleEnablePush}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
              title="Abilita notifiche push per avvisi budget"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Attiva Notifiche Push</span>
            </button>
          ) : (
            <button
              onClick={async () => {
                await triggerTestPushNotification();
                setTestSent(true);
                setTimeout(() => setTestSent(false), 2500);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 transition cursor-pointer"
              title="Notifiche push già attive"
            >
              <BellRing className="w-3.5 h-3.5 text-emerald-600" />
              <span>{testSent ? 'Notifica inviata!' : 'Push Attive'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar Track */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-xs font-bold mb-2">
          <span className="text-slate-600 dark:text-slate-300">
            Spesi €{currentSpent.toLocaleString('it-IT', { minimumFractionDigits: 2 })} di €
            {budget.monthlyBudget.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </span>
          <span
            className={
              isExceeded
                ? 'text-rose-600 dark:text-rose-400 font-black'
                : isWarning
                ? 'text-amber-600 dark:text-amber-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }
          >
            {percentage}%
          </span>
        </div>

        <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              isExceeded
                ? 'bg-gradient-to-r from-rose-500 to-red-600 shadow-sm shadow-rose-500/50'
                : isWarning
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 shadow-sm shadow-amber-500/50'
                : 'bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>

        {/* Explanatory footer alert if exceeded */}
        {isExceeded && (
          <div className="mt-3.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-3 text-xs text-rose-800 dark:text-rose-200">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <span className="font-bold">Attenzione al bilancio! </span>
              Hai superato il budget fissato di €
              {(currentSpent - budget.monthlyBudget).toLocaleString('it-IT', {
                minimumFractionDigits: 2,
              })}
              . Ti consigliamo di limitare le spese non essenziali fino alla fine del mese.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

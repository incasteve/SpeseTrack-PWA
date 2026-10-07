import { useState, useEffect, useCallback, useRef } from 'react';
import { Expense, BudgetConfig, DriveSyncState, ExpenseCategory } from '../types';
import {
  findDriveFile,
  createDriveFile,
  updateDriveFile,
  readDriveFile,
  DriveAppData,
} from '../lib/drive';
import {
  notifyBudgetExceeded,
  notifyBudgetWarning,
  InAppNotification,
} from '../lib/notifications';

const LOCAL_STORAGE_KEY = 'spesetrack_expenses_v1';
const LOCAL_STORAGE_BUDGET_KEY = 'spesetrack_budget_v1';
const LOCAL_STORAGE_NOTIFS_KEY = 'spesetrack_notifications_v1';

// Seed sample expenses in Italian context for current and past days
const INITIAL_SAMPLE_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    description: 'Spesa supermercato Esselunga',
    amount: 86.40,
    date: '2026-10-06',
    category: 'Alimentari & Spesa',
    paymentMethod: 'Bancomat / Debito',
    notes: 'Frutta, verdura e prodotti per la casa',
    createdAt: '2026-10-06T10:30:00.000Z',
    updatedAt: '2026-10-06T10:30:00.000Z',
  },
  {
    id: 'exp-2',
    description: 'Pieno Benzina Eni Station',
    amount: 65.00,
    date: '2026-10-05',
    category: 'Trasporti & Auto',
    paymentMethod: 'Carta di Credito',
    notes: 'Rifornimento settimanale',
    createdAt: '2026-10-05T08:15:00.000Z',
    updatedAt: '2026-10-05T08:15:00.000Z',
  },
  {
    id: 'exp-3',
    description: 'Cena Pizzeria con amici',
    amount: 42.50,
    date: '2026-10-04',
    category: 'Ristoranti & Bar',
    paymentMethod: 'PayPal',
    notes: 'Pizza margherita e birra artigianale',
    createdAt: '2026-10-04T20:45:00.000Z',
    updatedAt: '2026-10-04T20:45:00.000Z',
  },
  {
    id: 'exp-4',
    description: 'Bolletta Energia Elettrica',
    amount: 115.80,
    date: '2026-10-03',
    category: 'Casa & Bollette',
    paymentMethod: 'Bonifico Bancario',
    notes: 'Bimestre settembre-ottobre',
    createdAt: '2026-10-03T14:00:00.000Z',
    updatedAt: '2026-10-03T14:00:00.000Z',
  },
  {
    id: 'exp-5',
    description: 'Abbonamento Fibra Internet casa',
    amount: 29.90,
    date: '2026-10-02',
    category: 'Tecnologia & Servizi',
    paymentMethod: 'Carta di Credito',
    notes: 'Canone mensile',
    createdAt: '2026-10-02T09:00:00.000Z',
    updatedAt: '2026-10-02T09:00:00.000Z',
  },
  {
    id: 'exp-6',
    description: 'Farmacia - Integratori e vitamine',
    amount: 34.20,
    date: '2026-10-01',
    category: 'Salute & Benessere',
    paymentMethod: 'Contanti',
    notes: 'Acquisto parafarmaci',
    createdAt: '2026-10-01T11:20:00.000Z',
    updatedAt: '2026-10-01T11:20:00.000Z',
  },
  {
    id: 'exp-7',
    description: 'Scarpe sportive nuove',
    amount: 89.00,
    date: '2026-09-27',
    category: 'Shopping & Abbigliamento',
    paymentMethod: 'Carta di Credito',
    notes: 'Saldi autunno',
    createdAt: '2026-09-27T16:40:00.000Z',
    updatedAt: '2026-09-27T16:40:00.000Z',
  },
];

const DEFAULT_BUDGET: BudgetConfig = {
  monthlyBudget: 1200,
  warningThresholdPercentage: 85,
  currency: '€',
};

export function useExpenses(accessToken: string | null) {
  // Load expenses from LocalStorage or initial seed
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load local expenses', e);
    }
    return INITIAL_SAMPLE_EXPENSES;
  });

  // Load Budget
  const [budget, setBudget] = useState<BudgetConfig>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_BUDGET_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load local budget', e);
    }
    return DEFAULT_BUDGET;
  });

  // Notifications
  const [notifications, setNotifications] = useState<InAppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_NOTIFS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load notifications', e);
    }
    return [];
  });

  // Google Drive Sync State
  const [driveSyncState, setDriveSyncState] = useState<DriveSyncState>({
    status: 'idle',
    lastSyncedAt: null,
    fileInfo: {
      fileId: null,
      fileName: 'Spese_Personali_App.json',
      webViewLink: null,
      lastSyncTime: null,
    },
    error: null,
  });

  // Filter Month (e.g. "2026-10" or "ALL")
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

  const prevSpentRef = useRef<number>(0);
  const isSyncingRef = useRef(false);

  // Persist to local storage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(expenses));
    } catch (err) {
      console.error('Error caching expenses to localStorage:', err);
    }
  }, [expenses]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_BUDGET_KEY, JSON.stringify(budget));
    } catch (err) {
      console.error('Error caching budget to localStorage:', err);
    }
  }, [budget]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_NOTIFS_KEY, JSON.stringify(notifications));
    } catch (err) {
      console.error('Error caching notifications to localStorage:', err);
    }
  }, [notifications]);

  // Parallel Google Drive Synchronization
  const syncToDrive = useCallback(
    async (
      currentExpenses: Expense[],
      currentBudget: BudgetConfig,
      tokenToUse?: string
    ) => {
      const token = tokenToUse || accessToken;
      if (!token) {
        setDriveSyncState((prev) => ({
          ...prev,
          status: 'idle',
          error: null,
        }));
        return;
      }

      if (isSyncingRef.current) return;
      isSyncingRef.current = true;

      setDriveSyncState((prev) => ({
        ...prev,
        status: 'syncing',
        error: null,
      }));

      try {
        const payload: DriveAppData = {
          appName: 'SpeseTrack PWA',
          version: 1,
          lastUpdated: new Date().toISOString(),
          budget: currentBudget,
          expenses: currentExpenses,
        };

        let fileInfo = driveSyncState.fileInfo;

        // If fileId is not yet cached in state, search for it first
        if (!fileInfo.fileId) {
          const existing = await findDriveFile(token);
          if (existing && existing.fileId) {
            fileInfo = existing;
          }
        }

        if (fileInfo.fileId) {
          // Update existing file
          const updated = await updateDriveFile(token, fileInfo.fileId, payload);
          setDriveSyncState({
            status: 'synced',
            lastSyncedAt: new Date().toISOString(),
            fileInfo: updated,
            error: null,
          });
        } else {
          // Create new file on Google Drive
          const created = await createDriveFile(token, payload);
          setDriveSyncState({
            status: 'synced',
            lastSyncedAt: new Date().toISOString(),
            fileInfo: created,
            error: null,
          });
        }
      } catch (err: any) {
        console.error('Error during Drive sync:', err);
        setDriveSyncState((prev) => ({
          ...prev,
          status: 'error',
          error: err.message || 'Errore sincronizzazione Google Drive',
        }));
      } finally {
        isSyncingRef.current = false;
      }
    },
    [accessToken, driveSyncState.fileInfo]
  );

  // Initial pull or connect when user logs in with OAuth
  useEffect(() => {
    let isCancelled = false;
    async function initDrive() {
      if (!accessToken) {
        setDriveSyncState((prev) => ({
          ...prev,
          status: 'idle',
          fileInfo: { ...prev.fileInfo, fileId: null, webViewLink: null },
        }));
        return;
      }

      setDriveSyncState((prev) => ({ ...prev, status: 'syncing' }));
      try {
        const existing = await findDriveFile(accessToken);
        if (isCancelled) return;

        if (existing && existing.fileId) {
          // File exists on user's Drive! Read it
          const driveData = await readDriveFile(accessToken, existing.fileId);
          if (driveData && driveData.expenses && driveData.expenses.length > 0) {
            // Merge with local expenses (Drive authoritative, with union)
            const idMap = new Map<string, Expense>();
            expenses.forEach((e) => idMap.set(e.id, e));
            driveData.expenses.forEach((e) => idMap.set(e.id, e));
            const merged = Array.from(idMap.values()).sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            setExpenses(merged);
            if (driveData.budget) {
              setBudget(driveData.budget);
            }
          }

          setDriveSyncState({
            status: 'synced',
            lastSyncedAt: new Date().toISOString(),
            fileInfo: existing,
            error: null,
          });
        } else {
          // File does not exist yet on Drive, perform first parallel upload
          await syncToDrive(expenses, budget, accessToken);
        }
      } catch (err: any) {
        if (isCancelled) return;
        console.error('Initial Drive check failed:', err);
        setDriveSyncState((prev) => ({
          ...prev,
          status: 'error',
          error: err.message || 'Impossibile connettersi a Google Drive',
        }));
      }
    }

    initDrive();
    return () => {
      isCancelled = true;
    };
  }, [accessToken]); // only trigger when accessToken changes

  // Helper to add in-app notification
  const addInAppNotification = useCallback(
    (type: 'danger' | 'warning' | 'info' | 'success', title: string, message: string) => {
      const newNotif: InAppNotification = {
        id: `notif-${Date.now()}`,
        type,
        title,
        message,
        timestamp: new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev.slice(0, 19)]);
    },
    []
  );

  // Check budget thresholds for current month
  const checkBudgetThresholds = useCallback(
    (updatedExpenses: Expense[], currentBudget: BudgetConfig) => {
      const nowStr = new Date().toISOString().slice(0, 7);
      const currentMonthExpenses = updatedExpenses.filter((e) => e.date.startsWith(nowStr));
      const totalMonthSpent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

      const monthName = new Date().toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });

      // Trigger exceed notification
      if (totalMonthSpent > currentBudget.monthlyBudget && prevSpentRef.current <= currentBudget.monthlyBudget) {
        notifyBudgetExceeded(totalMonthSpent, currentBudget.monthlyBudget, monthName);
        addInAppNotification(
          'danger',
          '⚠️ Budget Mensile Superato!',
          `Hai speso €${totalMonthSpent.toFixed(2)} rispetto al budget di €${currentBudget.monthlyBudget.toFixed(2)} (${monthName}).`
        );
      } else if (
        totalMonthSpent >= currentBudget.monthlyBudget * 0.85 &&
        prevSpentRef.current < currentBudget.monthlyBudget * 0.85
      ) {
        const perc = Math.round((totalMonthSpent / currentBudget.monthlyBudget) * 100);
        notifyBudgetWarning(totalMonthSpent, currentBudget.monthlyBudget, perc);
        addInAppNotification(
          'warning',
          '⚡ Avviso Budget all\'85%',
          `Hai raggiunto €${totalMonthSpent.toFixed(2)} (${perc}%) del tuo budget mensile di €${currentBudget.monthlyBudget.toFixed(2)}.`
        );
      }

      prevSpentRef.current = totalMonthSpent;
    },
    [addInAppNotification]
  );

  // Add Expense (immediate local update + parallel Google Drive push)
  const addExpense = useCallback(
    async (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newExpense: Expense = {
        ...expenseData,
        id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updated = [newExpense, ...expenses];
      setExpenses(updated);
      checkBudgetThresholds(updated, budget);

      // Trigger parallel Drive sync
      if (accessToken) {
        syncToDrive(updated, budget);
      }

      return newExpense;
    },
    [expenses, budget, accessToken, syncToDrive, checkBudgetThresholds]
  );

  // Update Expense (immediate local update + parallel Google Drive push)
  const updateExpense = useCallback(
    async (id: string, expenseData: Partial<Expense>) => {
      const updated = expenses.map((e) =>
        e.id === id ? { ...e, ...expenseData, updatedAt: new Date().toISOString() } : e
      );
      setExpenses(updated);
      checkBudgetThresholds(updated, budget);

      if (accessToken) {
        syncToDrive(updated, budget);
      }
    },
    [expenses, budget, accessToken, syncToDrive, checkBudgetThresholds]
  );

  // Delete Expense (requires confirmation handled by UI, then updates local + parallel Drive)
  const deleteExpense = useCallback(
    async (id: string) => {
      const updated = expenses.filter((e) => e.id !== id);
      setExpenses(updated);
      checkBudgetThresholds(updated, budget);

      if (accessToken) {
        syncToDrive(updated, budget);
      }
    },
    [expenses, budget, accessToken, syncToDrive, checkBudgetThresholds]
  );

  // Update Budget config
  const updateBudget = useCallback(
    async (newBudget: Partial<BudgetConfig>) => {
      const updated: BudgetConfig = {
        ...budget,
        ...newBudget,
      };
      setBudget(updated);
      checkBudgetThresholds(expenses, updated);

      if (accessToken) {
        syncToDrive(expenses, updated);
      }
    },
    [budget, expenses, accessToken, syncToDrive, checkBudgetThresholds]
  );

  // Force Manual Sync
  const manualSync = useCallback(async () => {
    if (!accessToken) return;
    await syncToDrive(expenses, budget);
  }, [accessToken, expenses, budget, syncToDrive]);

  // Mark notification read
  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    expenses,
    budget,
    notifications,
    driveSyncState,
    selectedMonth,
    setSelectedMonth,
    addExpense,
    updateExpense,
    deleteExpense,
    updateBudget,
    manualSync,
    markNotificationRead,
    clearNotifications,
    addInAppNotification,
  };
}

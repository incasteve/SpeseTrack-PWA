export type ExpenseCategory =
  | 'Alimentari & Spesa'
  | 'Ristoranti & Bar'
  | 'Trasporti & Auto'
  | 'Casa & Bollette'
  | 'Salute & Benessere'
  | 'Svago & Tempo Libero'
  | 'Shopping & Abbigliamento'
  | 'Tecnologia & Servizi'
  | 'Istruzione & Lavoro'
  | 'Altro';

export type PaymentMethod =
  | 'Carta di Credito'
  | 'Bancomat / Debito'
  | 'Contanti'
  | 'Bonifico Bancario'
  | 'PayPal'
  | 'Altro';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetConfig {
  monthlyBudget: number; // e.g. 1500
  warningThresholdPercentage: number; // e.g. 85%
  currency: string; // '€'
}

export interface DriveFileInfo {
  fileId: string | null;
  fileName: string;
  webViewLink: string | null;
  lastSyncTime: string | null;
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

export interface DriveSyncState {
  status: SyncStatus;
  lastSyncedAt: string | null;
  fileInfo: DriveFileInfo;
  error?: string | null;
}

export const CATEGORY_COLORS: Record<ExpenseCategory, { bg: string; fill: string; border: string; text: string }> = {
  'Alimentari & Spesa': { bg: 'bg-emerald-500/10', fill: '#10b981', border: 'border-emerald-500/30', text: 'text-emerald-700' },
  'Ristoranti & Bar': { bg: 'bg-amber-500/10', fill: '#f59e0b', border: 'border-amber-500/30', text: 'text-amber-700' },
  'Trasporti & Auto': { bg: 'bg-blue-500/10', fill: '#3b82f6', border: 'border-blue-500/30', text: 'text-blue-700' },
  'Casa & Bollette': { bg: 'bg-purple-500/10', fill: '#a855f7', border: 'border-purple-500/30', text: 'text-purple-700' },
  'Salute & Benessere': { bg: 'bg-rose-500/10', fill: '#f43f5e', border: 'border-rose-500/30', text: 'text-rose-700' },
  'Svago & Tempo Libero': { bg: 'bg-pink-500/10', fill: '#ec4899', border: 'border-pink-500/30', text: 'text-pink-700' },
  'Shopping & Abbigliamento': { bg: 'bg-indigo-500/10', fill: '#6366f1', border: 'border-indigo-500/30', text: 'text-indigo-700' },
  'Tecnologia & Servizi': { bg: 'bg-cyan-500/10', fill: '#06b6d4', border: 'border-cyan-500/30', text: 'text-cyan-700' },
  'Istruzione & Lavoro': { bg: 'bg-teal-500/10', fill: '#14b8a6', border: 'border-teal-500/30', text: 'text-teal-700' },
  'Altro': { bg: 'bg-slate-500/10', fill: '#64748b', border: 'border-slate-500/30', text: 'text-slate-700' },
};

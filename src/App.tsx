/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, logout, setAccessToken } from './lib/firebase';
import { useExpenses } from './hooks/useExpenses';
import { Expense, ExpenseCategory } from './types';
import { Navbar } from './components/Navbar';
import { StatsCards } from './components/StatsCards';
import { BudgetProgressBar } from './components/BudgetProgressBar';
import { InteractivePieChart } from './components/InteractivePieChart';
import { ExpenseList } from './components/ExpenseList';
import { ExpenseModal } from './components/ExpenseModal';
import { DriveSyncBanner } from './components/DriveSyncBanner';
import { ConfirmationModal } from './components/ConfirmationModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Plus, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  // Selected Category filter (from chart drilldown or list)
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);

  // Initialize Auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setToken(token);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setToken(null);
        setAccessToken(null);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Use core expenses hook
  const {
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
  } = useExpenses(accessToken);

  // Handle Google OAuth Sign In
  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setAccessToken(result.accessToken);
      }
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Sign Out
  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      setAccessToken(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Open Add modal
  const handleOpenAddModal = () => {
    setExpenseToEdit(null);
    setIsModalOpen(true);
  };

  // Open Edit modal
  const handleEditExpense = (expense: Expense) => {
    setExpenseToEdit(expense);
    setIsModalOpen(true);
  };

  // Confirm delete handler (User confirmation required per Workspace Skill)
  const handleConfirmDelete = async () => {
    if (expenseToDelete) {
      await deleteExpense(expenseToDelete.id);
      setExpenseToDelete(null);
    }
  };

  // Active month label for titles
  const activeMonthLabel =
    selectedMonth === 'ALL'
      ? 'Tutto lo storico'
      : new Date(
          parseInt(selectedMonth.split('-')[0]),
          parseInt(selectedMonth.split('-')[1]) - 1,
          1
        ).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });

  // Filtered expenses for the active month to pass into the Pie Chart & Stats
  const activeMonthExpenses = expenses.filter((e) =>
    selectedMonth === 'ALL' ? true : e.date.startsWith(selectedMonth)
  );

  const totalSpentInActiveMonth = activeMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Navbar with brand, PWA install, notifications, and Google OAuth */}
      <Navbar
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        isLoggingIn={isLoggingIn}
        driveSync={driveSyncState}
        onManualSync={manualSync}
        notifications={notifications}
        onMarkNotificationRead={markNotificationRead}
        onClearNotifications={clearNotifications}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Drive Sync Banner */}
        <DriveSyncBanner
          user={user}
          onLogin={handleLogin}
          driveSync={driveSyncState}
          onManualSync={manualSync}
          expenses={expenses}
        />

        {/* Real-Time Monthly Statistics Cards */}
        <StatsCards
          expenses={expenses}
          budget={budget}
          selectedMonth={selectedMonth}
        />

        {/* Budget Progress Gauge and Push Notification alerts */}
        <BudgetProgressBar
          currentSpent={totalSpentInActiveMonth}
          budget={budget}
          onUpdateBudget={updateBudget}
          activeMonthLabel={activeMonthLabel}
        />

        {/* Interactive Pie Chart for Expense Categories */}
        <InteractivePieChart
          expenses={activeMonthExpenses}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          periodLabel={activeMonthLabel}
        />

        {/* Transactions / Expense List */}
        <ExpenseList
          expenses={expenses}
          selectedMonth={selectedMonth}
          onSelectMonth={setSelectedMonth}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onOpenAddModal={handleOpenAddModal}
          onEditExpense={handleEditExpense}
          onRequestDelete={(expense) => setExpenseToDelete(expense)}
        />
      </main>

      {/* Floating Action Button for Mobile Fast Entry */}
      <div className="fixed bottom-6 right-6 sm:hidden z-30">
        <button
          onClick={handleOpenAddModal}
          className="w-14 h-14 rounded-full bg-sky-600 text-white shadow-xl flex items-center justify-center hover:bg-sky-500 active:scale-95 transition cursor-pointer"
          aria-label="Aggiungi spesa"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>

      {/* Expense Add/Edit Modal */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(data) => {
          if (expenseToEdit) {
            updateExpense(expenseToEdit.id, data);
          } else {
            addExpense(data);
          }
        }}
        expenseToEdit={expenseToEdit}
      />

      {/* Confirmation Modal for Expense Deletion (Required by Workspace Integration rules) */}
      <ConfirmationModal
        isOpen={!!expenseToDelete}
        title="Elimina Spesa"
        message={
          expenseToDelete
            ? `Sei sicuro di voler eliminare la spesa "${expenseToDelete.description}" di €${expenseToDelete.amount.toFixed(
                2
              )}? L'eliminazione verrà salvata anche sul file Google Drive collegato.`
            : ''
        }
        confirmLabel="Elimina Definitivamente"
        cancelLabel="Annulla"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setExpenseToDelete(null)}
      />

      {/* Offline Toast Indicator */}
      <OfflineIndicator />

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-slate-200/80 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">SpeseTrack PWA</span>
            <span>—</span>
            <span>Tracciamento Spese Personali & Google Drive</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Google OAuth 2.0</span>
            <span>•</span>
            <span>PWA Offline-Ready</span>
            <span>•</span>
            <span>Notifiche Push Budget</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

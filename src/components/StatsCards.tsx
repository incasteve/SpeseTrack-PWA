import React from 'react';
import { Expense, BudgetConfig } from '../types';
import {
  TrendingUp,
  TrendingDown,
  CreditCard,
  PiggyBank,
  Calendar,
  Receipt,
  AlertCircle,
} from 'lucide-react';

interface StatsCardsProps {
  expenses: Expense[];
  budget: BudgetConfig;
  selectedMonth: string; // YYYY-MM or 'ALL'
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  expenses,
  budget,
  selectedMonth,
}) => {
  // Filter for selected month
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const activeMonthStr = selectedMonth === 'ALL' ? currentMonthStr : selectedMonth;

  // Expenses for active month
  const monthExpenses = expenses.filter((e) =>
    selectedMonth === 'ALL' ? true : e.date.startsWith(activeMonthStr)
  );

  const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Compute previous month expenses for trend comparison
  const [year, month] = activeMonthStr.split('-').map(Number);
  const prevMonthDate = new Date(year, month - 2, 1);
  const prevMonthStr = prevMonthDate.toISOString().slice(0, 7);

  const prevMonthExpenses = expenses.filter((e) => e.date.startsWith(prevMonthStr));
  const prevMonthTotal = prevMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const percentageDiff =
    prevMonthTotal > 0
      ? ((totalSpent - prevMonthTotal) / prevMonthTotal) * 100
      : null;

  // Days in month calculation for daily average
  const today = new Date();
  const isCurrentMonth = activeMonthStr === currentMonthStr;
  const currentDay = isCurrentMonth ? today.getDate() : new Date(year, month, 0).getDate();
  const dailyAverage = currentDay > 0 ? totalSpent / currentDay : 0;

  // Budget calculations
  const remainingBudget = budget.monthlyBudget - totalSpent;
  const budgetPercentage = Math.round((totalSpent / budget.monthlyBudget) * 100);
  const isOverBudget = totalSpent > budget.monthlyBudget;

  const averageTransaction =
    monthExpenses.length > 0 ? totalSpent / monthExpenses.length : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Totale Spese Mese */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Totale Speso {selectedMonth === 'ALL' ? '(Tutto)' : ''}
          </span>
          <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            €{totalSpent.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2 flex items-center text-xs">
            {percentageDiff !== null ? (
              <span
                className={`inline-flex items-center font-semibold ${
                  percentageDiff > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {percentageDiff > 0 ? (
                  <TrendingUp className="w-3.5 h-3.5 mr-1" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 mr-1" />
                )}
                {percentageDiff > 0 ? '+' : ''}
                {percentageDiff.toFixed(1)}% vs mese prec.
              </span>
            ) : (
              <span className="text-slate-400">Nessun dato per il mese prec.</span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Budget Rimanente */}
      <div
        className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border shadow-xs relative overflow-hidden ${
          isOverBudget
            ? 'border-rose-300 dark:border-rose-900/60 ring-2 ring-rose-500/20'
            : 'border-slate-200/80 dark:border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {isOverBudget ? 'Budget Superato!' : 'Budget Rimanente'}
          </span>
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isOverBudget
                ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
            }`}
          >
            {isOverBudget ? <AlertCircle className="w-5 h-5 animate-pulse" /> : <PiggyBank className="w-5 h-5" />}
          </div>
        </div>

        <div className="mt-3">
          <div
            className={`text-2xl sm:text-3xl font-black tracking-tight ${
              isOverBudget ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
            }`}
          >
            {isOverBudget ? '-' : ''}€
            {Math.abs(remainingBudget).toLocaleString('it-IT', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>{budgetPercentage}% del budget (€{budget.monthlyBudget})</span>
            {isOverBudget && (
              <span className="text-rose-600 font-bold text-[11px] animate-pulse">Sforato</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Media Giornaliera */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Media Giornaliera
          </span>
          <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            €{dailyAverage.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Calcolata su {currentDay} {currentDay === 1 ? 'giorno' : 'giorni'}
          </div>
        </div>
      </div>

      {/* 4. Transazioni Registrate */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Transazioni Totali
          </span>
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {monthExpenses.length}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Media per transazione: €{averageTransaction.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
};

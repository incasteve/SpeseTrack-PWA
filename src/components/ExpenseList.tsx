import React, { useState, useMemo } from 'react';
import { Expense, ExpenseCategory, CATEGORY_COLORS } from '../types';
import {
  Search,
  Calendar,
  Filter,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  Receipt,
  Tag,
  CreditCard,
  FileText,
} from 'lucide-react';

interface ExpenseListProps {
  expenses: Expense[];
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  selectedCategory: ExpenseCategory | null;
  onSelectCategory: (category: ExpenseCategory | null) => void;
  onOpenAddModal: () => void;
  onEditExpense: (expense: Expense) => void;
  onRequestDelete: (expense: Expense) => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  selectedMonth,
  onSelectMonth,
  selectedCategory,
  onSelectCategory,
  onOpenAddModal,
  onEditExpense,
  onRequestDelete,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Generate list of available months from actual expense dates + current month
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    const currentMonth = new Date().toISOString().slice(0, 7);
    set.add(currentMonth);

    expenses.forEach((e) => {
      if (e.date) {
        set.add(e.date.slice(0, 7));
      }
    });

    return Array.from(set).sort().reverse();
  }, [expenses]);

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      // Month match
      if (selectedMonth !== 'ALL' && !e.date.startsWith(selectedMonth)) {
        return false;
      }

      // Category match
      if (selectedCategory && e.category !== selectedCategory) {
        return false;
      }

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDesc = e.description.toLowerCase().includes(q);
        const matchNotes = e.notes ? e.notes.toLowerCase().includes(q) : false;
        const matchCat = e.category.toLowerCase().includes(q);
        const matchMethod = e.paymentMethod.toLowerCase().includes(q);
        if (!matchDesc && !matchNotes && !matchCat && !matchMethod) {
          return false;
        }
      }

      return true;
    });
  }, [expenses, selectedMonth, selectedCategory, searchQuery]);

  const totalFiltered = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const formatMonthLabel = (m: string) => {
    if (m === 'ALL') return 'Tutte le spese (Senza filtro)';
    const [year, month] = m.split('-').map(Number);
    const d = new Date(year, month - 1, 1);
    return d.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <span>Elenco Movimenti & Spese</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {filteredExpenses.length}
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tracciamento puntuale delle transazioni salvate
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-98 text-white text-xs sm:text-sm font-bold shadow-md shadow-sky-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Aggiungi Spesa</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Month Selector */}
        <div className="sm:col-span-5 flex items-center gap-2">
          <div className="relative w-full">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={selectedMonth}
              onChange={(e) => onSelectMonth(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer capitalize"
            >
              <option value="ALL">Tutti i Mesi (Storico Completo)</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonthLabel(m)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search input */}
        <div className="sm:col-span-7 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cerca per descrizione, categoria o metodo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Active filters pill badge if any */}
      {(selectedCategory || searchQuery) && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 text-[11px] font-semibold">Filtri attivi:</span>
          {selectedCategory && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 font-semibold text-xs">
              <span>{selectedCategory}</span>
              <button
                onClick={() => onSelectCategory(null)}
                className="hover:text-sky-950 dark:hover:text-white"
              >
                ×
              </button>
            </span>
          )}
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 font-semibold text-xs">
              <span>"{searchQuery}"</span>
              <button
                onClick={() => setSearchQuery('')}
                className="hover:text-slate-950 dark:hover:text-white"
              >
                ×
              </button>
            </span>
          )}
          <button
            onClick={() => {
              onSelectCategory(null);
              setSearchQuery('');
            }}
            className="text-[11px] text-sky-600 hover:underline cursor-pointer"
          >
            Azzera tutti
          </button>
        </div>
      )}

      {/* Expense List Items */}
      <div className="mt-5 space-y-2.5">
        {filteredExpenses.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Receipt className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">
              Nessuna spesa trovata
            </h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
              Prova a cambiare i filtri o aggiungi una nuova spesa con il pulsante sopra.
            </p>
          </div>
        ) : (
          filteredExpenses.map((expense) => {
            const catColor = CATEGORY_COLORS[expense.category] || {
              fill: '#64748b',
              text: 'text-slate-700',
              bg: 'bg-slate-100',
            };

            const expenseDate = new Date(expense.date);
            const dateFormatted = expenseDate.toLocaleDateString('it-IT', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            });

            return (
              <div
                key={expense.id}
                className="p-3.5 sm:p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs group"
              >
                {/* Left: Icon, Description, Category, Notes */}
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                    style={{ backgroundColor: `${catColor.fill}18` }}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: catColor.fill }}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {expense.description}
                      </span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                        style={{
                          backgroundColor: `${catColor.fill}15`,
                          color: catColor.fill,
                        }}
                      >
                        {expense.category}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {dateFormatted}
                      </span>
                      <span className="flex items-center gap-1 text-[11px]">
                        <CreditCard className="w-3 h-3 text-slate-400" />
                        {expense.paymentMethod}
                      </span>
                      {expense.notes && (
                        <span
                          className="text-[11px] text-slate-400 italic truncate max-w-[200px]"
                          title={expense.notes}
                        >
                          "{expense.notes}"
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Amount and Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/50 dark:border-slate-700/50">
                  <div className="text-left sm:text-right">
                    <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                      -€{expense.amount.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditExpense(expense)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-700 transition cursor-pointer"
                      title="Modifica spesa"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onRequestDelete(expense)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 transition cursor-pointer"
                      title="Elimina spesa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Subtotal of filtered selection */}
      {filteredExpenses.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Visualizzate {filteredExpenses.length} su {expenses.length} spese totali
          </span>
          <span className="font-bold text-slate-800 dark:text-slate-200">
            Subtotale selezione: €{totalFiltered.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
};

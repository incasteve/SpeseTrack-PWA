import React, { useState, useEffect } from 'react';
import { Expense, ExpenseCategory, PaymentMethod, CATEGORY_COLORS } from '../types';
import { X, Plus, Edit2, Euro, Calendar, Tag, CreditCard, FileText } from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => void;
  expenseToEdit?: Expense | null;
}

const CATEGORIES: ExpenseCategory[] = [
  'Alimentari & Spesa',
  'Ristoranti & Bar',
  'Trasporti & Auto',
  'Casa & Bollette',
  'Salute & Benessere',
  'Svago & Tempo Libero',
  'Shopping & Abbigliamento',
  'Tecnologia & Servizi',
  'Istruzione & Lavoro',
  'Altro',
];

const PAYMENT_METHODS: PaymentMethod[] = [
  'Bancomat / Debito',
  'Carta di Credito',
  'Contanti',
  'PayPal',
  'Bonifico Bancario',
  'Altro',
];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  expenseToEdit,
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState<ExpenseCategory>('Alimentari & Spesa');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bancomat / Debito');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (expenseToEdit) {
      setDescription(expenseToEdit.description);
      setAmount(expenseToEdit.amount.toString());
      setDate(expenseToEdit.date);
      setCategory(expenseToEdit.category);
      setPaymentMethod(expenseToEdit.paymentMethod);
      setNotes(expenseToEdit.notes || '');
    } else {
      setDescription('');
      setAmount('');
      setDate(new Date().toISOString().slice(0, 10));
      setCategory('Alimentari & Spesa');
      setPaymentMethod('Bancomat / Debito');
      setNotes('');
    }
    setError(null);
  }, [expenseToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(',', '.'));

    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Inserisci un importo valido maggiore di 0€');
      return;
    }

    if (!description.trim()) {
      setError('Inserisci una descrizione per la spesa');
      return;
    }

    onSave({
      description: description.trim(),
      amount: numAmount,
      date,
      category,
      paymentMethod,
      notes: notes.trim() ? notes.trim() : undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400 flex items-center justify-center">
              {expenseToEdit ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {expenseToEdit ? 'Modifica Spesa' : 'Nuova Spesa'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verrà salvata in locale e sincronizzata in tempo reale su Google Drive
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Importo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Importo Spesa (€) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">
                €
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError(null);
                }}
                className="w-full pl-9 pr-4 py-3 text-xl font-black text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                autoFocus
                required
              />
            </div>
          </div>

          {/* Descrizione */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Descrizione *
            </label>
            <input
              type="text"
              placeholder="es. Spesa Esselunga, Rifornimento carburante..."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setError(null);
              }}
              className="w-full px-3.5 py-2.5 text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          {/* Data e Metodo di Pagamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Data Spesa
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                Metodo di Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              Categoria
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                const col = CATEGORY_COLORS[cat];
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`p-2 rounded-xl text-xs font-semibold border text-left transition flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-200 ring-2 ring-sky-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: col.fill }}
                    />
                    <span className="truncate">{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note facoltative */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Note Aggiuntive (facoltative)
            </label>
            <textarea
              rows={2}
              placeholder="Aggiungi dettagli, ricevute o annotazioni..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-bold text-white bg-sky-600 hover:bg-sky-500 active:scale-98 rounded-xl shadow-md transition cursor-pointer"
            >
              {expenseToEdit ? 'Aggiorna Spesa' : 'Salva e Sincronizza'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

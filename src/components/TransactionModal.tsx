"use client";

import { useEffect, useState } from "react";

export type TransactionType = "EXPENSE" | "INCOME";

type Category = {
  id: string;
  name: string;
  type: string;
};

type TransactionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialType?: TransactionType;
  editTransaction?: null; // Future: pass transaction for edit
};

export function TransactionModal({
  isOpen,
  onClose,
  onSuccess,
  initialType = "EXPENSE",
}: TransactionModalProps) {
  const [type, setType] = useState<TransactionType>(initialType);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [expenseType, setExpenseType] = useState<"FIXED" | "VARIABLE">("VARIABLE");
  const [expenseStatus, setExpenseStatus] = useState<"PAID" | "PENDING" | "OVERDUE">("PENDING");
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialType) setType(initialType);
  }, [initialType]);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setAmount("");
      setDate(new Date().toISOString().slice(0, 10));
      setCategoryId("");
      setDescription("");
      setIsRecurring(false);
      setExpenseType("VARIABLE");
      setExpenseStatus("PENDING");
      setErrors({});
      fetch("/api/categories")
        .then((r) => r.json())
        .then((data) => setCategories(Array.isArray(data) ? data : []))
        .catch(() => setCategories([]));
    }
  }, [isOpen]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Título é obrigatório";
    if (!amount || Number(amount) <= 0) e.amount = "Valor deve ser maior que zero";
    if (!date) e.date = "Data é obrigatória";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      // Interpretar a data como UTC meio-dia para consistência (evita problemas de fuso horário)
      const [y, m, d] = date.split("-").map(Number);
      const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0));

      const body = {
        type,
        description: title,
        amount: Number(amount),
        date: dateObj.toISOString(),
        categoryId: categoryId || undefined,
        notes: description || undefined,
        isRecurring,
        expenseType: type === "EXPENSE" ? expenseType : undefined,
        isPaid: type === "EXPENSE" ? expenseStatus === "PAID" : true,
        dueDate: type === "EXPENSE" ? dateObj.toISOString() : undefined,
      };

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrors({ submit: data.error || "Erro ao salvar transação" });
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setErrors({ submit: "Erro ao salvar transação" });
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-xl transition duration-200 dark:border-zinc-800 dark:bg-[#1d2330]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h2 id="modal-title" className="text-lg font-semibold text-zinc-900 dark:text-white">
            Nova transação
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            aria-label="Fechar"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="flex gap-2 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
            <button
              type="button"
              onClick={() => setType("EXPENSE")}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                type === "EXPENSE"
                  ? "bg-white text-rose-600 shadow-sm dark:bg-zinc-700 dark:text-rose-400"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => setType("INCOME")}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                type === "INCOME"
                  ? "bg-white text-[#10b77f] shadow-sm dark:bg-zinc-700 dark:text-[#10b77f]"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              Receita
            </button>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Título
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Supermercado, Salário..."
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-[#10b77f] focus:ring-2 focus:ring-[#10b77f]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-[#10b77f]"
            />
            {errors.title && <p className="mt-1 text-xs text-rose-500">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Valor (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-[#10b77f] focus:ring-2 focus:ring-[#10b77f]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-[#10b77f]"
              />
              {errors.amount && <p className="mt-1 text-xs text-rose-500">{errors.amount}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Data
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-[#10b77f] focus:ring-2 focus:ring-[#10b77f]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-[#10b77f]"
              />
              {errors.date && <p className="mt-1 text-xs text-rose-500">{errors.date}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Categoria
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-[#10b77f] focus:ring-2 focus:ring-[#10b77f]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-[#10b77f]"
            >
              <option value="">Selecione...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {type === "EXPENSE" && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Tipo
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setExpenseType("FIXED")}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      expenseType === "FIXED"
                        ? "border-[#10b77f] bg-[#10b77f]/10 text-[#10b77f] dark:bg-[#10b77f]/20"
                        : "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800"
                    }`}
                  >
                    Fixa
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpenseType("VARIABLE")}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      expenseType === "VARIABLE"
                        ? "border-[#10b77f] bg-[#10b77f]/10 text-[#10b77f] dark:bg-[#10b77f]/20"
                        : "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800"
                    }`}
                  >
                    Variável
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Status
                </label>
                <select
                  value={expenseStatus}
                  onChange={(e) => setExpenseStatus(e.target.value as "PAID" | "PENDING" | "OVERDUE")}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-[#10b77f] focus:ring-2 focus:ring-[#10b77f]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-[#10b77f]"
                >
                  <option value="PENDING">Pendente</option>
                  <option value="PAID">Paga</option>
                  <option value="OVERDUE">Atrasada</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Descrição (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Observações adicionais..."
              rows={2}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-[#10b77f] focus:ring-2 focus:ring-[#10b77f]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-[#10b77f]"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-[#10b77f] focus:ring-[#10b77f]"
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">Transação recorrente</span>
          </label>

          {errors.submit && <p className="text-sm text-rose-500">{errors.submit}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-[#10b77f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#10b77f]/90 disabled:opacity-60"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Salvando...
                </span>
              ) : (
                "Salvar"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

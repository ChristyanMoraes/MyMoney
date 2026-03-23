"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AppLayout } from "@/components/AppLayout";
import { MonthFilter } from "@/components/MonthFilter";
import { TransactionModal, type EditTransaction } from "@/components/TransactionModal";

type Transaction = {
  id: string;
  type: "EXPENSE" | "INCOME";
  description: string;
  amount: number;
  date: string;
  category?: { name: string } | null;
  categoryId?: string | null;
  creditCardId?: string | null;
  notes?: string | null;
  isRecurring?: boolean;
  expenseType?: "FIXED" | "VARIABLE" | null;
  isPaid?: boolean;
  installments?: number | null;
  installmentNumber?: number | null;
  purchasedBy?: string | null;
};

export default function MovimentacoesPage() {
  const { data: session } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState<EditTransaction | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(t: Transaction) {
    if (!confirm(`Excluir a movimentação "${t.description}"? Esta ação não pode ser desfeita.`)) return;
    setDeletingId(t.id);
    try {
      const res = await fetch(`/api/transactions/${t.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "Erro ao excluir movimentação");
        return;
      }
      loadTransactions();
    } catch {
      alert("Erro ao excluir movimentação");
    } finally {
      setDeletingId(null);
    }
  }

  async function updateStatus(t: Transaction, isPaid: boolean) {
    if (t.type !== "EXPENSE") return;
    setUpdatingStatusId(t.id);
    try {
      const res = await fetch(`/api/transactions/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPaid }),
      });
      if (res.ok) loadTransactions();
    } finally {
      setUpdatingStatusId(null);
    }
  }

  function openModalForNew() {
    setEditTransaction(null);
    setModalOpen(true);
  }

  function openModalForEdit(t: Transaction) {
    setEditTransaction({
      id: t.id,
      type: t.type,
      description: t.description,
      amount: Number(t.amount),
      date: t.date,
      categoryId: t.categoryId,
      creditCardId: t.creditCardId,
      notes: t.notes,
      isRecurring: t.isRecurring,
      expenseType: t.expenseType,
      isPaid: t.isPaid,
      installments: t.installments,
      installmentNumber: t.installmentNumber,
      purchasedBy: t.purchasedBy,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditTransaction(null);
  }
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  async function loadTransactions() {
    setLoading(true);
    try {
      const res = await fetch(`/api/transactions?month=${month}&year=${year}`);
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTransactions();
  }, [month, year]);

  if (!session) return null;

  const list = Array.isArray(transactions) ? transactions : [];
  const expenses = list.filter((t) => t.type === "EXPENSE");
  const pendentes = expenses.filter((t) => !t.isPaid);
  const realizadas = expenses.filter((t) => t.isPaid);
  const totalPendentes = pendentes.reduce((s, t) => s + Number(t.amount), 0);
  const totalRealizadas = realizadas.reduce((s, t) => s + Number(t.amount), 0);

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  }

  return (
    <AppLayout user={session.user}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
              Movimentações
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Gerencie suas receitas e despesas
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <MonthFilter
              month={month}
              year={year}
              onChange={(m, y) => {
                setMonth(m);
                setYear(y);
              }}
            />
            <button
            type="button"
            onClick={openModalForNew}
            className="inline-flex items-center gap-2 rounded-xl bg-[#10b77f] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#10b77f]/90"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nova movimentação
          </button>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-sm dark:border-rose-800 dark:bg-rose-950/30">
            <p className="text-xs font-medium uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Despesas pendentes
            </p>
            <p className="mt-1 text-xl font-bold text-rose-700 dark:text-rose-300">
              {loading ? "—" : formatCurrency(totalPendentes)}
            </p>
            <p className="mt-0.5 text-xs text-rose-600/80 dark:text-rose-400/80">
              {pendentes.length} {pendentes.length === 1 ? "despesa" : "despesas"} a pagar
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/30">
            <p className="text-xs font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Despesas realizadas
            </p>
            <p className="mt-1 text-xl font-bold text-emerald-700 dark:text-emerald-300">
              {loading ? "—" : formatCurrency(totalRealizadas)}
            </p>
            <p className="mt-0.5 text-xs text-emerald-600/80 dark:text-emerald-400/80">
              {realizadas.length} {realizadas.length === 1 ? "despesa" : "despesas"} pagas
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-[#1d2330]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Descrição</th>
                  <th className="px-4 py-3 font-medium">Categoria</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Valor</th>
                  <th className="w-20 px-4 py-3" aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center">
                      <div className="flex justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#10b77f] border-t-transparent" />
                      </div>
                    </td>
                  </tr>
                ) : list.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                          <svg
                            className="h-8 w-8 text-zinc-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-white">
                            Nenhuma transação neste mês
                          </p>
                          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                            Clique em &quot;Nova movimentação&quot; para começar
                          </p>
                          <button
                            type="button"
                            onClick={openModalForNew}
                            className="mt-4 rounded-lg bg-[#10b77f] px-4 py-2 text-sm font-medium text-white hover:bg-[#10b77f]/90"
                          >
                            Nova movimentação
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  list.map((t) => (
                    <tr
                      key={t.id}
                      className="border-t border-zinc-100 transition hover:bg-zinc-50/50 dark:border-zinc-800 dark:hover:bg-zinc-800/30"
                    >
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                        {new Date(t.date).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-zinc-900 dark:text-white">
                          {t.description}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                        {t.category?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {t.type === "EXPENSE" ? (
                          <select
                            value={t.isPaid ? "realizada" : "pendente"}
                            onChange={(e) => updateStatus(t, e.target.value === "realizada")}
                            disabled={updatingStatusId === t.id}
                            className={`rounded-lg border px-2 py-1.5 text-xs font-medium outline-none transition focus:ring-2 disabled:opacity-50 [&>option]:bg-white [&>option]:text-zinc-900 dark:[&>option]:bg-zinc-800 dark:[&>option]:text-white ${
                              t.isPaid
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
                                : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400"
                            }`}
                          >
                            <option value="pendente">Pendente</option>
                            <option value="realizada">Realizada</option>
                          </select>
                        ) : (
                          <span className="inline-block rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                            Realizada
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`font-medium ${
                            t.type === "EXPENSE"
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-[#10b77f]"
                          }`}
                        >
                          {t.type === "EXPENSE" ? "-" : "+"} R${" "}
                          {Number(t.amount).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openModalForEdit(t)}
                            className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                            aria-label="Editar transação"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(t)}
                            disabled={deletingId === t.id}
                            className="rounded-lg p-2 text-zinc-500 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 disabled:opacity-50"
                            aria-label="Excluir transação"
                          >
                            {deletingId === t.id ? (
                              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
                            ) : (
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <TransactionModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSuccess={loadTransactions}
        editTransaction={editTransaction}
      />
    </AppLayout>
  );
}

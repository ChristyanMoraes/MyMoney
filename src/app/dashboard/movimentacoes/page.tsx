"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AppLayout } from "@/components/AppLayout";
import { TransactionModal, type TransactionType } from "@/components/TransactionModal";

type Transaction = {
  id: string;
  type: "EXPENSE" | "INCOME";
  description: string;
  amount: number;
  date: string;
  category?: { name: string } | null;
};

export default function MovimentacoesPage() {
  const { data: session } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<TransactionType>("EXPENSE");

  async function loadTransactions() {
    try {
      const res = await fetch("/api/transactions");
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
  }, []);

  function openModal(type: TransactionType) {
    setModalType(type);
    setModalOpen(true);
  }

  if (!session) return null;

  const list = Array.isArray(transactions) ? transactions : [];

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
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => openModal("INCOME")}
              className="inline-flex items-center gap-2 rounded-xl bg-[#10b77f] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#10b77f]/90"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nova receita
            </button>
            <button
              type="button"
              onClick={() => openModal("EXPENSE")}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-rose-500 bg-rose-50 px-5 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 dark:border-rose-600 dark:bg-rose-950/50 dark:text-rose-400 dark:hover:bg-rose-950"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
              Nova despesa
            </button>
          </div>
        </div>

        <section className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-[#1d2330]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Descrição</th>
                  <th className="px-4 py-3 font-medium">Categoria</th>
                  <th className="px-4 py-3 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center">
                      <div className="flex justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#10b77f] border-t-transparent" />
                      </div>
                    </td>
                  </tr>
                ) : list.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center">
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
                            Nenhuma transação cadastrada
                          </p>
                          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                            Clique em &quot;Nova receita&quot; ou &quot;Nova despesa&quot; para começar
                          </p>
                          <div className="mt-4 flex justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => openModal("INCOME")}
                              className="rounded-lg bg-[#10b77f] px-4 py-2 text-sm font-medium text-white hover:bg-[#10b77f]/90"
                            >
                              Nova receita
                            </button>
                            <button
                              type="button"
                              onClick={() => openModal("EXPENSE")}
                              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                            >
                              Nova despesa
                            </button>
                          </div>
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
        onClose={() => setModalOpen(false)}
        onSuccess={loadTransactions}
        initialType={modalType}
      />
    </AppLayout>
  );
}

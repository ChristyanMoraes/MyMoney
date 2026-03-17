"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/ThemeToggle";

type Transaction = {
  id: string;
  type: "EXPENSE" | "INCOME";
  description: string;
  amount: number;
  date: string;
  category?: {
    name: string;
  } | null;
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [loading, setLoading] = useState(false);

  async function loadTransactions() {
    try {
      const res = await fetch("/api/transactions");
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch {
      setTransactions([]);
    }
  }

  useEffect(() => {
    loadTransactions();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description || !amount) return;
    setLoading(true);
    try {
      await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          description,
          amount: Number(amount),
          date: new Date(date).toISOString(),
        }),
      });
      setDescription("");
      setAmount("");
      await loadTransactions();
    } finally {
      setLoading(false);
    }
  }

  const list = Array.isArray(transactions) ? transactions : [];
  const totalExpenses = list
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalIncome = list
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8 font-sans text-zinc-900 dark:bg-[#131720] dark:text-white">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-[#10b77f]">
                My Money
              </h1>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  {session?.user?.name}
                </span>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-[#10b77f]"
                >
                  Sair
                </button>
              </div>
            </div>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Cadastre suas despesas e receitas e acompanhe o resultado do mês.
            </p>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="rounded-xl bg-white px-4 py-2 shadow-sm dark:bg-[#1d2330] dark:shadow-none">
              <span className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Total receitas
              </span>
              <span className="text-lg font-semibold text-[#10b77f]">
                R$ {totalIncome.toFixed(2)}
              </span>
            </div>
            <div className="rounded-xl bg-white px-4 py-2 shadow-sm dark:bg-[#1d2330] dark:shadow-none">
              <span className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Total despesas
              </span>
              <span className="text-lg font-semibold text-rose-500 dark:text-rose-400">
                R$ {totalExpenses.toFixed(2)}
              </span>
            </div>
          </div>
        </header>

        <main className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm dark:bg-[#1d2330] dark:shadow-none">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Nova transação
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                <button
                  type="button"
                  onClick={() => setType("EXPENSE")}
                  className={`flex-1 rounded-full border px-3 py-2 ${
                    type === "EXPENSE"
                      ? "border-rose-400 bg-rose-100 text-rose-700 dark:border-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
                      : "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800"
                  }`}
                >
                  Despesa
                </button>
                <button
                  type="button"
                  onClick={() => setType("INCOME")}
                  className={`flex-1 rounded-full border px-3 py-2 ${
                    type === "INCOME"
                      ? "border-[#10b77f] bg-[#10b77f]/10 text-[#10b77f] dark:bg-[#10b77f]/20"
                      : "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800"
                  }`}
                >
                  Receita
                </button>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Descrição
                </label>
                <input
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-[#10b77f] dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-[#10b77f]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Supermercado, Salário, Uber..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-[#10b77f] dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-[#10b77f]"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Data
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-[#10b77f] dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-[#10b77f]"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-[#10b77f] px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-[#10b77f]/90 disabled:opacity-60"
              >
                {loading ? "Salvando..." : "Adicionar transação"}
              </button>
            </form>
          </section>

          <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm dark:bg-[#1d2330] dark:shadow-none">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                Últimas transações
              </h2>
            </div>
            <div className="max-h-[430px] overflow-auto rounded-xl border border-zinc-100 dark:border-zinc-800">
              <table className="min-w-full text-sm">
                <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Data</th>
                    <th className="px-3 py-2 text-left font-medium">
                      Descrição
                    </th>
                    <th className="px-3 py-2 text-right font-medium">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {list.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-3 py-6 text-center text-xs text-zinc-400 dark:text-zinc-500"
                      >
                        Nenhuma transação cadastrada ainda.
                      </td>
                    </tr>
                  ) : (
                    list.map((t) => (
                      <tr
                        key={t.id}
                        className="border-t border-zinc-100 hover:bg-zinc-50/60 dark:border-zinc-800 dark:hover:bg-zinc-800/60"
                      >
                        <td className="px-3 py-2 align-middle text-xs text-zinc-500 dark:text-zinc-400">
                          {new Date(t.date).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-3 py-2 align-middle">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-zinc-900 dark:text-white">
                              {t.description}
                            </span>
                            {t.category && (
                              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                {t.category.name}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 align-middle text-right">
                          <span
                            className={
                              t.type === "EXPENSE"
                                ? "font-medium text-rose-600 dark:text-rose-400"
                                : "font-medium text-[#10b77f]"
                            }
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
        </main>
      </div>
    </div>
  );
}

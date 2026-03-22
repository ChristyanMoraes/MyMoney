"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { AppLayout } from "@/components/AppLayout";
import { MonthFilter } from "@/components/MonthFilter";

type Category = { id: string; name: string };

type Transaction = {
  id: string;
  description: string;
  amount: number;
  date: string;
  paidAt: string | null;
  isPaid: boolean | null;
  category?: { id: string; name: string } | null;
};

export default function GastosPorCategoriaPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const categoryId = params.categoryId as string;

  const now = new Date();
  const qMonth = searchParams.get("month");
  const qYear = searchParams.get("year");
  const [month, setMonth] = useState(qMonth ? parseInt(qMonth, 10) : now.getMonth() + 1);
  const [year, setYear] = useState(qYear ? parseInt(qYear, 10) : now.getFullYear());
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const m = searchParams.get("month");
    const y = searchParams.get("year");
    if (m) setMonth(parseInt(m, 10));
    if (y) setYear(parseInt(y, 10));
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!categoryId) return;
    setLoading(true);
    fetch(`/api/transactions?month=${month}&year=${year}&categoryId=${categoryId}`)
      .then((r) => r.json())
      .then((data) => setTransactions(Array.isArray(data) ? data : []))
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false));
  }, [categoryId, month, year]);

  const currentCategory = categories.find((c) => c.id === categoryId);
  const currentIndex = categories.findIndex((c) => c.id === categoryId);
  const prevCategory = currentIndex > 0 ? categories[currentIndex - 1] : null;
  const nextCategory = currentIndex >= 0 && currentIndex < categories.length - 1 ? categories[currentIndex + 1] : null;

  function handleCategoryChange(newCategoryId: string) {
    router.push(
      `/dashboard/gastos-por-categoria/${newCategoryId}?month=${month}&year=${year}`
    );
  }

  if (!session) return null;

  const total = transactions.reduce((s, t) => s + Number(t.amount), 0);

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  }

  function formatDate(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("pt-BR");
  }

  return (
    <AppLayout user={session.user}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="mb-2 inline-flex items-center gap-1 text-sm text-zinc-500 transition hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar ao Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
              Gastos por categoria
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Detalhamento das despesas na categoria selecionada
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => prevCategory && handleCategoryChange(prevCategory.id)}
                disabled={!prevCategory}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-white"
                aria-label="Categoria anterior"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="min-w-[180px]">
                <label htmlFor="category-select" className="sr-only">
                  Selecione a categoria
                </label>
                <select
                  id="category-select"
                  value={categoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-[#10b77f] focus:ring-1 focus:ring-[#10b77f] dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-[#10b77f] [&>option]:bg-white [&>option]:text-zinc-900 dark:[&>option]:bg-zinc-800 dark:[&>option]:text-white"
                >
                  {categories.length === 0 ? (
                    <option value={categoryId}>
                      {currentCategory?.name ?? "Carregando..."}
                    </option>
                  ) : (
                    categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <button
                type="button"
                onClick={() => nextCategory && handleCategoryChange(nextCategory.id)}
                disabled={!nextCategory}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-white"
                aria-label="Próxima categoria"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <MonthFilter
              month={month}
              year={year}
              onChange={(m, y) => {
                setMonth(m);
                setYear(y);
              }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-[#1d2330]">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Total no mês
          </p>
          <p className="mt-1 text-xl font-bold text-rose-600 dark:text-rose-400">
            {loading ? "—" : formatCurrency(total)}
          </p>
        </div>

        <section className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-[#1d2330]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-4 py-3 text-left font-medium">Descrição</th>
                  <th className="px-4 py-3 text-left font-medium">Data venc.</th>
                  <th className="px-4 py-3 text-left font-medium">Data pagamento</th>
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
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center">
                      <p className="font-medium text-zinc-900 dark:text-white">
                        Nenhum gasto nesta categoria no mês selecionado
                      </p>
                      <Link
                        href="/dashboard"
                        className="mt-4 inline-block text-sm text-[#10b77f] hover:underline"
                      >
                        Voltar ao Dashboard
                      </Link>
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                    >
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">
                        {t.description}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {formatDate(t.date)}
                      </td>
                      <td className="px-4 py-3">
                        {t.isPaid && t.paidAt ? (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {formatDate(t.paidAt)}
                          </span>
                        ) : (
                          <span className="text-rose-600 dark:text-rose-400">Pendente</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-rose-600 dark:text-rose-400">
                        {formatCurrency(Number(t.amount))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

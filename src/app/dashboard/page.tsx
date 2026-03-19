"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { AppLayout } from "@/components/AppLayout";

type DashboardData = {
  summary: {
    balance: number;
    income: number;
    expenses: number;
    result: number;
    incomeCommitted: number;
    savedPercent: number;
    incomeChange: number;
    expenseChange: number;
    prevIncome: number;
    prevExpenses: number;
  };
  categoryRanking: { name: string; total: number }[];
  dailyData: { date: string; income: number; expense: number }[];
  transactions: Array<{
    id: string;
    type: string;
    description: string;
    amount: number;
    date: string;
    category?: { name: string } | null;
  }>;
  goals: Array<{ id: string; name: string; targetAmount: number; currentAmount: number }>;
  fixedExpenses: number;
};

const COLORS = ["#10b77f", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function SkeletonCard() {
  return (
    <div className="h-32 animate-pulse rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800/50" />
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => {
        if (!r.ok) throw new Error("Erro ao carregar");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (!session) return null;

  return (
    <AppLayout user={session.user}>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Dashboard Financeiro
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Visão geral do seu mês
          </p>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-400">
            {error}. Verifique se executou <code className="rounded bg-rose-200 px-1 dark:bg-rose-900">npx prisma migrate dev</code>.
          </div>
        ) : data ? (
          <>
            {/* Bloco 1: Cards de resumo */}
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-[#1d2330]">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Saldo atual
                </p>
                <p className={`mt-1 text-xl font-bold ${data.summary.balance >= 0 ? "text-[#10b77f]" : "text-rose-500"}`}>
                  {formatCurrency(data.summary.balance)}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-[#1d2330]">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Receitas do mês
                </p>
                <p className="mt-1 text-xl font-bold text-[#10b77f]">
                  {formatCurrency(data.summary.income)}
                </p>
                {data.summary.incomeChange !== 0 && (
                  <p className={`mt-0.5 text-xs ${data.summary.incomeChange > 0 ? "text-[#10b77f]" : "text-rose-500"}`}>
                    {data.summary.incomeChange > 0 ? "+" : ""}{data.summary.incomeChange}% vs mês anterior
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-[#1d2330]">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Despesas do mês
                </p>
                <p className="mt-1 text-xl font-bold text-rose-500">
                  {formatCurrency(data.summary.expenses)}
                </p>
                {data.summary.expenseChange !== 0 && (
                  <p className={`mt-0.5 text-xs ${data.summary.expenseChange > 0 ? "text-rose-500" : "text-[#10b77f]"}`}>
                    {data.summary.expenseChange > 0 ? "+" : ""}{data.summary.expenseChange}% vs mês anterior
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-[#1d2330]">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Resultado do mês
                </p>
                <p className={`mt-1 text-xl font-bold ${data.summary.result >= 0 ? "text-[#10b77f]" : "text-rose-500"}`}>
                  {formatCurrency(data.summary.result)}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-[#1d2330]">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Renda comprometida
                </p>
                <p className="mt-1 text-xl font-bold text-amber-500">
                  {data.summary.incomeCommitted.toFixed(1)}%
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-[#1d2330]">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Economizado
                </p>
                <p className={`mt-1 text-xl font-bold ${data.summary.savedPercent >= 0 ? "text-[#10b77f]" : "text-rose-500"}`}>
                  {data.summary.savedPercent.toFixed(1)}%
                </p>
              </div>
            </section>

            {/* Bloco 2: Alertas / Insights */}
            <section>
              <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
                Insights
              </h2>
              <div className="flex flex-wrap gap-3">
                {data.categoryRanking.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Sua maior categoria de despesa foi <strong>{data.categoryRanking[0].name}</strong>
                    </p>
                  </div>
                )}
                {data.summary.income > 0 && data.summary.incomeCommitted > 50 && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 dark:border-rose-900/50 dark:bg-rose-950/30">
                    <p className="text-sm font-medium text-rose-800 dark:text-rose-200">
                      Seus gastos fixos comprometem {data.summary.incomeCommitted.toFixed(0)}% da sua renda
                    </p>
                  </div>
                )}
                {data.summary.result > 0 && (
                  <div className="rounded-xl border border-[#10b77f]/30 bg-[#10b77f]/10 px-4 py-3 dark:bg-[#10b77f]/20">
                    <p className="text-sm font-medium text-[#10b77f]">
                      Saldo estimado no final do mês: {formatCurrency(data.summary.balance + data.summary.result)}
                    </p>
                  </div>
                )}
                {data.categoryRanking.length === 0 && data.summary.expenses === 0 && (
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/50">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Cadastre transações para ver insights personalizados.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <div className="grid gap-8 lg:grid-cols-2">
              {/* Bloco 3: Gastos por categoria */}
              <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-[#1d2330]">
                <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
                  Gastos por categoria
                </h2>
                {data.categoryRanking.length > 0 ? (
                  <>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data.categoryRanking}
                            dataKey="total"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                          >
                            {data.categoryRanking.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 space-y-2">
                      {data.categoryRanking.slice(0, 5).map((c, i) => (
                        <div key={c.name} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: COLORS[i % COLORS.length] }}
                            />
                            {c.name}
                          </span>
                          <span className="font-medium">{formatCurrency(c.total)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Nenhuma despesa categorizada este mês
                    </p>
                  </div>
                )}
              </section>

              {/* Bloco 4: Receitas vs Despesas */}
              <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-[#1d2330]">
                <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
                  Receitas vs Despesas
                </h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Receitas", value: data.summary.income, fill: "#10b77f" },
                        { name: "Despesas", value: data.summary.expenses, fill: "#ef4444" },
                      ]}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
                      <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                      <YAxis type="category" dataKey="name" width={80} />
                      <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>

            {/* Bloco 5: Fluxo diário */}
            <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-[#1d2330]">
              <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
                Fluxo diário do mês
              </h2>
              {data.dailyData.some((d) => d.income > 0 || d.expense > 0) ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.dailyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
                      <XAxis dataKey="date" tickFormatter={(v) => v.slice(8, 10)} />
                      <YAxis tickFormatter={(v) => `R$${v}`} />
                      <Tooltip
                        formatter={(v) => formatCurrency(Number(v ?? 0))}
                        labelFormatter={(l) => new Date(l).toLocaleDateString("pt-BR")}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="income" stroke="#10b77f" name="Receitas" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="expense" stroke="#ef4444" name="Despesas" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Nenhuma movimentação este mês
                  </p>
                </div>
              )}
            </section>

            <div className="grid gap-8 lg:grid-cols-2">
              {/* Bloco 6: Metas financeiras */}
              <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-[#1d2330]">
                <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
                  Metas financeiras
                </h2>
                {data.goals.length > 0 ? (
                  <div className="space-y-4">
                    {data.goals.map((g) => {
                      const pct = Number(g.targetAmount) > 0
                        ? (Number(g.currentAmount) / Number(g.targetAmount)) * 100
                        : 0;
                      return (
                        <div key={g.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{g.name}</span>
                            <span>
                              {formatCurrency(Number(g.currentAmount))} / {formatCurrency(Number(g.targetAmount))}
                            </span>
                          </div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                            <div
                              className="h-full rounded-full bg-[#10b77f] transition-all"
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <p className="mt-1 text-xs text-zinc-500">{pct.toFixed(0)}% concluído</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 py-12 dark:border-zinc-700">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Nenhuma meta cadastrada
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      Em breve você poderá criar metas de economia
                    </p>
                  </div>
                )}
              </section>

              {/* Bloco 7: Últimas movimentações */}
              <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-[#1d2330]">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                    Últimas movimentações
                  </h2>
                  <Link
                    href="/dashboard/movimentacoes"
                    className="text-sm font-medium text-[#10b77f] hover:underline"
                  >
                    Ver todas
                  </Link>
                </div>
                {data.transactions.length > 0 ? (
                  <div className="space-y-2">
                    {data.transactions.slice(0, 5).map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2 dark:border-zinc-800"
                      >
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-white">
                            {t.description}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {new Date(t.date).toLocaleDateString("pt-BR")}
                            {t.category && ` • ${t.category.name}`}
                          </p>
                        </div>
                        <span
                          className={`font-medium ${
                            t.type === "EXPENSE" ? "text-rose-500" : "text-[#10b77f]"
                          }`}
                        >
                          {t.type === "EXPENSE" ? "-" : "+"}
                          {formatCurrency(Number(t.amount))}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 py-12 dark:border-zinc-700">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Nenhuma transação ainda
                    </p>
                    <Link
                      href="/dashboard/movimentacoes"
                      className="mt-2 text-sm font-medium text-[#10b77f] hover:underline"
                    >
                      Cadastrar primeira transação
                    </Link>
                  </div>
                )}
              </section>
            </div>
          </>
        ) : null}
      </div>
    </AppLayout>
  );
}

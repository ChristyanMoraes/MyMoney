"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
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
} from "recharts";
import { AppLayout } from "@/components/AppLayout";
import { MonthFilter } from "@/components/MonthFilter";

type CreditCard = { id: string; name: string; last4?: string | null };

type Transaction = {
  id: string;
  description: string;
  amount: number;
  date: string;
  paidAt: string | null;
  isPaid: boolean | null;
  category?: { id: string; name: string } | null;
  installments?: number | null;
  installmentNumber?: number | null;
  purchasedBy?: string | null;
};

const COLORS = ["#10b77f", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

export default function CartaoCreditoPage() {
  const { data: session } = useSession();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCardName, setNewCardName] = useState("");
  const [newCardLast4, setNewCardLast4] = useState("");
  const [newCardClosing, setNewCardClosing] = useState("10");
  const [newCardDue, setNewCardDue] = useState("15");
  const [addingCard, setAddingCard] = useState(false);

  useEffect(() => {
    fetch("/api/credit-cards")
      .then((r) => r.json())
      .then((data) => {
        const cards = Array.isArray(data) ? data : [];
        setCreditCards(cards);
        if (cards.length > 0 && !selectedCardId) setSelectedCardId(cards[0].id);
      })
      .catch(() => setCreditCards([]));
  }, []);

  useEffect(() => {
    if (!selectedCardId) {
      setLoading(false);
      setTransactions([]);
      return;
    }
    setLoading(true);
    fetch(`/api/transactions?month=${month}&year=${year}&creditCardId=${selectedCardId}`)
      .then((r) => r.json())
      .then((data) => setTransactions(Array.isArray(data) ? data : []))
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false));
  }, [selectedCardId, month, year]);

  if (!session) return null;

  const total = transactions.reduce((s, t) => s + Number(t.amount), 0);
  const selectedCard = creditCards.find((c) => c.id === selectedCardId);

  const byCategory = transactions.reduce(
    (acc, t) => {
      const name = t.category?.name ?? "Sem categoria";
      if (!acc[name]) acc[name] = 0;
      acc[name] += Number(t.amount);
      return acc;
    },
    {} as Record<string, number>
  );
  const categoryRanking = Object.entries(byCategory)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);

  const byPurchasedBy = transactions.reduce(
    (acc, t) => {
      const who = t.purchasedBy?.trim() || "Não informado";
      if (!acc[who]) acc[who] = 0;
      acc[who] += Number(t.amount);
      return acc;
    },
    {} as Record<string, number>
  );
  const purchasedByRanking = Object.entries(byPurchasedBy)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  }

  function formatDate(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("pt-BR");
  }

  function parcelLabel(t: Transaction) {
    if (t.installments && t.installments > 1 && t.installmentNumber) {
      return `${t.installmentNumber}/${t.installments}`;
    }
    return "À vista";
  }

  async function handleAddCard(e: React.FormEvent) {
    e.preventDefault();
    if (!newCardName.trim()) return;
    setAddingCard(true);
    try {
      const res = await fetch("/api/credit-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCardName.trim(),
          last4: newCardLast4.trim().length === 4 ? newCardLast4 : null,
          closingDay: parseInt(newCardClosing, 10),
          dueDay: parseInt(newCardDue, 10),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "Erro ao cadastrar cartão");
        return;
      }
      setCreditCards((prev) => [...prev, data]);
      setSelectedCardId(data.id);
      setShowAddCard(false);
      setNewCardName("");
      setNewCardLast4("");
    } catch {
      alert("Erro ao cadastrar cartão");
    } finally {
      setAddingCard(false);
    }
  }

  if (creditCards.length === 0 && !showAddCard) {
    return (
      <AppLayout user={session.user}>
        <div className="flex flex-col items-center justify-center py-16">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <svg className="h-10 w-10 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-white">
            Nenhum cartão cadastrado
          </h2>
          <p className="mt-2 max-w-sm text-center text-sm text-zinc-500 dark:text-zinc-400">
            Cadastre seu primeiro cartão para acompanhar os gastos detalhadamente.
          </p>
          <button
            type="button"
            onClick={() => setShowAddCard(true)}
            className="mt-6 rounded-lg bg-[#10b77f] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#10b77f]/90"
          >
            Cadastrar cartão
          </button>
          <Link
            href="/dashboard"
            className="mt-4 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
          >
            Voltar ao Dashboard
          </Link>
        </div>
      </AppLayout>
    );
  }

  if (creditCards.length === 0 && showAddCard) {
    return (
      <AppLayout user={session.user}>
        <div className="mx-auto max-w-md space-y-6">
          <div>
            <Link
              href="/dashboard"
              className="mb-2 inline-flex items-center gap-1 text-sm text-zinc-500 transition hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar
            </Link>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
              Cadastrar cartão de crédito
            </h1>
          </div>
          <form onSubmit={handleAddCard} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-[#1d2330]">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Nome do cartão
              </label>
              <input
                type="text"
                value={newCardName}
                onChange={(e) => setNewCardName(e.target.value)}
                placeholder="Ex: Nubank, Itaú..."
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Últimos 4 dígitos (opcional)
              </label>
              <input
                type="text"
                value={newCardLast4}
                onChange={(e) => setNewCardLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="Ex: 1234"
                maxLength={4}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Dia de fechamento
                </label>
                <input
                  type="number"
                  min={1}
                  max={28}
                  value={newCardClosing}
                  onChange={(e) => setNewCardClosing(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Dia de vencimento
                </label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={newCardDue}
                  onChange={(e) => setNewCardDue(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowAddCard(false)}
                className="flex-1 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium dark:border-zinc-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={addingCard}
                className="flex-1 rounded-lg bg-[#10b77f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#10b77f]/90 disabled:opacity-60"
              >
                {addingCard ? "Salvando..." : "Cadastrar"}
              </button>
            </div>
          </form>
        </div>
      </AppLayout>
    );
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
              Gastos do cartão de crédito
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Detalhamento das compras no cartão selecionado
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="min-w-[200px]">
                <label htmlFor="card-select" className="sr-only">
                  Cartão
                </label>
                <select
                id="card-select"
                value={selectedCardId}
                onChange={(e) => setSelectedCardId(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-[#10b77f] dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-[#10b77f]"
              >
                {creditCards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.last4 ? ` ****${c.last4}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setShowAddCard(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              aria-label="Adicionar cartão"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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
            Total no mês{selectedCard ? ` — ${selectedCard.name}` : ""}
          </p>
          <p className="mt-1 text-xl font-bold text-rose-600 dark:text-rose-400">
            {loading ? "—" : formatCurrency(total)}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {categoryRanking.length > 0 && (
            <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-[#1d2330]">
              <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
                Gastos por categoria
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryRanking}
                      dataKey="total"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {categoryRanking.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {purchasedByRanking.length > 0 && (
            <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-[#1d2330]">
              <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
                Gastos por responsável
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={purchasedByRanking} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(v) => formatCurrency(v)} />
                    <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
                    <Bar dataKey="total" fill="#10b77f" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}
        </div>

        {showAddCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddCard(false)} aria-hidden />
            <div className="relative z-10 w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-[#1d2330]">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                Cadastrar cartão
              </h3>
              <form onSubmit={handleAddCard} className="mt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Nome do cartão</label>
                  <input
                    type="text"
                    value={newCardName}
                    onChange={(e) => setNewCardName(e.target.value)}
                    placeholder="Ex: Nubank, Itaú..."
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Últimos 4 dígitos (opcional)</label>
                  <input
                    type="text"
                    value={newCardLast4}
                    onChange={(e) => setNewCardLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="1234"
                    maxLength={4}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Dia fechamento</label>
                    <input
                      type="number"
                      min={1}
                      max={28}
                      value={newCardClosing}
                      onChange={(e) => setNewCardClosing(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Dia vencimento</label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={newCardDue}
                      onChange={(e) => setNewCardDue(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddCard(false)}
                    className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={addingCard}
                    className="flex-1 rounded-lg bg-[#10b77f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#10b77f]/90 disabled:opacity-60"
                  >
                    {addingCard ? "Salvando..." : "Cadastrar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <section className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-[#1d2330]">
          <h2 className="border-b border-zinc-200 px-4 py-3 text-lg font-semibold text-zinc-900 dark:border-zinc-800 dark:text-white">
            Lista de compras
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-4 py-3 text-left font-medium">Descrição</th>
                  <th className="px-4 py-3 text-left font-medium">Categoria</th>
                  <th className="px-4 py-3 text-left font-medium">Parcelas</th>
                  <th className="px-4 py-3 text-left font-medium">Responsável</th>
                  <th className="px-4 py-3 text-left font-medium">Data</th>
                  <th className="px-4 py-3 text-right font-medium">Valor</th>
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
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <p className="font-medium text-zinc-900 dark:text-white">
                        Nenhuma compra no cartão neste mês
                      </p>
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
                        {t.category?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {parcelLabel(t)}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {t.purchasedBy?.trim() || "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {formatDate(t.date)}
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

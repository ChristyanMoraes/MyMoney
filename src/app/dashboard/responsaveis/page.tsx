"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { AppLayout } from "@/components/AppLayout";

type ResponsiblePerson = {
  id: string;
  name: string;
  sortOrder: number;
};

export default function ResponsaveisPage() {
  const { data: session } = useSession();
  const [people, setPeople] = useState<ResponsiblePerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/responsible-people");
      const data = await res.json();
      setPeople(Array.isArray(data) ? data : []);
    } catch {
      setPeople([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    try {
      const res = await fetch("/api/responsible-people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(typeof data.error === "string" ? data.error : "Erro ao adicionar");
        return;
      }
      setNewName("");
      load();
    } catch {
      alert("Erro ao adicionar");
    } finally {
      setAdding(false);
    }
  }

  async function saveEdit(id: string) {
    const name = editName.trim();
    if (!name) return;
    setSavingId(id);
    try {
      const res = await fetch(`/api/responsible-people/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(typeof data.error === "string" ? data.error : "Erro ao salvar");
        return;
      }
      setEditingId(null);
      load();
    } catch {
      alert("Erro ao salvar");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(p: ResponsiblePerson) {
    if (
      !confirm(
        `Remover "${p.name}" da lista? Transações antigas mantêm o nome registado na altura da compra.`,
      )
    ) {
      return;
    }
    setDeletingId(p.id);
    try {
      const res = await fetch(`/api/responsible-people/${p.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(typeof data.error === "string" ? data.error : "Erro ao remover");
        return;
      }
      load();
    } catch {
      alert("Erro ao remover");
    } finally {
      setDeletingId(null);
    }
  }

  if (!session) return null;

  return (
    <AppLayout user={session.user}>
      <div className="space-y-6">
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
            Responsáveis pelas compras
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Quem pode aparecer ao registar compras no cartão ou em movimentações. Pode adicionar,
            editar ou remover a qualquer momento.
          </p>
        </div>

        <form
          onSubmit={handleAdd}
          className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-[#1d2330] sm:flex-row sm:items-end"
        >
          <div className="min-w-0 flex-1">
            <label htmlFor="new-resp" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Novo responsável
            </label>
            <input
              id="new-resp"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome"
              maxLength={100}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={adding || !newName.trim()}
            className="rounded-lg bg-[#10b77f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#10b77f]/90 disabled:opacity-50"
          >
            {adding ? "Adicionando…" : "Adicionar"}
          </button>
        </form>

        <section className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-[#1d2330]">
          <h2 className="border-b border-zinc-200 px-4 py-3 text-lg font-semibold text-zinc-900 dark:border-zinc-800 dark:text-white">
            Lista ({people.length})
          </h2>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#10b77f] border-t-transparent" />
              </div>
            ) : people.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-zinc-500">
                Nenhum responsável. Adicione o primeiro acima.
              </p>
            ) : (
              people.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  {editingId === p.id ? (
                    <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        maxLength={100}
                        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white sm:max-w-xs"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => saveEdit(p.id)}
                          disabled={savingId === p.id || !editName.trim()}
                          className="rounded-lg bg-[#10b77f] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs dark:border-zinc-700"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="font-medium text-zinc-900 dark:text-white">{p.name}</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(p.id);
                            setEditName(p.name);
                          }}
                          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium dark:border-zinc-700"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p)}
                          disabled={deletingId === p.id}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 dark:border-red-900/50 dark:text-red-400 disabled:opacity-50"
                        >
                          {deletingId === p.id ? "…" : "Remover"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

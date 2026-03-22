"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AppLayout } from "@/components/AppLayout";
import { CategoryModal, type EditCategory } from "@/components/CategoryModal";

const TYPE_LABELS: Record<string, string> = {
  ESSENTIAL: "Essencial",
  NON_ESSENTIAL: "Não essencial",
  SUBSCRIPTION: "Assinatura",
  INVESTMENT: "Investimento",
  DEBT: "Dívida",
  OTHER: "Outros",
};

type Category = {
  id: string;
  name: string;
  type: string;
  color?: string | null;
  description?: string | null;
};

export default function CategoriasPage() {
  const { data: session } = useSession();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<EditCategory | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadCategories() {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function openModalForNew() {
    setEditCategory(null);
    setModalOpen(true);
  }

  function openModalForEdit(c: Category) {
    setEditCategory({
      id: c.id,
      name: c.name,
      type: c.type,
      color: c.color,
      description: c.description,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditCategory(null);
  }

  async function handleDelete(c: Category) {
    if (!confirm(`Excluir a categoria "${c.name}"? Esta ação não pode ser desfeita.`)) return;

    setDeletingId(c.id);
    try {
      const res = await fetch(`/api/categories/${c.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.error || "Erro ao excluir categoria");
        return;
      }
      loadCategories();
    } catch {
      alert("Erro ao excluir categoria");
    } finally {
      setDeletingId(null);
    }
  }

  if (!session) return null;

  const list = Array.isArray(categories) ? categories : [];

  return (
    <AppLayout user={session.user}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
              Categorias
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Gerencie as categorias para suas transações
            </p>
          </div>
          <button
            type="button"
            onClick={openModalForNew}
            className="inline-flex items-center gap-2 rounded-xl bg-[#10b77f] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#10b77f]/90"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nova categoria
          </button>
        </div>

        <section className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-[#1d2330]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="w-24 px-4 py-3" aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center">
                      <div className="flex justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#10b77f] border-t-transparent" />
                      </div>
                    </td>
                  </tr>
                ) : list.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-12 text-center">
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
                              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-white">
                            Nenhuma categoria cadastrada
                          </p>
                          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                            Clique em &quot;Nova categoria&quot; para começar
                          </p>
                          <button
                            type="button"
                            onClick={openModalForNew}
                            className="mt-4 rounded-lg bg-[#10b77f] px-4 py-2 text-sm font-medium text-white hover:bg-[#10b77f]/90"
                          >
                            Nova categoria
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  list.map((c) => (
                    <tr
                      key={c.id}
                      className="border-t border-zinc-100 transition hover:bg-zinc-50/50 dark:border-zinc-800 dark:hover:bg-zinc-800/30"
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-zinc-900 dark:text-white">
                          {c.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                        {TYPE_LABELS[c.type] ?? c.type}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openModalForEdit(c)}
                            className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                            aria-label="Editar categoria"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(c)}
                            disabled={deletingId === c.id}
                            className="rounded-lg p-2 text-zinc-500 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 disabled:opacity-50"
                            aria-label="Excluir categoria"
                          >
                            {deletingId === c.id ? (
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

      <CategoryModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSuccess={loadCategories}
        editCategory={editCategory}
      />
    </AppLayout>
  );
}

"use client";

import { useEffect, useState } from "react";

const TYPE_OPTIONS = [
  { value: "ESSENTIAL", label: "Essencial" },
  { value: "NON_ESSENTIAL", label: "Não essencial" },
  { value: "SUBSCRIPTION", label: "Assinatura" },
  { value: "INVESTMENT", label: "Investimento" },
  { value: "DEBT", label: "Dívida" },
  { value: "OTHER", label: "Outros" },
] as const;

export type EditCategory = {
  id: string;
  name: string;
  type: string;
  color?: string | null;
  description?: string | null;
};

type CategoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editCategory?: EditCategory | null;
};

export function CategoryModal({
  isOpen,
  onClose,
  onSuccess,
  editCategory = null,
}: CategoryModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState("ESSENTIAL");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (editCategory) {
        setName(editCategory.name);
        setType(editCategory.type);
        setDescription(editCategory.description || "");
      } else {
        setName("");
        setType("ESSENTIAL");
        setDescription("");
      }
      setErrors({});
    }
  }, [isOpen, editCategory]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Nome é obrigatório";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const body = { name: name.trim(), type, description: description || undefined };
      const url = editCategory ? `/api/categories/${editCategory.id}` : "/api/categories";
      const method = editCategory ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors({ submit: data.error || "Erro ao salvar categoria" });
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setErrors({ submit: "Erro ao salvar categoria" });
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
        aria-labelledby="category-modal-title"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h2 id="category-modal-title" className="text-lg font-semibold text-zinc-900 dark:text-white">
            {editCategory ? "Editar categoria" : "Nova categoria"}
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
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Nome
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Alimentação, Transporte..."
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-[#10b77f] focus:ring-2 focus:ring-[#10b77f]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-[#10b77f]"
            />
            {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Tipo
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-[#10b77f] focus:ring-2 focus:ring-[#10b77f]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-[#10b77f]"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Descrição (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Observações..."
              rows={2}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-[#10b77f] focus:ring-2 focus:ring-[#10b77f]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-[#10b77f]"
            />
          </div>

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

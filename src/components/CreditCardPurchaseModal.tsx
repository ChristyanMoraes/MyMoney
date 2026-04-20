"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Category = { id: string; name: string; type: string };

type ResponsiblePerson = { id: string; name: string };

type CreditCardPurchaseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  creditCardId: string;
  onSaved: () => void;
};

export function CreditCardPurchaseModal({
  isOpen,
  onClose,
  creditCardId,
  onSaved,
}: CreditCardPurchaseModalProps) {
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [totalStr, setTotalStr] = useState("");
  const [installmentsStr, setInstallmentsStr] = useState("1");
  const [manualParcelStr, setManualParcelStr] = useState("");
  const [useManualParcel, setUseManualParcel] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [categoryId, setCategoryId] = useState("");
  const [responsibleId, setResponsibleId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [responsiblePeople, setResponsiblePeople] = useState<ResponsiblePerson[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const installments = Math.max(1, Math.min(60, parseInt(installmentsStr, 10) || 1));
  const totalNum = parseFloat(totalStr.replace(",", ".")) || 0;

  const autoParcel = useMemo(() => {
    if (installments <= 1 || totalNum <= 0) return null;
    return Number((totalNum / installments).toFixed(2));
  }, [installments, totalNum]);

  async function loadResponsiblePeople() {
    const r = await fetch("/api/responsible-people");
    const data = await r.json();
    setResponsiblePeople(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    if (!isOpen) return;
    setDescription("");
    setNotes("");
    setTotalStr("");
    setInstallmentsStr("1");
    setManualParcelStr("");
    setUseManualParcel(false);
    setDate(new Date().toISOString().slice(0, 10));
    setCategoryId("");
    setResponsibleId("");
    setErrors({});
    Promise.all([
      fetch("/api/categories")
        .then((r) => r.json())
        .then((data) => setCategories(Array.isArray(data) ? data : [])),
      loadResponsiblePeople(),
    ]).catch(() => {
      setCategories([]);
      setResponsiblePeople([]);
    });
  }, [isOpen]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!description.trim()) e.description = "Descrição é obrigatória";
    if (!totalStr || totalNum <= 0) e.total = "Informe um valor total válido";
    if (!date) e.date = "Data é obrigatória";
    if (!categoryId) e.categoryId = "Selecione uma categoria";
    if (!responsibleId) e.responsibleId = "Selecione o responsável pela compra";

    if (installments > 1 && useManualParcel) {
      const manual = parseFloat(manualParcelStr.replace(",", ".")) || 0;
      if (manual <= 0) {
        e.manualParcel = "Informe o valor da parcela ou desative o modo manual";
      } else {
        const sumFirst = manual * (installments - 1);
        const last = Number((totalNum - sumFirst).toFixed(2));
        if (last <= 0) {
          e.manualParcel =
            "Valor da parcela × (nº parcelas − 1) não pode ser maior ou igual ao total";
        }
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;

    const person = responsiblePeople.find((p) => p.id === responsibleId);
    if (!person) {
      setErrors({ responsibleId: "Responsável inválido. Atualize a lista." });
      return;
    }

    const [y, m, d] = date.split("-").map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0));

    const body: Record<string, unknown> = {
      type: "EXPENSE",
      description: description.trim(),
      amount: totalNum,
      date: dateObj.toISOString(),
      categoryId,
      creditCardId,
      expenseType: "VARIABLE",
      isPaid: false,
      dueDate: dateObj.toISOString(),
      purchasedBy: person.name.trim(),
    };
    const obs = notes.trim();
    if (obs) body.notes = obs;

    if (installments > 1) {
      body.installments = installments;
      if (useManualParcel) {
        const manual = Number(
          parseFloat(manualParcelStr.replace(",", ".")).toFixed(2),
        );
        body.installmentAmount = manual;
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors({
          submit:
            typeof data.error === "string"
              ? data.error
              : "Erro ao salvar compra",
        });
        return;
      }
      onSaved();
      onClose();
    } catch {
      setErrors({ submit: "Erro ao salvar compra" });
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
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-[#1d2330]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cc-purchase-title"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h2
            id="cc-purchase-title"
            className="text-lg font-semibold text-zinc-900 dark:text-white"
          >
            Nova compra no cartão
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

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            O registo cria transações de despesa: aparecem aqui e em{" "}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Movimentações</span>.
          </p>

          <div>
            <label htmlFor="cc-desc" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Descrição
            </label>
            <input
              id="cc-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              placeholder="Ex.: Supermercado, Assinatura…"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600">{errors.description}</p>
            )}
          </div>

          <div>
            <label htmlFor="cc-notes" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Observação <span className="font-normal text-zinc-500">(opcional)</span>
            </label>
            <textarea
              id="cc-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full resize-y rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              placeholder="Detalhes extras, lembretes, local da compra…"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="cc-total" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Valor total (R$)
              </label>
              <input
                id="cc-total"
                type="text"
                inputMode="decimal"
                value={totalStr}
                onChange={(e) => setTotalStr(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                placeholder="0,00"
              />
              {errors.total && (
                <p className="mt-1 text-xs text-red-600">{errors.total}</p>
              )}
            </div>
            <div>
              <label htmlFor="cc-installments" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Parcelas
              </label>
              <input
                id="cc-installments"
                type="number"
                min={1}
                max={60}
                value={installmentsStr}
                onChange={(e) => setInstallmentsStr(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
          </div>

          {installments > 1 && totalNum > 0 && (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900/40">
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Valor sugerido por parcela (total / parcelas):{" "}
                <span className="font-semibold text-zinc-900 dark:text-white">
                  {autoParcel != null
                    ? new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(autoParcel)
                    : "—"}
                </span>
              </p>
              <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={useManualParcel}
                  onChange={(e) => {
                    setUseManualParcel(e.target.checked);
                    if (!e.target.checked) setManualParcelStr("");
                  }}
                  className="rounded border-zinc-300"
                />
                Definir valor de cada parcela manualmente (a última ajusta o total)
              </label>
              {useManualParcel && (
                <div className="mt-2">
                  <label htmlFor="cc-manual-parcel" className="sr-only">
                    Valor da parcela
                  </label>
                  <input
                    id="cc-manual-parcel"
                    type="text"
                    inputMode="decimal"
                    value={manualParcelStr}
                    onChange={(e) => setManualParcelStr(e.target.value)}
                    placeholder="Valor de cada parcela (1ª a penúltima)"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                  {errors.manualParcel && (
                    <p className="mt-1 text-xs text-red-600">{errors.manualParcel}</p>
                  )}
                </div>
              )}
            </div>
          )}

          <div>
            <label htmlFor="cc-date" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Data da compra
            </label>
            <input
              id="cc-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
            {errors.date && (
              <p className="mt-1 text-xs text-red-600">{errors.date}</p>
            )}
          </div>

          <div>
            <label htmlFor="cc-cat" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Categoria
            </label>
            <select
              id="cc-cat"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            >
              <option value="">Selecione…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="mt-1 text-xs text-red-600">{errors.categoryId}</p>
            )}
          </div>

          <div>
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="cc-who" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Responsável pela compra
              </label>
              <Link
                href="/dashboard/responsaveis"
                className="text-xs font-medium text-[#10b77f] hover:underline"
                onClick={onClose}
              >
                Gerir responsáveis
              </Link>
            </div>
            <select
              id="cc-who"
              value={responsibleId}
              onChange={(e) => setResponsibleId(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            >
              <option value="">Selecione…</option>
              {responsiblePeople.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {errors.responsibleId && (
              <p className="mt-1 text-xs text-red-600">{errors.responsibleId}</p>
            )}
            <button
              type="button"
              onClick={() => loadResponsiblePeople()}
              className="mt-2 text-xs text-zinc-500 underline dark:text-zinc-400"
            >
              Atualizar lista
            </button>
            {responsiblePeople.length === 0 && (
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                Ainda não há responsáveis.{" "}
                <Link href="/dashboard/responsaveis" className="font-medium underline" onClick={onClose}>
                  Cadastre pelo menos um
                </Link>{" "}
                antes de gravar a compra.
              </p>
            )}
          </div>

          {errors.submit && (
            <p className="text-sm text-red-600" role="alert">
              {errors.submit}
            </p>
          )}

          <div className="flex gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium dark:border-zinc-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-[#10b77f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#10b77f]/90 disabled:opacity-60"
            >
              {loading ? "Salvando…" : "Salvar compra"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

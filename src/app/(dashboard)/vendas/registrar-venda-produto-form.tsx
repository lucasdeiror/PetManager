"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registrarVendaProduto } from "../../../features/vendas/actions";
import type { Produto } from "../../../features/estoque/queries";

export function RegistrarVendaProdutoForm({ produtos }: { produtos: Produto[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const produtoId = Number(formData.get("produtoId"));
    const quantidade = Number(formData.get("quantidade"));

    startTransition(async () => {
      const result = await registrarVendaProduto(produtoId, quantidade);
      if (result.error) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
      router.refresh();
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="mt-3 flex flex-wrap items-end gap-3">
      <label className="grid gap-1 text-sm font-bold">
        Produto
        <select name="produtoId" required className="h-10 rounded-lg border-2 border-slate-200 bg-white px-2 text-sm font-semibold">
          <option value="">Selecione um produto</option>
          {produtos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome} (estoque {p.saldoEstoque})
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-bold">
        Quantidade
        <input
          name="quantidade"
          type="number"
          min="1"
          required
          className="h-10 w-24 rounded-lg border-2 border-slate-200 bg-white px-2 text-sm font-semibold"
        />
      </label>
      {error && (
        <p role="alert" className="w-full text-sm font-bold text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="h-10 rounded-xl bg-orange-600 px-4 text-sm font-black text-white hover:bg-orange-700 disabled:opacity-60"
      >
        {isPending ? "Salvando..." : "Registrar venda"}
      </button>
    </form>
  );
}

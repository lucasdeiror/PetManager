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
    <form ref={formRef} onSubmit={handleSubmit} className="mt-4 flex flex-wrap items-end gap-2 rounded-lg border p-3">
      <label className="grid gap-1 text-sm font-bold">
        Produto
        <select name="produtoId" required className="h-9 rounded-md border px-2 text-sm">
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
          className="h-9 w-24 rounded-md border px-2 text-sm"
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
        className="h-9 rounded-md bg-orange-600 px-4 text-sm font-bold text-white disabled:opacity-60"
      >
        {isPending ? "Salvando..." : "Registrar venda"}
      </button>
    </form>
  );
}

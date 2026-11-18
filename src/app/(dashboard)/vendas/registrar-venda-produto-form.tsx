"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registrarVendaProduto } from "../../../features/vendas/actions";
import type { Produto } from "../../../features/estoque/queries";
import { botaoPrimario, campoInput } from "../../../shared/tela/titulo-pagina";

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
      <label className="grid min-w-0 flex-1 basis-56 gap-1 text-sm font-bold">
        Produto
        <select name="produtoId" required className={`w-full ${campoInput}`}>
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
          className={`w-24 ${campoInput} tabular-nums`}
        />
      </label>
      {error && (
        <p role="alert" className="w-full text-sm font-bold text-red-700">
          {error}
        </p>
      )}
      <button type="submit" disabled={isPending} className={botaoPrimario}>
        {isPending ? "Salvando..." : "Registrar venda"}
      </button>
    </form>
  );
}

"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { criarProduto } from "../../../features/estoque/actions";

export function CriarProdutoForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const nome = String(formData.get("nome"));
    const categoria = String(formData.get("categoria"));
    const precoUnitario = Number(formData.get("precoUnitario"));
    const estoqueMinimo = Number(formData.get("estoqueMinimo"));
    const saldoInicial = Number(formData.get("saldoInicial") || 0);

    startTransition(async () => {
      const result = await criarProduto({ nome, categoria, precoUnitario, estoqueMinimo, saldoInicial });
      if (result.error) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
      router.refresh();
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="mt-4 grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
      <label className="grid gap-1 text-sm font-bold">
        Nome
        <input name="nome" required className="h-9 rounded-md border px-2 text-sm" />
      </label>
      <label className="grid gap-1 text-sm font-bold">
        Categoria
        <input name="categoria" required className="h-9 rounded-md border px-2 text-sm" />
      </label>
      <label className="grid gap-1 text-sm font-bold">
        Preço unitário (R$)
        <input name="precoUnitario" type="number" step="0.01" required className="h-9 rounded-md border px-2 text-sm" />
      </label>
      <label className="grid gap-1 text-sm font-bold">
        Estoque mínimo
        <input name="estoqueMinimo" type="number" required className="h-9 rounded-md border px-2 text-sm" />
      </label>
      <label className="grid gap-1 text-sm font-bold">
        Saldo inicial
        <input name="saldoInicial" type="number" defaultValue={0} className="h-9 rounded-md border px-2 text-sm" />
      </label>
      {error && (
        <p role="alert" className="text-sm font-bold text-red-700 sm:col-span-2">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="h-9 rounded-md bg-orange-600 text-sm font-bold text-white disabled:opacity-60 sm:col-span-2"
      >
        {isPending ? "Salvando..." : "Cadastrar produto"}
      </button>
    </form>
  );
}

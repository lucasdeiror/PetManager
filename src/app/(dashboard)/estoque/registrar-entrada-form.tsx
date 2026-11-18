"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registrarEntrada } from "../../../features/estoque/actions";
import { campoInput } from "../../../shared/tela/titulo-pagina";

export function RegistrarEntradaForm({ produtoId }: { produtoId: number }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const quantidade = Number(formData.get("quantidade"));

    startTransition(async () => {
      const result = await registrarEntrada(produtoId, quantidade);
      if (result.error) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
      router.refresh();
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-2 text-sm font-bold">
        Entrada
        <input
          name="quantidade"
          type="number"
          min="1"
          required
          className={`w-20 ${campoInput} tabular-nums`}
        />
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-orange-600 bg-white px-3.5 text-sm font-bold text-orange-700 transition-transform duration-150 ease-out active:scale-[0.98] disabled:opacity-60"
      >
        {isPending ? "..." : "Registrar"}
      </button>
      {error && (
        <p role="alert" className="text-sm font-bold text-red-700">
          {error}
        </p>
      )}
    </form>
  );
}

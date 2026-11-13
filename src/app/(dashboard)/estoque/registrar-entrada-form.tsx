"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registrarEntrada } from "../../../features/estoque/actions";

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
    <form ref={formRef} onSubmit={handleSubmit} className="mt-3 flex items-center gap-2">
      <label className="flex items-center gap-2 text-sm font-bold">
        Entrada
        <input
          name="quantidade"
          type="number"
          min="1"
          required
          className="h-8 w-20 rounded-md border px-2 text-sm"
        />
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="h-8 rounded-md border-2 border-orange-600 px-3 text-sm font-bold text-orange-700 disabled:opacity-60"
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

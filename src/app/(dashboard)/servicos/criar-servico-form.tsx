"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { criarServico } from "../../../features/servicos/actions";

export function CriarServicoForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const nome = String(formData.get("nome"));
    const precoInterno = Number(formData.get("precoInterno"));

    startTransition(async () => {
      const result = await criarServico({ nome, precoInterno });
      if (result.error) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
      router.refresh();
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="mt-3 grid gap-3">
      <label className="grid gap-1 text-sm font-bold">
        Nome do serviço
        <input name="nome" required maxLength={255} className="h-10 rounded-lg border-2 border-slate-200 bg-white px-2 text-sm font-semibold" />
      </label>
      <label className="grid gap-1 text-sm font-bold">
        Preço interno (R$)
        <input
          name="precoInterno"
          type="number"
          step="0.01"
          required
          className="h-10 rounded-lg border-2 border-slate-200 bg-white px-2 text-sm font-semibold"
        />
      </label>
      {error && (
        <p role="alert" className="text-sm font-bold text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="h-11 rounded-xl bg-orange-600 text-sm font-black text-white hover:bg-orange-700 disabled:opacity-60"
      >
        {isPending ? "Salvando..." : "Cadastrar serviço"}
      </button>
    </form>
  );
}

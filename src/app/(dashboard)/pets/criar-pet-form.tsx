"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { criarPet } from "../../../features/pets/actions";
import type { Tutor } from "../../../features/pets/queries";

export function CriarPetForm({ tutores }: { tutores: Tutor[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const tutorId = Number(formData.get("tutorId"));
    const nome = String(formData.get("nome"));
    const raca = String(formData.get("raca"));
    const porte = formData.get("porte") as "pequeno" | "medio" | "grande";

    startTransition(async () => {
      const result = await criarPet({ tutorId, nome, raca, porte });
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
        Tutor
        <select name="tutorId" required className="h-10 rounded-lg border-2 border-slate-200 bg-white px-2 text-sm font-semibold">
          <option value="">Selecione um tutor</option>
          {tutores.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-bold">
        Nome do pet
        <input name="nome" required maxLength={255} className="h-10 rounded-lg border-2 border-slate-200 bg-white px-2 text-sm font-semibold" />
      </label>
      <label className="grid gap-1 text-sm font-bold">
        Raça
        <input name="raca" required className="h-10 rounded-lg border-2 border-slate-200 bg-white px-2 text-sm font-semibold" />
      </label>
      <label className="grid gap-1 text-sm font-bold">
        Porte
        <select name="porte" required className="h-10 rounded-lg border-2 border-slate-200 bg-white px-2 text-sm font-semibold">
          <option value="pequeno">Pequeno</option>
          <option value="medio">Médio</option>
          <option value="grande">Grande</option>
        </select>
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
        {isPending ? "Salvando..." : "Cadastrar pet"}
      </button>
    </form>
  );
}

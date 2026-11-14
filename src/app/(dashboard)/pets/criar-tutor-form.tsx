"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { criarTutor } from "../../../features/pets/actions";

export function CriarTutorForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const nome = String(formData.get("nome"));
    const telefone = String(formData.get("telefone"));

    startTransition(async () => {
      const result = await criarTutor({ nome, telefone });
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
        Nome
        <input name="nome" required maxLength={255} className="h-10 rounded-lg border-2 border-slate-200 bg-white px-2 text-sm font-semibold" />
      </label>
      <label className="grid gap-1 text-sm font-bold">
        Telefone
        <input
          name="telefone"
          required
          placeholder="(79) 99999-9999"
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
        {isPending ? "Salvando..." : "Cadastrar tutor"}
      </button>
    </form>
  );
}

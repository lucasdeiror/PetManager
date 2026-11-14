"use client";

import { useState, useTransition } from "react";
import { salvarHorario } from "../../../features/horario-funcionamento/actions";

interface HorarioDiaFormProps {
  diaSemana: number;
  nomeDia: string;
  horario: { horaAbertura: string; horaFechamento: string } | null;
}

export function HorarioDiaForm({ diaSemana, nomeDia, horario }: HorarioDiaFormProps) {
  const [error, setError] = useState("");
  const [salvo, setSalvo] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSalvo(false);

    const formData = new FormData(event.currentTarget);
    const horaAbertura = String(formData.get("horaAbertura"));
    const horaFechamento = String(formData.get("horaFechamento"));

    startTransition(async () => {
      const result = await salvarHorario({ diaSemana, horaAbertura, horaFechamento });
      if (result.error) {
        setError(result.error);
        return;
      }
      setSalvo(true);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-2xl border-2 border-slate-200 bg-white p-4"
    >
      <span className="w-28 font-black text-stone-950">{nomeDia}</span>

      <label className="grid gap-1 text-xs font-bold text-slate-700">
        Abertura
        <input
          type="time"
          name="horaAbertura"
          defaultValue={horario?.horaAbertura ?? ""}
          required
          className="h-10 rounded-lg border-2 border-slate-200 bg-white px-2 text-sm font-semibold"
        />
      </label>

      <label className="grid gap-1 text-xs font-bold text-slate-700">
        Fechamento
        <input
          type="time"
          name="horaFechamento"
          defaultValue={horario?.horaFechamento ?? ""}
          required
          className="h-10 rounded-lg border-2 border-slate-200 bg-white px-2 text-sm font-semibold"
        />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="h-10 rounded-lg bg-orange-600 px-4 text-sm font-black text-white transition-colors hover:bg-orange-700 disabled:opacity-60"
      >
        {isPending ? "Salvando..." : "Salvar"}
      </button>

      {salvo && !error && (
        <span className="text-sm font-bold text-emerald-700">Salvo.</span>
      )}
      {error && (
        <p role="alert" className="w-full text-sm font-bold text-red-800">
          {error}
        </p>
      )}
    </form>
  );
}

"use client";

import { useState, useTransition } from "react";
import { salvarHorario } from "../../../features/horario-funcionamento/actions";
import { botaoPrimario, campoInput, cartaoForm, textoPrimario } from "../../../shared/tela/titulo-pagina";

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
      className={`${cartaoForm} flex flex-wrap items-end gap-3`}
    >
      <span className={`w-full sm:w-28 ${textoPrimario}`}>{nomeDia}</span>

      <label className="grid gap-1 text-xs font-bold text-slate-700">
        Abertura
        <input
          type="time"
          name="horaAbertura"
          defaultValue={horario?.horaAbertura ?? ""}
          required
          className={`${campoInput} tabular-nums`}
        />
      </label>

      <label className="grid gap-1 text-xs font-bold text-slate-700">
        Fechamento
        <input
          type="time"
          name="horaFechamento"
          defaultValue={horario?.horaFechamento ?? ""}
          required
          className={`${campoInput} tabular-nums`}
        />
      </label>

      <button type="submit" disabled={isPending} className={botaoPrimario}>
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

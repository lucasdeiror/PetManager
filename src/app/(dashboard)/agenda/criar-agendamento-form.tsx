"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { criarAgendamento } from "../../../features/agenda/actions";
import type { Pet } from "../../../features/pets/queries";
import type { ServicoParaAgendamento } from "../../../features/servicos/queries";

interface Props {
  pets: Pet[];
  servicos: ServicoParaAgendamento[];
  dia: string;
}

export function CriarAgendamentoForm({ pets, servicos, dia }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const petId = Number(formData.get("petId"));
    const hora = String(formData.get("hora"));
    const servicoIds = formData.getAll("servicoIds").map(Number);

    startTransition(async () => {
      const result = await criarAgendamento({
        petId,
        servicoIds,
        dataHora: `${dia}T${hora}:00`,
      });
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
        Pet
        <select name="petId" required className="h-10 rounded-lg border-2 border-slate-200 bg-white px-2 text-sm font-semibold">
          <option value="">Selecione um pet</option>
          {pets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-bold">
        Horário
        <input name="hora" type="time" required className="h-10 rounded-lg border-2 border-slate-200 bg-white px-2 text-sm font-semibold" />
      </label>
      <fieldset className="grid gap-1">
        <legend className="text-sm font-bold">Serviços</legend>
        {servicos.map((s) => (
          <label key={s.id} className="flex items-center gap-2 text-sm font-semibold">
            
            <input type="checkbox" name="servicoIds" value={s.id} className="size-4 accent-orange-600" />
            {s.nome}
          </label>
        ))}
        {servicos.length === 0 && (
          <p className="text-sm text-slate-500">Cadastre um serviço antes de criar um agendamento.</p>
        )}
      </fieldset>
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
        {isPending ? "Salvando..." : "Criar agendamento"}
      </button>
    </form>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  cancelarAgendamento,
  concluirAgendamento,
  editarAgendamento,
  reabrirAgendamento,
  reabrirAgendamentoConcluido,
} from "../../../features/agenda/actions";
import type { AgendamentoDoDia } from "../../../features/agenda/queries";
import { partesSP } from "../../../shared/data/fuso";

const STATUS = {
  agendado: { rotulo: "Agendado", classe: "border-orange-200 bg-orange-50 text-orange-800" },
  concluido: { rotulo: "Concluído", classe: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  cancelado: { rotulo: "Cancelado", classe: "border-slate-200 bg-slate-50 text-slate-500" },
} as const;

interface Acao {
  error?: string;
}

export function AgendamentoAcoes({ agendamento }: { agendamento: AgendamentoDoDia }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [editando, setEditando] = useState(false);
  const [isPending, startTransition] = useTransition();

  function run(acao: () => Promise<Acao>) {
    setError("");
    startTransition(async () => {
      const result = await acao();
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditando(false);
      router.refresh();
    });
  }

  function handleEditarSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const hora = String(formData.get("hora"));
    run(() => editarAgendamento({ id: agendamento.id, dataHora: `${dia}T${hora}:00` }));
  }

  const { dia, hora } = partesSP(agendamento.dataHora);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4 sm:px-5" data-status={agendamento.status}>
      <span className="w-12 text-base font-black text-stone-950">{hora}</span>
      <div className="min-w-40 flex-1">
        <p className="font-black text-stone-950">{agendamento.petNome}</p>
        <p className="text-sm font-semibold text-slate-600">
          {agendamento.servicoNomes.join(" + ") || "sem serviço"}
        </p>
      </div>
      <span className={`rounded-full border-2 px-2.5 py-0.5 text-xs font-black ${STATUS[agendamento.status].classe}`}>
        {STATUS[agendamento.status].rotulo}
      </span>

      {error && (
        <p role="alert" className="basis-full text-sm font-bold text-red-700">
          {error}
        </p>
      )}

      {editando ? (
        <form onSubmit={handleEditarSubmit} className="flex basis-full flex-wrap items-center gap-2 sm:basis-auto">
          <input
            name="hora"
            type="time"
            defaultValue={hora}
            required
            className="h-9 rounded-lg border-2 border-slate-200 px-2 text-sm font-semibold"
          />
          <button
            type="submit"
            disabled={isPending}
            className="h-9 rounded-lg bg-orange-600 px-3 text-sm font-bold text-white disabled:opacity-60"
          >
            Salvar
          </button>
          <button
            type="button"
            onClick={() => setEditando(false)}
            className="h-9 rounded-lg border-2 border-slate-200 bg-white px-3 text-sm font-bold"
          >
            Cancelar edição
          </button>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          {agendamento.status === "agendado" && (
            <>
              <button
                type="button"
                disabled={isPending}
                onClick={() => setEditando(true)}
                className="h-9 rounded-lg border-2 border-slate-200 bg-white px-3 text-sm font-bold disabled:opacity-60"
              >
                Editar
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => run(() => cancelarAgendamento(agendamento.id))}
                className="h-9 rounded-lg border-2 border-slate-200 bg-white px-3 text-sm font-bold disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => run(() => concluirAgendamento(agendamento.id))}
                className="h-9 rounded-lg bg-orange-600 px-3 text-sm font-bold text-white disabled:opacity-60"
              >
                Concluir
              </button>
            </>
          )}
          {agendamento.status === "cancelado" && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => run(() => reabrirAgendamento(agendamento.id))}
              className="h-9 rounded-lg border-2 border-slate-200 bg-white px-3 text-sm font-bold disabled:opacity-60"
            >
              Reabrir
            </button>
          )}
          {agendamento.status === "concluido" && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => run(() => reabrirAgendamentoConcluido(agendamento.id))}
              className="h-9 rounded-lg border-2 border-slate-200 bg-white px-3 text-sm font-bold disabled:opacity-60"
            >
              Reabrir (estorna venda)
            </button>
          )}
        </div>
      )}
    </div>
  );
}

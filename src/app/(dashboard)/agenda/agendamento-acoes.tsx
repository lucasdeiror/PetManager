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
    <div className="rounded-lg border p-3" data-status={agendamento.status}>
      <p className="font-bold">
        {hora} — {agendamento.petNome} ({agendamento.servicoNomes.join(", ") || "sem serviço"})
      </p>
      <p className="text-sm text-slate-600">Status: {agendamento.status}</p>

      {error && (
        <p role="alert" className="mt-1 text-sm font-bold text-red-700">
          {error}
        </p>
      )}

      {editando ? (
        <form onSubmit={handleEditarSubmit} className="mt-2 flex items-center gap-2">
          <input
            name="hora"
            type="time"
            defaultValue={hora}
            required
            className="h-8 rounded-md border px-2 text-sm"
          />
          <button
            type="submit"
            disabled={isPending}
            className="h-8 rounded-md bg-cyan-600 px-3 text-sm font-bold text-white disabled:opacity-60"
          >
            Salvar
          </button>
          <button
            type="button"
            onClick={() => setEditando(false)}
            className="h-8 rounded-md border px-3 text-sm font-bold"
          >
            Cancelar edição
          </button>
        </form>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {agendamento.status === "agendado" && (
            <>
              <button
                type="button"
                disabled={isPending}
                onClick={() => setEditando(true)}
                className="h-8 rounded-md border px-3 text-sm font-bold disabled:opacity-60"
              >
                Editar
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => run(() => cancelarAgendamento(agendamento.id))}
                className="h-8 rounded-md border px-3 text-sm font-bold disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => run(() => concluirAgendamento(agendamento.id))}
                className="h-8 rounded-md bg-cyan-600 px-3 text-sm font-bold text-white disabled:opacity-60"
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
              className="h-8 rounded-md border px-3 text-sm font-bold disabled:opacity-60"
            >
              Reabrir
            </button>
          )}
          {agendamento.status === "concluido" && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => run(() => reabrirAgendamentoConcluido(agendamento.id))}
              className="h-8 rounded-md border px-3 text-sm font-bold disabled:opacity-60"
            >
              Reabrir (estorna venda)
            </button>
          )}
        </div>
      )}
    </div>
  );
}

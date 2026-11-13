import { getAgendamentosPorDia } from "../queries";
import { partesSP } from "../../../shared/data/fuso";

interface AgendaCalendarioProps {
  data: string; // "YYYY-MM-DD"
}

/**
 * Exibe os agendamentos de um dia, diferenciando visualmente ocupado
 * (agendado/concluído) de cancelado (AGD-02) — cancelado nunca conta
 * como "ocupado".
 */
export async function AgendaCalendario({ data }: AgendaCalendarioProps) {
  const agendamentos = await getAgendamentosPorDia(data);

  return (
    <div className="grid gap-2">
      {agendamentos.length === 0 && (
        <p className="text-sm text-slate-500">Nenhum horário ocupado neste dia.</p>
      )}
      {agendamentos.map((a) => {
        const cancelado = a.status === "cancelado";
        const hora = partesSP(a.dataHora).hora;

        return (
          <div
            key={a.id}
            data-status={a.status}
            className={
              cancelado
                ? "rounded-lg border border-dashed border-slate-300 p-2 text-sm text-slate-400 line-through"
                : "rounded-lg border-2 border-cyan-600 bg-cyan-50 p-2 text-sm font-bold text-slate-900"
            }
          >
            <span>{hora}</span> — <span>{a.petNome}</span>{" "}
            <span className="ml-1 text-xs font-bold no-underline">
              {cancelado ? "Cancelado" : "Ocupado"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

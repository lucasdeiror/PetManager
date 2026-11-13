import { hojeEmSaoPaulo } from "../../../shared/data/hoje";
import { AgendaCalendario } from "../../../features/agenda/components/AgendaCalendario";
import { getAgendamentosPorDia } from "../../../features/agenda/queries";
import { getPets } from "../../../features/pets/queries";
import { getServicosParaAgendamento } from "../../../features/servicos/queries";
import { AgendamentoAcoes } from "./agendamento-acoes";
import { CriarAgendamentoForm } from "./criar-agendamento-form";

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  const { data } = await searchParams;
  const dia = data ?? hojeEmSaoPaulo();

  const [pets, servicos, agendamentosDoDia] = await Promise.all([
    getPets(),
    getServicosParaAgendamento(),
    getAgendamentosPorDia(dia),
  ]);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-black">Agenda</h1>

      <form className="mt-4 flex items-end gap-2" action="/agenda" method="get">
        <label className="grid gap-1 text-sm font-bold">
          Dia
          <input
            type="date"
            name="data"
            defaultValue={dia}
            className="h-9 rounded-md border px-2 text-sm"
          />
        </label>
        <button type="submit" className="h-9 rounded-md border px-3 text-sm font-bold">
          Ver
        </button>
      </form>

      <h2 className="mt-6 text-lg font-bold">Horários do dia</h2>
      <AgendaCalendario data={dia} />

      <h2 className="mt-6 text-lg font-bold">Novo agendamento</h2>
      <CriarAgendamentoForm pets={pets} servicos={servicos} dia={dia} />

      <h2 className="mt-6 text-lg font-bold">Agendamentos do dia</h2>
      <div className="grid gap-2">
        {agendamentosDoDia.map((a) => (
          <AgendamentoAcoes key={a.id} agendamento={a} />
        ))}
        {agendamentosDoDia.length === 0 && (
          <p className="text-sm text-slate-500">Nenhum agendamento neste dia.</p>
        )}
      </div>
    </div>
  );
}

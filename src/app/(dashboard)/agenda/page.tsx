import Link from "next/link";
import { hojeEmSaoPaulo } from "../../../shared/data/hoje";
import { AgendaCalendario } from "../../../features/agenda/components/AgendaCalendario";
import { getAgendamentosPorDia } from "../../../features/agenda/queries";
import { getPets } from "../../../features/pets/queries";
import { getServicosParaAgendamento } from "../../../features/servicos/queries";
import { TituloPagina, cartao } from "../../../shared/tela/titulo-pagina";
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
  const [ano, mes, d] = dia.split("-");

  return (
    <div className="mx-auto grid max-w-6xl gap-6 p-4 sm:p-6 lg:p-8">
      <TituloPagina titulo="Agenda" texto="Agenda diária e estados dos atendimentos">
        <Link
          href="/agenda/lista"
          className="inline-flex h-10 items-center rounded-xl border-2 border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:border-orange-500"
        >
          Todos os agendamentos
        </Link>
      </TituloPagina>

      <form
        className={`${cartao} flex flex-wrap items-end gap-3 p-4`}
        action="/agenda"
        method="get"
      >
        <label className="grid gap-1 text-sm font-bold">
          Dia
          <input
            type="date"
            name="data"
            defaultValue={dia}
            className="h-10 rounded-lg border-2 border-slate-200 px-2 text-sm font-semibold"
          />
        </label>
        <button
          type="submit"
          className="h-10 rounded-lg border-2 border-slate-200 bg-white px-4 text-sm font-bold hover:border-orange-500"
        >
          Ver
        </button>
        <p className="pb-2 text-sm font-semibold text-slate-600">
          Exibindo atendimentos de{" "}
          <strong className="text-stone-950">
            {d}/{mes}/{ano}
          </strong>
        </p>
      </form>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
        <section className={`${cartao} overflow-hidden`}>
          <h2 className="border-b-2 border-slate-100 px-4 py-3 text-lg font-black sm:px-5">
            Agendamentos do dia
          </h2>
          <div className="divide-y-2 divide-slate-100">
            {agendamentosDoDia.map((a) => (
              <AgendamentoAcoes key={a.id} agendamento={a} />
            ))}
            {agendamentosDoDia.length === 0 && (
              <p className="p-5 text-sm font-semibold text-slate-500">
                Nenhum agendamento neste dia.
              </p>
            )}
          </div>
        </section>

        <div className="grid gap-6">
          <section className={`${cartao} p-4`}>
            <h2 className="text-lg font-black">Novo agendamento</h2>
            <CriarAgendamentoForm pets={pets} servicos={servicos} dia={dia} />
          </section>
          <section className={`${cartao} p-4`}>
            <h2 className="text-lg font-black">Horários do dia</h2>
            <div className="mt-3">
              <AgendaCalendario data={dia} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

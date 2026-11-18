import Link from "next/link";
import { getResumoPainel } from "../../../features/painel/queries";
import { dataSimples, partesSP } from "../../../shared/data/fuso";
import {
  Metrica,
  TituloPagina,
  TituloSecao,
  cartao,
  textoMeta,
  textoPrimario,
} from "../../../shared/tela/titulo-pagina";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const linkAtalho =
  "inline-flex h-9 items-center rounded-xl border-2 border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 hover:border-orange-500";

export default async function PainelPage() {
  const resumo = await getResumoPainel();
  const { agendamentosHoje, vacinasAtrasadas, dono } = resumo;

  return (
    <div className="mx-auto grid max-w-6xl gap-6 p-4 sm:p-6 lg:p-8">
      <TituloPagina
        titulo="Painel"
        texto={`Resumo operacional de hoje (${dataSimples(resumo.hoje)})`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metrica rotulo="Agendamentos hoje" valor={String(agendamentosHoje.total)} />
        <Metrica rotulo="Pendentes hoje" valor={String(agendamentosHoje.agendados)} />
        <Metrica rotulo="Concluídos hoje" valor={String(agendamentosHoje.concluidos)} />
        <Metrica rotulo="Vacinas atrasadas" valor={String(vacinasAtrasadas.total)} />
      </div>

      {dono && (
        <section className="grid gap-4" aria-label="Indicadores do dono">
          <div className="grid gap-4 sm:grid-cols-3">
            <Metrica rotulo="Faturamento hoje" valor={brl(dono.faturamentoHoje)} />
            <Metrica rotulo="Faturamento no mês" valor={brl(dono.faturamentoMes)} />
            <Metrica rotulo="Produtos em estoque baixo" valor={String(dono.estoqueBaixoCount)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/vendas" className={linkAtalho}>
              Ir para vendas
            </Link>
            <Link href="/relatorios" className={linkAtalho}>
              Ir para relatórios
            </Link>
            <Link href="/estoque" className={linkAtalho}>
              Ir para estoque
            </Link>
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={`${cartao} overflow-hidden`}>
          <div className="flex items-center justify-between border-b-2 border-slate-100 px-4 py-3 sm:px-5">
            <TituloSecao>Próximos atendimentos de hoje</TituloSecao>
            <Link href="/agenda" className={linkAtalho}>
              Ver agenda
            </Link>
          </div>
          <ul className="divide-y-2 divide-slate-100">
            {agendamentosHoje.proximos.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm sm:px-5"
              >
                <div>
                  <p className={textoPrimario}>{a.petNome}</p>
                  <p className={`${textoMeta} tabular-nums`}>
                    {partesSP(a.dataHora).hora} · {a.servicoNomes.join(" + ") || "Sem serviço"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    a.status === "concluido"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-900"
                  }`}
                >
                  {a.status === "concluido" ? "Concluído" : "Agendado"}
                </span>
              </li>
            ))}
            {agendamentosHoje.proximos.length === 0 && (
              <li className={`p-5 ${textoMeta}`}>
                Nenhum atendimento previsto para hoje.
              </li>
            )}
          </ul>
        </section>

        <section className={`${cartao} overflow-hidden`}>
          <div className="flex items-center justify-between border-b-2 border-slate-100 px-4 py-3 sm:px-5">
            <TituloSecao>Alertas de vacinas atrasadas</TituloSecao>
            <Link href="/vacinas?status=atrasada" className={linkAtalho}>
              Ver vacinas atrasadas
            </Link>
          </div>
          <ul className="divide-y-2 divide-slate-100">
            {vacinasAtrasadas.itens.map((v) => (
              <li
                key={v.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm sm:px-5"
              >
                <div>
                  <p className={textoPrimario}>{v.petNome}</p>
                  <p className={`${textoMeta} tabular-nums`}>
                    {v.nome} · Retorno: {dataSimples(v.dataRetornoPrevista)}
                  </p>
                </div>
                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                  Atrasada
                </span>
              </li>
            ))}
            {vacinasAtrasadas.itens.length === 0 && (
              <li className={`p-5 ${textoMeta}`}>Nenhuma vacina atrasada.</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}

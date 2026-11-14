import Link from "next/link";
import { getRelatorioMensal } from "../../../features/relatorios/queries";
import { hojeEmSaoPaulo } from "../../../shared/data/hoje";
import { Metrica, TituloPagina, cartao } from "../../../shared/tela/titulo-pagina";
import { Paginacao, paginar } from "../../../shared/tela/paginacao";
import { ExportarPdfButton } from "./exportar-pdf-button";

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

/** Mês corrente em Brasília (AD-010): o servidor roda em UTC e viraria o mês às 21h. */
function mesAtual(): { ano: number; mes: number } {
  const [ano, mes] = hojeEmSaoPaulo().split("-").map(Number);
  return { ano, mes };
}

function mesAnterior(ano: number, mes: number): { ano: number; mes: number } {
  return mes === 1 ? { ano: ano - 1, mes: 12 } : { ano, mes: mes - 1 };
}

function proximoMes(ano: number, mes: number): { ano: number; mes: number } {
  return mes === 12 ? { ano: ano + 1, mes: 1 } : { ano, mes: mes + 1 };
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string; mes?: string; pagina?: string }>;
}) {
  const params = await searchParams;
  const { ano: anoParam, mes: mesParam } = params;
  const atual = mesAtual();
  const ano = anoParam ? Number(anoParam) : atual.ano;
  const mes = mesParam ? Number(mesParam) : atual.mes;

  const relatorio = await getRelatorioMensal(ano, mes);
  const anterior = mesAnterior(ano, mes);
  const seguinte = proximoMes(ano, mes);

  const vendas = paginar(relatorio.vendas, params.pagina);
  const navegacao =
    "inline-flex h-10 items-center rounded-xl border-2 border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 hover:border-orange-500";

  return (
    <div className="mx-auto grid max-w-6xl gap-6 p-4 sm:p-6 lg:p-8">
      <TituloPagina titulo="Relatório mensal" texto="Atendimentos e faturamento do mês">
        <ExportarPdfButton ano={ano} mes={mes} />
      </TituloPagina>

      <div className={`${cartao} flex flex-wrap items-center justify-between gap-3 p-3`}>
        <Link href={`/relatorios?ano=${anterior.ano}&mes=${anterior.mes}`} className={navegacao}>
          ← Mês anterior
        </Link>
        <p className="text-lg font-black text-stone-950">
          {MESES[mes - 1]} de {ano}
        </p>
        <Link href={`/relatorios?ano=${seguinte.ano}&mes=${seguinte.mes}`} className={navegacao}>
          Próximo mês →
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Metrica rotulo="Faturamento total" valor={formatarMoeda(relatorio.faturamentoTotal)} />
        <Metrica rotulo="Agendamentos concluídos" valor={String(relatorio.agendamentosConcluidos)} />
        <Metrica rotulo="Agendamentos cancelados" valor={String(relatorio.agendamentosCancelados)} />
      </div>

      <section className={`${cartao} overflow-hidden`}>
        <h2 className="border-b-2 border-slate-100 px-4 py-3 text-lg font-black sm:px-5">
          Vendas do período
        </h2>
        <ul className="divide-y-2 divide-slate-100">
          {vendas.visiveis.map((v) => (
            <li key={v.id} className="flex flex-wrap justify-between gap-2 px-4 py-3 text-sm sm:px-5">
              <span className="font-bold text-stone-950">
                {v.itemNome}{" "}
                <span className="font-semibold text-slate-600">
                  · {v.tipo === "produto" ? "Produto" : "Serviço"}
                </span>
              </span>
              <span className="font-black text-stone-950">{formatarMoeda(v.valorTotal)}</span>
            </li>
          ))}
          {vendas.total === 0 && (
            <li className="p-5 text-sm font-semibold text-slate-500">Nenhuma venda neste período.</li>
          )}
        </ul>
        <Paginacao pagina={vendas} params={params} />
      </section>
    </div>
  );
}

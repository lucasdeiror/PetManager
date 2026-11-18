import Link from "next/link";
import { getRelatorioMensal } from "../../../features/relatorios/queries";
import { mesEmSaoPaulo } from "../../../shared/data/hoje";
import {
  Metrica,
  PaginaContainer,
  TituloPagina,
  TituloSecao,
  cabecalhoLista,
  cartao,
  cartaoForm,
  itemLista,
  textoMeta,
  textoPrimario,
  valorTabela,
} from "../../../shared/tela/titulo-pagina";
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
  const atual = mesEmSaoPaulo();
  const ano = anoParam ? Number(anoParam) : atual.ano;
  const mes = mesParam ? Number(mesParam) : atual.mes;

  const relatorio = await getRelatorioMensal(ano, mes);
  const anterior = mesAnterior(ano, mes);
  const seguinte = proximoMes(ano, mes);

  const vendas = paginar(relatorio.vendas, params.pagina);
  const navegacao =
    "inline-flex h-10 items-center rounded-xl border-2 border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 hover:border-orange-500";

  return (
    <PaginaContainer>
      <TituloPagina titulo="Relatório mensal" texto="Atendimentos e faturamento do mês">
        <ExportarPdfButton ano={ano} mes={mes} />
      </TituloPagina>

      <div className={`${cartaoForm} flex flex-wrap items-center justify-between gap-3`}>
        <Link href={`/relatorios?ano=${anterior.ano}&mes=${anterior.mes}`} className={navegacao}>
          ← Mês anterior
        </Link>
        <p className="text-base font-bold text-stone-950 tabular-nums">
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
        <TituloSecao className={cabecalhoLista}>
          Vendas do período
        </TituloSecao>
        <ul className="divide-y-2 divide-slate-100">
          {vendas.visiveis.map((v) => (
            <li key={v.id} className={`flex flex-wrap justify-between gap-2 text-sm ${itemLista}`}>
              <span className={textoPrimario}>
                {v.itemNome}{" "}
                <span className={textoMeta}>
                  · {v.tipo === "produto" ? "Produto" : "Serviço"}
                </span>
              </span>
              <span className={valorTabela}>{formatarMoeda(v.valorTotal)}</span>
            </li>
          ))}
          {vendas.total === 0 && (
            <li className={`${itemLista} ${textoMeta}`}>Nenhuma venda neste período.</li>
          )}
        </ul>
        <Paginacao pagina={vendas} params={params} />
      </section>
    </PaginaContainer>
  );
}

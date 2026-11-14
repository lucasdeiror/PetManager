import Link from "next/link";
import { getRelatorioMensal } from "../../../features/relatorios/queries";
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

function mesAtual(): { ano: number; mes: number } {
  const hoje = new Date();
  return { ano: hoje.getFullYear(), mes: hoje.getMonth() + 1 };
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
  searchParams: Promise<{ ano?: string; mes?: string }>;
}) {
  const { ano: anoParam, mes: mesParam } = await searchParams;
  const atual = mesAtual();
  const ano = anoParam ? Number(anoParam) : atual.ano;
  const mes = mesParam ? Number(mesParam) : atual.mes;

  const relatorio = await getRelatorioMensal(ano, mes);
  const anterior = mesAnterior(ano, mes);
  const seguinte = proximoMes(ano, mes);

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-black">Relatório Mensal</h1>

      <div className="mt-4 flex items-center justify-between">
        <Link
          href={`/relatorios?ano=${anterior.ano}&mes=${anterior.mes}`}
          className="text-sm font-bold underline"
        >
          ← Mês anterior
        </Link>
        <p className="text-lg font-bold">
          {MESES[mes - 1]} de {ano}
        </p>
        <Link
          href={`/relatorios?ano=${seguinte.ano}&mes=${seguinte.mes}`}
          className="text-sm font-bold underline"
        >
          Próximo mês →
        </Link>
      </div>

      <div className="mt-6 grid gap-2">
        <div className="flex justify-between rounded-lg border p-3">
          <span>Agendamentos concluídos</span>
          <span className="font-bold">{relatorio.agendamentosConcluidos}</span>
        </div>
        <div className="flex justify-between rounded-lg border p-3">
          <span>Agendamentos cancelados</span>
          <span className="font-bold">{relatorio.agendamentosCancelados}</span>
        </div>
        <div className="flex justify-between rounded-lg border-2 border-orange-600 bg-orange-50 p-3">
          <span className="font-bold">Faturamento total</span>
          <span className="font-black">{formatarMoeda(relatorio.faturamentoTotal)}</span>
        </div>
      </div>

      <ExportarPdfButton ano={ano} mes={mes} />

      <h2 className="mt-6 text-lg font-bold">Vendas do período</h2>
      <ul className="mt-2 grid gap-2">
        {relatorio.vendas.map((v) => (
          <li key={v.id} className="flex justify-between rounded-lg border p-2 text-sm">
            <span>
              {v.itemNome} ({v.tipo === "produto" ? "Produto" : "Serviço"})
            </span>
            <span>{formatarMoeda(v.valorTotal)}</span>
          </li>
        ))}
        {relatorio.vendas.length === 0 && (
          <p className="text-sm text-slate-500">Nenhuma venda neste período.</p>
        )}
      </ul>
    </div>
  );
}

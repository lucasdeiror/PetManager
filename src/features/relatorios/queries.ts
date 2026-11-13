import { createClient } from "../../shared/supabase/server";
import { getCurrentUserRole } from "../auth/queries";
import { getVendas, type Venda } from "../vendas/queries";
import { instanteSP } from "../../shared/data/fuso";

export interface RelatorioMensal {
  ano: number;
  mes: number;
  agendamentosConcluidos: number;
  agendamentosCancelados: number;
  faturamentoTotal: number;
  vendas: Venda[];
}

function relatorioVazio(ano: number, mes: number): RelatorioMensal {
  return {
    ano,
    mes,
    agendamentosConcluidos: 0,
    agendamentosCancelados: 0,
    faturamentoTotal: 0,
    vendas: [],
  };
}

function limitesDoMes(ano: number, mes: number): { inicio: string; fim: string } {
  const mesStr = String(mes).padStart(2, "0");
  const inicio = `${ano}-${mesStr}-01`;
  const fim = mes === 12 ? `${ano + 1}-01-01` : `${ano}-${String(mes + 1).padStart(2, "0")}-01`;
  return { inicio: instanteSP(`${inicio}T00:00:00`), fim: instanteSP(`${fim}T00:00:00`) };
}

/**
 * Agrega, por mês: contagem de agendamentos concluídos e cancelados
 * (separadas, REL-01/REL-02) e faturamento total — uma única soma de
 * `vendas.valor_total` (REL-03, produto + serviço juntos, fonte única).
 * Restrito ao papel `dono` (REL-05) — quem não é dono recebe o
 * relatório zerado, nunca dado real (mesmo padrão de `getProdutos`,
 * T19). Mês sem nenhum dado também retorna zerado, sem erro.
 */
export async function getRelatorioMensal(ano: number, mes: number): Promise<RelatorioMensal> {
  const role = await getCurrentUserRole();
  if (role !== "dono") {
    return relatorioVazio(ano, mes);
  }

  const { inicio, fim } = limitesDoMes(ano, mes);
  const supabase = await createClient();

  const { count: concluidos } = await supabase
    .from("agendamentos")
    .select("id", { count: "exact", head: true })
    .eq("status", "concluido")
    .gte("data_hora", inicio)
    .lt("data_hora", fim);

  const { count: cancelados } = await supabase
    .from("agendamentos")
    .select("id", { count: "exact", head: true })
    .eq("status", "cancelado")
    .gte("data_hora", inicio)
    .lt("data_hora", fim);

  const vendas = await getVendas({ mes: `${ano}-${String(mes).padStart(2, "0")}` });
  const faturamentoTotal = vendas.reduce((soma, v) => soma + v.valorTotal, 0);

  return {
    ano,
    mes,
    agendamentosConcluidos: concluidos ?? 0,
    agendamentosCancelados: cancelados ?? 0,
    faturamentoTotal,
    vendas,
  };
}

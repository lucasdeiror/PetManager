import { getAgendamentosPorDia, type AgendamentoDoDia } from "../agenda/queries";
import { getCurrentUserRole } from "../auth/queries";
import { getProdutos } from "../estoque/queries";
import { getVacinas, type VacinaComStatus } from "../vacinas/queries";
import { getVendas } from "../vendas/queries";
import { partesSP } from "../../shared/data/fuso";
import { hojeEmSaoPaulo, mesEmSaoPaulo } from "../../shared/data/hoje";

export interface ResumoDono {
  faturamentoHoje: number;
  faturamentoMes: number;
  estoqueBaixoCount: number;
}

export interface ResumoPainel {
  hoje: string;
  agendamentosHoje: {
    total: number;
    agendados: number;
    concluidos: number;
    proximos: AgendamentoDoDia[];
  };
  vacinasAtrasadas: {
    total: number;
    itens: VacinaComStatus[];
  };
  dono: ResumoDono | null;
}

const LIMITE_ITENS_PAINEL = 5;

export async function getResumoPainel(agora: Date = new Date()): Promise<ResumoPainel> {
  const hoje = hojeEmSaoPaulo(agora);
  const { ano, mes } = mesEmSaoPaulo(agora);
  const mesAtual = `${ano}-${String(mes).padStart(2, "0")}`;

  const [role, agendamentos, vacinasAtrasadas] = await Promise.all([
    getCurrentUserRole(),
    getAgendamentosPorDia(hoje),
    getVacinas({ status: "atrasada" }),
  ]);

  const agendados = agendamentos.filter((a) => a.status === "agendado").length;
  const concluidos = agendamentos.filter((a) => a.status === "concluido").length;
  const proximos = agendamentos
    .filter((a) => a.status !== "cancelado")
    .sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime())
    .slice(0, LIMITE_ITENS_PAINEL);

  let dono: ResumoDono | null = null;
  if (role === "dono") {
    const [produtos, vendasMes] = await Promise.all([
      getProdutos(),
      getVendas({ mes: mesAtual }),
    ]);

    const faturamentoMes = vendasMes.reduce((soma, v) => soma + v.valorTotal, 0);
    const faturamentoHoje = vendasMes
      .filter((v) => partesSP(v.criadoEm).dia === hoje)
      .reduce((soma, v) => soma + v.valorTotal, 0);
    const estoqueBaixoCount = produtos.filter((p) => p.estoqueBaixo).length;

    dono = {
      faturamentoHoje,
      faturamentoMes,
      estoqueBaixoCount,
    };
  }

  return {
    hoje,
    agendamentosHoje: {
      total: agendamentos.length,
      agendados,
      concluidos,
      proximos,
    },
    vacinasAtrasadas: {
      total: vacinasAtrasadas.length,
      itens: vacinasAtrasadas.slice(0, LIMITE_ITENS_PAINEL),
    },
    dono,
  };
}

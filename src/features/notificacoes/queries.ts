import { getAgendamentosPorDia } from "../agenda/queries";
import { getCurrentUserRole } from "../auth/queries";
import { getProdutos } from "../estoque/queries";
import { getVacinas } from "../vacinas/queries";
import { dataSimples } from "../../shared/data/fuso";
import { hojeEmSaoPaulo } from "../../shared/data/hoje";
import type { NotificacaoItem, ResumoNotificacoes } from "./types";

export async function getNotificacoes(agora: Date = new Date()): Promise<ResumoNotificacoes> {
  const hoje = hojeEmSaoPaulo(agora);

  const [role, agendamentos, vacinasAtrasadas] = await Promise.all([
    getCurrentUserRole(),
    getAgendamentosPorDia(hoje),
    getVacinas({ status: "atrasada" }),
  ]);

  const itens: NotificacaoItem[] = [];

  // 1. Vacinas atrasadas (máximo 8 itens prioritários)
  for (const v of vacinasAtrasadas.slice(0, 8)) {
    itens.push({
      id: `vacina-${v.id}`,
      tipo: "vacina",
      titulo: `Vacina atrasada: ${v.nome}`,
      detalhe: `Pet: ${v.petNome} · Prevista para ${dataSimples(v.dataRetornoPrevista)}`,
      quando: v.dataRetornoPrevista,
      link: "/vacinas",
      tom: "perigo",
    });
  }

  // 2. Agendamentos de hoje
  const agendados = agendamentos.filter((a) => a.status === "agendado").length;
  const concluidos = agendamentos.filter((a) => a.status === "concluido").length;
  if (agendados > 0) {
    itens.push({
      id: `agenda-hoje-${hoje}`,
      tipo: "agenda",
      titulo: `${agendados} agendamento${agendados > 1 ? "s" : ""} pendente${agendados > 1 ? "s" : ""} hoje`,
      detalhe: `${concluidos} concluído${concluidos > 1 ? "s" : ""} de ${agendamentos.length} agendamento${agendamentos.length > 1 ? "s" : ""} no total`,
      quando: agora.toISOString(),
      link: "/agenda",
      tom: "aviso",
    });
  }

  // 3. Alertas de estoque baixo (apenas para dono)
  if (role === "dono") {
    const produtos = await getProdutos();
    const estoqueBaixo = produtos.filter((p) => p.estoqueBaixo);
    for (const p of estoqueBaixo.slice(0, 6)) {
      itens.push({
        id: `estoque-${p.id}`,
        tipo: "estoque",
        titulo: `Estoque baixo: ${p.nome}`,
        detalhe: `Apenas ${p.saldoEstoque} unidade${p.saldoEstoque !== 1 ? "s" : ""} (mínimo ${p.estoqueMinimo})`,
        quando: agora.toISOString(),
        link: "/estoque",
        tom: "perigo",
      });
    }
  }

  return {
    total: itens.length,
    itens,
  };
}

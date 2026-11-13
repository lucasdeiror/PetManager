import { beforeAll, describe, expect, it, vi } from "vitest";
import { criarAgendamento } from "../../../shared/supabase/__tests__/db-cenario";
import { clienteComo } from "../../../shared/supabase/__tests__/db-sessao";

// usa o getVendas/getRelatorioMensal reais, apontando o cliente do servidor para uma sessão real de dono
vi.mock("../../../shared/supabase/server", async () => {
  const { clienteComo } = await import("../../../shared/supabase/__tests__/db-sessao");
  return { createClient: async () => clienteComo("dono") };
});

import { getRelatorioMensal } from "../../relatorios/queries";
import { getVendas } from "../queries";

// IDP-07: venda estornada não aparece na listagem nem no total do relatório
describe("vendas estornadas contra o banco real", () => {
  let agEstornado: number;
  beforeAll(async () => {
    const dono = await clienteComo("dono");
    agEstornado = await criarAgendamento([777]);
    await dono.rpc("concluir_agendamento", { p_agendamento_id: agEstornado });
    await dono.rpc("reabrir_agendamento_concluido", { p_agendamento_id: agEstornado });
    const ativo = await criarAgendamento([111]);
    await dono.rpc("concluir_agendamento", { p_agendamento_id: ativo });
  });

  it("getVendas lista a venda ativa e omite a estornada", async () => {
    const valores = (await getVendas()).map((v) => v.valorTotal);
    expect(valores).toContain(111);
    expect(valores).not.toContain(777);
  });

  it("o faturamento do relatório mensal não soma a venda estornada", async () => {
    const agora = new Date();
    const r = await getRelatorioMensal(agora.getFullYear(), agora.getMonth() + 1);
    expect(r.vendas.map((v) => v.valorTotal)).not.toContain(777);
    expect(r.faturamentoTotal).toBe(r.vendas.reduce((s, v) => s + v.valorTotal, 0));
    expect(r.faturamentoTotal).toBeGreaterThanOrEqual(111);
  });
});

import { describe, expect, it } from "vitest";
import { criarAgendamento } from "./db-cenario";
import { clienteAdmin } from "./db-sessao";

const novaVendaServico = (agendamento_id: number, extra: object = {}) =>
  clienteAdmin().from("vendas").insert({ tipo: "servico", agendamento_id, valor_total: 50, ...extra });

// IDP-04: no máximo uma venda servico não estornada por agendamento
describe("vendas: índice único parcial", () => {
  it("segunda venda servico ativa no mesmo agendamento falha com 23505", async () => {
    const ag = await criarAgendamento();
    expect((await novaVendaServico(ag)).error).toBeNull();
    const { error } = await novaVendaServico(ag);
    expect(error?.code).toBe("23505");
  });

  it("com a primeira estornada, a segunda entra e a estornada permanece", async () => {
    const ag = await criarAgendamento();
    expect((await novaVendaServico(ag, { estornada_em: new Date().toISOString() })).error).toBeNull();
    expect((await novaVendaServico(ag)).error).toBeNull();
    const { data } = await clienteAdmin().from("vendas").select("estornada_em").eq("agendamento_id", ag);
    expect(data).toHaveLength(2);
    expect(data!.filter((v) => v.estornada_em === null)).toHaveLength(1);
  });
});

import { describe, expect, it } from "vitest";
import { criarAgendamento } from "./db-cenario";
import { clienteAdmin, clienteComo } from "./db-sessao";

const vendasDe = async (id: number) =>
  (await clienteAdmin().from("vendas").select("valor_total, estornada_em").eq("agendamento_id", id).order("id")).data!;
const statusDe = async (id: number) =>
  (await clienteAdmin().from("agendamentos").select("status").eq("id", id).single()).data?.status;

describe("RPC concluir_agendamento", () => {
  it("agendado: conclui e cria uma venda com a soma dos serviços (IDP-01)", async () => {
    const ag = await criarAgendamento([30, 20]);
    const { data, error } = await (await clienteComo("recepcionista")).rpc("concluir_agendamento", { p_agendamento_id: ag });
    expect(error).toBeNull();
    expect(data).toEqual(expect.any(Number));
    const v = await vendasDe(ag);
    expect(v).toHaveLength(1);
    expect(Number(v[0].valor_total)).toBe(50);
    expect(await statusDe(ag)).toBe("concluido");
  });

  it("não-agendado falha com 'Agendamento não está agendado' e não cria venda (IDP-02)", async () => {
    const ag = await criarAgendamento();
    const c = await clienteComo("dono");
    await c.rpc("concluir_agendamento", { p_agendamento_id: ag });
    const { error } = await c.rpc("concluir_agendamento", { p_agendamento_id: ag });
    expect(error?.message).toBe("Agendamento não está agendado");
    expect(await vendasDe(ag)).toHaveLength(1);
  });

  it("id inexistente falha com 'Agendamento não encontrado'", async () => {
    const { error } = await (await clienteComo("dono")).rpc("concluir_agendamento", { p_agendamento_id: 999999 });
    expect(error?.message).toBe("Agendamento não encontrado");
  });

  it("agendamento sem serviços gera venda com valor_total 0", async () => {
    const ag = await criarAgendamento([]);
    await (await clienteComo("dono")).rpc("concluir_agendamento", { p_agendamento_id: ag });
    const v = await vendasDe(ag);
    expect(v.map((x) => Number(x.valor_total))).toEqual([0]);
  });

  it("duas chamadas concorrentes deixam exatamente uma venda ativa (IDP-03)", async () => {
    const ag = await criarAgendamento();
    const [a, b] = await Promise.all([await clienteComo("dono"), await clienteComo("recepcionista")]);
    const r = await Promise.all([
      a.rpc("concluir_agendamento", { p_agendamento_id: ag }),
      b.rpc("concluir_agendamento", { p_agendamento_id: ag }),
    ]);
    expect(r.filter((x) => x.error === null)).toHaveLength(1);
    expect(r.filter((x) => x.error?.message === "Agendamento não está agendado")).toHaveLength(1);
    const v = await vendasDe(ag);
    expect(v.filter((x) => x.estornada_em === null)).toHaveLength(1);
  });
});

describe("RPC reabrir_agendamento_concluido", () => {
  it("concluído: estorna a venda sem apagar e volta para agendado (IDP-05)", async () => {
    const ag = await criarAgendamento();
    const c = await clienteComo("recepcionista");
    await c.rpc("concluir_agendamento", { p_agendamento_id: ag });
    const { error } = await c.rpc("reabrir_agendamento_concluido", { p_agendamento_id: ag });
    expect(error).toBeNull();
    expect(await statusDe(ag)).toBe("agendado");
    const v = await vendasDe(ag);
    expect(v).toHaveLength(1);
    expect(v[0].estornada_em).not.toBeNull();
  });

  it("não-concluído falha com 'Agendamento não está concluído' e vendas intactas (IDP-06)", async () => {
    const ag = await criarAgendamento();
    const { error } = await (await clienteComo("dono")).rpc("reabrir_agendamento_concluido", { p_agendamento_id: ag });
    expect(error?.message).toBe("Agendamento não está concluído");
    expect(await vendasDe(ag)).toHaveLength(0);
    expect(await statusDe(ag)).toBe("agendado");
  });

  it("concluir de novo depois de reabrir cria nova venda e mantém a estornada (IDP-08)", async () => {
    const ag = await criarAgendamento();
    const c = await clienteComo("dono");
    await c.rpc("concluir_agendamento", { p_agendamento_id: ag });
    await c.rpc("reabrir_agendamento_concluido", { p_agendamento_id: ag });
    const { error } = await c.rpc("concluir_agendamento", { p_agendamento_id: ag });
    expect(error).toBeNull();
    const v = await vendasDe(ag);
    expect(v.map((x) => x.estornada_em !== null)).toEqual([true, false]);
  });
});

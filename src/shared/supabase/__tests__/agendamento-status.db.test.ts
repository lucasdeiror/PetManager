import { describe, expect, it } from "vitest";
import { criarAgendamento } from "./db-cenario";
import { clienteAdmin, clienteComo } from "./db-sessao";

const mudar = async (id: number, status: string) =>
  (await clienteComo("recepcionista")).from("agendamentos").update({ status }).eq("id", id);
const statusDe = async (id: number) =>
  (await clienteAdmin().from("agendamentos").select("status").eq("id", id).single()).data?.status;
const vendasDe = async (id: number) =>
  (await clienteAdmin().from("vendas").select("valor_total, estornada_em, estornada_por").eq("agendamento_id", id).order("id")).data!;

// MAQ-01: transições válidas
describe("trigger de status: transições válidas", () => {
  it("agendado → concluido cria exatamente 1 venda com a soma dos preço_interno (IDP-01)", async () => {
    const ag = await criarAgendamento([30, 20.5]);
    expect((await mudar(ag, "concluido")).error).toBeNull();
    expect(await statusDe(ag)).toBe("concluido");
    const v = await vendasDe(ag);
    expect(v).toHaveLength(1);
    expect(Number(v[0].valor_total)).toBe(50.5);
    expect(v[0].estornada_em).toBeNull();
  });

  it("agendado → cancelado", async () => {
    const ag = await criarAgendamento();
    expect((await mudar(ag, "cancelado")).error).toBeNull();
    expect(await statusDe(ag)).toBe("cancelado");
    expect(await vendasDe(ag)).toHaveLength(0);
  });

  it("cancelado → agendado", async () => {
    const ag = await criarAgendamento();
    await mudar(ag, "cancelado");
    expect((await mudar(ag, "agendado")).error).toBeNull();
    expect(await statusDe(ag)).toBe("agendado");
  });

  it("concluido → agendado estorna a venda sem apagar a linha (IDP-05)", async () => {
    const ag = await criarAgendamento();
    await mudar(ag, "concluido");
    expect((await mudar(ag, "agendado")).error).toBeNull();
    expect(await statusDe(ag)).toBe("agendado");
    const v = await vendasDe(ag);
    expect(v).toHaveLength(1);
    expect(v[0].estornada_em).not.toBeNull();
    expect(v[0].estornada_por).not.toBeNull();
  });

  it("reconcluir depois do estorno cria nova venda e mantém a antiga (IDP-08)", async () => {
    const ag = await criarAgendamento([40]);
    await mudar(ag, "concluido");
    await mudar(ag, "agendado");
    expect((await mudar(ag, "concluido")).error).toBeNull();
    const v = await vendasDe(ag);
    expect(v).toHaveLength(2);
    expect(v[0].estornada_em).not.toBeNull();
    expect(v[1].estornada_em).toBeNull();
    expect(Number(v[1].valor_total)).toBe(40);
  });
});

// MAQ-02 / MAQ-04: transições inválidas
describe("trigger de status: transições inválidas", () => {
  it("concluido → cancelado falha com a mensagem do MAQ-02 e mantém status e venda", async () => {
    const ag = await criarAgendamento();
    await mudar(ag, "concluido");
    const { error } = await mudar(ag, "cancelado");
    expect(error?.message).toBe("Reabra o agendamento antes de cancelar");
    expect(await statusDe(ag)).toBe("concluido");
    const v = await vendasDe(ag);
    expect(v).toHaveLength(1);
    expect(v[0].estornada_em).toBeNull();
  });

  it("cancelado → concluido falha com 'Transição de status inválida'", async () => {
    const ag = await criarAgendamento();
    await mudar(ag, "cancelado");
    const { error } = await mudar(ag, "concluido");
    expect(error?.message).toBe("Transição de status inválida: cancelado → concluido");
    expect(await statusDe(ag)).toBe("cancelado");
    expect(await vendasDe(ag)).toHaveLength(0);
  });
});

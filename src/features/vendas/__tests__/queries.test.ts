import { describe, it, expect, vi, beforeEach } from "vitest";
import { getVendas } from "../queries";

let result: { data: unknown };

function makeBuilder() {
  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  builder.select = vi.fn(chain);
  builder.order = vi.fn(chain);
  builder.eq = vi.fn(chain);
  builder.is = vi.fn(chain);
  builder.gte = vi.fn(chain);
  builder.lt = vi.fn(chain);
  builder.then = (resolve: (value: unknown) => unknown) => resolve(result);
  return builder;
}

const from = vi.fn(() => makeBuilder());

vi.mock("../../../shared/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from })),
}));

describe("getVendas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna lista vazia quando não há vendas", async () => {
    result = { data: [] };

    const vendas = await getVendas();

    expect(vendas).toEqual([]);
  });

  it("resolve o nome do item pra venda de produto e de serviço", async () => {
    result = {
      data: [
        {
          id: 1,
          tipo: "produto",
          quantidade: 2,
          valor_total: "50.00",
          criado_em: "2026-09-10T12:00:00Z",
          produtos: { nome: "Ração" },
          agendamentos: null,
        },
        {
          id: 2,
          tipo: "servico",
          quantidade: 1,
          valor_total: "40.00",
          criado_em: "2026-09-11T12:00:00Z",
          produtos: null,
          agendamentos: { agendamento_servicos: [{ servicos: { nome: "Banho" } }] },
        },
      ],
    };

    const vendas = await getVendas();

    expect(vendas).toEqual([
      { id: 1, tipo: "produto", itemNome: "Ração", quantidade: 2, valorTotal: 50, criadoEm: "2026-09-10T12:00:00Z" },
      { id: 2, tipo: "servico", itemNome: "Banho", quantidade: 1, valorTotal: 40, criadoEm: "2026-09-11T12:00:00Z" },
    ]);
  });

  it("aplica filtro de tipo e mês na query", async () => {
    result = { data: [] };

    await getVendas({ tipo: "produto", mes: "2026-09" });

    const builder = from.mock.results[0].value;
    expect(builder.eq).toHaveBeenCalledWith("tipo", "produto");
    expect(builder.gte).toHaveBeenCalledWith("criado_em", "2026-09-01");
    expect(builder.lt).toHaveBeenCalledWith("criado_em", "2026-10-01");
  });

  it("combina busca por item com filtro de tipo", async () => {
    result = {
      data: [
        {
          id: 1,
          tipo: "produto",
          quantidade: 1,
          valor_total: "10.00",
          criado_em: "2026-09-10T12:00:00Z",
          produtos: { nome: "Ração" },
          agendamentos: null,
        },
        {
          id: 2,
          tipo: "produto",
          quantidade: 1,
          valor_total: "15.00",
          criado_em: "2026-09-10T12:00:00Z",
          produtos: { nome: "Shampoo" },
          agendamentos: null,
        },
      ],
    };

    const vendas = await getVendas({ tipo: "produto", busca: "ração" });

    expect(vendas).toEqual([
      { id: 1, tipo: "produto", itemNome: "Ração", quantidade: 1, valorTotal: 10, criadoEm: "2026-09-10T12:00:00Z" },
    ]);
  });

  it("ignora vendas estornadas: filtra estornada_em is null na query (IDP-07)", async () => {
    result = { data: [] };

    await getVendas();

    const builder = from.mock.results[0].value as { is: ReturnType<typeof vi.fn> };
    expect(builder.is).toHaveBeenCalledWith("estornada_em", null);
  });
});

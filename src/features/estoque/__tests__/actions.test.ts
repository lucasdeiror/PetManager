import { describe, it, expect, vi, beforeEach } from "vitest";
import { criarProduto, registrarEntrada } from "../actions";

const single = vi.fn();
const select = vi.fn(() => ({ single, eq: vi.fn(() => ({ single })) }));
const insert = vi.fn(() => ({ select }));
const eqUpdate = vi.fn();
const update = vi.fn(() => ({ eq: eqUpdate }));
const from = vi.fn(() => ({ insert, select, update }));

vi.mock("../../auth/queries", () => ({ exigirDono: vi.fn(async () => ({})) }));

vi.mock("../../../shared/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from })),
}));

describe("criarProduto", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    single.mockResolvedValue({ data: { id: 1 }, error: null });
  });

  it("cadastra com nome, categoria, preço e estoque mínimo válidos", async () => {
    const result = await criarProduto({
      nome: "Ração premium",
      categoria: "Alimentos",
      precoUnitario: 89.9,
      estoqueMinimo: 5,
    });

    expect(result.error).toBeUndefined();
    expect(insert).toHaveBeenCalledWith({
      nome: "Ração premium",
      categoria: "Alimentos",
      preco_unitario: 89.9,
      estoque_minimo: 5,
      saldo_estoque: 0,
    });
  });

  it("rejeita preço negativo", async () => {
    const result = await criarProduto({
      nome: "Ração",
      categoria: "Alimentos",
      precoUnitario: -1,
      estoqueMinimo: 5,
    });

    expect(result.error).toContain("preço");
    expect(from).not.toHaveBeenCalled();
  });
});

describe("registrarEntrada", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eqUpdate.mockResolvedValue({ error: null });
  });

  it("soma a quantidade ao saldo atual", async () => {
    single.mockResolvedValue({ data: { saldo_estoque: 10 }, error: null });

    const result = await registrarEntrada(1, 5);

    expect(result.error).toBeUndefined();
    expect(update).toHaveBeenCalledWith({ saldo_estoque: 15 });
  });

  it("rejeita quantidade inválida sem chamar o banco", async () => {
    const result = await registrarEntrada(1, 0);

    expect(result.error).toBe("Dados inválidos. Informe uma quantidade válida (maior que zero).");
    expect(from).not.toHaveBeenCalled();
  });
});

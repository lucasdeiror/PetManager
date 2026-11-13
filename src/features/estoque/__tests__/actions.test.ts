import { describe, it, expect, vi, beforeEach } from "vitest";
import { criarProduto, registrarEntrada } from "../actions";

const single = vi.fn();
const select = vi.fn(() => ({ single, eq: vi.fn(() => ({ single })) }));
const insert = vi.fn(() => ({ select }));

const from = vi.fn(() => ({ insert, select }));
const rpc = vi.fn();

vi.mock("../../auth/queries", () => ({ exigirDono: vi.fn(async () => ({})) }));

vi.mock("../../../shared/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from, rpc })),
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
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe("registrarEntrada", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rpc.mockResolvedValue({ error: null });
  });

  it("registra a entrada pela RPC atômica", async () => {
    const result = await registrarEntrada(1, 5);

    expect(result.error).toBeUndefined();
    expect(rpc).toHaveBeenCalledWith("registrar_entrada", { p_produto_id: 1, p_quantidade: 5 });
  });

  it("produto inexistente vira mensagem amigável", async () => {
    rpc.mockResolvedValue({ error: { message: "Produto não encontrado" } });

    expect((await registrarEntrada(1, 5)).error).toBe("Produto não encontrado.");
  });

  it("falha do banco devolve erro genérico", async () => {
    rpc.mockResolvedValue({ error: { message: "boom" } });

    expect((await registrarEntrada(1, 5)).error).toBe("Não foi possível registrar a entrada. Tente novamente.");
  });

  it("rejeita quantidade inválida sem chamar o banco", async () => {
    const result = await registrarEntrada(1, 0);

    expect(result.error).toBe("Dados inválidos. Informe uma quantidade válida (maior que zero).");
    expect(rpc).not.toHaveBeenCalled();
  });
});

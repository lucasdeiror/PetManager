import { describe, it, expect, vi, beforeEach } from "vitest";
import { registrarVendaProduto } from "../actions";

const rpc = vi.fn();

vi.mock("../../auth/queries", () => ({ exigirDono: vi.fn(async () => ({})) }));

vi.mock("../../../shared/supabase/server", () => ({
  createClient: vi.fn(async () => ({ rpc })),
}));

describe("registrarVendaProduto", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debita o estoque corretamente ao registrar a venda", async () => {
    rpc.mockResolvedValue({ data: 42, error: null });

    const result = await registrarVendaProduto(1, 3);

    expect(result.error).toBeUndefined();
    expect(result.vendaId).toBe(42);
    expect(rpc).toHaveBeenCalledWith("registrar_venda_produto", {
      p_produto_id: 1,
      p_quantidade: 3,
    });
  });

  it("retorna mensagem de saldo insuficiente", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "Saldo insuficiente" } });

    const result = await registrarVendaProduto(1, 999);

    expect(result.error).toBe("Saldo insuficiente para essa quantidade.");
  });

  it("retorna mensagem genérica para outros erros", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "algo inesperado" } });

    const result = await registrarVendaProduto(1, 1);

    expect(result.error).toBe("Não foi possível registrar a venda. Tente novamente.");
  });
});

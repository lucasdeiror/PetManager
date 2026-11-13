import { describe, it, expect, vi, beforeEach } from "vitest";
import { criarServico } from "../actions";

const single = vi.fn();
const select = vi.fn(() => ({ single }));
const insert = vi.fn(() => ({ select }));
const from = vi.fn(() => ({ insert }));

vi.mock("../../auth/queries", () => ({ exigirDono: vi.fn(async () => ({})) }));

vi.mock("../../../shared/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from })),
}));

describe("criarServico", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    single.mockResolvedValue({ data: { id: 1 }, error: null });
  });

  it("cadastra com nome e preço válidos", async () => {
    const result = await criarServico({ nome: "Banho", precoInterno: 40 });

    expect(result.error).toBeUndefined();
    expect(result.id).toBe(1);
    expect(insert).toHaveBeenCalledWith({ nome: "Banho", preco_interno: 40 });
  });

  it("rejeita preço negativo", async () => {
    const result = await criarServico({ nome: "Banho", precoInterno: -10 });

    expect(result.error).toBe("Dados inválidos. O preço deve ser um número válido e não pode ser negativo.");
    expect(from).not.toHaveBeenCalled();
  });

  it("rejeita preço não numérico (NaN)", async () => {
    const result = await criarServico({ nome: "Banho", precoInterno: NaN });

    expect(result.error).toBe("Dados inválidos. O preço deve ser um número válido e não pode ser negativo.");
    expect(from).not.toHaveBeenCalled();
  });
});

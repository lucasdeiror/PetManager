import { describe, it, expect, vi, beforeEach } from "vitest";
import { criarServico } from "../actions";
import { createClient } from "../../../shared/supabase/server";
import { exigirDono } from "../../auth/queries";

vi.mock("../../../shared/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("../../auth/queries", () => ({ exigirDono: vi.fn() }));

const forjado = <T>(v: unknown) => v as T;

describe("criarServico: entrada e papel (ENT-01, ENT-03, SEG-01)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(exigirDono).mockResolvedValue({});
  });

  it.each([
    ["preço texto", { nome: "Banho", precoInterno: "40" }],
    ["preço negativo", { nome: "Banho", precoInterno: -0.01 }],
    ["nome: 123", { nome: 123, precoInterno: 40 }],
    ["nome de 256 chars", { nome: "a".repeat(256), precoInterno: 40 }],
  ])("%s → Dados inválidos, sem papel nem Supabase", async (_n, entrada) => {
    const result = await criarServico(forjado(entrada));

    expect(result.error).toMatch(/^Dados inválidos\. /);
    expect(exigirDono).not.toHaveBeenCalled();
    expect(createClient).not.toHaveBeenCalled();
  });

  it("preço zero é aceito (limite ≥ 0 mantido)", async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: 3 }, error: null });
    vi.mocked(createClient).mockResolvedValue(
      forjado({ from: () => ({ insert: () => ({ select: () => ({ single }) }) }) }),
    );

    expect(await criarServico({ nome: "Cortesia", precoInterno: 0 })).toEqual({ id: 3 });
  });

  it("recepcionista é bloqueada, sem Supabase", async () => {
    vi.mocked(exigirDono).mockResolvedValue({ error: "Ação permitida só ao dono." });

    expect(await criarServico({ nome: "Banho", precoInterno: 40 })).toEqual({ error: "Ação permitida só ao dono." });
    expect(createClient).not.toHaveBeenCalled();
  });
});

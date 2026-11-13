import { describe, it, expect, vi, beforeEach } from "vitest";
import { registrarVendaProduto } from "../actions";
import { createClient } from "../../../shared/supabase/server";
import { exigirDono } from "../../auth/queries";

vi.mock("../../../shared/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("../../auth/queries", () => ({ exigirDono: vi.fn() }));

describe("registrarVendaProduto: entrada e papel (ENT-01, ENT-03, SEG-01)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(exigirDono).mockResolvedValue({});
  });

  it.each([0, -1, 1.5, NaN, "2" as unknown as number])(
    "quantidade %s → Dados inválidos, sem RPC",
    async (quantidade) => {
      const result = await registrarVendaProduto(1, quantidade);

      expect(result.error).toMatch(/^Dados inválidos\. /);
      expect(exigirDono).not.toHaveBeenCalled();
      expect(createClient).not.toHaveBeenCalled();
    },
  );

  it("produtoId inválido → Dados inválidos, sem RPC", async () => {
    const result = await registrarVendaProduto("1" as unknown as number, 1);

    expect(result.error).toMatch(/^Dados inválidos\. /);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("recepcionista é bloqueada, sem RPC", async () => {
    vi.mocked(exigirDono).mockResolvedValue({ error: "Ação permitida só ao dono." });

    expect(await registrarVendaProduto(1, 1)).toEqual({ error: "Ação permitida só ao dono." });
    expect(createClient).not.toHaveBeenCalled();
  });
});

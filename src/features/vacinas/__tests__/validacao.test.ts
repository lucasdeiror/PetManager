import { describe, it, expect, vi, beforeEach } from "vitest";
import { registrarVacina } from "../actions";
import { createClient } from "../../../shared/supabase/server";
import { exigirSessao } from "../../auth/queries";

vi.mock("../../../shared/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("../../auth/queries", () => ({ exigirSessao: vi.fn() }));

const forjado = <T>(v: unknown) => v as T;
const vacina = { petId: 1, nome: "V10", dataAplicacao: "2026-09-01", dataRetornoPrevista: "2027-09-01" };

describe("registrarVacina: entrada validada", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(exigirSessao).mockResolvedValue({ role: "dono" });
  });

  it("data malformada gera um único erro, sem duplicar (ENT-02)", async () => {
    const result = await registrarVacina({ ...vacina, dataAplicacao: "27/10/2026" });

    expect(result).toEqual({ error: "Dados inválidos. Data inválida" });
    expect(exigirSessao).not.toHaveBeenCalled();
    expect(createClient).not.toHaveBeenCalled();
  });

  it.each([
    ["nome: 123", { nome: 123 }],
    ["petId texto", { petId: "1" }],
    ["data inexistente no calendário", { dataRetornoPrevista: "2027-02-30" }],
    ["nome de 256 chars", { nome: "a".repeat(256) }],
  ])("%s → Dados inválidos, sem Supabase", async (_n, parcial) => {
    const result = await registrarVacina(forjado({ ...vacina, ...parcial }));

    expect(result.error).toMatch(/^Dados inválidos\. /);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("sem sessão → Sessão expirada, sem Supabase (SEG-02)", async () => {
    vi.mocked(exigirSessao).mockResolvedValue({ error: "Sessão expirada. Entre novamente." });

    expect(await registrarVacina(vacina)).toEqual({ error: "Sessão expirada. Entre novamente." });
    expect(createClient).not.toHaveBeenCalled();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { salvarHorario } from "../actions";
import { createClient } from "../../../shared/supabase/server";
import { exigirDono } from "../../auth/queries";

vi.mock("../../../shared/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("../../auth/queries", () => ({ exigirDono: vi.fn() }));

const forjado = <T>(v: unknown) => v as T;
const ok = { diaSemana: 1, horaAbertura: "09:00", horaFechamento: "18:00" };

describe("salvarHorario: entrada e papel (ENT-01, SEG-01)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(exigirDono).mockResolvedValue({});
  });

  it.each([
    ["dia 7", { ...ok, diaSemana: 7 }],
    ["dia fracionado", { ...ok, diaSemana: 1.5 }],
    ["dia texto", { ...ok, diaSemana: "1" }],
    ["hora 25:00", { ...ok, horaAbertura: "25:00" }],
    ["hora sem formato", { ...ok, horaFechamento: "6pm" }],
    ["hora não-string", { ...ok, horaAbertura: 900 }],
  ])("%s → Dados inválidos, sem papel nem Supabase", async (_n, entrada) => {
    const result = await salvarHorario(forjado(entrada));

    expect(result.error).toMatch(/^Dados inválidos\. /);
    expect(exigirDono).not.toHaveBeenCalled();
    expect(createClient).not.toHaveBeenCalled();
  });

  it("recepcionista é bloqueada, sem Supabase", async () => {
    vi.mocked(exigirDono).mockResolvedValue({ error: "Ação permitida só ao dono." });

    expect(await salvarHorario(ok)).toEqual({ error: "Ação permitida só ao dono." });
    expect(createClient).not.toHaveBeenCalled();
  });
});

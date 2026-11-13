import { describe, it, expect, vi, beforeEach } from "vitest";
import { reabrirAgendamento } from "../actions";

const single = vi.fn();
const eqSelect = vi.fn(() => ({ single }));
const select = vi.fn(() => ({ eq: eqSelect }));

const eqUpdate = vi.fn();
const update = vi.fn(() => ({ eq: eqUpdate }));

const from = vi.fn(() => ({ select, update }));

vi.mock("../../auth/queries", () => ({ exigirSessao: vi.fn(async () => ({ role: "dono" })) }));

vi.mock("../../../shared/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from })),
}));

describe("reabrirAgendamento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eqUpdate.mockResolvedValue({ error: null });
  });

  it("reabre um agendamento cancelado, voltando a agendado", async () => {
    single.mockResolvedValue({ data: { status: "cancelado" }, error: null });

    const result = await reabrirAgendamento(7);

    expect(result.error).toBeUndefined();
    expect(update).toHaveBeenCalledWith({ status: "agendado" });
  });

  it("rejeita reabertura de agendamento que não está cancelado", async () => {
    single.mockResolvedValue({ data: { status: "concluido" }, error: null });

    const result = await reabrirAgendamento(7);

    expect(result.error).toBe("Só é possível reabrir um agendamento cancelado.");
    expect(update).not.toHaveBeenCalled();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { salvarHorario } from "../actions";

const maybeSingle = vi.fn();
const eqSelect = vi.fn(() => ({ maybeSingle }));
const select = vi.fn(() => ({ eq: eqSelect }));

const eqUpdate = vi.fn();
const update = vi.fn(() => ({ eq: eqUpdate }));

const insert = vi.fn();

const from = vi.fn(() => ({ select, update, insert }));

vi.mock("../../auth/queries", () => ({ exigirDono: vi.fn(async () => ({})) }));

vi.mock("../../../shared/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from })),
}));

describe("salvarHorario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insert.mockResolvedValue({ error: null });
    eqUpdate.mockResolvedValue({ error: null });
  });

  it("insere um novo dia quando ainda não existe registro", async () => {
    maybeSingle.mockResolvedValue({ data: null });

    const result = await salvarHorario({
      diaSemana: 1,
      horaAbertura: "09:00",
      horaFechamento: "18:00",
    });

    expect(result.error).toBeUndefined();
    expect(insert).toHaveBeenCalledWith({
      dia_semana: 1,
      hora_abertura: "09:00",
      hora_fechamento: "18:00",
    });
  });

  it("atualiza o dia quando já existe registro", async () => {
    maybeSingle.mockResolvedValue({ data: { id: 5 } });

    const result = await salvarHorario({
      diaSemana: 1,
      horaAbertura: "08:00",
      horaFechamento: "17:00",
    });

    expect(result.error).toBeUndefined();
    expect(update).toHaveBeenCalledWith({
      dia_semana: 1,
      hora_abertura: "08:00",
      hora_fechamento: "17:00",
    });
    expect(eqUpdate).toHaveBeenCalledWith("id", 5);
  });

  it("rejeita fechamento igual ou anterior à abertura sem chamar o banco", async () => {
    const result = await salvarHorario({
      diaSemana: 1,
      horaAbertura: "18:00",
      horaFechamento: "09:00",
    });

    expect(result.error).toBe(
      "O horário de fechamento deve ser depois do horário de abertura.",
    );
    expect(from).not.toHaveBeenCalled();
  });
});

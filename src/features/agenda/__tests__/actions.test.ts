import { describe, it, expect, vi, beforeEach } from "vitest";
import { criarAgendamento } from "../actions";
import { getHorarios } from "../../horario-funcionamento/queries";

vi.mock("../../auth/queries", () => ({ exigirSessao: vi.fn(async () => ({ role: "dono" })) }));

vi.mock("../../horario-funcionamento/queries", () => ({
  getHorarios: vi.fn(),
}));

const singleAgendamento = vi.fn();
const selectAgendamento = vi.fn(() => ({ single: singleAgendamento }));
const insertAgendamento = vi.fn(() => ({ select: selectAgendamento }));
const insertAgendamentoServicos = vi.fn();
const getUser = vi.fn();

const from = vi.fn((table: string) => {
  if (table === "agendamentos") return { insert: insertAgendamento };
  if (table === "agendamento_servicos") return { insert: insertAgendamentoServicos };
  throw new Error(`tabela inesperada: ${table}`);
});

vi.mock("../../../shared/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from, auth: { getUser } })),
}));

const HORARIOS_SEGUNDA = [{ diaSemana: 1, horaAbertura: "09:00", horaFechamento: "18:00" }];

describe("criarAgendamento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    singleAgendamento.mockResolvedValue({ data: { id: 10 }, error: null });
    insertAgendamentoServicos.mockResolvedValue({ error: null });
    vi.mocked(getHorarios).mockResolvedValue(HORARIOS_SEGUNDA);
  });

  it("cria agendamento dentro do expediente", async () => {
    // 2026-09-21 é uma segunda-feira, 10h
    const result = await criarAgendamento({
      petId: 1,
      servicoIds: [1],
      dataHora: "2026-09-21T10:00:00",
    });

    expect(result.error).toBeUndefined();
    expect(result.id).toBe(10);
    expect(insertAgendamento).toHaveBeenCalledWith(
      expect.objectContaining({ pet_id: 1, data_hora: "2026-09-21T10:00:00-03:00" }),
    );
  });

  it("aceita agendamento exatamente no horário de abertura (valor de limite)", async () => {
    // Sensor de discriminação (fechamento do projeto) encontrou que o
    // teste original não cobria o limite exato — só valores
    // estritamente dentro do expediente. Sem este teste, trocar
    // `hora < horaAbertura` por `hora <= horaAbertura` passava
    // despercebido (mutante sobrevivia).
    const result = await criarAgendamento({
      petId: 1,
      servicoIds: [1],
      dataHora: "2026-09-21T09:00:00",
    });

    expect(result.error).toBeUndefined();
  });

  it("rejeita horário fora do expediente", async () => {
    const result = await criarAgendamento({
      petId: 1,
      servicoIds: [1],
      dataHora: "2026-09-21T20:00:00",
    });

    expect(result.error).toBe("Esse horário está fora do expediente cadastrado para esse dia.");
    expect(from).not.toHaveBeenCalled();
  });

  it("aceita dois agendamentos simultâneos no mesmo horário, sem bloqueio", async () => {
    const input = { petId: 1, servicoIds: [1], dataHora: "2026-09-21T10:00:00" };

    const [primeiro, segundo] = await Promise.all([criarAgendamento(input), criarAgendamento(input)]);

    expect(primeiro.error).toBeUndefined();
    expect(segundo.error).toBeUndefined();
    expect(insertAgendamento).toHaveBeenCalledTimes(2);
  });
});

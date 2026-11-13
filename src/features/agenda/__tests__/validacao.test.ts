import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  criarAgendamento,
  editarAgendamento,
  cancelarAgendamento,
  reabrirAgendamento,
  concluirAgendamento,
  reabrirAgendamentoConcluido,
} from "../actions";
import { createClient } from "../../../shared/supabase/server";
import { exigirSessao } from "../../auth/queries";

vi.mock("../../../shared/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("../../auth/queries", () => ({ exigirSessao: vi.fn() }));
vi.mock("../../horario-funcionamento/queries", () => ({ getHorarios: vi.fn() }));

const INVALIDO = /^Dados inválidos\. /;
// Cast: o ponto é justamente enviar o que o TypeScript não deixaria (POST forjado).
const forjado = <T>(v: unknown) => v as T;

describe("agenda: entrada validada (ENT-01, ENT-02)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(exigirSessao).mockResolvedValue({ role: "dono" });
  });

  const casos: [string, () => Promise<{ error?: string }>][] = [
    ["criarAgendamento", () => criarAgendamento(forjado({ petId: "1", servicoIds: [1], dataHora: "2026-09-21T10:00:00" }))],
    ["criarAgendamento (servicoIds não é lista)", () => criarAgendamento(forjado({ petId: 1, servicoIds: 5, dataHora: "2026-09-21T10:00:00" }))],
    ["editarAgendamento", () => editarAgendamento(forjado({ id: "7" }))],
    ["cancelarAgendamento", () => cancelarAgendamento(forjado("7"))],
    ["reabrirAgendamento", () => reabrirAgendamento(forjado(null))],
    ["concluirAgendamento", () => concluirAgendamento(forjado({ id: 1 }))],
    ["reabrirAgendamentoConcluido", () => reabrirAgendamentoConcluido(forjado(1.5))],
  ];

  it.each(casos)("%s: payload malformado → Dados inválidos, sem sessão nem Supabase", async (_nome, chamar) => {
    const result = await chamar();

    expect(result.error).toMatch(INVALIDO);
    expect(exigirSessao).not.toHaveBeenCalled();
    expect(createClient).not.toHaveBeenCalled();
  });

  it("data/hora ilegível → mensagem do schema", async () => {
    const result = await criarAgendamento({ petId: 1, servicoIds: [1], dataHora: "ontem" });

    expect(result).toEqual({ error: "Dados inválidos. Data e hora inválidas" });
  });
});

describe("agenda: sessão no servidor (SEG-02)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(exigirSessao).mockResolvedValue({ error: "Sessão expirada. Entre novamente." });
  });

  const casos: [string, () => Promise<{ error?: string }>][] = [
    ["criarAgendamento", () => criarAgendamento({ petId: 1, servicoIds: [1], dataHora: "2026-09-21T10:00:00" })],
    ["editarAgendamento", () => editarAgendamento({ id: 7 })],
    ["cancelarAgendamento", () => cancelarAgendamento(7)],
    ["reabrirAgendamento", () => reabrirAgendamento(7)],
    ["concluirAgendamento", () => concluirAgendamento(7)],
    ["reabrirAgendamentoConcluido", () => reabrirAgendamentoConcluido(7)],
  ];

  it.each(casos)("%s: sem sessão → Sessão expirada, sem Supabase", async (_nome, chamar) => {
    const result = await chamar();

    expect(result).toEqual({ error: "Sessão expirada. Entre novamente." });
    expect(createClient).not.toHaveBeenCalled();
  });
});

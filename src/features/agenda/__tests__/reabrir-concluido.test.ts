import { describe, it, expect, vi, beforeEach } from "vitest";
import { reabrirAgendamentoConcluido } from "../actions";

const rpc = vi.fn();

vi.mock("../../auth/queries", () => ({ exigirSessao: vi.fn(async () => ({ role: "dono" })) }));

vi.mock("../../../shared/supabase/server", () => ({
  createClient: vi.fn(async () => ({ rpc })),
}));

describe("reabrirAgendamentoConcluido", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("remove a venda associada e reabre o agendamento", async () => {
    rpc.mockResolvedValue({ data: null, error: null });

    const result = await reabrirAgendamentoConcluido(1);

    expect(result.error).toBeUndefined();
    expect(rpc).toHaveBeenCalledWith("reabrir_agendamento_concluido", { p_agendamento_id: 1 });
  });

  it("reabrir um agendamento já sem venda não gera erro (idempotente)", async () => {
    // A função SQL só falha se o agendamento em si não existir — a
    // ausência de venda associada não é um erro, é o próprio caso de
    // idempotência que a função foi desenhada pra cobrir.
    rpc.mockResolvedValue({ data: null, error: null });

    const result = await reabrirAgendamentoConcluido(2);

    expect(result.error).toBeUndefined();
  });

  it("retorna erro se o agendamento não existir", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "Agendamento não encontrado" } });

    const result = await reabrirAgendamentoConcluido(999);

    expect(result.error).toBe("Agendamento não encontrado.");
  });

  it("agendamento fora de concluído devolve 'Agendamento não está concluído' (IDP-06)", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "Agendamento não está concluído" } });

    const result = await reabrirAgendamentoConcluido(1);

    expect(result.error).toBe("Agendamento não está concluído");
  });
});

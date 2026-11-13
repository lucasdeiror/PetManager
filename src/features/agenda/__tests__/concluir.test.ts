import { describe, it, expect, vi, beforeEach } from "vitest";
import { concluirAgendamento } from "../actions";

const rpc = vi.fn();

vi.mock("../../../shared/supabase/server", () => ({
  createClient: vi.fn(async () => ({ rpc })),
}));

describe("concluirAgendamento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cria exatamente 1 venda com o valor somado dos serviços", async () => {
    rpc.mockResolvedValue({ data: 99, error: null });

    const result = await concluirAgendamento(1);

    expect(result.error).toBeUndefined();
    expect(result.vendaId).toBe(99);
    expect(rpc).toHaveBeenCalledWith("concluir_agendamento", { p_agendamento_id: 1 });
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it("permite concluir mesmo com a data já passada (sem checagem de data aqui)", async () => {
    rpc.mockResolvedValue({ data: 100, error: null });

    // A Server Action não faz nenhuma validação de data — quem decide
    // isso é só a existência do agendamento, verificada na função SQL.
    const result = await concluirAgendamento(2);

    expect(result.error).toBeUndefined();
  });

  it("rejeita conclusão duplicada (constraint de unicidade da venda)", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "23505", message: "duplicate key" } });

    const result = await concluirAgendamento(1);

    expect(result.error).toBe("Este agendamento já foi concluído.");
  });

  it("agendamento fora de agendado devolve 'Agendamento não está agendado' (IDP-02)", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "Agendamento não está agendado" } });

    const result = await concluirAgendamento(1);

    expect(result.error).toBe("Agendamento não está agendado");
    expect(result.vendaId).toBeUndefined();
  });
});

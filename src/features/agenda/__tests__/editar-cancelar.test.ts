import { describe, it, expect, vi, beforeEach } from "vitest";
import { editarAgendamento, cancelarAgendamento } from "../actions";

const eqUpdate = vi.fn();
const update = vi.fn(() => ({ eq: eqUpdate }));
const eqDelete = vi.fn();
const del = vi.fn(() => ({ eq: eqDelete }));
const insertServicos = vi.fn();
const single = vi.fn();
const select = vi.fn(() => ({ eq: () => ({ single }) }));

const from = vi.fn((table: string) => {
  if (table === "agendamentos") return { update, select };
  if (table === "agendamento_servicos") return { delete: del, insert: insertServicos };
  throw new Error(`tabela inesperada: ${table}`);
});

vi.mock("../../auth/queries", () => ({ exigirSessao: vi.fn(async () => ({ role: "dono" })) }));

vi.mock("../../../shared/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from })),
}));

describe("editarAgendamento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    single.mockResolvedValue({ data: { status: "agendado" }, error: null });
    eqUpdate.mockResolvedValue({ error: null });
    eqDelete.mockResolvedValue({ error: null });
    insertServicos.mockResolvedValue({ error: null });
  });

  it("preserva o id e atualiza pet/data corretamente", async () => {
    const result = await editarAgendamento({ id: 7, petId: 2, dataHora: "2026-09-21T11:00:00" });

    expect(result.error).toBeUndefined();
    expect(update).toHaveBeenCalledWith({ pet_id: 2, data_hora: "2026-09-21T11:00:00-03:00" });
    expect(eqUpdate).toHaveBeenCalledWith("id", 7);
  });

  it("substitui os serviços quando servicoIds é informado", async () => {
    const result = await editarAgendamento({ id: 7, servicoIds: [3, 4] });

    expect(result.error).toBeUndefined();
    expect(eqDelete).toHaveBeenCalledWith("agendamento_id", 7);
    expect(insertServicos).toHaveBeenCalledWith([
      { agendamento_id: 7, servico_id: 3 },
      { agendamento_id: 7, servico_id: 4 },
    ]);
  });
});

describe("editarAgendamento com status diferente de agendado (MAQ-03)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eqUpdate.mockResolvedValue({ error: null });
    eqDelete.mockResolvedValue({ error: null });
    insertServicos.mockResolvedValue({ error: null });
  });

  it.each(["concluido", "cancelado"])("recusa editar agendamento %s sem alterar nada", async (status) => {
    single.mockResolvedValue({ data: { status }, error: null });

    const result = await editarAgendamento({ id: 7, petId: 2, servicoIds: [3] });

    expect(result.error).toBe("Só é possível editar agendamentos agendados");
    expect(update).not.toHaveBeenCalled();
    expect(del).not.toHaveBeenCalled();
    expect(insertServicos).not.toHaveBeenCalled();
  });
});

describe("cancelarAgendamento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eqUpdate.mockResolvedValue({ error: null });
  });

  it("muda o status sem excluir o registro nem tocar em vendas", async () => {
    const result = await cancelarAgendamento(7);

    expect(result.error).toBeUndefined();
    expect(update).toHaveBeenCalledWith({ status: "cancelado" });
    expect(eqUpdate).toHaveBeenCalledWith("id", 7);
    expect(del).not.toHaveBeenCalled();
  });

  it("agendamento concluído: devolve a mensagem de reabrir antes de cancelar (MAQ-02)", async () => {
    eqUpdate.mockResolvedValue({ error: { message: "Reabra o agendamento antes de cancelar" } });

    const result = await cancelarAgendamento(7);

    expect(result.error).toBe("Reabra o agendamento antes de cancelar");
  });
});

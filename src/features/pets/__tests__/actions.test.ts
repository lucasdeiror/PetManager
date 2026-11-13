import { describe, it, expect, vi, beforeEach } from "vitest";
import { criarTutor, criarPet } from "../actions";

const single = vi.fn();
const select = vi.fn(() => ({ single }));
const insert = vi.fn(() => ({ select }));
const from = vi.fn(() => ({ insert }));

vi.mock("../../auth/queries", () => ({ exigirSessao: vi.fn(async () => ({ role: "dono" })) }));

vi.mock("../../../shared/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from })),
}));

describe("criarTutor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    single.mockResolvedValue({ data: { id: 1 }, error: null });
  });

  it("cadastra com telefone BR válido", async () => {
    const result = await criarTutor({ nome: "Maria Silva", telefone: "(79) 99999-9999" });

    expect(result.error).toBeUndefined();
    expect(result.id).toBe(1);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ nome: "Maria Silva", telefone: "+5579999999999" }),
    );
  });

  it("rejeita telefone inválido indicando o formato esperado", async () => {
    const result = await criarTutor({ nome: "Maria Silva", telefone: "123" });

    expect(result.error).toContain("formato brasileiro");
    expect(from).not.toHaveBeenCalled();
  });

  it("rejeita nome com mais de 255 caracteres", async () => {
    const nomeLongo = "a".repeat(256);

    const result = await criarTutor({ nome: nomeLongo, telefone: "(79) 99999-9999" });

    expect(result.error).toBe("Dados inválidos. O nome não pode ter mais de 255 caracteres.");
    expect(from).not.toHaveBeenCalled();
  });
});

describe("criarPet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cadastra pet vinculado a tutor existente", async () => {
    single.mockResolvedValue({ data: { id: 10 }, error: null });

    const result = await criarPet({ tutorId: 1, nome: "Rex", raca: "Vira-lata", porte: "medio" });

    expect(result.error).toBeUndefined();
    expect(result.id).toBe(10);
    expect(insert).toHaveBeenCalledWith({
      tutor_id: 1,
      nome: "Rex",
      raca: "Vira-lata",
      porte: "medio",
    });
  });

  it("rejeita tutorId inexistente (violação de FK)", async () => {
    single.mockResolvedValue({ data: null, error: { code: "23503" } });

    const result = await criarPet({ tutorId: 999, nome: "Rex", raca: "Vira-lata", porte: "medio" });

    expect(result.error).toBe("Tutor não encontrado. Selecione um tutor já cadastrado.");
  });
});

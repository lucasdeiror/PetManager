import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCurrentUserRole, exigirSessao, exigirDono } from "../queries";

const getUser = vi.fn();
const single = vi.fn();
const eq = vi.fn(() => ({ single }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));

vi.mock("../../../shared/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser },
    from,
  })),
}));

describe("getCurrentUserRole", () => {
  beforeEach(() => {
    getUser.mockReset();
    single.mockReset();
  });

  it("retorna null se não autenticado", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const role = await getCurrentUserRole();

    expect(role).toBeNull();
  });

  it("retorna 'dono' para o profile correspondente", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-dono" } } });
    single.mockResolvedValue({ data: { role: "dono" } });

    const role = await getCurrentUserRole();

    expect(role).toBe("dono");
    expect(eq).toHaveBeenCalledWith("id", "user-dono");
  });

  it("retorna 'recepcionista' para o profile correspondente", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-recep" } } });
    single.mockResolvedValue({ data: { role: "recepcionista" } });

    const role = await getCurrentUserRole();

    expect(role).toBe("recepcionista");
  });

  it("retorna null se autenticado mas sem profile correspondente", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-orfao" } } });
    single.mockResolvedValue({ data: null });

    const role = await getCurrentUserRole();

    expect(role).toBeNull();
  });
});

describe("exigirSessao / exigirDono", () => {
  beforeEach(() => {
    getUser.mockReset();
    single.mockReset();
  });

  it("sem sessão: Sessão expirada (SEG-02)", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    expect(await exigirSessao()).toEqual({ error: "Sessão expirada. Entre novamente." });
    expect(await exigirDono()).toEqual({ error: "Sessão expirada. Entre novamente." });
  });

  it("recepcionista passa em exigirSessao e é barrada em exigirDono (SEG-01)", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u" } } });
    single.mockResolvedValue({ data: { role: "recepcionista" } });

    expect(await exigirSessao()).toEqual({ role: "recepcionista" });
    expect(await exigirDono()).toEqual({ error: "Ação permitida só ao dono." });
  });

  it("dono passa em exigirDono (SEG-01)", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u" } } });
    single.mockResolvedValue({ data: { role: "dono" } });

    expect(await exigirDono()).toEqual({});
  });
});

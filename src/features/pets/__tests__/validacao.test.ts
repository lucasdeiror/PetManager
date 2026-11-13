import { describe, it, expect, vi, beforeEach } from "vitest";
import { criarTutor, criarPet } from "../actions";
import { createClient } from "../../../shared/supabase/server";
import { exigirSessao } from "../../auth/queries";

vi.mock("../../../shared/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("../../auth/queries", () => ({ exigirSessao: vi.fn() }));

const INVALIDO = /^Dados inválidos\. /;
const forjado = <T>(v: unknown) => v as T;
const pet = { tutorId: 1, nome: "Rex", raca: "Vira-lata", porte: "medio" as const };
const tutor = { nome: "Maria", telefone: "(79) 99999-9999" };

describe("pets: entrada validada (ENT-01..ENT-04)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(exigirSessao).mockResolvedValue({ role: "recepcionista" });
  });

  const casos: [string, () => Promise<{ error?: string }>][] = [
    ["criarTutor nome: 123", () => criarTutor(forjado({ ...tutor, nome: 123 }))],
    ["criarTutor telefone inválido", () => criarTutor({ ...tutor, telefone: "123" })],
    ["criarTutor nome de 256 chars", () => criarTutor({ ...tutor, nome: "a".repeat(256) })],
    ["criarTutor nome só com espaços", () => criarTutor({ ...tutor, nome: "   " })],
    ["criarPet nome: 123", () => criarPet(forjado({ ...pet, nome: 123 }))],
    ["criarPet porte gigante", () => criarPet(forjado({ ...pet, porte: "gigante" }))],
    ["criarPet nome de 256 chars", () => criarPet({ ...pet, nome: "a".repeat(256) })],
    ["criarPet tutorId texto", () => criarPet(forjado({ ...pet, tutorId: "1" }))],
  ];

  it.each(casos)("%s → Dados inválidos, sem sessão nem Supabase", async (_nome, chamar) => {
    const result = await chamar();

    expect(result.error).toMatch(INVALIDO);
    expect(exigirSessao).not.toHaveBeenCalled();
    expect(createClient).not.toHaveBeenCalled();
  });

  it("telefone inválido traz a orientação de formato", async () => {
    const result = await criarTutor({ ...tutor, telefone: "123" });

    expect(result.error).toBe(
      "Dados inválidos. Informe um telefone válido no formato brasileiro, com DDD (ex.: (79) 99999-9999).",
    );
  });

  it("espaços nas pontas são removidos antes de checar o tamanho (ENT-04)", async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: 1 }, error: null });
    const insert = vi.fn(() => ({ select: () => ({ single }) }));
    vi.mocked(createClient).mockResolvedValue(forjado({ from: () => ({ insert }) }));

    const result = await criarTutor({ ...tutor, nome: ` ${"a".repeat(255)} ` });

    expect(result).toEqual({ id: 1 });
    expect(insert).toHaveBeenCalledWith({ nome: "a".repeat(255), telefone: "+5579999999999" });
  });
});

describe("pets: sessão no servidor (SEG-02)", () => {
  it.each([
    ["criarTutor", () => criarTutor(tutor)],
    ["criarPet", () => criarPet(pet)],
  ])("%s sem sessão → Sessão expirada, sem Supabase", async (_n, chamar) => {
    vi.clearAllMocks();
    vi.mocked(exigirSessao).mockResolvedValue({ error: "Sessão expirada. Entre novamente." });

    expect(await chamar()).toEqual({ error: "Sessão expirada. Entre novamente." });
    expect(createClient).not.toHaveBeenCalled();
  });
});

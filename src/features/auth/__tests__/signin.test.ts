import { describe, it, expect, vi, beforeEach } from "vitest";
import { signIn } from "../actions";
import { createClient } from "../../../shared/supabase/server";

const signInWithPassword = vi.fn();
const signOut = vi.fn();
const maybeSingle = vi.fn();
const consulta = { select: () => consulta, eq: () => consulta, maybeSingle };

vi.mock("../../../shared/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { signInWithPassword, signOut },
    from: () => consulta,
  })),
}));

describe("signIn", () => {
  beforeEach(() => {
    signInWithPassword.mockReset();
    signOut.mockReset();
    maybeSingle.mockReset();
  });

  it("autentica com sucesso e não retorna erro", async () => {
    signInWithPassword.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    maybeSingle.mockResolvedValue({ data: { role: "dono" }, error: null });
    const result = await signIn("dono@petshop.com", "senha-correta");
    expect(result.error).toBeUndefined();
    expect(signOut).not.toHaveBeenCalled();
  });

  it("login sem perfil ativo encerra a sessão e avisa, em vez de voltar mudo ao login", async () => {
    signInWithPassword.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    maybeSingle.mockResolvedValue({ data: null, error: null });
    const result = await signIn("sem-perfil@petshop.com", "senha-correta");
    expect(result.error).toBe("Usuário sem acesso ao sistema. Fale com o dono do petshop.");
    expect(signOut).toHaveBeenCalledOnce();
  });

  it("retorna a mesma mensagem genérica independente da causa do erro no Supabase", async () => {
    signInWithPassword.mockResolvedValueOnce({
      data: null,
      error: { message: "Invalid login credentials" },
    });
    const semSenhaCorreta = await signIn("dono@petshop.com", "senha-errada");

    signInWithPassword.mockResolvedValueOnce({
      data: null,
      error: { message: "User not found" },
    });
    const usuarioInexistente = await signIn("nao-existe@petshop.com", "qualquer");

    expect(semSenhaCorreta.error).toBe("E-mail ou senha inválidos");
    expect(usuarioInexistente.error).toBe("E-mail ou senha inválidos");
    expect(semSenhaCorreta.error).toBe(usuarioInexistente.error);
  });
});

describe("signIn: entrada validada (ENT-01, ENT-02)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ["e-mail não-string", 123, "senha"],
    ["e-mail malformado", "nao-e-email", "senha"],
    ["senha vazia", "dono@petshop.com", ""],
    ["senha não-string", "dono@petshop.com", null],
  ])("%s → Dados inválidos, sem chamar o Auth", async (_n, email, senha) => {
    const result = await signIn(email as unknown as string, senha as unknown as string);

    expect(result.error).toMatch(/^Dados inválidos\. /);
    expect(createClient).not.toHaveBeenCalled();
    expect(signInWithPassword).not.toHaveBeenCalled();
  });
});

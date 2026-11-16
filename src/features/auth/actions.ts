"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "../../shared/supabase/server";
import { validar } from "../../shared/validacao/validar";

const MENSAGEM_ERRO_GENERICA = "E-mail ou senha inválidos";
const MENSAGEM_SEM_PERFIL = "Usuário sem acesso ao sistema. Fale com o dono do petshop.";

const signInSchema = z.object({
  email: z.string().trim().pipe(z.email("E-mail inválido")),
  password: z.string().min(1, "Informe a senha"),
});

interface SignInResult {
  error?: string;
}

/**
 * Autentica via Supabase Auth (e-mail/senha). Em caso de falha, retorna
 * sempre a mesma mensagem genérica — nunca indica se o problema foi o
 * e-mail ou a senha (AUTH-02).
 */
export async function signIn(emailEntrada: string, passwordEntrada: string): Promise<SignInResult> {
  const validado = validar(signInSchema, { email: emailEntrada, password: passwordEntrada });
  if ("error" in validado) return validado;
  const { email, password } = validado.data;

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: MENSAGEM_ERRO_GENERICA };
  }

  // Login sem perfil ativo cairia num vaivém mudo /agenda → /login; encerra a sessão e avisa.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .eq("ativo", true)
    .maybeSingle();

  if (!profile) {
    await supabase.auth.signOut();
    return { error: MENSAGEM_SEM_PERFIL };
  }

  return {};
}

/** Encerra a sessão no Supabase e volta para o login. */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

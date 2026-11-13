"use server";

import { z } from "zod";
import { createClient } from "../../shared/supabase/server";
import { validar } from "../../shared/validacao/validar";

const MENSAGEM_ERRO_GENERICA = "E-mail ou senha inválidos";

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

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: MENSAGEM_ERRO_GENERICA };
  }

  return {};
}

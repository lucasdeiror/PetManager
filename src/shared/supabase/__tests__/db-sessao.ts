import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { EMAIL_TESTE, SENHA_TESTE } from "./db-setup";

const opcoes = { auth: { persistSession: false, autoRefreshToken: false } };

/** Cliente com login real (PostgREST + RLS) no papel indicado. */
export async function clienteComo(papel: "dono" | "recepcionista"): Promise<SupabaseClient> {
  const c = createClient(process.env.SUPABASE_TEST_URL!, process.env.SUPABASE_TEST_ANON_KEY!, opcoes);
  const { error } = await c.auth.signInWithPassword({ email: EMAIL_TESTE[papel], password: SENHA_TESTE });
  if (error) throw error;
  return c;
}

/** Cliente anônimo, sem login. */
export function clienteAnon(): SupabaseClient {
  return createClient(process.env.SUPABASE_TEST_URL!, process.env.SUPABASE_TEST_ANON_KEY!, opcoes);
}

/** Service role: só para montar cenário, ignora RLS. */
export function clienteAdmin(): SupabaseClient {
  return createClient(process.env.SUPABASE_TEST_URL!, process.env.SUPABASE_TEST_SERVICE_KEY!, opcoes);
}

import { execSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

export const SENHA_TESTE = "senha-de-teste-123";
export const EMAIL_TESTE = {
  dono: "dono@petmanager.test",
  recepcionista: "recepcionista@petmanager.test",
} as const;

const URL_LOCAL = "http://127.0.0.1:54321";

export async function setup() {
  try {
    const r = await fetch(`${URL_LOCAL}/auth/v1/health`);
    if (!r.ok) throw new Error(String(r.status));
  } catch {
    throw new Error('Supabase local não está rodando: rode "npx supabase start"');
  }

  execSync("npx supabase db reset", { stdio: "ignore" });

  // chaves vêm do stack local em runtime; nada é gravado em arquivo versionado
  const status = JSON.parse(execSync("npx supabase status -o json", { stdio: ["ignore", "pipe", "ignore"] }).toString());
  process.env.SUPABASE_TEST_URL = status.API_URL;
  process.env.SUPABASE_TEST_ANON_KEY = status.ANON_KEY;
  process.env.SUPABASE_TEST_SERVICE_KEY = status.SERVICE_ROLE_KEY;

  const admin = createClient(status.API_URL, status.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  for (const papel of ["dono", "recepcionista"] as const) {
    const { data, error } = await admin.auth.admin.createUser({
      email: EMAIL_TESTE[papel],
      password: SENHA_TESTE,
      email_confirm: true,
    });
    if (error) throw error;
    const { error: e2 } = await admin.from("profiles").insert({ id: data.user.id, role: papel });
    if (e2) throw e2;
  }
}

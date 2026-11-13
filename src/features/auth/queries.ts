import { createClient } from "../../shared/supabase/server";

export type UserRole = "dono" | "recepcionista";

/**
 * Retorna o papel do usuário autenticado, lendo de `profiles`.
 * `null` cobre tanto "não autenticado" quanto "autenticado mas sem
 * profile" (estado inconsistente que não deve travar a chamada).
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return (profile?.role as UserRole | undefined) ?? null;
}

/** SEG-02: barra chamada sem sessão antes de qualquer escrita. */
export async function exigirSessao(): Promise<{ error?: string; role?: UserRole }> {
  const role = await getCurrentUserRole();
  if (!role) return { error: "Sessão expirada. Entre novamente." };
  return { role };
}

/** SEG-01: só o dono passa; recepcionista recebe erro no servidor. */
export async function exigirDono(): Promise<{ error?: string }> {
  const { error, role } = await exigirSessao();
  if (error) return { error };
  if (role !== "dono") return { error: "Ação permitida só ao dono." };
  return {};
}

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente Supabase para uso em Server Components e Server Actions.
 * Lê/escreve a sessão via cookies do Next.js (App Router).
 *
 * `setAll` pode falhar quando chamado a partir de um Server Component
 * (que não pode escrever cookies) — o try/catch é intencional e seguro
 * porque o proxy (`src/proxy.ts`) é quem garante a sessão
 * atualizada nesse caso.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Chamado de um Server Component — ignorável, o proxy
            // (`src/proxy.ts`) cobre esse caso.
          }
        },
      },
    },
  );
}

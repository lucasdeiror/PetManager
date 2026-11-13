import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Rotas acessíveis exclusivamente ao papel `dono` (AUTH-03).
 * `/vendas` NÃO entra aqui de propósito: a lista de vendas é
 * compartilhada (VEN-05, dono e recepcionista veem o mesmo); só a
 * ação de registrar venda de produto é restrita a dono, e isso é
 * verificado dentro da própria página (T24), não por rota.
 */
const ROTAS_RESTRITAS_A_DONO = ["/estoque", "/relatorios"];

function rotaRestritaADono(pathname: string): boolean {
  return ROTAS_RESTRITAS_A_DONO.some((rota) => pathname.startsWith(rota));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/login") {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!rotaRestritaADono(pathname)) {
    return response;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "dono") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  // Tudo, menos assets: _next, ícones e imagens.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};

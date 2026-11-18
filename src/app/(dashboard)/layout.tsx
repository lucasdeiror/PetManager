import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUsuarioAtual } from "../../features/auth/queries";
import { getNotificacoes } from "../../features/notificacoes/queries";
import { Notificacoes } from "../../features/notificacoes/notificacoes";
import { BotaoTema } from "../../shared/tela/botao-tema";
import { MenuLateral } from "./menu-lateral";

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  // O proxy já barra quem não tem sessão; aqui cobre o usuário sem profile.
  const [usuario, cookieStore, notificacoes] = await Promise.all([
    getUsuarioAtual(),
    cookies(),
    getNotificacoes(),
  ]);
  if (!usuario) redirect("/login");

  const defaultFixada = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <div className="min-h-screen bg-background text-foreground md:flex">
      <MenuLateral
        email={usuario.email}
        role={usuario.role}
        defaultFixada={defaultFixada}
        notificacoes={notificacoes.itens}
      />
      <div className="flex min-w-0 flex-1 flex-col pt-16 md:pt-0">
        <header className="hidden h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur sm:px-6 md:flex lg:px-8 dark:border-slate-800 dark:bg-slate-950/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
              PetManager
            </span>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              {usuario.role === "dono" ? "Administração" : "Recepção"}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <Notificacoes itensIniciais={notificacoes.itens} userEmail={usuario.email} />
            <BotaoTema />
          </div>
        </header>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

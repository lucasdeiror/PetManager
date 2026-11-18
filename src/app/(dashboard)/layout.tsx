import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUsuarioAtual } from "../../features/auth/queries";
import { MenuLateral } from "./menu-lateral";

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  // O proxy já barra quem não tem sessão; aqui cobre o usuário sem profile.
  const [usuario, cookieStore] = await Promise.all([getUsuarioAtual(), cookies()]);
  if (!usuario) redirect("/login");

  const defaultFixada = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <div className="min-h-screen md:flex">
      <MenuLateral email={usuario.email} role={usuario.role} defaultFixada={defaultFixada} />
      <main className="min-w-0 flex-1 pt-16 md:pt-0">{children}</main>
    </div>
  );
}

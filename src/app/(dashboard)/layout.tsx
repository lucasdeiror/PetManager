import { redirect } from "next/navigation";
import { getUsuarioAtual } from "../../features/auth/queries";
import { MenuLateral } from "./menu-lateral";

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  // O proxy já barra quem não tem sessão; aqui cobre o usuário sem profile.
  const usuario = await getUsuarioAtual();
  if (!usuario) redirect("/login");

  return (
    <div className="min-h-screen">
      <MenuLateral email={usuario.email} role={usuario.role} />
      <main className="pt-16 lg:pl-64 lg:pt-0">{children}</main>
    </div>
  );
}

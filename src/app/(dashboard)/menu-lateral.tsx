"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  Clock,
  LogOut,
  Menu,
  Package,
  PawPrint,
  Scissors,
  ShoppingBag,
  Syringe,
  Users,
  X,
} from "lucide-react";
import { signOut } from "../../features/auth/actions";
import type { UserRole } from "../../features/auth/queries";

const ITENS = [
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/pets", label: "Tutores e pets", icon: Users },
  { href: "/vacinas", label: "Vacinas", icon: Syringe },
  { href: "/vendas", label: "Vendas", icon: ShoppingBag },
  { href: "/estoque", label: "Estoque", icon: Package, soDono: true },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3, soDono: true },
  { href: "/servicos", label: "Serviços", icon: Scissors },
  { href: "/horario-funcionamento", label: "Horário", icon: Clock },
];

interface Props {
  email: string;
  role: UserRole;
}

export function MenuLateral({ email, role }: Props) {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);

  // Fecha o menu mobile com Esc; ao navegar, o onClick do link fecha.
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  const conteudo = (
    <>
      <Marca />
      <nav aria-label="Navegação principal" className="mt-10 flex flex-1 flex-col gap-1.5">
        {ITENS.filter((i) => !i.soDono || role === "dono").map(({ href, label, icon: Icon }) => {
          const ativo = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={ativo ? "page" : undefined}
              onClick={() => setAberto(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-orange-300 ${
                ativo ? "bg-orange-300 text-stone-950" : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
      <Conta email={email} role={role} />
    </>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-slate-950 p-5 text-white lg:flex">
        {conteudo}
      </aside>

      <div className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950 px-3 text-white lg:hidden">
        <Marca />
        <button
          type="button"
          aria-label="Abrir menu"
          aria-expanded={aberto}
          onClick={() => setAberto(true)}
          className="flex size-11 items-center justify-center rounded-xl bg-orange-300 text-stone-950"
        >
          <Menu aria-hidden />
        </button>
      </div>

      {aberto && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setAberto(false)}
            className="absolute inset-0 bg-slate-950/60"
          />
          <aside className="relative flex h-full w-[min(86vw,320px)] flex-col bg-slate-950 p-5 text-white">
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={() => setAberto(false)}
              className="absolute right-4 top-4 rounded-lg p-2 text-slate-300 hover:bg-slate-800"
            >
              <X aria-hidden />
            </button>
            {conteudo}
          </aside>
        </div>
      )}
    </>
  );
}

function Marca() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-10 items-center justify-center rounded-xl bg-orange-300 text-stone-950">
        <PawPrint className="size-5" aria-hidden />
      </div>
      <div>
        <p className="font-black leading-tight">PetManager</p>
        <p className="text-xs font-medium text-slate-400">Gestão para pet shops</p>
      </div>
    </div>
  );
}

function Conta({ email, role }: Props) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
      <div
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-orange-300 bg-orange-300 text-sm font-black uppercase text-slate-950"
      >
        {email.slice(0, 2)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black">{email}</p>
        <p className="text-xs text-slate-400">{role === "dono" ? "Dono" : "Recepcionista"}</p>
      </div>
      <form action={signOut}>
        <button
          type="submit"
          aria-label="Sair da conta"
          className="rounded-lg p-2 text-slate-300 outline-none hover:bg-slate-800 hover:text-white focus-visible:ring-2 focus-visible:ring-orange-300"
        >
          <LogOut className="size-5" aria-hidden />
        </button>
      </form>
    </div>
  );
}

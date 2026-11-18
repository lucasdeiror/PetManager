"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  Clock,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PanelLeft,
  PawPrint,
  Scissors,
  ShoppingBag,
  Syringe,
  Users,
  X,
} from "lucide-react";
import { signOut } from "../../features/auth/actions";
import type { UserRole } from "../../features/auth/queries";
import { cn } from "../../lib/utils";

const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const ITENS = [
  { href: "/painel", label: "Painel", icon: LayoutDashboard },
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
  defaultFixada?: boolean;
}

export function MenuLateral({ email, role, defaultFixada = false }: Props) {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);
  const [fixada, setFixada] = useState(defaultFixada);
  const [pairando, setPairando] = useState(false);
  const [focoTeclado, setFocoTeclado] = useState(false);
  const timerHover = useRef<number | undefined>(undefined);

  const expandida = fixada || pairando || focoTeclado;

  const limparTimer = useCallback(() => {
    if (timerHover.current !== undefined) {
      window.clearTimeout(timerHover.current);
      timerHover.current = undefined;
    }
  }, []);

  useEffect(() => () => limparTimer(), [limparTimer]);

  const aoEntrarPonteiro = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType !== "mouse") return;
      limparTimer();
      timerHover.current = window.setTimeout(() => setPairando(true), 120);
    },
    [limparTimer],
  );

  const aoSairPonteiro = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType !== "mouse") return;
      limparTimer();
      timerHover.current = window.setTimeout(() => setPairando(false), 220);
    },
    [limparTimer],
  );

  const alternarFixada = useCallback(() => {
    setFixada((atual) => {
      const novo = !atual;
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${novo}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
      return novo;
    });
  }, []);

  // Fecha o menu mobile com Esc; ao navegar, o onClick do link fecha.
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  const itensVisiveis = ITENS.filter((i) => !i.soDono || role === "dono");

  return (
    <>
      <div
        data-slot="sidebar"
        data-state={expandida ? "expanded" : "collapsed"}
        data-collapsible={expandida ? "" : "icon"}
        onPointerEnter={aoEntrarPonteiro}
        onPointerLeave={aoSairPonteiro}
        onFocusCapture={() => setFocoTeclado(true)}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            setFocoTeclado(false);
          }
        }}
        className="group hidden text-white md:block"
      >
        <div
          data-slot="sidebar-gap"
          className={cn(
            "relative shrink-0 bg-transparent transition-[width] duration-200 ease-out motion-reduce:transition-none",
            fixada ? "w-64" : "w-16",
          )}
        />
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-30 hidden h-svh flex-col bg-slate-950 py-4 text-white transition-[width,box-shadow] duration-200 ease-out motion-reduce:transition-none md:flex",
            expandida ? "w-64 px-4" : "w-16 items-center px-2",
            !fixada && expandida && "shadow-2xl shadow-slate-950/60",
          )}
        >
          <div
            className={cn(
              "flex w-full items-center border-b border-white/10 pb-3",
              expandida ? "justify-between gap-2" : "justify-center",
            )}
          >
            <div className={cn("min-w-0", !expandida && "sr-only")}>
              <Marca />
            </div>
            <button
              type="button"
              onClick={alternarFixada}
              aria-pressed={fixada}
              aria-label={
                fixada
                  ? "Soltar a barra lateral (abre só com o mouse)"
                  : "Fixar a barra lateral aberta"
              }
              title={fixada ? "Soltar a barra" : "Fixar aberta"}
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-xl outline-none transition-colors focus-visible:ring-2 focus-visible:ring-orange-300",
                fixada
                  ? "bg-orange-300 text-stone-950"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white",
              )}
            >
              <PanelLeft className="size-5" aria-hidden />
            </button>
          </div>

          <nav
            aria-label="Navegação principal"
            className="mt-4 flex w-full flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden"
          >
            {itensVisiveis.map(({ href, label, icon: Icon }) => {
              const ativo = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={ativo ? "page" : undefined}
                  title={!expandida ? label : undefined}
                  className={cn(
                    "flex min-h-11 items-center rounded-xl text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-orange-300",
                    expandida ? "gap-3 px-3 py-2.5" : "size-11 justify-center p-0 mx-auto",
                    ativo
                      ? "bg-orange-300 text-stone-950"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white",
                  )}
                >
                  <Icon className="size-5 shrink-0" aria-hidden />
                  <span className={cn("truncate", !expandida && "sr-only")}>{label}</span>
                </Link>
              );
            })}
          </nav>

          <Conta email={email} role={role} expandida={expandida} />
        </aside>
      </div>

      <div className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950 px-3 text-white md:hidden">
        <Marca />
        <button
          type="button"
          aria-label="Abrir menu"
          aria-expanded={aberto}
          onClick={() => setAberto(true)}
          className="flex size-11 items-center justify-center rounded-xl bg-orange-300 text-stone-950 outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <Menu aria-hidden />
        </button>
      </div>

      {aberto && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
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
              className="absolute right-4 top-4 flex size-11 items-center justify-center rounded-xl text-slate-300 outline-none hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-orange-300"
            >
              <X aria-hidden />
            </button>
            <Marca />
            <nav aria-label="Navegação principal" className="mt-8 flex flex-1 flex-col gap-1.5">
              {itensVisiveis.map(({ href, label, icon: Icon }) => {
                const ativo = pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={ativo ? "page" : undefined}
                    onClick={() => setAberto(false)}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-orange-300",
                      ativo
                        ? "bg-orange-300 text-stone-950"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white",
                    )}
                  >
                    <Icon className="size-5 shrink-0" aria-hidden />
                    {label}
                  </Link>
                );
              })}
            </nav>
            <Conta email={email} role={role} expandida />
          </aside>
        </div>
      )}
    </>
  );
}

function Marca() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-300 text-stone-950">
        <PawPrint className="size-5" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="truncate font-bold leading-tight">PetManager</p>
        <p className="truncate text-xs font-medium text-slate-400">Gestão para pet shops</p>
      </div>
    </div>
  );
}

function Conta({
  email,
  role,
  expandida,
}: {
  email: string;
  role: UserRole;
  expandida: boolean;
}) {
  return (
    <div
      className={cn(
        "mt-3 flex w-full items-center border-t border-white/10 pt-3",
        expandida ? "gap-3 px-1" : "flex-col gap-2",
      )}
    >
      <div
        aria-hidden
        title={!expandida ? `${email} (${role === "dono" ? "Dono" : "Recepcionista"})` : undefined}
        className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-orange-300 bg-orange-300 text-sm font-bold uppercase text-slate-950"
      >
        {email.slice(0, 2)}
      </div>
      <div className={cn("min-w-0 flex-1", !expandida && "sr-only")}>
        <p className="truncate text-sm font-bold">{email}</p>
        <p className="text-xs text-slate-400">{role === "dono" ? "Dono" : "Recepcionista"}</p>
      </div>
      <form action={signOut}>
        <button
          type="submit"
          aria-label="Sair da conta"
          title="Sair da conta"
          className="flex size-11 items-center justify-center rounded-xl text-slate-300 outline-none transition-colors hover:bg-slate-800 hover:text-white focus-visible:ring-2 focus-visible:ring-orange-300"
        >
          <LogOut className="size-5" aria-hidden />
        </button>
      </form>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  Package,
  Syringe,
  X,
} from "lucide-react";
import type { NotificacaoItem, TomNotificacao } from "./types";
import { cn } from "../../lib/utils";

interface NotificacoesProps {
  itensIniciais?: NotificacaoItem[];
  userEmail?: string;
  className?: string;
}

const CHAVE_STORAGE = "petmanager:notificacoes-visto:";

function iconePorTipo(tipo: NotificacaoItem["tipo"]) {
  switch (tipo) {
    case "vacina":
      return Syringe;
    case "agenda":
      return CalendarDays;
    case "estoque":
      return Package;
    default:
      return Bell;
  }
}

function coresPorTom(tom: TomNotificacao) {
  switch (tom) {
    case "perigo":
      return {
        badge: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-900/60",
        ponto: "bg-rose-500",
      };
    case "aviso":
      return {
        badge: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-900/60",
        ponto: "bg-amber-500",
      };
    case "ok":
      return {
        badge: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-900/60",
        ponto: "bg-emerald-500",
      };
    default:
      return {
        badge: "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700",
        ponto: "bg-slate-500",
      };
  }
}

export function Notificacoes({
  itensIniciais = [],
  userEmail = "usuario",
  className,
}: NotificacoesProps) {
  const [aberto, setAberto] = useState(false);
  const [vistoAntes, setVistoAntes] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try {
      return localStorage.getItem(`${CHAVE_STORAGE}${userEmail}`) ?? "";
    } catch {
      return "";
    }
  });
  const [emailAnterior, setEmailAnterior] = useState(userEmail);
  const containerRef = useRef<HTMLDivElement>(null);

  if (userEmail !== emailAnterior) {
    setEmailAnterior(userEmail);
    try {
      setVistoAntes(localStorage.getItem(`${CHAVE_STORAGE}${userEmail}`) ?? "");
    } catch {
      setVistoAntes("");
    }
  }

  // Conta quantas notificações são novas (criadas/previstas após o último visto)
  const novas = itensIniciais.filter((item) => {
    if (!vistoAntes) return true;
    return item.quando > vistoAntes;
  }).length;

  const marcarComoVisto = useCallback(() => {
    const agora = new Date().toISOString();
    setVistoAntes(agora);
    try {
      localStorage.setItem(`${CHAVE_STORAGE}${userEmail}`, agora);
    } catch {
      // localStorage indisponível
    }
  }, [userEmail]);

  const alternar = useCallback(() => {
    setAberto((prev) => {
      const proximo = !prev;
      if (proximo && novas > 0) {
        marcarComoVisto();
      }
      return proximo;
    });
  }, [marcarComoVisto, novas]);

  // Fecha com clique fora ou Esc
  useEffect(() => {
    if (!aberto) return;

    const aoClicarFora = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    };

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };

    document.addEventListener("mousedown", aoClicarFora);
    window.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      window.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  const temNovas = novas > 0;
  const rotuloBotao = temNovas
    ? `Notificações: ${novas} nova${novas > 1 ? "s" : ""}`
    : "Notificações";

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={alternar}
        aria-label={rotuloBotao}
        aria-expanded={aberto}
        aria-haspopup="dialog"
        title={rotuloBotao}
        className={cn(
          "relative flex size-11 shrink-0 items-center justify-center rounded-xl border-2 border-slate-200 bg-white text-slate-800 transition-[background-color,border-color,color,transform] duration-150 ease-out hover:border-orange-500 hover:text-orange-600 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-orange-400 dark:hover:text-orange-400",
          temNovas && "border-orange-300 dark:border-orange-500/50",
          className,
        )}
      >
        <Bell
          className={cn(
            "size-5 transition-transform duration-200",
            temNovas && "sino-balanca text-orange-600 dark:text-orange-400",
          )}
          aria-hidden
        />
        {temNovas && <span className="sino-ponto" aria-hidden="true" />}
      </button>

      {aberto && (
        <div
          role="dialog"
          aria-label="Painel de notificações"
          className="absolute right-0 top-full z-50 mt-2 flex w-[min(92vw,24rem)] flex-col overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-xl motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
        >
          {/* Topo do painel */}
          <div className="flex items-center justify-between border-b-2 border-slate-100 px-4 py-3 dark:border-slate-800/80">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight text-stone-950 dark:text-stone-100">
                  Notificações
                </h3>
                {itensIniciais.length > 0 && (
                  <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-800 dark:bg-orange-950/70 dark:text-orange-300 tabular-nums">
                    {itensIniciais.length}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Alertas operacionais do Pet Shop
              </p>
            </div>
            <div className="flex items-center gap-1">
              {itensIniciais.length > 0 && (
                <button
                  type="button"
                  onClick={marcarComoVisto}
                  className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                >
                  Marcar lidas
                </button>
              )}
              <button
                type="button"
                onClick={() => setAberto(false)}
                aria-label="Fechar notificações"
                className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          </div>

          {/* Lista de alertas */}
          <div className="max-h-[min(26rem,65vh)] overflow-y-auto overscroll-contain p-2">
            {itensIniciais.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <CheckCircle2 className="size-6" aria-hidden />
                </div>
                <p className="mt-3 text-sm font-bold text-stone-950 dark:text-stone-100">
                  Tudo em dia!
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Não há vacinas atrasadas, agendamentos pendentes ou estoque baixo no momento.
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-1.5" role="list">
                {itensIniciais.map((item) => {
                  const Icon = iconePorTipo(item.tipo);
                  const cores = coresPorTom(item.tom);
                  const eNova = !vistoAntes || item.quando > vistoAntes;

                  return (
                    <li key={item.id}>
                      <Link
                        href={item.link}
                        onClick={() => setAberto(false)}
                        className={cn(
                          "group flex items-start gap-3 rounded-xl border border-transparent p-3 text-left transition-colors hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-800 dark:hover:bg-slate-800/60",
                          eNova && "bg-orange-50/50 dark:bg-orange-950/20",
                        )}
                      >
                        <div
                          className={cn(
                            "flex size-9 shrink-0 items-center justify-center rounded-xl border",
                            cores.badge,
                          )}
                        >
                          <Icon className="size-4.5" aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-xs font-bold text-stone-950 dark:text-stone-100">
                              {item.titulo}
                            </span>
                            {eNova && (
                              <span
                                className="size-2 shrink-0 rounded-full bg-orange-600 dark:bg-orange-400"
                                aria-label="Nova notificação"
                              />
                            )}
                          </div>
                          {item.detalhe && (
                            <p className="mt-0.5 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">
                              {item.detalhe}
                            </p>
                          )}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

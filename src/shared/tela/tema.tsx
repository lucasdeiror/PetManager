"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Tema = "claro" | "escuro";

interface TemaContextValue {
  tema: Tema;
  alternarTema: () => void;
  definirTema: (tema: Tema) => void;
}

const defaultTemaValue: TemaContextValue = {
  tema: "claro",
  alternarTema: () => {},
  definirTema: () => {},
};

const TemaContext = createContext<TemaContextValue>(defaultTemaValue);

function aplicarTemaNoDOM(t: Tema) {
  if (typeof document === "undefined") return;
  const isDark = t === "escuro";
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  if (isDark) {
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
  } else {
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";
  }
}

export function TemaProvider({ children }: { children: React.ReactNode }) {
  const [tema, setTema] = useState<Tema>(() => {
    if (typeof document !== "undefined") {
      const salvo = ((): Tema | null => {
        try {
          const val = localStorage.getItem("tema");
          if (val === "escuro" || val === "claro") return val;
        } catch {
          return null;
        }
        return null;
      })();
      if (salvo) return salvo;
      if (typeof window !== "undefined" && window.matchMedia) {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "escuro" : "claro";
      }
    }
    return "claro";
  });

  useEffect(() => {
    // Sincroniza ao montar no cliente
    aplicarTemaNoDOM(tema);
  }, [tema]);

  const definirTema = useCallback((novo: Tema) => {
    setTema(novo);
    aplicarTemaNoDOM(novo);
    try {
      localStorage.setItem("tema", novo);
    } catch {
      // localStorage indisponível
    }
  }, []);

  const alternarTema = useCallback(() => {
    setTema((atual) => {
      const novo = atual === "escuro" ? "claro" : "escuro";
      aplicarTemaNoDOM(novo);
      try {
        localStorage.setItem("tema", novo);
      } catch {
        // localStorage indisponível
      }
      return novo;
    });
  }, []);

  return (
    <TemaContext.Provider value={{ tema, alternarTema, definirTema }}>
      {children}
    </TemaContext.Provider>
  );
}

export function useTema(): TemaContextValue {
  return useContext(TemaContext);
}

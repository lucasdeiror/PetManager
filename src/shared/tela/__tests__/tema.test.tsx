import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { TemaProvider, useTema } from "../tema";

afterEach(cleanup);

function ComponenteTeste() {
  const { tema, alternarTema, definirTema } = useTema();
  return (
    <div>
      <span data-testid="tema">{tema}</span>
      <button type="button" onClick={alternarTema}>
        Alternar
      </button>
      <button type="button" onClick={() => definirTema("escuro")}>
        Definir Escuro
      </button>
      <button type="button" onClick={() => definirTema("claro")}>
        Definir Claro
      </button>
    </div>
  );
}

describe("Tema (claro/escuro estilo Gabi Modas)", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.classList.remove("dark");
  });

  it("inicia em claro por padrão e sincroniza no DOM", () => {
    render(
      <TemaProvider>
        <ComponenteTeste />
      </TemaProvider>,
    );

    expect(screen.getByTestId("tema").textContent).toBe("claro");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("respeita tema salvo no localStorage", () => {
    localStorage.setItem("tema", "escuro");

    render(
      <TemaProvider>
        <ComponenteTeste />
      </TemaProvider>,
    );

    expect(screen.getByTestId("tema").textContent).toBe("escuro");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("alternarTema alterna entre claro e escuro e grava no localStorage e no DOM", () => {
    render(
      <TemaProvider>
        <ComponenteTeste />
      </TemaProvider>,
    );

    const btn = screen.getByRole("button", { name: "Alternar" });

    // Alterna para escuro
    fireEvent.click(btn);
    expect(screen.getByTestId("tema").textContent).toBe("escuro");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("tema")).toBe("escuro");

    // Alterna para claro
    fireEvent.click(btn);
    expect(screen.getByTestId("tema").textContent).toBe("claro");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("tema")).toBe("claro");
  });

  it("definirTema permite definir diretamente o tema", () => {
    render(
      <TemaProvider>
        <ComponenteTeste />
      </TemaProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Definir Escuro" }));
    expect(screen.getByTestId("tema").textContent).toBe("escuro");
    expect(localStorage.getItem("tema")).toBe("escuro");

    fireEvent.click(screen.getByRole("button", { name: "Definir Claro" }));
    expect(screen.getByTestId("tema").textContent).toBe("claro");
    expect(localStorage.getItem("tema")).toBe("claro");
  });
});

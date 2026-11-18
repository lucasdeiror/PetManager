import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { BotaoTema, BotaoTemaMenu } from "../botao-tema";
import { TemaProvider } from "../tema";

afterEach(cleanup);

describe("BotaoTema e BotaoTemaMenu", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.classList.remove("dark");
  });

  it("BotaoTema exibe Usar modo escuro no início e alterna para Usar modo claro ao clicar", () => {
    render(
      <TemaProvider>
        <BotaoTema />
      </TemaProvider>,
    );

    const btn = screen.getByRole("button", { name: "Usar modo escuro" });
    expect(btn).toBeTruthy();

    fireEvent.click(btn);
    expect(screen.getByRole("button", { name: "Usar modo claro" })).toBeTruthy();
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Usar modo claro" }));
    expect(screen.getByRole("button", { name: "Usar modo escuro" })).toBeTruthy();
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("BotaoTemaMenu na barra lateral exibe rótulo visível quando expandida=true", () => {
    render(
      <TemaProvider>
        <BotaoTemaMenu expandida={true} />
      </TemaProvider>,
    );

    const btn = screen.getByRole("button", { name: "Modo escuro" });
    expect(btn.textContent).toContain("Modo escuro");

    fireEvent.click(btn);
    expect(screen.getByRole("button", { name: "Modo claro" })).toBeTruthy();
  });

  it("BotaoTemaMenu oculta o texto visualmente quando expandida=false (sr-only)", () => {
    const { container } = render(
      <TemaProvider>
        <BotaoTemaMenu expandida={false} />
      </TemaProvider>,
    );

    const span = container.querySelector("span");
    expect(span?.className).toContain("sr-only");
  });
});

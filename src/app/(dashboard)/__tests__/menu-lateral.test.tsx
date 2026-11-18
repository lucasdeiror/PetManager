import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MenuLateral } from "../menu-lateral";

const { mockUsePathname } = vi.hoisted(() => ({
  mockUsePathname: vi.fn(() => "/vendas"),
}));

vi.mock("next/navigation", () => ({ usePathname: () => mockUsePathname() }));
vi.mock("../../../features/auth/actions", () => ({ signOut: vi.fn() }));

const menu = () => within(screen.getAllByRole("navigation", { name: "Navegação principal" })[0]);

beforeEach(() => {
  vi.useFakeTimers();
  document.cookie = "sidebar_state=; path=/; max-age=0";
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  mockUsePathname.mockReturnValue("/vendas");
});

describe("MenuLateral (DES-02, DES-03, PNL-01, DSG-01..DSG-06)", () => {
  it("recepcionista vê Painel no topo e não vê Estoque nem Relatórios", () => {
    render(<MenuLateral email="rec@petshop.com" role="recepcionista" />);
    const links = menu().getAllByRole("link");
    expect(links[0].textContent).toBe("Painel");
    expect(links[0].getAttribute("href")).toBe("/painel");
    expect(menu().getByRole("link", { name: "Vendas" })).toBeTruthy();
    expect(menu().queryByRole("link", { name: "Estoque" })).toBeNull();
    expect(menu().queryByRole("link", { name: "Relatórios" })).toBeNull();
    expect(screen.getByText("Recepcionista")).toBeTruthy();
  });

  it("dono vê Painel no topo, Estoque e Relatórios; só a rota atual tem aria-current", () => {
    render(<MenuLateral email="dono@petshop.com" role="dono" />);
    const links = menu().getAllByRole("link");
    expect(links[0].textContent).toBe("Painel");
    expect(links[0].getAttribute("href")).toBe("/painel");
    expect(menu().getByRole("link", { name: "Estoque" })).toBeTruthy();
    expect(menu().getByRole("link", { name: "Relatórios" })).toBeTruthy();
    expect(menu().getByRole("link", { name: "Vendas" }).getAttribute("aria-current")).toBe("page");
    expect(menu().getByRole("link", { name: "Painel" }).getAttribute("aria-current")).toBeNull();
    expect(menu().getByRole("link", { name: "Agenda" }).getAttribute("aria-current")).toBeNull();
    expect(screen.getByText("dono@petshop.com")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sair da conta" })).toBeTruthy();
  });

  it("destaca Painel com aria-current='page' quando a rota atual é /painel (PNL-01)", () => {
    mockUsePathname.mockReturnValue("/painel");
    render(<MenuLateral email="rec@petshop.com" role="recepcionista" />);
    expect(menu().getByRole("link", { name: "Painel" }).getAttribute("aria-current")).toBe("page");
    expect(menu().getByRole("link", { name: "Agenda" }).getAttribute("aria-current")).toBeNull();
  });

  it("gaveta mobile abre pelo botão e fecha com Esc (DSG-05)", () => {
    render(<MenuLateral email="dono@petshop.com" role="dono" />);
    const abrir = screen.getByRole("button", { name: "Abrir menu" });
    expect(screen.queryByRole("dialog", { name: "Menu" })).toBeNull();

    fireEvent.click(abrir);
    expect(screen.getByRole("dialog", { name: "Menu" })).toBeTruthy();
    expect(abrir.getAttribute("aria-expanded")).toBe("true");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Menu" })).toBeNull();
  });

  it("inicia recolhida por padrão (collapsible=icon) e respeita defaultFixada=true do servidor (DSG-01)", () => {
    const { unmount } = render(<MenuLateral email="dono@petshop.com" role="dono" />);
    const sidebar = document.querySelector("[data-slot='sidebar']");
    const gap = document.querySelector("[data-slot='sidebar-gap']");
    expect(sidebar?.getAttribute("data-state")).toBe("collapsed");
    expect(sidebar?.getAttribute("data-collapsible")).toBe("icon");
    expect(gap?.className).toContain("w-16");
    unmount();

    render(<MenuLateral email="dono@petshop.com" role="dono" defaultFixada />);
    const sidebarFixada = document.querySelector("[data-slot='sidebar']");
    const gapFixada = document.querySelector("[data-slot='sidebar-gap']");
    expect(sidebarFixada?.getAttribute("data-state")).toBe("expanded");
    expect(sidebarFixada?.getAttribute("data-collapsible")).toBe("");
    expect(gapFixada?.className).toContain("w-64");
  });

  it("abre ao passar o mouse (120ms) e fecha ao sair (220ms), acompanhando a largura da tela e ignorando toque (DSG-02)", () => {
    render(<MenuLateral email="dono@petshop.com" role="dono" />);
    const sidebar = document.querySelector("[data-slot='sidebar']") as HTMLElement;
    const gap = document.querySelector("[data-slot='sidebar-gap']") as HTMLElement;
    expect(sidebar.getAttribute("data-state")).toBe("collapsed");
    expect(gap.className).toContain("w-16");

    // Toque (touch) não deve deixar a barra presa aberta
    fireEvent.pointerEnter(sidebar, { pointerType: "touch" });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(sidebar.getAttribute("data-state")).toBe("collapsed");
    expect(gap.className).toContain("w-16");

    // Mouse abre após 120ms e o gap acompanha (w-64)
    fireEvent.pointerEnter(sidebar, { pointerType: "mouse" });
    act(() => {
      vi.advanceTimersByTime(119);
    });
    expect(sidebar.getAttribute("data-state")).toBe("collapsed");
    expect(gap.className).toContain("w-16");
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(sidebar.getAttribute("data-state")).toBe("expanded");
    expect(gap.className).toContain("w-64");

    // Mouse sai e fecha após 220ms e o gap acompanha (w-16)
    fireEvent.pointerLeave(sidebar, { pointerType: "mouse" });
    act(() => {
      vi.advanceTimersByTime(219);
    });
    expect(sidebar.getAttribute("data-state")).toBe("expanded");
    expect(gap.className).toContain("w-64");
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(sidebar.getAttribute("data-state")).toBe("collapsed");
    expect(gap.className).toContain("w-16");
  });

  it("botão de fixar aberta alterna aria-pressed, aria-label e grava cookie sidebar_state (DSG-03)", () => {
    render(<MenuLateral email="dono@petshop.com" role="dono" />);
    const pino = screen.getByRole("button", { name: "Fixar a barra lateral aberta" });
    expect(pino.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(pino);

    const pinoSoltar = screen.getByRole("button", {
      name: "Soltar a barra lateral (abre só com o mouse)",
    });
    expect(pinoSoltar.getAttribute("aria-pressed")).toBe("true");
    expect(document.cookie).toContain("sidebar_state=true");

    fireEvent.click(pinoSoltar);
    expect(
      screen.getByRole("button", { name: "Fixar a barra lateral aberta" }).getAttribute("aria-pressed"),
    ).toBe("false");
    expect(document.cookie).toContain("sidebar_state=false");
  });

  it("expande imediatamente ao receber foco de teclado e recolhe ao sair o foco (DSG-04)", () => {
    render(<MenuLateral email="dono@petshop.com" role="dono" />);
    const sidebar = document.querySelector("[data-slot='sidebar']") as HTMLElement;
    const pino = screen.getByRole("button", { name: "Fixar a barra lateral aberta" });

    fireEvent.focus(pino);
    expect(sidebar.getAttribute("data-state")).toBe("expanded");

    fireEvent.blur(pino, { relatedTarget: document.body });
    expect(sidebar.getAttribute("data-state")).toBe("collapsed");
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MenuLateral } from "../menu-lateral";

const { mockUsePathname } = vi.hoisted(() => ({
  mockUsePathname: vi.fn(() => "/vendas"),
}));

vi.mock("next/navigation", () => ({ usePathname: () => mockUsePathname() }));
vi.mock("../../../features/auth/actions", () => ({ signOut: vi.fn() }));

const menu = () => within(screen.getAllByRole("navigation", { name: "Navegação principal" })[0]);

afterEach(() => {
  cleanup();
  mockUsePathname.mockReturnValue("/vendas");
});

describe("MenuLateral (DES-02, DES-03, PNL-01)", () => {
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

  it("gaveta mobile abre pelo botão e fecha com Esc", () => {
    render(<MenuLateral email="dono@petshop.com" role="dono" />);
    const abrir = screen.getByRole("button", { name: "Abrir menu" });
    expect(screen.queryByRole("dialog", { name: "Menu" })).toBeNull();

    fireEvent.click(abrir);
    expect(screen.getByRole("dialog", { name: "Menu" })).toBeTruthy();
    expect(abrir.getAttribute("aria-expanded")).toBe("true");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Menu" })).toBeNull();
  });
});

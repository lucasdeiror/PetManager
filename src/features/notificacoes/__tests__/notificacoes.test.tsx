import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Notificacoes } from "../notificacoes";
import type { NotificacaoItem } from "../types";

afterEach(cleanup);

const mockItens: NotificacaoItem[] = [
  {
    id: "vacina-1",
    tipo: "vacina",
    titulo: "Vacina atrasada: V10",
    detalhe: "Thor (Carlos) · Prevista para 10/11/2026",
    quando: "2026-11-10T10:00:00Z",
    link: "/vacinas",
    tom: "perigo",
  },
  {
    id: "agenda-hoje",
    tipo: "agenda",
    titulo: "2 agendamentos pendentes hoje",
    detalhe: "1 concluído de 3 no total",
    quando: "2026-11-18T10:00:00Z",
    link: "/agenda",
    tom: "aviso",
  },
];

describe("Notificacoes (Componente de UI estilo Gabi Modas)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renderiza o botão com sininho e indicador de novas quando há novidades", () => {
    render(<Notificacoes itensIniciais={mockItens} userEmail="teste@dev.com" />);

    const btn = screen.getByRole("button", { name: "Notificações: 2 novas" });
    expect(btn).toBeTruthy();
    expect(document.querySelector(".sino-ponto")).toBeTruthy();
  });

  it("abre o painel de notificações ao clicar e exibe os itens com detalhes e links", () => {
    render(<Notificacoes itensIniciais={mockItens} userEmail="teste@dev.com" />);

    const btn = screen.getByRole("button", { name: "Notificações: 2 novas" });
    expect(screen.queryByRole("dialog", { name: "Painel de notificações" })).toBeNull();

    fireEvent.click(btn);
    expect(screen.getByRole("dialog", { name: "Painel de notificações" })).toBeTruthy();
    expect(screen.getByText("Vacina atrasada: V10")).toBeTruthy();
    expect(screen.getByText("Thor (Carlos) · Prevista para 10/11/2026")).toBeTruthy();
    expect(screen.getByText("2 agendamentos pendentes hoje")).toBeTruthy();

    const linkVacinas = screen.getByRole("link", { name: /Vacina atrasada: V10/ });
    expect(linkVacinas.getAttribute("href")).toBe("/vacinas");
  });

  it("ao abrir o painel, salva vistoAntes no localStorage e remove o ponto de novas", () => {
    render(<Notificacoes itensIniciais={mockItens} userEmail="teste@dev.com" />);

    const btn = screen.getByRole("button", { name: "Notificações: 2 novas" });
    fireEvent.click(btn);

    const gravado = localStorage.getItem("petmanager:notificacoes-visto:teste@dev.com");
    expect(gravado).toBeTruthy();
  });

  it("exibe estado vazio amigável quando não há notificações", () => {
    render(<Notificacoes itensIniciais={[]} userEmail="teste@dev.com" />);

    const btn = screen.getByRole("button", { name: "Notificações" });
    fireEvent.click(btn);

    expect(screen.getByText("Tudo em dia!")).toBeTruthy();
    expect(
      screen.getByText("Não há vacinas atrasadas, agendamentos pendentes ou estoque baixo no momento."),
    ).toBeTruthy();
  });

  it("fecha o painel ao pressionar Escape ou clicar no botão fechar", () => {
    render(<Notificacoes itensIniciais={mockItens} userEmail="teste@dev.com" />);

    const btn = screen.getByRole("button", { name: /Notificações/ });
    fireEvent.click(btn);
    expect(screen.getByRole("dialog", { name: "Painel de notificações" })).toBeTruthy();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Painel de notificações" })).toBeNull();
  });
});

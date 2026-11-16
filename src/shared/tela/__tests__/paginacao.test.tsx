import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Paginacao, paginar } from "../paginacao";

const itens = Array.from({ length: 23 }, (_, i) => i);

afterEach(cleanup);

describe("Paginacao", () => {
  it("página do meio: faixa, links anterior/próxima e mantém os outros parâmetros", () => {
    render(<Paginacao pagina={paginar(itens, "2")} params={{ busca: "rex", pagina: "2" }} />);

    expect(screen.getByRole("navigation", { name: "Paginação" }).textContent).toContain("11–20 de 23");
    expect(screen.getByRole("link", { name: "Página anterior" }).getAttribute("href")).toBe("?busca=rex&pagina=1");
    expect(screen.getByRole("link", { name: "Próxima página" }).getAttribute("href")).toBe("?busca=rex&pagina=3");
  });

  it("primeira e última página não têm link para fora do intervalo", () => {
    const { rerender } = render(<Paginacao pagina={paginar(itens, "1")} params={{}} />);
    expect(screen.queryByRole("link", { name: "Página anterior" })).toBeNull();

    rerender(<Paginacao pagina={paginar(itens, "3")} params={{}} />);
    expect(screen.queryByRole("link", { name: "Próxima página" })).toBeNull();
  });

  it("chave própria não mexe na paginação da outra lista da tela", () => {
    render(
      <Paginacao pagina={paginar(itens, "1")} params={{ pagina_tutores: "2" }} chave="pagina_pets" />,
    );
    expect(screen.getByRole("link", { name: "Próxima página" }).getAttribute("href")).toBe("?pagina_tutores=2&pagina_pets=2");
  });

  it("uma página só: não renderiza", () => {
    const { container } = render(<Paginacao pagina={paginar([1, 2], "1")} params={{}} />);
    expect(container.innerHTML).toBe("");
  });
});

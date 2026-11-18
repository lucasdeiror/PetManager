import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import {
  Metrica,
  PaginaContainer,
  TituloPagina,
  TituloSecao,
  cabecalhoLista,
  cartao,
  cartaoForm,
  itemLista,
  textoMeta,
  textoPrimario,
  tituloSecao,
  valorTabela,
} from "../titulo-pagina";
import { Paginacao, paginar } from "../paginacao";

afterEach(cleanup);

describe("Primitivos de tipografia, tabular-nums e espaçamento (DSG-07..DSG-11)", () => {
  it("TituloPagina aplica escala unificada sem font-black (DSG-07)", () => {
    render(<TituloPagina titulo="Vendas" texto="Resumo de vendas" />);
    const h1 = screen.getByRole("heading", { level: 1, name: "Vendas" });
    const eyebrow = screen.getByText("Resumo de vendas");

    expect(h1.className).toContain("text-2xl");
    expect(h1.className).toContain("font-bold");
    expect(h1.className).not.toContain("font-black");
    expect(eyebrow.className).toContain("text-xs");
    expect(eyebrow.className).toContain("font-bold");
    expect(eyebrow.className).not.toContain("font-black");
  });

  it("Metrica e Paginacao aplicam tabular-nums nos valores numéricos (DSG-08)", () => {
    const itens = Array.from({ length: 15 }, (_, i) => i);
    render(
      <>
        <Metrica rotulo="Faturamento hoje" valor="R$ 1.250,00" />
        <Paginacao pagina={paginar(itens, "1")} params={{}} />
      </>,
    );

    const valorMetrica = screen.getByText("R$ 1.250,00");
    expect(valorMetrica.className).toContain("tabular-nums");
    expect(valorMetrica.className).toContain("font-bold");
    expect(valorMetrica.className).not.toContain("font-black");

    const nav = screen.getByRole("navigation", { name: "Paginação" });
    expect(nav.className).toContain("tabular-nums");
  });

  it("exporta TituloSecao e tokens tipográficos consistentes com tabular-nums em valorTabela (DSG-09)", () => {
    render(<TituloSecao>Próximos atendimentos</TituloSecao>);
    const h2 = screen.getByRole("heading", { level: 2, name: "Próximos atendimentos" });
    expect(h2.className).toContain("text-base");
    expect(h2.className).toContain("font-bold");
    expect(h2.className).not.toContain("font-black");
    expect(tituloSecao).toContain("text-base font-bold");
    expect(textoPrimario).toContain("font-semibold");
    expect(textoMeta).toContain("text-slate-600");
    expect(valorTabela).toContain("tabular-nums");
  });

  it("PaginaContainer e tokens de espaçamento aplicam a escala única do dashboard (DSG-10, DSG-11)", () => {
    const { container } = render(
      <PaginaContainer>
        <p>Conteúdo</p>
      </PaginaContainer>,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain("max-w-6xl");
    expect(wrapper.className).toContain("gap-6");
    expect(wrapper.className).toContain("p-4");
    expect(wrapper.className).toContain("sm:p-6");
    expect(wrapper.className).toContain("lg:p-8");

    expect(cartao).toContain("rounded-2xl");
    expect(cartaoForm).toContain("p-4 sm:p-5");
    expect(cabecalhoLista).toContain("px-4 py-3.5 sm:px-5");
    expect(itemLista).toContain("px-4 py-3.5 sm:px-5");
  });
});

import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import { SearchFilterBar } from "../search-filter-bar";

const replace = vi.fn();
let searchParamsString = "";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/agenda/lista",
  useSearchParams: () => new URLSearchParams(searchParamsString),
}));

describe("SearchFilterBar", () => {
  it("busca debounced não apaga o filtro escolhido enquanto ela esperava", () => {
    vi.useFakeTimers();
    const bar = () => <SearchFilterBar atributos={["cancelado"] as const} atributoLabels={{ cancelado: "Cancelado" }} />;
    const { getByLabelText, rerender } = render(bar());

    fireEvent.change(getByLabelText("Buscar"), { target: { value: "rex" } });
    searchParamsString = "filtro=cancelado"; // o filtro chegou na URL antes do debounce disparar
    rerender(bar());
    act(() => vi.advanceTimersByTime(300));

    expect(replace).toHaveBeenLastCalledWith("/agenda/lista?filtro=cancelado&busca=rex", { scroll: false });
    vi.useRealTimers();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useListFilters } from "../use-list-filters";

const replace = vi.fn();
let searchParamsString = "";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/pets",
  useSearchParams: () => new URLSearchParams(searchParamsString),
}));

describe("useListFilters", () => {
  beforeEach(() => {
    replace.mockClear();
    searchParamsString = "";
  });

  it("lê busca e filtro vazios quando a URL não tem parâmetros", () => {
    const { result } = renderHook(() => useListFilters(["ativo", "inativo"] as const));
    expect(result.current.busca).toBe("");
    expect(result.current.filtro).toBeNull();
  });

  it("lê busca e filtro válidos da URL", () => {
    searchParamsString = "busca=rex&filtro=ativo";
    const { result } = renderHook(() => useListFilters(["ativo", "inativo"] as const));
    expect(result.current.busca).toBe("rex");
    expect(result.current.filtro).toBe("ativo");
  });

  it("ignora filtro inválido presente na URL", () => {
    searchParamsString = "filtro=nao-existe";
    const { result } = renderHook(() => useListFilters(["ativo", "inativo"] as const));
    expect(result.current.filtro).toBeNull();
  });

  it("setBusca chama router.replace com o parâmetro busca atualizado", () => {
    const { result } = renderHook(() => useListFilters(["ativo"] as const));
    act(() => {
      result.current.setBusca("rex");
    });
    expect(replace).toHaveBeenCalledWith("/pets?busca=rex", { scroll: false });
  });

  it("mudar busca volta para a página 1 (DES-06)", () => {
    searchParamsString = "pagina=3&filtro=ativo&pagina_pets=2";
    const { result } = renderHook(() => useListFilters(["ativo"] as const));
    act(() => {
      result.current.setBusca("rex");
    });
    expect(replace).toHaveBeenCalledWith("/pets?filtro=ativo&busca=rex", { scroll: false });
  });

  it("busca e filtro combinados aparecem juntos na URL (E lógico)", () => {
    searchParamsString = "busca=rex";
    const { result } = renderHook(() => useListFilters(["ativo"] as const));
    act(() => {
      result.current.setFiltro("ativo");
    });
    expect(replace).toHaveBeenCalledWith("/pets?busca=rex&filtro=ativo", { scroll: false });
  });

  it("setBusca com string vazia remove o parâmetro da URL", () => {
    searchParamsString = "busca=rex&filtro=ativo";
    const { result } = renderHook(() => useListFilters(["ativo"] as const));
    act(() => {
      result.current.setBusca("");
    });
    expect(replace).toHaveBeenCalledWith("/pets?filtro=ativo", { scroll: false });
  });
});

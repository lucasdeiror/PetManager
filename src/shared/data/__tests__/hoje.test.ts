import { describe, expect, it } from "vitest";
import { hojeEmSaoPaulo, mesEmSaoPaulo } from "../hoje";

describe("hojeEmSaoPaulo", () => {
  it("01:30 UTC ainda é o dia anterior em Brasília (DAT-01)", () => {
    expect(hojeEmSaoPaulo(new Date("2026-11-13T01:30:00Z"))).toBe("2026-11-12");
  });

  it("15:00 UTC é o mesmo dia em Brasília (DAT-02)", () => {
    expect(hojeEmSaoPaulo(new Date("2026-11-12T15:00:00Z"))).toBe("2026-11-12");
  });
});

describe("mesEmSaoPaulo", () => {
  it("22h de 31/10 em Brasília (01h UTC de 01/11) ainda é outubro", () => {
    expect(mesEmSaoPaulo(new Date("2026-11-01T01:00:00Z"))).toEqual({ ano: 2026, mes: 10 });
  });

  it("virada do ano: 31/12 às 22h em Brasília continua no ano anterior", () => {
    expect(mesEmSaoPaulo(new Date("2027-01-01T01:00:00Z"))).toEqual({ ano: 2026, mes: 12 });
  });
});

import { describe, expect, it } from "vitest";
import { hojeEmSaoPaulo } from "../hoje";

describe("hojeEmSaoPaulo", () => {
  it("01:30 UTC ainda é o dia anterior em Brasília (DAT-01)", () => {
    expect(hojeEmSaoPaulo(new Date("2026-11-13T01:30:00Z"))).toBe("2026-11-12");
  });

  it("15:00 UTC é o mesmo dia em Brasília (DAT-02)", () => {
    expect(hojeEmSaoPaulo(new Date("2026-11-12T15:00:00Z"))).toBe("2026-11-12");
  });
});

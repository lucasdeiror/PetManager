import { describe, expect, it } from "vitest";
import { dataHoraSP, dataSimples, dataSP, instanteSP, partesSP } from "../fuso";

// O gate roda esta suíte com TZ=UTC e TZ=America/Sao_Paulo: o resultado não pode depender do fuso do servidor.
describe("fuso de São Paulo", () => {
  it("instanteSP: horário local vira instante com -03:00 (FUS-01)", () => {
    expect(instanteSP("2026-11-14T17:00:00")).toBe("2026-11-14T17:00:00-03:00");
    expect(new Date(instanteSP("2026-11-14T17:00:00")).toISOString()).toBe("2026-11-14T20:00:00.000Z");
  });

  it("partesSP: 20:00Z é 17:00 do mesmo dia em Brasília (FUS-05)", () => {
    expect(partesSP("2026-11-14T20:00:00+00:00")).toEqual({ dia: "2026-11-14", hora: "17:00" });
  });

  it("partesSP: 02:30Z ainda é o dia anterior em Brasília (borda 23:30)", () => {
    expect(partesSP("2026-11-15T02:30:00+00:00")).toEqual({ dia: "2026-11-14", hora: "23:30" });
  });

  it("dataHoraSP mostra a hora de Brasília", () => {
    expect(dataHoraSP("2026-11-14T20:00:00Z")).toBe("14/11/2026, 17:00");
  });

  it("dataSP: venda 00:30Z de 01/12 é 30/11 em Brasília (FUS-07)", () => {
    expect(dataSP("2026-12-01T00:30:00Z")).toBe("30/11/2026");
  });

  it("dataSimples não muda o dia de uma coluna date (FUS-08)", () => {
    expect(dataSimples("2026-11-13")).toBe("13/11/2026");
  });
});

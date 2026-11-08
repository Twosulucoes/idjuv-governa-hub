import { describe, expect, it } from "vitest";
import { empenhadoLiquido, totaisEmpenhos } from "./empenhos";

describe("empenhadoLiquido", () => {
  it("desconta os estornos e zera o anulado", () => {
    expect(empenhadoLiquido({ valor_empenhado: "1000.00", valor_anulado: "250.10" })).toBe(749.9);
    expect(empenhadoLiquido({ valor_empenhado: 500, valor_anulado: 500 })).toBe(0);
    expect(empenhadoLiquido({ valor_empenhado: 500, valor_anulado: null })).toBe(500);
  });
});

describe("totaisEmpenhos", () => {
  it("soma original, estornado, líquido e saldo, ao centavo", () => {
    const t = totaisEmpenhos([
      { valor_empenhado: "0.10", valor_anulado: 0, saldo_liquidar: "0.10" },
      { valor_empenhado: "0.20", valor_anulado: 0, saldo_liquidar: 0 },
      { valor_empenhado: 1000, valor_anulado: 1000, saldo_liquidar: 0 },
    ]);
    expect(t).toEqual({ quantidade: 3, original: 1000.3, estornado: 1000, liquido: 0.3, saldoLiquidar: 0.1 });
  });
});

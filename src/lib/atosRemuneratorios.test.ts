import { describe, expect, it } from "vitest";
import { avisosVigencia, identificacaoAto, itensPorPercentual, valorReajustado } from "@/lib/atosRemuneratorios";

describe("atos remuneratórios", () => {
  it("reajusta pelo percentual em centavos", () => {
    expect(valorReajustado(2871.43, 6.5)).toBe(3058.07);
    expect(valorReajustado(24829, 6.5)).toBe(26442.89);
    expect(valorReajustado(1000, 0)).toBe(1000);
  });

  it("monta um item por cargo com vencimento, sem repetir o que já está no ato", () => {
    const itens = itensPorPercentual(
      [
        { id: "a", vencimento_base: 1000 },
        { id: "b", vencimento_base: null },
        { id: "c", vencimento_base: 2000 },
      ],
      10,
      new Set(["c"]),
    );
    expect(itens).toEqual([{ cargo_id: "a", valor_novo: 1100 }]);
  });

  it("avisa vigência retroativa a folha fechada e no meio do mês", () => {
    expect(avisosVigencia("2026-10-01", { ano: 2026, mes: 9 })).toEqual([]);
    expect(avisosVigencia("2026-09-01", { ano: 2026, mes: 9 })).toHaveLength(1);
    expect(avisosVigencia("2026-11-15", null)[0]).toMatch(/dia 1/);
  });

  it("identifica o ato pelo tipo e número", () => {
    expect(identificacaoAto({ tipo_ato: "lei", numero: "2.301/2026" })).toBe("Lei nº 2.301/2026");
  });
});

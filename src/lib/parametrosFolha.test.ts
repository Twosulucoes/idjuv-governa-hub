import { describe, expect, it } from "vitest";
import { aliquotaEmFracao, aliquotaEmPercentual, definicaoParametro, unidadeDoParametro } from "./parametrosFolha";

describe("alíquota das tabelas de INSS e IRRF", () => {
  it("a tela mostra em % e o banco guarda a fração", () => {
    expect(aliquotaEmFracao(7.5)).toBe(0.075);
    expect(aliquotaEmFracao("27.5")).toBe(0.275);
    expect(aliquotaEmFracao(14)).toBe(0.14);
    expect(aliquotaEmPercentual(0.075)).toBe(7.5);
    expect(aliquotaEmPercentual("0.2250")).toBe(22.5);
    expect(aliquotaEmPercentual(null)).toBe(0);
  });

  it("ida e volta não muda o valor", () => {
    for (const p of [0, 7.5, 9, 12, 14, 15, 22.5, 27.5, 100]) {
      expect(aliquotaEmPercentual(aliquotaEmFracao(p))).toBe(p);
    }
  });
});

describe("parâmetros do IRRF mensal", () => {
  it("catálogo tem o desconto simplificado e a redução da Lei 15.270", () => {
    for (const t of ["desconto_simplificado_irrf", "irrf_reducao_limite_isencao", "irrf_reducao_maxima",
      "irrf_reducao_limite", "irrf_reducao_constante"]) {
      expect(definicaoParametro(t)?.unidade).toBe("reais");
      expect(definicaoParametro(t)?.grupo).toBe("IRRF");
    }
    expect(unidadeDoParametro("IRRF_REDUCAO_COEFICIENTE")).toBe("numero");
  });
});

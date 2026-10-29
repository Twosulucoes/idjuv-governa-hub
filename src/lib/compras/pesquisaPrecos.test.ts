import { describe, expect, it } from "vitest";
import {
  arredondar,
  avisoDePrazo,
  desvioPadraoAmostral,
  documentoFornecedor,
  lerReferenciaPncp,
  linkEditalPncp,
  medianaDe,
  sanear,
  somarMeses,
  valorPeloMetodo,
} from "./pesquisaPrecos";

const amostras = (...precos: number[]) => precos.map((preco, i) => ({ id: `a${i + 1}`, preco }));

describe("sanear (Decreto 39.050-E/2025, art. 18, § 1º)", () => {
  it("reproduz a série da nota 04-02 (cinco fatores válidos, média 1,0182 e CV 11,96%)", () => {
    const r = sanear(amostras(0.9906, 0.8957, 1.22, 1.0195, 0.9653));
    expect(r.validos).toBe(5);
    expect(arredondar(r.mediaSaneada!, 4)).toBe(1.0182);
    expect(arredondar(r.coeficienteVariacao! * 100, 2)).toBe(11.96);
    expect(r.metodoSugerido).toBe("media");
    expect(r.alerta).toBeNull();
  });

  it("tira da série o preço mais de 30% acima da média e o 30% ou mais abaixo dela", () => {
    // média 100: 131 fica fora (excessivo), 70 fica fora (exatamente −30% = inexequível), 130 fica (+30% exato)
    const r = sanear(amostras(131, 70, 130, 89, 80));
    expect(r.media).toBe(100);
    expect(r.situacao).toEqual({ a1: "excessivo", a2: "inexequivel", a3: "valido", a4: "valido", a5: "valido" });
    expect(r.validos).toBe(3);
    expect(arredondar(r.mediaSaneada!, 2)).toBe(99.67);
    expect(r.mediana).toBe(89);
    expect(r.menor).toBe(80);
  });

  it("CV acima de 30% usa a mediana; até 30%, a média", () => {
    // todos dentro de ±30% da média 100, mas dispersos: desvio 32,33, CV 32,33%
    const r = sanear(amostras(72, 72, 128, 128));
    expect(r.validos).toBe(4);
    expect(arredondar(r.coeficienteVariacao! * 100, 2)).toBe(32.33);
    expect(r.metodoSugerido).toBe("mediana");
    expect(valorPeloMetodo(r, null)).toBe(100);
    const disperso = sanear(amostras(100, 100, 128, 72, 128, 72));
    expect(disperso.validos).toBe(6);
    expect(disperso.coeficienteVariacao!).toBeLessThan(0.3);
    expect(disperso.metodoSugerido).toBe("media");
  });

  it("CV acima de 30% com a série saneada pede mediana", () => {
    // média 100; todos dentro de ±30% não passa de CV 30%; com 2 valores muito diferentes dentro da faixa: 71 e 129
    const r = sanear([{ id: "x", preco: 71 }, { id: "y", preco: 129 }]);
    expect(r.validos).toBe(2);
    expect(r.coeficienteVariacao!).toBeGreaterThan(0.3);
    expect(r.metodoSugerido).toBe("mediana");
    expect(r.alerta).toBe("menos_de_tres");
  });

  it("sem preço válido, sem método; preço zero ou negativo nem entra", () => {
    const vazio = sanear([]);
    expect(vazio).toMatchObject({ quantidade: 0, media: null, validos: 0, metodoSugerido: null, alerta: "sem_precos" });
    expect(sanear(amostras(0, -1, 5)).quantidade).toBe(1);
  });

  it("valor pelo método: sugerido, escolhido e arredondado em centavos", () => {
    const r = sanear(amostras(10.004, 10.006, 10.5));
    expect(valorPeloMetodo(r, null)).toBe(arredondar(r.mediaSaneada!, 2));
    expect(valorPeloMetodo(r, "menor")).toBe(10);
    expect(valorPeloMetodo(r, "mediana")).toBe(10.01);
    expect(valorPeloMetodo(sanear([]), null)).toBeNull();
  });
});

describe("estatística", () => {
  it("desvio padrão amostral e mediana", () => {
    expect(desvioPadraoAmostral([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.138, 3);
    expect(desvioPadraoAmostral([5])).toBeNull();
    expect(medianaDe([3, 1, 2])).toBe(2);
    expect(medianaDe([4, 1, 3, 2])).toBe(2.5);
    expect(medianaDe([])).toBeNull();
    expect(arredondar(1.005, 2)).toBe(1.01);
  });
});

describe("prazo da amostra (art. 17)", () => {
  it("12 meses nos incisos I, II e V; 6 meses nos III e IV", () => {
    expect(avisoDePrazo(1, "2025-10-29", "2026-10-29")).toBeNull();
    expect(avisoDePrazo(1, "2025-10-28", "2026-10-29")).toContain("12 meses");
    expect(avisoDePrazo(5, "2025-11-01", "2026-10-29")).toBeNull();
    expect(avisoDePrazo(4, "2026-04-29", "2026-10-29")).toBeNull();
    expect(avisoDePrazo(3, "2026-04-28", "2026-10-29")).toContain("art. 17, III");
    expect(avisoDePrazo(2, "2026-10-30", "2026-10-29")).toContain("depois");
    expect(avisoDePrazo(2, null, "2026-10-29")).toContain("Sem data");
  });

  it("soma meses sem fuso, no último dia do mês curto", () => {
    expect(somarMeses("2026-03-31", -1)).toBe("2026-02-28");
    expect(somarMeses("2026-10-29", -12)).toBe("2025-10-29");
    expect(somarMeses("2026-01-15", -6)).toBe("2025-07-15");
  });
});

describe("referências das fontes", () => {
  it("lê o link do edital e o número de controle do PNCP", () => {
    const r = { cnpj: "12345678000190", ano: 2026, sequencial: 15 };
    expect(lerReferenciaPncp("https://pncp.gov.br/app/editais/12345678000190/2026/15")).toEqual(r);
    expect(lerReferenciaPncp(" https://pncp.gov.br/app/editais/12345678000190/2026/15?pagina=1 ")).toEqual(r);
    expect(lerReferenciaPncp("12345678000190-1-000015/2026")).toEqual(r);
    expect(lerReferenciaPncp("https://pncp.gov.br/app/atas/12345678000190/2026/15/1")).toEqual(r);
    expect(lerReferenciaPncp("pregão 15/2026")).toBeNull();
    expect(lerReferenciaPncp("12345678000190-1-000000/2026")).toBeNull();
    expect(linkEditalPncp(r)).toBe("https://pncp.gov.br/app/editais/12345678000190/2026/15");
  });

  it("documento do fornecedor só com 11 ou 14 dígitos", () => {
    expect(documentoFornecedor("12.345.678/0001-90")).toBe("12345678000190");
    expect(documentoFornecedor("000.000.001-91")).toBe("00000000191");
    expect(documentoFornecedor("123")).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import {
  catalogoDoItem,
  dataBR,
  dataHoraConsulta,
  documentoNoRelatorio,
  fonteDaAmostra,
  moedaBR,
  montarItemRelatorio,
  pctBR,
  precoBR,
  textoNotaTecnica,
  type AmostraBase,
  type ItemBase,
} from "./relatorioPesquisaPrecos";

const item = (extra: Partial<ItemBase> = {}): ItemBase => ({
  numero: 1, descricao: "Bola de futebol de campo", tipo: "material", catalogo_campo: "codigoItemCatalogo", codigo_catalogo: 447001,
  nome_catalogo: null, unidade: "UN", quantidade: 50, metodo: null, justificativa: null, ...extra,
});

let n = 0;
const amostra = (preco: number, extra: Partial<AmostraBase> = {}): AmostraBase => ({
  id: `a${++n}`, parametro: 1, origem: "compras_gov", orgao: "Órgão de Exemplo", uasg: "925001", uf: "RR", municipio: "Boa Vista",
  numero_compra: "Pregão nº 90012/2026, UASG 925001", data_referencia: "2026-04-02", fornecedor_nome: "Fornecedor", fornecedor_ni: "12345678000190",
  marca: null, unidade: "UN", preco_unitario: preco, link: "https://exemplo.gov.br", consultado_em: "2026-10-29T18:30:00Z",
  considerada: true, motivo_desconsideracao: null, ...extra,
});

describe("montarItemRelatorio", () => {
  it("calcula pela série considerada, marca a situação de cada preço e o total", () => {
    const r = montarItemRelatorio(item(), [
      amostra(100), amostra(95), amostra(105), amostra(200), amostra(10, { considerada: false, motivo_desconsideracao: "Item usado" }),
    ], "2026-10-29");
    expect(r.analise.quantidade).toBe(4);
    expect(r.amostras.map((a) => a.situacao)).toEqual(["desconsiderada", "valido", "valido", "valido", "excessivo"]);
    expect(r.metodoAdotado).toBe("media");
    expect(r.valorUnitario).toBe(100);
    expect(r.valorTotal).toBe(5000);
    expect(r.pendencias).toEqual([]);
  });

  it("aponta o que falta: menos de 3 preços, método trocado sem justificativa e preço fora do prazo", () => {
    const r = montarItemRelatorio(item({ metodo: "menor" }), [amostra(100), amostra(110, { data_referencia: "2025-01-01" })], "2026-10-29");
    expect(r.metodoAdotado).toBe("menor");
    expect(r.valorUnitario).toBe(100);
    expect(r.pendencias).toHaveLength(3);
    expect(r.amostras[1].aviso).toContain("12 meses");
    const justificado = montarItemRelatorio(item({ metodo: "menor", justificativa: "Mercado local restrito." }), [amostra(100), amostra(110)], "2026-10-29");
    expect(justificado.pendencias).toEqual([]);
  });

  it("sem preço, sem valor", () => {
    const r = montarItemRelatorio(item(), [], "2026-10-29");
    expect(r.valorUnitario).toBeNull();
    expect(r.valorTotal).toBeNull();
    expect(r.pendencias[0]).toContain("Nenhum preço válido");
  });
});

describe("formatação", () => {
  it("moeda, preço fracionado, percentual, datas e fonte", () => {
    expect(moedaBR(1234.5)).toBe("R$ 1.234,50");
    expect(precoBR(0.0345)).toBe("R$ 0,0345");
    expect(precoBR(0.5)).toBe("R$ 0,50");
    expect(precoBR(12)).toBe("R$ 12,00");
    expect(pctBR(0.1196)).toBe("11,96%");
    expect(dataBR("2026-04-02")).toBe("02/04/2026");
    expect(dataBR(null)).toBe("sem data");
    expect(dataHoraConsulta("2026-10-29T18:30:00Z")).toBe("29/10/2026 14h30");
    expect(fonteDaAmostra(amostra(1))).toBe("Órgão de Exemplo · 925001 · Boa Vista/RR");
    expect(fonteDaAmostra(amostra(1, { orgao: null, uasg: null, municipio: null, uf: null }))).toBe("Fonte não informada");
    expect(catalogoDoItem(item())).toBe("CATMAT 447001");
    expect(catalogoDoItem(item({ tipo: "servico" }))).toBe("CATSER 447001");
    expect(catalogoDoItem(item({ codigo_catalogo: null }))).toBeNull();
    expect(documentoNoRelatorio("12345678000190")).toBe("12.345.678/0001-90");
    expect(documentoNoRelatorio("12345678901")).toBe("***.456.789-**");
    expect(documentoNoRelatorio(null)).toBeNull();
  });
});

describe("textoNotaTecnica", () => {
  it("escreve as seções 2 a 5 com as fontes, o método e o total", () => {
    const i1 = montarItemRelatorio(item(), [amostra(100), amostra(95), amostra(105), amostra(200),
      amostra(98, { parametro: 2, origem: "pncp", consultado_em: "2026-10-30T13:00:00Z" })], "2026-10-29");
    const i2 = montarItemRelatorio(item({ numero: 2, descricao: "Rede de gol", unidade: "PAR", quantidade: 4 }),
      [amostra(300, { parametro: 4, origem: "manual" })], "2026-10-29");
    const t = textoNotaTecnica({ numeroSei: "00000.000001/2026-01", objeto: "Material esportivo", dataReferencia: "2026-10-29", itens: [i1, i2] });
    for (const s of [
      "2. FONTES CONSULTADAS", "art. 17, I): 4 preço(s), consultados em 29/10/2026", "art. 17, II): 1 preço(s), consultados em 30/10/2026",
      "art. 17, IV): 1 preço(s)", "até 6 meses", "3. SÉRIE DE PREÇOS COLETADOS", "4. METODOLOGIA",
      "Item 1: 5 preço(s) considerado(s), 1 fora dos limites", "Adotou-se a média saneada, porque o coeficiente ficou em até 30%",
      "Item 2: 1 preço(s)", "Menos de 3 preços válidos: [JUSTIFICAR]", "5. MEMÓRIA DE CÁLCULO E CONCLUSÃO",
      "R$ 99,50 por UN × 50 = R$ 4.975,00", "R$ 300,00 por PAR × 4 = R$ 1.200,00", "O valor estimado da contratação é de R$ 6.175,00",
    ]) {
      expect(t).toContain(s);
    }
    expect(t).not.toMatch(/undefined|null|NaN/);
  });

  it("sem os incisos I e II pede a justificativa do § 1º; desconsiderados saem listados", () => {
    const i = montarItemRelatorio(item(), [amostra(50, { parametro: 3, origem: "manual" }),
      amostra(10, { parametro: 3, origem: "manual", considerada: false, motivo_desconsideracao: "Promoção" })], "2026-10-29");
    const t = textoNotaTecnica({ numeroSei: "x", objeto: "y", dataReferencia: "2026-10-29", itens: [i] });
    expect(t).toContain("art. 17, § 1º");
    expect(t).toContain("Preços desconsiderados antes do cálculo");
    expect(t).toContain("R$ 10,00: Promoção");
  });
});

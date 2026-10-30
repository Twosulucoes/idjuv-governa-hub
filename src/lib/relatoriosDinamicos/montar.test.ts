import { describe, expect, it } from "vitest";
import { calcularTotal, configPadrao, montarRelatorio, orientacaoEfetiva, sanearConfig, SEM_VALOR } from "./montar";
import { formatarValor } from "./formatar";
import { nomeDoArquivo, paraPdf, paraPlanilha } from "./exportar";
import type { ConfigRelatorio, FonteRelatorio } from "./tipos";

interface Emp {
  numero: string;
  credor: string | null;
  natureza: string;
  data: string;
  valor: number;
  pago: number | null;
  ativo: boolean;
}

const linhas: Emp[] = [
  { numero: "3", credor: "Beta", natureza: "33903900", data: "2026-03-10", valor: 100.1, pago: 50, ativo: true },
  { numero: "1", credor: "Alfa", natureza: "33903900", data: "2026-01-05", valor: 200.2, pago: null, ativo: false },
  { numero: "2", credor: "Alfa", natureza: "31901100", data: "2026-02-01", valor: 300, pago: 300, ativo: true },
  { numero: "4", credor: null, natureza: "31901100", data: "2026-02-20", valor: 0.1, pago: 0, ativo: true },
];

const fonte: FonteRelatorio<Emp> = {
  id: "teste",
  modulo: "financeiro",
  rotulo: "Empenhos de teste",
  descricao: "",
  carregar: async () => linhas,
  colunas: [
    { id: "numero", rotulo: "Número", tipo: "texto", valor: (l) => l.numero, padrao: true },
    { id: "credor", rotulo: "Credor", tipo: "texto", valor: (l) => l.credor, agrupavel: true, padrao: true },
    { id: "natureza", rotulo: "Natureza", tipo: "texto", valor: (l) => l.natureza, agrupavel: true },
    { id: "data", rotulo: "Data", tipo: "data", valor: (l) => l.data },
    { id: "valor", rotulo: "Valor", tipo: "moeda", valor: (l) => l.valor, padrao: true },
    { id: "pago", rotulo: "Pago", tipo: "moeda", valor: (l) => l.pago },
    { id: "ativo", rotulo: "Ativo", tipo: "booleano", valor: (l) => l.ativo, agrupavel: true },
  ],
};

const config = (c: Partial<ConfigRelatorio>): ConfigRelatorio => ({ ...configPadrao(fonte), ...c });

describe("montarRelatorio", () => {
  it("configuração padrão: colunas marcadas e soma nas de moeda", () => {
    const c = configPadrao(fonte);
    expect(c.colunas).toEqual(["numero", "credor", "valor"]);
    expect(c.totais).toEqual({ valor: "soma" });
  });

  it("sem agrupamento: ordena, soma sem erro de ponto flutuante e ignora coluna desconhecida", () => {
    const r = montarRelatorio(fonte, config({ colunas: ["numero", "x", "valor"], ordenacao: { coluna: "numero", direcao: "asc" } }), linhas);
    expect(r.colunas.map((c) => c.id)).toEqual(["numero", "valor"]);
    expect(r.linhas.map((l) => l.numero)).toEqual(["1", "2", "3", "4"]);
    expect(r.grupos).toBeNull();
    expect(r.totais).toEqual({ valor: 600.4 });
    expect(r.quantidade).toBe(4);
  });

  it("ordenação decrescente deixa o vazio por último", () => {
    const r = montarRelatorio(fonte, config({ ordenacao: { coluna: "credor", direcao: "desc" } }), linhas);
    expect(r.linhas.map((l) => l.credor)).toEqual(["Beta", "Alfa", "Alfa", null]);
  });

  it("agrupa em dois níveis com subtotal em cada grupo", () => {
    const r = montarRelatorio(
      fonte,
      config({ colunas: ["numero", "valor", "pago"], agrupamentos: ["natureza", "credor"], totais: { valor: "soma", pago: "media" } }),
      linhas,
    );
    expect(r.grupos?.map((g) => [g.rotulo, g.quantidade, g.totais.valor])).toEqual([
      ["31901100", 2, 300.1],
      ["33903900", 2, 300.3],
    ]);
    const pessoal = r.grupos![0];
    expect(pessoal.linhas).toEqual([]);
    expect(pessoal.subgrupos.map((s) => s.rotulo)).toEqual(["Alfa", SEM_VALOR]);
    expect(pessoal.subgrupos[0].linhas.map((l) => l.numero)).toEqual(["2"]);
    // média ignora o vazio
    expect(r.grupos![1].totais.pago).toBe(50);
    expect(r.totais).toEqual({ valor: 600.4, pago: 116.67 });
  });

  it("agrupar por sim/não usa o rótulo", () => {
    const r = montarRelatorio(fonte, config({ agrupamentos: ["ativo"] }), linhas);
    expect(r.grupos?.map((g) => g.rotulo)).toEqual(["Não", "Sim"]);
  });

  it("funções de total", () => {
    const c = fonte.colunas.find((x) => x.id === "pago")!;
    expect(calcularTotal(linhas, c, "soma")).toBe(350);
    expect(calcularTotal(linhas, c, "maior")).toBe(300);
    expect(calcularTotal(linhas, c, "menor")).toBe(0);
    expect(calcularTotal([], c, "soma")).toBe(0);
    expect(calcularTotal([], c, "media")).toBeNull();
  });
});

describe("sanearConfig", () => {
  it("modelo salvo com coluna que não existe mais: descarta e lista", () => {
    const { config: c, ignoradas } = sanearConfig(fonte, {
      titulo: "  Meu  ",
      colunas: ["numero", "sumiu", "valor", "numero"],
      agrupamentos: ["credor", "numero", "natureza", "ativo"],
      totais: { valor: "soma", pago: "qualquer", velho: "soma" },
      filtros: { credor: { valores: ["Alfa"] }, antigo: { ativo: true } },
      ordenacao: { coluna: "foi", direcao: "desc" },
      orientacao: "lado",
    });
    expect(c.titulo).toBe("Meu");
    expect(c.colunas).toEqual(["numero", "valor"]);
    // "numero" não é agrupável; no máximo 2 níveis
    expect(c.agrupamentos).toEqual(["credor", "natureza"]);
    expect(c.totais).toEqual({ valor: "soma" });
    expect(c.filtros).toEqual({ credor: { valores: ["Alfa"] } });
    expect(c.ordenacao).toBeNull();
    expect(c.orientacao).toBe("auto");
    expect(ignoradas.sort()).toEqual(["antigo", "foi", "sumiu", "velho"]);
  });

  it("lixo vira a configuração padrão", () => {
    expect(sanearConfig(fonte, null).config).toEqual(configPadrao(fonte));
    expect(sanearConfig(fonte, "x").config.colunas).toEqual(["numero", "credor", "valor"]);
  });

  it("orientação automática", () => {
    expect(orientacaoEfetiva({ orientacao: "auto", colunas: ["a", "b"] })).toBe("retrato");
    expect(orientacaoEfetiva({ orientacao: "auto", colunas: ["a", "b", "c", "d", "e", "f", "g"] })).toBe("paisagem");
    expect(orientacaoEfetiva({ orientacao: "retrato", colunas: ["a", "b", "c", "d", "e", "f", "g"] })).toBe("retrato");
  });
});

describe("formatação e saída", () => {
  it("formata sem passar pelo fuso", () => {
    expect(formatarValor("2026-01-01", "data")).toBe("01/01/2026");
    expect(formatarValor("2026-03", "data")).toBe("03/2026");
    expect(formatarValor(1234.5, "moeda").replace(/\s/g, " ")).toBe("R$ 1.234,50");
    expect(formatarValor(null, "moeda")).toBe("—");
    expect(formatarValor(true, "booleano")).toBe("Sim");
  });

  it("PDF: colunas, grupos, totais formatados e filtros", () => {
    const c = config({ titulo: "Por natureza", agrupamentos: ["natureza"], colunas: ["numero", "valor"] });
    const r = montarRelatorio(fonte, c, linhas);
    const d = paraPdf(fonte, c, r, ["Credor: Alfa"], new Date(2026, 9, 30, 8, 5));
    expect(d.colunas.map((x) => [x.chave, x.alinhamento])).toEqual([["numero", "esquerda"], ["valor", "direita"]]);
    expect(d.grupos).toHaveLength(2);
    expect(d.linhas).toBeUndefined();
    expect(String(d.totais.valor).replace(/\s/g, " ")).toBe("R$ 600,40");
    expect(d.legendaTotais).toBe("Valor: soma");
    expect(d.nomeArquivo).toBe("Por_natureza_2026-10-30_0805.pdf");
  });

  it("planilha: número fica número, grupo com título e subtotal, total geral no fim", () => {
    const c = config({ agrupamentos: ["natureza"], colunas: ["numero", "data", "valor"] });
    const r = montarRelatorio(fonte, c, linhas);
    const p = paraPlanilha(fonte, c, r, []);
    expect(p.linhas[p.linhaCabecalho]).toEqual(["Número", "Data", "Valor"]);
    expect(p.colunasMoeda).toEqual([2]);
    expect(p.linhas[p.linhaCabecalho + 1]).toEqual(["31901100 (2)"]);
    expect(p.linhas[p.linhaCabecalho + 2]).toEqual(["2", "01/02/2026", 300]);
    expect(p.linhas.at(-1)).toEqual(["Total geral: 4 registro(s)", null, 600.4]);
  });

  it("nome de arquivo sem acento nem símbolo", () => {
    expect(nomeDoArquivo("Execução / natureza", "xlsx", new Date(2026, 0, 2, 3, 4))).toBe("Execucao_natureza_2026-01-02_0304.xlsx");
  });
});

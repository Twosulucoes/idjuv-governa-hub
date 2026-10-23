import { describe, expect, it } from "vitest";
import type { LinhaPdf } from "../pdfTexto";
import { decodificarHtml, linhasDaTabelaHtml } from "../tabelaHtml";
import { interpretarEmpenhosFip614, linhasFip614DoExcel, processoSei } from "./empenhosFip614Parser";

// Posições (borda direita, em pt) das colunas de valor como o FIPLAN imprime o FIP 614
const X = { emp: 228, liq: 307, nob: 381, gcv: 449, saldo: 517, pagar: 579 } as const;
type Trecho = [texto: string, x: number, xFim?: number];

let y = 0;
/** Uma linha do PDF: cada trecho com a borda esquerda (e a direita, para números). */
function linha(pagina: number, ...trechos: Trecho[]): LinhaPdf {
  y += 12;
  return {
    pagina,
    y,
    trechos: trechos.map(([texto, x, xFim]) => ({ texto, x, xFim: xFim ?? x + texto.length * 4, y, pagina })),
  };
}
const num = (texto: string, coluna: keyof typeof X): Trecho => [texto, X[coluna] - texto.length * 4, X[coluna]];

function cabecalho(pagina: number): LinhaPdf[] {
  return [
    linha(pagina, ["COORDENADORIA GERAL DE CONTABILIDADE ESTADUAL - CGCE/SEFAZ-RR", 73]),
    linha(pagina, ["FIP 614 - Situação de Empenho", 16]),
    linha(pagina, ["*Exercício igual a 2031", 16]),
    linha(pagina, ["*Data de Referência (dd/mm/yyyy) menor igual a 30/09/2031", 16]),
    linha(pagina, ["Unidade Orçamentária igual a 17302", 16]),
    linha(pagina, ["UG: 17302.0001 - UG Executora de Teste", 16]),
    linha(pagina, ["TIPO", 21], ["Nº DOCUMENTO", 53], ["P/C", 114], ["DATA", 139], ["DOTAÇÃO", 291], ["CREDOR", 469]),
    linha(
      pagina,
      ["VALOR EMP/EST.", 173, 224],
      ["VALOR LIQ/EST.", 245, 293],
      ["VALOR NOB/EST.", 320, 371],
      ["VALOR GCV/EST.", 391, 442],
      ["SDO A LIQ + EM LIQ", 456, 514],
      ["VALOR A PAGAR", 525, 575],
    ),
  ];
}

const DOTACAO = "17302.0001.08.244.030.2544.9900.33903300.1500.000";
const doc = (pagina: number, tipo: string, numero: string, data: string, ...resto: Trecho[]) =>
  linha(pagina, [tipo, 16], [numero, 45, 108], ...resto.filter((t) => t[0] === "P" || t[0] === "C"), [data, 132, 162], ...resto.filter((t) => t[0] !== "P" && t[0] !== "C"));
const total = (pagina: number, v: Record<keyof typeof X, string>) =>
  linha(pagina, ["TOTAL", 16, 36], ...(Object.keys(X) as (keyof typeof X)[]).map((c) => num(v[c], c)));

/** Relatório fictício: um empenho de passagens (com estorno, LIQ, NOB e GCV) e um de OSC que atravessa a página. */
function relatorio(totalUg = "1.500,00"): LinhaPdf[] {
  y = 0;
  return [
    ...cabecalho(1),
    linha(1, ["Nº PROCESSO: 00000107/31-01", 16], ["Nº Convênio:", 232]),
    linha(1, ["PED", 16], ["17302.0001.31.00008-9", 45, 108], ["04/03/2031", 132, 162], [DOTACAO, 232], ["2001.00001-1 - AGENCIA DE VIAGENS DE", 385]),
    linha(1, ["0.1.1", 232], ["TESTE LTDA", 385]),
    doc(1, "EMP", "17302.0001.31.00002-1", "05/03/2031", num("1.000,00", "emp")),
    doc(1, "LIQ", "17302.0001.31.00100-6", "08/07/2031", num("600,00", "liq")),
    linha(1, ["Histórico da Liquidação: Pagamento da fatura de teste nº 1", 45]),
    doc(1, "NOB", "17302.0001.31.00127-0", "04/08/2031", ["P", 117], num("400,00", "nob")),
    doc(1, "GCV", "17302.0001.31.00001-9", "05/08/2031", num("-100,00", "liq"), num("-100,00", "nob"), num("100,00", "gcv")),
    doc(1, "NOB", "17302.0001.31.00128-8", "06/08/2031", ["C", 117], num("50,00", "nob")),
    doc(1, "EST", "17302.0001.31.00004-1", "09/08/2031", num("200,00", "emp")),
    total(1, { emp: "800,00", liq: "500,00", nob: "350,00", gcv: "100,00", saldo: "300,00", pagar: "150,00" }),
    linha(1, ["Nº PROCESSO: 00000956/31-57", 16], ["Nº Convênio: Fomento Nº 46/2031", 232]),
    linha(1, ["PED", 16], ["17302.0001.31.00207-3", 45, 108], ["24/09/2031", 132, 162], [DOTACAO.replace("33903300", "33504100"), 232], ["2013.00002-2 - INSTITUTO DE TESTE", 385]),
    linha(1, ["22/10/2031 19:53", 300], ["Fulano.Teste", 420], ["Página: 1 de 2", 520]),
    ...cabecalho(2),
    doc(2, "EMP", "17302.0001.31.00169-7", "24/09/2031", num("700,00", "emp")),
    total(2, { emp: "700,00", liq: "0,00", nob: "0,00", gcv: "0,00", saldo: "700,00", pagar: "0,00" }),
    linha(2, ["TOTAL UG 17302.0001", 16], num(totalUg, "emp"), num("500,00", "liq"), num("350,00", "nob"), num("100,00", "gcv"), num("1.000,00", "saldo"), num("150,00", "pagar")),
    linha(2, ["TOTAL DE EXECUÇÃO SEM DESTAQUE", 16], num("1.500,00", "emp")),
  ];
}

describe("processoSei", () => {
  it("converte o processo do FIPLAN para o padrão do SEI", () => {
    expect(processoSei("00000112/26-14", "17302")).toBe("17302.000112/2026.14");
    expect(processoSei("fora do padrão", "17302")).toBe("fora do padrão");
  });
});

describe("interpretarEmpenhosFip614", () => {
  it("lê cabeçalho, empenhos, credor quebrado, histórico, GCV, estornos e o bloco que atravessa a página", () => {
    const r = interpretarEmpenhosFip614(relatorio());
    expect(r.problemas).toEqual([]);
    expect(r.parametros).toEqual({ exercicio: 2031, uo: "17302", data_referencia: "2031-09-30" });
    expect(r.cabecalho).toMatchObject({ Exercício: "2031", "Data de referência": "30/09/2031", Empenhos: "2" });
    expect(r.linhas).toHaveLength(2);

    const [pas, osc] = r.linhas;
    expect(pas).toMatchObject({
      processo: "00000107/31-01",
      processo_sei: "17302.000107/2031.01",
      convenio: null,
      ped_numero: "17302.0001.31.00008-9",
      ped_data: "2031-03-04",
      dotacao: `${DOTACAO}0.1.1`,
      credor_codigo: "2001.00001-1",
      credor_nome: "AGENCIA DE VIAGENS DE TESTE LTDA",
      numero: "17302.0001.31.00002-1",
      data_empenho: "2031-03-05",
      valor_empenhado: 1000,
      valor_anulado: 200,
      totais: { emp: 800, liq: 500, nob: 350, gcv: 100, saldo_liquidar: 300, a_pagar: 150 },
    });
    expect(pas.documentos.map((d) => d.tipo)).toEqual(["EMP", "LIQ", "NOB", "GCV", "NOB", "EST"]);
    expect(pas.documentos[1].historico).toBe("Pagamento da fatura de teste nº 1");
    expect(pas.documentos[2].pc).toBe("P");
    expect(pas.documentos[3].valores).toEqual({ liq: -100, nob: -100, gcv: 100 });
    expect(pas.documentos[5].valores).toEqual({ emp: 200 });

    expect(osc).toMatchObject({
      convenio: "Fomento Nº 46/2031",
      credor_nome: "INSTITUTO DE TESTE",
      numero: "17302.0001.31.00169-7",
      valor_empenhado: 700,
      valor_anulado: 0,
    });
  });

  it("reprova quando os documentos não somam o TOTAL do bloco ou os blocos não somam o TOTAL UG", () => {
    const linhas = relatorio("1.400,00");
    const r = interpretarEmpenhosFip614(linhas);
    expect(r.problemas.map((p) => p.mensagem)).toEqual([
      "A soma dos empenhos na coluna EMP não bate com o TOTAL UG do relatório.",
    ]);

    const semEstorno = relatorio().filter((l) => !l.trechos.some((t) => t.texto === "17302.0001.31.00004-1"));
    const r2 = interpretarEmpenhosFip614(semEstorno);
    expect(r2.problemas.some((p) => p.gravidade === "erro" && p.mensagem.includes("não somam o TOTAL do bloco"))).toBe(true);
  });

  it("reprova o PDF que não é o FIP 614 e o bloco sem TOTAL", () => {
    y = 0;
    const r = interpretarEmpenhosFip614([linha(1, ["Quadro de Detalhamento da Despesa - QDD", 16])]);
    expect(r.linhas).toEqual([]);
    expect(r.problemas.map((p) => p.mensagem)).toContain('O arquivo não parece o "FIP 614 - Situação de Empenho" do FIPLAN.');

    const semTotal = relatorio().filter((l) => !(l.pagina === 2 && l.trechos[0].texto === "TOTAL"));
    const r2 = interpretarEmpenhosFip614(semTotal);
    expect(r2.problemas.some((p) => p.mensagem.includes("17302.0001.31.00207-3") && p.mensagem.includes("sem a linha TOTAL"))).toBe(true);
  });
});

/** "Excel" do FIPLAN: tabela HTML em ISO-8859-1, 10 colunas, títulos com colspan, como o FIP 614 exporta. */
function excel(totalUg = "1.700,00"): ArrayBuffer {
  const td = (texto: string, colspan = 1) => `<td${colspan > 1 ? ` colspan=${colspan}` : ""} >${texto}</td>`;
  const tr = (...tds: string[]) => `<tr>${tds.join("")}</tr>`;
  const vazias = (n: number) => Array.from({ length: n }, () => td("")).join("");
  const docu = (tipo: string, numero: string, pc: string, data: string, coluna: number, ...valores: string[]) =>
    tr(td(tipo), td(numero), td(pc), td(data), vazias(coluna), ...valores.map((v) => td(v)), vazias(6 - coluna - valores.length));
  const titulos = [
    tr(td("UG: 17302.0001 - UG Executora de Teste", 10)),
    tr(td("DOCUMENTOS DE EXECU&Ccedil;&Atilde;O", 10)),
    tr(td("TIPO"), td("N&ordm; DOCUMENTO"), td("P/C"), td("DATA"), td(""), td("DOTA&Ccedil;&Atilde;O", 2), td("CREDOR", 3)),
    tr(vazias(4), td("VALOR EMP/EST."), td("VALOR LIQ/EST."), td("VALOR NOB/EST."), td("VALOR GCV/EST."), td("SDO A LIQ + EM LIQ"), td("VALOR A PAGAR")),
  ].join("");
  const ped = (numero: string, data: string, dotacao: string, credor: string) =>
    tr(td("PED"), td(numero), td(""), td(data), td(""), td(dotacao, 2), td(credor, 3));
  const html = [
    `<html><head><meta http-equiv=Content-Type content="text/html; charset=iso-8859-1"></head><body><table>`,
    tr(td("UO: 17302 - Unidade Or&ccedil;ament&aacute;ria de Teste", 10)),
    titulos,
    tr(td("N\u00ba PROCESSO:  00000107/31-01", 5), td("N\u00ba Conv\u00eanio:", 5)),
    ped("17302.0001.31.00008-9", "04/03/2031", "17302.0001.08.244.030.2544.9900.33903300.1500.0000.1.1", "2001.00001-1 - AG\u00caNCIA DE VIAGENS DE TESTE LTDA"),
    docu("EMP", "17302.0001.31.00002-1", "", "05/03/2031", 0, "1.000,00"),
    docu("LIQ EST", "17302.0001.31.00100-6", "", "08/07/2031", 1, "600,00"),
    tr(td(""), td("Hist\u00f3rico da Liquida\u00e7\u00e3o: Pagamento da fatura de teste n\u00ba 1 &amp; 2, sem cortar o texto", 9)),
    docu("EST LIQ", "17302.0001.31.00101-4", "", "09/07/2031", 1, "100,00"),
    docu("NOB", "17302.0001.31.00127-0", "P", "04/08/2031", 2, "400,00"),
    docu("GCV", "17302.0001.31.00001-9", "", "05/08/2031", 1, "-100,00", "-100,00", "100,00"),
    docu("EST EMP", "17302.0001.31.00004-1", "", "09/08/2031", 0, "200,00"),
    tr(td("TOTAL", 4), ...["800,00", "400,00", "300,00", "100,00", "400,00", "100,00"].map((v) => td(v))),
    tr(td("_", 10)),
    titulos,
    tr(td("N\u00ba PROCESSO:  00000956/31-57", 5), td("N\u00ba Conv\u00eanio: Fomento N\u00ba 46/2031", 5)),
    ped("17302.0001.31.00207-3", "24/09/2031", "17302.0001.08.244.030.2544.9900.33504100.1500.0000.6.1", "2013.00002-2 - INSTITUTO DE TESTE"),
    docu("EMP", "17302.0001.31.00169-7", "", "24/09/2031", 0, "900,00"),
    tr(td("TOTAL", 4), ...["900,00", "0,00", "0,00", "0,00", "900,00", "0,00"].map((v) => td(v))),
    tr(td("TOTAL UG 17302.0001", 4), ...[totalUg, "400,00", "300,00", "100,00", "1.300,00", "100,00"].map((v) => td(v))),
    `</table></body></html>`,
  ].join("\r\n");
  // ISO-8859-1: cada caractere vira um byte, como no arquivo do FIPLAN
  return Uint8Array.from(html, (c) => c.charCodeAt(0)).buffer;
}

const lerExcel = (dados: ArrayBuffer) => interpretarEmpenhosFip614(linhasFip614DoExcel(linhasDaTabelaHtml(decodificarHtml(dados))));

describe("interpretarEmpenhosFip614 (Excel do FIPLAN)", () => {
  it("lê a tabela HTML: colunas pelo colspan, acentos em ISO-8859-1, estornos com o tipo escrito e dotação com o IDU", () => {
    const r = lerExcel(excel());
    expect(r.problemas).toEqual([]);
    expect(r.parametros).toEqual({ exercicio: 2031, uo: "17302", data_referencia: null });
    expect(r.cabecalho).toMatchObject({ Exercício: "2031", Empenhos: "2" });
    const [pas, osc] = r.linhas;
    expect(pas).toMatchObject({
      processo_sei: "17302.000107/2031.01",
      convenio: null,
      dotacao: "17302.0001.08.244.030.2544.9900.33903300.1500.0000.1.1",
      credor_codigo: "2001.00001-1",
      credor_nome: "AGÊNCIA DE VIAGENS DE TESTE LTDA",
      valor_empenhado: 1000,
      valor_anulado: 200,
      totais: { emp: 800, liq: 400, nob: 300, gcv: 100, saldo_liquidar: 400, a_pagar: 100 },
    });
    expect(pas.documentos.map((d) => d.tipo)).toEqual(["EMP", "LIQ", "EST", "NOB", "GCV", "EST"]);
    expect(pas.documentos[1].historico).toBe("Pagamento da fatura de teste nº 1 & 2, sem cortar o texto");
    expect(pas.documentos[2].valores).toEqual({ liq: 100 });
    expect(pas.documentos[4].valores).toEqual({ liq: -100, nob: -100, gcv: 100 });
    expect(osc).toMatchObject({ convenio: "Fomento Nº 46/2031", dotacao: "17302.0001.08.244.030.2544.9900.33504100.1500.0000.6.1" });
  });

  it("confere com o TOTAL UG", () => {
    expect(lerExcel(excel("1.600,00")).problemas.map((p) => p.mensagem)).toEqual([
      "A soma dos empenhos na coluna EMP não bate com o TOTAL UG do relatório.",
    ]);
  });
});

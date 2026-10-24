import { describe, expect, it } from "vitest";
import { decodificarHtml, linhasDaTabelaHtml } from "../tabelaHtml";
import { interpretarQddFiplan, linhasQddDoExcel } from "./qddFiplanParser";

const rotulo = (r: string, v: string) => `<tr><td colspan=4>${r}</td><td colspan=14>${v}</td></tr>`;
const titulos = [
  "Natureza", "Fonte", "Cod. Acomp.", "IDU", "TRO", "Inicial", "Suplementado", "Anulado", "Atual", "Bloqueado",
  "Cont/Reserva", "PED", "Empenhado", "Liquidado", "Valor em Liquida&ccedil;&atilde;o", "Pago", "Dispon&iacute;vel", "Restos a Pagar",
];
const linha = (celulas: string[]) => `<tr>${celulas.map((c) => `<td>${c}</td>`).join("")}</tr>`;

// Mesmo formato do "Excel" do QDD exportado pelo FIPLAN: tabela HTML em iso-8859-1.
function planilha(totalAtual: string): ArrayBuffer {
  const html = [
    '<html><head><meta http-equiv=Content-Type content="text/html; charset=iso-8859-1"></head><body><table>',
    rotulo("Exerc&iacute;cio:", "2031"),
    rotulo("Fun&ccedil;&atilde;o:", "08 - Fun&ccedil;&atilde;o de Teste"),
    rotulo("Subfun&ccedil;&atilde;o:", "244 - Subfun&ccedil;&atilde;o de Teste"),
    rotulo("Programa de Governo:", "030 - Programa de Teste"),
    rotulo("PAOE:", "2544 - A&ccedil;&atilde;o de Teste"),
    rotulo("Regional:", "9900 - Estado"),
    rotulo("Objetivo do PAOE:", ""),
    "<tr><td></td></tr>",
    linha(titulos),
    linha(["33903900", "1.500", "0000", "N&atilde;o", "No", "1.000,00", "", "", "1.000,00", "", "", "600,00", "600,00", "", "", "", "400,00", ""]),
    linha(["33903900", "1.500", "0000", "EII", "No", "800,00", "", "", "800,00", "", "100,00", "350,00", "250,00", "", "", "", "450,00", ""]),
    `<tr><td colspan=5>Total Geral</td>${["1.800,00", "", "", totalAtual, "", "100,00", "950,00", "850,00", "", "", "", "850,00", ""].map((c) => `<td>${c}</td>`).join("")}</tr>`,
    "</table></body></html>",
  ].join("\n");
  const bytes = new Uint8Array([...html].map((c) => c.charCodeAt(0)));
  return bytes.buffer;
}

describe("QDD do FIPLAN em Excel", () => {
  it("lê as dotações com fonte, IDU e valores nas colunas certas", () => {
    const r = interpretarQddFiplan(linhasQddDoExcel(linhasDaTabelaHtml(decodificarHtml(planilha("1.800,00")))));
    expect(r.problemas.filter((p) => p.gravidade === "erro")).toEqual([]);
    expect(r.parametros.exercicio).toBe(2031);
    expect(r.linhas).toHaveLength(2);
    expect(r.linhas[0]).toMatchObject({ natureza: "33903900", fonte: "1.500", cod_acomp: "0000", idu: "Não", paoe_codigo: "2544", programa_codigo: "030" });
    expect(r.linhas[1].idu).toBe("EII");
    expect(r.linhas[1].valores).toMatchObject({ atual: 800, reserva: 100, ped: 350, empenhado: 250, disponivel: 450 });
  });

  it("acusa erro quando a soma não bate com o Total Geral", () => {
    const r = interpretarQddFiplan(linhasQddDoExcel(linhasDaTabelaHtml(decodificarHtml(planilha("1.900,00")))));
    expect(r.problemas.some((p) => p.gravidade === "erro" && p.mensagem.includes("Total Geral"))).toBe(true);
  });
});

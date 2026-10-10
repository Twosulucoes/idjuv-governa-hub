/**
 * Célula de CSV segura: sempre entre aspas (aspas internas dobradas) e sem fórmula.
 *
 * Planilhas (Excel, LibreOffice) executam o texto que começa com =, +, -, @, tab ou CR como fórmula (CSV injection).
 * Esse texto ganha um apóstrofo na frente e fica como texto. Números (inclusive negativos) passam sem mudança.
 */
const INICIO_FORMULA = /^[=+\-@\t\r]/;
const NUMERO = /^[-+]?\d[\d.,]*$/;

export function celulaCsv(valor: unknown): string {
  let s = valor === null || valor === undefined ? "" : String(valor);
  if (typeof valor !== "number" && INICIO_FORMULA.test(s) && !NUMERO.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

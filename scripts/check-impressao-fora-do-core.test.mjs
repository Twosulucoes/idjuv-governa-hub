import { describe, expect, it } from "vitest";
import { imprime } from "./check-impressao-fora-do-core.mjs";

describe("check-impressao-fora-do-core", () => {
  it("acusa o diálogo de impressão do navegador, também numa janela aberta à mão", () => {
    expect(imprime("const f = () => window.print();")).toBe(true);
    expect(imprime("janela.print();")).toBe(true);
  });

  it("acusa classe print: do Tailwind e CSS de impressão", () => {
    expect(imprime('<div className="flex print:hidden">')).toBe(true);
    expect(imprime("@media print { body { padding: 0 } }")).toBe(true);
    expect(imprime("@page { size: A4 }")).toBe(true);
  });

  it("acusa biblioteca de PDF que não é o jsPDF do core", () => {
    expect(imprime('import { PDFDocument } from "pdf-lib";')).toBe(true);
    expect(imprime("const h = await import('html2canvas');")).toBe(true);
    expect(imprime('import { Document } from "@react-pdf/renderer";')).toBe(true);
  });

  it("não acusa import de tipo nem palavra parecida", () => {
    expect(imprime('import type { PDFDocument } from "pdf-lib";')).toBe(false);
    expect(imprime("const blueprint:string = 'x'; imprimir(); fingerprint: true")).toBe(false);
    expect(imprime("printf('ok'); const sprint = 1;")).toBe(false);
  });
});

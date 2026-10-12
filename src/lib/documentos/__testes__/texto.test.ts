import jsPDF from 'jspdf';
import { describe, expect, it } from 'vitest';
import { ouTraco, paraNomeArquivo, paraWinAnsi, quebrarEmLinhas } from '../core/texto';

describe('paraWinAnsi', () => {
  it('mantém acentos, aspas curvas, travessão e º; troca o que a fonte nativa não tem por "?"', () => {
    expect(paraWinAnsi('João “ok” — 3º ✓😀 łódź')).toBe('João “ok” — 3º ?? ?ód?');
  });
  it('null e undefined viram string vazia, nunca "null"/"undefined"', () => {
    expect(paraWinAnsi(null)).toBe('');
    expect(paraWinAnsi(undefined)).toBe('');
  });
  it('normaliza quebras de linha e tabs', () => {
    expect(paraWinAnsi('a\r\nb\tc')).toBe('a\nb c');
  });
});

describe('ouTraco', () => {
  it('vazio, só espaços, null e undefined viram "—"', () => {
    for (const v of ['', '   ', null, undefined]) expect(ouTraco(v)).toBe('—');
  });
  it('números e textos passam', () => {
    expect(ouTraco(0)).toBe('0');
    expect(ouTraco(' ok ')).toBe('ok');
  });
});

describe('paraNomeArquivo', () => {
  it('remove acentos e símbolos', () => {
    expect(paraNomeArquivo('Requerimento nº 12/2026 — João')).toBe('Requerimento-n-12-2026-Joao');
  });
  it('nunca devolve vazio', () => {
    expect(paraNomeArquivo('???')).toBe('documento');
  });
});

describe('quebrarEmLinhas', () => {
  it('quebra palavra sem espaço maior que a largura em vez de estourar a margem', () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const linhas = quebrarEmLinhas(doc, 'x'.repeat(200), 40);
    expect(linhas.length).toBeGreaterThan(1);
    for (const l of linhas) expect(doc.getTextWidth(l)).toBeLessThanOrEqual(40.01);
    expect(linhas.join('')).toBe('x'.repeat(200));
  });
  it('texto vazio devolve uma linha vazia (altura mínima de uma linha)', () => {
    const doc = new jsPDF();
    expect(quebrarEmLinhas(doc, '', 40)).toEqual(['']);
  });
});

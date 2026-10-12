import jsPDF from 'jspdf';
import { describe, expect, it } from 'vitest';
import { lerPdf, mmParaPt } from './lerPdf';

describe('lerPdf', () => {
  it('devolve texto, posição e tamanho de cada página', async () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    doc.text('Olá mundo', 20, 30);
    doc.addPage();
    doc.text('Segunda', 20, 40);

    const paginas = await lerPdf(doc);

    expect(paginas).toHaveLength(2);
    expect(paginas[0].texto).toContain('Olá mundo');
    expect(paginas[1].texto).toContain('Segunda');
    expect(Math.round(paginas[0].largura)).toBe(Math.round(mmParaPt(210)));
    expect(paginas[0].itens[0].x).toBeCloseTo(mmParaPt(20), 0);
  });
});

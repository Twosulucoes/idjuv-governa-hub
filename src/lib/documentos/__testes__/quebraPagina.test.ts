import { describe, expect, it } from 'vitest';
import { paragrafo, quebraPagina } from '../blocos';
import { renderizarDocumento } from '../core/renderizar';
import type { Bloco, DocumentoModelo } from '../tipos';
import { emissaoTeste, marcaTeste } from './fixtures';
import { lerPdf } from './lerPdf';

const gerar = (blocos: Bloco[]) => {
  const modelo: DocumentoModelo<null> = { tipo: 't', familia: 'comprovante', titulo: () => 'T', nomeArquivo: () => 't.pdf', blocos: () => blocos };
  return renderizarDocumento(modelo, null, marcaTeste, emissaoTeste).doc;
};

describe('quebraPagina', () => {
  it('cada parte começa numa página nova', async () => {
    const p = await lerPdf(gerar([paragrafo({ texto: 'Parte A' }), quebraPagina(), paragrafo({ texto: 'Parte B' }), quebraPagina(), paragrafo({ texto: 'Parte C' })]));
    expect(p.length).toBe(3);
    expect(p[1].texto).toContain('Parte B');
    expect(p[2].texto).toContain('Parte C');
  });

  it('duas quebras seguidas não deixam página em branco', async () => {
    const p = await lerPdf(gerar([paragrafo({ texto: 'Única' }), quebraPagina(), quebraPagina(), paragrafo({ texto: 'Segunda' })]));
    expect(p.length).toBe(2);
    expect(p[0].texto).toContain('Única');
    expect(p[1].texto).toContain('Segunda');
  });
});

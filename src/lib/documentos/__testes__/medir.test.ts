import { describe, expect, it } from 'vitest';
import { assinaturas } from '../blocos/assinaturas';
import { manterJunto } from '../blocos/manterJunto';
import { paragrafo } from '../blocos/paragrafo';
import { medirAltura } from '../core/medir';
import { criarContexto } from '../core/pagina';
import { renderizarDocumento } from '../core/renderizar';
import type { Bloco, DocumentoModelo } from '../tipos';
import { emissaoTeste, marcaTeste } from './fixtures';
import { lerPdf } from './lerPdf';

const gerar = (blocos: Bloco[]) => {
  const modelo: DocumentoModelo<null> = { tipo: 't', familia: 'ato', titulo: () => 'T', nomeArquivo: () => 't.pdf', blocos: () => blocos };
  return renderizarDocumento(modelo, null, marcaTeste, emissaoTeste).doc;
};
const quase = (mm: number): Bloco => (ctx) => { ctx.y = ctx.limiteInferior - mm; };

describe('medirAltura', () => {
  it('mede um parágrafo de 3 linhas e não mexe no documento real', () => {
    const ctx = criarContexto({ marca: marcaTeste, orientacao: 'retrato', familia: 'ato' });
    const antes = { y: ctx.y, paginas: ctx.doc.getNumberOfPages() };
    const { altura, paginas } = medirAltura(ctx, [paragrafo({ texto: 'palavra '.repeat(80).trim() })]);
    expect(altura).toBeGreaterThan(10);
    expect(paginas).toBe(1);
    expect({ y: ctx.y, paginas: ctx.doc.getNumberOfPages() }).toEqual(antes);
  });

  it('conteúdo maior que uma página reporta várias páginas', () => {
    const ctx = criarContexto({ marca: marcaTeste, orientacao: 'retrato', familia: 'ato' });
    const { paginas, altura } = medirAltura(ctx, [paragrafo({ texto: 'palavra '.repeat(2500).trim() })]);
    expect(paginas).toBeGreaterThanOrEqual(2);
    expect(altura).toBeGreaterThan(200);
  });
});

describe('manterJunto', () => {
  it('se o grupo não cabe no que resta, vai INTEIRO para a página seguinte', async () => {
    const p = await lerPdf(gerar([
      quase(20),
      manterJunto(paragrafo({ texto: 'ULTIMO-ARTIGO texto do último artigo da portaria' }), assinaturas({ assinantes: [{ nome: 'Ana Souza', cargo: 'Diretora' }] })),
    ]));
    expect(p).toHaveLength(2);
    expect(p[0].texto).not.toContain('ULTIMO-ARTIGO');
    expect(p[1].texto).toContain('ULTIMO-ARTIGO');
    expect(p[1].texto).toContain('Ana Souza');
  });

  it('se o grupo cabe, permanece na mesma página', async () => {
    const p = await lerPdf(gerar([
      manterJunto(paragrafo({ texto: 'ULTIMO-ARTIGO' }), assinaturas({ assinantes: [{ nome: 'Ana Souza' }] })),
    ]));
    expect(p).toHaveLength(1);
    expect(p[0].texto).toContain('Ana Souza');
  });

  it('grupo maior que uma página flui normalmente, sem perder texto', async () => {
    const p = await lerPdf(gerar([manterJunto(paragrafo({ texto: 'palavra '.repeat(2500).trim() }), assinaturas({ assinantes: [{ nome: 'Ana Souza' }] }))]));
    expect(p.length).toBeGreaterThanOrEqual(2);
    expect(p.flatMap((x) => x.itens).reduce((n, i) => n + (i.str.match(/palavra/g)?.length ?? 0), 0)).toBe(2500);
    expect(p[p.length - 1].texto).toContain('Ana Souza');
  });
});

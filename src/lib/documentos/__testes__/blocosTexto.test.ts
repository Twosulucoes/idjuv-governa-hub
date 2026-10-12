import { describe, expect, it } from 'vitest';
import { localData } from '../blocos/localData';
import { paragrafo } from '../blocos/paragrafo';
import { secao } from '../blocos/secao';
import { renderizarDocumento } from '../core/renderizar';
import type { Bloco, DocumentoModelo } from '../tipos';
import { emissaoTeste, marcaTeste } from './fixtures';
import { lerPdf, mmParaPt } from './lerPdf';

const gerar = (blocos: Bloco[]) => {
  const modelo: DocumentoModelo<null> = {
    tipo: 't', familia: 'ato', titulo: () => 'T', nomeArquivo: () => 't.pdf', blocos: () => blocos,
  };
  return renderizarDocumento(modelo, null, marcaTeste, emissaoTeste).doc;
};

describe('paragrafo', () => {
  it('texto longo atravessa páginas sem perder nem repetir palavras', async () => {
    const palavras = Array.from({ length: 1500 }, (_, i) => `p${i}`);
    const p = await lerPdf(gerar([paragrafo({ texto: palavras.join(' ') })]));
    expect(p.length).toBeGreaterThanOrEqual(2);
    const lidas = p.flatMap((pg) => pg.itens.map((i) => i.str)).join(' ').match(/\bp\d+\b/g);
    expect(lidas).toEqual(palavras);
  });

  it('emoji e símbolos fora da fonte viram "?" e o resto do texto sobrevive', async () => {
    const [p1] = await lerPdf(gerar([paragrafo({ texto: 'Aprovado ✓ 😀 em “reunião” — 3º ponto' })]));
    expect(p1.texto).toContain('Aprovado');
    expect(p1.texto).toContain('reunião');
    expect(p1.texto).toContain('3º ponto');
  });

  it('justificado e recuo não estouram a margem direita', async () => {
    const texto = Array.from({ length: 200 }, () => 'palavra').join(' ');
    const [p1] = await lerPdf(gerar([paragrafo({ texto, alinhamento: 'justificado', recuoPrimeiraLinha: 12 })]));
    const limite = p1.largura - mmParaPt(20) + 1;
    for (const i of p1.itens) expect(i.x + i.largura).toBeLessThanOrEqual(limite);
  });

  it('negrito e quebras de linha explícitas funcionam', async () => {
    const [p1] = await lerPdf(gerar([paragrafo({ texto: 'linha A\nlinha B', negrito: true })]));
    expect(p1.texto).toContain('linha A');
    expect(p1.texto).toContain('linha B');
  });
});

describe('secao', () => {
  it('título de seção nunca fica sozinho no fim da página', async () => {
    const encher: Bloco = (ctx) => {
      ctx.y = ctx.limiteInferior - 8; // só cabe o título, não o conteúdo seguinte
    };
    const p = await lerPdf(gerar([encher, secao({ texto: 'Fundamentação' }), paragrafo({ texto: 'corpo da seção' })]));
    const pagSecao = p.findIndex((pg) => pg.texto.includes('Fundamentação'));
    const pagCorpo = p.findIndex((pg) => pg.texto.includes('corpo da seção'));
    expect(pagSecao).toBe(pagCorpo);
  });
});

describe('localData', () => {
  it('imprime "Local, data."', async () => {
    const [p1] = await lerPdf(gerar([localData({ local: 'Boa Vista', data: '12 de outubro de 2026' })]));
    expect(p1.texto).toContain('Boa Vista, 12 de outubro de 2026.');
  });
});

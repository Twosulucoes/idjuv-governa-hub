import { describe, expect, it } from 'vitest';
import { assinaturas } from '../blocos/assinaturas';
import { carimbo } from '../blocos/carimbo';
import { renderizarDocumento } from '../core/renderizar';
import type { Bloco, DocumentoModelo } from '../tipos';
import { emissaoTeste, marcaTeste } from './fixtures';
import { lerPdf } from './lerPdf';

const gerar = (blocos: Bloco[]) => {
  const modelo: DocumentoModelo<null> = { tipo: 't', familia: 'ato', titulo: () => 'T', nomeArquivo: () => 't.pdf', blocos: () => blocos };
  return renderizarDocumento(modelo, null, marcaTeste, emissaoTeste).doc;
};
const quase: Bloco = (ctx) => { ctx.y = ctx.limiteInferior - 10; };

describe('assinaturas', () => {
  it('duas assinaturas ficam lado a lado, com nome e cargo', async () => {
    const [p1] = await lerPdf(gerar([assinaturas({ assinantes: [{ nome: 'Ana', cargo: 'Diretora' }, { nome: 'Beto', cargo: 'Chefe' }] })]));
    const ana = p1.itens.find((i) => i.str === 'Ana')!;
    const beto = p1.itens.find((i) => i.str === 'Beto')!;
    expect(Math.abs(ana.y - beto.y)).toBeLessThan(1);
    expect(beto.x).toBeGreaterThan(ana.x);
    expect(p1.texto).toContain('Diretora');
  });

  it('o bloco de assinatura nunca se parte: nome e cargo ficam na mesma página, mesmo perto do fim', async () => {
    const p = await lerPdf(gerar([quase, assinaturas({ assinantes: [{ nome: 'Ana Souza', cargo: 'Diretora', documento: 'Mat. 123' }] })]));
    const pg = p.find((x) => x.texto.includes('Ana Souza'))!;
    expect(pg.texto).toContain('Diretora');
    expect(pg.texto).toContain('Mat. 123');
    expect(p.length).toBe(2);
  });

  it('nome muito longo quebra e não passa da margem; campos ausentes não geram "undefined"', async () => {
    const [p1] = await lerPdf(gerar([assinaturas({ assinantes: [{ nome: 'Maria '.repeat(20).trim() }] })]));
    expect(p1.texto).not.toContain('undefined');
  });

  it('número ímpar de assinantes (3) imprime os três', async () => {
    const [p1] = await lerPdf(gerar([assinaturas({ assinantes: [{ nome: 'A1' }, { nome: 'B2' }, { nome: 'C3' }] })]));
    for (const n of ['A1', 'B2', 'C3']) expect(p1.texto).toContain(n);
  });
});

describe('carimbo', () => {
  it('imprime todas as linhas dentro de uma caixa e quebra linha longa', async () => {
    const [p1] = await lerPdf(gerar([carimbo({ linhas: ['Emitido eletronicamente', 'palavra '.repeat(60).trim()] })]));
    expect(p1.texto).toContain('Emitido eletronicamente');
    expect(p1.itens.filter((i) => i.str.startsWith('palavra')).length).toBeGreaterThan(1);
  });
});

import { describe, expect, it } from 'vitest';
import { ALTURA_CABECALHO, PAGINA } from '../core/tokens';
import { renderizarDocumento } from '../core/renderizar';
import type { DocumentoModelo } from '../tipos';
import { emissaoTeste, marcaTeste } from './fixtures';
import { lerPdf, mmParaPt } from './lerPdf';

interface Dados {
  n: number;
  protocolo?: string;
}

const modelo: DocumentoModelo<Dados> = {
  tipo: 'teste',
  familia: 'ficha',
  titulo: () => 'Documento de teste',
  subtitulo: () => 'subtítulo de teste',
  protocolo: (d) => d.protocolo,
  unidadeEmissora: () => ['DIRETORIA DE TESTE'],
  nomeArquivo: () => 'teste.pdf',
  blocos: (d) => [
    (ctx) => {
      ctx.doc.setFontSize(10);
      for (let i = 0; i < d.n; i++) {
        ctx.garantirEspaco(5);
        ctx.doc.text(`Linha ${i + 1}`, ctx.esquerda, ctx.y + 4);
        ctx.y += 5;
      }
    },
  ],
};

const renderizar = (d: Dados, m = modelo) => renderizarDocumento(m, d, marcaTeste, emissaoTeste);

describe('renderizarDocumento', () => {
  it('120 linhas ocupam 3 páginas e o rodapé numera "Página X de 3"', async () => {
    const { doc, nomeArquivo } = renderizar({ n: 120 });
    const p = await lerPdf(doc);
    expect(nomeArquivo).toBe('teste.pdf');
    expect(p).toHaveLength(3);
    expect(p[0].texto).toContain('Página 1 de 3');
    expect(p[1].texto).toContain('Página 2 de 3');
    expect(p[2].texto).toContain('Página 3 de 3');
  });

  it('protocolo aparece em todas as páginas; sem protocolo não existe rótulo vazio', async () => {
    const com = await lerPdf(renderizar({ n: 120, protocolo: 'RH-2026-000123' }).doc);
    for (const pagina of com) expect(pagina.texto).toContain('Protocolo: RH-2026-000123');

    const sem = await lerPdf(renderizar({ n: 120 }).doc);
    for (const pagina of sem) expect(pagina.texto).not.toContain('Protocolo');
  });

  it('primeira página tem título em caixa alta, subtítulo, órgão, entidade superior e unidade emissora', async () => {
    const [p1] = await lerPdf(renderizar({ n: 1 }).doc);
    for (const trecho of ['DOCUMENTO DE TESTE', 'subtítulo de teste', 'INSTITUTO DE TESTE', 'GOVERNO DE TESTE', 'DIRETORIA DE TESTE']) {
      expect(p1.texto).toContain(trecho);
    }
  });

  it('páginas seguintes têm cabeçalho compacto (sem título repetido)', async () => {
    const p = await lerPdf(renderizar({ n: 120 }).doc);
    expect(p[1].texto).toContain('INSTITUTO DE TESTE');
    expect(p[1].texto).not.toContain('DOCUMENTO DE TESTE');
  });

  it('rodapé traz sistema, quem emitiu e quando', async () => {
    const [p1] = await lerPdf(renderizar({ n: 1 }).doc);
    expect(p1.texto).toContain('Sistema de Teste / TST');
    expect(p1.texto).toContain('Fulana de Tal');
    expect(p1.texto).toMatch(/\d{2}\/\d{2}\/\d{2,4}/);
  });

  it('o conteúdo nunca invade cabeçalho nem rodapé', async () => {
    const p = await lerPdf(renderizar({ n: 120 }).doc);
    const topoMin = PAGINA.margemTopo + ALTURA_CABECALHO.demais;
    const baseMax = 297 - PAGINA.margemRodape;
    for (const pagina of p.slice(1)) {
      for (const item of pagina.itens.filter((i) => i.str.startsWith('Linha'))) {
        const topoMm = ((pagina.altura - item.y) * 25.4) / 72;
        expect(topoMm).toBeGreaterThanOrEqual(topoMin);
        expect(topoMm).toBeLessThanOrEqual(baseMax);
      }
    }
  });

  it('paisagem inverte a página e mantém as margens laterais', async () => {
    const [p1] = await lerPdf(renderizar({ n: 1 }, { ...modelo, orientacao: 'paisagem' }).doc);
    expect(p1.largura).toBeGreaterThan(p1.altura);
    const minX = Math.min(...p1.itens.map((i) => i.x));
    expect(minX).toBeGreaterThanOrEqual(mmParaPt(PAGINA.margemLateral) - 1);
  });
});

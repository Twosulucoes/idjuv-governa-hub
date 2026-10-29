import { describe, expect, it } from 'vitest';
import { renderizarDocumento } from '../core/renderizar';
import { relatorioPesquisaPrecos } from '../modelos/compras/pesquisaPrecos';
import { REGISTRO } from '../registro';
import { emissaoTeste, marcaTeste } from './fixtures';
import { dadosPesquisaPrecos } from './fixturesPesquisaPrecos';
import { lerPdf } from './lerPdf';

const ler = async (doc: Parameters<typeof lerPdf>[0]) => (await lerPdf(doc)).map((p) => p.texto).join(' ').replace(/\s+/g, ' ');

describe('compras-pesquisa-precos', () => {
  it('está no REGISTRO como relatório em paisagem', () => {
    expect(REGISTRO['compras-pesquisa-precos']).toBe(relatorioPesquisaPrecos);
    expect(relatorioPesquisaPrecos.familia).toBe('relatorio');
    expect(relatorioPesquisaPrecos.orientacao).toBe('paisagem');
  });

  it('imprime a identificação, a série com a fonte, o saneamento e o resumo', async () => {
    const t = await ler(renderizarDocumento(relatorioPesquisaPrecos, dadosPesquisaPrecos(), marcaTeste, emissaoTeste).doc);
    for (const s of ['RELATÓRIO DA PESQUISA DE PREÇOS', '00000.000001/2026-01', 'Aquisição de material esportivo', 'Bola de futebol de campo',
      'CATMAT 447001', 'Órgão de Exemplo 1', 'Pregão nº 90011/2026', 'Fornecedor 1', 'Excessivamente elevado', 'Desconsiderado: Item usado',
      '29/10/2026 14h30', 'Média saneada', 'Coeficiente de variação', 'R$ 97,00', 'R$ 4.850,00', 'Rede de gol oficial', 'Pendência',
      'TOTAL', 'R$ 6.050,00']) {
      expect(t).toContain(s);
    }
    expect(t).not.toMatch(/undefined|null|NaN/);
  });

  it('sem itens, e muitos preços em várias páginas', async () => {
    const vazio = { ...dadosPesquisaPrecos(), itens: [], responsaveis: undefined };
    const t = await ler(renderizarDocumento(relatorioPesquisaPrecos, vazio, marcaTeste, emissaoTeste).doc);
    expect(t).toContain('Nenhum item na pesquisa.');
    expect(t).not.toMatch(/undefined|null|NaN/);
    const paginas = await lerPdf(renderizarDocumento(relatorioPesquisaPrecos, dadosPesquisaPrecos(60), marcaTeste, emissaoTeste).doc);
    expect(paginas.length).toBeGreaterThan(2);
  });
});

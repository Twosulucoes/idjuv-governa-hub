import { describe, expect, it } from 'vitest';
import { renderizarDocumento } from '../core/renderizar';
import { relatorioPesquisaPrecos } from '../modelos/compras/pesquisaPrecos';
import { REGISTRO } from '../registro';
import { emissaoTeste, marcaTeste } from './fixtures';
import { dadosPesquisaPrecos } from './fixturesPesquisaPrecos';
import { lerPdf } from './lerPdf';
import { montarItemRelatorio } from '@/lib/compras/relatorioPesquisaPrecos';

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

  it('na adesão, imprime o preço registrado na ata e a diferença para o estimado', async () => {
    const base = dadosPesquisaPrecos();
    const itens = base.itens.map((i, k) => montarItemRelatorio(
      { ...i, preco_comparado: k === 0 ? 90 : null },
      i.amostras,
      '2026-10-29',
      'adesao_ata',
    ));
    const d = { ...base, finalidade: 'Adesão a ata de registro de preços', comparacao: { rotulo: 'preço registrado na ata', artigo: 'art. 86, § 2º, II' }, itens };
    const t = await ler(renderizarDocumento(relatorioPesquisaPrecos, d, marcaTeste, emissaoTeste).doc);
    for (const s of ['Preço registrado na ata (Lei 14.133, art. 86, § 2º, II)', 'R$ 90,00', 'abaixo do estimado', 'Informe o preço registrado na ata']) {
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

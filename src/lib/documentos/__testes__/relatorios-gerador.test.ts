import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderizarDocumento } from '../core/renderizar';
import { relatorioGerador, relatorioGeradorPaisagem, type DadosRelatorioGerador } from '../modelos/relatorios/gerador';
import { REGISTRO } from '../registro';
import type { DocumentoModelo } from '../tipos';
import { emissaoTeste, marcaTeste } from './fixtures';
import { lerPdf } from './lerPdf';

const ler = <D,>(modelo: DocumentoModelo<D>, dados: D) => lerPdf(renderizarDocumento(modelo, dados, marcaTeste, emissaoTeste).doc);
const textoTodo = (p: { texto: string }[]) => p.map((x) => x.texto).join(' ');
const semVazamento = (t: string) => {
  expect(t).not.toContain('undefined');
  expect(t).not.toContain('null');
  expect(t).not.toContain('NaN');
  expect(t).not.toContain('[object');
};

const colunas = [
  { chave: 'numero', titulo: 'Número' },
  { chave: 'credor', titulo: 'Credor', peso: 2 },
  { chave: 'valor', titulo: 'Empenhado', alinhamento: 'direita' as const },
];
const linha = (i: number) => ({ numero: `2026NE${String(i).padStart(5, '0')}`, credor: `Credor ${i}`, valor: `R$ ${i},00` });

const simples = (n: number): DadosRelatorioGerador => ({
  titulo: 'Empenhos do mês',
  fonte: 'Empenhos (FIP 614)',
  filtros: ['Situação: Pago, Emitido', 'Período: 01/10/2026 a 31/10/2026'],
  colunas,
  quantidade: n,
  linhas: Array.from({ length: n }, (_, i) => linha(i + 1)),
  totais: { valor: 'R$ 999,00' },
  legendaTotais: 'Empenhado: soma',
  nomeArquivo: 'empenhos.pdf',
});

const agrupado: DadosRelatorioGerador = {
  ...simples(0),
  titulo: 'Empenhos por natureza e credor',
  quantidade: 3,
  linhas: undefined,
  grupos: [
    {
      rotulo: '3.3.90.39',
      quantidade: 2,
      totais: { valor: 'R$ 3,00' },
      linhas: [],
      subgrupos: [
        { rotulo: 'Credor 1', quantidade: 1, totais: { valor: 'R$ 1,00' }, subgrupos: [], linhas: [linha(1)] },
        { rotulo: 'Credor 2', quantidade: 1, totais: { valor: 'R$ 2,00' }, subgrupos: [], linhas: [linha(2)] },
      ],
    },
    { rotulo: '3.1.90.11', quantidade: 1, totais: { valor: 'R$ 3,00' }, subgrupos: [], linhas: [linha(3)] },
  ],
  totais: { valor: 'R$ 6,00' },
};

describe('relatório do Gerador de relatórios', () => {
  it('está no REGISTRO, em retrato e em paisagem', () => {
    expect(REGISTRO['relatorios-gerador']).toBe(relatorioGerador);
    expect(REGISTRO['relatorios-gerador-paisagem']).toBe(relatorioGeradorPaisagem);
    expect(relatorioGeradorPaisagem.orientacao).toBe('paisagem');
  });

  it('sem agrupamento: fonte, filtros, legenda e linha de total', async () => {
    const t = textoTodo(await ler(relatorioGerador, simples(5)));
    for (const trecho of ['EMPENHOS DO MÊS', 'Fonte: Empenhos (FIP 614)', 'Total: 5 registro(s)', 'Situação: Pago, Emitido',
      'Período: 01/10/2026 a 31/10/2026', 'Totais: Empenhado: soma', '2026NE00005', 'R$ 999,00']) {
      expect(t.toUpperCase()).toContain(trecho.toUpperCase());
    }
    semVazamento(t);
  });

  it('agrupado em dois níveis: caminho do grupo, subtotais e total geral em texto', async () => {
    const t = textoTodo(await ler(relatorioGerador, agrupado));
    for (const trecho of ['3.3.90.39 / Credor 1 (1)', '3.3.90.39 / Credor 2 (1)', '3.1.90.11 (1)', 'R$ 2,00',
      'Total geral', '3 registro(s) · Empenhado: R$ 6,00']) expect(t).toContain(trecho);
    expect(t).not.toContain('Nenhum registro encontrado');
    semVazamento(t);
  });

  it('sem filtros e sem registros: avisa em vez de tabela vazia', async () => {
    const t = textoTodo(await ler(relatorioGerador, { ...simples(0), filtros: [] }));
    expect(t).toContain('Filtros: nenhum (todos os registros).');
    expect(t).toContain('Nenhum registro atende aos filtros escolhidos.');
    semVazamento(t);
  });

  it('muitas linhas: várias páginas, a última com o total', async () => {
    const p = await ler(relatorioGeradorPaisagem, simples(150));
    expect(p.length).toBeGreaterThan(2);
    expect(p[p.length - 1].texto).toContain('2026NE00150');
  });
});

// PDFs para inspeção visual em DOCUMENTOS_AMOSTRAS=<pasta>. Sem a variável, não faz nada.
const saida = process.env.DOCUMENTOS_AMOSTRAS;
describe.skipIf(!saida)('amostras do Gerador de relatórios', () => {
  it('grava as amostras', () => {
    mkdirSync(saida!, { recursive: true });
    const gravar = <D,>(nome: string, modelo: DocumentoModelo<D>, dados: D) =>
      writeFileSync(join(saida!, nome), Buffer.from(renderizarDocumento(modelo, dados, marcaTeste, emissaoTeste).doc.output('arraybuffer')));
    gravar('gerador-simples.pdf', relatorioGerador, simples(40));
    gravar('gerador-agrupado.pdf', relatorioGerador, agrupado);
  });
});

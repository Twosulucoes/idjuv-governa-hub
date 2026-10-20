import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { montarDadosRelatorioPortarias, type ConfiguracaoRelatorioPortarias } from '@/lib/relatorioPortarias';
import { renderizarDocumento } from '../core/renderizar';
import { relatorioPortarias, relatorioPortariasPaisagem, type DadosRelatorioPortarias } from '../modelos/portarias/relatorioPortarias';
import { REGISTRO } from '../registro';
import { emissaoTeste, marcaTeste } from './fixtures';
import { portariasFicticias } from './fixturesPortarias';
import { lerPdf } from './lerPdf';

// A função da tela chama emitirDocumento (navegador: logos por <img>); aqui só se captura o que ela manda.
const emitidos = vi.hoisted(() => [] as { tipo: string; dados: unknown }[]);
vi.mock('@/lib/documentos', () => ({
  emitirDocumento: async (tipo: string, dados: unknown) => {
    emitidos.push({ tipo, dados });
    return { doc: null, blob: null, nomeArquivo: '' };
  },
  baixarDocumento: () => undefined,
}));

const AGORA = new Date(2026, 9, 20, 14, 30);

const config = (over: Partial<ConfiguracaoRelatorioPortarias> = {}): ConfiguracaoRelatorioPortarias => ({
  titulo: 'RELATÓRIO DE PORTARIAS',
  subtitulo: '',
  agrupamento: 'status',
  colunasSelecionadas: ['numero', 'titulo', 'categoria', 'status', 'data_documento'],
  mostrarTotais: true,
  mostrarResumo: true,
  ordenacao: 'data',
  ordenacaoDir: 'desc',
  ...over,
});

const dados = (n: number, over: Partial<ConfiguracaoRelatorioPortarias> = {}): DadosRelatorioPortarias =>
  montarDadosRelatorioPortarias(portariasFicticias(n), config(over), AGORA);

const TODAS = ['numero', 'titulo', 'categoria', 'status', 'data_documento', 'ementa', 'servidores', 'unidade', 'cargo', 'doe_numero', 'doe_data'];

const ler = async (d: DadosRelatorioPortarias, modelo = relatorioPortarias) => {
  const r = renderizarDocumento(modelo, d, marcaTeste, emissaoTeste);
  const paginas = await lerPdf(r.doc);
  return { ...r, paginas, texto: paginas.map((p) => p.texto).join(' ') };
};

const semLixo = (texto: string) => {
  expect(texto).not.toContain('undefined');
  expect(texto).not.toContain('null');
  expect(texto).not.toContain('NaN');
};

beforeEach(() => {
  emitidos.length = 0;
});

describe('relatório de portarias no motor único', () => {
  it('modelo no REGISTRO, retrato e nome do arquivo', async () => {
    expect(REGISTRO['portarias-relatorio']).toBe(relatorioPortarias);
    expect(REGISTRO['portarias-relatorio-paisagem']).toBe(relatorioPortariasPaisagem);
    const { nomeArquivo, paginas } = await ler(dados(3));
    expect(nomeArquivo).toBe('relatorio-portarias-2026-10-20-1430.pdf');
    expect(paginas[0].altura).toBeGreaterThan(paginas[0].largura);
  });

  it('só as colunas escolhidas aparecem, na ordem da tela, com valores sem corte', async () => {
    const d = dados(4, { agrupamento: 'nenhum', colunasSelecionadas: ['ementa', 'numero', 'unidade', 'doe_numero', 'doe_data', 'servidores'] });
    expect(d.colunas.map((c) => c.chave)).toEqual(['numero', 'ementa', 'servidores', 'unidade', 'doe_numero', 'doe_data']);
    const { texto } = await ler(d);
    for (const t of ['NÚMERO', 'EMENTA', 'SERVIDORES', 'UNIDADE', 'DOE', 'DATA DOE', '001/2026', 'COFIC', 'DIREX', 'DOE 4001', '05/10/2026']) {
      expect(texto).toContain(t);
    }
    // ementa inteira (o antigo cortava em 30 caracteres): quebra de linha
    expect(texto).toContain('sem relação com dados reais.');
    for (const t of ['TÍTULO', 'CATEGORIA', 'CARGO', 'Portaria de exemplo']) expect(texto).not.toContain(t);
    expect(texto).toContain('Todas as Portarias (4)');
    semLixo(texto);
  });

  it('agrupamento por status gera uma seção por grupo com subtotal; total geral e resumo', async () => {
    const { texto } = await ler(dados(10));
    for (const t of ['Publicado (2)', 'Vigente (2)', 'Aguardando SEI (2)', 'Aguardando Publicação (2)', 'Revogado (2)']) {
      expect(texto).toContain(t);
    }
    expect(texto.match(/Subtotal: 2 portaria\(s\)/g)).toHaveLength(5);
    expect(texto).toContain('TOTAL GERAL: 10 portaria(s)');
    expect(texto).toContain('Total: 10 portaria(s)');
    expect(texto).toContain('Resumo por status');
    expect(texto).toContain('Agrupamento: Por Status');
    // categoria sai com rótulo, não com o código do banco
    expect(texto).toContain('Nomeação');
    semLixo(texto);
  });

  it('outros agrupamentos: categoria, unidade, mês e servidores', async () => {
    expect(dados(14, { agrupamento: 'categoria' }).grupos.map((g) => g.rotulo)).toEqual(
      expect.arrayContaining(['Nomeação', 'Exoneração', 'Designação', 'Férias', 'Licença', 'Sem categoria']),
    );
    expect(dados(8, { agrupamento: 'unidade' }).grupos.map((g) => g.rotulo).sort()).toEqual(
      ['Coordenação Fictícia', 'Diretoria de Exemplo', 'Sem Unidade'],
    );
    const meses = dados(6, { agrupamento: 'mes' });
    expect(meses.grupos.map((g) => g.rotulo).sort()).toEqual(['Agosto 2026', 'Outubro 2026', 'Setembro 2026']);
    const { texto } = await ler(meses);
    expect(texto).toContain('Outubro 2026 (2)');
    expect(dados(6, { agrupamento: 'servidor' }).grupos.map((g) => g.rotulo).sort()).toEqual(
      ['1 servidor(es)', '2 servidor(es)', '3 servidor(es)'],
    );
  });

  it('sem totais nem resumo; filtros impressos', async () => {
    const d = dados(10, { mostrarTotais: false, mostrarResumo: false, filtroStatus: 'publicado', periodoInicio: '2026-08-01' });
    const { texto } = await ler(d);
    expect(texto).not.toContain('Subtotal');
    expect(texto).not.toContain('TOTAL GERAL');
    expect(texto).not.toContain('Resumo por status');
    expect(texto).toContain('Filtros: Status: Publicado · Período: 01/08/2026 a ...');
    expect(texto).toContain('Total: 2 portaria(s)');
  });

  it('ordenação por data respeita a data, não o texto', () => {
    const d = dados(6, { agrupamento: 'nenhum', ordenacaoDir: 'asc', colunasSelecionadas: ['numero', 'data_documento'] });
    const datas = d.grupos[0].linhas.map((l) => String(l.data_documento).split('/').reverse().join(''));
    expect(datas).toEqual([...datas].sort());
  });

  it('muitas colunas saem em paisagem, sem quebrar número e data no meio', async () => {
    const { gerarRelatorioPortariasPDF } = await import('@/lib/relatorioPortarias');
    await gerarRelatorioPortariasPDF(portariasFicticias(3), config({ colunasSelecionadas: TODAS }));
    await gerarRelatorioPortariasPDF(portariasFicticias(3), config());
    expect(emitidos.map((e) => e.tipo)).toEqual(['portarias-relatorio-paisagem', 'portarias-relatorio']);
    const { paginas, texto } = await ler(dados(3, { colunasSelecionadas: TODAS }), relatorioPortariasPaisagem);
    expect(paginas[0].largura).toBeGreaterThan(paginas[0].altura);
    const itens = paginas.flatMap((p) => p.itens.map((i) => i.str));
    expect(itens).toEqual(expect.arrayContaining(['002/2026', '03/10/2026', '05/10/2026', 'CATEGORIA', 'SERVIDORES']));
    semLixo(texto);
    // no limite do retrato (6 colunas, com ementa) a data também cabe numa linha
    const retrato = await ler(dados(3, { colunasSelecionadas: TODAS.slice(0, 6) }));
    expect(retrato.paginas.flatMap((p) => p.itens.map((i) => i.str))).toEqual(expect.arrayContaining(['03/10/2026', 'CATEGORIA']));
  });

  it('vazio sem undefined/null/NaN', async () => {
    const { texto } = await ler(dados(0, { titulo: '' }));
    expect(texto).toContain('RELATÓRIO DE PORTARIAS');
    expect(texto).toContain('Nenhuma portaria encontrada para os filtros selecionados.');
    semLixo(texto);
  });

  it('muitas linhas atravessam página repetindo o cabeçalho da tabela', async () => {
    const { paginas } = await ler(dados(90, { agrupamento: 'nenhum' }));
    expect(paginas.length).toBeGreaterThan(2);
    expect(paginas.at(-1)!.texto).toContain('NÚMERO');
    expect(paginas.map((p) => p.texto).join(' ')).toContain('090/2026');
  });

  it('a função da tela emite portarias-relatorio com as portarias filtradas', async () => {
    const { gerarRelatorioPortariasPDF } = await import('@/lib/relatorioPortarias');
    await gerarRelatorioPortariasPDF(portariasFicticias(10), config({ filtroCategoria: 'nomeacao' }));
    expect(emitidos[0].tipo).toBe('portarias-relatorio');
    const d = emitidos[0].dados as DadosRelatorioPortarias;
    expect(d.grupos.flatMap((g) => g.linhas).map((l) => l.categoria)).toEqual(['Nomeação', 'Nomeação']);
  });
});

const saida = process.env.DOCUMENTOS_AMOSTRAS;

describe.skipIf(!saida)('amostras do relatório de portarias', () => {
  it('grava os PDFs', () => {
    mkdirSync(saida!, { recursive: true });
    const gravar = (nome: string, d: DadosRelatorioPortarias, modelo = relatorioPortarias) =>
      writeFileSync(join(saida!, nome), Buffer.from(renderizarDocumento(modelo, d, marcaTeste, emissaoTeste).doc.output('arraybuffer')));
    gravar('depois-agrupado-status.pdf', dados(30, { subtitulo: 'Subtítulo de exemplo' }));
    gravar(
      'depois-todas-colunas.pdf',
      dados(12, { agrupamento: 'nenhum', subtitulo: 'Subtítulo de exemplo', colunasSelecionadas: TODAS }),
      relatorioPortariasPaisagem,
    );
  });
});

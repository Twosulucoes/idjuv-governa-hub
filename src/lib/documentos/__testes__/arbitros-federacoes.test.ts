import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CAMPOS_FEDERACOES, type ConfiguracaoRelatorioFederacao } from '@/types/federacoesRelatorio';
import { renderizarDocumento } from '../core/renderizar';
import { relatorioArbitros, type DadosRelatorioArbitros } from '../modelos/arbitros/relatorioArbitros';
import {
  relatorioFederacoes,
  relatorioFederacoesPaisagem,
  type DadosRelatorioFederacoes,
} from '../modelos/federacoes/relatorioFederacoes';
import { REGISTRO } from '../registro';
import type { DocumentoModelo } from '../tipos';
import { emissaoTeste, marcaTeste } from './fixtures';
import { lerPdf } from './lerPdf';

// As funções das telas chamam emitirDocumento (navegador: logos por <img>); aqui só se captura o que elas mandam.
const emitidos = vi.hoisted(() => [] as { tipo: string; dados: unknown }[]);
vi.mock('@/lib/documentos', () => ({
  emitirDocumento: async (tipo: string, dados: unknown) => {
    emitidos.push({ tipo, dados });
    return { doc: null, blob: null, nomeArquivo: '' };
  },
  baixarDocumento: () => undefined,
}));

const ler = async <D,>(modelo: DocumentoModelo<D>, dados: D) => {
  const r = renderizarDocumento(modelo, dados, marcaTeste, emissaoTeste);
  const paginas = await lerPdf(r.doc);
  return { ...r, paginas, texto: paginas.map((p) => p.texto).join(' ') };
};

const semLixo = (texto: string) => {
  expect(texto).not.toContain('undefined');
  expect(texto).not.toContain('null');
  expect(texto).not.toContain('NaN');
};

// ---------- fixtures (dados fictícios) ----------

const camposArbitros = [
  { chave: 'nome', rotulo: 'Nome' },
  { chave: 'cpf', rotulo: 'CPF' },
  { chave: 'celular', rotulo: 'Celular' },
  { chave: 'email', rotulo: 'E-mail' },
  { chave: 'modalidades_texto', rotulo: 'Modalidades' },
  { chave: 'categorias_texto', rotulo: 'Categorias' },
  { chave: 'status', rotulo: 'Status' },
  { chave: 'created_at', rotulo: 'Data de Cadastro' },
];

const arbitro = (i: number) => ({
  nome: `Árbitro De Exemplo ${i + 1}`,
  cpf: '000.000.000-00',
  celular: '(00) 90000-0000',
  email: `arbitro${i + 1}@exemplo.com`,
  modalidades_texto: i % 2 ? 'Futebol, Futsal, Vôlei de Praia' : 'Basquete',
  categorias_texto: i % 2 ? 'Estadual, Nacional' : 'Estadual',
  status: 'Aprovado',
  created_at: '10/10/2026',
});

const dadosArbitros = (n: number, agrupado = false): DadosRelatorioArbitros => {
  const linhas = Array.from({ length: n }, (_, i) => arbitro(i));
  return {
    titulo: 'Relatório de Cadastro de Árbitros',
    subtitulo: `${n} árbitro(s) — Gerado em 20/10/2026`,
    campos: camposArbitros,
    linhas,
    grupos: agrupado
      ? [
          { modalidade: 'Basquete', linhas: linhas.slice(0, 1) },
          { modalidade: 'Futebol', linhas: linhas.slice(1) },
        ]
      : undefined,
    carimboArquivo: '2026-10-20-1430',
  };
};

const camposFed = CAMPOS_FEDERACOES.filter((c) => ['nome', 'sigla', 'modalidade', 'status', 'mandato_fim', 'presidente_nome', 'telefone'].includes(c.id));

const dadosFederacoes = (n: number): DadosRelatorioFederacoes => ({
  titulo: 'Relatório de Federações',
  subtitulo: 'Federações cadastradas',
  colunas: camposFed.map((c) => ({ chave: c.id, titulo: c.label, peso: c.largura === 'grande' ? 2.2 : c.largura === 'pequena' ? 1 : 1.5 })),
  linhas: Array.from({ length: n }, (_, i) => ({
    nome: `Federação de Exemplo de Esporte Número ${i + 1} do Estado`,
    sigla: `FEX${i}`,
    modalidade: 'Atletismo',
    status: i % 3 ? 'Ativa' : 'Em Análise',
    mandato_fim: '31/12/2027',
    presidente_nome: `Presidente ${i + 1}`,
    telefone: '-',
  })),
  carimboArquivo: '2026-10-20-1430',
});

const configFed = (over: Partial<ConfiguracaoRelatorioFederacao> = {}): ConfiguracaoRelatorioFederacao => ({
  nome: 'x',
  tipo: 'federacoes',
  titulo: 'Relatório de Federações',
  subtitulo: 'Federações cadastradas',
  incluirLogos: true,
  orientacao: 'paisagem',
  camposSelecionados: ['nome', 'sigla', 'status', 'mandato_fim', 'telefone'],
  filtros: {},
  ordenacao: { campo: 'nome', direcao: 'asc' },
  ...over,
});

beforeEach(() => {
  emitidos.length = 0;
});

// ---------- árbitros ----------

describe('árbitros no motor único', () => {
  it('modelos no REGISTRO', () => {
    expect(Object.keys(REGISTRO)).toEqual(
      expect.arrayContaining(['arbitros-relatorio-cadastro', 'federacoes-relatorio', 'federacoes-relatorio-paisagem']),
    );
    expect(relatorioArbitros.orientacao).toBe('paisagem');
  });

  it('lista simples: título, subtítulo, colunas, valores e cada modalidade numa linha', async () => {
    const { texto, nomeArquivo, paginas } = await ler(relatorioArbitros, dadosArbitros(2));
    expect(nomeArquivo).toBe('relatorio-arbitros-2026-10-20-1430.pdf');
    expect(paginas[0].largura).toBeGreaterThan(paginas[0].altura);
    for (const t of ['RELATÓRIO DE CADASTRO DE ÁRBITROS', '2 árbitro(s)', 'ORD.', 'NOME', 'CPF', 'CELULAR', 'E-MAIL', 'MODALIDADES',
      'CATEGORIAS', 'STATUS', 'DATA DE CADASTRO', 'Árbitro De Exemplo 1', '000.000.000-00', '(00) 90000-0000',
      'arbitro2@exemplo.com', 'Futebol', 'Futsal', 'Vôlei de Praia', 'Nacional', 'Aprovado', '10/10/2026']) {
      expect(texto).toContain(t);
    }
    // um item por linha: "Futsal" sem a vírgula do texto original
    expect(texto).not.toContain('Futebol,');
    semLixo(texto);
  });

  it('agrupado por modalidade: seção com contagem e numeração contínua', async () => {
    const { paginas, texto } = await ler(relatorioArbitros, dadosArbitros(3, true));
    expect(texto).toContain('BASQUETE (1 árbitro)');
    expect(texto).toContain('FUTEBOL (2 árbitros)');
    const ordens = paginas[0].itens.filter((i) => /^[123]$/.test(i.str)).map((i) => i.str);
    expect(ordens).toEqual(expect.arrayContaining(['1', '2', '3']));
    semLixo(texto);
  });

  it('título do grupo não fica sozinho no pé da página', async () => {
    const d = dadosArbitros(30);
    d.grupos = [
      { modalidade: 'Basquete', linhas: d.linhas.slice(0, 5) },
      { modalidade: 'Futebol', linhas: d.linhas.slice(5) },
    ];
    const { paginas } = await ler(relatorioArbitros, d);
    const pagina = paginas.find((p) => p.texto.includes('FUTEBOL (25 árbitros)'))!;
    expect(pagina.texto).toContain('Árbitro De Exemplo 6');
  });

  it('vazio e campo ausente sem undefined/null/NaN', async () => {
    const vazio = await ler(relatorioArbitros, { ...dadosArbitros(0), titulo: undefined, subtitulo: undefined });
    expect(vazio.texto).toContain('RELATÓRIO DE CADASTRO DE ÁRBITROS');
    expect(vazio.texto).toContain('Nenhum registro encontrado.');
    semLixo(vazio.texto);
    const ausente = await ler(relatorioArbitros, {
      ...dadosArbitros(0),
      linhas: [{ nome: 'Sem Dados', cpf: null, celular: undefined, modalidades_texto: '' }],
    });
    expect(ausente.texto).toContain('Sem Dados');
    semLixo(ausente.texto);
  });

  it('muitas linhas atravessam página repetindo o cabeçalho da tabela', async () => {
    const { paginas } = await ler(relatorioArbitros, dadosArbitros(80, true));
    expect(paginas.length).toBeGreaterThan(2);
    expect(paginas.at(-1)!.texto).toContain('MODALIDADES');
    expect(paginas.map((p) => p.texto).join(' ')).toContain('Árbitro De Exemplo 80');
  });

  it('a função da tela passa as linhas da chave do rótulo para a chave do campo, sem mais campos', async () => {
    const { gerarRelatorioArbitrosPDF } = await import('@/lib/pdfRelatorioArbitros');
    await gerarRelatorioArbitrosPDF([{ Nome: 'Fulano', CPF: '000.000.000-00', Extra: 'não impresso' }], {
      titulo: 'Relatório de Cadastro de Árbitros',
      campos: [{ key: 'nome', label: 'Nome' }, { key: 'cpf', label: 'CPF' }],
      grupos: [{ modalidade: 'Judô', dados: [{ Nome: 'Fulano', CPF: null }] }],
    });
    expect(emitidos[0].tipo).toBe('arbitros-relatorio-cadastro');
    const d = emitidos[0].dados as DadosRelatorioArbitros;
    expect(d.linhas).toEqual([{ nome: 'Fulano', cpf: '000.000.000-00' }]);
    expect(d.grupos).toEqual([{ modalidade: 'Judô', linhas: [{ nome: 'Fulano', cpf: null }] }]);
  });
});

// ---------- federações ----------

describe('federações no motor único', () => {
  it('título, subtítulo, total, colunas e valores', async () => {
    const { texto, nomeArquivo, paginas } = await ler(relatorioFederacoes, dadosFederacoes(3));
    expect(nomeArquivo).toBe('relatorio-federacoes-2026-10-20-1430.pdf');
    expect(paginas[0].altura).toBeGreaterThan(paginas[0].largura);
    for (const t of ['RELATÓRIO DE FEDERAÇÕES', 'Federações cadastradas', 'Total de registros: 3', 'Nome', 'Sigla', 'Modalidade',
      'Status', 'Fim Mandato', 'Presidente', 'Telefone', 'FEX0', 'Atletismo', 'Em Análise', 'Ativa', '31/12/2027', 'Presidente 3']) {
      expect(texto).toContain(t);
    }
    // o nome longo não é mais cortado com "...": quebra de linha
    expect(texto).not.toContain('...');
    expect(texto).toContain('Estado');
    semLixo(texto);
  });

  it('paisagem e vazio', async () => {
    const { paginas, texto } = await ler(relatorioFederacoesPaisagem, dadosFederacoes(0));
    expect(paginas[0].largura).toBeGreaterThan(paginas[0].altura);
    expect(texto).toContain('Total de registros: 0');
    expect(texto).toContain('Nenhum registro encontrado para os filtros selecionados.');
    semLixo(texto);
  });

  it('muitas linhas atravessam página', async () => {
    const { paginas } = await ler(relatorioFederacoesPaisagem, dadosFederacoes(60));
    expect(paginas.length).toBeGreaterThan(2);
    expect(paginas.at(-1)!.texto).toContain('Sigla');
    expect(paginas.map((p) => p.texto).join(' ')).toContain('Presidente 60');
  });

  it('a função da tela escolhe a orientação e formata data, status e vazio', async () => {
    const { gerarRelatorioFederacoesPDF } = await import('@/lib/pdfRelatorioFederacoes');
    const item = { nome: 'Federação X', sigla: 'FX', status: 'em_analise', mandato_fim: '2027-12-31T12:00:00', telefone: null, email: 'x@x' };
    await gerarRelatorioFederacoesPDF(configFed(), [item], CAMPOS_FEDERACOES);
    await gerarRelatorioFederacoesPDF(configFed({ orientacao: 'retrato' }), [item], CAMPOS_FEDERACOES);
    expect(emitidos.map((e) => e.tipo)).toEqual(['federacoes-relatorio-paisagem', 'federacoes-relatorio']);
    const d = emitidos[0].dados as DadosRelatorioFederacoes;
    expect(d.colunas.map((c) => c.chave)).toEqual(['nome', 'sigla', 'status', 'mandato_fim', 'telefone']);
    expect(d.linhas).toEqual([{ nome: 'Federação X', sigla: 'FX', status: 'Em Análise', mandato_fim: '31/12/2027', telefone: '-' }]);
  });
});

// ---------- amostras ----------

const saida = process.env.DOCUMENTOS_AMOSTRAS;

describe.skipIf(!saida)('amostras de árbitros e federações', () => {
  it('grava os PDFs', () => {
    mkdirSync(saida!, { recursive: true });
    const gravar = <D,>(nome: string, modelo: DocumentoModelo<D>, dados: D) =>
      writeFileSync(join(saida!, nome), Buffer.from(renderizarDocumento(modelo, dados, marcaTeste, emissaoTeste).doc.output('arraybuffer')));
    gravar('depois-arbitros-lista.pdf', relatorioArbitros, dadosArbitros(40));
    const agrupado = dadosArbitros(40, true);
    agrupado.grupos = [
      { modalidade: 'Basquete', linhas: agrupado.linhas.slice(0, 5) },
      { modalidade: 'Futebol', linhas: agrupado.linhas.slice(5, 30) },
    ];
    gravar('depois-arbitros-agrupado.pdf', relatorioArbitros, agrupado);
    gravar('depois-federacoes-paisagem.pdf', relatorioFederacoesPaisagem, dadosFederacoes(35));
    gravar('depois-federacoes-retrato.pdf', relatorioFederacoes, dadosFederacoes(8));
    gravar('depois-federacoes-vazio.pdf', relatorioFederacoesPaisagem, dadosFederacoes(0));
  });
});

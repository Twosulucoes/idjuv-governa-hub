import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderizarDocumento } from '../core/renderizar';
import { listagemUnidades, type DadosListagemUnidades, type UnidadeResumo } from '../modelos/unidades/listagemUnidades';
import {
  relatorioUnidadesLocais,
  type CamposRelatorio,
  type ConfiguracaoRelatorio,
  type DadosRelatorioUnidadesLocais,
  type UnidadeRelatorioData,
} from '../modelos/unidades/relatorioUnidadesLocais';
import { REGISTRO } from '../registro';
import type { DocumentoModelo } from '../tipos';
import { emissaoTeste, marcaTeste } from './fixtures';
import { lerPdf } from './lerPdf';

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

// ---------- fixtures ----------

const NOME_LONGO = 'Complexo Poliesportivo de Exemplo com Nome Bem Comprido para Teste de Quebra';
const TIPOS = ['ginasio', 'estadio', 'quadra', 'piscina', 'complexo'];
const STATUS = ['ativa', 'manutencao', 'interditada', 'inativa'];

const unidades = (n: number): UnidadeRelatorioData[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `u${i}`,
    codigo_unidade: `UL-${String(i + 1).padStart(3, '0')}`,
    nome_unidade: i === 1 ? NOME_LONGO : `Unidade de Exemplo ${i + 1}`,
    tipo_unidade: TIPOS[i % 5],
    municipio: ['Cidade Alfa', 'Cidade Beta', 'Cidade Gama'][i % 3],
    endereco_completo: i % 2 ? null : `Rua de Exemplo, ${100 + i} - Centro`,
    status: STATUS[i % 4],
    natureza_uso: i % 2 ? 'cultural' : 'esportivo',
    diretoria_vinculada: i % 3 ? 'Diretoria de Esporte de Exemplo' : null,
    unidade_administrativa: null,
    autoridade_autorizadora: null,
    capacidade: i % 4 ? 1500 + i : null,
    horario_funcionamento: 'Seg a sex, 7h às 22h',
    estrutura_disponivel: null,
    areas_disponiveis: i % 2 ? [] : ['Quadra', 'Vestiário', 'Arquibancada'],
    regras_de_uso: 'Uso mediante agendamento.',
    observacoes: i % 2 ? null : 'Unidade com reforma prevista para o próximo semestre.',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    chefe_atual_id: i % 3 ? `c${i}` : null,
    chefe_atual_nome: i % 3 ? `Responsável de Exemplo ${i + 1}` : null,
    chefe_atual_cargo: i % 3 ? 'Chefe de Unidade' : null,
    chefe_ato_numero: i % 3 ? `${100 + i}/2026` : null,
    chefe_data_inicio: i % 3 ? '2026-02-15' : null,
    total_patrimonio: i * 3,
    patrimonio_valor_total: i * 1234.5,
    patrimonio_bom_estado: i,
    patrimonio_manutencao: 0,
    total_agendamentos: i * 2,
    agendamentos_aprovados: i,
    agendamentos_pendentes: i % 2,
    total_termos_cessao: i % 3,
    termos_vigentes: i % 2,
  }));

const todos = (marcado: boolean): CamposRelatorio => ({
  codigo: marcado, nome: marcado, tipo: marcado, municipio: marcado, endereco: marcado, status: marcado, natureza: marcado,
  diretoria: marcado, capacidade: marcado, horario: marcado, chefe: marcado, patrimonio: marcado, agendamentos: marcado,
  termos: marcado, areas: marcado, regras: marcado, observacoes: marcado,
});

const config = (modo: ConfiguracaoRelatorio['modo'], extra: Partial<ConfiguracaoRelatorio> = {}): ConfiguracaoRelatorio => ({
  titulo: 'RELATÓRIO DE UNIDADES LOCAIS',
  subtitulo: 'Relatório com filtros aplicados',
  modo,
  campos: todos(true),
  filtros: {
    municipio: 'Cidade Alfa', tipo: 'all', status: 'ativa', natureza: 'all', diretoria: 'all',
    comChefe: true, comPatrimonio: false, comAgendamentos: 'all', busca: 'exemplo',
  },
  incluirEstatisticas: true,
  incluirTotalizadores: true,
  ...extra,
});

const rel = (n: number, modo: ConfiguracaoRelatorio['modo'], extra?: Partial<ConfiguracaoRelatorio>): DadosRelatorioUnidadesLocais => ({
  unidades: unidades(n),
  config: config(modo, extra),
});

const resumo = (n: number): UnidadeResumo[] =>
  unidades(n).map((u) => ({
    codigo: u.codigo_unidade, nome: u.nome_unidade, tipo: u.tipo_unidade, municipio: u.municipio, status: u.status,
    chefe: u.chefe_atual_nome || undefined, capacidade: u.capacidade || undefined,
  }));

const listagem = (n: number, extra: Partial<DadosListagemUnidades> = {}): DadosListagemUnidades => ({
  titulo: 'RELATÓRIO DE UNIDADES LOCAIS',
  filtros: { municipio: 'Cidade Alfa', tipo: 'ginasio', status: 'ativa' },
  unidades: resumo(n),
  ...extra,
});

// ---------- relatório de unidades locais ----------

describe('relatório de unidades locais no motor único', () => {
  it('está no REGISTRO, família relatório, paisagem', () => {
    expect(REGISTRO['unidades-relatorio-unidades-locais']).toBe(relatorioUnidadesLocais);
    expect(relatorioUnidadesLocais.familia).toBe('relatorio');
    expect(relatorioUnidadesLocais.orientacao).toBe('paisagem');
    expect(relatorioUnidadesLocais.nomeArquivo(rel(1, 'detalhado'))).toMatch(/^relatorio-unidades-detalhado-\d{4}-\d{2}-\d{2}\.pdf$/);
    expect(relatorioUnidadesLocais.nomeArquivo(rel(1, 'resumo'))).toMatch(/^relatorio-unidades-resumo-/);
    expect(relatorioUnidadesLocais.nomeArquivo(rel(1, 'lista'))).toMatch(/^relatorio-unidades-\d{4}/);
  });

  it('lista: título, subtítulo com total, filtros, todas as colunas, valores e totalizadores', async () => {
    const { texto } = await ler(relatorioUnidadesLocais, rel(5, 'lista'));
    expect(texto).toContain('RELATÓRIO DE UNIDADES LOCAIS');
    expect(texto).toContain('Relatório com filtros aplicados · Total de registros: 5');
    for (const f of ['Filtros aplicados', 'Cidade Alfa', 'Ativa', 'Com chefe designado', 'Sem patrimônio', '"exemplo"']) expect(texto).toContain(f);
    for (const c of ['Código', 'Nome', 'Tipo', 'Município', 'Status', 'Natureza', 'Diretoria', 'Capacidade', 'Chefe atual', 'Patrimônio', 'Agendamentos', 'Termos'])
      expect(texto).toContain(c);
    for (const v of ['UL-001', 'Unidade de Exemplo 3', 'Ginásio', 'Em Manutenção', 'Esportivo', 'Cultural', '1.501', 'Sem chefe', 'Responsável de Exemplo 2', '12 itens', '8'])
      expect(texto).toContain(v);
    // Nome longo quebra em linhas em vez de virar "...".
    expect(texto).toContain('Complexo');
    expect(texto).toContain('Quebra');
    expect(texto).not.toContain('...');
    expect(texto).toContain('Totalizadores');
    expect(texto).toContain('Itens de patrimônio');
    expect(texto).toContain('30'); // 0+3+6+9+12
    expect(texto).toContain('R$ 12.345,00'); // 1234,5 × (0+1+2+3+4)
    expect(texto).toContain('Agendamentos');
    semLixo(texto);
  });

  it('lista sem coluna marcada cai em código, nome, município e status', async () => {
    const { texto } = await ler(relatorioUnidadesLocais, rel(3, 'lista', { campos: todos(false), incluirTotalizadores: false }));
    for (const c of ['Código', 'Nome', 'Município', 'Status']) expect(texto).toContain(c);
    expect(texto).not.toContain('Chefe atual');
    expect(texto).not.toContain('Totalizadores');
  });

  it('lista com muitas linhas atravessa páginas e repete o cabeçalho da tabela', async () => {
    const { paginas } = await ler(relatorioUnidadesLocais, rel(120, 'lista'));
    expect(paginas.length).toBeGreaterThan(2);
    for (const p of paginas.slice(1, -1)) expect(p.texto).toContain('Chefe atual');
    const tudo = paginas.map((p) => p.texto).join(' ');
    expect(tudo).toContain('UL-120');
  });

  it('detalhado: uma ficha por página com identificação, responsável, acervos, áreas, regras e observações', async () => {
    const { paginas, texto } = await ler(relatorioUnidadesLocais, rel(3, 'detalhado', { incluirTotalizadores: false }));
    expect(paginas.length).toBeGreaterThanOrEqual(3);
    expect(paginas[0].texto).toContain('UL-001 - Unidade de Exemplo 1');
    expect(paginas.some((p) => p.texto.includes('UL-002') && !p.texto.includes('UL-001 - Unidade'))).toBe(true);
    for (const s of ['Identificação', 'Responsável', 'Acervo', 'Patrimônio (itens)', 'Valor estimado', 'Em bom estado', 'Agendamentos',
      'Aprovados', 'Pendentes', 'Termos de cessão', 'Termos vigentes', 'Uso e observações', 'Áreas disponíveis', 'Regras de uso', 'Observações'])
      expect(texto).toContain(s);
    for (const v of ['Nenhum responsável designado', 'Responsável de Exemplo 2', 'Chefe de Unidade', '101/2026', '15/02/2026', 'R$ 1.234,50',
      'Rua de Exemplo, 100 - Centro', 'Diretoria de Esporte de Exemplo', 'Seg a sex, 7h às 22h', 'Quadra, Vestiário, Arquibancada',
      'Uso mediante agendamento.', 'Unidade com reforma prevista']) expect(texto).toContain(v);
    semLixo(texto);
  });

  it('resumo: estatísticas e distribuição por tipo e município com total', async () => {
    const { texto } = await ler(relatorioUnidadesLocais, rel(40, 'resumo'));
    for (const s of ['Estatísticas gerais', 'Total de unidades', 'Unidades ativas', 'Em manutenção', 'Interditadas', 'Com chefe designado',
      'Sem chefe designado', 'Total patrimônio', '2.340 itens', 'Valor patrimônio', 'R$ 962.910,00', 'Distribuição por tipo',
      'Distribuição por município', 'Complexo Esportivo', 'Cidade Alfa', '14', '13']) expect(texto).toContain(s);
    expect(texto).toContain('Total');
    semLixo(texto);
  });

  it('vazio e com números ausentes não imprime undefined/null/NaN em nenhum modo', async () => {
    const quebrada = { ...unidades(1)[0], total_patrimonio: null, patrimonio_valor_total: undefined, capacidade: null, natureza_uso: null,
      chefe_atual_nome: 'Fulano', chefe_atual_cargo: null, chefe_ato_numero: '1/2026', chefe_data_inicio: null } as unknown as UnidadeRelatorioData;
    for (const modo of ['lista', 'detalhado', 'resumo'] as const) {
      const vazio = await ler(relatorioUnidadesLocais, { unidades: [], config: { ...config(modo), filtros: {} } });
      semLixo(vazio.texto);
      expect(vazio.texto).toContain('Total de registros: 0');
      const ruim = await ler(relatorioUnidadesLocais, { unidades: [quebrada], config: config(modo) });
      semLixo(ruim.texto);
    }
    const lista = await ler(relatorioUnidadesLocais, { unidades: [], config: { ...config('lista'), filtros: {} } });
    expect(lista.texto).toContain('Nenhum registro encontrado.');
    expect(lista.texto).not.toContain('Filtros aplicados');
  });
});

// ---------- listagem de unidades ----------

describe('listagem de unidades no motor único', () => {
  it('está no REGISTRO, família relatório, paisagem', () => {
    expect(REGISTRO['unidades-listagem']).toBe(listagemUnidades);
    expect(listagemUnidades.familia).toBe('relatorio');
    expect(listagemUnidades.orientacao).toBe('paisagem');
    expect(listagemUnidades.nomeArquivo(listagem(1))).toMatch(/^Listagem_Unidades_\d{4}-\d{2}-\d{2}\.pdf$/);
  });

  it('título, subtítulo, total, filtros, colunas e valores', async () => {
    const { texto } = await ler(listagemUnidades, listagem(5));
    expect(texto).toContain('RELATÓRIO DE UNIDADES LOCAIS');
    expect(texto).toContain('Listagem geral');
    for (const f of ['Total de unidades', '5', 'Município', 'Cidade Alfa', 'Ginásio', 'Ativa']) expect(texto).toContain(f);
    for (const c of ['Código', 'Nome da unidade', 'Tipo', 'Status', 'Responsável', 'Capacidade']) expect(texto).toContain(c);
    for (const v of ['UL-001', 'Estádio', 'Em Manutenção', 'Interditada', 'Responsável de Exemplo 2', '1.501', 'Cidade Gama']) expect(texto).toContain(v);
    expect(texto).toContain('Quebra'); // nome longo inteiro, quebrado em linhas
    expect(texto).not.toContain('...');
    semLixo(texto);
  });

  it('conformidade: subtítulo próprio e aviso de responsável', async () => {
    const dados = listagem(4, {
      titulo: 'RELATÓRIO DE CONFORMIDADE',
      subtitulo: '4 unidades com pendências identificadas',
      filtros: undefined,
      unidades: resumo(4).map((u) => ({ ...u, chefe: u.chefe || 'SEM RESPONSÁVEL' })),
    });
    const { texto } = await ler(listagemUnidades, dados);
    expect(texto).toContain('RELATÓRIO DE CONFORMIDADE');
    expect(texto).toContain('4 unidades com pendências identificadas');
    expect(texto).toContain('SEM RESPONSÁVEL');
    semLixo(texto);
  });

  it('muitas linhas atravessam páginas repetindo o cabeçalho', async () => {
    const { paginas } = await ler(listagemUnidades, listagem(120));
    expect(paginas.length).toBeGreaterThan(2);
    for (const p of paginas.slice(1)) expect(p.texto).toContain('Nome da unidade');
    expect(paginas.map((p) => p.texto).join(' ')).toContain('UL-120');
  });

  it('vazia, sem filtros e com campos ausentes não imprime undefined/null/NaN', async () => {
    const vazia = await ler(listagemUnidades, { unidades: [] });
    expect(vazia.texto).toContain('Nenhum registro encontrado.');
    expect(vazia.texto).toContain('RELATÓRIO DE UNIDADES LOCAIS');
    semLixo(vazia.texto);
    const ruim = await ler(listagemUnidades, { unidades: [{ nome: 'Sem dados', tipo: '', municipio: '', status: '' }] });
    semLixo(ruim.texto);
    expect(ruim.texto).toContain('Sem dados');
  });
});

// Gera os PDFs em DOCUMENTOS_AMOSTRAS=<pasta> para inspeção visual (pdftoppm). Sem a variável, não faz nada.
const saida = process.env.DOCUMENTOS_AMOSTRAS;

describe.skipIf(!saida)('amostras dos relatórios de unidades para inspeção visual', () => {
  it('grava um PDF por relatório', () => {
    mkdirSync(saida!, { recursive: true });
    const gravar = <D,>(nome: string, modelo: DocumentoModelo<D>, dados: D) =>
      writeFileSync(join(saida!, nome), Buffer.from(renderizarDocumento(modelo, dados, marcaTeste, emissaoTeste).doc.output('arraybuffer')));
    gravar('depois-unidades-lista.pdf', relatorioUnidadesLocais, rel(40, 'lista'));
    gravar('depois-unidades-detalhado.pdf', relatorioUnidadesLocais, rel(3, 'detalhado'));
    gravar('depois-unidades-resumo.pdf', relatorioUnidadesLocais, rel(40, 'resumo'));
    gravar('depois-listagem-geral.pdf', listagemUnidades, listagem(40, { filtros: { municipio: 'Cidade Alfa', status: 'ativa' } }));
    gravar(
      'depois-listagem-conformidade.pdf',
      listagemUnidades,
      listagem(6, {
        titulo: 'RELATÓRIO DE CONFORMIDADE',
        subtitulo: '6 unidades com pendências identificadas',
        filtros: undefined,
        unidades: resumo(6).map((u) => ({ ...u, chefe: u.chefe || 'SEM RESPONSÁVEL' })),
      }),
    );
  });
});

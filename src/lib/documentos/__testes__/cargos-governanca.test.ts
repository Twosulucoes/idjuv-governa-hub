import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { renderizarDocumento } from '../core/renderizar';
import { relatorioCargosVagas, type DadosRelatorioCargosVagas } from '../modelos/cargos/cargosVagas';
import { quadroCargos, type DadosQuadroCargos } from '../modelos/cargos/quadroCargos';
import { relatorioGovernanca, type DadosRelatorioGovernanca } from '../modelos/governanca/relatorioAnual';
import { REGISTRO } from '../registro';
import type { DocumentoModelo } from '../tipos';
import { emissaoTeste, marcaTeste } from './fixtures';
import { lerPdf } from './lerPdf';

// As funções das telas montam os dados e chamam o motor; aqui o motor é trocado por um espião.
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
const emitidos: { tipo: string; dados: unknown }[] = [];
vi.mock('@/lib/documentos', async (original) => ({
  ...(await original<typeof import('@/lib/documentos')>()),
  emitirDocumento: vi.fn(async (tipo: string, dados: unknown) => {
    emitidos.push({ tipo, dados });
    return { doc: null, blob: null, nomeArquivo: '' };
  }),
  baixarDocumento: vi.fn(),
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

// ---------- fixtures (fictícias) ----------

const CATS = ['comissionado', 'efetivo', 'funcao_gratificada', 'temporario', 'estagiario'];

const cargosVagas = (n: number): DadosRelatorioCargosVagas => {
  const cargos = Array.from({ length: n }, (_, i) => ({
    nome: i === 0 ? 'Assessor Especial de Planejamento e Gestão Estratégica Institucional' : `Cargo de Exemplo ${i + 1}`,
    sigla: i % 3 ? `CDS-${(i % 5) + 1}` : null,
    categoria: CATS[i % 5],
    nivel_hierarquico: i % 6 ? i % 6 : null,
    quantidade_vagas: (i % 4) + 1,
    ocupadas: i % 5,
    composicao: Array.from({ length: i % 7 }, (_, k) => ({
      unidade_nome: `Diretoria de Unidade ${k + 1}`,
      unidade_sigla: k % 2 ? `DIR${k}` : null,
      quantidade_vagas: k + 1,
    })),
  }));
  const totalVagas = cargos.reduce((s, c) => s + c.quantidade_vagas, 0);
  const totalOcupadas = cargos.reduce((s, c) => s + c.ocupadas, 0);
  return { cargos, totalCargos: n, totalVagas, totalOcupadas, totalVacancia: totalVagas - totalOcupadas, dataGeracao: '20/10/2026, 14:30' };
};

const quadro = (n: number): DadosQuadroCargos => ({
  titulo: 'QUADRO DE CARGOS COMISSIONADOS',
  subtitulo: 'Lei nº 0.000/2025 - Cargos de exemplo',
  agruparPorUnidade: true,
  dataGeracao: '2026-10-20',
  vagas: Array.from({ length: n }, (_, i) => ({
    cargo_id: `c${i}`,
    cargo_nome: i === 1 ? 'Coordenador de Projetos Esportivos e Educacionais da Juventude' : `Assessor ${i}`,
    cargo_sigla: i % 9 === 8 ? '-' : `CDS-${(i % 4) + 1}`,
    quantidade_vagas: 1,
    unidade_nome: i % 3 ? `Diretoria Administrativa ${i % 4}` : 'Presidência',
    unidade_sigla: i % 3 ? `DIRAD${i % 4}` : '-',
    servidor_nome: i % 4 === 0 ? null : i === 7 ? 'Maria Aparecida dos Santos Oliveira Nascimento Ferreira' : `Servidor Fictício ${i}`,
    servidor_id: i % 4 === 0 ? null : `s${i}`,
  })),
});

const governanca = (): DadosRelatorioGovernanca => ({
  exercicio: '2025',
  indicadores: [
    { titulo: 'Conformidade', valor: '87%', meta: '90%' },
    { titulo: 'Processos', valor: '24', meta: '30' },
  ],
  conformidadeMensal: ['Jan', 'Fev', 'Mar'].map((mes, i) => ({ mes, valor: 70 + i })),
  processosPorArea: [{ area: 'Almoxarifado', quantidade: 3 }],
  riscos: [{ nivel: 'Crítico', quantidade: 1 }],
  acoes: [{ titulo: 'Auditoria Interna', situacao: 'Em andamento' }],
  resumoExecutivo: ['Resumo de exemplo.'],
  anoMetas: '2026',
  metas: ['Meta de exemplo'],
});

const governancaVazia: DadosRelatorioGovernanca = {
  exercicio: '2025', indicadores: [], conformidadeMensal: [], processosPorArea: [], riscos: [], acoes: [],
  resumoExecutivo: [], anoMetas: '2026', metas: [],
};

// ---------- testes ----------

describe('cargos e governança no motor único', () => {
  it('os três modelos estão no REGISTRO', () => {
    expect(Object.keys(REGISTRO)).toEqual(
      expect.arrayContaining(['cargos-relatorio-cargos-vagas', 'cargos-quadro-cargos', 'governanca-relatorio-anual']),
    );
  });

  it('cargos e vagas: resumo, distribuição por categoria, colunas, nome longo inteiro e totais', async () => {
    const dados = cargosVagas(10);
    const { texto, nomeArquivo } = await ler(relatorioCargosVagas, dados);
    expect(nomeArquivo).toBe('Relatorio_Cargos_2026-10-20.pdf');
    for (const t of ['RELATÓRIO DE CARGOS E VAGAS', 'Data de geração: 20/10/2026, 14:30', 'Resumo geral', 'Total de cargos',
      'Total de vagas', 'Vagas ocupadas', 'Vacância', 'Taxa de ocupação', 'Distribuição por categoria', 'Comissionado',
      'Função Gratificada', 'Estagiário', 'Detalhamento por cargo', 'Categoria', 'Nível', 'Ocup.', 'Vac.', 'Unid.',
      'Vagas por unidade', 'Cargo de Exemplo 2 (CDS-2)', 'DIR1: 2', 'Diretoria de Unidade 1: 1', 'TOTAL', '10 cargos']) {
      expect(texto).toContain(t);
    }
    // Corte por caracteres virou quebra de linha: o nome inteiro está no PDF.
    expect(texto.replace(/\s+/g, ' ')).toContain('Assessor Especial de Planejamento e Gestão Estratégica Institucional');
    expect(texto).toMatch(new RegExp(`Total de vagas\\s+${dados.totalVagas}`));
    expect(texto).toContain(`${((dados.totalOcupadas / dados.totalVagas) * 100).toFixed(1).replace('.', ',')}%`);
    semLixo(texto);
  });

  it('cargos e vagas vazio não imprime lixo', async () => {
    const { texto } = await ler(relatorioCargosVagas, cargosVagas(0));
    expect(texto).toContain('Nenhum registro encontrado.');
    expect(texto).toContain('0%');
    semLixo(texto);
  });

  it('quadro de cargos: colunas, ordem por unidade, VAGO, sigla "-" cai para o nome e resumo', async () => {
    const { texto, nomeArquivo } = await ler(quadroCargos, quadro(12));
    expect(nomeArquivo).toBe('quadro-cargos-2026-10-20.pdf');
    for (const t of ['QUADRO DE CARGOS COMISSIONADOS', 'Lei nº 0.000/2025 - Cargos de exemplo', 'Nº', 'Cargo', 'Símbolo',
      'Unidade', 'Servidor', '(VAGO)', 'Presidência', 'DIRAD1', 'Servidor Fictício 5', 'Resumo do quadro de cargos',
      'Ocupados', 'Vagos', 'Gerado em', '20/10/2026']) {
      expect(texto).toContain(t);
    }
    expect(texto.replace(/\s+/g, ' ')).toContain('Maria Aparecida dos Santos Oliveira Nascimento Ferreira');
    expect(texto.replace(/\s+/g, ' ')).toContain('Coordenador de Projetos Esportivos e Educacionais da Juventude');
    // 12 vagas, 3 sem ocupante (0, 4, 8).
    expect(texto).toMatch(/Total de cargos\s+12\s+Ocupados\s+9\s+Vagos\s+3/);
    // Agrupado por unidade: Diretoria Administrativa vem antes de Presidência.
    expect(texto.indexOf('DIRAD1')).toBeLessThan(texto.indexOf('Presidência'));
    semLixo(texto);
  });

  it('quadro de cargos vazio não imprime lixo', async () => {
    const { texto } = await ler(quadroCargos, { ...quadro(0), subtitulo: undefined });
    expect(texto).toContain('Nenhum registro encontrado.');
    semLixo(texto);
  });

  it('governança: indicadores com meta, meses, áreas, riscos, ações com situação, resumo e metas', async () => {
    const { texto, nomeArquivo } = await ler(relatorioGovernanca, governanca());
    expect(nomeArquivo).toBe('Relatorio_Governanca_Integridade_2025.pdf');
    for (const t of ['RELATÓRIO ANUAL DE GOVERNANÇA E INTEGRIDADE', 'Exercício 2025', 'Indicadores principais', 'Resultado',
      'Meta', '87%', '90%', 'Evolução da conformidade (%)', 'Jan', 'Mar', 'Conformidade (%)', '72', 'Processos por área',
      'Almoxarifado', 'Matriz de riscos', 'Crítico', 'Plano de ação de integridade', 'Auditoria Interna', 'Em andamento',
      'Resumo executivo', 'Resumo de exemplo.', 'Metas para 2026', 'Meta de exemplo']) {
      expect(texto).toContain(t);
    }
    semLixo(texto);
  });

  it('governança vazia não imprime lixo', async () => {
    const { texto } = await ler(relatorioGovernanca, governancaVazia);
    expect(texto).toContain('Nenhum registro encontrado.');
    expect(texto).toContain('Nenhum item informado.');
    semLixo(texto);
  });

  it('muitas linhas atravessam páginas e repetem o cabeçalho da tabela', async () => {
    const casos = [await ler(relatorioCargosVagas, cargosVagas(120)), await ler(quadroCargos, quadro(150))];
    for (const { paginas } of casos) {
      expect(paginas.length).toBeGreaterThan(2);
      for (const p of paginas) expect(p.texto).toMatch(/Página \d+ de \d+/);
    }
    // Cabeçalho da tabela repetido na 2ª página.
    expect(casos[0].paginas[1].texto).toContain('Vagas por unidade');
    expect(casos[1].paginas[1].texto).toContain('Servidor');
    const ultimaCargos = casos[0].paginas.at(-1)!.texto;
    expect(ultimaCargos).toContain('120 cargos');
    const fimQuadro = casos[1].paginas.slice(-2).map((p) => p.texto).join(' ');
    expect(fimQuadro).toContain('Resumo do quadro de cargos');
    expect(fimQuadro).toMatch(/Total de cargos\s+150/);
  });

  it('as funções das telas mandam os dados ao motor com o tipo certo', async () => {
    const { generateRelatorioCargos, generateRelatorioGovernancaPDF } = await import('@/lib/pdfGenerator');
    const { gerarRelatorioCargos98PDF } = await import('@/lib/pdfRelatorioCargos');
    emitidos.length = 0;
    await generateRelatorioCargos(cargosVagas(3));
    await generateRelatorioGovernancaPDF();
    await gerarRelatorioCargos98PDF(quadro(4).vagas);
    expect(emitidos.map((e) => e.tipo)).toEqual(['cargos-relatorio-cargos-vagas', 'governanca-relatorio-anual', 'cargos-quadro-cargos']);

    // Os dados montados pelas funções renderizam sem lixo e com o que o antigo imprimia.
    const gov = await ler(relatorioGovernanca, emitidos[1].dados as DadosRelatorioGovernanca);
    for (const t of ['Conformidade', 'Riscos mitigados', '156', '200', 'Dez', '88', 'Patrimônio', 'Baixo', '12',
      'Treinamento em Ética', 'Concluído', 'ISO 37001', 'Metas para 2026']) {
      expect(gov.texto).toContain(t);
    }
    semLixo(gov.texto);
    const q = emitidos[2].dados as DadosQuadroCargos;
    expect(q.titulo).toBe('QUADRO DE CARGOS COMISSIONADOS');
    expect(q.agruparPorUnidade).toBe(true);
    expect(q.dataGeracao).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// Gera os PDFs em DOCUMENTOS_AMOSTRAS=<pasta> para inspeção visual (pdftoppm). Sem a variável, não faz nada.
const saida = process.env.DOCUMENTOS_AMOSTRAS;

describe.skipIf(!saida)('amostras de cargos e governança para inspeção visual', () => {
  it('grava um PDF por relatório', async () => {
    mkdirSync(saida!, { recursive: true });
    const gravar = <D,>(nome: string, modelo: DocumentoModelo<D>, dados: D) =>
      writeFileSync(join(saida!, nome), Buffer.from(renderizarDocumento(modelo, dados, marcaTeste, emissaoTeste).doc.output('arraybuffer')));
    gravar('cargos-relatorio-cargos-vagas.pdf', relatorioCargosVagas, cargosVagas(40));
    gravar('cargos-quadro-cargos.pdf', quadroCargos, quadro(60));
    // Governança com os números que a tela imprime.
    const { generateRelatorioGovernancaPDF } = await import('@/lib/pdfGenerator');
    emitidos.length = 0;
    await generateRelatorioGovernancaPDF();
    gravar('governanca-relatorio-anual.pdf', relatorioGovernanca, emitidos[0].dados as DadosRelatorioGovernanca);
  });
});

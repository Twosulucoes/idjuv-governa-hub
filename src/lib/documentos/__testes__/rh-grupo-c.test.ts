import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderizarDocumento } from '../core/renderizar';
import { relatorioAgrupadoPortaria, type RelatorioAgrupadoPortariaData } from '../modelos/rh/agrupadoPortaria';
import { relatorioContatosEstrategicos, type DadosContatosEstrategicos } from '../modelos/rh/contatosEstrategicos';
import { relatorioSegundoVinculo, type RelatorioSegundoVinculoData } from '../modelos/rh/segundoVinculo';
import { relatorioServidoresDiretoria, type DadosServidoresDiretoria } from '../modelos/rh/servidoresDiretoria';
import { relatorioSituacaoPortaria, type RelatorioSituacaoPortariaData } from '../modelos/rh/situacaoPortaria';
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

const servidores = (n: number, prefixo = 'Servidor') =>
  Array.from({ length: n }, (_, i) => ({ nome: `${prefixo} ${i + 1}`, telefone: i % 2 ? '95991234567' : null, cargo: i % 3 ? 'Assessor' : null }));

const diretoria = (n: number): DadosServidoresDiretoria => ({
  carimboArquivo: '2026-10-19-1430',
  diretoria: {
    id: 'd', nome: 'Diretoria de Exemplo', sigla: 'DEX', tipo: 'diretoria', nivel: 1, servidores: servidores(n, 'Diretor'),
    subordinadas: [
      {
        id: 'v', nome: 'Divisão de Exemplo', sigla: 'DIVEX', tipo: 'divisao', nivel: 2, servidores: servidores(2, 'Chefe'),
        subordinadas: [{ id: 'n', nome: 'Núcleo Vazio', sigla: null, tipo: 'nucleo', nivel: 3, servidores: [], subordinadas: [] }],
      },
    ],
  },
});

const vinculos = (n: number, agruparPor: RelatorioSegundoVinculoData['agruparPor'] = 'esfera'): RelatorioSegundoVinculoData => {
  const lista = Array.from({ length: n }, (_, i) => ({
    nome: `Pessoa ${i + 1}`, cpf: '12345678901', matricula: null, vinculo_idjuv: 'Comissionado', cargo_idjuv: '-', unidade_idjuv: '-',
    vinculo_externo_esfera: i % 2 ? 'federal' : 'municipal', vinculo_externo_orgao: 'Secretaria de Origem',
    vinculo_externo_cargo: 'Professor', vinculo_externo_matricula: null, vinculo_externo_forma: i % 3 ? 'cessao' : 'informal',
    vinculo_externo_ato_numero: null,
  }));
  return { servidores: lista, totalServidores: n, dataGeracao: '19/10/2026', filtroEsfera: null, filtroForma: 'cessao', agruparPor };
};

const portariaItem = (i: number, portaria?: string) => ({
  ord: i + 1, nome: `Servidor ${i + 1}`, cpf: '12345678901', cargo: 'Assessor Técnico', unidade: 'DEX', codigo: 'CDS-3', portaria,
});

const situacao = (com: number, sem: number): RelatorioSituacaoPortariaData => ({
  servidoresComPortaria: Array.from({ length: com }, (_, i) => portariaItem(i, `${100 + i}/2026`)),
  servidoresSemPortaria: Array.from({ length: sem }, (_, i) => portariaItem(i, '-')),
  dataGeracao: '19/10/2026',
});

const agrupado = (porGrupo: number, sem: number): RelatorioAgrupadoPortariaData => ({
  grupos: [
    { numero: '101/2026', servidores: Array.from({ length: porGrupo }, (_, i) => portariaItem(i)) },
    { numero: '202/2026', servidores: Array.from({ length: 2 }, (_, i) => portariaItem(i)) },
  ],
  servidoresSemPortaria: Array.from({ length: sem }, (_, i) => portariaItem(i)),
  dataGeracao: '19/10/2026',
});

const contatos = (n: number): DadosContatosEstrategicos => ({
  carimboArquivo: '2026-10-19-1430',
  servidores: Array.from({ length: n }, (_, i) => ({
    nome_completo: `Contato ${i + 1}`, telefone_celular: '95991234567', indicacao: i % 2 ? 'Indicação de exemplo com texto um pouco mais longo' : null,
    possui_vinculo_externo: i % 2 === 0, vinculo_externo_orgao: i % 2 === 0 ? 'Órgão de Origem' : null,
  })),
});

// ---------- testes ----------

describe('rh grupo C no motor único', () => {
  it('os cinco modelos estão no REGISTRO', () => {
    expect(Object.keys(REGISTRO)).toEqual(
      expect.arrayContaining(['rh-servidores-diretoria', 'rh-segundo-vinculo', 'rh-situacao-portaria', 'rh-agrupado-portaria', 'rh-contatos-estrategicos']),
    );
  });

  it('servidores da diretoria: hierarquia, colunas, subtotais e unidade vazia', async () => {
    const { texto, nomeArquivo } = await ler(relatorioServidoresDiretoria, diretoria(3));
    expect(nomeArquivo).toBe('servidores-dex-2026-10-19-1430.pdf');
    for (const t of ['RELATÓRIO DE SERVIDORES', 'DEX - Diretoria de Exemplo', 'Total de servidores', 'Nome', 'Telefone', 'Cargo',
      'Diretor 1', '(95) 99123-4567', 'Assessor', 'Subtotal: 3 servidores', 'DEX › DIVEX - Divisão de Exemplo (2 servidores)',
      'Subtotal: 2 servidores', 'Núcleo Vazio (0 servidores)', 'Nenhum servidor lotado nesta unidade.']) {
      expect(texto).toContain(t);
    }
    expect(texto).toMatch(/Total de servidores\s+5/);
    semLixo(texto);
  });

  it('segundo vínculo: filtros, grupos com total, resumo por esfera e forma; sem CPF', async () => {
    const { texto, nomeArquivo } = await ler(relatorioSegundoVinculo, vinculos(5));
    expect(nomeArquivo).toBe('Relatorio_Segundo_Vinculo_19-10-2026.pdf');
    for (const t of ['RELATÓRIO DE SERVIDORES COM SEGUNDO VÍNCULO', 'Cessão Formal', 'Por esfera', 'MUNICIPAL (3 servidores)',
      'FEDERAL (UNIÃO) (2 servidores)', 'Total: 3 servidores', 'Órgão de origem', 'Secretaria de Origem', 'Por forma de vínculo',
      'Informal (sem ato formal)', 'Resumo']) {
      expect(texto).toContain(t);
    }
    expect(texto).not.toContain('123.456.789-01');
    semLixo(texto);
  });

  it('segundo vínculo sem agrupamento e vazio', async () => {
    const { texto } = await ler(relatorioSegundoVinculo, vinculos(0, null));
    expect(texto).toContain('Sem agrupamento');
    expect(texto).toContain('Nenhum registro encontrado.');
    semLixo(texto);
  });

  it('situação de portaria: duas seções, subtotais e resumo com percentuais', async () => {
    const { texto, nomeArquivo } = await ler(relatorioSituacaoPortaria, situacao(3, 1));
    expect(nomeArquivo).toBe('Relatorio_Situacao_Portaria_19-10-2026.pdf');
    for (const t of ['SITUAÇÃO DE PORTARIA', 'Servidores com portaria de nomeação (3)', 'Servidores sem portaria de nomeação (1)',
      'CPF', 'Portaria', '123.456.789-01', '101/2026', 'Subtotal: 3 servidor(es)', 'Subtotal: 1 servidor(es)',
      '3 (75,0% regularizados)', '1 (25,0% pendentes)']) {
      expect(texto).toContain(t);
    }
    semLixo(texto);
  });

  it('situação de portaria vazia mostra as mensagens do relatório antigo', async () => {
    const { texto } = await ler(relatorioSituacaoPortaria, situacao(0, 0));
    expect(texto).toContain('Nenhum servidor com portaria de nomeação registrada.');
    expect(texto).toContain('Todos os servidores possuem portaria de nomeação registrada.');
    expect(texto).toContain('0 (0,0% regularizados)');
    semLixo(texto);
  });

  it('agrupado por portaria: uma seção por portaria, sem portaria e resumo', async () => {
    const { texto, nomeArquivo } = await ler(relatorioAgrupadoPortaria, agrupado(3, 1));
    expect(nomeArquivo).toBe('Relatorio_Servidores_Por_Portaria_19-10-2026.pdf');
    for (const t of ['RELATÓRIO DE SERVIDORES POR PORTARIA', 'Portaria nº 101/2026 (3 servidores)', 'Portaria nº 202/2026 (2 servidores)',
      'Nome do servidor', 'Subtotal: 3 servidor(es)', 'Servidores sem portaria de nomeação (1)', 'Portaria 101/2026',
      'Total com portaria', '5 (83,3% regularizados)', '1 (16,7% pendentes)']) {
      expect(texto).toContain(t);
    }
    semLixo(texto);
  });

  it('agrupado por portaria vazio não imprime lixo', async () => {
    const { texto } = await ler(relatorioAgrupadoPortaria, { grupos: [], servidoresSemPortaria: [], dataGeracao: '19/10/2026' });
    expect(texto).not.toContain('Servidores sem portaria');
    semLixo(texto);
  });

  it('contatos estratégicos: colunas, telefone formatado, órgão só com vínculo externo', async () => {
    const { texto, nomeArquivo } = await ler(relatorioContatosEstrategicos, contatos(4));
    expect(nomeArquivo).toBe('contatos-estrategicos-2026-10-19-1430.pdf');
    for (const t of ['RELATÓRIO DE CONTATOS ESTRATÉGICOS', 'Documento confidencial', 'Órgão de origem', 'Indicação',
      'Contato 1', '(95) 99123-4567', 'Órgão de Origem', 'Total: 4 registro(s)']) {
      expect(texto).toContain(t);
    }
    semLixo(texto);
  });

  it('contatos estratégicos vazio mostra a mensagem do relatório antigo', async () => {
    const { texto } = await ler(relatorioContatosEstrategicos, contatos(0));
    expect(texto).toContain('Nenhum servidor encontrado com indicação.');
    semLixo(texto);
  });

  it('muitas linhas atravessam páginas e repetem o cabeçalho da tabela', async () => {
    const casos = [
      await ler(relatorioServidoresDiretoria, diretoria(120)),
      await ler(relatorioSegundoVinculo, vinculos(150)),
      await ler(relatorioSituacaoPortaria, situacao(120, 60)),
      await ler(relatorioAgrupadoPortaria, agrupado(120, 40)),
      await ler(relatorioContatosEstrategicos, contatos(150)),
    ];
    for (const { paginas } of casos) {
      expect(paginas.length).toBeGreaterThan(2);
      for (const p of paginas) expect(p.texto).toMatch(/Página \d+ de \d+/);
    }
    // Cabeçalho da tabela repetido na 2ª página.
    expect(casos[4].paginas[1].texto).toContain('Indicação');
    expect(casos[2].paginas[1].texto).toContain('CPF');
  });
});

// Gera os PDFs em DOCUMENTOS_AMOSTRAS=<pasta> para inspeção visual (pdftoppm). Sem a variável, não faz nada.
const saida = process.env.DOCUMENTOS_AMOSTRAS;

describe.skipIf(!saida)('amostras do grupo C para inspeção visual', () => {
  it('grava um PDF por relatório', () => {
    mkdirSync(saida!, { recursive: true });
    const gravar = <D,>(nome: string, modelo: DocumentoModelo<D>, dados: D) =>
      writeFileSync(join(saida!, nome), Buffer.from(renderizarDocumento(modelo, dados, marcaTeste, emissaoTeste).doc.output('arraybuffer')));
    gravar('rh-servidores-diretoria.pdf', relatorioServidoresDiretoria, diretoria(8));
    gravar('rh-segundo-vinculo.pdf', relatorioSegundoVinculo, vinculos(9));
    gravar('rh-situacao-portaria.pdf', relatorioSituacaoPortaria, situacao(6, 3));
    gravar('rh-agrupado-portaria.pdf', relatorioAgrupadoPortaria, agrupado(5, 2));
    gravar('rh-contatos-estrategicos.pdf', relatorioContatosEstrategicos, contatos(7));
  });
});

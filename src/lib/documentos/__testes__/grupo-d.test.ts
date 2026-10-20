import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderizarDocumento } from '../core/renderizar';
import { relatorioDinamico, relatorioDinamicoPaisagem, type DadosRelatorioDinamico } from '../modelos/relatorios/colunasDinamicas';
import { estruturaOrganizacional, type DadosEstruturaOrganizacional } from '../modelos/relatorios/estruturaOrganizacional';
import { folhaSimplificada, type DadosFolhaSimplificada } from '../modelos/relatorios/folhaSimplificada';
import { pendenciasPreCadastros, type DadosPendenciasPreCadastros } from '../modelos/rh/pendenciasPreCadastros';
import { pendenciasServidores, type DadosPendenciasServidores } from '../modelos/rh/pendenciasServidores';
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
};

// ---------------- fixtures ----------------
const preCadastros = (n: number): DadosPendenciasPreCadastros => ({
  filtro: 'Qualquer pendência',
  resumo: { total: n + 2, esocial: n, bancaria: 1, pessoal: 1, completos: 2 },
  esocial: Array.from({ length: n }, (_, i) => ({
    nome: `Candidato ${i + 1}`,
    cpf: '000.000.000-00',
    status: 'Enviado',
    camposPendentes: 'PIS/PASEP, Data de nascimento, Raça/cor',
  })),
  bancaria: [{ nome: 'Fulano Banco', cpf: '111.111.111-11', status: 'Aprovado', camposPendentes: 'Agência, Conta' }],
  pessoal: [{ nome: 'Ciclano Pessoal', cpf: '222.222.222-22', status: 'Enviado', camposPendentes: 'Endereço' }],
  completos: [{ nome: 'Beltrana Completa', cpf: '333.333.333-33' }, { nome: 'Outra Completa', cpf: '' }],
});
const vazioPreCadastros: DadosPendenciasPreCadastros = {
  resumo: { total: 0, esocial: 0, bancaria: 0, pessoal: 0, completos: 0 },
  esocial: [], bancaria: [], pessoal: [], completos: [],
};

const servidores = (n: number): DadosPendenciasServidores => ({
  filtro: 'Elegíveis para folha',
  resumo: { total: n + 1, elegibilidade: 1, esocial: n, bancaria: 0, pessoal: 0, completos: 1, elegiveis: 7 },
  elegibilidade: [{ nome: 'Servidor Inelegível', matricula: null, cpf: '444.444.444-44', camposPendentes: 'Cargo, Lotação' }],
  esocial: Array.from({ length: n }, (_, i) => ({ nome: `Servidor ${i + 1}`, matricula: `M${i}`, cpf: '000.000.000-00', camposPendentes: 'CBO' })),
  bancaria: [], pessoal: [],
  completos: [{ nome: 'Servidora Completa', matricula: '123', cpf: '555.555.555-55', cargo: null }],
});
const vazioServidores: DadosPendenciasServidores = {
  resumo: { total: 0, elegibilidade: 0, esocial: 0, bancaria: 0, pessoal: 0, completos: 0, elegiveis: 0 },
  elegibilidade: [], esocial: [], bancaria: [], pessoal: [], completos: [],
};

const folha = (n: number): DadosFolhaSimplificada => ({
  titulo: 'Folha de setembro',
  mesReferencia: '09/2026',
  linhas: Array.from({ length: n }, (_, i) => ({
    nome: `Servidor ${i + 1}`, cpf: '000.000.000-00', cargo: 'Assessor', codigo: i % 2 ? 'CDS-3' : null, valor: 1000,
  })),
});

const dinamico = (n: number, agrupado: boolean): DadosRelatorioDinamico => {
  const linha = (i: number) => ({ nome: `Pessoa ${i + 1}`, cargo: i % 2 ? 'Analista' : 'Técnico', admissao: '01/02/2020', email: '' });
  return {
    titulo: 'Relatório de servidores', subtitulo: 'Lotação geral', tipoRotulo: 'Servidores',
    colunas: [
      { chave: 'nome', titulo: 'NOME', peso: 2.5 },
      { chave: 'cargo', titulo: 'CARGO', peso: 1.5 },
      { chave: 'admissao', titulo: 'ADMISSÃO', peso: 1 },
      { chave: 'email', titulo: 'E-MAIL', peso: 2.2 },
    ],
    totalRegistros: n,
    resumo: agrupado ? [{ rotulo: 'Diretoria A', valor: n - 1 }, { rotulo: 'Diretoria B', valor: 1 }] : undefined,
    grupos: agrupado
      ? [
          {
            rotulo: 'Diretoria A', contagem: n - 1, linhas: [],
            subgrupos: [{ rotulo: 'Efetivo', contagem: n - 1, subgrupos: [], linhas: Array.from({ length: n - 1 }, (_, i) => linha(i)) }],
          },
          { rotulo: 'Diretoria B', contagem: 1, linhas: [], subgrupos: [{ rotulo: 'Comissionado', contagem: 1, subgrupos: [], linhas: [linha(99)] }] },
        ]
      : undefined,
    linhas: agrupado ? undefined : Array.from({ length: n }, (_, i) => linha(i)),
    mostrarTotais: true,
    nomeArquivo: 'servidores.pdf',
  };
};

const estrutura = (n: number): DadosEstruturaOrganizacional => ({
  orgaoSigla: 'ORG',
  unidades: [
    ...Array.from({ length: n }, (_, i) => ({ nome: `Unidade ${String(i + 1).padStart(3, '0')}`, sigla: `U${i}`, siglaSuperior: 'PRES', email: null })),
    { nome: 'Presidência', sigla: 'PRES', siglaSuperior: null, email: 'pres@exemplo.gov' },
  ],
});

// ---------------- testes ----------------
describe('grupo D no motor único', () => {
  it('todos os modelos estão no registro com o tipo certo', () => {
    for (const m of [pendenciasPreCadastros, pendenciasServidores, folhaSimplificada, relatorioDinamico, relatorioDinamicoPaisagem, estruturaOrganizacional]) {
      expect(REGISTRO[m.tipo as keyof typeof REGISTRO]).toBe(m);
      expect(m.familia).toBe('relatorio');
    }
  });

  it('pendências de pré-cadastros: título, resumo, seções, colunas e completos', async () => {
    const t = textoTodo(await ler(pendenciasPreCadastros, preCadastros(3)));
    for (const trecho of ['RELATÓRIO DE PENDÊNCIAS DE PRÉ-CADASTROS', 'Filtro aplicado: Qualquer pendência', 'Resumo estatístico',
      'Pendências eSocial (3)', 'Pendências bancárias (1)', 'Pendências de dados pessoais (1)', 'Cadastros completos (2)',
      'Campos pendentes', 'Candidato 3', 'Agência, Conta', 'Beltrana Completa', 'Completo']) expect(t).toContain(trecho);
    semVazamento(t);
  });

  it('pendências de pré-cadastros vazio: mensagem e sem undefined', async () => {
    const t = textoTodo(await ler(pendenciasPreCadastros, vazioPreCadastros));
    expect(t).toContain('Nenhum pré-cadastro encontrado');
    expect(t).not.toContain('Filtro aplicado');
    semVazamento(t);
  });

  it('pendências de servidores: resumo com elegíveis, seções e cargo vazio como traço', async () => {
    const t = textoTodo(await ler(pendenciasServidores, servidores(2)));
    for (const trecho of ['RELATÓRIO DE PENDÊNCIAS DE SERVIDORES', 'Elegíveis para folha', 'Servidores com pendências de elegibilidade (1)',
      'Servidores com pendências eSocial (2)', 'Servidores com cadastro completo (1)', 'Matrícula', 'Cargo, Lotação', 'Servidora Completa', '—'])
      expect(t).toContain(trecho);
    expect(t).not.toContain('pendências bancárias');
    semVazamento(t);
    semVazamento(textoTodo(await ler(pendenciasServidores, vazioServidores)));
  });

  it('pendências: muitas linhas atravessam páginas repetindo o cabeçalho da tabela', async () => {
    const p = await ler(pendenciasServidores, servidores(120));
    expect(p.length).toBeGreaterThan(2);
    expect(p[p.length - 1].texto).toContain('Servidora Completa');
    expect(p[1].texto).toContain('Campos pendentes');
  });

  it('folha simplificada: paisagem, colunas, numeração, valores e total geral', async () => {
    const p = await ler(folhaSimplificada, folha(3));
    expect(p[0].largura).toBeGreaterThan(p[0].altura);
    const t = textoTodo(p);
    for (const trecho of ['FOLHA DE SETEMBRO', 'Referência: 09/2026', 'Total de registros: 3', 'Nome completo', 'Código', 'Valores',
      'Servidor 3', 'CDS-3', 'TOTAL GERAL', '3.000,00']) expect(t).toContain(trecho);
    semVazamento(t);
  });

  it('folha simplificada vazia: título padrão, sem total e sem undefined', async () => {
    const t = textoTodo(await ler(folhaSimplificada, { linhas: [] }));
    expect(t).toContain('RELATÓRIO SIMPLIFICADO DE FOLHA');
    expect(t).toContain('Nenhum registro encontrado');
    expect(t).not.toContain('TOTAL GERAL');
    semVazamento(t);
  });

  it('folha simplificada com muitas linhas: várias páginas e total na última', async () => {
    const p = await ler(folhaSimplificada, folha(150));
    expect(p.length).toBeGreaterThan(3);
    expect(p[p.length - 1].texto).toContain('150.000,00');
  });

  it('colunas dinâmicas agrupadas: resumo, hierarquia no título da seção, subtotal e total geral', async () => {
    const t = textoTodo(await ler(relatorioDinamico, dinamico(5, true)));
    for (const trecho of ['RELATÓRIO DE SERVIDORES', 'Lotação geral', 'Tipo: Servidores', 'Resumo', 'Diretoria A (4)', 'Diretoria A / Efetivo (4)',
      'Diretoria B / Comissionado (1)', 'ADMISSÃO', 'Subtotal: 4 registro(s)', 'TOTAL GERAL: 5 registro(s)', 'Pessoa 100']) expect(t).toContain(trecho);
    semVazamento(t);
  });

  it('colunas dinâmicas: retrato e paisagem conforme a tela; muitas linhas em várias páginas', async () => {
    const [r] = await ler(relatorioDinamico, dinamico(3, false));
    expect(r.largura).toBeLessThan(r.altura);
    const p = await ler(relatorioDinamicoPaisagem, dinamico(200, false));
    expect(p[0].largura).toBeGreaterThan(p[0].altura);
    expect(p.length).toBeGreaterThan(3);
    expect(textoTodo(p)).toContain('Pessoa 200');
  });

  it('colunas dinâmicas sem coluna e sem dado: mensagem, sem undefined', async () => {
    const semColuna = textoTodo(await ler(relatorioDinamico, { ...dinamico(0, false), colunas: [], mostrarTotais: false }));
    expect(semColuna).toContain('Nenhuma coluna selecionada');
    const vazio = textoTodo(await ler(relatorioDinamico, { ...dinamico(0, false), subtitulo: undefined }));
    expect(vazio).toContain('Nenhum registro encontrado');
    semVazamento(semColuna);
    semVazamento(vazio);
  });

  it('estrutura organizacional: paisagem, colunas, ordenada por nome, e-mail vazio como traço', async () => {
    const p = await ler(estruturaOrganizacional, estrutura(3));
    expect(p[0].largura).toBeGreaterThan(p[0].altura);
    const t = textoTodo(p);
    for (const trecho of ['RELATÓRIO DE ESTRUTURA ORGANIZACIONAL', 'Total de registros: 4', 'Órgão (sigla)', 'Unidade vinculada',
      'pres@exemplo.gov', 'ORG', 'PRES', '—']) expect(t).toContain(trecho);
    expect(t.indexOf('Presidência')).toBeLessThan(t.indexOf('Unidade 001'));
    semVazamento(t);
    semVazamento(textoTodo(await ler(estruturaOrganizacional, { orgaoSigla: 'ORG', unidades: [] })));
  });

  it('estrutura organizacional com muitas unidades: várias páginas', async () => {
    const p = await ler(estruturaOrganizacional, estrutura(120));
    expect(p.length).toBeGreaterThan(2);
    expect(p[p.length - 1].texto).toContain('Unidade 120');
  });
});

// PDFs para inspeção visual em DOCUMENTOS_AMOSTRAS=<pasta>. Sem a variável, não faz nada.
const saida = process.env.DOCUMENTOS_AMOSTRAS;
describe.skipIf(!saida)('amostras do grupo D', () => {
  it('grava uma amostra por relatório', () => {
    mkdirSync(saida!, { recursive: true });
    const gravar = <D,>(nome: string, modelo: DocumentoModelo<D>, dados: D) =>
      writeFileSync(join(saida!, nome), Buffer.from(renderizarDocumento(modelo, dados, marcaTeste, emissaoTeste).doc.output('arraybuffer')));
    gravar('d-pendencias-pre-cadastros.pdf', pendenciasPreCadastros, preCadastros(40));
    gravar('d-pendencias-servidores.pdf', pendenciasServidores, servidores(40));
    gravar('d-folha-simplificada.pdf', folhaSimplificada, folha(40));
    gravar('d-colunas-dinamicas.pdf', relatorioDinamico, dinamico(30, true));
    gravar('d-colunas-dinamicas-paisagem.pdf', relatorioDinamicoPaisagem, dinamico(30, false));
    gravar('d-estrutura-organizacional.pdf', estruturaOrganizacional, estrutura(40));
  });
});

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { AgregadoUnidade, BlocoRubricas, FolhaResumo } from '@/lib/relatoriosFolhaRegras';
import type {
  FiltrosImpressao,
  LinhaFeriasRelatorio,
  LinhaLicencaRelatorio,
  LinhaViagemRelatorio,
  ServidorRelatorio,
} from '@/lib/relatoriosRHRegras';
import { renderizarDocumento } from '../core/renderizar';
import { moeda } from '../modelos/rh/comum';
import { relatorioFerias } from '../modelos/rh/ferias';
import { folhaPorRubrica, folhaPorUnidade, resumoFolhasAno } from '../modelos/rh/folha';
import { frequenciaGeral, frequenciaIndividual, type FrequenciaServidor } from '../modelos/rh/frequencia';
import { relatorioLicencas } from '../modelos/rh/licencas';
import { relatorioViagens } from '../modelos/rh/viagens';
import { REGISTRO } from '../registro';
import type { DocumentoModelo } from '../tipos';
import { emissaoTeste, marcaTeste } from './fixtures';
import { lerPdf } from './lerPdf';

// ============================================
// FIXTURES (dados fictícios)
// ============================================

const servidor = (i: number, unidade: number | null = (i % 2) + 1): ServidorRelatorio => ({
  id: `s${i}`,
  nome_completo: `Servidor ${String(i).padStart(3, '0')}`,
  matricula: `M${1000 + i}`,
  unidade: unidade === null ? null : { id: `u${unidade}`, nome: `Unidade ${unidade}`, sigla: `UN${unidade}` },
  cargo: { nome: 'Analista' },
});

const filtros: FiltrosImpressao = { inicio: '2026-09-01', fim: '2026-09-30', unidadeNome: undefined, statusLabel: 'Aprovada' };

const ferias = (i: number): LinhaFeriasRelatorio => ({
  id: `f${i}`,
  servidor_id: `s${i}`,
  periodo_aquisitivo_inicio: '2025-01-01',
  periodo_aquisitivo_fim: '2025-12-31',
  data_inicio: '2026-09-01',
  data_fim: '2026-09-10',
  dias_gozados: 10,
  parcela: 1,
  total_parcelas: 3,
  portaria_numero: i % 2 ? `P-${i}/2026` : null,
  status: 'aprovada',
  servidor: servidor(i),
});

const licenca = (i: number): LinhaLicencaRelatorio => ({
  id: `l${i}`,
  servidor_id: `s${i}`,
  tipo_afastamento: 'licenca',
  tipo_licenca: i % 2 ? 'medica' : 'casamento',
  data_inicio: '2026-09-05',
  data_fim: i === 1 ? null : '2026-09-12',
  dias_afastamento: i === 1 ? null : 8,
  status: 'ativo',
  portaria_numero: null,
  orgao_destino: null,
  servidor: servidor(i),
});

const viagem = (i: number, semOnus = false): LinhaViagemRelatorio => ({
  id: `v${i}`,
  servidor_id: `s${i}`,
  destino_cidade: 'Cidade Exemplo',
  destino_uf: 'EX',
  destino_pais: null,
  data_saida: '2026-09-02',
  data_retorno: '2026-09-04',
  tipo_onus: semOnus ? 'sem_onus' : 'com_onus',
  quantidade_diarias: 2.5,
  valor_diaria: 300,
  valor_total: null,
  status: 'aprovada',
  relatorio_apresentado: i % 2 === 0,
  servidor: servidor(i),
});

const folha = (mes: number, status = 'fechada'): FolhaResumo => ({
  id: `fo${mes}`,
  competencia_ano: 2026,
  competencia_mes: mes,
  tipo_folha: 'mensal',
  status,
  quantidade_servidores: 10,
  total_bruto: 10000,
  total_descontos: 2000,
  total_liquido: 8000,
  total_inss_servidor: 1100,
  total_inss_patronal: 2000,
  total_irrf: 500,
  total_encargos_patronais: 2200,
});

const agregados: AgregadoUnidade[] = [
  { unidade: 'UN1 - Unidade 1', servidores: 3, proventos: 9000, descontos: 1500, liquido: 7500, inss: 900, irrf: 300 },
  { unidade: 'UN2 - Unidade 2', servidores: 2, proventos: 6000.5, descontos: 1000, liquido: 5000.5, inss: 600, irrf: 200 },
];

const blocosRubrica: BlocoRubricas[] = [
  { tipo: 'provento', rotulo: 'Proventos', subtotal: 15000, itens: [{ tipo: 'provento', descricao: 'Vencimento base', quantidade: 5, valor: 15000 }] },
  { tipo: 'desconto', rotulo: 'Descontos', subtotal: 2500, itens: [{ tipo: 'desconto', descricao: 'Previdência', quantidade: 5, valor: 2500 }] },
];

const freq = (i: number, unidade?: string): FrequenciaServidor => ({
  servidor_id: `s${i}`,
  servidor_nome: `Servidor ${String(i).padStart(3, '0')}`,
  servidor_matricula: `M${1000 + i}`,
  servidor_cargo: 'Analista',
  servidor_unidade: unidade,
  dias_uteis: 22,
  dias_trabalhados: 20,
  faltas: i % 3 === 0 ? 2 : 0,
  atestados: 0,
  ferias: 0,
  licencas: 0,
  abonos: 0,
  percentual_presenca: i % 3 === 0 ? 90 : 100,
});

const dadosIndividual = {
  competencia: '09/2026',
  servidor: { nome: 'Fulana de Teste', cpf: '00000000000', matricula: 'M1', cargo: undefined, unidade: 'Unidade 1' },
  resumo: freq(3, 'Unidade 1'),
  registros: Array.from({ length: 30 }, (_, i) => ({
    data: `2026-09-${String(i + 1).padStart(2, '0')}`,
    dia_semana: 'Seg',
    tipo: i === 4 ? 'falta' : 'normal',
    entrada1: '08:00',
    saida1: '12:00',
    entrada2: i === 4 ? undefined : '14:00',
    saida2: i === 4 ? undefined : '18:00',
  })),
  dataGeracao: '19/10/2026',
};

// ============================================
// AUXILIARES
// ============================================

/** pdf.js devolve o espaço não separável do Intl como está; normaliza para comparar. */
const norm = (s: string) => s.replace(/\u00a0/g, ' ');
const gerar = <D,>(modelo: DocumentoModelo<D>, dados: D) => renderizarDocumento(modelo, dados, marcaTeste, emissaoTeste);
const ler = async <D,>(modelo: DocumentoModelo<D>, dados: D) => {
  const paginas = await lerPdf(gerar(modelo, dados).doc);
  return { paginas, texto: norm(paginas.map((p) => p.texto).join(' ')) };
};

// ============================================
// TESTES
// ============================================

describe('RH grupo B — registro', () => {
  it('os oito relatórios estão no REGISTRO com o tipo do modelo', () => {
    const modelos = [relatorioFerias, relatorioLicencas, relatorioViagens, resumoFolhasAno, folhaPorUnidade, folhaPorRubrica, frequenciaGeral, frequenciaIndividual];
    for (const m of modelos) expect((REGISTRO as Record<string, unknown>)[m.tipo]).toBe(m);
  });
});

describe('rh-ferias', () => {
  it('título, filtros, colunas, grupos por unidade com subtotal e total geral', async () => {
    const { texto } = await ler(relatorioFerias, { linhas: [ferias(1), ferias(2), ferias(3)], filtros });
    expect(texto).toContain('RELATÓRIO DE FÉRIAS');
    expect(texto).toContain('01/09/2026 a 30/09/2026');
    expect(texto).toContain('Aprovada');
    for (const c of ['Servidor', 'Matrícula', 'Per. aquisitivo', 'Início', 'Fim', 'Dias', 'Parc.', 'Status', 'Portaria']) expect(texto).toContain(c);
    expect(texto).toContain('UN2 - Unidade 2 (2 registros)');
    expect(texto).toContain('UN1 - Unidade 1 (1 registro)');
    expect(texto).toContain('Subtotal da unidade');
    expect(texto).toContain('P-1/2026');
    expect(texto).toContain('1/3');
    expect(texto).toContain('Total geral');
    expect(texto).toMatch(/Dias de férias\s+30/);
  });

  it('datas e cabeçalhos curtos cabem inteiros na coluna (retrato)', async () => {
    const { paginas } = await ler(relatorioFerias, { linhas: [ferias(1)], filtros });
    const itens = paginas[0].itens.map((i) => i.str);
    for (const s of ['01/09/2026', '10/09/2026', 'Matrícula', 'Dias', 'Parc.', 'Portaria']) expect(itens).toContain(s);
  });

  it('vazio: "Nenhum registro encontrado." e nada de undefined/null', async () => {
    const { texto } = await ler(relatorioFerias, { linhas: [], filtros: { inicio: '2026-09-01', fim: '2026-09-30' } });
    expect(texto).toContain('Nenhum registro encontrado.');
    expect(texto).toContain('Todas');
    expect(texto).not.toMatch(/undefined|null|NaN/);
  });

  it('muitas linhas atravessam páginas sem perder registro', async () => {
    const linhas = Array.from({ length: 120 }, (_, i) => ferias(i + 1));
    const { paginas } = await ler(relatorioFerias, { linhas, filtros });
    expect(paginas.length).toBeGreaterThanOrEqual(3);
    const nomes = paginas.flatMap((p) => p.itens.map((i) => i.str)).filter((s) => /^Servidor \d{3}$/.test(s));
    expect(nomes).toHaveLength(120);
  });
});

describe('rh-licencas', () => {
  it('agrupa por tipo, conta licença em aberto até o fim do período, sem dados de saúde', async () => {
    const { texto } = await ler(relatorioLicencas, { linhas: [licenca(1), licenca(2), licenca(3)], filtros });
    expect(texto).toContain('RELATÓRIO DE LICENÇAS E AFASTAMENTOS');
    expect(texto).toContain('Licença Médica (2 registros)');
    expect(texto).toContain('Licença Casamento (1 registro)');
    expect(texto).toContain('Em aberto');
    expect(texto).toContain('Subtotal do tipo');
    // 26 dias (05/09 a 30/09, em aberto) + 8 + 8
    expect(texto).toMatch(/Dias de afastamento\s+42/);
    expect(texto).not.toMatch(/CID|CRM|médico/i);
  });

  it('vazio sem undefined/null', async () => {
    const { texto } = await ler(relatorioLicencas, { linhas: [], filtros });
    expect(texto).toContain('Nenhum registro encontrado.');
    expect(texto).not.toMatch(/undefined|null|NaN/);
  });
});

describe('rh-viagens', () => {
  it('paisagem, subtotal e total de diárias e valor; sem ônus não soma', async () => {
    const { paginas, texto } = await ler(relatorioViagens, { linhas: [viagem(1), viagem(2), viagem(3, true)], filtros: { ...filtros, onusLabel: 'Todos' } });
    expect(paginas[0].largura).toBeGreaterThan(paginas[0].altura);
    expect(texto).toContain('RELATÓRIO DE VIAGENS E DIÁRIAS');
    expect(texto).toContain('Cidade Exemplo/EX');
    expect(texto).toContain('UN2 - Unidade 2 (2 viagens)');
    expect(texto).toContain('UN1 - Unidade 1 (1 viagem)');
    expect(texto).toContain(norm(moeda(750)));
    expect(texto).toContain(norm(moeda(1500)));
    expect(texto).toMatch(/Diárias\s+5\b/);
    expect(texto).toContain('Sem Ônus');
  });

  it('vazio sem undefined/null', async () => {
    const { texto } = await ler(relatorioViagens, { linhas: [], filtros });
    expect(texto).toContain('Nenhum registro encontrado.');
    expect(texto).toContain(norm(moeda(0)));
    expect(texto).not.toMatch(/undefined|null|NaN/);
  });
});

describe('rh-folha-*', () => {
  it('resumo do ano: uma linha por folha, total só das processadas', async () => {
    const { paginas, texto } = await ler(resumoFolhasAno, { folhas: [folha(1), folha(2), folha(3, 'previa')], ano: 2026 });
    expect(paginas[0].largura).toBeGreaterThan(paginas[0].altura);
    expect(texto).toContain('RESUMO DAS FOLHAS DE PAGAMENTO');
    expect(texto).toContain('Exercício 2026');
    for (const c of ['Compet.', 'Bruto', 'Descontos', 'Líquido', 'INSS serv.', 'INSS patr.', 'IRRF', 'Encargos']) expect(texto).toContain(c);
    expect(texto).toContain('01/2026');
    expect(texto).toContain('Total do ano');
    expect(texto).toContain('2 folhas processadas');
    expect(texto).toContain(norm(moeda(20000)));
  });

  it('resumo do ano vazio e com muitas folhas', async () => {
    const vazio = await ler(resumoFolhasAno, { folhas: [], ano: 2026 });
    expect(vazio.texto).toContain('Nenhum registro encontrado.');
    expect(vazio.texto).not.toMatch(/undefined|null|NaN/);
    const muitas = await ler(resumoFolhasAno, { folhas: Array.from({ length: 80 }, (_, i) => folha((i % 12) + 1)), ano: 2026 });
    expect(muitas.paginas.length).toBeGreaterThanOrEqual(2);
    for (const p of muitas.paginas) expect(p.texto).toContain('Compet.');
  });

  it('por unidade: linhas, total da folha', async () => {
    const { texto } = await ler(folhaPorUnidade, { agregados, folha: folha(9) });
    expect(texto).toContain('FOLHA DE PAGAMENTO POR UNIDADE');
    expect(texto).toContain('competência 09/2026');
    expect(texto).toContain('UN1 - Unidade 1');
    expect(texto).toContain('2 unidades');
    expect(texto).toContain('Total da folha');
    expect(texto).toContain(norm(moeda(12500.5)));
    const vazio = await ler(folhaPorUnidade, { agregados: [], folha: folha(9) });
    expect(vazio.texto).toContain('Nenhum registro encontrado.');
    expect(vazio.texto).not.toMatch(/undefined|null|NaN/);
  });

  it('por rubrica: blocos com subtotal e líquido', async () => {
    const { texto } = await ler(folhaPorRubrica, { blocos: blocosRubrica, folha: folha(9) });
    expect(texto).toContain('FOLHA DE PAGAMENTO POR RUBRICA');
    expect(texto).toContain('Proventos (1 rubrica)');
    expect(texto).toContain('Subtotal de proventos');
    expect(texto).toContain('Subtotal de descontos');
    expect(texto).toContain('Líquido (proventos - descontos)');
    expect(texto).toContain(norm(moeda(12500)));
    const vazio = await ler(folhaPorRubrica, { blocos: [], folha: folha(9) });
    expect(vazio.texto).toContain('Nenhum registro encontrado.');
    expect(vazio.texto).not.toMatch(/undefined|null|NaN/);
  });
});

describe('rh-frequencia-*', () => {
  it('geral sem agrupamento: colunas, valores e resumo', async () => {
    const servidores = [freq(1, 'Unidade B'), freq(3, 'Unidade A')];
    const { paginas, texto } = await ler(frequenciaGeral, { competencia: '09/2026', servidores, dataGeracao: '19/10/2026' });
    expect(paginas[0].largura).toBeGreaterThan(paginas[0].altura);
    expect(texto).toContain('RELATÓRIO DE FREQUÊNCIA MENSAL');
    expect(texto).toContain('Competência: 09/2026 | Todas as unidades');
    for (const c of ['Matrícula', 'Servidor', 'Cargo', 'Dias úteis', 'Trabalhados', 'Faltas', 'Atestados', 'Férias', 'Licenças', '% Presença']) expect(texto).toContain(c);
    expect(texto).toContain('90.0%');
    expect(texto).toMatch(/Total de faltas\s+2/);
    expect(texto).toContain('95.0%');
    expect(texto).not.toContain('Subtotal');
  });

  it('geral por unidade: blocos ordenados com subtotal', async () => {
    const servidores = [freq(1, 'Unidade B'), freq(3, 'Unidade A'), freq(2), freq(6, 'Unidade A')];
    const { texto } = await ler(frequenciaGeral, { competencia: '09/2026', servidores, dataGeracao: '19/10/2026', filtroUnidade: 'Todas', agruparPorUnidade: true });
    const a = texto.indexOf('Unidade A (2 servidores)');
    const b = texto.indexOf('Unidade B (1 servidor)');
    const sem = texto.indexOf('Sem unidade (1 servidor)');
    // Ordem alfabética da chave, como no gerador antigo ("Sem unidade" antes de "Unidade …").
    expect(sem).toBeGreaterThan(-1);
    expect(a).toBeGreaterThan(sem);
    expect(b).toBeGreaterThan(a);
    expect(texto).toContain('Subtotal: 2 servidores');
    expect(texto).toContain('Média 90.0%');
  });

  it('geral vazio e com muitas linhas', async () => {
    const vazio = await ler(frequenciaGeral, { competencia: '09/2026', servidores: [], dataGeracao: '19/10/2026', agruparPorUnidade: true });
    expect(vazio.texto).toContain('Nenhum registro encontrado.');
    expect(vazio.texto).not.toMatch(/undefined|null|NaN/);
    const servidores = Array.from({ length: 150 }, (_, i) => freq(i + 1, `Unidade ${(i % 4) + 1}`));
    const muitas = await ler(frequenciaGeral, { competencia: '09/2026', servidores, dataGeracao: '19/10/2026', agruparPorUnidade: true });
    expect(muitas.paginas.length).toBeGreaterThanOrEqual(3);
    const nomes = muitas.paginas.flatMap((p) => p.itens.map((i) => i.str)).filter((s) => /^Servidor \d{3}$/.test(s));
    expect(nomes).toHaveLength(150);
  });

  it('individual: dados do servidor, resumo, registros e assinaturas; campo vazio vira traço', async () => {
    const { texto } = await ler(frequenciaIndividual, dadosIndividual);
    expect(texto).toContain('FOLHA DE FREQUÊNCIA');
    expect(texto).toContain('Fulana de Teste');
    expect(texto).toContain('000.000.000-00');
    expect(texto).toContain('05/09/2026');
    expect(texto).toContain('Falta');
    expect(texto).toContain('Chefia imediata');
    expect(texto).toContain('90%');
    expect(texto).toContain('—');
    expect(texto).not.toMatch(/undefined|null|NaN/);
    expect(gerar(frequenciaIndividual, dadosIndividual).nomeArquivo).toBe('Frequencia_Fulana_de_Teste_09-2026.pdf');
  });
});

// Gera os PDFs em DOCUMENTOS_AMOSTRAS=<pasta> para inspeção visual (pdftoppm). Sem a variável, não faz nada.
const saida = process.env.DOCUMENTOS_AMOSTRAS;

describe.skipIf(!saida)('amostras do RH grupo B para inspeção visual', () => {
  it('grava um PDF por relatório', () => {
    mkdirSync(saida!, { recursive: true });
    const gravar = <D,>(nome: string, modelo: DocumentoModelo<D>, dados: D) =>
      writeFileSync(join(saida!, nome), Buffer.from(gerar(modelo, dados).doc.output('arraybuffer')));
    gravar('rh-ferias.pdf', relatorioFerias, { linhas: Array.from({ length: 40 }, (_, i) => ferias(i + 1)), filtros });
    gravar('rh-licencas.pdf', relatorioLicencas, { linhas: Array.from({ length: 12 }, (_, i) => licenca(i + 1)), filtros });
    gravar('rh-viagens.pdf', relatorioViagens, { linhas: [viagem(1), viagem(2), viagem(3, true), viagem(4)], filtros: { ...filtros, onusLabel: 'Com Ônus' } });
    gravar('rh-folha-resumo-ano.pdf', resumoFolhasAno, { folhas: [...Array.from({ length: 11 }, (_, i) => folha(i + 1)), folha(12, 'previa')], ano: 2026 });
    gravar('rh-folha-por-unidade.pdf', folhaPorUnidade, { agregados, folha: folha(9) });
    gravar('rh-folha-por-rubrica.pdf', folhaPorRubrica, { blocos: blocosRubrica, folha: folha(9) });
    gravar('rh-frequencia-geral.pdf', frequenciaGeral, {
      competencia: '09/2026',
      servidores: Array.from({ length: 30 }, (_, i) => freq(i + 1, i % 5 === 0 ? undefined : `Unidade ${(i % 3) + 1}`)),
      dataGeracao: '19/10/2026',
      agruparPorUnidade: true,
    });
    gravar('rh-frequencia-individual.pdf', frequenciaIndividual, dadosIndividual);
    gravar('rh-ferias-vazio.pdf', relatorioFerias, { linhas: [], filtros });
  });
});

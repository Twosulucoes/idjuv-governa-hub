/**
 * Relatórios gerenciais de folha de pagamento em PDF: resumo do ano (uma linha por folha,
 * paisagem), folha por unidade e folha por rubrica. Reaproveita o template institucional e os
 * helpers de tabela de `pdfRelatoriosAfastamentos.ts`; identidade via `getTenantSnapshot()`
 * (no `finalizar`). Regras e rótulos em `relatoriosFolhaRegras`.
 *
 * LGPD: só agregados — nenhum nome, CPF, matrícula ou dado bancário chega a estes geradores.
 */
import jsPDF from 'jspdf';
import {
  loadLogos,
  generateInstitutionalHeader,
  CORES,
  PAGINA,
  getPageDimensions,
  setColor,
  formatCurrency,
} from './pdfTemplate';
import {
  addCabecalhoTabela,
  addLinhaTabela,
  addLinhaTotal,
  addTituloGrupo,
  finalizar,
  quebrarComCabecalho,
  type Coluna,
} from './pdfRelatoriosAfastamentos';
import {
  contarRubricas,
  descreverFolha,
  rotuloCompetencia,
  rotuloStatusFolha,
  rotuloTipoFolha,
  totalizarFolhas,
  totalizarUnidades,
  type AgregadoUnidade,
  type BlocoRubricas,
  type FolhaResumo,
} from './relatoriosFolhaRegras';

/** Linha abaixo do cabeçalho: filtro aplicado à esquerda, contagem à direita. */
const addLinhaFiltro = (doc: jsPDF, filtro: string, contagem: string, y: number): number => {
  const { width, contentWidth } = getPageDimensions(doc);
  setColor(doc, CORES.cinzaMedio);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const linhas = doc.splitTextToSize(filtro, contentWidth - 40) as string[];
  doc.text(linhas, PAGINA.margemEsquerda, y);
  doc.text(contagem, width - PAGINA.margemDireita, y, { align: 'right' });
  return y + 4 * Math.max(linhas.length - 1, 0) + 8;
};

const plural = (n: number, singular: string, pluralForm: string) => `${n} ${n === 1 ? singular : pluralForm}`;

/** Folha identificada por competência e tipo, para o subtítulo. */
const subtituloFolha = (folha: Pick<FolhaResumo, 'competencia_ano' | 'competencia_mes' | 'tipo_folha'>) =>
  `Folha ${rotuloTipoFolha(folha.tipo_folha)} - competência ${rotuloCompetencia(folha.competencia_ano, folha.competencia_mes)}`;

// ============================================
// RESUMO DO ANO — paisagem, uma linha por folha, total do ano
// ============================================

// Larguras somam 257 mm (paisagem: 297 − margens de 20 mm).
const COLUNAS_RESUMO: Coluna[] = [
  { header: 'Compet.', width: 20 },
  { header: 'Tipo', width: 30 },
  { header: 'Status', width: 20 },
  { header: 'Servidores', width: 17, align: 'right' },
  { header: 'Bruto', width: 26, align: 'right' },
  { header: 'Descontos', width: 26, align: 'right' },
  { header: 'Líquido', width: 26, align: 'right' },
  { header: 'INSS serv.', width: 24, align: 'right' },
  { header: 'INSS patr.', width: 24, align: 'right' },
  { header: 'IRRF', width: 22, align: 'right' },
  { header: 'Encargos', width: 22, align: 'right' },
];

export const gerarResumoFolhasAno = async (folhas: FolhaResumo[], ano: number): Promise<void> => {
  const logos = await loadLogos();
  const doc = new jsPDF({ orientation: 'landscape' });

  let y = await generateInstitutionalHeader(doc, {
    titulo: 'RESUMO DAS FOLHAS DE PAGAMENTO',
    subtitulo: `Exercício ${ano} — uma linha por folha, com totais do ano`,
    fundoEscuro: true,
  }, logos);

  y = addLinhaFiltro(doc, `Ano: ${ano} | Todas as folhas do exercício, inclusive prévias (status indicado)`, plural(folhas.length, 'folha', 'folhas'), y);
  y = addCabecalhoTabela(doc, COLUNAS_RESUMO, y);

  folhas.forEach((f, idx) => {
    y = quebrarComCabecalho(doc, y, COLUNAS_RESUMO);
    y = addLinhaTabela(doc, [
      rotuloCompetencia(f.competencia_ano, f.competencia_mes),
      rotuloTipoFolha(f.tipo_folha),
      rotuloStatusFolha(f.status),
      String(Number(f.quantidade_servidores) || 0),
      formatCurrency(Number(f.total_bruto) || 0),
      formatCurrency(Number(f.total_descontos) || 0),
      formatCurrency(Number(f.total_liquido) || 0),
      formatCurrency(Number(f.total_inss_servidor) || 0),
      formatCurrency(Number(f.total_inss_patronal) || 0),
      formatCurrency(Number(f.total_irrf) || 0),
      formatCurrency(Number(f.total_encargos_patronais) || 0),
    ], COLUNAS_RESUMO, y, idx % 2 === 1);
  });

  const t = totalizarFolhas(folhas);
  y = quebrarComCabecalho(doc, y, COLUNAS_RESUMO);
  addLinhaTotal(doc, `Total do ano: ${plural(t.folhas, 'folha', 'folhas')}`, {
    3: String(t.servidores),
    4: formatCurrency(t.bruto),
    5: formatCurrency(t.descontos),
    6: formatCurrency(t.liquido),
    7: formatCurrency(t.inssServidor),
    8: formatCurrency(t.inssPatronal),
    9: formatCurrency(t.irrf),
    10: formatCurrency(t.encargos),
  }, COLUNAS_RESUMO, y, true);

  finalizar(doc, `folha-resumo-${ano}`);
};

// ============================================
// POR UNIDADE — retrato, uma linha por unidade, total da folha
// ============================================

// Larguras somam 170 mm (retrato: 210 − margens de 20 mm).
const COLUNAS_UNIDADE: Coluna[] = [
  { header: 'Unidade', width: 44 },
  { header: 'Servidores', width: 14, align: 'right' },
  { header: 'Proventos', width: 24, align: 'right' },
  { header: 'Descontos', width: 24, align: 'right' },
  { header: 'Líquido', width: 24, align: 'right' },
  { header: 'INSS', width: 20, align: 'right' },
  { header: 'IRRF', width: 20, align: 'right' },
];

export const gerarFolhaPorUnidade = async (agregados: AgregadoUnidade[], folha: FolhaResumo): Promise<void> => {
  const logos = await loadLogos();
  const doc = new jsPDF();

  let y = await generateInstitutionalHeader(doc, {
    titulo: 'FOLHA DE PAGAMENTO POR UNIDADE',
    subtitulo: subtituloFolha(folha),
    fundoEscuro: true,
  }, logos);

  y = addLinhaFiltro(doc, `Folha: ${descreverFolha(folha)}`, plural(agregados.length, 'unidade', 'unidades'), y);
  y = addCabecalhoTabela(doc, COLUNAS_UNIDADE, y);

  agregados.forEach((a, idx) => {
    y = quebrarComCabecalho(doc, y, COLUNAS_UNIDADE);
    y = addLinhaTabela(doc, [
      a.unidade,
      String(a.servidores),
      formatCurrency(a.proventos),
      formatCurrency(a.descontos),
      formatCurrency(a.liquido),
      formatCurrency(a.inss),
      formatCurrency(a.irrf),
    ], COLUNAS_UNIDADE, y, idx % 2 === 1);
  });

  const t = totalizarUnidades(agregados);
  y = quebrarComCabecalho(doc, y, COLUNAS_UNIDADE);
  addLinhaTotal(doc, 'Total da folha', {
    1: String(t.servidores),
    2: formatCurrency(t.proventos),
    3: formatCurrency(t.descontos),
    4: formatCurrency(t.liquido),
    5: formatCurrency(t.inss),
    6: formatCurrency(t.irrf),
  }, COLUNAS_UNIDADE, y, true);

  finalizar(doc, `folha-unidade-${rotuloCompetencia(folha.competencia_ano, folha.competencia_mes).replace('/', '-')}`);
};

// ============================================
// POR RUBRICA — retrato, blocos de proventos e descontos com subtotal
// ============================================

// Larguras somam 170 mm (retrato).
const COLUNAS_RUBRICA: Coluna[] = [
  { header: 'Rubrica', width: 100 },
  { header: 'Tipo', width: 24 },
  { header: 'Qtde. fichas', width: 18, align: 'right' },
  { header: 'Valor', width: 28, align: 'right' },
];

export const gerarFolhaPorRubrica = async (blocos: BlocoRubricas[], folha: FolhaResumo): Promise<void> => {
  const logos = await loadLogos();
  const doc = new jsPDF();

  let y = await generateInstitutionalHeader(doc, {
    titulo: 'FOLHA DE PAGAMENTO POR RUBRICA',
    subtitulo: subtituloFolha(folha),
    fundoEscuro: true,
  }, logos);

  y = addLinhaFiltro(doc, `Folha: ${descreverFolha(folha)}`, plural(contarRubricas(blocos), 'rubrica', 'rubricas'), y);
  y = addCabecalhoTabela(doc, COLUNAS_RUBRICA, y);

  blocos.forEach((bloco) => {
    y = quebrarComCabecalho(doc, y, COLUNAS_RUBRICA, 40);
    y = addTituloGrupo(doc, bloco.rotulo, plural(bloco.itens.length, 'rubrica', 'rubricas'), y);

    bloco.itens.forEach((a, idx) => {
      y = quebrarComCabecalho(doc, y, COLUNAS_RUBRICA);
      y = addLinhaTabela(doc, [
        a.descricao,
        bloco.rotulo,
        String(a.quantidade),
        formatCurrency(a.valor),
      ], COLUNAS_RUBRICA, y, idx % 2 === 1);
    });

    y = quebrarComCabecalho(doc, y, COLUNAS_RUBRICA);
    y = addLinhaTotal(doc, `Subtotal de ${bloco.rotulo.toLowerCase()}`, { 3: formatCurrency(bloco.subtotal) }, COLUNAS_RUBRICA, y);
  });

  const proventos = blocos.find((b) => b.tipo === 'provento')?.subtotal ?? 0;
  const descontos = blocos.find((b) => b.tipo === 'desconto')?.subtotal ?? 0;
  y = quebrarComCabecalho(doc, y, COLUNAS_RUBRICA);
  addLinhaTotal(doc, 'Líquido (proventos - descontos)', {
    3: formatCurrency(Math.round((proventos - descontos) * 100) / 100),
  }, COLUNAS_RUBRICA, y, true);

  finalizar(doc, `folha-rubrica-${rotuloCompetencia(folha.competencia_ano, folha.competencia_mes).replace('/', '-')}`);
};

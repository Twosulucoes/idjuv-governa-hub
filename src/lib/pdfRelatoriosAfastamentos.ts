/**
 * Relatórios gerenciais de RH em PDF: férias (por unidade), licenças/afastamentos (por tipo)
 * e viagens/diárias (por unidade, paisagem). Usa o template institucional (`pdfTemplate`);
 * identidade via `getTenantSnapshot()`. Regras e rótulos em `relatoriosRHRegras`.
 * Os helpers de tabela exportados aqui são reaproveitados por `pdfRelatoriosFolha.ts`.
 *
 * LGPD: imprime nome e matrícula; nenhum CPF ou dado de saúde chega a estes geradores.
 */
import jsPDF from 'jspdf';
import { getTenantSnapshot } from '@/core/tenant';
import {
  loadLogos,
  generateInstitutionalHeader,
  generateInstitutionalFooter,
  addPageNumbers,
  CORES,
  PAGINA,
  getPageDimensions,
  setColor,
  formatCurrency,
  checkPageBreak,
} from './pdfTemplate';
import {
  agruparPor,
  descreverDestino,
  descreverFiltros,
  descreverParcela,
  diasLicenca,
  formatarDataISO,
  matriculaServidor,
  nomeArquivoRelatorio,
  nomeServidor,
  nomeUnidade,
  rotuloOnus,
  rotuloStatusFerias,
  rotuloStatusLicenca,
  rotuloStatusViagem,
  rotuloTipoAfastamento,
  somar,
  valorTotalViagem,
  type FiltrosImpressao,
  type LinhaFeriasRelatorio,
  type LinhaLicencaRelatorio,
  type LinhaViagemRelatorio,
} from './relatoriosRHRegras';

/** Coluna da tabela; `align: 'right'` alinha célula, total e cabeçalho à direita (valores em R$). */
export interface Coluna {
  header: string;
  width: number;
  align?: 'left' | 'right';
}

const ALTURA_LINHA = 5;

/** Posição x do texto da célula conforme o alinhamento da coluna. */
const xCelula = (x: number, col: Coluna): { x: number; align: 'left' | 'right' } =>
  col.align === 'right' ? { x: x + col.width - 2, align: 'right' } : { x, align: 'left' };

/** Cabeçalho da tabela (mesmo visual de `addTableHeader`), respeitando `align` da coluna. */
export const addCabecalhoTabela = (doc: jsPDF, colunas: Coluna[], y: number): number => {
  const { contentWidth } = getPageDimensions(doc);
  setColor(doc, CORES.primaria, 'fill');
  doc.rect(PAGINA.margemEsquerda, y - 4, contentWidth, 7, 'F');
  setColor(doc, CORES.textoBranco);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  let x = PAGINA.margemEsquerda + 2;
  colunas.forEach((col) => {
    const pos = xCelula(x, col);
    doc.text(col.header, pos.x, y, { align: pos.align });
    x += col.width;
  });
  return y + 5;
};

/** Corta o texto pela largura real da coluna (em mm), com reticência. */
const caberNaColuna = (doc: jsPDF, texto: string, largura: number): string => {
  const max = largura - 2;
  if (doc.getTextWidth(texto) <= max) return texto;
  let t = texto;
  while (t.length > 1 && doc.getTextWidth(`${t}…`) > max) t = t.slice(0, -1);
  return `${t}…`;
};

/** Linha da tabela (fonte 7pt, zebrada) truncando cada célula pela largura medida. */
export const addLinhaTabela = (doc: jsPDF, valores: string[], colunas: Coluna[], y: number, alternado: boolean): number => {
  const { contentWidth } = getPageDimensions(doc);
  if (alternado) {
    setColor(doc, CORES.fundoClaro, 'fill');
    doc.rect(PAGINA.margemEsquerda, y - 3, contentWidth, ALTURA_LINHA, 'F');
  }
  setColor(doc, CORES.textoEscuro);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  let x = PAGINA.margemEsquerda + 2;
  colunas.forEach((col, idx) => {
    const pos = xCelula(x, col);
    doc.text(caberNaColuna(doc, valores[idx] || '-', col.width), pos.x, y, { align: pos.align });
    x += col.width;
  });
  return y + ALTURA_LINHA;
};

/** Quebra de página que repete o cabeçalho da tabela quando uma página nova é aberta. */
export const quebrarComCabecalho = (doc: jsPDF, y: number, colunas: Coluna[], espaco = 30): number => {
  const paginasAntes = doc.getNumberOfPages();
  let novoY = checkPageBreak(doc, y, espaco);
  if (doc.getNumberOfPages() > paginasAntes) {
    novoY = addCabecalhoTabela(doc, colunas, novoY);
  }
  return novoY;
};

/** Título do grupo (unidade, tipo…) em destaque, com contagem à direita. */
export const addTituloGrupo = (doc: jsPDF, titulo: string, contagem: string, y: number): number => {
  const { width, contentWidth } = getPageDimensions(doc);
  setColor(doc, CORES.fundoClaro, 'fill');
  doc.rect(PAGINA.margemEsquerda, y - 4, contentWidth, 6, 'F');
  setColor(doc, CORES.primaria);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  const larguraContagem = doc.getTextWidth(contagem) + 6;
  doc.text(caberNaColuna(doc, titulo, contentWidth - larguraContagem - 2), PAGINA.margemEsquerda + 2, y);
  doc.setFont('helvetica', 'normal');
  setColor(doc, CORES.cinzaMedio);
  doc.text(contagem, width - PAGINA.margemDireita - 2, y, { align: 'right' });
  return y + 6;
};

/** Linha de subtotal/total: fundo cinza, negrito, valores alinhados às colunas informadas. */
export const addLinhaTotal = (
  doc: jsPDF,
  rotulo: string,
  valores: Record<number, string>,
  colunas: Coluna[],
  y: number,
  destaque = false,
): number => {
  const { contentWidth } = getPageDimensions(doc);
  setColor(doc, destaque ? CORES.cinzaMuitoClaro : CORES.fundoClaro, 'fill');
  doc.rect(PAGINA.margemEsquerda, y - 3.5, contentWidth, ALTURA_LINHA + 0.5, 'F');
  setColor(doc, CORES.textoEscuro);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  let x = PAGINA.margemEsquerda + 2;
  doc.text(rotulo, x, y);
  colunas.forEach((col, idx) => {
    if (valores[idx] !== undefined) {
      const pos = xCelula(x, col);
      doc.text(valores[idx], pos.x, y, { align: pos.align });
    }
    x += col.width;
  });
  doc.setFont('helvetica', 'normal');
  return y + ALTURA_LINHA + 2;
};

/** Linha de resumo abaixo do cabeçalho: filtros aplicados e total de registros. */
const addResumoFiltros = (doc: jsPDF, filtros: FiltrosImpressao, totalRegistros: number, y: number): number => {
  const { width, contentWidth } = getPageDimensions(doc);
  setColor(doc, CORES.cinzaMedio);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  // Filtros quebram em linhas antes da área reservada à contagem, à direita.
  const linhasFiltro = doc.splitTextToSize(descreverFiltros(filtros), contentWidth - 30) as string[];
  doc.text(linhasFiltro, PAGINA.margemEsquerda, y);
  doc.text(`${totalRegistros} registro${totalRegistros === 1 ? '' : 's'}`, width - PAGINA.margemDireita, y, { align: 'right' });
  return y + 4 * Math.max(linhasFiltro.length - 1, 0) + 8;
};

/** Rodapé em todas as páginas (não só na última), numeração e download. */
export const finalizar = (doc: jsPDF, tipo: string) => {
  const sistema = `Sistema de Gestão de RH - ${getTenantSnapshot().identidade.sigla}`;
  for (let i = 1; i <= doc.getNumberOfPages(); i++) {
    doc.setPage(i);
    generateInstitutionalFooter(doc, { sistema });
  }
  addPageNumbers(doc);
  doc.save(`${nomeArquivoRelatorio(tipo)}.pdf`);
};

// ============================================
// FÉRIAS — agrupado por unidade, subtotal de dias
// ============================================

// Larguras somam 170 mm (retrato: 210 − margens de 20 mm).
const COLUNAS_FERIAS: Coluna[] = [
  { header: 'Servidor', width: 42 },
  { header: 'Matrícula', width: 14 },
  { header: 'Per. aquisitivo', width: 32 },
  { header: 'Início', width: 15 },
  { header: 'Fim', width: 15 },
  { header: 'Dias', width: 8 },
  { header: 'Parc.', width: 9 },
  { header: 'Status', width: 17 },
  { header: 'Portaria', width: 18 },
];

export const gerarRelatorioFerias = async (linhas: LinhaFeriasRelatorio[], filtros: FiltrosImpressao): Promise<void> => {
  const logos = await loadLogos();
  const doc = new jsPDF();

  let y = await generateInstitutionalHeader(doc, {
    titulo: 'RELATÓRIO DE FÉRIAS',
    subtitulo: 'Servidores em férias no período, por unidade',
    fundoEscuro: true,
  }, logos);

  y = addResumoFiltros(doc, filtros, linhas.length, y);
  y = addCabecalhoTabela(doc, COLUNAS_FERIAS, y);

  const grupos = agruparPor(linhas, (l) => nomeUnidade(l.servidor));
  grupos.forEach((grupo) => {
    y = quebrarComCabecalho(doc, y, COLUNAS_FERIAS, 40);
    y = addTituloGrupo(doc, grupo.chave, `${grupo.itens.length} registro${grupo.itens.length === 1 ? '' : 's'}`, y);

    grupo.itens.forEach((l, idx) => {
      y = quebrarComCabecalho(doc, y, COLUNAS_FERIAS);
      y = addLinhaTabela(doc, [
        nomeServidor(l.servidor),
        matriculaServidor(l.servidor),
        `${formatarDataISO(l.periodo_aquisitivo_inicio)} a ${formatarDataISO(l.periodo_aquisitivo_fim)}`,
        formatarDataISO(l.data_inicio),
        formatarDataISO(l.data_fim),
        String(Number(l.dias_gozados) || 0),
        descreverParcela(l.parcela, l.total_parcelas),
        rotuloStatusFerias(l.status),
        l.portaria_numero ?? '-',
      ], COLUNAS_FERIAS, y, idx % 2 === 1);
    });

    y = quebrarComCabecalho(doc, y, COLUNAS_FERIAS);
    y = addLinhaTotal(doc, 'Subtotal da unidade', { 5: String(somar(grupo.itens, (l) => l.dias_gozados)) }, COLUNAS_FERIAS, y);
  });

  y = quebrarComCabecalho(doc, y, COLUNAS_FERIAS);
  addLinhaTotal(doc, `Total geral: ${linhas.length} registro${linhas.length === 1 ? '' : 's'}`, {
    5: String(somar(linhas, (l) => l.dias_gozados)),
  }, COLUNAS_FERIAS, y, true);

  finalizar(doc, 'ferias');
};

// ============================================
// LICENÇAS E AFASTAMENTOS — agrupado por tipo, subtotal de dias
// ============================================

// Larguras somam 170 mm (retrato).
const COLUNAS_LICENCAS: Coluna[] = [
  { header: 'Servidor', width: 42 },
  { header: 'Matrícula', width: 14 },
  { header: 'Unidade', width: 34 },
  { header: 'Início', width: 15 },
  { header: 'Fim', width: 15 },
  { header: 'Dias', width: 8 },
  { header: 'Status', width: 18 },
  { header: 'Portaria', width: 24 },
];

export const gerarRelatorioLicencas = async (linhas: LinhaLicencaRelatorio[], filtros: FiltrosImpressao): Promise<void> => {
  const logos = await loadLogos();
  const doc = new jsPDF();

  let y = await generateInstitutionalHeader(doc, {
    titulo: 'RELATÓRIO DE LICENÇAS E AFASTAMENTOS',
    subtitulo: 'Afastamentos vigentes no período, por tipo',
    fundoEscuro: true,
  }, logos);

  y = addResumoFiltros(doc, filtros, linhas.length, y);
  y = addCabecalhoTabela(doc, COLUNAS_LICENCAS, y);

  const grupos = agruparPor(linhas, (l) => rotuloTipoAfastamento(l));
  grupos.forEach((grupo) => {
    y = quebrarComCabecalho(doc, y, COLUNAS_LICENCAS, 40);
    y = addTituloGrupo(doc, grupo.chave, `${grupo.itens.length} registro${grupo.itens.length === 1 ? '' : 's'}`, y);

    grupo.itens.forEach((l, idx) => {
      y = quebrarComCabecalho(doc, y, COLUNAS_LICENCAS);
      y = addLinhaTabela(doc, [
        nomeServidor(l.servidor),
        matriculaServidor(l.servidor),
        nomeUnidade(l.servidor),
        formatarDataISO(l.data_inicio),
        l.data_fim ? formatarDataISO(l.data_fim) : 'Em aberto',
        String(diasLicenca(l, filtros.fim)),
        rotuloStatusLicenca(l.status),
        l.portaria_numero ?? '-',
      ], COLUNAS_LICENCAS, y, idx % 2 === 1);
    });

    y = quebrarComCabecalho(doc, y, COLUNAS_LICENCAS);
    y = addLinhaTotal(doc, 'Subtotal do tipo', { 5: String(somar(grupo.itens, (l) => diasLicenca(l, filtros.fim))) }, COLUNAS_LICENCAS, y);
  });

  y = quebrarComCabecalho(doc, y, COLUNAS_LICENCAS);
  addLinhaTotal(doc, `Total geral: ${linhas.length} registro${linhas.length === 1 ? '' : 's'}`, {
    5: String(somar(linhas, (l) => diasLicenca(l, filtros.fim))),
  }, COLUNAS_LICENCAS, y, true);

  finalizar(doc, 'licencas');
};

// ============================================
// VIAGENS E DIÁRIAS — paisagem, por unidade, totais de diárias e valor
// ============================================

// Larguras somam 257 mm (paisagem: 297 − margens de 20 mm).
const COLUNAS_VIAGENS: Coluna[] = [
  { header: 'Servidor', width: 64 },
  { header: 'Matrícula', width: 14 },
  { header: 'Destino', width: 55 },
  { header: 'Saída', width: 15 },
  { header: 'Retorno', width: 15 },
  { header: 'Ônus', width: 16 },
  { header: 'Diárias', width: 12 },
  { header: 'Valor', width: 26 },
  { header: 'Status', width: 24 },
  { header: 'Relatório', width: 16 },
];

export const gerarRelatorioViagens = async (linhas: LinhaViagemRelatorio[], filtros: FiltrosImpressao): Promise<void> => {
  const logos = await loadLogos();
  const doc = new jsPDF({ orientation: 'landscape' });

  let y = await generateInstitutionalHeader(doc, {
    titulo: 'RELATÓRIO DE VIAGENS E DIÁRIAS',
    subtitulo: 'Viagens no período, por unidade, com totais de diárias e valores',
    fundoEscuro: true,
  }, logos);

  y = addResumoFiltros(doc, filtros, linhas.length, y);
  y = addCabecalhoTabela(doc, COLUNAS_VIAGENS, y);

  const diarias = (v: LinhaViagemRelatorio) => (v.tipo_onus === 'sem_onus' ? 0 : Number(v.quantidade_diarias) || 0);

  const grupos = agruparPor(linhas, (v) => nomeUnidade(v.servidor));
  grupos.forEach((grupo) => {
    y = quebrarComCabecalho(doc, y, COLUNAS_VIAGENS, 40);
    y = addTituloGrupo(doc, grupo.chave, `${grupo.itens.length} viage${grupo.itens.length === 1 ? 'm' : 'ns'}`, y);

    grupo.itens.forEach((v, idx) => {
      y = quebrarComCabecalho(doc, y, COLUNAS_VIAGENS);
      const semOnus = v.tipo_onus === 'sem_onus';
      y = addLinhaTabela(doc, [
        nomeServidor(v.servidor),
        matriculaServidor(v.servidor),
        descreverDestino(v),
        formatarDataISO(v.data_saida),
        formatarDataISO(v.data_retorno),
        rotuloOnus(v.tipo_onus),
        semOnus ? '-' : String(diarias(v)),
        semOnus ? '-' : formatCurrency(valorTotalViagem(v)),
        rotuloStatusViagem(v.status),
        v.relatorio_apresentado ? 'Sim' : 'Não',
      ], COLUNAS_VIAGENS, y, idx % 2 === 1);
    });

    y = quebrarComCabecalho(doc, y, COLUNAS_VIAGENS);
    y = addLinhaTotal(doc, 'Subtotal da unidade', {
      6: String(somar(grupo.itens, diarias)),
      7: formatCurrency(somar(grupo.itens, valorTotalViagem)),
    }, COLUNAS_VIAGENS, y);
  });

  y = quebrarComCabecalho(doc, y, COLUNAS_VIAGENS);
  addLinhaTotal(doc, `Total geral: ${linhas.length} viage${linhas.length === 1 ? 'm' : 'ns'}`, {
    6: String(somar(linhas, diarias)),
    7: formatCurrency(somar(linhas, valorTotalViagem)),
  }, COLUNAS_VIAGENS, y, true);

  finalizar(doc, 'viagens');
};

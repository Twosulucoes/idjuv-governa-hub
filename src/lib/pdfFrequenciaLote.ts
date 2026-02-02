/**
 * Geração de PDF em Lote de Frequência por Unidade Administrativa
 * 
 * REGRA DE OURO: 1 PÁGINA POR SERVIDOR (NUNCA AGRUPAR)
 * - Capa opcional do lote
 * - Cada servidor = 1 página A4 completa
 * - Observações automáticas para situações administrativas
 */
import jsPDF from 'jspdf';
import { DIAS_SEMANA_SIGLA } from '@/types/frequencia';
import type { DiaNaoUtil } from '@/types/frequencia';
import type { ServidorComSituacao } from '@/hooks/useServidoresPorUnidade';

// Importar logos e utilitário
import logoGoverno from '@/assets/logo-governo-roraima.jpg';
import logoIdjuv from '@/assets/logo-idjuv-oficial.png';
import { getLogosPDF, LOGO_CONFIG_PADRAO } from './pdfLogos';

// ============================================
// INTERFACES
// ============================================

export interface ConfigAssinaturaLote {
  servidor_obrigatoria: boolean;
  chefia_obrigatoria: boolean;
  rh_obrigatoria: boolean;
  texto_declaracao: string;
  nome_chefia?: string;
  cargo_chefia?: string;
}

export interface LoteFrequenciaPDFConfig {
  unidade: {
    id: string;
    nome: string;
    sigla?: string;
  };
  competencia: { mes: number; ano: number };
  servidores: ServidorComSituacao[];
  diasNaoUteis: DiaNaoUtil[];
  configAssinatura: ConfigAssinaturaLote;
  opcoes: {
    incluirCapa: boolean;
    ordenacao: 'alfabetica' | 'matricula';
  };
  dataGeracao: string;
  usuarioGeracao?: string;
}

// ============================================
// CONSTANTES
// ============================================

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const INSTITUICAO = {
  nome: 'Instituto de Desporto, Juventude e Lazer do Estado de Roraima',
  sigla: 'IDJuv',
  cnpj: '64.689.510/0001-09',
  endereco: 'Rua Cel. Pinto, 588, Centro, Boa Vista/RR, CEP 69.301-150',
};

// ============================================
// HELPERS
// ============================================

function getUltimoDiaMes(ano: number, mes: number): number {
  return new Date(ano, mes, 0).getDate();
}

function getSituacaoDia(data: Date, diasNaoUteis: DiaNaoUtil[]): { situacao: string; label?: string } {
  const diaSemana = data.getDay();
  const dataStr = data.toISOString().split('T')[0];

  const diaNaoUtil = diasNaoUteis.find(d => d.data === dataStr && d.ativo);
  if (diaNaoUtil) {
    const tipo = diaNaoUtil.tipo;
    const isFeriado = tipo.includes('feriado');
    return { situacao: isFeriado ? 'feriado' : tipo, label: diaNaoUtil.nome };
  }

  if (diaSemana === 0) return { situacao: 'domingo' };
  if (diaSemana === 6) return { situacao: 'sabado' };
  return { situacao: 'util' };
}

function isDiaDispensado(
  dataStr: string,
  servidor: ServidorComSituacao
): { dispensado: boolean; motivo?: string } {
  const data = new Date(dataStr + 'T00:00:00');
  
  for (const sit of servidor.situacoes_mes) {
    const inicio = new Date(sit.data_inicio + 'T00:00:00');
    const fim = sit.data_fim ? new Date(sit.data_fim + 'T00:00:00') : new Date(9999, 11, 31);
    
    if (data >= inicio && data <= fim && sit.dispensa_frequencia) {
      return { dispensado: true, motivo: sit.subtipo || sit.tipo };
    }
  }
  
  return { dispensado: false };
}

// ============================================
// GERADOR PRINCIPAL
// ============================================

export interface FrequenciaLotePDFResult {
  doc: jsPDF;
  nomeArquivo: string;
}

/**
 * Gera o PDF em lote e retorna o documento para processamento
 */
export const generateFrequenciaLotePDFInternal = async (config: LoteFrequenciaPDFConfig): Promise<FrequenciaLotePDFResult> => {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  const { unidade, competencia, servidores, diasNaoUteis, configAssinatura, opcoes, dataGeracao, usuarioGeracao } = config;
  const competenciaStr = `${MESES[competencia.mes - 1]} de ${competencia.ano}`;
  const ultimoDia = getUltimoDiaMes(competencia.ano, competencia.mes);

  // =========================================================
  // CAPA DO LOTE (OPCIONAL)
  // =========================================================
  if (opcoes.incluirCapa) {
    gerarCapaLote(doc, {
      unidade,
      competenciaStr,
      totalServidores: servidores.length,
      dataGeracao,
      usuarioGeracao,
      pageWidth,
      pageHeight,
      margin,
      contentWidth,
    });
  }

  // =========================================================
  // PÁGINAS INDIVIDUAIS POR SERVIDOR
  // =========================================================
  servidores.forEach((servidor, index) => {
    if (opcoes.incluirCapa || index > 0) {
      doc.addPage();
    }

    gerarPaginaServidor(doc, {
      servidor,
      competencia,
      competenciaStr,
      ultimoDia,
      diasNaoUteis,
      configAssinatura,
      dataGeracao,
      pageWidth,
      pageHeight,
      margin,
      contentWidth,
      paginaAtual: index + 1,
      totalPaginas: servidores.length,
    });
  });

  const sigla = unidade.sigla || unidade.nome.substring(0, 10);
  const nomeArquivo = `Frequencia_Lote_${sigla}_${String(competencia.mes).padStart(2, '0')}-${competencia.ano}.pdf`;

  return { doc, nomeArquivo };
};

/**
 * Gera e faz download do PDF em lote
 */
export const generateFrequenciaLotePDF = async (config: LoteFrequenciaPDFConfig): Promise<void> => {
  const { doc, nomeArquivo } = await generateFrequenciaLotePDFInternal(config);
  doc.save(nomeArquivo);
};

/**
 * Gera o PDF e retorna como Blob para upload
 */
export const generateFrequenciaLoteBlob = async (config: LoteFrequenciaPDFConfig): Promise<{ blob: Blob; nomeArquivo: string }> => {
  const { doc, nomeArquivo } = await generateFrequenciaLotePDFInternal(config);
  const blob = doc.output('blob');
  return { blob, nomeArquivo };
};

// ============================================
// CAPA DO LOTE
// ============================================

interface CapaParams {
  unidade: { nome: string; sigla?: string };
  competenciaStr: string;
  totalServidores: number;
  dataGeracao: string;
  usuarioGeracao?: string;
  pageWidth: number;
  pageHeight: number;
  margin: number;
  contentWidth: number;
}

function gerarCapaLote(doc: jsPDF, params: CapaParams) {
  const { unidade, competenciaStr, totalServidores, dataGeracao, usuarioGeracao, pageWidth, pageHeight, margin, contentWidth } = params;

  // ===== CABEÇALHO INSTITUCIONAL PADRÃO =====
  // Seguindo o padrão hierárquico: Governo -> IDJuv -> Título
  const logos = getLogosPDF(20); // 20mm para capa (maior destaque)
  
  let y = margin;

  try {
    // Logos nas laterais
    doc.addImage(logoGoverno, 'JPEG', margin, y, logos.governo.width, logos.governo.height);
    doc.addImage(logoIdjuv, 'PNG', pageWidth - margin - logos.idjuv.width, y, logos.idjuv.width, logos.idjuv.height);
  } catch (e) {
    console.warn('Logos não carregados');
  }

  // Texto centralizado entre as logos
  const textCenterY = y + logos.altura / 2;
  
  // Governo (primeira linha)
  doc.setTextColor(0, 68, 68);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('GOVERNO DO ESTADO DE RORAIMA', pageWidth / 2, textCenterY - 4, { align: 'center' });
  
  // Instituto (segunda linha)
  doc.setFontSize(9);
  doc.setTextColor(40, 45, 50);
  doc.text(INSTITUICAO.nome, pageWidth / 2, textCenterY + 3, { align: 'center' });
  
  // CNPJ (terceira linha)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 105, 110);
  doc.text(`CNPJ: ${INSTITUICAO.cnpj}`, pageWidth / 2, textCenterY + 9, { align: 'center' });

  y = margin + logos.altura + 8;

  // Linha divisória elegante
  doc.setDrawColor(0, 68, 68);
  doc.setLineWidth(0.8);
  doc.line(margin + 20, y, pageWidth - margin - 20, y);

  // ===== TÍTULO PRINCIPAL =====
  y += 25;
  doc.setTextColor(0, 68, 68);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('FOLHAS DE FREQUÊNCIA MENSAL', pageWidth / 2, y, { align: 'center' });

  y += 12;
  doc.setFontSize(16);
  doc.setTextColor(60, 65, 70);
  doc.text('LOTE POR UNIDADE ADMINISTRATIVA', pageWidth / 2, y, { align: 'center' });

  // ===== CAIXA DE INFORMAÇÕES =====
  y += 30;
  const boxHeight = 75;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(0, 68, 68);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin + 20, y, contentWidth - 40, boxHeight, 4, 4, 'FD');

  const labelX = margin + 35;
  const valueX = margin + 95;
  let infoY = y + 18;
  
  doc.setFontSize(11);
  doc.setTextColor(60, 65, 70);
  
  // Unidade
  doc.setFont('helvetica', 'bold');
  doc.text('UNIDADE:', labelX, infoY);
  doc.setFont('helvetica', 'normal');
  const unidadeText = unidade.sigla ? `${unidade.sigla} - ${unidade.nome}` : unidade.nome;
  // Truncar se muito longo
  const unidadeDisplay = unidadeText.length > 55 ? unidadeText.substring(0, 52) + '...' : unidadeText;
  doc.text(unidadeDisplay, valueX, infoY);

  infoY += 14;
  doc.setFont('helvetica', 'bold');
  doc.text('COMPETÊNCIA:', labelX, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(competenciaStr, valueX, infoY);

  infoY += 14;
  doc.setFont('helvetica', 'bold');
  doc.text('SERVIDORES:', labelX, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${totalServidores} folha${totalServidores !== 1 ? 's' : ''} de frequência`, valueX, infoY);

  infoY += 14;
  doc.setFont('helvetica', 'bold');
  doc.text('EMISSÃO:', labelX, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(dataGeracao, valueX, infoY);

  // ===== INSTRUÇÕES =====
  y += boxHeight + 25;
  doc.setFontSize(10);
  doc.setTextColor(100, 105, 110);
  doc.setFont('helvetica', 'italic');
  doc.text('Este lote contém as folhas de frequência individuais de cada servidor da unidade.', pageWidth / 2, y, { align: 'center' });
  y += 6;
  doc.text('Cada servidor ocupa exatamente uma página para fins de arquivo e auditoria.', pageWidth / 2, y, { align: 'center' });

  // ===== RODAPÉ DA CAPA =====
  doc.setTextColor(130, 135, 140);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado por: ${usuarioGeracao || 'Sistema'}`, margin, pageHeight - 15);
  doc.text(`${INSTITUICAO.sigla} - Sistema de Gestão de Pessoas`, pageWidth / 2, pageHeight - 15, { align: 'center' });
  doc.text('Capa do Lote', pageWidth - margin, pageHeight - 15, { align: 'right' });
}

// ============================================
// PÁGINA INDIVIDUAL DO SERVIDOR
// (Usando EXATAMENTE o mesmo modelo do gerador individual)
// ============================================

interface PaginaServidorParams {
  servidor: ServidorComSituacao;
  competencia: { mes: number; ano: number };
  competenciaStr: string;
  ultimoDia: number;
  diasNaoUteis: DiaNaoUtil[];
  configAssinatura: ConfigAssinaturaLote;
  dataGeracao: string;
  pageWidth: number;
  pageHeight: number;
  margin: number;
  contentWidth: number;
  paginaAtual: number;
  totalPaginas: number;
}

// Cores do tema institucional (mesmas do modelo individual)
const CORES = {
  primaria: { r: 0, g: 68, b: 68 },
  secundaria: { r: 41, g: 128, b: 185 },
  texto: { r: 30, g: 35, b: 40 },
  textoSecundario: { r: 100, g: 105, b: 110 },
  border: { r: 200, g: 205, b: 210 },
  bgCinza: { r: 248, g: 250, b: 252 },
  bgFeriado: { r: 252, g: 248, b: 245 },
};

const DIAS_SEMANA_SIGLA_PT = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

function gerarPaginaServidor(doc: jsPDF, params: PaginaServidorParams) {
  const {
    servidor,
    competencia,
    competenciaStr,
    ultimoDia,
    diasNaoUteis,
    configAssinatura,
    dataGeracao,
    pageWidth,
    pageHeight,
    margin,
    contentWidth,
    paginaAtual,
    totalPaginas,
  } = params;

  let y = margin;

  // ===== CABEÇALHO COM LOGOS - IGUAL AO INDIVIDUAL =====
  const logoGovernoHeight = 14;
  const logoGovernoWidth = logoGovernoHeight * 2.8;
  const logoIdjuvHeight = 20;
  const logoIdjuvWidth = logoIdjuvHeight * 1.1;
  const maxLogoHeight = Math.max(logoGovernoHeight, logoIdjuvHeight);
  const logoGovernoY = y + (maxLogoHeight - logoGovernoHeight) / 2;
  const logoIdjuvY = y + (maxLogoHeight - logoIdjuvHeight) / 2;

  try {
    doc.addImage(logoGoverno, 'JPEG', margin + 2, logoGovernoY, logoGovernoWidth, logoGovernoHeight);
    doc.addImage(logoIdjuv, 'PNG', pageWidth - margin - logoIdjuvWidth - 2, logoIdjuvY, logoIdjuvWidth, logoIdjuvHeight);
  } catch (e) {
    console.warn('Logos não carregados');
  }

  // ===== CABEÇALHO INSTITUCIONAL =====
  const textoY = y + maxLogoHeight / 2 - 6;

  doc.setTextColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('GOVERNO DO ESTADO DE RORAIMA', pageWidth / 2, textoY, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(CORES.texto.r, CORES.texto.g, CORES.texto.b);
  doc.text('Instituto de Desporto, Juventude e Lazer do Estado de Roraima', pageWidth / 2, textoY + 4.5, { align: 'center' });

  doc.setTextColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('FOLHA DE FREQUÊNCIA MENSAL', pageWidth / 2, textoY + 11, { align: 'center' });

  y += maxLogoHeight + 12;

  // Linha divisória
  doc.setDrawColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // ===== IDENTIFICAÇÃO DO SERVIDOR - IGUAL AO INDIVIDUAL =====
  const boxPadding = 5;
  const boxHeight = 26;

  doc.setFillColor(CORES.bgCinza.r, CORES.bgCinza.g, CORES.bgCinza.b);
  doc.roundedRect(margin, y, contentWidth, boxHeight, 3, 3, 'F');
  doc.setDrawColor(CORES.border.r, CORES.border.g, CORES.border.b);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, boxHeight, 3, 3, 'S');

  const infoY = y + boxPadding;
  const col1X = margin + boxPadding;
  const col2X = margin + contentWidth * 0.55;
  const lineHeight = 5.5;

  const drawInfoLine = (label: string, value: string, x: number, yPos: number, valueX?: number) => {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
    doc.text(label, x, yPos);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(CORES.texto.r, CORES.texto.g, CORES.texto.b);
    doc.setFontSize(8);
    const valueOffset = valueX || (x + doc.getTextWidth(label) + 2);
    doc.text(value, valueOffset, yPos);
  };

  // Linha 1: Servidor e Competência
  drawInfoLine('SERVIDOR:', servidor.nome_completo || '-', col1X, infoY + 4);
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
  doc.text('COMPETÊNCIA:', col2X, infoY + 4);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(CORES.secundaria.r, CORES.secundaria.g, CORES.secundaria.b);
  doc.text(competenciaStr, col2X + doc.getTextWidth('COMPETÊNCIA: ') + 2, infoY + 4);

  // Linha 2: Matrícula e Cargo
  drawInfoLine('Matrícula:', servidor.matricula || '-', col1X, infoY + 4 + lineHeight);
  drawInfoLine('Cargo:', servidor.cargo_nome || '-', col1X + 55, infoY + 4 + lineHeight);

  // Linha 3: Unidade
  const unidadeLabel = servidor.unidade_sigla 
    ? `${servidor.unidade_sigla} - ${servidor.unidade_nome || ''}`
    : servidor.unidade_nome || '-';
  drawInfoLine('Unidade:', unidadeLabel.substring(0, 45), col1X, infoY + 4 + lineHeight * 2);

  // Linha 4: Regime e Jornada
  drawInfoLine('Regime:', servidor.regime || 'Presencial', col1X, infoY + 4 + lineHeight * 3);
  const jornada = `${servidor.carga_horaria_diaria || 8}h/dia • ${servidor.carga_horaria_semanal || 40}h/sem`;
  drawInfoLine('Jornada:', jornada, col1X + 50, infoY + 4 + lineHeight * 3);

  y += boxHeight + 8;

  // ===== OBSERVAÇÃO AUTOMÁTICA (se dispensado) =====
  if (servidor.observacao_automatica) {
    const observacaoHeight = 14;
    
    doc.setFillColor(255, 250, 240);
    doc.setDrawColor(200, 160, 80);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, observacaoHeight, 2, 2, 'FD');
    
    doc.setTextColor(140, 100, 30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('OBSERVAÇÃO:', margin + 4, y + 4);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    const obsLines = doc.splitTextToSize(servidor.observacao_automatica, contentWidth - 30);
    doc.text(obsLines.slice(0, 2).join(' '), margin + 28, y + 4);
    
    y += observacaoHeight + 2;
  }

  // ===== TABELA DE FREQUÊNCIA - IGUAL AO INDIVIDUAL =====
  const assinaturasHeight = 35;
  const rodapeHeight = 12;
  const espacoDisponivel = pageHeight - y - assinaturasHeight - rodapeHeight - 5;
  
  const headerTableHeight = 8;
  const rowHeight = 5.8;
  const maxRows = Math.floor((espacoDisponivel - headerTableHeight) / rowHeight);

  const colWidths = {
    dia: 13,
    diaSemana: 18,
    tipo: 36,
    entrada: 24,
    saida: 24,
    assinatura: contentWidth - 115,
  };

  // Header da tabela
  doc.setFillColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
  doc.roundedRect(margin, y, contentWidth, headerTableHeight, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');

  let colX = margin;
  const headerY = y + headerTableHeight / 2 + 1.5;
  
  doc.text('DIA', colX + colWidths.dia / 2, headerY, { align: 'center' });
  colX += colWidths.dia;
  doc.text('SEMANA', colX + colWidths.diaSemana / 2, headerY, { align: 'center' });
  colX += colWidths.diaSemana;
  doc.text('TIPO DO DIA', colX + colWidths.tipo / 2, headerY, { align: 'center' });
  colX += colWidths.tipo;
  doc.text('ENTRADA', colX + colWidths.entrada / 2, headerY, { align: 'center' });
  colX += colWidths.entrada;
  doc.text('SAÍDA', colX + colWidths.saida / 2, headerY, { align: 'center' });
  colX += colWidths.saida;
  doc.text('ASSINATURA', colX + colWidths.assinatura / 2, headerY, { align: 'center' });

  y += headerTableHeight;

  // Linhas de dados
  for (let dia = 1; dia <= ultimoDia && dia <= maxRows; dia++) {
    const dataAtual = new Date(competencia.ano, competencia.mes - 1, dia);
    const dataStr = `${competencia.ano}-${String(competencia.mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    const situacaoBase = getSituacaoDia(dataAtual, diasNaoUteis);
    const { situacao, label } = situacaoBase;
    
    const isNaoUtil = situacao !== 'util';
    const diaSemana = dataAtual.getDay();
    const isFimDeSemana = diaSemana === 0 || diaSemana === 6;
    
    // Verificar dispensa por situação administrativa
    const { dispensado, motivo } = isDiaDispensado(dataStr, servidor);

    // Cores diferentes para dias úteis e não úteis
    const bgColor = dispensado
      ? { r: 255, g: 240, b: 245 }
      : isNaoUtil 
        ? (situacao === 'feriado' ? CORES.bgFeriado : { r: 250, g: 250, b: 252 })
        : (isFimDeSemana ? { r: 254, g: 254, b: 255 } : { r: 255, g: 255, b: 255 });
    
    const textColor = (isNaoUtil || dispensado)
      ? { r: 140, g: 145, b: 150 } 
      : CORES.texto;

    // Background da linha
    doc.setFillColor(bgColor.r, bgColor.g, bgColor.b);
    doc.rect(margin, y, contentWidth, rowHeight, 'F');

    // Bordas horizontais
    doc.setDrawColor(235, 238, 242);
    doc.setLineWidth(0.15);
    doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);

    // Colunas
    colX = margin;
    doc.setTextColor(textColor.r, textColor.g, textColor.b);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');

    const textY = y + rowHeight / 2 + 1.2;

    // Dia
    doc.setFont('helvetica', 'bold');
    doc.text(String(dia).padStart(2, '0'), colX + colWidths.dia / 2, textY, { align: 'center' });
    colX += colWidths.dia;

    // Linhas verticais suaves
    doc.setDrawColor(240, 242, 245);
    doc.line(colX, y, colX, y + rowHeight);

    // Dia da semana
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text(DIAS_SEMANA_SIGLA_PT[diaSemana], colX + colWidths.diaSemana / 2, textY, { align: 'center' });
    colX += colWidths.diaSemana;
    
    doc.line(colX, y, colX, y + rowHeight);

    // Tipo do dia
    let tipoLabel = '';
    if (dispensado) {
      tipoLabel = motivo || 'Dispensado';
      doc.setFont('helvetica', 'italic');
    } else if (situacao === 'feriado') {
      tipoLabel = label || 'Feriado';
      doc.setFont('helvetica', 'italic');
    } else if (situacao === 'domingo') {
      tipoLabel = 'Domingo';
      doc.setFont('helvetica', 'italic');
    } else if (situacao === 'sabado') {
      tipoLabel = 'Sábado';
      doc.setFont('helvetica', 'italic');
    } else if (situacao === 'ponto_facultativo') {
      tipoLabel = label || 'Ponto Facultativo';
      doc.setFont('helvetica', 'italic');
    } else if (situacao === 'recesso') {
      tipoLabel = label || 'Recesso';
      doc.setFont('helvetica', 'italic');
    }
    
    doc.setFontSize(6.5);
    doc.text(tipoLabel.substring(0, 20), colX + colWidths.tipo / 2, textY, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    colX += colWidths.tipo;
    
    doc.line(colX, y, colX, y + rowHeight);

    // Entrada e Saída - linhas para preenchimento manual (se dia útil)
    if (!isNaoUtil && !dispensado) {
      doc.setDrawColor(180, 185, 190);
      doc.setLineWidth(0.2);
      doc.line(colX + 4, textY, colX + colWidths.entrada - 4, textY);
    } else {
      doc.setTextColor(180, 180, 180);
      doc.text('—', colX + colWidths.entrada / 2, textY, { align: 'center' });
    }
    colX += colWidths.entrada;
    
    doc.line(colX, y, colX, y + rowHeight);

    if (!isNaoUtil && !dispensado) {
      doc.setDrawColor(180, 185, 190);
      doc.setLineWidth(0.2);
      doc.line(colX + 4, textY, colX + colWidths.saida - 4, textY);
    } else {
      doc.setTextColor(180, 180, 180);
      doc.text('—', colX + colWidths.saida / 2, textY, { align: 'center' });
    }
    colX += colWidths.saida;
    
    // Linha vertical entre Saída e Assinatura
    doc.setDrawColor(240, 242, 245);
    doc.line(colX, y, colX, y + rowHeight);

    // Coluna de assinatura - linha para preenchimento (se dia útil)
    if (!isNaoUtil && !dispensado) {
      doc.setDrawColor(200, 205, 210);
      doc.setLineWidth(0.15);
      doc.line(colX + 8, textY, colX + colWidths.assinatura - 8, textY);
    }

    y += rowHeight;
  }

  // Borda final da tabela
  doc.setDrawColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageWidth - margin, y);

  // ===== ÁREA DE ASSINATURAS - IGUAL AO INDIVIDUAL =====
  y += 8;

  // Declaração
  doc.setFontSize(7.5);
  doc.setTextColor(CORES.textoSecundario.r, CORES.textoSecundario.g, CORES.textoSecundario.b);
  doc.setFont('helvetica', 'italic');
  const textoDeclaracao = configAssinatura.texto_declaracao || 
    'Declaro que as informações acima refletem fielmente a jornada de trabalho exercida no período.';
  doc.text(textoDeclaracao, pageWidth / 2, y, { align: 'center', maxWidth: contentWidth - 20 });

  y += 10;

  // Linhas de assinatura
  const assinaturaWidth = (contentWidth - 30) / 2;
  const assinaturaY = y;
  
  // Assinatura do servidor
  doc.setDrawColor(CORES.textoSecundario.r, CORES.textoSecundario.g, CORES.textoSecundario.b);
  doc.setLineWidth(0.4);
  doc.line(margin + 5, assinaturaY, margin + 5 + assinaturaWidth, assinaturaY);
  
  doc.setFontSize(7);
  doc.setTextColor(CORES.texto.r, CORES.texto.g, CORES.texto.b);
  doc.setFont('helvetica', 'bold');
  doc.text('Assinatura do Servidor', margin + 5 + assinaturaWidth / 2, assinaturaY + 5, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(CORES.textoSecundario.r, CORES.textoSecundario.g, CORES.textoSecundario.b);
  doc.text(servidor.nome_completo || '', margin + 5 + assinaturaWidth / 2, assinaturaY + 9, { align: 'center' });

  // Assinatura da chefia
  const chefiaX = pageWidth - margin - assinaturaWidth - 5;
  doc.setDrawColor(CORES.textoSecundario.r, CORES.textoSecundario.g, CORES.textoSecundario.b);
  doc.line(chefiaX, assinaturaY, chefiaX + assinaturaWidth, assinaturaY);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(CORES.texto.r, CORES.texto.g, CORES.texto.b);
  doc.text('Assinatura da Chefia Imediata', chefiaX + assinaturaWidth / 2, assinaturaY + 5, { align: 'center' });
  
  if (configAssinatura.nome_chefia) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(CORES.textoSecundario.r, CORES.textoSecundario.g, CORES.textoSecundario.b);
    doc.text(configAssinatura.nome_chefia, chefiaX + assinaturaWidth / 2, assinaturaY + 9, { align: 'center' });
  }

  // ===== RODAPÉ =====
  const rodapeY = pageHeight - 6;
  doc.setTextColor(CORES.textoSecundario.r, CORES.textoSecundario.g, CORES.textoSecundario.b);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  
  doc.text(`Gerado em ${dataGeracao}`, margin, rodapeY);
  doc.text(`${INSTITUICAO.sigla} - Sistema de Gestão de Pessoas`, pageWidth / 2, rodapeY, { align: 'center' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text(`Página ${paginaAtual} de ${totalPaginas}`, pageWidth - margin, rodapeY, { align: 'right' });
}

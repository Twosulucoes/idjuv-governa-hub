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

  // Logos no topo - mesma altura para ambos
  const logos = getLogosPDF(18); // 18mm para capa (maior destaque)
  
  try {
    doc.addImage(logoGoverno, 'JPEG', margin, margin, logos.governo.width, logos.governo.height);
    doc.addImage(logoIdjuv, 'PNG', pageWidth - margin - logos.idjuv.width, margin, logos.idjuv.width, logos.idjuv.height);
  } catch (e) {
    console.warn('Logos não carregados');
  }

  let y = margin + logos.altura + 15;

  // Instituição
  doc.setTextColor(0, 68, 68);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(INSTITUICAO.nome, pageWidth / 2, y, { align: 'center' });
  
  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 85, 90);
  doc.text(`CNPJ: ${INSTITUICAO.cnpj}`, pageWidth / 2, y, { align: 'center' });

  // Título principal
  y += 30;
  doc.setTextColor(0, 68, 68);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('FOLHAS DE FREQUÊNCIA MENSAL', pageWidth / 2, y, { align: 'center' });

  y += 10;
  doc.setFontSize(16);
  doc.text('LOTE POR UNIDADE ADMINISTRATIVA', pageWidth / 2, y, { align: 'center' });

  // Caixa de informações
  y += 25;
  const boxHeight = 70;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(0, 68, 68);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin + 20, y, contentWidth - 40, boxHeight, 3, 3, 'FD');

  y += 15;
  doc.setFontSize(12);
  doc.setTextColor(60, 65, 70);
  
  // Unidade
  doc.setFont('helvetica', 'bold');
  doc.text('UNIDADE:', margin + 30, y);
  doc.setFont('helvetica', 'normal');
  const unidadeText = unidade.sigla ? `${unidade.sigla} - ${unidade.nome}` : unidade.nome;
  doc.text(unidadeText, margin + 60, y);

  y += 12;
  doc.setFont('helvetica', 'bold');
  doc.text('COMPETÊNCIA:', margin + 30, y);
  doc.setFont('helvetica', 'normal');
  doc.text(competenciaStr, margin + 75, y);

  y += 12;
  doc.setFont('helvetica', 'bold');
  doc.text('SERVIDORES:', margin + 30, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${totalServidores} folha${totalServidores !== 1 ? 's' : ''} de frequência`, margin + 73, y);

  y += 12;
  doc.setFont('helvetica', 'bold');
  doc.text('EMISSÃO:', margin + 30, y);
  doc.setFont('helvetica', 'normal');
  doc.text(dataGeracao, margin + 60, y);

  // Instruções
  y += 40;
  doc.setFontSize(10);
  doc.setTextColor(100, 105, 110);
  doc.setFont('helvetica', 'italic');
  doc.text('Este lote contém as folhas de frequência individuais de cada servidor da unidade.', pageWidth / 2, y, { align: 'center' });
  y += 6;
  doc.text('Cada servidor ocupa exatamente uma página para fins de arquivo e auditoria.', pageWidth / 2, y, { align: 'center' });

  // Rodapé da capa
  doc.setTextColor(130, 135, 140);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado por: ${usuarioGeracao || 'Sistema'}`, margin, pageHeight - 15);
  doc.text(`${INSTITUICAO.sigla} - Sistema de Gestão de Pessoas`, pageWidth / 2, pageHeight - 15, { align: 'center' });
  doc.text('Capa do Lote', pageWidth - margin, pageHeight - 15, { align: 'right' });
}

// ============================================
// PÁGINA INDIVIDUAL DO SERVIDOR
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

  // ===== CABEÇALHO COM LOGOS =====
  const headerHeight = 24;
  const logos = getLogosPDF(14); // 14mm para páginas internas

  try {
    doc.addImage(logoGoverno, 'JPEG', margin, y + 2, logos.governo.width, logos.governo.height);
    doc.addImage(logoIdjuv, 'PNG', pageWidth - margin - logos.idjuv.width, y + 2, logos.idjuv.width, logos.idjuv.height);
  } catch (e) {
    console.warn('Logos não carregados');
  }

  doc.setTextColor(0, 68, 68);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('FOLHA DE FREQUÊNCIA MENSAL', pageWidth / 2, y + 6, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 65, 70);
  doc.text(INSTITUICAO.nome, pageWidth / 2, y + 12, { align: 'center' });
  doc.setFontSize(7);
  doc.text(`CNPJ: ${INSTITUICAO.cnpj} | ${INSTITUICAO.endereco}`, pageWidth / 2, y + 17, { align: 'center' });

  y += headerHeight;

  // Linha divisória
  doc.setDrawColor(0, 68, 68);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  // ===== IDENTIFICAÇÃO DO SERVIDOR =====
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'F');
  doc.setDrawColor(220, 225, 230);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'S');

  const col1 = margin + 4;
  const col2 = margin + contentWidth / 2;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 68, 68);
  doc.text('SERVIDOR:', col1, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 35, 40);
  doc.text(servidor.nome_completo || '-', col1 + 22, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 68, 68);
  doc.text('COMPETÊNCIA:', col2, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 35, 40);
  doc.text(competenciaStr, col2 + 30, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 68, 68);
  doc.text('Matrícula:', col1, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 35, 40);
  doc.text(servidor.matricula || '-', col1 + 18, y + 10);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 68, 68);
  doc.text('Cargo:', col1 + 45, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 35, 40);
  doc.text(servidor.cargo_nome || '-', col1 + 58, y + 10);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 68, 68);
  doc.text('Unidade:', col2, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 35, 40);
  const unidadeLabel = servidor.unidade_sigla ? `${servidor.unidade_sigla} - ${servidor.unidade_nome || ''}` : servidor.unidade_nome || '-';
  doc.text(unidadeLabel.substring(0, 40), col2 + 17, y + 10);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 68, 68);
  doc.text('Regime:', col1, y + 15);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 35, 40);
  doc.text(servidor.regime || 'Presencial', col1 + 15, y + 15);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 68, 68);
  doc.text('Jornada:', col1 + 50, y + 15);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 35, 40);
  doc.text(`${servidor.carga_horaria_diaria || 8}h/dia | ${servidor.carga_horaria_semanal || 40}h/sem`, col1 + 66, y + 15);

  y += 22;

  // ===== OBSERVAÇÃO AUTOMÁTICA (se dispensado) =====
  let observacaoHeight = 0;
  if (servidor.observacao_automatica) {
    observacaoHeight = 14;
    
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

  // ===== TABELA DE FREQUÊNCIA =====
  const assinaturasHeight = 38;
  const rodapeHeight = 10;
  const espacoDisponivel = pageHeight - y - assinaturasHeight - rodapeHeight;
  const headerTableHeight = 7;
  const rowHeight = (espacoDisponivel - headerTableHeight) / ultimoDia;

  const colWidths = {
    dia: 12,
    diaSemana: 16,
    tipo: 32,
    entrada: 22,
    saida: 22,
    assinatura: contentWidth - 104,
  };

  // Header da tabela
  doc.setFillColor(0, 68, 68);
  doc.rect(margin, y, contentWidth, headerTableHeight, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');

  let colX = margin;
  doc.text('DIA', colX + colWidths.dia / 2, y + 4.5, { align: 'center' });
  colX += colWidths.dia;
  doc.text('SEMANA', colX + colWidths.diaSemana / 2, y + 4.5, { align: 'center' });
  colX += colWidths.diaSemana;
  doc.text('TIPO DO DIA', colX + colWidths.tipo / 2, y + 4.5, { align: 'center' });
  colX += colWidths.tipo;
  doc.text('ENTRADA', colX + colWidths.entrada / 2, y + 4.5, { align: 'center' });
  colX += colWidths.entrada;
  doc.text('SAÍDA', colX + colWidths.saida / 2, y + 4.5, { align: 'center' });
  colX += colWidths.saida;
  doc.text('ASSINATURA DO SERVIDOR', colX + colWidths.assinatura / 2, y + 4.5, { align: 'center' });

  y += headerTableHeight;

  // Linhas de dados
  for (let dia = 1; dia <= ultimoDia; dia++) {
    const dataAtual = new Date(competencia.ano, competencia.mes - 1, dia);
    const dataStr = `${competencia.ano}-${String(competencia.mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    const { situacao, label } = getSituacaoDia(dataAtual, diasNaoUteis);
    const diaSemana = dataAtual.getDay();
    
    const isNaoUtil = situacao !== 'util';
    const isWeekend = situacao === 'sabado' || situacao === 'domingo';
    const isFeriado = situacao === 'feriado' || situacao === 'ponto_facultativo' || situacao === 'recesso';
    
    // Verificar se dia está dispensado por situação administrativa
    const { dispensado, motivo } = isDiaDispensado(dataStr, servidor);

    // Fundo
    if (dispensado) {
      doc.setFillColor(255, 240, 245); // Rosa claro para dispensado
    } else if (isFeriado) {
      doc.setFillColor(255, 245, 220);
    } else if (isWeekend) {
      doc.setFillColor(250, 248, 240);
    } else if (dia % 2 === 0) {
      doc.setFillColor(252, 253, 255);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.rect(margin, y, contentWidth, rowHeight, 'F');

    // Bordas
    doc.setDrawColor(230, 232, 236);
    doc.setLineWidth(0.1);
    doc.rect(margin, y, contentWidth, rowHeight, 'S');

    const centerY = y + rowHeight / 2 + 1;
    colX = margin;

    // Dia
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 68, 68);
    doc.setFontSize(7);
    doc.text(String(dia).padStart(2, '0'), colX + colWidths.dia / 2, centerY, { align: 'center' });
    colX += colWidths.dia;

    // Dia semana
    doc.setFont('helvetica', 'normal');
    if (isWeekend) {
      doc.setTextColor(140, 110, 60);
    } else {
      doc.setTextColor(70, 75, 80);
    }
    doc.text(DIAS_SEMANA_SIGLA[diaSemana], colX + colWidths.diaSemana / 2, centerY, { align: 'center' });
    colX += colWidths.diaSemana;

    // Tipo do dia
    let tipoLabel = '';
    if (dispensado) {
      tipoLabel = motivo || 'Dispensado';
      doc.setTextColor(180, 80, 120);
      doc.setFont('helvetica', 'italic');
    } else if (isFeriado) {
      tipoLabel = label || 'Feriado';
      doc.setTextColor(150, 120, 50);
      doc.setFont('helvetica', 'italic');
    } else if (isWeekend) {
      tipoLabel = situacao === 'sabado' ? 'Sábado' : 'Domingo';
      doc.setTextColor(150, 120, 50);
      doc.setFont('helvetica', 'italic');
    } else {
      doc.setTextColor(100, 105, 110);
      doc.setFont('helvetica', 'normal');
    }
    doc.text(tipoLabel.substring(0, 15), colX + colWidths.tipo / 2, centerY, { align: 'center' });
    colX += colWidths.tipo;

    // Entrada e Saída
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 55, 60);

    if (dispensado || isNaoUtil) {
      // Não mostrar campos para dias dispensados
      doc.setTextColor(180, 180, 180);
      doc.text('—', colX + colWidths.entrada / 2, centerY, { align: 'center' });
      colX += colWidths.entrada;
      doc.text('—', colX + colWidths.saida / 2, centerY, { align: 'center' });
    } else {
      // Linhas para preenchimento manual
      doc.setDrawColor(180, 185, 190);
      doc.setLineWidth(0.2);
      doc.line(colX + 3, centerY, colX + colWidths.entrada - 3, centerY);
      colX += colWidths.entrada;
      doc.line(colX + 3, centerY, colX + colWidths.saida - 3, centerY);
    }
    colX += colWidths.saida;

    // Linha de assinatura
    if (!dispensado && !isNaoUtil) {
      doc.setDrawColor(200, 205, 210);
      doc.setLineWidth(0.15);
      doc.line(colX + 8, centerY, colX + colWidths.assinatura - 8, centerY);
    }

    y += rowHeight;
  }

  // ===== BLOCO DE ASSINATURAS =====
  y += 3;

  // Declaração
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 10, 1.5, 1.5, 'F');
  doc.setDrawColor(210, 215, 220);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, y, contentWidth, 10, 1.5, 1.5, 'S');

  doc.setTextColor(60, 65, 70);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text(
    configAssinatura.texto_declaracao || 'Declaro, para os devidos fins, que as informações constantes nesta folha correspondem à minha efetiva jornada de trabalho no período de referência.',
    pageWidth / 2, y + 6, { align: 'center', maxWidth: contentWidth - 10 }
  );

  y += 14;

  // Assinaturas lado a lado
  const assWidth = (contentWidth - 20) / 2;

  // Servidor
  doc.setDrawColor(0, 68, 68);
  doc.setLineWidth(0.4);
  doc.line(margin + 5, y + 10, margin + 5 + assWidth, y + 10);
  doc.setTextColor(0, 68, 68);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('ASSINATURA DO SERVIDOR', margin + 5 + assWidth / 2, y + 14, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 105, 110);
  doc.text(servidor.nome_completo || '', margin + 5 + assWidth / 2, y + 18, { align: 'center' });

  // Chefia
  doc.setDrawColor(0, 68, 68);
  doc.line(margin + 15 + assWidth, y + 10, margin + 15 + assWidth * 2, y + 10);
  doc.setTextColor(0, 68, 68);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('ASSINATURA DA CHEFIA IMEDIATA', margin + 15 + assWidth + assWidth / 2, y + 14, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 105, 110);
  doc.text(configAssinatura.nome_chefia || '', margin + 15 + assWidth + assWidth / 2, y + 18, { align: 'center' });

  // ===== RODAPÉ =====
  doc.setDrawColor(220, 225, 230);
  doc.setLineWidth(0.3);
  doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

  doc.setTextColor(130, 135, 140);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em: ${dataGeracao}`, margin, pageHeight - 6);
  doc.text(`${INSTITUICAO.sigla} - Sistema de Gestão de Pessoas`, pageWidth / 2, pageHeight - 6, { align: 'center' });
  doc.text(`Página ${paginaAtual} de ${totalPaginas}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
}

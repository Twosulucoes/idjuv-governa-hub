/**
 * Geração de PDF da Frequência Mensal - IDJuv-RR
 * 
 * REGRA DE OURO: TUDO EM UMA ÚNICA PÁGINA A4 (297mm)
 * - Layout proporcional distribuído
 * - Logos institucionais
 * - Dados completos do servidor
 * - Aproveitamento total da página
 */
import jsPDF from 'jspdf';
import { DIAS_SEMANA_SIGLA } from '@/types/frequencia';
import type { DiaNaoUtil, StatusFechamento } from '@/types/frequencia';

// Importar logos e utilitário
import logoGoverno from '@/assets/logo-governo-roraima.jpg';
import logoIdjuv from '@/assets/logo-idjuv-oficial.png';
import { getLogosPDF, LOGO_CONFIG_PADRAO } from './pdfLogos';

// ============================================
// INTERFACES
// ============================================

export interface ServidorFrequencia {
  id: string;
  nome_completo: string;
  matricula?: string;
  cpf?: string;
  cargo?: string;
  unidade?: string;
  local_exercicio?: string;
  regime?: string;
  escala_jornada?: string;
  carga_horaria_diaria?: number;
  carga_horaria_semanal?: number;
}

export interface RegistroDiario {
  data: string;
  dia_semana: number;
  situacao: 'util' | 'sabado' | 'domingo' | 'feriado' | 'ponto_facultativo' | 'recesso' | 'expediente_reduzido';
  situacao_label?: string;
  entrada?: string;
  saida?: string;
  entrada_manha?: string;
  saida_manha?: string;
  entrada_tarde?: string;
  saida_tarde?: string;
  total_horas?: number;
  observacao?: string;
  tipo_registro?: string;
}

export interface ResumoFrequencia {
  dias_uteis: number;
  dias_trabalhados: number;
  dias_falta: number;
  dias_abono: number;
  dias_atestado: number;
  dias_ferias: number;
  dias_licenca: number;
  horas_previstas: number;
  horas_trabalhadas: number;
  horas_abonadas: number;
  horas_compensadas: number;
  saldo_banco_horas: number;
}

export interface ConfiguracaoAssinaturas {
  servidor_obrigatoria: boolean;
  chefia_obrigatoria: boolean;
  rh_obrigatoria: boolean;
  texto_declaracao: string;
  nome_chefia?: string;
  cargo_chefia?: string;
  nome_rh?: string;
  cargo_rh?: string;
}

export interface StatusPeriodo {
  status: StatusFechamento;
  fechado_em?: string;
  validado_chefia_em?: string;
  consolidado_rh_em?: string;
}

export interface FrequenciaMensalPDFData {
  tipo: 'em_branco' | 'preenchida';
  competencia: { mes: number; ano: number };
  servidor: ServidorFrequencia;
  registros?: RegistroDiario[];
  resumo?: ResumoFrequencia;
  diasNaoUteis: DiaNaoUtil[];
  configAssinatura: ConfiguracaoAssinaturas;
  statusPeriodo?: StatusPeriodo;
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

function getSituacaoDia(data: Date, diasNaoUteis: DiaNaoUtil[]): { situacao: RegistroDiario['situacao']; label?: string } {
  const diaSemana = data.getDay();
  const dataStr = data.toISOString().split('T')[0];

  const diaNaoUtil = diasNaoUteis.find(d => d.data === dataStr && d.ativo);
  if (diaNaoUtil) {
    const tipo = diaNaoUtil.tipo;
    const isFeriado = tipo.includes('feriado');
    return { situacao: isFeriado ? 'feriado' : (tipo as RegistroDiario['situacao']), label: diaNaoUtil.nome };
  }

  if (diaSemana === 0) return { situacao: 'domingo' };
  if (diaSemana === 6) return { situacao: 'sabado' };
  return { situacao: 'util' };
}

function getTipoDiaAbrev(situacao: RegistroDiario['situacao'], tipoReg?: string): string {
  if (tipoReg === 'falta') return 'FALTA';
  if (tipoReg === 'atestado') return 'Atestado';
  if (tipoReg === 'ferias') return 'Férias';
  if (tipoReg === 'licenca') return 'Licença';
  if (tipoReg === 'folga') return 'Folga';
  if (tipoReg === 'abono') return 'Abono';
  
  switch (situacao) {
    case 'util': return '';
    case 'sabado': return 'Sábado';
    case 'domingo': return 'Domingo';
    case 'feriado': return 'Feriado';
    case 'ponto_facultativo': return 'P. Facultativo';
    case 'recesso': return 'Recesso';
    case 'expediente_reduzido': return 'Exp. Reduzido';
    default: return '';
  }
}

// ============================================
// GERADOR PRINCIPAL - 1 PÁGINA A4 COMPLETA
// ============================================

export const generateFrequenciaMensalPDF = async (data: FrequenciaMensalPDFData): Promise<{ doc: jsPDF; nomeArquivo: string }> => {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 12;
  const contentWidth = pageWidth - margin * 2; // 186mm
  
  const competencia = `${MESES[data.competencia.mes - 1]} de ${data.competencia.ano}`;
  const srv = data.servidor;

  // Gerar dias do mês
  const ultimoDia = getUltimoDiaMes(data.competencia.ano, data.competencia.mes);
  const registros: RegistroDiario[] = [];

  for (let dia = 1; dia <= ultimoDia; dia++) {
    const dataAtual = new Date(data.competencia.ano, data.competencia.mes - 1, dia);
    const dataStr = `${data.competencia.ano}-${String(data.competencia.mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    const { situacao, label } = getSituacaoDia(dataAtual, data.diasNaoUteis);
    const regExist = data.registros?.find(r => r.data === dataStr);

    registros.push({
      data: dataStr,
      dia_semana: dataAtual.getDay(),
      situacao: regExist?.situacao || situacao,
      situacao_label: regExist?.situacao_label || label,
      entrada: regExist?.entrada || regExist?.entrada_manha,
      saida: regExist?.saida || regExist?.saida_tarde || regExist?.saida_manha,
      tipo_registro: regExist?.tipo_registro,
    });
  }

  // =========================================================
  // CÁLCULO PROPORCIONAL DA PÁGINA A4 (297mm)
  // =========================================================
  // Cabeçalho com logos: 28mm
  // Identificação servidor: 20mm
  // Tabela: ~200mm (dinâmico baseado em dias)
  // Assinaturas: 35mm
  // Rodapé: 8mm
  // =========================================================

  let y = margin;

  // ===== CABEÇALHO COM LOGOS (28mm) =====
  const headerHeight = 24;
  
  // Logos com ALTURA como base para preservar proporções originais (sem distorção)
  // Alturas visuais similares mas não iguais para equilíbrio
  const logoGovernoH = 12; // Governo: menor pois é muito horizontal
  const logoGovernoW = logoGovernoH * 3.69; // ~44mm (proporção 3.69:1)
  const logoIdjuvH = 18; // IDJuv: altura maior para destaque
  const logoIdjuvW = logoIdjuvH * 1.55; // ~28mm (proporção 1.55:1)
  
  // Centralizar verticalmente ambos os logos no espaço do cabeçalho
  const logoGovernoY = y + (headerHeight - logoGovernoH) / 2;
  const logoIdjuvY = y + (headerHeight - logoIdjuvH) / 2;
  
  // Logo Governo (esquerda)
  try {
    doc.addImage(logoGoverno, 'JPEG', margin, logoGovernoY, logoGovernoW, logoGovernoH);
  } catch (e) {
    console.warn('Logo Governo não carregado');
  }
  
  // Título central
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
  
  // Logo IDJuv (direita)
  try {
    doc.addImage(logoIdjuv, 'PNG', pageWidth - margin - logoIdjuvW, logoIdjuvY, logoIdjuvW, logoIdjuvH);
  } catch (e) {
    console.warn('Logo IDJuv não carregado');
  }

  y += headerHeight;

  // Linha divisória
  doc.setDrawColor(0, 68, 68);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  // ===== IDENTIFICAÇÃO DO SERVIDOR (22mm - reorganizado em 4 linhas) =====
  const boxHeight = 22;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, 'F');
  doc.setDrawColor(220, 225, 230);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, 'S');

  // Função para truncar texto longo
  const truncarTexto = (texto: string, maxWidth: number): string => {
    if (!texto) return '-';
    if (doc.getTextWidth(texto) <= maxWidth) return texto;
    let truncado = texto;
    while (doc.getTextWidth(truncado + '...') > maxWidth && truncado.length > 0) {
      truncado = truncado.slice(0, -1);
    }
    return truncado + '...';
  };

  // Grid de dados do servidor - Layout reorganizado
  const col1 = margin + 4;
  const col2 = margin + contentWidth / 2 + 10;
  const lineSpacing = 4.5;
  
  // ===== LINHA 1: Servidor + Competência =====
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 68, 68);
  doc.text('SERVIDOR:', col1, y + lineSpacing);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 35, 40);
  const nomeMaxWidth = col2 - col1 - 30;
  doc.text(truncarTexto(srv.nome_completo || '-', nomeMaxWidth), col1 + 22, y + lineSpacing);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 68, 68);
  doc.text('COMPETÊNCIA:', col2, y + lineSpacing);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 35, 40);
  doc.text(competencia, col2 + 30, y + lineSpacing);

  // ===== LINHA 2: Matrícula + Cargo =====
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 68, 68);
  doc.text('Matrícula:', col1, y + lineSpacing * 2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 35, 40);
  doc.text(srv.matricula || '-', col1 + 18, y + lineSpacing * 2);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 68, 68);
  doc.text('Cargo:', col1 + 42, y + lineSpacing * 2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 35, 40);
  const cargoMaxWidth = contentWidth - 60;
  doc.text(truncarTexto(srv.cargo || '-', cargoMaxWidth), col1 + 55, y + lineSpacing * 2);

  // ===== LINHA 3: Unidade + Local =====
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 68, 68);
  doc.text('Unidade:', col1, y + lineSpacing * 3);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 35, 40);
  const unidadeMaxWidth = col2 - col1 - 25;
  doc.text(truncarTexto(srv.unidade || '-', unidadeMaxWidth), col1 + 17, y + lineSpacing * 3);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 68, 68);
  doc.text('Local:', col2, y + lineSpacing * 3);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 35, 40);
  const localMaxWidth = contentWidth - (col2 - margin) - 15;
  doc.text(truncarTexto(srv.local_exercicio || srv.unidade || '-', localMaxWidth), col2 + 12, y + lineSpacing * 3);

  // ===== LINHA 4: Regime + Jornada =====
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 68, 68);
  doc.text('Regime:', col1, y + lineSpacing * 4);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 35, 40);
  doc.text(srv.regime || 'Presencial', col1 + 15, y + lineSpacing * 4);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 68, 68);
  doc.text('Jornada:', col1 + 55, y + lineSpacing * 4);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 35, 40);
  doc.text(`${srv.carga_horaria_diaria || 8}h/dia | ${srv.carga_horaria_semanal || 40}h/sem`, col1 + 71, y + lineSpacing * 4);

  y += boxHeight + 4;

  // ===== TABELA DE FREQUÊNCIA (proporcional) =====
  // Calcular altura disponível para tabela
  const assinaturasHeight = 38;
  const rodapeHeight = 10;
  const espacoDisponivel = pageHeight - y - assinaturasHeight - rodapeHeight;
  
  // Altura da linha baseada no espaço disponível
  const headerTableHeight = 7;
  const rowHeight = (espacoDisponivel - headerTableHeight) / ultimoDia;
  
  // Larguras das colunas
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
  registros.forEach((reg, idx) => {
    const isNaoUtil = reg.situacao !== 'util';
    const isWeekend = reg.situacao === 'sabado' || reg.situacao === 'domingo';
    const isFeriado = reg.situacao === 'feriado' || reg.situacao === 'ponto_facultativo' || reg.situacao === 'recesso';
    
    // Fundo alternado e destacado
    if (isFeriado) {
      doc.setFillColor(255, 245, 220);
    } else if (isWeekend) {
      doc.setFillColor(250, 248, 240);
    } else if (idx % 2 === 0) {
      doc.setFillColor(252, 253, 255);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.rect(margin, y, contentWidth, rowHeight, 'F');
    
    // Bordas
    doc.setDrawColor(230, 232, 236);
    doc.setLineWidth(0.1);
    doc.rect(margin, y, contentWidth, rowHeight, 'S');

    const diaNum = parseInt(reg.data.split('-')[2]);
    const centerY = y + rowHeight / 2 + 1;
    colX = margin;
    
    // Dia
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 68, 68);
    doc.setFontSize(7);
    doc.text(String(diaNum).padStart(2, '0'), colX + colWidths.dia / 2, centerY, { align: 'center' });
    colX += colWidths.dia;
    
    // Dia semana
    doc.setFont('helvetica', 'normal');
    if (isWeekend) {
      doc.setTextColor(140, 110, 60);
    } else {
      doc.setTextColor(70, 75, 80);
    }
    doc.text(DIAS_SEMANA_SIGLA[reg.dia_semana], colX + colWidths.diaSemana / 2, centerY, { align: 'center' });
    colX += colWidths.diaSemana;
    
    // Tipo do dia
    const tipoLabel = getTipoDiaAbrev(reg.situacao, reg.tipo_registro);
    if (reg.tipo_registro === 'falta') {
      doc.setTextColor(180, 50, 50);
      doc.setFont('helvetica', 'bold');
    } else if (isNaoUtil) {
      doc.setTextColor(150, 120, 50);
      doc.setFont('helvetica', 'italic');
    } else {
      doc.setTextColor(100, 105, 110);
      doc.setFont('helvetica', 'normal');
    }
    doc.text(tipoLabel, colX + colWidths.tipo / 2, centerY, { align: 'center' });
    colX += colWidths.tipo;
    
    // Entrada
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 55, 60);
    if (data.tipo === 'em_branco' && reg.situacao === 'util' && !reg.tipo_registro) {
      // Linha para preenchimento manual
      doc.setDrawColor(180, 185, 190);
      doc.setLineWidth(0.2);
      doc.line(colX + 3, centerY, colX + colWidths.entrada - 3, centerY);
    } else if (isNaoUtil) {
      doc.setTextColor(180, 180, 180);
      doc.text('—', colX + colWidths.entrada / 2, centerY, { align: 'center' });
    } else {
      doc.text(reg.entrada || '—', colX + colWidths.entrada / 2, centerY, { align: 'center' });
    }
    colX += colWidths.entrada;
    
    // Saída
    if (data.tipo === 'em_branco' && reg.situacao === 'util' && !reg.tipo_registro) {
      doc.setDrawColor(180, 185, 190);
      doc.setLineWidth(0.2);
      doc.line(colX + 3, centerY, colX + colWidths.saida - 3, centerY);
    } else if (isNaoUtil) {
      doc.setTextColor(180, 180, 180);
      doc.text('—', colX + colWidths.saida / 2, centerY, { align: 'center' });
    } else {
      doc.text(reg.saida || '—', colX + colWidths.saida / 2, centerY, { align: 'center' });
    }
    colX += colWidths.saida;
    
    // Linha de assinatura
    if (reg.situacao === 'util' && !reg.tipo_registro) {
      doc.setDrawColor(200, 205, 210);
      doc.setLineWidth(0.15);
      doc.line(colX + 8, centerY, colX + colWidths.assinatura - 8, centerY);
    }

    y += rowHeight;
  });

  // ===== BLOCO DE ASSINATURAS (38mm) =====
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
    'Declaro, para os devidos fins, que as informações constantes nesta folha correspondem à minha efetiva jornada de trabalho no período de referência.',
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
  doc.text(srv.nome_completo || '', margin + 5 + assWidth / 2, y + 18, { align: 'center' });
  
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
  doc.text(data.configAssinatura?.nome_chefia || '', margin + 15 + assWidth + assWidth / 2, y + 18, { align: 'center' });

  // ===== RODAPÉ (8mm) =====
  doc.setDrawColor(220, 225, 230);
  doc.setLineWidth(0.3);
  doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
  
  doc.setTextColor(130, 135, 140);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em: ${data.dataGeracao}`, margin, pageHeight - 6);
  doc.text(`${INSTITUICAO.sigla} - Sistema de Gestão de Pessoas`, pageWidth / 2, pageHeight - 6, { align: 'center' });
  doc.text('Página 1 de 1', pageWidth - margin, pageHeight - 6, { align: 'right' });

  // Salvar ou retornar blob
  const nome = srv.nome_completo.replace(/\s+/g, '_').substring(0, 20);
  const sufixo = data.tipo === 'em_branco' ? '_BRANCO' : '';
  const nomeArquivo = `Frequencia_${nome}_${String(data.competencia.mes).padStart(2, '0')}-${data.competencia.ano}${sufixo}.pdf`;
  
  doc.save(nomeArquivo);
  
  return { doc, nomeArquivo };
};

/**
 * Gera PDF de frequência mensal e retorna como Blob (para upload no storage)
 */
export const generateFrequenciaMensalBlob = async (data: FrequenciaMensalPDFData): Promise<{ blob: Blob; nomeArquivo: string }> => {
  const result = await generateFrequenciaMensalPDFInternal(data);
  const blob = result.doc.output('blob');
  return { blob, nomeArquivo: result.nomeArquivo };
};

/**
 * Função interna que gera o documento sem salvar
 */
const generateFrequenciaMensalPDFInternal = async (data: FrequenciaMensalPDFData): Promise<{ doc: jsPDF; nomeArquivo: string }> => {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  
  const competencia = `${MESES[data.competencia.mes - 1]} de ${data.competencia.ano}`;
  const srv = data.servidor;

  // Gerar dias do mês
  const ultimoDia = getUltimoDiaMes(data.competencia.ano, data.competencia.mes);
  const registros: RegistroDiario[] = [];

  for (let dia = 1; dia <= ultimoDia; dia++) {
    const dataAtual = new Date(data.competencia.ano, data.competencia.mes - 1, dia);
    const dataStr = `${data.competencia.ano}-${String(data.competencia.mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    const { situacao, label } = getSituacaoDia(dataAtual, data.diasNaoUteis);
    const regExist = data.registros?.find(r => r.data === dataStr);

    registros.push({
      data: dataStr,
      dia_semana: dataAtual.getDay(),
      situacao: regExist?.situacao || situacao,
      situacao_label: regExist?.situacao_label || label,
      entrada: regExist?.entrada || regExist?.entrada_manha,
      saida: regExist?.saida || regExist?.saida_tarde || regExist?.saida_manha,
      tipo_registro: regExist?.tipo_registro,
    });
  }

  let y = margin;

  // ===== CABEÇALHO COM LOGOS (28mm) =====
  const headerHeight = 24;
  const logoHeight = 15;
  
  const logoGovWidth = logoHeight * 3.5;
  try {
    doc.addImage(logoGoverno, 'JPEG', margin, y + 1, logoGovWidth, logoHeight);
  } catch (e) {
    console.warn('Logo Governo não carregado');
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
  
  const logoIdjuvWidth = logoHeight * 1.0;
  try {
    doc.addImage(logoIdjuv, 'PNG', pageWidth - margin - logoIdjuvWidth, y + 1, logoIdjuvWidth, logoHeight);
  } catch (e) {
    console.warn('Logo IDJuv não carregado');
  }

  y += headerHeight;

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
  doc.text(srv.nome_completo || '-', col1 + 22, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 68, 68);
  doc.text('COMPETÊNCIA:', col2, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 35, 40);
  doc.text(competencia, col2 + 30, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 68, 68);
  doc.text('Matrícula:', col1, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 35, 40);
  doc.text(srv.matricula || '-', col1 + 18, y + 10);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 68, 68);
  doc.text('Cargo:', col1 + 45, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 35, 40);
  doc.text(srv.cargo || '-', col1 + 58, y + 10);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 68, 68);
  doc.text('Unidade:', col2, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 35, 40);
  doc.text(srv.unidade || '-', col2 + 17, y + 10);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 68, 68);
  doc.text('Regime:', col1, y + 15);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 35, 40);
  doc.text(srv.regime || 'Presencial', col1 + 15, y + 15);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 68, 68);
  doc.text('Jornada:', col1 + 50, y + 15);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 35, 40);
  doc.text(`${srv.carga_horaria_diaria || 8}h/dia | ${srv.carga_horaria_semanal || 40}h/sem`, col1 + 66, y + 15);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 68, 68);
  doc.text('Local:', col2, y + 15);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 35, 40);
  doc.text(srv.local_exercicio || srv.unidade || '-', col2 + 12, y + 15);

  y += 22;

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

  registros.forEach((reg, idx) => {
    const isNaoUtil = reg.situacao !== 'util';
    const isWeekend = reg.situacao === 'sabado' || reg.situacao === 'domingo';
    const isFeriado = reg.situacao === 'feriado' || reg.situacao === 'ponto_facultativo' || reg.situacao === 'recesso';
    
    if (isFeriado) {
      doc.setFillColor(255, 245, 220);
    } else if (isWeekend) {
      doc.setFillColor(250, 248, 240);
    } else if (idx % 2 === 0) {
      doc.setFillColor(252, 253, 255);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.rect(margin, y, contentWidth, rowHeight, 'F');
    
    doc.setDrawColor(230, 232, 236);
    doc.setLineWidth(0.1);
    doc.rect(margin, y, contentWidth, rowHeight, 'S');

    const diaNum = parseInt(reg.data.split('-')[2]);
    const centerY = y + rowHeight / 2 + 1;
    colX = margin;
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 68, 68);
    doc.setFontSize(7);
    doc.text(String(diaNum).padStart(2, '0'), colX + colWidths.dia / 2, centerY, { align: 'center' });
    colX += colWidths.dia;
    
    doc.setFont('helvetica', 'normal');
    if (isWeekend) {
      doc.setTextColor(140, 110, 60);
    } else {
      doc.setTextColor(70, 75, 80);
    }
    doc.text(DIAS_SEMANA_SIGLA[reg.dia_semana], colX + colWidths.diaSemana / 2, centerY, { align: 'center' });
    colX += colWidths.diaSemana;
    
    const tipoLabel = getTipoDiaAbrev(reg.situacao, reg.tipo_registro);
    if (reg.tipo_registro === 'falta') {
      doc.setTextColor(180, 50, 50);
      doc.setFont('helvetica', 'bold');
    } else if (isNaoUtil) {
      doc.setTextColor(150, 120, 50);
      doc.setFont('helvetica', 'italic');
    } else {
      doc.setTextColor(100, 105, 110);
      doc.setFont('helvetica', 'normal');
    }
    doc.text(tipoLabel, colX + colWidths.tipo / 2, centerY, { align: 'center' });
    colX += colWidths.tipo;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 55, 60);
    if (data.tipo === 'em_branco' && reg.situacao === 'util' && !reg.tipo_registro) {
      doc.setDrawColor(180, 185, 190);
      doc.setLineWidth(0.2);
      doc.line(colX + 3, centerY, colX + colWidths.entrada - 3, centerY);
    } else if (isNaoUtil) {
      doc.setTextColor(180, 180, 180);
      doc.text('—', colX + colWidths.entrada / 2, centerY, { align: 'center' });
    } else {
      doc.text(reg.entrada || '—', colX + colWidths.entrada / 2, centerY, { align: 'center' });
    }
    colX += colWidths.entrada;
    
    if (data.tipo === 'em_branco' && reg.situacao === 'util' && !reg.tipo_registro) {
      doc.setDrawColor(180, 185, 190);
      doc.setLineWidth(0.2);
      doc.line(colX + 3, centerY, colX + colWidths.saida - 3, centerY);
    } else if (isNaoUtil) {
      doc.setTextColor(180, 180, 180);
      doc.text('—', colX + colWidths.saida / 2, centerY, { align: 'center' });
    } else {
      doc.text(reg.saida || '—', colX + colWidths.saida / 2, centerY, { align: 'center' });
    }
    colX += colWidths.saida;
    
    if (reg.situacao === 'util' && !reg.tipo_registro) {
      doc.setDrawColor(200, 205, 210);
      doc.setLineWidth(0.15);
      doc.line(colX + 8, centerY, colX + colWidths.assinatura - 8, centerY);
    }

    y += rowHeight;
  });

  // ===== BLOCO DE ASSINATURAS =====
  y += 3;
  
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 10, 1.5, 1.5, 'F');
  doc.setDrawColor(210, 215, 220);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, y, contentWidth, 10, 1.5, 1.5, 'S');
  
  doc.setTextColor(60, 65, 70);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text(
    'Declaro, para os devidos fins, que as informações constantes nesta folha correspondem à minha efetiva jornada de trabalho no período de referência.',
    pageWidth / 2, y + 6, { align: 'center', maxWidth: contentWidth - 10 }
  );
  
  y += 14;
  
  const assWidth = (contentWidth - 20) / 2;
  
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
  doc.text(srv.nome_completo || '', margin + 5 + assWidth / 2, y + 18, { align: 'center' });
  
  doc.setDrawColor(0, 68, 68);
  doc.line(margin + 15 + assWidth, y + 10, margin + 15 + assWidth * 2, y + 10);
  doc.setTextColor(0, 68, 68);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('ASSINATURA DA CHEFIA IMEDIATA', margin + 15 + assWidth + assWidth / 2, y + 14, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 105, 110);
  doc.text(data.configAssinatura?.nome_chefia || '', margin + 15 + assWidth + assWidth / 2, y + 18, { align: 'center' });

  // ===== RODAPÉ =====
  doc.setDrawColor(220, 225, 230);
  doc.setLineWidth(0.3);
  doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
  
  doc.setTextColor(130, 135, 140);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em: ${data.dataGeracao}`, margin, pageHeight - 6);
  doc.text(`${INSTITUICAO.sigla} - Sistema de Gestão de Pessoas`, pageWidth / 2, pageHeight - 6, { align: 'center' });
  doc.text('Página 1 de 1', pageWidth - margin, pageHeight - 6, { align: 'right' });

  const nome = srv.nome_completo.replace(/\s+/g, '_').substring(0, 20);
  const sufixo = data.tipo === 'em_branco' ? '_BRANCO' : '';
  const nomeArquivo = `Frequencia_${nome}_${String(data.competencia.mes).padStart(2, '0')}-${data.competencia.ano}${sufixo}.pdf`;
  
  return { doc, nomeArquivo };
};

// ============================================
// FUNÇÕES AUXILIARES EXPORTADAS
// ============================================

export function gerarRegistrosDiariosBranco(ano: number, mes: number, diasNaoUteis: DiaNaoUtil[]): RegistroDiario[] {
  const ultimoDia = getUltimoDiaMes(ano, mes);
  const registros: RegistroDiario[] = [];

  for (let dia = 1; dia <= ultimoDia; dia++) {
    const data = new Date(ano, mes - 1, dia);
    const dataStr = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    const { situacao, label } = getSituacaoDia(data, diasNaoUteis);

    registros.push({
      data: dataStr,
      dia_semana: data.getDay(),
      situacao,
      situacao_label: label,
      observacao: label,
    });
  }

  return registros;
}

export function calcularResumoMensal(registros: RegistroDiario[], cargaHorariaDiaria: number = 8): ResumoFrequencia {
  let dias_uteis = 0, dias_trabalhados = 0, dias_falta = 0, dias_abono = 0;
  let dias_atestado = 0, dias_ferias = 0, dias_licenca = 0;
  let horas_trabalhadas = 0, horas_abonadas = 0;

  registros.forEach(reg => {
    if (reg.situacao === 'util') {
      dias_uteis++;
      if (reg.tipo_registro === 'normal' || reg.total_horas) {
        dias_trabalhados++;
        horas_trabalhadas += reg.total_horas || cargaHorariaDiaria;
      } else if (reg.tipo_registro === 'falta') dias_falta++;
      else if (reg.tipo_registro === 'atestado') { dias_atestado++; horas_abonadas += cargaHorariaDiaria; }
      else if (reg.tipo_registro === 'ferias') dias_ferias++;
      else if (reg.tipo_registro === 'licenca') dias_licenca++;
      else if (reg.tipo_registro === 'folga' || reg.tipo_registro === 'abono') { dias_abono++; horas_abonadas += cargaHorariaDiaria; }
    }
  });

  return {
    dias_uteis, dias_trabalhados, dias_falta, dias_abono, dias_atestado, dias_ferias, dias_licenca,
    horas_previstas: dias_uteis * cargaHorariaDiaria,
    horas_trabalhadas, horas_abonadas, horas_compensadas: 0,
    saldo_banco_horas: horas_trabalhadas - (dias_uteis * cargaHorariaDiaria - horas_abonadas),
  };
}

/**
 * Geração de PDF de Frequência Mensal Individual
 * 
 * REGRA DE OURO: 1 PÁGINA POR SERVIDOR
 * - Cabeçalho institucional
 * - Grade de frequência com dias do mês
 * - Assinaturas e declaração
 */
import jsPDF from 'jspdf';
import { DIAS_SEMANA_SIGLA, type DiaNaoUtil } from '@/types/frequencia';

// Importar logos e utilitário
import logoGoverno from '@/assets/logo-governo-roraima.jpg';
import logoIdjuv from '@/assets/logo-idjuv-oficial.png';
import { getLogosPDF } from './pdfLogos';

// ============================================
// INTERFACES
// ============================================

export interface RegistroDiario {
  data: string;
  dia_semana: number;
  situacao: 'util' | 'feriado' | 'domingo' | 'sabado' | 'ponto_facultativo' | 'recesso';
  label?: string;
  entrada_manha?: string;
  saida_manha?: string;
  entrada_tarde?: string;
  saida_tarde?: string;
  total_horas?: number;
  observacao?: string;
  tipo_registro?: string;
}

export interface ResumoMensal {
  dias_uteis: number;
  dias_trabalhados: number;
  horas_previstas: number;
  horas_trabalhadas: number;
  faltas: number;
  atrasos: number;
  horas_extras: number;
}

export interface ConfigAssinatura {
  servidor_obrigatoria: boolean;
  chefia_obrigatoria: boolean;
  rh_obrigatoria: boolean;
  texto_declaracao: string;
  nome_chefia?: string;
  cargo_chefia?: string;
}

export interface FrequenciaMensalPDFData {
  tipo: 'em_branco' | 'preenchida';
  competencia: { mes: number; ano: number };
  servidor: {
    id: string;
    nome_completo: string;
    matricula: string;
    cpf?: string;
    cargo?: string;
    unidade?: string;
    regime?: string;
    carga_horaria_diaria?: number;
    carga_horaria_semanal?: number;
  };
  registros?: RegistroDiario[];
  resumo?: ResumoMensal;
  diasNaoUteis: DiaNaoUtil[];
  configAssinatura: ConfigAssinatura;
  statusPeriodo?: {
    status: string;
  };
  dataGeracao: string;
  usuarioGeracao?: string;
}

// ============================================
// CONSTANTES
// ============================================

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const DIAS_SEMANA_SIGLA_PT = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

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

// ============================================
// FUNÇÕES AUXILIARES DE GERAÇÃO
// ============================================

/**
 * Gera os registros diários em branco para o mês
 */
export function gerarRegistrosDiariosBranco(
  ano: number, 
  mes: number, 
  diasNaoUteis: DiaNaoUtil[]
): RegistroDiario[] {
  const registros: RegistroDiario[] = [];
  const ultimoDia = getUltimoDiaMes(ano, mes);

  for (let dia = 1; dia <= ultimoDia; dia++) {
    const data = new Date(ano, mes - 1, dia);
    const dataStr = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    const { situacao, label } = getSituacaoDia(data, diasNaoUteis);

    registros.push({
      data: dataStr,
      dia_semana: data.getDay(),
      situacao: situacao as RegistroDiario['situacao'],
      label,
    });
  }

  return registros;
}

/**
 * Calcula o resumo mensal baseado nos registros
 */
export function calcularResumoMensal(registros: RegistroDiario[], cargaHorariaDiaria: number): ResumoMensal {
  const diasUteis = registros.filter(r => r.situacao === 'util').length;
  const diasTrabalhados = registros.filter(r => r.total_horas && r.total_horas > 0).length;
  const horasPrevistas = diasUteis * cargaHorariaDiaria;
  const horasTrabalhadas = registros.reduce((acc, r) => acc + (r.total_horas || 0), 0);
  
  return {
    dias_uteis: diasUteis,
    dias_trabalhados: diasTrabalhados,
    horas_previstas: horasPrevistas,
    horas_trabalhadas: horasTrabalhadas,
    faltas: diasUteis - diasTrabalhados,
    atrasos: 0, // TODO: calcular baseado em horários esperados
    horas_extras: Math.max(0, horasTrabalhadas - horasPrevistas),
  };
}

// ============================================
// GERADOR PRINCIPAL DO PDF
// ============================================

export interface FrequenciaMensalPDFResult {
  doc: jsPDF;
  nomeArquivo: string;
}

/**
 * Gera o PDF de frequência mensal individual
 */
export async function generateFrequenciaMensalPDF(data: FrequenciaMensalPDFData): Promise<FrequenciaMensalPDFResult> {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  const { tipo, competencia, servidor, registros, resumo, diasNaoUteis, configAssinatura, dataGeracao, usuarioGeracao } = data;
  const competenciaStr = `${MESES[competencia.mes - 1]} de ${competencia.ano}`;
  const ultimoDia = getUltimoDiaMes(competencia.ano, competencia.mes);

  let y = margin;

  // ===== CABEÇALHO COM LOGOS =====
  const headerHeight = 24;
  const logos = getLogosPDF(14);

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
  doc.text(servidor.cargo || '-', col1 + 58, y + 10);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 68, 68);
  doc.text('Unidade:', col2, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 35, 40);
  const unidadeText = (servidor.unidade || '-').substring(0, 40);
  doc.text(unidadeText, col2 + 17, y + 10);

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
  const registrosDias = registros || gerarRegistrosDiariosBranco(competencia.ano, competencia.mes, diasNaoUteis);

  for (let dia = 1; dia <= ultimoDia; dia++) {
    const registroEncontrado = registrosDias.find(r => {
      const diaRegistro = parseInt(r.data.split('-')[2], 10);
      return diaRegistro === dia;
    });

    const dataAtual = new Date(competencia.ano, competencia.mes - 1, dia);
    const situacaoBase = getSituacaoDia(dataAtual, diasNaoUteis);
    
    const registro: RegistroDiario = registroEncontrado || {
      data: `${competencia.ano}-${String(competencia.mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`,
      dia_semana: dataAtual.getDay(),
      situacao: situacaoBase.situacao as RegistroDiario['situacao'],
      label: situacaoBase.label,
    };

    const { situacao, label } = registro.situacao !== 'util' 
      ? { situacao: registro.situacao, label: registro.label }
      : situacaoBase;

    const isNaoUtil = situacao !== 'util';
    const diaSemana = dataAtual.getDay();
    const bgColor = isNaoUtil ? { r: 245, g: 248, b: 250 } : { r: 255, g: 255, b: 255 };
    const textColor = isNaoUtil ? { r: 120, g: 125, b: 130 } : { r: 30, g: 35, b: 40 };

    // Background da linha
    doc.setFillColor(bgColor.r, bgColor.g, bgColor.b);
    doc.rect(margin, y, contentWidth, rowHeight, 'F');

    // Bordas
    doc.setDrawColor(220, 225, 230);
    doc.setLineWidth(0.2);
    doc.rect(margin, y, contentWidth, rowHeight, 'S');

    // Colunas
    colX = margin;
    doc.setTextColor(textColor.r, textColor.g, textColor.b);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');

    // Dia
    doc.text(String(dia).padStart(2, '0'), colX + colWidths.dia / 2, y + rowHeight / 2 + 1, { align: 'center' });
    colX += colWidths.dia;

    // Dia da semana
    doc.text(DIAS_SEMANA_SIGLA_PT[diaSemana], colX + colWidths.diaSemana / 2, y + rowHeight / 2 + 1, { align: 'center' });
    colX += colWidths.diaSemana;

    // Tipo do dia
    let tipoLabel = 'Dia Útil';
    if (situacao === 'feriado') tipoLabel = label || 'Feriado';
    else if (situacao === 'domingo') tipoLabel = 'Domingo';
    else if (situacao === 'sabado') tipoLabel = 'Sábado';
    else if (situacao === 'ponto_facultativo') tipoLabel = 'Ponto Facultativo';
    else if (situacao === 'recesso') tipoLabel = 'Recesso';
    
    if (isNaoUtil) {
      doc.setFont('helvetica', 'italic');
    }
    doc.text(tipoLabel.substring(0, 18), colX + colWidths.tipo / 2, y + rowHeight / 2 + 1, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    colX += colWidths.tipo;

    // Entrada (apenas para dias úteis e se preenchida)
    if (!isNaoUtil && tipo === 'preenchida' && registro.entrada_manha) {
      doc.text(registro.entrada_manha, colX + colWidths.entrada / 2, y + rowHeight / 2 + 1, { align: 'center' });
    }
    colX += colWidths.entrada;

    // Saída (apenas para dias úteis e se preenchida)
    if (!isNaoUtil && tipo === 'preenchida' && registro.saida_tarde) {
      doc.text(registro.saida_tarde, colX + colWidths.saida / 2, y + rowHeight / 2 + 1, { align: 'center' });
    }
    colX += colWidths.saida;

    // Coluna de assinatura (vazia para preenchimento manual)

    y += rowHeight;
  }

  // ===== ÁREA DE ASSINATURAS =====
  y += 4;

  // Declaração
  doc.setFontSize(7);
  doc.setTextColor(60, 65, 70);
  doc.setFont('helvetica', 'italic');
  const textoDeclaracao = configAssinatura.texto_declaracao || 
    'Declaro que as informações acima refletem fielmente a jornada de trabalho exercida no período.';
  doc.text(textoDeclaracao, pageWidth / 2, y, { align: 'center' });

  y += 8;

  // Linhas de assinatura
  const assinaturaWidth = (contentWidth - 20) / 2;
  
  // Assinatura do servidor
  if (configAssinatura.servidor_obrigatoria) {
    doc.setDrawColor(100, 105, 110);
    doc.setLineWidth(0.3);
    doc.line(margin, y, margin + assinaturaWidth, y);
    
    doc.setFontSize(7);
    doc.setTextColor(80, 85, 90);
    doc.setFont('helvetica', 'normal');
    doc.text('Assinatura do Servidor', margin + assinaturaWidth / 2, y + 4, { align: 'center' });
  }

  // Assinatura da chefia
  if (configAssinatura.chefia_obrigatoria) {
    doc.line(pageWidth - margin - assinaturaWidth, y, pageWidth - margin, y);
    doc.text('Assinatura da Chefia Imediata', pageWidth - margin - assinaturaWidth / 2, y + 4, { align: 'center' });
    
    if (configAssinatura.nome_chefia) {
      doc.setFontSize(6);
      doc.text(configAssinatura.nome_chefia, pageWidth - margin - assinaturaWidth / 2, y + 8, { align: 'center' });
    }
  }

  // ===== RODAPÉ =====
  doc.setTextColor(130, 135, 140);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em: ${dataGeracao} | Por: ${usuarioGeracao || 'Sistema'}`, margin, pageHeight - 8);
  doc.text(`${INSTITUICAO.sigla} - Sistema de Gestão de Pessoas`, pageWidth / 2, pageHeight - 8, { align: 'center' });
  doc.text(`${tipo === 'preenchida' ? 'PREENCHIDA' : 'EM BRANCO'}`, pageWidth - margin, pageHeight - 8, { align: 'right' });

  // Nome do arquivo
  const nomeArquivo = `Frequencia_${servidor.nome_completo.replace(/\s+/g, '_')}_${MESES[competencia.mes - 1]}_${competencia.ano}_${tipo}.pdf`;

  return { doc, nomeArquivo };
}

/**
 * Gera o PDF e retorna como Blob para upload
 */
export async function generateFrequenciaMensalBlob(data: FrequenciaMensalPDFData): Promise<{ blob: Blob; nomeArquivo: string }> {
  const { doc, nomeArquivo } = await generateFrequenciaMensalPDF(data);
  const blob = doc.output('blob');
  return { blob, nomeArquivo };
}

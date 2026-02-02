/**
 * Geração de PDF de Frequência Mensal Individual - VERSÃO MELHORADA
 * 
 * MELHORIAS IMPLEMENTADAS:
 * - ✅ Logos proporcionais e bem dimensionados
 * - ✅ Cabeçalho mais espaçado e organizado
 * - ✅ Melhor uso do espaço vertical
 * - ✅ Tabela com altura fixa e consistente
 * - ✅ Tipografia melhorada
 * - ✅ Cores mais harmônicas (atualizado)
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

// Cores do tema institucional
const CORES = {
  primaria: { r: 0, g: 68, b: 68 },        // Verde escuro institucional
  secundaria: { r: 41, g: 128, b: 185 },   // Azul institucional
  texto: { r: 30, g: 35, b: 40 },          // Texto principal
  textoSecundario: { r: 100, g: 105, b: 110 }, // Texto secundário
  border: { r: 200, g: 205, b: 210 },      // Bordas suaves
  bgCinza: { r: 248, g: 250, b: 252 },     // Fundo cinza claro
  bgFeriado: { r: 252, g: 248, b: 245 },   // Fundo para feriados
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
    atrasos: 0,
    horas_extras: Math.max(0, horasTrabalhadas - horasPrevistas),
  };
}

// ============================================
// GERADOR PRINCIPAL DO PDF - MELHORADO
// ============================================

export interface FrequenciaMensalPDFResult {
  doc: jsPDF;
  nomeArquivo: string;
}

/**
 * Gera o PDF de frequência mensal individual com layout melhorado
 */
export async function generateFrequenciaMensalPDF(data: FrequenciaMensalPDFData): Promise<FrequenciaMensalPDFResult> {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15; // Margem aumentada para melhor respiro
  const contentWidth = pageWidth - margin * 2;

  const { tipo, competencia, servidor, registros, diasNaoUteis, configAssinatura, dataGeracao, usuarioGeracao } = data;
  const competenciaStr = `${MESES[competencia.mes - 1]}/${competencia.ano}`;
  const ultimoDia = getUltimoDiaMes(competencia.ano, competencia.mes);

  let y = margin;

  // ===== CABEÇALHO COM LOGOS MELHORADO =====
  // Logos alinhadas verticalmente e com tamanhos proporcionais
  const logoGovernoHeight = 14; // Governo 
  const logoGovernoWidth = logoGovernoHeight * 2.8; // Proporção horizontal
  
  const logoIdjuvHeight = 20; // IDJuv maior
  const logoIdjuvWidth = logoIdjuvHeight * 1.1; // Proporção mais quadrada
  
  // Calcular Y para alinhar verticalmente (centralizar ambas)
  const maxLogoHeight = Math.max(logoGovernoHeight, logoIdjuvHeight);
  const logoGovernoY = y + (maxLogoHeight - logoGovernoHeight) / 2;
  const logoIdjuvY = y + (maxLogoHeight - logoIdjuvHeight) / 2;

  try {
    // Logo do governo (esquerda) - alinhada
    doc.addImage(logoGoverno, 'JPEG', margin + 2, logoGovernoY, logoGovernoWidth, logoGovernoHeight);
    
    // Logo IDJuv (direita) - alinhada
    doc.addImage(logoIdjuv, 'PNG', pageWidth - margin - logoIdjuvWidth - 2, logoIdjuvY, logoIdjuvWidth, logoIdjuvHeight);
  } catch (e) {
    console.warn('Logos não carregados');
  }

  // Título centralizado - melhor espaçamento
  const tituloY = y + maxLogoHeight / 2 - 3;
  doc.setTextColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('FOLHA DE FREQUÊNCIA MENSAL', pageWidth / 2, tituloY, { align: 'center' });

  // Informações institucionais - simplificadas
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(CORES.texto.r, CORES.texto.g, CORES.texto.b);
  doc.text('Governo do Estado de Roraima', pageWidth / 2, tituloY + 5, { align: 'center' });
  
  doc.setFontSize(7.5);
  doc.setTextColor(CORES.textoSecundario.r, CORES.textoSecundario.g, CORES.textoSecundario.b);
  doc.text('Instituto de Desporto, Juventude e Lazer do Estado de Roraima', pageWidth / 2, tituloY + 9.5, { align: 'center' });

  y += maxLogoHeight + 12; // Espaço total do cabeçalho

  // Linha divisória mais elegante
  doc.setDrawColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // ===== IDENTIFICAÇÃO DO SERVIDOR - REDESENHADA =====
  const boxPadding = 5;
  const boxHeight = 26;
  
  // Box com sombra suave
  doc.setFillColor(CORES.bgCinza.r, CORES.bgCinza.g, CORES.bgCinza.b);
  doc.roundedRect(margin, y, contentWidth, boxHeight, 3, 3, 'F');
  
  doc.setDrawColor(CORES.border.r, CORES.border.g, CORES.border.b);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, boxHeight, 3, 3, 'S');

  const infoY = y + boxPadding;
  const col1X = margin + boxPadding;
  const col2X = margin + contentWidth * 0.55;
  const lineHeight = 5.5;

  // Função auxiliar para labels e valores
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
  drawInfoLine('Cargo:', servidor.cargo || '-', col1X + 55, infoY + 4 + lineHeight);

  // Linha 3: Unidade
  drawInfoLine('Unidade:', (servidor.unidade || '-').substring(0, 45), col1X, infoY + 4 + lineHeight * 2);

  // Linha 4: Regime e Jornada
  drawInfoLine('Regime:', servidor.regime || 'Presencial', col1X, infoY + 4 + lineHeight * 3);
  
  const jornada = `${servidor.carga_horaria_diaria || 8}h/dia • ${servidor.carga_horaria_semanal || 40}h/sem`;
  drawInfoLine('Jornada:', jornada, col1X + 50, infoY + 4 + lineHeight * 3);

  y += boxHeight + 8;

  // ===== TABELA DE FREQUÊNCIA - ALTURA FIXA =====
  const tabelaStartY = y;
  const assinaturasHeight = 35;
  const rodapeHeight = 12;
  const espacoDisponivel = pageHeight - y - assinaturasHeight - rodapeHeight - 5;
  
  const headerTableHeight = 8;
  const rowHeight = 5.8; // Altura fixa para melhor consistência
  const maxRows = Math.floor((espacoDisponivel - headerTableHeight) / rowHeight);

  const colWidths = {
    dia: 13,
    diaSemana: 18,
    tipo: 36,
    entrada: 24,
    saida: 24,
    separador: 3, // Espaço extra para separação visual
    assinatura: contentWidth - 118, // Ajustado para compensar o separador
  };

  // Header da tabela com gradiente simulado
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
  
  // Separador visual no cabeçalho (linhas duplas verticais)
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.4);
  doc.line(colX + 0.8, y, colX + 0.8, y + headerTableHeight);
  doc.line(colX + 2.2, y, colX + 2.2, y + headerTableHeight);
  colX += colWidths.separador;
  
  doc.text('ASSINATURA', colX + colWidths.assinatura / 2, headerY, { align: 'center' });

  y += headerTableHeight;

  // Linhas de dados
  const registrosDias = registros || gerarRegistrosDiariosBranco(competencia.ano, competencia.mes, diasNaoUteis);

  for (let dia = 1; dia <= ultimoDia && dia <= maxRows; dia++) {
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
    const isFimDeSemana = diaSemana === 0 || diaSemana === 6;
    
    // Cores diferentes para dias úteis e não úteis
    const bgColor = isNaoUtil 
      ? (situacao === 'feriado' ? CORES.bgFeriado : { r: 250, g: 250, b: 252 })
      : (isFimDeSemana ? { r: 254, g: 254, b: 255 } : { r: 255, g: 255, b: 255 });
    
    const textColor = isNaoUtil 
      ? { r: 140, g: 145, b: 150 } 
      : CORES.texto;

    // Background da linha
    doc.setFillColor(bgColor.r, bgColor.g, bgColor.b);
    doc.rect(margin, y, contentWidth, rowHeight, 'F');

    // Bordas verticais entre colunas
    doc.setDrawColor(CORES.border.r, CORES.border.g, CORES.border.b);
    doc.setLineWidth(0.15);
    
    // Bordas horizontais
    doc.setDrawColor(235, 238, 242);
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
    let tipoLabel = 'Dia Útil';
    if (situacao === 'feriado') tipoLabel = label || 'Feriado';
    else if (situacao === 'domingo') tipoLabel = 'Domingo';
    else if (situacao === 'sabado') tipoLabel = 'Sábado';
    else if (situacao === 'ponto_facultativo') tipoLabel = 'Ponto Facultativo';
    else if (situacao === 'recesso') tipoLabel = 'Recesso';
    
    doc.setFontSize(6.5);
    if (isNaoUtil) {
      doc.setFont('helvetica', 'italic');
    }
    doc.text(tipoLabel.substring(0, 20), colX + colWidths.tipo / 2, textY, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    colX += colWidths.tipo;
    
    doc.line(colX, y, colX, y + rowHeight);

    // Entrada
    if (!isNaoUtil && tipo === 'preenchida' && registro.entrada_manha) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text(registro.entrada_manha, colX + colWidths.entrada / 2, textY, { align: 'center' });
      doc.setFont('helvetica', 'normal');
    }
    colX += colWidths.entrada;
    
    doc.line(colX, y, colX, y + rowHeight);

    // Saída
    if (!isNaoUtil && tipo === 'preenchida' && registro.saida_tarde) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text(registro.saida_tarde, colX + colWidths.saida / 2, textY, { align: 'center' });
      doc.setFont('helvetica', 'normal');
    }
    colX += colWidths.saida;
    
    // SEPARADOR VISUAL entre Saída e Assinatura (linha vertical mais grossa)
    doc.setDrawColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
    doc.setLineWidth(0.8);
    doc.line(colX + colWidths.separador / 2, y, colX + colWidths.separador / 2, y + rowHeight);
    colX += colWidths.separador;

    // Coluna de assinatura
    // Se for dia não útil, desenhar risco diagonal para indicar que não precisa assinar
    if (isNaoUtil) {
      doc.setDrawColor(CORES.textoSecundario.r, CORES.textoSecundario.g, CORES.textoSecundario.b);
      doc.setLineWidth(0.4);
      // Linha diagonal do canto inferior esquerdo ao superior direito
      doc.line(colX + 2, y + rowHeight - 1, colX + colWidths.assinatura - 2, y + 1);
    }

    y += rowHeight;
  }

  // Borda final da tabela
  doc.setDrawColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageWidth - margin, y);

  // ===== ÁREA DE ASSINATURAS - MELHORADA =====
  y += 8;

  // Declaração
  doc.setFontSize(7.5);
  doc.setTextColor(CORES.textoSecundario.r, CORES.textoSecundario.g, CORES.textoSecundario.b);
  doc.setFont('helvetica', 'italic');
  const textoDeclaracao = configAssinatura.texto_declaracao || 
    'Declaro que as informações acima refletem fielmente a jornada de trabalho exercida no período.';
  doc.text(textoDeclaracao, pageWidth / 2, y, { align: 'center', maxWidth: contentWidth - 20 });

  y += 10;

  // Linhas de assinatura com melhor espaçamento
  const assinaturaWidth = (contentWidth - 30) / 2;
  const assinaturaY = y;
  
  // Assinatura do servidor
  if (configAssinatura.servidor_obrigatoria) {
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
    doc.text(servidor.nome_completo, margin + 5 + assinaturaWidth / 2, assinaturaY + 9, { align: 'center' });
  }

  // Assinatura da chefia
  if (configAssinatura.chefia_obrigatoria) {
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
  }

  // ===== RODAPÉ - MELHORADO =====
  const rodapeY = pageHeight - 6;
  doc.setTextColor(CORES.textoSecundario.r, CORES.textoSecundario.g, CORES.textoSecundario.b);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  
  doc.text(`Gerado em ${dataGeracao}`, margin, rodapeY);
  doc.text(`${INSTITUICAO.sigla} - Sistema de Gestão de Pessoas`, pageWidth / 2, rodapeY, { align: 'center' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  const tipoTexto = tipo === 'preenchida' ? 'PREENCHIDA' : 'EM BRANCO';
  doc.text(tipoTexto, pageWidth - margin, rodapeY, { align: 'right' });

  // Nome do arquivo
  const nomeArquivo = `Frequencia_${servidor.nome_completo.replace(/\s+/g, '_')}_${MESES[competencia.mes - 1]}_${competencia.ano}_${tipo}.pdf`;

  return { doc, nomeArquivo };
}

/**
 * Gera o PDF e retorna como Blob para upload
 */
export async function generateFrequenciaMensalBlob(
  data: FrequenciaMensalPDFData
): Promise<{ blob: Blob; nomeArquivo: string }> {
  const { doc, nomeArquivo } = await generateFrequenciaMensalPDF(data);
  const blob = doc.output('blob');
  return { blob, nomeArquivo };
}

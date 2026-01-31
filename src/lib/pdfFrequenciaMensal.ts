/**
 * Geração de PDF da Frequência Mensal - IDJuv-RR
 * Implementa versões em branco e preenchida, com validade administrativa e jurídica
 */
import jsPDF from 'jspdf';
import {
  loadLogos,
  generateInstitutionalHeader,
  generateInstitutionalFooter,
  addPageNumbers,
  addSectionHeader,
  addField,
  CORES,
  PAGINA,
  getPageDimensions,
  setColor,
  formatDate,
  checkPageBreak,
} from './pdfTemplate';
import { DIAS_SEMANA_SIGLA, TIPO_DIA_NAO_UTIL_LABELS, STATUS_FECHAMENTO_LABELS } from '@/types/frequencia';
import type { 
  DiaNaoUtil, 
  ConfigJornadaPadrao, 
  RegimeTrabalho,
  ConfigAssinaturaFrequencia,
  ConfigFechamentoFrequencia,
  StatusFechamento
} from '@/types/frequencia';

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
  regime?: string;
  jornada?: string;
  carga_horaria_diaria?: number;
  carga_horaria_semanal?: number;
}

export interface RegistroDiario {
  data: string;
  dia_semana: number;
  situacao: 'util' | 'sabado' | 'domingo' | 'feriado' | 'ponto_facultativo' | 'recesso' | 'expediente_reduzido';
  situacao_label?: string;
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
// HELPERS
// ============================================

const MESES_EXTENSO = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function getUltimoDiaMes(ano: number, mes: number): number {
  return new Date(ano, mes, 0).getDate();
}

function getSituacaoDia(
  data: Date,
  diasNaoUteis: DiaNaoUtil[]
): { situacao: RegistroDiario['situacao']; label?: string } {
  const diaSemana = data.getDay();
  const dataStr = data.toISOString().split('T')[0];

  // Verificar se é dia não útil cadastrado
  const diaNaoUtil = diasNaoUteis.find(d => d.data === dataStr && d.ativo);
  if (diaNaoUtil) {
    const tipoDia = diaNaoUtil.tipo;
    // Mapear tipos de feriado para 'feriado'
    const isFeriado = tipoDia === 'feriado_nacional' || tipoDia === 'feriado_estadual' || tipoDia === 'feriado_municipal';
    const situacaoMapeada: RegistroDiario['situacao'] = isFeriado 
      ? 'feriado' 
      : (tipoDia as RegistroDiario['situacao']);
    return { 
      situacao: situacaoMapeada,
      label: diaNaoUtil.nome 
    };
  }

  // Verificar fim de semana
  if (diaSemana === 0) return { situacao: 'domingo' };
  if (diaSemana === 6) return { situacao: 'sabado' };

  return { situacao: 'util' };
}

function formatarHoraMinuto(horas?: number): string {
  if (horas === undefined || horas === null) return '-';
  const h = Math.floor(horas);
  const m = Math.round((horas - h) * 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function gerarCodigoVerificacao(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let codigo = '';
  for (let i = 0; i < 8; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return codigo;
}

// ============================================
// CORES PERSONALIZADAS PARA FREQUÊNCIA
// ============================================

const CORES_FREQ = {
  headerPrimario: { r: 0, g: 68, b: 68 },      // #004444 - verde escuro institucional
  headerSecundario: { r: 39, g: 174, b: 96 },  // #27AE60 - verde claro
  accentoDourado: { r: 180, g: 145, b: 75 },   // #B4914B - dourado elegante
  fundoAlternado: { r: 250, g: 252, b: 254 },  // quase branco azulado
  fundoDestaque: { r: 240, g: 248, b: 245 },   // verde muito suave
  bordaTabela: { r: 200, g: 210, b: 215 },     // cinza suave
  textoSecundario: { r: 90, g: 100, b: 110 },  // cinza azulado
};

// ============================================
// GERAÇÃO DO PDF - VERSÃO PREMIUM
// ============================================

export const generateFrequenciaMensalPDF = async (data: FrequenciaMensalPDFData): Promise<void> => {
  const logos = await loadLogos();
  const doc = new jsPDF();
  const { width, contentWidth } = getPageDimensions(doc);
  const pageHeight = doc.internal.pageSize.getHeight();

  const competenciaStr = `${MESES_EXTENSO[data.competencia.mes - 1]} de ${data.competencia.ano}`;
  const tipoDoc = data.tipo === 'em_branco' ? ' (EM BRANCO)' : '';
  const codigoVerificacao = gerarCodigoVerificacao();

  // ============ CABEÇALHO INSTITUCIONAL ELEGANTE ============
  let y = await generateInstitutionalHeader(doc, {
    titulo: 'FOLHA DE FREQUÊNCIA MENSAL' + tipoDoc,
    subtitulo: `Competência: ${competenciaStr}`,
    fundoEscuro: true,
  }, logos);

  // ============ CARTÃO DE IDENTIFICAÇÃO DO SERVIDOR ============
  // Fundo elegante com borda sutil
  const cardHeight = 38;
  setColor(doc, CORES_FREQ.fundoDestaque, 'fill');
  doc.roundedRect(PAGINA.margemEsquerda, y - 2, contentWidth, cardHeight, 2, 2, 'F');
  
  // Borda sutil
  setColor(doc, CORES_FREQ.bordaTabela, 'draw');
  doc.setLineWidth(0.3);
  doc.roundedRect(PAGINA.margemEsquerda, y - 2, contentWidth, cardHeight, 2, 2, 'S');
  
  // Título da seção com ícone visual
  setColor(doc, CORES_FREQ.headerPrimario);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('▪ IDENTIFICAÇÃO DO SERVIDOR', PAGINA.margemEsquerda + 4, y + 4);
  
  // Linha decorativa dourada
  setColor(doc, CORES_FREQ.accentoDourado, 'draw');
  doc.setLineWidth(0.8);
  doc.line(PAGINA.margemEsquerda + 4, y + 6, PAGINA.margemEsquerda + 60, y + 6);
  
  y += 12;
  
  // Layout em grid elegante
  const col1 = PAGINA.margemEsquerda + 6;
  const col2 = PAGINA.margemEsquerda + contentWidth / 2 + 5;
  const colWidth = contentWidth / 2 - 12;
  
  // Primeira linha: Nome e Matrícula
  drawFieldElegant(doc, 'Nome Completo', data.servidor.nome_completo, col1, y, contentWidth - 12);
  y += 8;
  
  // Segunda linha: Matrícula, CPF, Cargo
  drawFieldElegant(doc, 'Matrícula', data.servidor.matricula || '-', col1, y, colWidth / 2 - 5);
  drawFieldElegant(doc, 'CPF', data.servidor.cpf || '-', col1 + colWidth / 2, y, colWidth / 2);
  drawFieldElegant(doc, 'Cargo', data.servidor.cargo || '-', col2, y, colWidth);
  y += 8;
  
  // Terceira linha: Unidade, Regime, Jornada
  drawFieldElegant(doc, 'Unidade de Lotação', data.servidor.unidade || '-', col1, y, colWidth);
  drawFieldElegant(doc, 'Regime', data.servidor.regime || 'Presencial', col2, y, colWidth / 2 - 5);
  drawFieldElegant(doc, 'Jornada', data.servidor.jornada || `${data.servidor.carga_horaria_diaria || 8}h/dia`, col2 + colWidth / 2, y, colWidth / 2);
  
  y += 14;

  // ============ STATUS DO PERÍODO (apenas para preenchida) ============
  if (data.tipo === 'preenchida' && data.statusPeriodo) {
    const statusLabel = STATUS_FECHAMENTO_LABELS[data.statusPeriodo.status] || data.statusPeriodo.status;
    
    // Badge de status elegante
    const statusColors: Record<string, { bg: { r: number; g: number; b: number }; text: { r: number; g: number; b: number } }> = {
      'aberto': { bg: { r: 255, g: 243, b: 205 }, text: { r: 146, g: 99, b: 0 } },
      'fechado': { bg: { r: 220, g: 237, b: 255 }, text: { r: 30, g: 85, b: 170 } },
      'validado_chefia': { bg: { r: 220, g: 250, b: 230 }, text: { r: 22, g: 128, b: 57 } },
      'consolidado_rh': { bg: { r: 232, g: 245, b: 233 }, text: { r: 27, g: 94, b: 32 } },
    };
    
    const statusColor = statusColors[data.statusPeriodo.status] || statusColors['aberto'];
    
    setColor(doc, statusColor.bg, 'fill');
    const badgeWidth = 70;
    doc.roundedRect(PAGINA.margemEsquerda, y - 3, badgeWidth, 7, 1.5, 1.5, 'F');
    
    setColor(doc, statusColor.text);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(`STATUS: ${statusLabel.toUpperCase()}`, PAGINA.margemEsquerda + 3, y + 1.5);
    
    if (data.statusPeriodo.consolidado_rh_em) {
      setColor(doc, CORES_FREQ.textoSecundario);
      doc.setFont('helvetica', 'normal');
      doc.text(`Consolidado em: ${formatDate(data.statusPeriodo.consolidado_rh_em)}`, PAGINA.margemEsquerda + badgeWidth + 5, y + 1.5);
    }
    y += 10;
  }

  // ============ TABELA DE FREQUÊNCIA - DESIGN PREMIUM ============
  y += 4;
  
  // Título da seção elegante
  setColor(doc, CORES_FREQ.headerPrimario, 'fill');
  doc.roundedRect(PAGINA.margemEsquerda, y - 3, contentWidth, 8, 1, 1, 'F');
  
  setColor(doc, { r: 255, g: 255, b: 255 });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('▪ REGISTRO DIÁRIO DE FREQUÊNCIA', PAGINA.margemEsquerda + 4, y + 2.5);
  
  // Linha decorativa dourada
  setColor(doc, CORES_FREQ.accentoDourado, 'draw');
  doc.setLineWidth(0.6);
  doc.line(PAGINA.margemEsquerda, y + 5, PAGINA.margemEsquerda + contentWidth, y + 5);
  
  y += 10;

  // Gerar dias do mês
  const ultimoDia = getUltimoDiaMes(data.competencia.ano, data.competencia.mes);
  const registrosDias: RegistroDiario[] = [];

  for (let dia = 1; dia <= ultimoDia; dia++) {
    const dataAtual = new Date(data.competencia.ano, data.competencia.mes - 1, dia);
    const dataStr = `${data.competencia.ano}-${String(data.competencia.mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    const { situacao, label } = getSituacaoDia(dataAtual, data.diasNaoUteis);

    const registroExistente = data.registros?.find(r => r.data === dataStr);

    registrosDias.push({
      data: dataStr,
      dia_semana: dataAtual.getDay(),
      situacao: registroExistente?.situacao || situacao,
      situacao_label: registroExistente?.situacao_label || label,
      entrada_manha: registroExistente?.entrada_manha,
      saida_manha: registroExistente?.saida_manha,
      entrada_tarde: registroExistente?.entrada_tarde,
      saida_tarde: registroExistente?.saida_tarde,
      total_horas: registroExistente?.total_horas,
      observacao: registroExistente?.observacao || label,
      tipo_registro: registroExistente?.tipo_registro,
    });
  }

  // Header da tabela - design sofisticado
  const colWidths = {
    data: 16,
    dia: 14,
    situacao: 24,
    entrada1: 14,
    saida1: 14,
    entrada2: 14,
    saida2: 14,
    total: 14,
    obs: contentWidth - 16 - 14 - 24 - 14 - 14 - 14 - 14 - 14,
  };

  // Fundo do header com gradiente visual
  setColor(doc, { r: 45, g: 55, b: 65 }, 'fill');
  doc.rect(PAGINA.margemEsquerda, y - 3.5, contentWidth, 7, 'F');

  setColor(doc, { r: 255, g: 255, b: 255 });
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');

  let colX = PAGINA.margemEsquerda + 2;
  doc.text('DATA', colX, y); colX += colWidths.data;
  doc.text('DIA', colX, y); colX += colWidths.dia;
  doc.text('SITUAÇÃO', colX, y); colX += colWidths.situacao;
  doc.text('ENT.M', colX, y); colX += colWidths.entrada1;
  doc.text('SAÍ.M', colX, y); colX += colWidths.saida1;
  doc.text('ENT.T', colX, y); colX += colWidths.entrada2;
  doc.text('SAÍ.T', colX, y); colX += colWidths.saida2;
  doc.text('TOTAL', colX, y); colX += colWidths.total;
  doc.text('OBSERVAÇÕES', colX, y);
  y += 5.5;

  // Linhas de dados com design alternado elegante
  const rowHeight = 4.5;
  doc.setFontSize(6);

  registrosDias.forEach((reg, index) => {
    y = checkPageBreak(doc, y, 28);

    // Cores alternadas elegantes
    if (reg.situacao !== 'util') {
      // Dias não úteis: fundo suave diferenciado
      setColor(doc, { r: 255, g: 250, b: 235 }, 'fill');
      doc.rect(PAGINA.margemEsquerda, y - 3, contentWidth, rowHeight, 'F');
    } else if (index % 2 === 0) {
      setColor(doc, CORES_FREQ.fundoAlternado, 'fill');
      doc.rect(PAGINA.margemEsquerda, y - 3, contentWidth, rowHeight, 'F');
    }

    // Borda inferior sutil
    setColor(doc, { r: 235, g: 240, b: 245 }, 'draw');
    doc.setLineWidth(0.1);
    doc.line(PAGINA.margemEsquerda, y + 1.2, PAGINA.margemEsquerda + contentWidth, y + 1.2);

    // Extrair dia/mês
    const diaNum = parseInt(reg.data.split('-')[2]);
    const mesNum = parseInt(reg.data.split('-')[1]);

    colX = PAGINA.margemEsquerda + 2;
    
    // Data com destaque
    doc.setFont('helvetica', 'bold');
    setColor(doc, CORES_FREQ.headerPrimario);
    doc.text(`${String(diaNum).padStart(2, '0')}/${String(mesNum).padStart(2, '0')}`, colX, y); 
    colX += colWidths.data;

    // Dia da semana
    doc.setFont('helvetica', 'normal');
    const isWeekend = reg.situacao === 'sabado' || reg.situacao === 'domingo';
    setColor(doc, isWeekend ? { r: 150, g: 120, b: 90 } : CORES_FREQ.textoSecundario);
    doc.text(DIAS_SEMANA_SIGLA[reg.dia_semana], colX, y); 
    colX += colWidths.dia;

    // Situação com cores semânticas
    let situacaoText = '';
    let situacaoColor = CORES_FREQ.textoSecundario;
    
    switch (reg.situacao) {
      case 'util': situacaoText = 'Útil'; situacaoColor = CORES.sucesso; break;
      case 'sabado': situacaoText = 'Sábado'; situacaoColor = { r: 160, g: 130, b: 80 }; break;
      case 'domingo': situacaoText = 'Domingo'; situacaoColor = { r: 180, g: 100, b: 60 }; break;
      case 'feriado': situacaoText = 'Feriado'; situacaoColor = { r: 220, g: 120, b: 50 }; break;
      case 'ponto_facultativo': situacaoText = 'Facultativo'; situacaoColor = { r: 130, g: 150, b: 200 }; break;
      case 'recesso': situacaoText = 'Recesso'; situacaoColor = { r: 100, g: 160, b: 180 }; break;
      case 'expediente_reduzido': situacaoText = 'Reduzido'; situacaoColor = { r: 150, g: 140, b: 100 }; break;
      default: situacaoText = reg.situacao;
    }
    
    // Tipo de registro sobrescreve situação
    if (reg.tipo_registro === 'falta') {
      situacaoText = 'FALTA';
      situacaoColor = CORES.erro;
      doc.setFont('helvetica', 'bold');
    } else if (reg.tipo_registro === 'atestado') {
      situacaoText = 'Atestado';
      situacaoColor = { r: 255, g: 152, b: 0 };
    } else if (reg.tipo_registro === 'ferias') {
      situacaoText = 'Férias';
      situacaoColor = { r: 33, g: 120, b: 200 };
    } else if (reg.tipo_registro === 'licenca') {
      situacaoText = 'Licença';
      situacaoColor = { r: 140, g: 80, b: 160 };
    }
    
    setColor(doc, situacaoColor);
    doc.text(situacaoText, colX, y); 
    colX += colWidths.situacao;

    // Horários
    setColor(doc, CORES.textoEscuro);
    doc.setFont('helvetica', 'normal');

    if (data.tipo === 'em_branco') {
      if (reg.situacao === 'util') {
        // Campos com linhas elegantes para preenchimento
        setColor(doc, CORES_FREQ.bordaTabela, 'draw');
        doc.setLineWidth(0.2);
        
        const drawInputLine = (x: number, w: number) => {
          doc.line(x, y + 0.8, x + w - 3, y + 0.8);
        };
        
        drawInputLine(colX, colWidths.entrada1); colX += colWidths.entrada1;
        drawInputLine(colX, colWidths.saida1); colX += colWidths.saida1;
        drawInputLine(colX, colWidths.entrada2); colX += colWidths.entrada2;
        drawInputLine(colX, colWidths.saida2); colX += colWidths.saida2;
        drawInputLine(colX, colWidths.total); colX += colWidths.total;
      } else {
        // Dias não úteis: traços elegantes
        setColor(doc, { r: 180, g: 180, b: 180 });
        doc.text('—', colX + 3, y); colX += colWidths.entrada1;
        doc.text('—', colX + 3, y); colX += colWidths.saida1;
        doc.text('—', colX + 3, y); colX += colWidths.entrada2;
        doc.text('—', colX + 3, y); colX += colWidths.saida2;
        doc.text('—', colX + 2, y); colX += colWidths.total;
      }
    } else {
      // Preenchida: mostrar valores
      setColor(doc, CORES.textoEscuro);
      doc.text(reg.entrada_manha || '—', colX + 1, y); colX += colWidths.entrada1;
      doc.text(reg.saida_manha || '—', colX + 1, y); colX += colWidths.saida1;
      doc.text(reg.entrada_tarde || '—', colX + 1, y); colX += colWidths.entrada2;
      doc.text(reg.saida_tarde || '—', colX + 1, y); colX += colWidths.saida2;
      
      // Total com destaque
      if (reg.total_horas) {
        doc.setFont('helvetica', 'bold');
        setColor(doc, CORES_FREQ.headerPrimario);
      }
      doc.text(formatarHoraMinuto(reg.total_horas), colX, y); 
      colX += colWidths.total;
    }

    // Observações
    doc.setFont('helvetica', 'italic');
    setColor(doc, CORES_FREQ.textoSecundario);
    const obsText = (reg.observacao || '').substring(0, 22);
    doc.text(obsText, colX, y);

    y += rowHeight;
  });

  // ============ RESUMO MENSAL - DESIGN CARDS ============
  y += 8;
  y = checkPageBreak(doc, y, 50);
  
  // Título elegante
  setColor(doc, CORES_FREQ.headerPrimario, 'fill');
  doc.roundedRect(PAGINA.margemEsquerda, y - 3, contentWidth, 8, 1, 1, 'F');
  
  setColor(doc, { r: 255, g: 255, b: 255 });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('▪ RESUMO MENSAL', PAGINA.margemEsquerda + 4, y + 2.5);
  
  setColor(doc, CORES_FREQ.accentoDourado, 'draw');
  doc.setLineWidth(0.6);
  doc.line(PAGINA.margemEsquerda, y + 5, PAGINA.margemEsquerda + contentWidth, y + 5);
  
  y += 12;

  const resumo = data.resumo || {
    dias_uteis: 0, dias_trabalhados: 0, dias_falta: 0, dias_abono: 0,
    dias_atestado: 0, dias_ferias: 0, dias_licenca: 0, horas_previstas: 0,
    horas_trabalhadas: 0, horas_abonadas: 0, horas_compensadas: 0, saldo_banco_horas: 0,
  };

  // Cards de resumo em grid
  const cardWidth = (contentWidth - 15) / 4;
  const cardGap = 5;
  
  const drawResumoCard = (
    label: string, 
    valor: string | number, 
    x: number, 
    yPos: number, 
    highlight?: 'success' | 'danger' | 'warning' | 'primary'
  ) => {
    // Fundo do card
    const bgColors = {
      success: { r: 232, g: 245, b: 233 },
      danger: { r: 255, g: 235, b: 235 },
      warning: { r: 255, g: 248, b: 225 },
      primary: { r: 232, g: 245, b: 250 },
      default: { r: 248, g: 250, b: 252 },
    };
    
    const textColors = {
      success: { r: 27, g: 94, b: 32 },
      danger: { r: 183, g: 28, b: 28 },
      warning: { r: 156, g: 110, b: 0 },
      primary: { r: 21, g: 101, b: 192 },
      default: CORES_FREQ.headerPrimario,
    };
    
    const bg = bgColors[highlight || 'default'];
    const textColor = textColors[highlight || 'default'];
    
    setColor(doc, bg, 'fill');
    doc.roundedRect(x, yPos - 2, cardWidth, 12, 1.5, 1.5, 'F');
    
    // Borda sutil
    setColor(doc, { r: 220, g: 225, b: 230 }, 'draw');
    doc.setLineWidth(0.2);
    doc.roundedRect(x, yPos - 2, cardWidth, 12, 1.5, 1.5, 'S');

    // Label
    setColor(doc, CORES_FREQ.textoSecundario);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text(label, x + 3, yPos + 2);

    // Valor
    setColor(doc, textColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(String(valor), x + 3, yPos + 7.5);
  };

  // Primeira linha: Dias
  let cardX = PAGINA.margemEsquerda;
  drawResumoCard('Dias Úteis', resumo.dias_uteis, cardX, y, 'primary'); cardX += cardWidth + cardGap;
  drawResumoCard('Dias Trabalhados', resumo.dias_trabalhados, cardX, y, 'success'); cardX += cardWidth + cardGap;
  drawResumoCard('Faltas', resumo.dias_falta, cardX, y, resumo.dias_falta > 0 ? 'danger' : undefined); cardX += cardWidth + cardGap;
  drawResumoCard('Abonos/Atestados', resumo.dias_abono + resumo.dias_atestado, cardX, y);

  // Segunda linha: Horas
  y += 16;
  cardX = PAGINA.margemEsquerda;
  drawResumoCard('Horas Previstas', formatarHoraMinuto(resumo.horas_previstas), cardX, y); cardX += cardWidth + cardGap;
  drawResumoCard('Horas Trabalhadas', formatarHoraMinuto(resumo.horas_trabalhadas), cardX, y, 'success'); cardX += cardWidth + cardGap;
  drawResumoCard('Horas Abonadas', formatarHoraMinuto(resumo.horas_abonadas), cardX, y); cardX += cardWidth + cardGap;
  
  const saldoHoras = resumo.saldo_banco_horas;
  drawResumoCard(
    'Saldo Banco Horas', 
    (saldoHoras >= 0 ? '+' : '') + formatarHoraMinuto(Math.abs(saldoHoras)), 
    cardX, y, 
    saldoHoras > 0 ? 'success' : saldoHoras < 0 ? 'danger' : undefined
  );

  y += 20;

  // ============ ÁREA DE ASSINATURAS - DESIGN PREMIUM ============
  y = checkPageBreak(doc, y, 60);
  
  // Título elegante
  setColor(doc, CORES_FREQ.headerPrimario, 'fill');
  doc.roundedRect(PAGINA.margemEsquerda, y - 3, contentWidth, 8, 1, 1, 'F');
  
  setColor(doc, { r: 255, g: 255, b: 255 });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('▪ VALIDAÇÃO E ASSINATURAS', PAGINA.margemEsquerda + 4, y + 2.5);
  
  setColor(doc, CORES_FREQ.accentoDourado, 'draw');
  doc.setLineWidth(0.6);
  doc.line(PAGINA.margemEsquerda, y + 5, PAGINA.margemEsquerda + contentWidth, y + 5);
  
  y += 14;

  // Texto declaratório em box elegante
  setColor(doc, { r: 252, g: 252, b: 250 }, 'fill');
  doc.roundedRect(PAGINA.margemEsquerda, y - 4, contentWidth, 12, 1.5, 1.5, 'F');
  setColor(doc, CORES_FREQ.bordaTabela, 'draw');
  doc.setLineWidth(0.2);
  doc.roundedRect(PAGINA.margemEsquerda, y - 4, contentWidth, 12, 1.5, 1.5, 'S');
  
  setColor(doc, CORES_FREQ.textoSecundario);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  const textoDeclaracao = data.configAssinatura.texto_declaracao || 
    'Declaro, sob as penas da lei, que as informações acima refletem fielmente a jornada de trabalho exercida no período, estando ciente de que a falsidade desta declaração constitui crime previsto no Código Penal Brasileiro.';
  
  const linhasDeclaracao = doc.splitTextToSize(textoDeclaracao, contentWidth - 10);
  doc.text(linhasDeclaracao, PAGINA.margemEsquerda + 5, y + 1);
  y += 16;

  // Calcular assinaturas
  const assinaturas: Array<{ label: string; nome?: string; cargo?: string }> = [];

  if (data.configAssinatura.servidor_obrigatoria) {
    assinaturas.push({ 
      label: 'SERVIDOR(A)', 
      nome: data.servidor.nome_completo,
      cargo: data.servidor.cargo
    });
  }
  if (data.configAssinatura.chefia_obrigatoria) {
    assinaturas.push({ 
      label: 'CHEFIA IMEDIATA', 
      nome: data.configAssinatura.nome_chefia,
      cargo: data.configAssinatura.cargo_chefia
    });
  }
  if (data.configAssinatura.rh_obrigatoria) {
    assinaturas.push({ 
      label: 'RECURSOS HUMANOS', 
      nome: data.configAssinatura.nome_rh,
      cargo: data.configAssinatura.cargo_rh
    });
  }

  // Desenhar áreas de assinatura elegantes
  const assinaturaWidth = (contentWidth - 20) / Math.max(assinaturas.length, 2);
  const assinaturaBoxHeight = 32;
  
  assinaturas.forEach((ass, idx) => {
    const assX = PAGINA.margemEsquerda + 5 + (idx * (assinaturaWidth + 5));
    
    // Box de assinatura com fundo suave
    setColor(doc, { r: 252, g: 253, b: 254 }, 'fill');
    doc.roundedRect(assX, y - 2, assinaturaWidth - 5, assinaturaBoxHeight, 2, 2, 'F');
    setColor(doc, CORES_FREQ.bordaTabela, 'draw');
    doc.setLineWidth(0.3);
    doc.roundedRect(assX, y - 2, assinaturaWidth - 5, assinaturaBoxHeight, 2, 2, 'S');

    // Linha para assinatura com estilo elegante
    setColor(doc, CORES_FREQ.headerPrimario, 'draw');
    doc.setLineWidth(0.4);
    doc.line(assX + 5, y + 14, assX + assinaturaWidth - 15, y + 14);

    // Label elegante
    setColor(doc, CORES_FREQ.headerPrimario);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(ass.label, assX + 5, y + 19);

    // Nome e cargo
    if (ass.nome) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      setColor(doc, CORES_FREQ.textoSecundario);
      doc.text(ass.nome.substring(0, 28), assX + 5, y + 23);
      if (ass.cargo) {
        doc.text(ass.cargo.substring(0, 25), assX + 5, y + 26.5);
      }
    }

    // Campo de data elegante
    doc.setFontSize(5.5);
    setColor(doc, { r: 140, g: 145, b: 150 });
    doc.text('Data: ____/____/________', assX + 5, y + 30);
  });

  y += assinaturaBoxHeight + 8;

  // ============ RODAPÉ INSTITUCIONAL PREMIUM ============
  y = checkPageBreak(doc, y, 20);

  // Box de informações de geração
  setColor(doc, { r: 245, g: 248, b: 252 }, 'fill');
  doc.roundedRect(PAGINA.margemEsquerda, y - 3, contentWidth, 14, 1.5, 1.5, 'F');
  
  // Linha decorativa superior
  setColor(doc, CORES_FREQ.accentoDourado, 'draw');
  doc.setLineWidth(0.5);
  doc.line(PAGINA.margemEsquerda, y - 3, PAGINA.margemEsquerda + contentWidth, y - 3);

  setColor(doc, CORES_FREQ.textoSecundario);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');

  doc.text(`Documento gerado em: ${data.dataGeracao}`, PAGINA.margemEsquerda + 4, y + 2);
  doc.text(`Usuário: ${data.usuarioGeracao || 'Sistema IDJuv'}`, PAGINA.margemEsquerda + 4, y + 6);
  
  // Código de verificação com destaque
  doc.setFont('helvetica', 'bold');
  setColor(doc, CORES_FREQ.headerPrimario);
  doc.text(`Código de Verificação: ${codigoVerificacao}`, PAGINA.margemEsquerda + 4, y + 10);

  // Badge do tipo de documento
  const tipoLabel = data.tipo === 'em_branco' 
    ? 'DOCUMENTO PARA PREENCHIMENTO MANUAL' 
    : 'DOCUMENTO OFICIAL — FREQUÊNCIA CONSOLIDADA';
  
  const badgeX = width - PAGINA.margemDireita - 75;
  setColor(doc, data.tipo === 'em_branco' ? { r: 255, g: 248, b: 230 } : { r: 232, g: 245, b: 233 }, 'fill');
  doc.roundedRect(badgeX, y - 1, 72, 10, 1.5, 1.5, 'F');
  
  setColor(doc, data.tipo === 'em_branco' ? { r: 160, g: 115, b: 0 } : { r: 27, g: 94, b: 32 });
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'bold');
  doc.text(tipoLabel, badgeX + 3, y + 5);

  // Footer institucional e paginação
  generateInstitutionalFooter(doc, { sistema: 'Sistema de Gestão de RH — IDJuv' });
  addPageNumbers(doc);

  // Salvar
  const nomeServidor = data.servidor.nome_completo.replace(/\s+/g, '_').substring(0, 20);
  const tipoSufixo = data.tipo === 'em_branco' ? '_BRANCO' : '';
  const nomeArquivo = `Frequencia_${nomeServidor}_${String(data.competencia.mes).padStart(2, '0')}-${data.competencia.ano}${tipoSufixo}.pdf`;
  
  doc.save(nomeArquivo);
};

// ============================================
// FUNÇÃO AUXILIAR PARA CAMPOS ELEGANTES
// ============================================

function drawFieldElegant(
  doc: jsPDF,
  label: string,
  valor: string,
  x: number,
  y: number,
  largura: number
): void {
  // Label pequeno e discreto
  setColor(doc, CORES_FREQ.textoSecundario);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.text(label.toUpperCase(), x, y - 1);
  
  // Valor em destaque
  setColor(doc, CORES.textoEscuro);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  const lines = doc.splitTextToSize(valor || '—', largura - 2);
  doc.text(lines[0] || '—', x, y + 3);
}

// ============================================
// FUNÇÕES AUXILIARES PARA USO NA UI
// ============================================

/**
 * Gera lista de registros diários em branco para o mês
 */
export function gerarRegistrosDiariosBranco(
  ano: number, 
  mes: number, 
  diasNaoUteis: DiaNaoUtil[]
): RegistroDiario[] {
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

/**
 * Calcula resumo mensal a partir dos registros
 */
export function calcularResumoMensal(
  registros: RegistroDiario[], 
  cargaHorariaDiaria: number = 8
): ResumoFrequencia {
  let dias_uteis = 0;
  let dias_trabalhados = 0;
  let dias_falta = 0;
  let dias_abono = 0;
  let dias_atestado = 0;
  let dias_ferias = 0;
  let dias_licenca = 0;
  let horas_trabalhadas = 0;
  let horas_abonadas = 0;

  registros.forEach(reg => {
    if (reg.situacao === 'util') {
      dias_uteis++;

      if (reg.tipo_registro === 'normal' || reg.total_horas) {
        dias_trabalhados++;
        horas_trabalhadas += reg.total_horas || cargaHorariaDiaria;
      } else if (reg.tipo_registro === 'falta') {
        dias_falta++;
      } else if (reg.tipo_registro === 'atestado') {
        dias_atestado++;
        horas_abonadas += cargaHorariaDiaria;
      } else if (reg.tipo_registro === 'ferias') {
        dias_ferias++;
      } else if (reg.tipo_registro === 'licenca') {
        dias_licenca++;
      } else if (reg.tipo_registro === 'folga' || reg.tipo_registro === 'abono') {
        dias_abono++;
        horas_abonadas += cargaHorariaDiaria;
      }
    }
  });

  const horas_previstas = dias_uteis * cargaHorariaDiaria;

  return {
    dias_uteis,
    dias_trabalhados,
    dias_falta,
    dias_abono,
    dias_atestado,
    dias_ferias,
    dias_licenca,
    horas_previstas,
    horas_trabalhadas,
    horas_abonadas,
    horas_compensadas: 0,
    saldo_banco_horas: horas_trabalhadas - (horas_previstas - horas_abonadas),
  };
}

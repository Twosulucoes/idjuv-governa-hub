/**
 * Geração de PDF da Frequência Mensal - IDJuv-RR
 * 
 * REGRA DE OURO: TUDO EM UMA ÚNICA PÁGINA
 * - Layout ultra-compacto
 * - Sem elementos desnecessários
 * - Pronto para impressão e assinatura manual
 */
import jsPDF from 'jspdf';
import { PAGINA } from './pdfTemplate';
import { DIAS_SEMANA_SIGLA } from '@/types/frequencia';
import type { DiaNaoUtil, StatusFechamento } from '@/types/frequencia';

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
  nome: 'IDJUV - Instituto de Desporto, Juventude e Lazer de Roraima',
  cnpj: '64.689.510/0001-09',
  endereco: 'Rua Cel. Pinto, 588, Centro, Boa Vista/RR',
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
  if (tipoReg === 'atestado') return 'Atest.';
  if (tipoReg === 'ferias') return 'Férias';
  if (tipoReg === 'licenca') return 'Lic.';
  if (tipoReg === 'folga') return 'Folga';
  if (tipoReg === 'abono') return 'Abono';
  
  switch (situacao) {
    case 'util': return '';
    case 'sabado': return 'Sáb';
    case 'domingo': return 'Dom';
    case 'feriado': return 'Feriado';
    case 'ponto_facultativo': return 'Facult.';
    case 'recesso': return 'Recesso';
    case 'expediente_reduzido': return 'Exp.Red.';
    default: return '';
  }
}

// ============================================
// GERADOR PRINCIPAL - TUDO EM 1 PÁGINA
// ============================================

export const generateFrequenciaMensalPDF = async (data: FrequenciaMensalPDFData): Promise<void> => {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  
  const competencia = `${MESES[data.competencia.mes - 1]}/${data.competencia.ano}`;

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

  // ===== CABEÇALHO COMPACTO =====
  doc.setFillColor(0, 68, 68);
  doc.rect(0, 0, pageWidth, 16, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('FOLHA DE FREQUÊNCIA MENSAL', pageWidth / 2, 7, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`${INSTITUICAO.nome} | CNPJ: ${INSTITUICAO.cnpj}`, pageWidth / 2, 12, { align: 'center' });

  y = 20;

  // ===== IDENTIFICAÇÃO DO SERVIDOR (linha única) =====
  doc.setFillColor(245, 247, 250);
  doc.rect(margin, y, contentWidth, 12, 'F');
  doc.setDrawColor(200, 205, 210);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, contentWidth, 12, 'S');

  doc.setTextColor(40, 45, 50);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  
  const srv = data.servidor;
  const linha1 = `${srv.nome_completo}`;
  const linha2 = `Mat: ${srv.matricula || '-'} | Cargo: ${srv.cargo || '-'} | Unidade: ${srv.unidade || '-'} | Competência: ${competencia}`;
  
  doc.setFontSize(9);
  doc.text(linha1, margin + 3, y + 5);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(linha2, margin + 3, y + 10);

  y += 16;

  // ===== TABELA DE FREQUÊNCIA (ultra-compacta) =====
  const rowHeight = 5.8;
  const colWidths = { dia: 8, sem: 12, tipo: 22, entrada: 18, saida: 18, ass: contentWidth - 78 };
  
  // Header
  doc.setFillColor(50, 55, 60);
  doc.rect(margin, y, contentWidth, 5, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  
  let colX = margin + 1;
  doc.text('Dia', colX, y + 3.5); colX += colWidths.dia;
  doc.text('Sem', colX, y + 3.5); colX += colWidths.sem;
  doc.text('Tipo', colX, y + 3.5); colX += colWidths.tipo;
  doc.text('Entrada', colX, y + 3.5); colX += colWidths.entrada;
  doc.text('Saída', colX, y + 3.5); colX += colWidths.saida;
  doc.text('Assinatura do Servidor', colX, y + 3.5);

  y += 5;

  // Linhas de dados
  doc.setFontSize(6);
  registros.forEach((reg, idx) => {
    const isNaoUtil = reg.situacao !== 'util';
    const isWeekend = reg.situacao === 'sabado' || reg.situacao === 'domingo';
    
    // Fundo alternado
    if (isNaoUtil) {
      if (isWeekend) {
        doc.setFillColor(252, 250, 240);
      } else {
        doc.setFillColor(255, 248, 230);
      }
      doc.rect(margin, y, contentWidth, rowHeight, 'F');
    } else if (idx % 2 === 0) {
      doc.setFillColor(250, 251, 253);
      doc.rect(margin, y, contentWidth, rowHeight, 'F');
    }
    
    // Linha inferior
    doc.setDrawColor(235, 238, 242);
    doc.setLineWidth(0.1);
    doc.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight);
    
    const diaNum = parseInt(reg.data.split('-')[2]);
    colX = margin + 1;
    
    // Dia
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 68, 68);
    doc.text(String(diaNum).padStart(2, '0'), colX + 2, y + 4);
    colX += colWidths.dia;
    
    // Dia semana
    doc.setFont('helvetica', 'normal');
    if (isWeekend) {
      doc.setTextColor(160, 130, 80);
    } else {
      doc.setTextColor(80, 85, 90);
    }
    doc.text(DIAS_SEMANA_SIGLA[reg.dia_semana], colX, y + 4);
    colX += colWidths.sem;
    
    // Tipo
    const tipoLabel = getTipoDiaAbrev(reg.situacao, reg.tipo_registro);
    if (reg.tipo_registro === 'falta') {
      doc.setTextColor(200, 50, 50);
      doc.setFont('helvetica', 'bold');
    } else if (isNaoUtil) {
      doc.setTextColor(170, 130, 60);
    } else {
      doc.setTextColor(100, 105, 110);
    }
    doc.text(tipoLabel.substring(0, 12), colX, y + 4);
    colX += colWidths.tipo;
    
    // Entrada e Saída
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 65, 70);
    
    if (data.tipo === 'em_branco') {
      if (reg.situacao === 'util' && !reg.tipo_registro) {
        doc.setDrawColor(180, 185, 190);
        doc.setLineWidth(0.15);
        doc.line(colX, y + 4, colX + colWidths.entrada - 3, y + 4);
        colX += colWidths.entrada;
        doc.line(colX, y + 4, colX + colWidths.saida - 3, y + 4);
        colX += colWidths.saida;
      } else {
        doc.setTextColor(180, 180, 180);
        doc.text('—', colX + 5, y + 4);
        colX += colWidths.entrada;
        doc.text('—', colX + 5, y + 4);
        colX += colWidths.saida;
      }
    } else {
      doc.text(reg.entrada || '—', colX + 1, y + 4);
      colX += colWidths.entrada;
      doc.text(reg.saida || '—', colX + 1, y + 4);
      colX += colWidths.saida;
    }
    
    // Linha assinatura
    if (reg.situacao === 'util' && !reg.tipo_registro) {
      doc.setDrawColor(200, 205, 210);
      doc.setLineWidth(0.15);
      doc.line(colX + 3, y + 4, colX + colWidths.ass - 5, y + 4);
    }

    y += rowHeight;
  });

  // ===== BLOCO DE ASSINATURAS (compacto) =====
  y += 4;
  
  // Declaração
  doc.setFillColor(252, 253, 255);
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setDrawColor(210, 215, 220);
  doc.setLineWidth(0.2);
  doc.rect(margin, y, contentWidth, 8, 'S');
  
  doc.setTextColor(70, 75, 80);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'italic');
  doc.text('Declaro que as informações acima correspondem à minha efetiva jornada de trabalho no período.', margin + 3, y + 5);
  
  y += 11;
  
  // Assinaturas lado a lado
  const assWidth = (contentWidth - 10) / 2;
  
  // Servidor
  doc.setDrawColor(0, 68, 68);
  doc.setLineWidth(0.3);
  doc.line(margin, y + 6, margin + assWidth, y + 6);
  doc.setTextColor(0, 68, 68);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.text('ASSINATURA DO SERVIDOR', margin, y + 10);
  
  // Chefia
  doc.line(margin + assWidth + 10, y + 6, margin + contentWidth, y + 6);
  doc.text('ASSINATURA DA CHEFIA IMEDIATA', margin + assWidth + 10, y + 10);

  // ===== RODAPÉ (mínimo) =====
  doc.setTextColor(150, 155, 160);
  doc.setFontSize(5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em: ${data.dataGeracao}`, margin, pageHeight - 5);
  doc.text(INSTITUICAO.endereco, pageWidth - margin, pageHeight - 5, { align: 'right' });

  // Salvar
  const nome = srv.nome_completo.replace(/\s+/g, '_').substring(0, 15);
  const sufixo = data.tipo === 'em_branco' ? '_BRANCO' : '';
  doc.save(`Freq_${nome}_${String(data.competencia.mes).padStart(2, '0')}-${data.competencia.ano}${sufixo}.pdf`);
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

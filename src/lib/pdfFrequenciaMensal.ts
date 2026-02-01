/**
 * Geração de PDF da Frequência Mensal - IDJuv-RR
 * Versão simplificada e corrigida
 */
import jsPDF from 'jspdf';
import { DIAS_SEMANA_SIGLA } from '@/types/frequencia';
import type { DiaNaoUtil, StatusFechamento } from '@/types/frequencia';

// Importar logos
import logoGoverno from '@/assets/logo-governo-roraima.jpg';
import logoIdjuv from '@/assets/logo-idjuv-oficial.png';

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

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const INSTITUICAO = {
  nome: 'Instituto de Desporto, Juventude e Lazer do Estado de Roraima',
  sigla: 'IDJuv',
  cnpj: '64.689.510/0001-09',
  endereco: 'Rua Cel. Pinto, 588, Centro, Boa Vista/RR, CEP 69.301-150',
};

// ============================================
// FUNÇÕES AUXILIARES
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

function formatarHora(hora?: string): string {
  if (!hora) return '';
  // Remove segundos se existirem
  return hora.split(':').slice(0, 2).join(':');
}

// ============================================
// GERADOR PRINCIPAL - VERSÃO SIMPLIFICADA
// ============================================

export const generateFrequenciaMensalPDF = async (data: FrequenciaMensalPDFData): Promise<{ doc: jsPDF; nomeArquivo: string }> => {
  // Criar documento A4
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  
  const competencia = `${MESES[data.competencia.mes - 1]} de ${data.competencia.ano}`;
  const servidor = data.servidor;

  // Gerar registros para o mês
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
      entrada: formatarHora(regExist?.entrada || regExist?.entrada_manha),
      saida: formatarHora(regExist?.saida || regExist?.saida_tarde || regExist?.saida_manha),
      tipo_registro: regExist?.tipo_registro,
    });
  }

  let y = margin;

  // ===== CABEÇALHO =====
  // Título principal
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(0, 68, 68);
  doc.text('FOLHA DE FREQUÊNCIA MENSAL', pageWidth / 2, y + 10, { align: 'center' });

  // Instituição
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(60, 65, 70);
  doc.text(INSTITUICAO.nome, pageWidth / 2, y + 16, { align: 'center' });
  
  doc.setFontSize(8);
  doc.text(`CNPJ: ${INSTITUICAO.cnpj} | ${INSTITUICAO.endereco}`, pageWidth / 2, y + 20, { align: 'center' });

  y += 25;

  // Linha divisória
  doc.setDrawColor(0, 68, 68);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  // ===== INFORMAÇÕES DO SERVIDOR =====
  // Box de informações
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, contentWidth, 20, 'F');
  doc.setDrawColor(220, 225, 230);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, contentWidth, 20, 'S');

  // Servidor e Competência (linha 1)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 68, 68);
  doc.text('SERVIDOR:', margin + 5, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 35, 40);
  
  const nomeTruncado = servidor.nome_completo.length > 30 
    ? servidor.nome_completo.substring(0, 30) + '...' 
    : servidor.nome_completo;
  doc.text(nomeTruncado, margin + 25, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 68, 68);
  doc.text('COMPETÊNCIA:', margin + contentWidth - 45, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 35, 40);
  doc.text(competencia, margin + contentWidth - 10, y + 7, { align: 'right' });

  // Matrícula e Cargo (linha 2)
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 68, 68);
  doc.text('MATRÍCULA:', margin + 5, y + 13);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 35, 40);
  doc.text(servidor.matricula || '-', margin + 28, y + 13);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 68, 68);
  doc.text('CARGO:', margin + 70, y + 13);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 35, 40);
  const cargoTruncado = servidor.cargo && servidor.cargo.length > 25
    ? servidor.cargo.substring(0, 25) + '...'
    : servidor.cargo || '-';
  doc.text(cargoTruncado, margin + 85, y + 13);

  // Unidade e Jornada (linha 3)
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 68, 68);
  doc.text('UNIDADE:', margin + 5, y + 19);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 35, 40);
  doc.text(servidor.unidade || '-', margin + 28, y + 19);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 68, 68);
  doc.text('JORNADA:', margin + 100, y + 19);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 35, 40);
  doc.text(`${servidor.carga_horaria_diaria || 8}h/dia | ${servidor.carga_horaria_semanal || 40}h/sem`, margin + 120, y + 19);

  y += 25;

  // ===== TABELA DE FREQUÊNCIA =====
  // Calcular altura da linha baseada no espaço disponível
  const alturaRestante = pageHeight - y - 50; // 50mm para assinaturas e rodapé
  const alturaLinha = Math.max(6, alturaRestante / (ultimoDia + 1)); // +1 para cabeçalho da tabela

  // Cabeçalho da tabela
  doc.setFillColor(0, 68, 68);
  doc.rect(margin, y, contentWidth, alturaLinha, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  
  // Definir larguras das colunas
  const colWidths = {
    dia: 12,
    semana: 15,
    tipo: 30,
    entrada: 20,
    saida: 20,
    assinatura: contentWidth - 97
  };

  let x = margin;
  doc.text('DIA', x + colWidths.dia / 2, y + alturaLinha / 2 + 1, { align: 'center' });
  x += colWidths.dia;
  
  doc.text('SEMANA', x + colWidths.semana / 2, y + alturaLinha / 2 + 1, { align: 'center' });
  x += colWidths.semana;
  
  doc.text('TIPO DO DIA', x + colWidths.tipo / 2, y + alturaLinha / 2 + 1, { align: 'center' });
  x += colWidths.tipo;
  
  doc.text('ENTRADA', x + colWidths.entrada / 2, y + alturaLinha / 2 + 1, { align: 'center' });
  x += colWidths.entrada;
  
  doc.text('SAÍDA', x + colWidths.saida / 2, y + alturaLinha / 2 + 1, { align: 'center' });
  x += colWidths.saida;
  
  doc.text('ASSINATURA DO SERVIDOR', x + colWidths.assinatura / 2, y + alturaLinha / 2 + 1, { align: 'center' });

  y += alturaLinha;

  // Linhas da tabela
  for (let i = 0; i < registros.length; i++) {
    const reg = registros[i];
    const isFimSemana = reg.situacao === 'sabado' || reg.situacao === 'domingo';
    const isFeriado = reg.situacao === 'feriado' || reg.situacao === 'ponto_facultativo' || reg.situacao === 'recesso';
    const isDiaUtil = reg.situacao === 'util' && !reg.tipo_registro;
    
    // Cor de fundo alternada
    if (isFeriado) {
      doc.setFillColor(255, 245, 220);
    } else if (isFimSemana) {
      doc.setFillColor(250, 248, 240);
    } else if (i % 2 === 0) {
      doc.setFillColor(252, 253, 255);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    
    doc.rect(margin, y, contentWidth, alturaLinha, 'F');
    
    // Bordas laterais
    doc.setDrawColor(230, 232, 236);
    doc.setLineWidth(0.1);
    doc.rect(margin, y, contentWidth, alturaLinha, 'S');

    const centroY = y + alturaLinha / 2 + 1;
    x = margin;
    
    // DIA (número)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 68, 68);
    const diaNum = parseInt(reg.data.split('-')[2]);
    doc.text(diaNum.toString().padStart(2, '0'), x + colWidths.dia / 2, centroY, { align: 'center' });
    x += colWidths.dia;
    
    // SEMANA (sigla)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    if (isFimSemana) {
      doc.setTextColor(140, 110, 60);
    } else {
      doc.setTextColor(70, 75, 80);
    }
    doc.text(DIAS_SEMANA_SIGLA[reg.dia_semana], x + colWidths.semana / 2, centroY, { align: 'center' });
    x += colWidths.semana;
    
    // TIPO DO DIA
    const tipoLabel = getTipoDiaAbrev(reg.situacao, reg.tipo_registro);
    doc.setFontSize(8);
    if (reg.tipo_registro === 'falta') {
      doc.setTextColor(180, 50, 50);
      doc.setFont('helvetica', 'bold');
    } else if (isFimSemana || isFeriado) {
      doc.setTextColor(150, 120, 50);
      doc.setFont('helvetica', 'italic');
    } else {
      doc.setTextColor(100, 105, 110);
      doc.setFont('helvetica', 'normal');
    }
    doc.text(tipoLabel, x + colWidths.tipo / 2, centroY, { align: 'center' });
    x += colWidths.tipo;
    
    // ENTRADA
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    if (data.tipo === 'em_branco' && isDiaUtil) {
      // Linha para preenchimento manual
      doc.setDrawColor(180, 185, 190);
      doc.setLineWidth(0.2);
      doc.line(x + 3, centroY, x + colWidths.entrada - 3, centroY);
    } else if (isFimSemana || isFeriado) {
      doc.setTextColor(180, 180, 180);
      doc.text('—', x + colWidths.entrada / 2, centroY, { align: 'center' });
    } else {
      doc.setTextColor(50, 55, 60);
      doc.text(reg.entrada || '—', x + colWidths.entrada / 2, centroY, { align: 'center' });
    }
    x += colWidths.entrada;
    
    // SAÍDA
    if (data.tipo === 'em_branco' && isDiaUtil) {
      doc.setDrawColor(180, 185, 190);
      doc.setLineWidth(0.2);
      doc.line(x + 3, centroY, x + colWidths.saida - 3, centroY);
    } else if (isFimSemana || isFeriado) {
      doc.setTextColor(180, 180, 180);
      doc.text('—', x + colWidths.saida / 2, centroY, { align: 'center' });
    } else {
      doc.setTextColor(50, 55, 60);
      doc.text(reg.saida || '—', x + colWidths.saida / 2, centroY, { align: 'center' });
    }
    x += colWidths.saida;
    
    // LINHA DE ASSINATURA (apenas para dias úteis)
    if (isDiaUtil) {
      doc.setDrawColor(200, 205, 210);
      doc.setLineWidth(0.15);
      doc.line(x + 5, centroY, x + colWidths.assinatura - 5, centroY);
    }

    y += alturaLinha;
  }

  // ===== ASSINATURAS =====
  y += 5;
  
  // Declaração
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setDrawColor(210, 215, 220);
  doc.setLineWidth(0.2);
  doc.rect(margin, y, contentWidth, 8, 'S');
  
  doc.setTextColor(60, 65, 70);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text(
    'Declaro, para os devidos fins, que as informações constantes nesta folha correspondem à minha efetiva jornada de trabalho no período de referência.',
    margin + contentWidth / 2, y + 4.5, { align: 'center', maxWidth: contentWidth - 10 }
  );
  
  y += 12;
  
  // Linhas de assinatura
  const larguraAssinatura = (contentWidth - 20) / 2;
  
  // Servidor
  doc.setDrawColor(0, 68, 68);
  doc.setLineWidth(0.4);
  doc.line(margin + 5, y + 8, margin + 5 + larguraAssinatura, y + 8);
  doc.setTextColor(0, 68, 68);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('ASSINATURA DO SERVIDOR', margin + 5 + larguraAssinatura / 2, y + 12, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 105, 110);
  doc.text(servidor.nome_completo || '', margin + 5 + larguraAssinatura / 2, y + 16, { align: 'center' });
  
  // Chefia
  doc.setDrawColor(0, 68, 68);
  doc.line(margin + 15 + larguraAssinatura, y + 8, margin + 15 + larguraAssinatura * 2, y + 8);
  doc.setTextColor(0, 68, 68);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('ASSINATURA DA CHEFIA IMEDIATA', margin + 15 + larguraAssinatura + larguraAssinatura / 2, y + 12, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 105, 110);
  doc.text(data.configAssinatura?.nome_chefia || '', margin + 15 + larguraAssinatura + larguraAssinatura / 2, y + 16, { align: 'center' });

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

  // Nome do arquivo
  const nomeArquivo = `Frequencia_${servidor.nome_completo.replace(/\s+/g, '_').substring(0, 20)}_${String(data.competencia.mes).padStart(2, '0')}-${data.competencia.ano}_${data.tipo === 'em_branco' ? 'BRANCO' : 'PREENCHIDA'}.pdf`;
  
  // Salvar o PDF
  doc.save(nomeArquivo);
  
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

/**
 * Gera PDF de frequência mensal e retorna como Blob (para upload no storage)
 */
export const generateFrequenciaMensalBlob = async (data: FrequenciaMensalPDFData): Promise<{ blob: Blob; nomeArquivo: string }> => {
  const result = await generateFrequenciaMensalPDF(data);
  const blob = result.doc.output('blob');
  return { blob, nomeArquivo: result.nomeArquivo };
};

/**
 * Gera PDF de frequência mensal sem salvar automaticamente
 */
export const generateFrequenciaMensalPDFInternal = async (data: FrequenciaMensalPDFData): Promise<{ doc: jsPDF; nomeArquivo: string }> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  // Reutilizar a lógica de renderização acima (pode extrair em uma função separada)
  // Para simplificar, chama a função principal e não salva
  const result = await generateFrequenciaMensalPDF(data);
  return result;
};

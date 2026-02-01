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

// ============================================
// CONSTANTES GLOBAIS
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
} as const;

const CORES = {
  primaria: { r: 0, g: 68, b: 68 },
  texto: { r: 60, g: 65, b: 70 },
  textoEscuro: { r: 30, g: 35, b: 40 },
  fundoCabecalho: { r: 248, g: 250, b: 252 },
  bordaCabecalho: { r: 220, g: 225, b: 230 },
  feriado: { r: 255, g: 245, b: 220 },
  fimSemana: { r: 250, g: 248, b: 240 },
  linhaPar: { r: 252, g: 253, b: 255 },
  linhaImpar: { r: 255, g: 255, b: 255 },
  falta: { r: 180, g: 50, b: 50 },
  fimSemanaTexto: { r: 140, g: 110, b: 60 },
  naoUtilTexto: { r: 150, g: 120, b: 50 },
  cinzaClaro: { r: 180, g: 185, b: 190 },
  linhaAssinatura: { r: 200, g: 205, b: 210 },
  rodape: { r: 130, g: 135, b: 140 },
} as const;

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
  versao?: string;
  dataVersao?: string;
  metadados?: {
    geradoEm: string;
    usuario: string;
    tipoDocumento: 'em_branco' | 'preenchida';
    qualidade?: 'normal' | 'alta';
  };
}

// ============================================
// HELPERS
// ============================================

function getImageAspectRatioFromDoc(doc: jsPDF, src: string, fallback: number): number {
  try {
    const props = doc.getImageProperties(src);
    const w = (props as unknown as { width?: number }).width;
    const h = (props as unknown as { height?: number }).height;
    if (!w || !h) return fallback;
    return w / h;
  } catch {
    return fallback;
  }
}

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

function parsearDataString(dataStr: string): Date | null {
  try {
    const [ano, mes, dia] = dataStr.split('-').map(Number);
    return new Date(ano, mes - 1, dia);
  } catch {
    return null;
  }
}

function truncarTexto(doc: jsPDF, texto: string, maxWidth: number): string {
  if (!texto) return '-';
  if (doc.getTextWidth(texto) <= maxWidth) return texto;
  
  let truncado = texto;
  const ellipsis = '...';
  while (truncado.length > 0 && doc.getTextWidth(truncado + ellipsis) > maxWidth) {
    truncado = truncado.slice(0, -1);
  }
  return truncado + ellipsis;
}

// ============================================
// CLASSE GERADORA DE PDF (Modular)
// ============================================

class GeradorPDFFrequencia {
  private doc: jsPDF;
  private data: FrequenciaMensalPDFData;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private contentWidth: number;
  private y: number;

  constructor(data: FrequenciaMensalPDFData) {
    this.data = data;
    this.doc = new jsPDF('portrait', 'mm', 'a4');
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 12;
    this.contentWidth = this.pageWidth - this.margin * 2;
    this.y = this.margin;
  }

  // ===== MÉTODOS PÚBLICOS =====

  public gerarPDF(): jsPDF {
    try {
      this.adicionarCabecalho();
      this.adicionarIdentificacaoServidor();
      this.adicionarTabelaFrequencia();
      this.adicionarAssinaturas();
      this.adicionarRodape();
      
      return this.doc;
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      throw new Error(`Falha na geração do PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  public async gerarBlob(): Promise<Blob> {
    this.gerarPDF();
    return this.doc.output('blob');
  }

  // ===== MÉTODOS PRIVADOS =====

  private adicionarCabecalho(): void {
    const headerHeight = 24;
    
    // Logos com proporções originais
    const aspectGov = getImageAspectRatioFromDoc(this.doc, logoGoverno, 3.69);
    const aspectIdjuv = getImageAspectRatioFromDoc(this.doc, logoIdjuv, 1.55);

    const logoGovH = 18;
    const logoGovW = logoGovH * aspectGov;
    const logoIdjuvH = 22;
    const logoIdjuvW = logoIdjuvH * aspectIdjuv;

    const logoGovY = this.y + (headerHeight - logoGovH) / 2;
    const logoIdjuvY = this.y + (headerHeight - logoIdjuvH) / 2;

    // Logo Governo (esquerda)
    try {
      this.doc.addImage(logoGoverno, 'JPEG', this.margin, logoGovY, logoGovW, logoGovH);
    } catch (e) {
      console.warn('Logo Governo não carregado:', e);
    }
    
    // Título central
    this.doc.setTextColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    this.doc.text('FOLHA DE FREQUÊNCIA MENSAL', this.pageWidth / 2, this.y + 6, { align: 'center' });
    
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(CORES.texto.r, CORES.texto.g, CORES.texto.b);
    this.doc.text(INSTITUICAO.nome, this.pageWidth / 2, this.y + 12, { align: 'center' });
    this.doc.setFontSize(7);
    this.doc.text(`CNPJ: ${INSTITUICAO.cnpj} | ${INSTITUICAO.endereco}`, this.pageWidth / 2, this.y + 17, { align: 'center' });
    
    // Logo IDJuv (direita)
    try {
      this.doc.addImage(logoIdjuv, 'PNG', this.pageWidth - this.margin - logoIdjuvW, logoIdjuvY, logoIdjuvW, logoIdjuvH);
    } catch (e) {
      console.warn('Logo IDJuv não carregado:', e);
    }

    this.y += headerHeight;

    // Linha divisória
    this.doc.setDrawColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.y, this.pageWidth - this.margin, this.y);
    this.y += 4;
  }

  private adicionarIdentificacaoServidor(): void {
    const boxHeight = 22;
    const servidor = this.data.servidor;
    const competencia = `${MESES[this.data.competencia.mes - 1]} de ${this.data.competencia.ano}`;

    // Fundo do box
    this.doc.setFillColor(CORES.fundoCabecalho.r, CORES.fundoCabecalho.g, CORES.fundoCabecalho.b);
    this.doc.roundedRect(this.margin, this.y, this.contentWidth, boxHeight, 2, 2, 'F');
    this.doc.setDrawColor(CORES.bordaCabecalho.r, CORES.bordaCabecalho.g, CORES.bordaCabecalho.b);
    this.doc.setLineWidth(0.3);
    this.doc.roundedRect(this.margin, this.y, this.contentWidth, boxHeight, 2, 2, 'S');

    // Layout em 4 linhas
    const col1 = this.margin + 4;
    const col2 = this.margin + this.contentWidth / 2 + 10;
    const lineSpacing = 4.5;
    
    this.doc.setFontSize(8);
    
    // Linha 1: Servidor + Competência
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
    this.doc.text('SERVIDOR:', col1, this.y + lineSpacing);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(CORES.textoEscuro.r, CORES.textoEscuro.g, CORES.textoEscuro.b);
    const nomeMaxWidth = col2 - col1 - 30;
    this.doc.text(truncarTexto(this.doc, servidor.nome_completo || '-', nomeMaxWidth), col1 + 22, this.y + lineSpacing);

    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
    this.doc.text('COMPETÊNCIA:', col2, this.y + lineSpacing);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(CORES.textoEscuro.r, CORES.textoEscuro.g, CORES.textoEscuro.b);
    this.doc.text(competencia, col2 + 30, this.y + lineSpacing);

    // Linha 2: Matrícula + Cargo
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
    this.doc.text('Matrícula:', col1, this.y + lineSpacing * 2);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(CORES.textoEscuro.r, CORES.textoEscuro.g, CORES.textoEscuro.b);
    this.doc.text(servidor.matricula || '-', col1 + 18, this.y + lineSpacing * 2);

    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
    this.doc.text('Cargo:', col1 + 42, this.y + lineSpacing * 2);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(CORES.textoEscuro.r, CORES.textoEscuro.g, CORES.textoEscuro.b);
    const cargoMaxWidth = this.contentWidth - 60;
    this.doc.text(truncarTexto(this.doc, servidor.cargo || '-', cargoMaxWidth), col1 + 55, this.y + lineSpacing * 2);

    // Linha 3: Unidade + Local
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
    this.doc.text('Unidade:', col1, this.y + lineSpacing * 3);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(CORES.textoEscuro.r, CORES.textoEscuro.g, CORES.textoEscuro.b);
    const unidadeMaxWidth = col2 - col1 - 25;
    this.doc.text(truncarTexto(this.doc, servidor.unidade || '-', unidadeMaxWidth), col1 + 17, this.y + lineSpacing * 3);

    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
    this.doc.text('Local:', col2, this.y + lineSpacing * 3);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(CORES.textoEscuro.r, CORES.textoEscuro.g, CORES.textoEscuro.b);
    const localMaxWidth = this.contentWidth - (col2 - this.margin) - 15;
    this.doc.text(truncarTexto(this.doc, servidor.local_exercicio || servidor.unidade || '-', localMaxWidth), col2 + 12, this.y + lineSpacing * 3);

    // Linha 4: Regime + Jornada
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
    this.doc.text('Regime:', col1, this.y + lineSpacing * 4);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(CORES.textoEscuro.r, CORES.textoEscuro.g, CORES.textoEscuro.b);
    this.doc.text(servidor.regime || 'Presencial', col1 + 15, this.y + lineSpacing * 4);

    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
    this.doc.text('Jornada:', col1 + 55, this.y + lineSpacing * 4);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(CORES.textoEscuro.r, CORES.textoEscuro.g, CORES.textoEscuro.b);
    this.doc.text(`${servidor.carga_horaria_diaria || 8}h/dia | ${servidor.carga_horaria_semanal || 40}h/sem`, col1 + 71, this.y + lineSpacing * 4);

    this.y += boxHeight + 4;
  }

  private adicionarTabelaFrequencia(): void {
    const ultimoDia = getUltimoDiaMes(this.data.competencia.ano, this.data.competencia.mes);
    const registros = this.gerarRegistrosMensais();
    
    // Calcular altura disponível
    const assinaturasHeight = 38;
    const rodapeHeight = 10;
    const espacoDisponivel = this.pageHeight - this.y - assinaturasHeight - rodapeHeight;
    
    const headerTableHeight = 7;
    const rowHeight = (espacoDisponivel - headerTableHeight) / ultimoDia;
    
    // Larguras das colunas
    const colWidths = {
      dia: 12,
      diaSemana: 16,
      tipo: 32,
      entrada: 22,
      saida: 22,
      assinatura: this.contentWidth - 104,
    };

    // Header da tabela
    this.doc.setFillColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
    this.doc.rect(this.margin, this.y, this.contentWidth, headerTableHeight, 'F');
    
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'bold');
    
    let colX = this.margin;
    this.doc.text('DIA', colX + colWidths.dia / 2, this.y + 4.5, { align: 'center' });
    colX += colWidths.dia;
    this.doc.text('SEMANA', colX + colWidths.diaSemana / 2, this.y + 4.5, { align: 'center' });
    colX += colWidths.diaSemana;
    this.doc.text('TIPO DO DIA', colX + colWidths.tipo / 2, this.y + 4.5, { align: 'center' });
    colX += colWidths.tipo;
    this.doc.text('ENTRADA', colX + colWidths.entrada / 2, this.y + 4.5, { align: 'center' });
    colX += colWidths.entrada;
    this.doc.text('SAÍDA', colX + colWidths.saida / 2, this.y + 4.5, { align: 'center' });
    colX += colWidths.saida;
    this.doc.text('ASSINATURA DO SERVIDOR', colX + colWidths.assinatura / 2, this.y + 4.5, { align: 'center' });

    this.y += headerTableHeight;

    // Linhas de dados
    registros.forEach((reg, idx) => {
      this.desenharLinhaTabela(reg, idx, colWidths, rowHeight);
      this.y += rowHeight;
    });
  }

  private desenharLinhaTabela(reg: RegistroDiario, idx: number, colWidths: any, rowHeight: number): void {
    const isNaoUtil = reg.situacao !== 'util';
    const isWeekend = reg.situacao === 'sabado' || reg.situacao === 'domingo';
    const isFeriado = reg.situacao === 'feriado' || reg.situacao === 'ponto_facultativo' || reg.situacao === 'recesso';
    
    // Definir cor de fundo
    if (isFeriado) {
      this.doc.setFillColor(CORES.feriado.r, CORES.feriado.g, CORES.feriado.b);
    } else if (isWeekend) {
      this.doc.setFillColor(CORES.fimSemana.r, CORES.fimSemana.g, CORES.fimSemana.b);
    } else if (idx % 2 === 0) {
      this.doc.setFillColor(CORES.linhaPar.r, CORES.linhaPar.g, CORES.linhaPar.b);
    } else {
      this.doc.setFillColor(CORES.linhaImpar.r, CORES.linhaImpar.g, CORES.linhaImpar.b);
    }
    
    this.doc.rect(this.margin, this.y, this.contentWidth, rowHeight, 'F');
    
    // Bordas
    this.doc.setDrawColor(CORES.bordaCabecalho.r, CORES.bordaCabecalho.g, CORES.bordaCabecalho.b);
    this.doc.setLineWidth(0.1);
    this.doc.rect(this.margin, this.y, this.contentWidth, rowHeight, 'S');

    const diaNum = parseInt(reg.data.split('-')[2]);
    const centerY = this.y + rowHeight / 2 + 1;
    let colX = this.margin;
    
    // Dia
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
    this.doc.setFontSize(7);
    this.doc.text(String(diaNum).padStart(2, '0'), colX + colWidths.dia / 2, centerY, { align: 'center' });
    colX += colWidths.dia;
    
    // Dia semana
    this.doc.setFont('helvetica', 'normal');
    if (isWeekend) {
      this.doc.setTextColor(CORES.fimSemanaTexto.r, CORES.fimSemanaTexto.g, CORES.fimSemanaTexto.b);
    } else {
      this.doc.setTextColor(CORES.texto.r, CORES.texto.g, CORES.texto.b);
    }
    this.doc.text(DIAS_SEMANA_SIGLA[reg.dia_semana], colX + colWidths.diaSemana / 2, centerY, { align: 'center' });
    colX += colWidths.diaSemana;
    
    // Tipo do dia
    const tipoLabel = getTipoDiaAbrev(reg.situacao, reg.tipo_registro);
    if (reg.tipo_registro === 'falta') {
      this.doc.setTextColor(CORES.falta.r, CORES.falta.g, CORES.falta.b);
      this.doc.setFont('helvetica', 'bold');
    } else if (isNaoUtil) {
      this.doc.setTextColor(CORES.naoUtilTexto.r, CORES.naoUtilTexto.g, CORES.naoUtilTexto.b);
      this.doc.setFont('helvetica', 'italic');
    } else {
      this.doc.setTextColor(CORES.texto.r, CORES.texto.g, CORES.texto.b);
      this.doc.setFont('helvetica', 'normal');
    }
    this.doc.text(tipoLabel, colX + colWidths.tipo / 2, centerY, { align: 'center' });
    colX += colWidths.tipo;
    
    // Entrada
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(CORES.textoEscuro.r, CORES.textoEscuro.g, CORES.textoEscuro.b);
    if (this.data.tipo === 'em_branco' && reg.situacao === 'util' && !reg.tipo_registro) {
      this.doc.setDrawColor(CORES.cinzaClaro.r, CORES.cinzaClaro.g, CORES.cinzaClaro.b);
      this.doc.setLineWidth(0.2);
      this.doc.line(colX + 3, centerY, colX + colWidths.entrada - 3, centerY);
    } else if (isNaoUtil) {
      this.doc.setTextColor(CORES.cinzaClaro.r, CORES.cinzaClaro.g, CORES.cinzaClaro.b);
      this.doc.text('—', colX + colWidths.entrada / 2, centerY, { align: 'center' });
    } else {
      this.doc.text(reg.entrada || '—', colX + colWidths.entrada / 2, centerY, { align: 'center' });
    }
    colX += colWidths.entrada;
    
    // Saída
    if (this.data.tipo === 'em_branco' && reg.situacao === 'util' && !reg.tipo_registro) {
      this.doc.setDrawColor(CORES.cinzaClaro.r, CORES.cinzaClaro.g, CORES.cinzaClaro.b);
      this.doc.setLineWidth(0.2);
      this.doc.line(colX + 3, centerY, colX + colWidths.saida - 3, centerY);
    } else if (isNaoUtil) {
      this.doc.setTextColor(CORES.cinzaClaro.r, CORES.cinzaClaro.g, CORES.cinzaClaro.b);
      this.doc.text('—', colX + colWidths.saida / 2, centerY, { align: 'center' });
    } else {
      this.doc.text(reg.saida || '—', colX + colWidths.saida / 2, centerY, { align: 'center' });
    }
    colX += colWidths.saida;
    
    // Linha de assinatura
    if (reg.situacao === 'util' && !reg.tipo_registro) {
      this.doc.setDrawColor(CORES.linhaAssinatura.r, CORES.linhaAssinatura.g, CORES.linhaAssinatura.b);
      this.doc.setLineWidth(0.15);
      this.doc.line(colX + 8, centerY, colX + colWidths.assinatura - 8, centerY);
    }
  }

  private gerarRegistrosMensais(): RegistroDiario[] {
    const ultimoDia = getUltimoDiaMes(this.data.competencia.ano, this.data.competencia.mes);
    const registros: RegistroDiario[] = [];

    for (let dia = 1; dia <= ultimoDia; dia++) {
      const dataAtual = new Date(this.data.competencia.ano, this.data.competencia.mes - 1, dia);
      const dataStr = `${this.data.competencia.ano}-${String(this.data.competencia.mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
      const { situacao, label } = getSituacaoDia(dataAtual, this.data.diasNaoUteis);
      const regExist = this.data.registros?.find(r => r.data === dataStr);

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

    return registros;
  }

  private adicionarAssinaturas(): void {
    this.y += 3;
    
    // Declaração
    this.doc.setFillColor(CORES.fundoCabecalho.r, CORES.fundoCabecalho.g, CORES.fundoCabecalho.b);
    this.doc.roundedRect(this.margin, this.y, this.contentWidth, 10, 1.5, 1.5, 'F');
    this.doc.setDrawColor(CORES.bordaCabecalho.r, CORES.bordaCabecalho.g, CORES.bordaCabecalho.b);
    this.doc.setLineWidth(0.2);
    this.doc.roundedRect(this.margin, this.y, this.contentWidth, 10, 1.5, 1.5, 'S');
    
    this.doc.setTextColor(CORES.texto.r, CORES.texto.g, CORES.texto.b);
    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'italic');
    this.doc.text(
      this.data.configAssinatura.texto_declaracao ||
      'Declaro, para os devidos fins, que as informações constantes nesta folha correspondem à minha efetiva jornada de trabalho no período de referência.',
      this.pageWidth / 2, this.y + 6, { align: 'center', maxWidth: this.contentWidth - 10 }
    );
    
    this.y += 14;
    
    // Assinaturas lado a lado
    const assWidth = (this.contentWidth - 20) / 2;
    
    // Servidor
    this.doc.setDrawColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
    this.doc.setLineWidth(0.4);
    this.doc.line(this.margin + 5, this.y + 10, this.margin + 5 + assWidth, this.y + 10);
    this.doc.setTextColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(7);
    this.doc.text('ASSINATURA DO SERVIDOR', this.margin + 5 + assWidth / 2, this.y + 14, { align: 'center' });
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(6);
    this.doc.setTextColor(CORES.texto.r, CORES.texto.g, CORES.texto.b);
    this.doc.text(this.data.servidor.nome_completo || '', this.margin + 5 + assWidth / 2, this.y + 18, { align: 'center' });
    
    // Chefia
    this.doc.setDrawColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
    this.doc.line(this.margin + 15 + assWidth, this.y + 10, this.margin + 15 + assWidth * 2, this.y + 10);
    this.doc.setTextColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(7);
    this.doc.text('ASSINATURA DA CHEFIA IMEDIATA', this.margin + 15 + assWidth + assWidth / 2, this.y + 14, { align: 'center' });
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(6);
    this.doc.setTextColor(CORES.texto.r, CORES.texto.g, CORES.texto.b);
    this.doc.text(this.data.configAssinatura?.nome_chefia || '', this.margin + 15 + assWidth + assWidth / 2, this.y + 18, { align: 'center' });
  }

  private adicionarRodape(): void {
    this.doc.setDrawColor(CORES.bordaCabecalho.r, CORES.bordaCabecalho.g, CORES.bordaCabecalho.b);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin, this.pageHeight - 10, this.pageWidth - this.margin, this.pageHeight - 10);
    
    this.doc.setTextColor(CORES.rodape.r, CORES.rodape.g, CORES.rodape.b);
    this.doc.setFontSize(6);
    this.doc.setFont('helvetica', 'normal');
    
    // Informações do rodapé
    const versaoInfo = this.data.versao ? ` v${this.data.versao}` : '';
    const metadadosInfo = this.data.metadados?.qualidade ? ` [${this.data.metadados.qualidade.toUpperCase()}]` : '';
    
    this.doc.text(`Gerado em: ${this.data.dataGeracao}${versaoInfo}${metadadosInfo}`, this.margin, this.pageHeight - 6);
    this.doc.text(`${INSTITUICAO.sigla} - Sistema de Gestão de Pessoas`, this.pageWidth / 2, this.pageHeight - 6, { align: 'center' });
    
    // Adicionar usuário se disponível
    if (this.data.usuarioGeracao) {
      this.doc.setFontSize(5);
      this.doc.text(`Usuário: ${this.data.usuarioGeracao}`, this.margin, this.pageHeight - 3);
    }
    
    this.doc.setFontSize(6);
    this.doc.text('Página 1 de 1', this.pageWidth - this.margin, this.pageHeight - 6, { align: 'right' });
  }

  public getNomeArquivo(): string {
    const nome = this.data.servidor.nome_completo.replace(/\s+/g, '_').substring(0, 20);
    const sufixo = this.data.tipo === 'em_branco' ? '_BRANCO' : '';
    return `Frequencia_${nome}_${String(this.data.competencia.mes).padStart(2, '0')}-${this.data.competencia.ano}${sufixo}.pdf`;
  }
}

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

// ============================================
// FUNÇÕES PRINCIPAIS DE EXPORTAÇÃO
// ============================================

/**
 * Gera PDF de frequência mensal e salva automaticamente
 */
export const generateFrequenciaMensalPDF = async (data: FrequenciaMensalPDFData): Promise<{ doc: jsPDF; nomeArquivo: string }> => {
  try {
    const gerador = new GeradorPDFFrequencia(data);
    const doc = gerador.gerarPDF();
    const nomeArquivo = gerador.getNomeArquivo();
    
    // Salva automaticamente
    doc.save(nomeArquivo);
    
    return { doc, nomeArquivo };
  } catch (error) {
    console.error('Erro na geração do PDF:', error);
    throw new Error(`Falha ao gerar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
};

/**
 * Gera PDF de frequência mensal e retorna como Blob (para upload no storage)
 */
export const generateFrequenciaMensalBlob = async (data: FrequenciaMensalPDFData): Promise<{ blob: Blob; nomeArquivo: string }> => {
  try {
    const gerador = new GeradorPDFFrequencia(data);
    const blob = await gerador.gerarBlob();
    const nomeArquivo = gerador.getNomeArquivo();
    
    return { blob, nomeArquivo };
  } catch (error) {
    console.error('Erro na geração do Blob:', error);
    throw new Error(`Falha ao gerar Blob: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
};

/**
 * Gera PDF de frequência mensal sem salvar (apenas retorna o documento)
 */
export const generateFrequenciaMensalPDFInternal = async (data: FrequenciaMensalPDFData): Promise<{ doc: jsPDF; nomeArquivo: string }> => {
  try {
    const gerador = new GeradorPDFFrequencia(data);
    const doc = gerador.gerarPDF();
    const nomeArquivo = gerador.getNomeArquivo();
    
    return { doc, nomeArquivo };
  } catch (error) {
    console.error('Erro na geração do PDF interno:', error);
    throw new Error(`Falha ao gerar PDF interno: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
};

/**
 * Gera PDF de frequência mensal e retorna URL para visualização
 */
export const generateFrequenciaMensalURL = async (data: FrequenciaMensalPDFData): Promise<{ url: string; nomeArquivo: string }> => {
  try {
    const gerador = new GeradorPDFFrequencia(data);
    const doc = gerador.gerarPDF();
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const nomeArquivo = gerador.getNomeArquivo();
    
    return { url, nomeArquivo };
  } catch (error) {
    console.error('Erro na geração da URL do PDF:', error);
    throw new Error(`Falha ao gerar URL do PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
};

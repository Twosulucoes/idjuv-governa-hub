/**
 * Geração de PDF da Frequência Mensal - IDJuv-RR
 * 
 * REGRAS ABSOLUTAS:
 * - 1 PÁGINA POR SERVIDOR (nunca agrupar dois servidores na mesma página)
 * - Colunas simplificadas: Entrada e Saída (única, não manhã/tarde)
 * - Cabeçalho institucional + identificação do servidor em TODAS as páginas
 * - Conformidade com normas administrativas e auditoria
 */
import jsPDF from 'jspdf';
import {
  loadLogos,
  CORES,
  PAGINA,
  getPageDimensions,
  setColor,
  formatDate,
  LogoCache,
  calculateLogoDimensions,
} from './pdfTemplate';
import { DIAS_SEMANA_SIGLA, TIPO_DIA_NAO_UTIL_LABELS } from '@/types/frequencia';
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
  // Colunas simplificadas - Entrada e Saída única
  entrada?: string;
  saida?: string;
  // Campos legados para compatibilidade
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

const MESES_EXTENSO = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// Dados institucionais
const INSTITUICAO = {
  nome: 'Instituto de Desporto, Juventude e Lazer do Estado de Roraima - IDJuv',
  cnpj: '64.689.510/0001-09',
  endereco: 'Rua Cel. Pinto, nº 588, Centro, Boa Vista/RR, CEP 69.301-150',
  sistema: 'Sistema de Gestão de Pessoas - IDJuv',
};

// Cores específicas para o documento
const CORES_DOC = {
  header: { r: 0, g: 68, b: 68 },       // Verde institucional
  accent: { r: 180, g: 145, b: 75 },    // Dourado
  border: { r: 180, g: 185, b: 190 },   // Cinza bordas
  bgLight: { r: 248, g: 250, b: 252 },  // Fundo claro
  bgAlt: { r: 252, g: 252, b: 250 },    // Alternado
  text: { r: 40, g: 45, b: 50 },        // Texto principal
  textMuted: { r: 100, g: 105, b: 110 },// Texto secundário
  weekend: { r: 255, g: 250, b: 235 },  // Fundo fim de semana
  holiday: { r: 255, g: 245, b: 220 },  // Fundo feriado
};

// ============================================
// HELPERS
// ============================================

function getUltimoDiaMes(ano: number, mes: number): number {
  return new Date(ano, mes, 0).getDate();
}

function getSituacaoDia(
  data: Date,
  diasNaoUteis: DiaNaoUtil[]
): { situacao: RegistroDiario['situacao']; label?: string } {
  const diaSemana = data.getDay();
  const dataStr = data.toISOString().split('T')[0];

  const diaNaoUtil = diasNaoUteis.find(d => d.data === dataStr && d.ativo);
  if (diaNaoUtil) {
    const tipoDia = diaNaoUtil.tipo;
    const isFeriado = tipoDia === 'feriado_nacional' || tipoDia === 'feriado_estadual' || tipoDia === 'feriado_municipal';
    const situacaoMapeada: RegistroDiario['situacao'] = isFeriado 
      ? 'feriado' 
      : (tipoDia as RegistroDiario['situacao']);
    return { situacao: situacaoMapeada, label: diaNaoUtil.nome };
  }

  if (diaSemana === 0) return { situacao: 'domingo' };
  if (diaSemana === 6) return { situacao: 'sabado' };

  return { situacao: 'util' };
}

function getTipoDiaLabel(situacao: RegistroDiario['situacao'], tipo_registro?: string): string {
  if (tipo_registro === 'falta') return 'FALTA';
  if (tipo_registro === 'atestado') return 'Atestado';
  if (tipo_registro === 'ferias') return 'Férias';
  if (tipo_registro === 'licenca') return 'Licença';
  if (tipo_registro === 'folga') return 'Folga';
  if (tipo_registro === 'abono') return 'Abono';
  
  switch (situacao) {
    case 'util': return 'Dia Útil';
    case 'sabado': return 'Sábado';
    case 'domingo': return 'Domingo';
    case 'feriado': return 'Feriado';
    case 'ponto_facultativo': return 'Ponto Facultativo';
    case 'recesso': return 'Recesso';
    case 'expediente_reduzido': return 'Expediente Reduzido';
    default: return situacao;
  }
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
// GERADOR PRINCIPAL - 1 PÁGINA POR SERVIDOR
// ============================================

export const generateFrequenciaMensalPDF = async (data: FrequenciaMensalPDFData): Promise<void> => {
  const logos = await loadLogos();
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - PAGINA.margemEsquerda - PAGINA.margemDireita;
  
  const competenciaStr = `${MESES_EXTENSO[data.competencia.mes - 1]} de ${data.competencia.ano}`;
  const codigoVerificacao = gerarCodigoVerificacao();

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
      // Priorizar campos simplificados, fallback para legados
      entrada: registroExistente?.entrada || registroExistente?.entrada_manha,
      saida: registroExistente?.saida || registroExistente?.saida_tarde || registroExistente?.saida_manha,
      entrada_manha: registroExistente?.entrada_manha,
      saida_manha: registroExistente?.saida_manha,
      entrada_tarde: registroExistente?.entrada_tarde,
      saida_tarde: registroExistente?.saida_tarde,
      total_horas: registroExistente?.total_horas,
      observacao: registroExistente?.observacao || label,
      tipo_registro: registroExistente?.tipo_registro,
    });
  }

  let y = PAGINA.margemSuperior;

  // ===== CABEÇALHO INSTITUCIONAL =====
  y = desenharCabecalhoInstitucional(doc, logos, competenciaStr, y, contentWidth);

  // ===== IDENTIFICAÇÃO DO SERVIDOR =====
  y = desenharIdentificacaoServidor(doc, data.servidor, y, contentWidth);

  // ===== TABELA DE FREQUÊNCIA =====
  y = desenharTabelaFrequencia(doc, registrosDias, data.tipo, y, contentWidth, pageHeight);

  // ===== BLOCO DE ASSINATURAS =====
  y = checkPageBreakAndHeader(doc, y, 55, logos, competenciaStr, data.servidor, contentWidth, pageHeight);
  y = desenharBlocoAssinaturas(doc, data.configAssinatura, data.servidor, y, contentWidth);

  // ===== RODAPÉ COM INFORMAÇÕES DE GERAÇÃO =====
  desenharRodapeGeracao(doc, data, codigoVerificacao, contentWidth);

  // ===== PAGINAÇÃO =====
  adicionarPaginacao(doc);

  // Salvar arquivo
  const nomeServidor = data.servidor.nome_completo.replace(/\s+/g, '_').substring(0, 20);
  const tipoSufixo = data.tipo === 'em_branco' ? '_BRANCO' : '';
  const nomeArquivo = `Frequencia_${nomeServidor}_${String(data.competencia.mes).padStart(2, '0')}-${data.competencia.ano}${tipoSufixo}.pdf`;
  
  doc.save(nomeArquivo);
};

// ============================================
// FUNÇÕES DE DESENHO
// ============================================

function desenharCabecalhoInstitucional(
  doc: jsPDF,
  logos: { governo: LogoCache | null; idjuvOficial: LogoCache | null; idjuvDark: LogoCache | null },
  competenciaStr: string,
  startY: number,
  contentWidth: number
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = startY;

  // Faixa de fundo do cabeçalho
  setColor(doc, CORES_DOC.header, 'fill');
  doc.rect(0, 0, pageWidth, 32, 'F');

  // Linha dourada decorativa
  setColor(doc, CORES_DOC.accent, 'fill');
  doc.rect(0, 32, pageWidth, 1.5, 'F');

  // Logo do Governo (esquerda)
  if (logos.governo?.data) {
    const dims = calculateLogoDimensions(logos.governo.width, logos.governo.height, 16);
    doc.addImage(logos.governo.data, 'PNG', PAGINA.margemEsquerda, 8, dims.width, dims.height);
  }

  // Logo IDJuv (direita)
  if (logos.idjuvOficial?.data) {
    const dims = calculateLogoDimensions(logos.idjuvOficial.width, logos.idjuvOficial.height, 14);
    const logoX = pageWidth - PAGINA.margemDireita - dims.width;
    doc.addImage(logos.idjuvOficial.data, 'PNG', logoX, 9, dims.width, dims.height);
  }

  // Título centralizado
  setColor(doc, { r: 255, g: 255, b: 255 });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('FOLHA DE FREQUÊNCIA MENSAL', pageWidth / 2, 14, { align: 'center' });

  // Competência
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Competência: ${competenciaStr}`, pageWidth / 2, 21, { align: 'center' });

  // Dados institucionais abaixo do cabeçalho
  y = 38;
  setColor(doc, CORES_DOC.textMuted);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text(INSTITUICAO.nome, pageWidth / 2, y, { align: 'center' });
  y += 3.5;
  doc.text(`${INSTITUICAO.endereco} | CNPJ: ${INSTITUICAO.cnpj}`, pageWidth / 2, y, { align: 'center' });
  
  return y + 8;
}

function desenharIdentificacaoServidor(
  doc: jsPDF,
  servidor: ServidorFrequencia,
  startY: number,
  contentWidth: number
): number {
  let y = startY;

  // Fundo do card de identificação
  setColor(doc, CORES_DOC.bgLight, 'fill');
  doc.roundedRect(PAGINA.margemEsquerda, y - 2, contentWidth, 32, 2, 2, 'F');
  
  // Borda
  setColor(doc, CORES_DOC.border, 'draw');
  doc.setLineWidth(0.3);
  doc.roundedRect(PAGINA.margemEsquerda, y - 2, contentWidth, 32, 2, 2, 'S');

  // Título da seção
  setColor(doc, CORES_DOC.header);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('▪ IDENTIFICAÇÃO DO SERVIDOR', PAGINA.margemEsquerda + 4, y + 4);

  // Linha decorativa
  setColor(doc, CORES_DOC.accent, 'draw');
  doc.setLineWidth(0.6);
  doc.line(PAGINA.margemEsquerda + 4, y + 6, PAGINA.margemEsquerda + 65, y + 6);

  y += 11;

  // Layout em grid
  const col1 = PAGINA.margemEsquerda + 5;
  const col2 = PAGINA.margemEsquerda + contentWidth * 0.35;
  const col3 = PAGINA.margemEsquerda + contentWidth * 0.65;

  // Linha 1: Nome completo (ocupando toda largura)
  drawField(doc, 'NOME COMPLETO', servidor.nome_completo, col1, y, contentWidth - 10);
  y += 7;

  // Linha 2: Matrícula, CPF, Cargo
  drawField(doc, 'MATRÍCULA', servidor.matricula || '-', col1, y, 35);
  drawField(doc, 'CPF', servidor.cpf || '-', col2 - 10, y, 40);
  drawField(doc, 'CARGO', servidor.cargo || '-', col3 - 5, y, contentWidth * 0.35);
  y += 7;

  // Linha 3: Unidade, Local, Regime, Jornada
  const col4 = PAGINA.margemEsquerda + contentWidth * 0.5;
  drawField(doc, 'UNIDADE/SETOR', servidor.unidade || '-', col1, y, contentWidth * 0.3);
  drawField(doc, 'LOCAL DE EXERCÍCIO', servidor.local_exercicio || servidor.unidade || '-', col4 - 20, y, contentWidth * 0.25);
  
  const jornadaLabel = servidor.escala_jornada || `${servidor.carga_horaria_diaria || 8}h/dia (${servidor.carga_horaria_semanal || 40}h/sem)`;
  drawField(doc, 'REGIME / JORNADA', `${servidor.regime || 'Presencial'} - ${jornadaLabel}`, col3 + 10, y, contentWidth * 0.32);

  return y + 12;
}

function desenharTabelaFrequencia(
  doc: jsPDF,
  registros: RegistroDiario[],
  tipo: 'em_branco' | 'preenchida',
  startY: number,
  contentWidth: number,
  pageHeight: number
): number {
  let y = startY;

  // Título da seção
  setColor(doc, CORES_DOC.header, 'fill');
  doc.roundedRect(PAGINA.margemEsquerda, y - 2, contentWidth, 7, 1, 1, 'F');
  
  setColor(doc, { r: 255, g: 255, b: 255 });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('▪ REGISTRO DIÁRIO DE FREQUÊNCIA', PAGINA.margemEsquerda + 4, y + 3);

  setColor(doc, CORES_DOC.accent, 'draw');
  doc.setLineWidth(0.5);
  doc.line(PAGINA.margemEsquerda, y + 5, PAGINA.margemEsquerda + contentWidth, y + 5);

  y += 10;

  // Definição de colunas - SIMPLIFICADAS conforme especificação
  const colWidths = {
    dia: 12,           // Dia do mês
    diaSemana: 18,     // Dia da semana
    tipoDia: 35,       // Tipo do dia
    entrada: 22,       // Entrada (única)
    saida: 22,         // Saída (única)
    assinatura: contentWidth - 12 - 18 - 35 - 22 - 22, // Restante para assinatura
  };

  // Header da tabela
  setColor(doc, { r: 50, g: 55, b: 60 }, 'fill');
  doc.rect(PAGINA.margemEsquerda, y - 3, contentWidth, 6, 'F');

  setColor(doc, { r: 255, g: 255, b: 255 });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');

  let colX = PAGINA.margemEsquerda + 2;
  doc.text('DIA', colX, y); colX += colWidths.dia;
  doc.text('DIA SEMANA', colX, y); colX += colWidths.diaSemana;
  doc.text('TIPO DO DIA', colX, y); colX += colWidths.tipoDia;
  doc.text('ENTRADA', colX, y); colX += colWidths.entrada;
  doc.text('SAÍDA', colX, y); colX += colWidths.saida;
  doc.text('ASSINATURA DO SERVIDOR', colX, y);

  y += 5;

  // Linhas de dados
  const rowHeight = 5;
  doc.setFontSize(7);

  registros.forEach((reg, index) => {
    // Verificar quebra de página mantendo espaço para assinaturas
    if (y + rowHeight > pageHeight - 65) {
      doc.addPage();
      y = PAGINA.margemSuperior + 10;
      
      // Re-desenhar header da tabela na nova página
      setColor(doc, { r: 50, g: 55, b: 60 }, 'fill');
      doc.rect(PAGINA.margemEsquerda, y - 3, contentWidth, 6, 'F');

      setColor(doc, { r: 255, g: 255, b: 255 });
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');

      colX = PAGINA.margemEsquerda + 2;
      doc.text('DIA', colX, y); colX += colWidths.dia;
      doc.text('DIA SEMANA', colX, y); colX += colWidths.diaSemana;
      doc.text('TIPO DO DIA', colX, y); colX += colWidths.tipoDia;
      doc.text('ENTRADA', colX, y); colX += colWidths.entrada;
      doc.text('SAÍDA', colX, y); colX += colWidths.saida;
      doc.text('ASSINATURA DO SERVIDOR', colX, y);

      y += 5;
      doc.setFontSize(7);
    }

    // Fundo alternado / especial para dias não úteis
    const isNaoUtil = reg.situacao !== 'util';
    const isWeekend = reg.situacao === 'sabado' || reg.situacao === 'domingo';
    
    if (isNaoUtil) {
      setColor(doc, isWeekend ? CORES_DOC.weekend : CORES_DOC.holiday, 'fill');
      doc.rect(PAGINA.margemEsquerda, y - 3.2, contentWidth, rowHeight, 'F');
    } else if (index % 2 === 0) {
      setColor(doc, { r: 250, g: 252, b: 254 }, 'fill');
      doc.rect(PAGINA.margemEsquerda, y - 3.2, contentWidth, rowHeight, 'F');
    }

    // Linha inferior
    setColor(doc, { r: 230, g: 235, b: 240 }, 'draw');
    doc.setLineWidth(0.1);
    doc.line(PAGINA.margemEsquerda, y + 1.5, PAGINA.margemEsquerda + contentWidth, y + 1.5);

    // Dados da linha
    const diaNum = parseInt(reg.data.split('-')[2]);
    
    colX = PAGINA.margemEsquerda + 2;

    // Dia
    doc.setFont('helvetica', 'bold');
    setColor(doc, CORES_DOC.header);
    doc.text(String(diaNum).padStart(2, '0'), colX + 3, y);
    colX += colWidths.dia;

    // Dia da semana
    doc.setFont('helvetica', 'normal');
    setColor(doc, isWeekend ? { r: 160, g: 120, b: 80 } : CORES_DOC.text);
    doc.text(DIAS_SEMANA_SIGLA[reg.dia_semana], colX, y);
    colX += colWidths.diaSemana;

    // Tipo do dia
    const tipoDiaLabel = getTipoDiaLabel(reg.situacao, reg.tipo_registro);
    if (reg.tipo_registro === 'falta') {
      doc.setFont('helvetica', 'bold');
      setColor(doc, CORES.erro);
    } else if (isNaoUtil) {
      setColor(doc, { r: 180, g: 130, b: 60 });
    } else {
      setColor(doc, CORES.sucesso);
    }
    doc.text(tipoDiaLabel.substring(0, 20), colX, y);
    colX += colWidths.tipoDia;

    // Entrada e Saída
    doc.setFont('helvetica', 'normal');
    setColor(doc, CORES_DOC.text);

    if (tipo === 'em_branco') {
      if (reg.situacao === 'util' && !reg.tipo_registro) {
        // Linha para preenchimento manual
        setColor(doc, CORES_DOC.border, 'draw');
        doc.setLineWidth(0.2);
        doc.line(colX, y + 0.8, colX + colWidths.entrada - 5, y + 0.8);
        colX += colWidths.entrada;
        doc.line(colX, y + 0.8, colX + colWidths.saida - 5, y + 0.8);
        colX += colWidths.saida;
      } else {
        // Dias não úteis - traço
        setColor(doc, { r: 180, g: 180, b: 180 });
        doc.text('—', colX + 6, y);
        colX += colWidths.entrada;
        doc.text('—', colX + 6, y);
        colX += colWidths.saida;
      }
    } else {
      // Modo preenchida - mostrar valores
      const entradaVal = reg.entrada || reg.entrada_manha || '—';
      const saidaVal = reg.saida || reg.saida_tarde || reg.saida_manha || '—';
      
      doc.text(entradaVal, colX + 2, y);
      colX += colWidths.entrada;
      doc.text(saidaVal, colX + 2, y);
      colX += colWidths.saida;
    }

    // Coluna de assinatura - linha para assinatura manual
    if (reg.situacao === 'util' && !reg.tipo_registro) {
      setColor(doc, CORES_DOC.border, 'draw');
      doc.setLineWidth(0.15);
      doc.line(colX + 5, y + 0.8, colX + colWidths.assinatura - 10, y + 0.8);
    }

    y += rowHeight;
  });

  return y + 5;
}

function desenharBlocoAssinaturas(
  doc: jsPDF,
  config: ConfiguracaoAssinaturas,
  servidor: ServidorFrequencia,
  startY: number,
  contentWidth: number
): number {
  let y = startY;

  // Título da seção
  setColor(doc, CORES_DOC.header, 'fill');
  doc.roundedRect(PAGINA.margemEsquerda, y - 2, contentWidth, 7, 1, 1, 'F');
  
  setColor(doc, { r: 255, g: 255, b: 255 });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('▪ VALIDAÇÃO E ASSINATURAS', PAGINA.margemEsquerda + 4, y + 3);

  setColor(doc, CORES_DOC.accent, 'draw');
  doc.setLineWidth(0.5);
  doc.line(PAGINA.margemEsquerda, y + 5, PAGINA.margemEsquerda + contentWidth, y + 5);

  y += 12;

  // Texto declaratório
  setColor(doc, CORES_DOC.bgAlt, 'fill');
  doc.roundedRect(PAGINA.margemEsquerda, y - 3, contentWidth, 10, 1, 1, 'F');
  setColor(doc, CORES_DOC.border, 'draw');
  doc.setLineWidth(0.2);
  doc.roundedRect(PAGINA.margemEsquerda, y - 3, contentWidth, 10, 1, 1, 'S');

  setColor(doc, CORES_DOC.text);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  const textoDeclaracao = config.texto_declaracao || 
    'Declaro que as informações acima correspondem à minha efetiva jornada de trabalho no período.';
  const linhasDeclaracao = doc.splitTextToSize(textoDeclaracao, contentWidth - 10);
  doc.text(linhasDeclaracao, PAGINA.margemEsquerda + 5, y + 2);

  y += 14;

  // Áreas de assinatura - Servidor e Chefia Imediata obrigatórios
  const assinaturaWidth = (contentWidth - 15) / 2;
  const boxHeight = 25;

  // Assinatura do Servidor
  desenharCaixaAssinatura(doc, 'ASSINATURA DO SERVIDOR', servidor.nome_completo, servidor.cargo, PAGINA.margemEsquerda + 5, y, assinaturaWidth, boxHeight);

  // Assinatura da Chefia Imediata
  desenharCaixaAssinatura(doc, 'ASSINATURA DA CHEFIA IMEDIATA', config.nome_chefia, config.cargo_chefia, PAGINA.margemEsquerda + assinaturaWidth + 10, y, assinaturaWidth, boxHeight);

  return y + boxHeight + 5;
}

function desenharCaixaAssinatura(
  doc: jsPDF,
  label: string,
  nome: string | undefined,
  cargo: string | undefined,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  // Fundo da caixa
  setColor(doc, { r: 253, g: 254, b: 255 }, 'fill');
  doc.roundedRect(x, y - 2, width, height, 1.5, 1.5, 'F');
  setColor(doc, CORES_DOC.border, 'draw');
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y - 2, width, height, 1.5, 1.5, 'S');

  // Linha para assinatura
  setColor(doc, CORES_DOC.header, 'draw');
  doc.setLineWidth(0.4);
  doc.line(x + 8, y + 10, x + width - 10, y + 10);

  // Label
  setColor(doc, CORES_DOC.header);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text(label, x + 5, y + 15);

  // Nome e cargo
  if (nome) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    setColor(doc, CORES_DOC.textMuted);
    doc.text(nome.substring(0, 35), x + 5, y + 18.5);
    if (cargo) {
      doc.text(cargo.substring(0, 30), x + 5, y + 21.5);
    }
  }
}

function desenharRodapeGeracao(
  doc: jsPDF,
  data: FrequenciaMensalPDFData,
  codigoVerificacao: string,
  contentWidth: number
): void {
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const y = pageHeight - 18;

  // Linha superior decorativa
  setColor(doc, CORES_DOC.accent, 'draw');
  doc.setLineWidth(0.4);
  doc.line(PAGINA.margemEsquerda, y - 3, PAGINA.margemEsquerda + contentWidth, y - 3);

  // Informações de geração
  setColor(doc, CORES_DOC.textMuted);
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');

  doc.text(`Documento gerado em: ${data.dataGeracao}`, PAGINA.margemEsquerda, y);
  doc.text(`Usuário: ${data.usuarioGeracao || INSTITUICAO.sistema}`, PAGINA.margemEsquerda, y + 3);
  doc.text(`Código de Verificação: ${codigoVerificacao}`, PAGINA.margemEsquerda, y + 6);

  // Sistema
  doc.text(INSTITUICAO.sistema, pageWidth - PAGINA.margemDireita, y + 3, { align: 'right' });
}

function adicionarPaginacao(doc: jsPDF): void {
  const totalPages = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    setColor(doc, CORES_DOC.textMuted);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - PAGINA.margemDireita, pageHeight - 8, { align: 'right' });
  }
}

function checkPageBreakAndHeader(
  doc: jsPDF,
  currentY: number,
  requiredSpace: number,
  logos: { governo: LogoCache | null; idjuvOficial: LogoCache | null; idjuvDark: LogoCache | null },
  competenciaStr: string,
  servidor: ServidorFrequencia,
  contentWidth: number,
  pageHeight: number
): number {
  if (currentY + requiredSpace > pageHeight - 20) {
    doc.addPage();
    return PAGINA.margemSuperior + 10;
  }
  return currentY;
}

function drawField(
  doc: jsPDF,
  label: string,
  valor: string,
  x: number,
  y: number,
  width: number
): void {
  // Label
  setColor(doc, CORES_DOC.textMuted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.text(label, x, y - 1);

  // Valor
  setColor(doc, CORES_DOC.text);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  const truncatedValue = valor.length > Math.floor(width / 2) ? valor.substring(0, Math.floor(width / 2)) + '...' : valor;
  doc.text(truncatedValue || '—', x, y + 3);
}

// ============================================
// FUNÇÕES AUXILIARES EXPORTADAS
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

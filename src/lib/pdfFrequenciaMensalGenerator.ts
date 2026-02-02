/**
 * Geração de PDF de Frequência Mensal Individual - MODELO OFICIAL ÚNICO
 * 
 * ESTRUTURA CONFORME MODELO BASE:
 * - Cabeçalho: Estado de Roraima / IDJuv / DRH
 * - Título: FOLHA INDIVIDUAL DE PRESENÇA
 * - Identificação: Unidade, Servidor, Categoria, Cargo, Frequência, Jornada
 * - Tabela com 2 TURNOS (1º e 2º) quando jornada >= 8h
 * - Tabela com 1 TURNO apenas quando jornada <= 6h
 * - Colunas: DIA | HORA ENTRADA | HORA SAÍDA | RUBRICA SERVIDOR | ABONO CHEFE
 * - Rodapé: Boa Vista - RR, data + Assinaturas
 */
import jsPDF from 'jspdf';
import { DIAS_SEMANA_SIGLA, type DiaNaoUtil } from '@/types/frequencia';

// Importar logos
import logoGoverno from '@/assets/logo-governo-roraima.jpg';
import logoIdjuv from '@/assets/logo-idjuv-oficial.png';

// ============================================
// INTERFACES
// ============================================

export interface RegistroDiario {
  data: string;
  dia_semana: number;
  situacao: 'util' | 'feriado' | 'domingo' | 'sabado' | 'ponto_facultativo' | 'recesso' | 'licenca' | 'ferias';
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
    funcao?: string;
    unidade?: string;
    categoria?: string;
    telefone?: string;
    regime?: string;
    carga_horaria_diaria?: number;
    carga_horaria_semanal?: number;
    frequencia_integral?: boolean;
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
// CONSTANTES (exportadas para uso em lote)
// ============================================

export const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export const INSTITUICAO = {
  nome: 'Instituto de Desporto, Juventude e Lazer do Estado de Roraima',
  sigla: 'IDJuv',
  cnpj: '64.689.510/0001-09',
  endereco: 'Rua Cel. Pinto, 588, Centro, Boa Vista/RR, CEP 69.301-150',
};

// Cores do modelo oficial
export const CORES = {
  preto: { r: 0, g: 0, b: 0 },
  texto: { r: 30, g: 35, b: 40 },
  vermelho: { r: 255, g: 0, b: 0 },
  border: { r: 0, g: 0, b: 0 },
  bgCinza: { r: 248, g: 250, b: 252 },
  bgAmarelo: { r: 255, g: 255, b: 200 },
  primaria: { r: 0, g: 68, b: 68 },
  secundaria: { r: 41, g: 128, b: 185 },
  textoSecundario: { r: 100, g: 105, b: 110 },
  bgFeriado: { r: 252, g: 248, b: 245 },
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
// FUNÇÃO PRINCIPAL DE RENDERIZAÇÃO
// (Usada tanto para individual quanto para lote)
// ============================================

export interface RenderizarPaginaParams {
  doc: jsPDF;
  data: FrequenciaMensalPDFData;
  rodapePersonalizado?: string;
}

/**
 * Renderiza uma página de frequência conforme MODELO OFICIAL BASE
 * Parametrização automática por jornada:
 * - Jornada <= 6h: 1 turno, 1 assinatura
 * - Jornada >= 8h: 2 turnos, 2 assinaturas
 */
export function renderizarPaginaFrequencia(params: RenderizarPaginaParams): void {
  const { doc, data, rodapePersonalizado } = params;
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  const { tipo, competencia, servidor, registros, diasNaoUteis, configAssinatura, dataGeracao } = data;
  const ultimoDia = getUltimoDiaMes(competencia.ano, competencia.mes);

  // Determinar se usa 1 ou 2 turnos baseado na jornada
  const cargaHorariaDiaria = servidor.carga_horaria_diaria || 8;
  const usaDoisTurnos = cargaHorariaDiaria >= 8;

  let y = margin;

  // ===== CABEÇALHO COM LOGOS =====
  const logoGovernoHeight = 16;
  const logoGovernoWidth = logoGovernoHeight * 3.0;
  const logoIdjuvHeight = 20;
  const logoIdjuvWidth = logoIdjuvHeight * 1.55;

  try {
    doc.addImage(logoGoverno, 'JPEG', margin, y, logoGovernoWidth, logoGovernoHeight);
    doc.addImage(logoIdjuv, 'PNG', pageWidth - margin - logoIdjuvWidth, y, logoIdjuvWidth, logoIdjuvHeight);
  } catch (e) {
    console.warn('Logos não carregados');
  }

  // ===== TEXTO DO CABEÇALHO (CENTRO) =====
  const headerCenterX = pageWidth / 2;
  
  doc.setTextColor(CORES.preto.r, CORES.preto.g, CORES.preto.b);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('ESTADO DE RORAIMA', headerCenterX, y + 5, { align: 'center' });
  
  doc.setFontSize(8);
  doc.text('INSTITUTO DE DESPORTO, JUVENTUDE E LAZER DO ESTADO DE RORAIMA - IDJUV', headerCenterX, y + 10, { align: 'center' });
  
  doc.setFontSize(8);
  doc.text('DIVISÃO DE RECURSOS HUMANOS - DRH', headerCenterX, y + 15, { align: 'center' });

  y += Math.max(logoGovernoHeight, logoIdjuvHeight) + 6;

  // ===== TÍTULO PRINCIPAL =====
  doc.setFillColor(0, 0, 0);
  doc.rect(margin, y, contentWidth, 7, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('FOLHA INDIVIDUAL DE PRESENÇA', headerCenterX, y + 5, { align: 'center' });
  
  y += 10;

  // ===== IDENTIFICAÇÃO DO SERVIDOR =====
  doc.setTextColor(CORES.preto.r, CORES.preto.g, CORES.preto.b);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  const lineHeight = 5;
  const labelWidth = 30;
  const fieldStartX = margin + labelWidth;
  const col2LabelX = pageWidth / 2 + 10;
  
  // Função para desenhar campo com linha
  const drawField = (label: string, value: string, x: number, yPos: number, fieldWidth: number, showLine: boolean = true) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, x, yPos);
    const labelW = doc.getTextWidth(label);
    doc.setFont('helvetica', 'normal');
    doc.text(value || '', x + labelW + 2, yPos);
    if (showLine) {
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.line(x + labelW + 1, yPos + 1, x + fieldWidth, yPos + 1);
    }
  };

  // Linha 1: Unidade
  drawField('Unidade:', servidor.unidade || '', margin, y, contentWidth - 10);
  y += lineHeight;

  // Linha 2: Servidor + Matrícula
  drawField('Servidor(a):', servidor.nome_completo || '', margin, y, contentWidth * 0.6);
  drawField('Matrícula:', servidor.matricula || '', col2LabelX + 30, y, 40);
  y += lineHeight;

  // Linha 3: Categoria + Fone + CPF
  drawField('Categoria:', servidor.categoria || '', margin, y, 50);
  drawField('Fone:', servidor.telefone || '', margin + 60, y, 40);
  drawField('CPF:', servidor.cpf || '', col2LabelX + 20, y, 40);
  y += lineHeight;

  // Linha 4: Cargo + Função
  drawField('Cargo:', servidor.cargo || '', margin, y, 70);
  drawField('Função:', servidor.funcao || '', col2LabelX, y, 50);
  y += lineHeight;

  // Linha 5: Frequência Integral + Carga Horária + H. Semanais
  drawField('Frequência Integral:', servidor.frequencia_integral !== false ? 'Sim' : 'Não', margin, y, 45);
  drawField('Horária:', `${cargaHorariaDiaria}h`, margin + 75, y, 20);
  drawField('H. Semanais:', `${servidor.carga_horaria_semanal || 40}h`, col2LabelX + 30, y, 25);
  y += lineHeight + 2;

  // Linha 6: MÊS / ANO
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('MÊS', margin, y);
  
  // Box para mês
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(margin + 12, y - 4, 35, 6);
  doc.setFont('helvetica', 'normal');
  doc.text(MESES[competencia.mes - 1], margin + 14, y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('ANO:', margin + 100, y);
  
  // Box para ano
  doc.rect(margin + 112, y - 4, 25, 6);
  doc.setFont('helvetica', 'normal');
  doc.text(String(competencia.ano), margin + 114, y);

  y += 8;

  // ===== TABELA DE FREQUÊNCIA =====
  const headerHeight = usaDoisTurnos ? 12 : 8;
  const rowHeight = 5.2;
  
  // Calcular larguras das colunas baseado no número de turnos
  let colWidths: { [key: string]: number };
  
  if (usaDoisTurnos) {
    // 2 TURNOS: DIA | ENTRADA | SAÍDA | RUBRICA | ABONO | ENTRADA | SAÍDA | RUBRICA | ABONO
    const turnoWidth = (contentWidth - 14) / 2; // Espaço para cada turno
    colWidths = {
      dia: 14,
      entrada: turnoWidth / 4,
      saida: turnoWidth / 4,
      rubrica: turnoWidth / 3,
      abono: turnoWidth / 6,
    };
  } else {
    // 1 TURNO: DIA | ENTRADA | SAÍDA | RUBRICA SERVIDOR | ABONO CHEFE
    colWidths = {
      dia: 16,
      entrada: 28,
      saida: 28,
      rubrica: (contentWidth - 16 - 56) / 2 + 10,
      abono: (contentWidth - 16 - 56) / 2 - 10,
    };
  }

  // ===== CABEÇALHO DA TABELA =====
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  
  if (usaDoisTurnos) {
    // Header para 2 turnos
    // Linha superior
    doc.rect(margin, y, contentWidth, headerHeight);
    
    // Título dos turnos
    const turno1X = margin + colWidths.dia;
    const turno1Width = colWidths.entrada + colWidths.saida + colWidths.rubrica + colWidths.abono;
    const turno2X = turno1X + turno1Width;
    
    // Linha horizontal entre título turno e subcolunas
    doc.line(margin, y + 6, margin + contentWidth, y + 6);
    
    // Título 1º TURNO
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text('1º TURNO', turno1X + turno1Width / 2, y + 4, { align: 'center' });
    
    // Título 2º TURNO
    doc.text('2º TURNO', turno2X + turno1Width / 2, y + 4, { align: 'center' });
    
    // Separador vertical entre DIA e turnos
    doc.line(margin + colWidths.dia, y, margin + colWidths.dia, y + headerHeight);
    
    // Separador vertical entre 1º e 2º turno
    doc.line(turno2X, y, turno2X, y + headerHeight);
    
    // Subcolunas do 1º turno
    let colX = margin + colWidths.dia;
    doc.setFontSize(6);
    
    doc.text('HORA', colX + colWidths.entrada / 2, y + 10, { align: 'center' });
    doc.text('ENTRADA', colX + colWidths.entrada / 2, y + 12.5, { align: 'center' });
    doc.line(colX + colWidths.entrada, y + 6, colX + colWidths.entrada, y + headerHeight);
    colX += colWidths.entrada;
    
    doc.text('HORA SAÍDA', colX + colWidths.saida / 2, y + 10.5, { align: 'center' });
    doc.line(colX + colWidths.saida, y + 6, colX + colWidths.saida, y + headerHeight);
    colX += colWidths.saida;
    
    doc.text('RUBRICA DO SERVIDOR', colX + colWidths.rubrica / 2, y + 10.5, { align: 'center' });
    doc.line(colX + colWidths.rubrica, y + 6, colX + colWidths.rubrica, y + headerHeight);
    colX += colWidths.rubrica;
    
    doc.text('ABONO DO', colX + colWidths.abono / 2, y + 9, { align: 'center' });
    doc.text('CHEFE', colX + colWidths.abono / 2, y + 12, { align: 'center' });
    colX += colWidths.abono;
    
    // Subcolunas do 2º turno
    doc.text('HORA', colX + colWidths.entrada / 2, y + 10, { align: 'center' });
    doc.text('ENTRADA', colX + colWidths.entrada / 2, y + 12.5, { align: 'center' });
    doc.line(colX + colWidths.entrada, y + 6, colX + colWidths.entrada, y + headerHeight);
    colX += colWidths.entrada;
    
    doc.text('HORA SAÍDA', colX + colWidths.saida / 2, y + 10.5, { align: 'center' });
    doc.line(colX + colWidths.saida, y + 6, colX + colWidths.saida, y + headerHeight);
    colX += colWidths.saida;
    
    doc.text('RUBRICA DO SERVIDOR', colX + colWidths.rubrica / 2, y + 10.5, { align: 'center' });
    doc.line(colX + colWidths.rubrica, y + 6, colX + colWidths.rubrica, y + headerHeight);
    colX += colWidths.rubrica;
    
    doc.text('ABONO DO', colX + colWidths.abono / 2, y + 9, { align: 'center' });
    doc.text('CHEFE', colX + colWidths.abono / 2, y + 12, { align: 'center' });
    
    // Coluna DIA (com subcabeçalho)
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('DIA', margin + colWidths.dia / 2, y + 8, { align: 'center' });
    
  } else {
    // Header para 1 turno
    doc.rect(margin, y, contentWidth, headerHeight);
    
    let colX = margin;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    
    doc.text('DIA', colX + colWidths.dia / 2, y + 5, { align: 'center' });
    doc.line(colX + colWidths.dia, y, colX + colWidths.dia, y + headerHeight);
    colX += colWidths.dia;
    
    doc.text('HORA ENTRADA', colX + colWidths.entrada / 2, y + 5, { align: 'center' });
    doc.line(colX + colWidths.entrada, y, colX + colWidths.entrada, y + headerHeight);
    colX += colWidths.entrada;
    
    doc.text('HORA SAÍDA', colX + colWidths.saida / 2, y + 5, { align: 'center' });
    doc.line(colX + colWidths.saida, y, colX + colWidths.saida, y + headerHeight);
    colX += colWidths.saida;
    
    doc.text('RUBRICA DO SERVIDOR', colX + colWidths.rubrica / 2, y + 5, { align: 'center' });
    doc.line(colX + colWidths.rubrica, y, colX + colWidths.rubrica, y + headerHeight);
    colX += colWidths.rubrica;
    
    doc.text('ABONO DO CHEFE', colX + colWidths.abono / 2, y + 5, { align: 'center' });
  }

  y += headerHeight;

  // ===== LINHAS DA TABELA =====
  const registrosDias = registros || gerarRegistrosDiariosBranco(competencia.ano, competencia.mes, diasNaoUteis);
  
  // Calcular quantas linhas fixas (sempre 31 para manter layout consistente)
  const totalLinhas = 31;

  for (let linha = 1; linha <= totalLinhas; linha++) {
    const dia = linha <= ultimoDia ? linha : null;
    
    // Buscar registro do dia
    let registro: RegistroDiario | null = null;
    let situacao: string = '';
    let label: string = '';
    
    if (dia) {
      const dataAtual = new Date(competencia.ano, competencia.mes - 1, dia);
      const situacaoBase = getSituacaoDia(dataAtual, diasNaoUteis);
      situacao = situacaoBase.situacao;
      label = situacaoBase.label || '';
      
      registro = registrosDias.find(r => {
        const diaRegistro = parseInt(r.data.split('-')[2], 10);
        return diaRegistro === dia;
      }) || null;
      
      if (registro) {
        if (registro.situacao !== 'util') {
          situacao = registro.situacao;
          label = registro.label || '';
        }
      }
    }

    const isNaoUtil = situacao !== 'util' && situacao !== '';
    const isDomingo = situacao === 'domingo';
    const isSabado = situacao === 'sabado';
    const isFeriado = situacao === 'feriado';
    const isFerias = situacao === 'ferias';
    const isLicenca = situacao === 'licenca';
    const isPontoFacultativo = situacao === 'ponto_facultativo';

    // Desenhar linha
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(margin, y, contentWidth, rowHeight);

    // Separadores verticais
    let colX = margin;
    
    if (usaDoisTurnos) {
      const turnoWidth = colWidths.entrada + colWidths.saida + colWidths.rubrica + colWidths.abono;
      
      // DIA
      doc.line(margin + colWidths.dia, y, margin + colWidths.dia, y + rowHeight);
      colX = margin + colWidths.dia;
      
      // 1º Turno - colunas
      doc.line(colX + colWidths.entrada, y, colX + colWidths.entrada, y + rowHeight);
      doc.line(colX + colWidths.entrada + colWidths.saida, y, colX + colWidths.entrada + colWidths.saida, y + rowHeight);
      doc.line(colX + colWidths.entrada + colWidths.saida + colWidths.rubrica, y, colX + colWidths.entrada + colWidths.saida + colWidths.rubrica, y + rowHeight);
      doc.line(colX + turnoWidth, y, colX + turnoWidth, y + rowHeight);
      
      colX += turnoWidth;
      
      // 2º Turno - colunas
      doc.line(colX + colWidths.entrada, y, colX + colWidths.entrada, y + rowHeight);
      doc.line(colX + colWidths.entrada + colWidths.saida, y, colX + colWidths.entrada + colWidths.saida, y + rowHeight);
      doc.line(colX + colWidths.entrada + colWidths.saida + colWidths.rubrica, y, colX + colWidths.entrada + colWidths.saida + colWidths.rubrica, y + rowHeight);
    } else {
      doc.line(margin + colWidths.dia, y, margin + colWidths.dia, y + rowHeight);
      colX = margin + colWidths.dia;
      doc.line(colX + colWidths.entrada, y, colX + colWidths.entrada, y + rowHeight);
      colX += colWidths.entrada;
      doc.line(colX + colWidths.saida, y, colX + colWidths.saida, y + rowHeight);
      colX += colWidths.saida;
      doc.line(colX + colWidths.rubrica, y, colX + colWidths.rubrica, y + rowHeight);
    }

    // Conteúdo da linha
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    
    const textY = y + rowHeight / 2 + 1.5;
    
    if (dia) {
      // Número do dia
      doc.setFont('helvetica', 'bold');
      doc.text(String(dia).padStart(2, '0'), margin + colWidths.dia / 2, textY, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      
      if (usaDoisTurnos) {
        const turnoWidth = colWidths.entrada + colWidths.saida + colWidths.rubrica + colWidths.abono;
        colX = margin + colWidths.dia;
        
        if (isNaoUtil) {
          // Para dias não úteis, mostrar label no lugar de entrada/saída
          let displayLabel = '';
          if (isDomingo) displayLabel = 'Dom';
          else if (isSabado) displayLabel = 'Sáb';
          else if (isFeriado) displayLabel = 'Feriado';
          else if (isFerias) displayLabel = 'Férias';
          else if (isLicenca) displayLabel = 'Licença';
          else if (isPontoFacultativo) displayLabel = 'Ponto Facultativo';
          else displayLabel = label || situacao;
          
          // Cor especial para feriado/férias
          if (isFeriado || isFerias) {
            doc.setTextColor(CORES.vermelho.r, CORES.vermelho.g, CORES.vermelho.b);
            doc.setFont('helvetica', 'bold');
          } else if (isPontoFacultativo) {
            doc.setFont('helvetica', 'italic');
          }
          
          // 1º Turno - entrada vazia
          doc.text('-', colX + colWidths.entrada / 2, textY, { align: 'center' });
          // 1º Turno - saída vazia  
          doc.text('-', colX + colWidths.entrada + colWidths.saida / 2, textY, { align: 'center' });
          // 1º Turno - label na rubrica
          doc.text(displayLabel, colX + colWidths.entrada + colWidths.saida + colWidths.rubrica / 2, textY, { align: 'center' });
          // 1º Turno - abono vazio
          doc.text('-', colX + colWidths.entrada + colWidths.saida + colWidths.rubrica + colWidths.abono / 2, textY, { align: 'center' });
          
          colX += turnoWidth;
          
          // 2º Turno - mesma coisa
          doc.text('-', colX + colWidths.entrada / 2, textY, { align: 'center' });
          doc.text('-', colX + colWidths.entrada + colWidths.saida / 2, textY, { align: 'center' });
          doc.text(displayLabel, colX + colWidths.entrada + colWidths.saida + colWidths.rubrica / 2, textY, { align: 'center' });
          doc.text('-', colX + colWidths.entrada + colWidths.saida + colWidths.rubrica + colWidths.abono / 2, textY, { align: 'center' });
          
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
        } else if (tipo === 'preenchida' && registro) {
          // Dia útil com dados preenchidos
          doc.text(registro.entrada_manha || '', colX + colWidths.entrada / 2, textY, { align: 'center' });
          doc.text(registro.saida_manha || '', colX + colWidths.entrada + colWidths.saida / 2, textY, { align: 'center' });
          colX += turnoWidth;
          doc.text(registro.entrada_tarde || '', colX + colWidths.entrada / 2, textY, { align: 'center' });
          doc.text(registro.saida_tarde || '', colX + colWidths.entrada + colWidths.saida / 2, textY, { align: 'center' });
        }
        // Se for em branco e dia útil, deixar campos vazios para preenchimento manual
      } else {
        // Layout 1 turno
        colX = margin + colWidths.dia;
        
        if (isNaoUtil) {
          let displayLabel = '';
          if (isDomingo) displayLabel = 'Domingo';
          else if (isSabado) displayLabel = 'Sábado';
          else if (isFeriado) displayLabel = 'Feriado';
          else if (isFerias) displayLabel = 'Férias';
          else if (isLicenca) displayLabel = 'Licença';
          else if (isPontoFacultativo) displayLabel = 'Ponto Facultativo';
          else displayLabel = label || situacao;
          
          if (isFeriado || isFerias) {
            doc.setTextColor(CORES.vermelho.r, CORES.vermelho.g, CORES.vermelho.b);
            doc.setFont('helvetica', 'bold');
          }
          
          doc.text('-', colX + colWidths.entrada / 2, textY, { align: 'center' });
          doc.text('-', colX + colWidths.entrada + colWidths.saida / 2, textY, { align: 'center' });
          doc.text(displayLabel, colX + colWidths.entrada + colWidths.saida + colWidths.rubrica / 2, textY, { align: 'center' });
          doc.text('-', colX + colWidths.entrada + colWidths.saida + colWidths.rubrica + colWidths.abono / 2, textY, { align: 'center' });
          
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
        } else if (tipo === 'preenchida' && registro) {
          doc.text(registro.entrada_manha || '', colX + colWidths.entrada / 2, textY, { align: 'center' });
          doc.text(registro.saida_manha || registro.saida_tarde || '', colX + colWidths.entrada + colWidths.saida / 2, textY, { align: 'center' });
        }
      }
    } else {
      // Linha vazia (dia > ultimoDia do mês)
      doc.text('-', margin + colWidths.dia / 2, textY, { align: 'center' });
      
      if (usaDoisTurnos) {
        const turnoWidth = colWidths.entrada + colWidths.saida + colWidths.rubrica + colWidths.abono;
        colX = margin + colWidths.dia;
        doc.text('-', colX + colWidths.entrada + colWidths.saida + colWidths.rubrica / 2, textY, { align: 'center' });
        colX += turnoWidth;
        doc.text('-', colX + colWidths.entrada + colWidths.saida + colWidths.rubrica / 2, textY, { align: 'center' });
      } else {
        doc.text('-', margin + colWidths.dia + colWidths.entrada + colWidths.saida + colWidths.rubrica / 2, textY, { align: 'center' });
      }
    }

    y += rowHeight;
  }

  // ===== RODAPÉ COM LOCAL E DATA =====
  y += 4;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text('Boa Vista - RR, _______ de ________________________ de ________.', margin, y);

  y += 10;

  // ===== ASSINATURAS =====
  const assinaturaWidth = contentWidth / 2 - 10;
  
  // Assinatura do Servidor
  doc.text('Ass. Servidor (a)', margin, y);
  doc.setLineWidth(0.4);
  doc.line(margin + 35, y, margin + assinaturaWidth, y);
  
  // Visto do Chefe
  doc.text('Visto do Chefe Imediato:', margin + assinaturaWidth + 20, y);
  doc.line(margin + assinaturaWidth + 65, y, margin + contentWidth, y);

  // ===== RODAPÉ DO SISTEMA =====
  const rodapeY = pageHeight - 6;
  doc.setTextColor(CORES.textoSecundario.r, CORES.textoSecundario.g, CORES.textoSecundario.b);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  
  doc.text(`Gerado em ${dataGeracao}`, margin, rodapeY);
  doc.text(`${INSTITUICAO.sigla} - Sistema de Gestão de Pessoas`, pageWidth / 2, rodapeY, { align: 'center' });
  
  if (rodapePersonalizado) {
    doc.text(rodapePersonalizado, pageWidth - margin, rodapeY, { align: 'right' });
  }
}

// ============================================
// GERADOR PRINCIPAL DO PDF INDIVIDUAL
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
  
  // Usar a função de renderização compartilhada
  renderizarPaginaFrequencia({ doc, data });

  const nomeArquivo = `Frequencia_${data.servidor.nome_completo.replace(/\s+/g, '_')}_${MESES[data.competencia.mes - 1]}_${data.competencia.ano}_${data.tipo}.pdf`;

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

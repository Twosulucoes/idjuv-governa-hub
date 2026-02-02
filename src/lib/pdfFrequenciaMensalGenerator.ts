/**
 * Geração de PDF de Frequência Mensal Individual - MODELO OFICIAL ÚNICO
 * 
 * LAYOUT MODERNO COM PARAMETRIZAÇÃO OBRIGATÓRIA POR JORNADA:
 * - Se carga horária <= 6h: 1 turno + 1 campo de assinatura
 * - Se carga horária >= 8h: 2 turnos + 2 campos de assinatura
 * 
 * O LAYOUT É ÚNICO - apenas os campos são adaptados conforme a jornada.
 * PROIBIDO: Exibir campos de 2º turno para servidor de 6h.
 * PROIBIDO: Exibir apenas 1 assinatura para servidor de 8h.
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

// Paleta de cores institucional moderna
export const CORES = {
  // Cores primárias institucionais
  primaria: { r: 0, g: 68, b: 68 },      // Verde institucional
  secundaria: { r: 41, g: 98, b: 135 },  // Azul moderno
  accent: { r: 180, g: 145, b: 75 },     // Dourado sutil
  
  // Textos
  preto: { r: 0, g: 0, b: 0 },
  texto: { r: 30, g: 35, b: 45 },
  textoSecundario: { r: 90, g: 95, b: 100 },
  branco: { r: 255, g: 255, b: 255 },
  
  // Backgrounds
  bgClaro: { r: 250, g: 252, b: 254 },
  bgCinza: { r: 245, g: 247, b: 250 },
  bgHeader: { r: 0, g: 68, b: 68 },
  
  // Bordas e linhas
  border: { r: 200, g: 210, b: 220 },
  borderStrong: { r: 0, g: 68, b: 68 },
  
  // Status
  vermelho: { r: 200, g: 50, b: 50 },
  verde: { r: 34, g: 139, b: 34 },
  
  // Dias especiais
  bgFeriado: { r: 255, g: 245, b: 235 },
  bgFimSemana: { r: 248, g: 250, b: 252 },
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

const DIAS_SEMANA_ABREV: Record<number, string> = {
  0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb'
};

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
 * Renderiza uma página de frequência conforme MODELO OFICIAL ÚNICO
 * 
 * PARAMETRIZAÇÃO OBRIGATÓRIA POR JORNADA:
 * - Jornada <= 6h: 1 turno, 1 campo de assinatura por dia
 * - Jornada >= 8h: 2 turnos, 2 campos de assinatura por dia
 * 
 * O layout visual é fixo. A estrutura se adapta automaticamente.
 */
export function renderizarPaginaFrequencia(params: RenderizarPaginaParams): void {
  const { doc, data, rodapePersonalizado } = params;
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;

  const { tipo, competencia, servidor, registros, diasNaoUteis, configAssinatura, dataGeracao, usuarioGeracao } = data;
  const ultimoDia = getUltimoDiaMes(competencia.ano, competencia.mes);

  // =====================================================
  // REGRA FUNCIONAL PRIORITÁRIA - PARAMETRIZAÇÃO
  // =====================================================
  const cargaHorariaDiaria = servidor.carga_horaria_diaria || 8;
  // REGRA: <= 6h = 1 turno | >= 8h = 2 turnos
  const usaDoisTurnos = cargaHorariaDiaria >= 8;

  let y = margin;

  // ===== CABEÇALHO INSTITUCIONAL MODERNO =====
  const headerHeight = 22;
  
  // Fundo do cabeçalho com gradiente visual (cor sólida moderna)
  doc.setFillColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
  doc.rect(margin, y, contentWidth, headerHeight, 'F');
  
  // Logos no cabeçalho
  const logoHeight = 16;
  const logoGovernoWidth = logoHeight * 2.8;
  const logoIdjuvWidth = logoHeight * 1.5;
  
  try {
    // Logo Governo (esquerda)
    doc.addImage(logoGoverno, 'JPEG', margin + 3, y + 3, logoGovernoWidth, logoHeight);
    // Logo IDJuv (direita)
    doc.addImage(logoIdjuv, 'PNG', pageWidth - margin - logoIdjuvWidth - 3, y + 3, logoIdjuvWidth, logoHeight);
  } catch (e) {
    console.warn('Logos não carregados');
  }

  // Textos centralizados no cabeçalho
  doc.setTextColor(CORES.branco.r, CORES.branco.g, CORES.branco.b);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('GOVERNO DO ESTADO DE RORAIMA', pageWidth / 2, y + 7, { align: 'center' });
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('INSTITUTO DE DESPORTO, JUVENTUDE E LAZER', pageWidth / 2, y + 12, { align: 'center' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('FOLHA INDIVIDUAL DE PRESENÇA', pageWidth / 2, y + 18, { align: 'center' });

  y += headerHeight + 4;

  // ===== CARD DE IDENTIFICAÇÃO =====
  const cardPadding = 3;
  const identificacaoHeight = 32;
  
  // Fundo do card
  doc.setFillColor(CORES.bgClaro.r, CORES.bgClaro.g, CORES.bgClaro.b);
  doc.setDrawColor(CORES.border.r, CORES.border.g, CORES.border.b);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, identificacaoHeight, 1.5, 1.5, 'FD');

  // Linha de destaque superior
  doc.setFillColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
  doc.rect(margin, y, contentWidth, 1.5, 'F');

  let infoY = y + 6;
  const col1 = margin + cardPadding;
  const col2 = margin + contentWidth * 0.5;
  const labelStyle = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(CORES.textoSecundario.r, CORES.textoSecundario.g, CORES.textoSecundario.b);
  };
  const valueStyle = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(CORES.texto.r, CORES.texto.g, CORES.texto.b);
  };

  // Linha 1: Servidor e Matrícula
  labelStyle();
  doc.text('SERVIDOR(A)', col1, infoY);
  doc.text('MATRÍCULA', col2, infoY);
  infoY += 4;
  valueStyle();
  doc.text((servidor.nome_completo || '').toUpperCase(), col1, infoY);
  doc.text(servidor.matricula || '', col2, infoY);
  
  infoY += 6;
  
  // Linha 2: Unidade e Cargo
  labelStyle();
  doc.text('UNIDADE', col1, infoY);
  doc.text('CARGO / FUNÇÃO', col2, infoY);
  infoY += 4;
  valueStyle();
  doc.setFontSize(7);
  const unidadeText = (servidor.unidade || '').length > 50 
    ? (servidor.unidade || '').substring(0, 47) + '...' 
    : (servidor.unidade || '');
  doc.text(unidadeText, col1, infoY);
  const cargoFuncao = servidor.funcao 
    ? `${servidor.cargo || ''} / ${servidor.funcao}` 
    : (servidor.cargo || '');
  doc.text(cargoFuncao, col2, infoY);
  
  infoY += 6;
  
  // Linha 3: Competência, Carga Horária, Jornada
  labelStyle();
  doc.text('COMPETÊNCIA', col1, infoY);
  doc.text('JORNADA', col1 + 50, infoY);
  doc.text('CARGA SEMANAL', col2, infoY);
  infoY += 4;
  valueStyle();
  doc.setFontSize(8);
  doc.text(`${MESES[competencia.mes - 1].toUpperCase()} / ${competencia.ano}`, col1, infoY);
  
  // Destaque visual para a jornada
  doc.setFillColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
  doc.roundedRect(col1 + 48, infoY - 3.5, 18, 5, 1, 1, 'F');
  doc.setTextColor(CORES.branco.r, CORES.branco.g, CORES.branco.b);
  doc.setFontSize(7);
  doc.text(`${cargaHorariaDiaria}h/dia`, col1 + 57, infoY, { align: 'center' });
  
  doc.setTextColor(CORES.texto.r, CORES.texto.g, CORES.texto.b);
  doc.setFontSize(8);
  doc.text(`${servidor.carga_horaria_semanal || 40}h semanais`, col2, infoY);

  y += identificacaoHeight + 3;

  // ===== TABELA DE FREQUÊNCIA =====
  
  // Determinar estrutura das colunas baseado na JORNADA
  interface ColConfig {
    key: string;
    label: string;
    label2?: string;
    width: number;
    align: 'left' | 'center' | 'right';
  }

  let colunas: ColConfig[] = [];
  
  if (usaDoisTurnos) {
    // JORNADA >= 8H: 2 TURNOS, 2 ASSINATURAS
    const turnoWidth = (contentWidth - 12) / 2;
    const colWidth = turnoWidth / 4;
    
    colunas = [
      { key: 'dia', label: 'DIA', width: 12, align: 'center' },
      // 1º TURNO
      { key: 'ent1', label: 'ENTRADA', label2: '1º TURNO', width: colWidth, align: 'center' },
      { key: 'sai1', label: 'SAÍDA', label2: '1º TURNO', width: colWidth, align: 'center' },
      { key: 'ass1', label: 'ASSINATURA', label2: 'SERVIDOR', width: colWidth + 4, align: 'center' },
      { key: 'abo1', label: 'ABONO', label2: 'CHEFIA', width: colWidth - 4, align: 'center' },
      // 2º TURNO
      { key: 'ent2', label: 'ENTRADA', label2: '2º TURNO', width: colWidth, align: 'center' },
      { key: 'sai2', label: 'SAÍDA', label2: '2º TURNO', width: colWidth, align: 'center' },
      { key: 'ass2', label: 'ASSINATURA', label2: 'SERVIDOR', width: colWidth + 4, align: 'center' },
      { key: 'abo2', label: 'ABONO', label2: 'CHEFIA', width: colWidth - 4, align: 'center' },
    ];
  } else {
    // JORNADA <= 6H: 1 TURNO, 1 ASSINATURA
    colunas = [
      { key: 'dia', label: 'DIA', width: 14, align: 'center' },
      { key: 'ent1', label: 'HORA', label2: 'ENTRADA', width: 28, align: 'center' },
      { key: 'sai1', label: 'HORA', label2: 'SAÍDA', width: 28, align: 'center' },
      { key: 'ass1', label: 'ASSINATURA', label2: 'DO SERVIDOR', width: (contentWidth - 70) / 2 + 8, align: 'center' },
      { key: 'abo1', label: 'ABONO', label2: 'DO CHEFE', width: (contentWidth - 70) / 2 - 8, align: 'center' },
    ];
  }

  // Header da tabela
  const headerHeight2 = usaDoisTurnos ? 11 : 9;
  const rowHeight = 5.0;
  
  // Fundo do header
  doc.setFillColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
  doc.rect(margin, y, contentWidth, headerHeight2, 'F');
  
  // Bordas
  doc.setDrawColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
  doc.setLineWidth(0.4);
  doc.rect(margin, y, contentWidth, headerHeight2);
  
  // Textos do header
  doc.setTextColor(CORES.branco.r, CORES.branco.g, CORES.branco.b);
  doc.setFont('helvetica', 'bold');
  
  let colX = margin;
  
  if (usaDoisTurnos) {
    // Header com indicadores de turno
    doc.setFontSize(5.5);
    
    for (const col of colunas) {
      const centerX = colX + col.width / 2;
      
      if (col.key === 'dia') {
        doc.setFontSize(6.5);
        doc.text(col.label, centerX, y + 6, { align: 'center' });
      } else if (col.label2) {
        const isTurno1 = ['ent1', 'sai1', 'ass1', 'abo1'].includes(col.key);
        const turnoLabel = isTurno1 ? '1º' : '2º';
        
        doc.setFontSize(5);
        doc.text(col.label, centerX, y + 4.5, { align: 'center' });
        doc.setFontSize(4.5);
        doc.text(`(${turnoLabel})`, centerX, y + 8, { align: 'center' });
      }
      
      // Separador vertical
      if (col.key !== 'abo2') {
        doc.setDrawColor(CORES.branco.r, CORES.branco.g, CORES.branco.b);
        doc.setLineWidth(0.2);
        doc.line(colX + col.width, y + 1, colX + col.width, y + headerHeight2 - 1);
      }
      
      colX += col.width;
    }
  } else {
    // Header para 1 turno
    doc.setFontSize(6);
    
    for (const col of colunas) {
      const centerX = colX + col.width / 2;
      
      if (col.label2) {
        doc.text(col.label, centerX, y + 3.5, { align: 'center' });
        doc.setFontSize(5);
        doc.text(col.label2, centerX, y + 7, { align: 'center' });
        doc.setFontSize(6);
      } else {
        doc.text(col.label, centerX, y + 5.5, { align: 'center' });
      }
      
      // Separador vertical
      if (col.key !== 'abo1') {
        doc.setDrawColor(CORES.branco.r, CORES.branco.g, CORES.branco.b);
        doc.setLineWidth(0.2);
        doc.line(colX + col.width, y + 1, colX + col.width, y + headerHeight2 - 1);
      }
      
      colX += col.width;
    }
  }

  y += headerHeight2;

  // ===== LINHAS DA TABELA =====
  const registrosDias = registros || gerarRegistrosDiariosBranco(competencia.ano, competencia.mes, diasNaoUteis);
  const totalLinhas = 31;

  for (let linha = 1; linha <= totalLinhas; linha++) {
    const dia = linha <= ultimoDia ? linha : null;
    
    // Buscar situação do dia
    let situacao = '';
    let label = '';
    let registro: RegistroDiario | null = null;
    
    if (dia) {
      const dataAtual = new Date(competencia.ano, competencia.mes - 1, dia);
      const situacaoBase = getSituacaoDia(dataAtual, diasNaoUteis);
      situacao = situacaoBase.situacao;
      label = situacaoBase.label || '';
      
      registro = registrosDias.find(r => {
        const diaRegistro = parseInt(r.data.split('-')[2], 10);
        return diaRegistro === dia;
      }) || null;
      
      if (registro && registro.situacao !== 'util') {
        situacao = registro.situacao;
        label = registro.label || '';
      }
    }

    const isNaoUtil = situacao !== 'util' && situacao !== '';
    const isDomingo = situacao === 'domingo';
    const isSabado = situacao === 'sabado';
    const isFeriado = situacao === 'feriado';
    const isFerias = situacao === 'ferias';
    const isLicenca = situacao === 'licenca';
    const isPontoFacultativo = situacao === 'ponto_facultativo';
    const isLinhaVazia = !dia;

    // Cor de fundo alternada e especial para dias não úteis
    if (isNaoUtil && !isLinhaVazia) {
      if (isFeriado || isFerias || isLicenca) {
        doc.setFillColor(CORES.bgFeriado.r, CORES.bgFeriado.g, CORES.bgFeriado.b);
      } else {
        doc.setFillColor(CORES.bgFimSemana.r, CORES.bgFimSemana.g, CORES.bgFimSemana.b);
      }
      doc.rect(margin, y, contentWidth, rowHeight, 'F');
    } else if (linha % 2 === 0 && !isLinhaVazia) {
      doc.setFillColor(CORES.bgCinza.r, CORES.bgCinza.g, CORES.bgCinza.b);
      doc.rect(margin, y, contentWidth, rowHeight, 'F');
    }

    // Borda da linha
    doc.setDrawColor(CORES.border.r, CORES.border.g, CORES.border.b);
    doc.setLineWidth(0.15);
    doc.rect(margin, y, contentWidth, rowHeight);

    // Separadores verticais
    colX = margin;
    for (let i = 0; i < colunas.length - 1; i++) {
      colX += colunas[i].width;
      doc.line(colX, y, colX, y + rowHeight);
    }

    // Conteúdo
    const textY = y + rowHeight / 2 + 1.3;
    colX = margin;
    
    for (const col of colunas) {
      const centerX = colX + col.width / 2;
      
      if (col.key === 'dia') {
        if (dia) {
          // Número do dia + abreviação
          const dataAtual = new Date(competencia.ano, competencia.mes - 1, dia);
          const diaSemana = DIAS_SEMANA_ABREV[dataAtual.getDay()];
          
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          doc.setTextColor(CORES.texto.r, CORES.texto.g, CORES.texto.b);
          doc.text(String(dia).padStart(2, '0'), colX + 4, textY);
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(5);
          doc.setTextColor(CORES.textoSecundario.r, CORES.textoSecundario.g, CORES.textoSecundario.b);
          doc.text(diaSemana, colX + 9, textY);
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6);
          doc.setTextColor(CORES.border.r, CORES.border.g, CORES.border.b);
          doc.text('—', centerX, textY, { align: 'center' });
        }
      } else if (isLinhaVazia) {
        // Linha vazia (dia inexistente)
        doc.setTextColor(CORES.border.r, CORES.border.g, CORES.border.b);
        doc.setFontSize(6);
        doc.text('—', centerX, textY, { align: 'center' });
      } else if (isNaoUtil) {
        // Dia não útil
        if (col.key === 'ass1' || col.key === 'ass2') {
          // Mostrar o motivo na coluna de assinatura
          let displayLabel = '';
          if (isDomingo) displayLabel = 'DOMINGO';
          else if (isSabado) displayLabel = 'SÁBADO';
          else if (isFeriado) displayLabel = label || 'FERIADO';
          else if (isFerias) displayLabel = 'FÉRIAS';
          else if (isLicenca) displayLabel = 'LICENÇA';
          else if (isPontoFacultativo) displayLabel = 'PTO. FACULTATIVO';
          else displayLabel = label || situacao.toUpperCase();
          
          // Truncar se muito longo
          if (displayLabel.length > 15) {
            displayLabel = displayLabel.substring(0, 14) + '…';
          }
          
          if (isFeriado || isFerias || isLicenca) {
            doc.setTextColor(CORES.vermelho.r, CORES.vermelho.g, CORES.vermelho.b);
          } else {
            doc.setTextColor(CORES.textoSecundario.r, CORES.textoSecundario.g, CORES.textoSecundario.b);
          }
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(5.5);
          doc.text(displayLabel, centerX, textY, { align: 'center' });
        } else {
          // Outras colunas vazias para dias não úteis
          doc.setTextColor(CORES.border.r, CORES.border.g, CORES.border.b);
          doc.setFontSize(6);
          doc.text('—', centerX, textY, { align: 'center' });
        }
      } else if (tipo === 'preenchida' && registro) {
        // Dia útil preenchido
        doc.setTextColor(CORES.texto.r, CORES.texto.g, CORES.texto.b);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        
        let valor = '';
        if (col.key === 'ent1') valor = registro.entrada_manha || '';
        else if (col.key === 'sai1') valor = registro.saida_manha || '';
        else if (col.key === 'ent2') valor = registro.entrada_tarde || '';
        else if (col.key === 'sai2') valor = registro.saida_tarde || '';
        
        if (valor) {
          doc.text(valor, centerX, textY, { align: 'center' });
        }
      }
      // Campos em branco para dias úteis em folha vazia ficam vazios para preenchimento manual
      
      colX += col.width;
    }

    y += rowHeight;
  }

  // ===== RODAPÉ - LOCAL E DATA =====
  y += 3;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(CORES.texto.r, CORES.texto.g, CORES.texto.b);
  doc.text('Boa Vista - RR, _______ de ________________________ de ________.', margin, y);

  y += 8;

  // ===== ÁREA DE ASSINATURAS FINAIS =====
  const assinaturaBoxWidth = contentWidth / 2 - 5;
  
  // Box Assinatura do Servidor
  doc.setDrawColor(CORES.border.r, CORES.border.g, CORES.border.b);
  doc.setLineWidth(0.3);
  
  // Linha de assinatura do servidor
  doc.line(margin, y, margin + assinaturaBoxWidth, y);
  doc.setFontSize(7);
  doc.setTextColor(CORES.textoSecundario.r, CORES.textoSecundario.g, CORES.textoSecundario.b);
  doc.text('Assinatura do(a) Servidor(a)', margin + assinaturaBoxWidth / 2, y + 4, { align: 'center' });
  
  // Linha de assinatura da chefia
  doc.line(margin + assinaturaBoxWidth + 10, y, margin + contentWidth, y);
  doc.text('Visto do(a) Chefe Imediato', margin + assinaturaBoxWidth + 10 + assinaturaBoxWidth / 2, y + 4, { align: 'center' });

  // ===== RODAPÉ DO SISTEMA =====
  const rodapeY = pageHeight - 5;
  
  doc.setFontSize(5.5);
  doc.setTextColor(CORES.textoSecundario.r, CORES.textoSecundario.g, CORES.textoSecundario.b);
  doc.setFont('helvetica', 'normal');
  
  doc.text(`Gerado em ${dataGeracao}${usuarioGeracao ? ` por ${usuarioGeracao}` : ''}`, margin, rodapeY);
  doc.text(`${INSTITUICAO.sigla} • Sistema de Gestão de Pessoas`, pageWidth / 2, rodapeY, { align: 'center' });
  
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

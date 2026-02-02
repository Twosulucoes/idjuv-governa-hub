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

// Paleta de cores institucional moderna - refinada
export const CORES = {
  // Cores primárias institucionais
  primaria: { r: 0, g: 68, b: 68 },       // Verde institucional
  primariaSuave: { r: 0, g: 85, b: 85 },  // Verde mais claro
  secundaria: { r: 41, g: 98, b: 135 },   // Azul moderno
  accent: { r: 180, g: 145, b: 75 },      // Dourado sutil
  
  // Textos
  preto: { r: 0, g: 0, b: 0 },
  texto: { r: 35, g: 40, b: 50 },
  textoSecundario: { r: 100, g: 105, b: 115 },
  textoSutil: { r: 140, g: 145, b: 155 },
  branco: { r: 255, g: 255, b: 255 },
  
  // Backgrounds
  bgClaro: { r: 252, g: 253, b: 255 },
  bgCinza: { r: 248, g: 250, b: 252 },
  bgHeader: { r: 0, g: 68, b: 68 },
  bgCard: { r: 255, g: 255, b: 255 },
  
  // Bordas e linhas
  border: { r: 220, g: 225, b: 232 },
  borderLight: { r: 235, g: 238, b: 242 },
  borderStrong: { r: 0, g: 68, b: 68 },
  
  // Status
  vermelho: { r: 185, g: 60, b: 60 },
  verde: { r: 34, g: 139, b: 34 },
  
  // Dias especiais
  bgFeriado: { r: 255, g: 248, b: 240 },
  bgFimSemana: { r: 250, g: 251, b: 253 },
  
  // Tabela
  headerTabela: { r: 245, g: 247, b: 250 },
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
  const margin = 8; // REDUZIDO de 12 para 8 - melhor aproveitamento
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

  // ===== CABEÇALHO INSTITUCIONAL COMPACTO =====
  const headerHeight = 20; // REDUZIDO de 24 para 20
  
  // Logos compactas e equilibradas
  const logoGovernoHeight = 10; // REDUZIDO de 11 para 10
  const logoGovernoWidth = logoGovernoHeight * 3.69;
  const logoIdjuvHeight = 12; // REDUZIDO de 14 para 12
  const logoIdjuvWidth = logoIdjuvHeight * 1.55;
  
  const textCenterX = pageWidth / 2;
  
  try {
    // Logo Governo (esquerda, alinhada verticalmente)
    doc.addImage(logoGoverno, 'JPEG', margin, y + (headerHeight - logoGovernoHeight) / 2, logoGovernoWidth, logoGovernoHeight);
    // Logo IDJuv (direita, alinhada verticalmente)
    doc.addImage(logoIdjuv, 'PNG', pageWidth - margin - logoIdjuvWidth, y + (headerHeight - logoIdjuvHeight) / 2, logoIdjuvWidth, logoIdjuvHeight);
  } catch (e) {
    console.warn('Logos não carregados');
  }

  // Textos institucionais compactos
  doc.setTextColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('GOVERNO DO ESTADO DE RORAIMA', textCenterX, y + 5, { align: 'center' });
  
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(CORES.texto.r, CORES.texto.g, CORES.texto.b);
  doc.text('Instituto de Desporto, Juventude e Lazer / iDJUV', textCenterX, y + 9.5, { align: 'center' });
  
  // Título principal
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
  doc.text('FOLHA INDIVIDUAL DE PRESENÇA', textCenterX, y + 16, { align: 'center' });

  // Linha divisória sutil
  doc.setDrawColor(CORES.border.r, CORES.border.g, CORES.border.b);
  doc.setLineWidth(0.3);
  doc.line(margin, y + headerHeight, pageWidth - margin, y + headerHeight);

  y += headerHeight + 2; // REDUZIDO espaçamento de 5 para 2

  // ===== CARD DE IDENTIFICAÇÃO DO SERVIDOR (COMPACTO) =====
  const identificacaoHeight = 24; // REDUZIDO de 28 para 24
  
  // Fundo branco com borda suave
  doc.setFillColor(CORES.bgCard.r, CORES.bgCard.g, CORES.bgCard.b);
  doc.setDrawColor(CORES.border.r, CORES.border.g, CORES.border.b);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, identificacaoHeight, 1.5, 1.5, 'FD');

  // Barra lateral colorida
  doc.setFillColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
  doc.rect(margin, y, 2, identificacaoHeight, 'F');

  const cardPadding = 5;
  let infoY = y + 4;
  const col1 = margin + cardPadding;
  const col2 = margin + contentWidth * 0.35;
  const col3 = margin + contentWidth * 0.68;

  // === LINHA 1: Nome do Servidor (destaque principal) ===
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(CORES.preto.r, CORES.preto.g, CORES.preto.b);
  doc.text((servidor.nome_completo || '').toUpperCase(), col1, infoY);
  
  // Badge de jornada (canto direito)
  const badgeWidth = 20;
  const badgeX = margin + contentWidth - badgeWidth - 3;
  doc.setFillColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
  doc.roundedRect(badgeX, infoY - 3, badgeWidth, 5.5, 1.2, 1.2, 'F');
  doc.setTextColor(CORES.branco.r, CORES.branco.g, CORES.branco.b);
  doc.setFontSize(6);
  doc.text(`${cargaHorariaDiaria}h/dia`, badgeX + badgeWidth / 2, infoY + 0.5, { align: 'center' });
  
  infoY += 7;

  // === LINHA 2: Dados Administrativos ===
  const labelStyle = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5);
    doc.setTextColor(CORES.textoSecundario.r, CORES.textoSecundario.g, CORES.textoSecundario.b);
  };
  const valueStyle = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(CORES.preto.r, CORES.preto.g, CORES.preto.b);
  };

  // Matrícula
  labelStyle();
  doc.text('MATRÍCULA', col1, infoY);
  valueStyle();
  doc.text(servidor.matricula || '—', col1, infoY + 3.5);

  // Cargo
  labelStyle();
  doc.text('CARGO / FUNÇÃO', col2, infoY);
  valueStyle();
  const cargoFuncao = servidor.funcao 
    ? `${servidor.cargo || ''} / ${servidor.funcao}` 
    : (servidor.cargo || '—');
  const cargoDisplay = cargoFuncao.length > 40 ? cargoFuncao.substring(0, 37) + '...' : cargoFuncao;
  doc.text(cargoDisplay, col2, infoY + 3.5);

  // Competência
  labelStyle();
  doc.text('COMPETÊNCIA', col3, infoY);
  valueStyle();
  doc.text(`${MESES[competencia.mes - 1].toUpperCase()} / ${competencia.ano}`, col3, infoY + 3.5);
  
  infoY += 8;

  // === LINHA 3: Unidade e Carga Semanal ===
  labelStyle();
  doc.text('UNIDADE DE LOTAÇÃO', col1, infoY);
  valueStyle();
  doc.setFontSize(6);
  const unidadeText = (servidor.unidade || '—').length > 80 
    ? (servidor.unidade || '').substring(0, 77) + '...' 
    : (servidor.unidade || '—');
  doc.text(unidadeText, col1, infoY + 3.5);

  labelStyle();
  doc.text('CARGA SEMANAL', col3, infoY);
  valueStyle();
  doc.setFontSize(6.5);
  doc.text(`${servidor.carga_horaria_semanal || 40}h`, col3, infoY + 3.5);

  y += identificacaoHeight + 2; // REDUZIDO espaçamento de 4 para 2

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
    const turnoWidth = (contentWidth - 14) / 2;
    const colWidth = turnoWidth / 4;
    
    colunas = [
      { key: 'dia', label: 'DIA', width: 14, align: 'center' },
      // 1º TURNO
      { key: 'ent1', label: 'ENT.', label2: '1º', width: colWidth, align: 'center' },
      { key: 'sai1', label: 'SAÍ.', label2: '1º', width: colWidth, align: 'center' },
      { key: 'ass1', label: 'ASSIN.', label2: '1º', width: colWidth + 5, align: 'center' },
      { key: 'abo1', label: 'ABONO', label2: '1º', width: colWidth - 5, align: 'center' },
      // 2º TURNO
      { key: 'ent2', label: 'ENT.', label2: '2º', width: colWidth, align: 'center' },
      { key: 'sai2', label: 'SAÍ.', label2: '2º', width: colWidth, align: 'center' },
      { key: 'ass2', label: 'ASSIN.', label2: '2º', width: colWidth + 5, align: 'center' },
      { key: 'abo2', label: 'ABONO', label2: '2º', width: colWidth - 5, align: 'center' },
    ];
  } else {
    // JORNADA <= 6H: 1 TURNO, 1 ASSINATURA
    colunas = [
      { key: 'dia', label: 'DIA', width: 16, align: 'center' },
      { key: 'ent1', label: 'ENTRADA', width: 30, align: 'center' },
      { key: 'sai1', label: 'SAÍDA', width: 30, align: 'center' },
      { key: 'ass1', label: 'ASSINATURA DO SERVIDOR', width: (contentWidth - 76) / 2 + 10, align: 'center' },
      { key: 'abo1', label: 'ABONO CHEFIA', width: (contentWidth - 76) / 2 - 10, align: 'center' },
    ];
  }

  // Header da tabela - OTIMIZADO PARA APROVEITAMENTO MÁXIMO
  const headerHeight2 = usaDoisTurnos ? 12 : 10; // REDUZIDO para mais espaço nas linhas
  const rowHeight = 6.8; // AUMENTADO para maior área de escrita/assinatura
  
  // Fundo do header (cinza claro em vez de verde)
  doc.setFillColor(CORES.headerTabela.r, CORES.headerTabela.g, CORES.headerTabela.b);
  doc.rect(margin, y, contentWidth, headerHeight2, 'F');
  
  // Borda do header
  doc.setDrawColor(CORES.border.r, CORES.border.g, CORES.border.b);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, contentWidth, headerHeight2);
  
  // Textos do header - COR PRETA OBRIGATÓRIA
  doc.setTextColor(CORES.preto.r, CORES.preto.g, CORES.preto.b);
  doc.setFont('helvetica', 'bold');
  
  let colX = margin;
  
  if (usaDoisTurnos) {
    // Header com indicadores de turno - FONTES GRANDES + PRETO
    doc.setFontSize(7.5); // AUMENTADO para alta legibilidade
    doc.setTextColor(CORES.preto.r, CORES.preto.g, CORES.preto.b);
    
    for (const col of colunas) {
      const centerX = colX + col.width / 2;
      
      if (col.key === 'dia') {
        doc.setFontSize(8.5); // AUMENTADO para destaque
        doc.setTextColor(CORES.preto.r, CORES.preto.g, CORES.preto.b);
        doc.text(col.label, centerX, y + 7, { align: 'center' });
      } else if (col.label2) {
        doc.setFontSize(7.5); // AUMENTADO
        doc.setTextColor(CORES.preto.r, CORES.preto.g, CORES.preto.b);
        doc.text(col.label, centerX, y + 5.5, { align: 'center' });
        doc.setFontSize(6.5); // AUMENTADO - sublegenda também preta
        doc.setTextColor(CORES.preto.r, CORES.preto.g, CORES.preto.b);
        doc.text(`(${col.label2})`, centerX, y + 10.5, { align: 'center' });
      }
      
      // Separador vertical entre colunas
      if (col.key !== 'abo2') {
        // Linha divisória MAIS FORTE entre 1º e 2º turno (após coluna ABONO 1º)
        if (col.key === 'abo1') {
          doc.setDrawColor(CORES.border.r, CORES.border.g, CORES.border.b);
          doc.setLineWidth(0.5);
        } else {
          doc.setDrawColor(CORES.borderLight.r, CORES.borderLight.g, CORES.borderLight.b);
          doc.setLineWidth(0.15);
        }
        doc.line(colX + col.width, y + 1, colX + col.width, y + headerHeight2 - 1);
      }
      
      colX += col.width;
    }
  } else {
    // Header para 1 turno - FONTES GRANDES + PRETO
    doc.setFontSize(8.5); // AUMENTADO para alta legibilidade
    doc.setTextColor(CORES.preto.r, CORES.preto.g, CORES.preto.b);
    
    for (const col of colunas) {
      const centerX = colX + col.width / 2;
      doc.text(col.label, centerX, y + 7, { align: 'center' });
      
      // Separador vertical sutil
      if (col.key !== 'abo1') {
        doc.setDrawColor(CORES.borderLight.r, CORES.borderLight.g, CORES.borderLight.b);
        doc.setLineWidth(0.15);
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

    // Borda da linha - mais suave
    doc.setDrawColor(CORES.borderLight.r, CORES.borderLight.g, CORES.borderLight.b);
    doc.setLineWidth(0.1);
    doc.rect(margin, y, contentWidth, rowHeight);

    // Separadores verticais sutis
    colX = margin;
    for (let i = 0; i < colunas.length - 1; i++) {
      colX += colunas[i].width;
      
      // Linha divisória MAIS FORTE entre 1º e 2º turno (após coluna abo1, índice 4 em jornada 8h)
      if (usaDoisTurnos && colunas[i].key === 'abo1') {
        doc.setDrawColor(CORES.border.r, CORES.border.g, CORES.border.b);
        doc.setLineWidth(0.5);
      } else {
        doc.setDrawColor(CORES.borderLight.r, CORES.borderLight.g, CORES.borderLight.b);
        doc.setLineWidth(0.1);
      }
      doc.line(colX, y, colX, y + rowHeight);
    }

    // Conteúdo - FONTES MAIORES + COR PRETA
    const textY = y + rowHeight / 2 + 1.5;
    colX = margin;
    
    for (const col of colunas) {
      const centerX = colX + col.width / 2;
      
      if (col.key === 'dia') {
        if (dia) {
          // Número do dia + abreviação - PRETO E MAIOR
          const dataAtual = new Date(competencia.ano, competencia.mes - 1, dia);
          const diaSemana = DIAS_SEMANA_ABREV[dataAtual.getDay()];
          
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8); // AUMENTADO de 6.5 para 8
          doc.setTextColor(CORES.preto.r, CORES.preto.g, CORES.preto.b);
          doc.text(String(dia).padStart(2, '0'), colX + 4.5, textY);
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6); // AUMENTADO de 4.5 para 6
          doc.setTextColor(CORES.preto.r, CORES.preto.g, CORES.preto.b);
          doc.text(diaSemana, colX + 10.5, textY);
        } else {
          // Linha vazia (dia inexistente)
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6);
          doc.setTextColor(CORES.borderLight.r, CORES.borderLight.g, CORES.borderLight.b);
          doc.text('—', centerX, textY, { align: 'center' });
        }
      } else if (isLinhaVazia) {
        // Linha vazia (dia inexistente) - minimalista
        doc.setTextColor(CORES.borderLight.r, CORES.borderLight.g, CORES.borderLight.b);
        doc.setFontSize(6);
        doc.text('—', centerX, textY, { align: 'center' });
      } else if (isNaoUtil) {
        // Dia não útil - FONTES MAIORES
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
          if (displayLabel.length > 16) {
            displayLabel = displayLabel.substring(0, 15) + '…';
          }
          
          if (isFeriado || isFerias || isLicenca) {
            doc.setTextColor(CORES.vermelho.r, CORES.vermelho.g, CORES.vermelho.b);
          } else {
            doc.setTextColor(CORES.preto.r, CORES.preto.g, CORES.preto.b); // PRETO em vez de cinza sutil
          }
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(6.5); // AUMENTADO de 5 para 6.5
          doc.text(displayLabel, centerX, textY, { align: 'center' });
        } else {
          // Outras colunas em branco para dias não úteis - sem tracinho
          // Deixa vazio para visual mais limpo
        }
      } else if (tipo === 'preenchida' && registro) {
        // Dia útil preenchido - PRETO E MAIOR
        doc.setTextColor(CORES.preto.r, CORES.preto.g, CORES.preto.b);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5); // AUMENTADO de 6 para 7.5
        
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
  y += 2; // REDUZIDO de 4 para 2
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(CORES.preto.r, CORES.preto.g, CORES.preto.b);
  doc.text('Boa Vista - RR, _______ de ________________________ de ________.', margin, y);

  y += 8; // REDUZIDO de 10 para 8

  // ===== ÁREA DE ASSINATURAS FINAIS =====
  const assinaturaBoxWidth = contentWidth / 2 - 8;
  
  // Estilo de linha mais elegante
  doc.setDrawColor(CORES.border.r, CORES.border.g, CORES.border.b);
  doc.setLineWidth(0.4);
  
  // Linha de assinatura do servidor - PRETO E MAIOR
  doc.line(margin, y, margin + assinaturaBoxWidth, y);
  doc.setFontSize(7.5); // AUMENTADO de 6.5 para 7.5
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(CORES.preto.r, CORES.preto.g, CORES.preto.b);
  doc.text('Assinatura do(a) Servidor(a)', margin + assinaturaBoxWidth / 2, y + 4.5, { align: 'center' });
  
  // Linha de assinatura da chefia - PRETO E MAIOR
  const chefiaX = margin + assinaturaBoxWidth + 16;
  doc.line(chefiaX, y, margin + contentWidth, y);
  doc.setTextColor(CORES.preto.r, CORES.preto.g, CORES.preto.b);
  doc.text('Visto do(a) Chefe Imediato', chefiaX + assinaturaBoxWidth / 2, y + 4.5, { align: 'center' });

  // ===== RODAPÉ DO SISTEMA =====
  const rodapeY = pageHeight - 6;
  
  doc.setFontSize(5);
  doc.setTextColor(CORES.textoSutil.r, CORES.textoSutil.g, CORES.textoSutil.b);
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

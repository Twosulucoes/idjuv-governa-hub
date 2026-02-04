/**
 * ============================================
 * GERAÇÃO DE PDF DE FREQUÊNCIA MENSAL - MODELO OFICIAL ÚNICO
 * ============================================
 * 
 * ESTRUTURA MODULAR EM 5 BLOCOS:
 * 1. BLOCO 1: Cabeçalho Institucional (~22mm)
 * 2. BLOCO 2: Dados do Servidor (~26mm)
 * 3. BLOCO 3: Corpo da Frequência (dinâmico)
 * 4. BLOCO 4: Data e Assinaturas Finais (~22mm)
 * 5. BLOCO 5: Rodapé do Sistema (~8mm)
 * 
 * CAMADA DE APRESENTAÇÃO - NÃO CONTÉM LÓGICA DE CÁLCULO
 * 
 * @author Sistema IDJUV
 * @version 3.0.0 - Reestruturado em 5 blocos modulares
 * @date 04/02/2026
 */
import jsPDF from 'jspdf';
import { DIAS_SEMANA_SIGLA, type DiaNaoUtil } from '@/types/frequencia';
import { verificarDoisTurnos } from '@/lib/frequenciaCalculoService';

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

// ============================================
// LAYOUT EM 5 BLOCOS - ALTURAS PROPORCIONAIS
// ============================================
export const BLOCO_ALTURAS = {
  cabecalho: 22,      // Bloco 1: Cabeçalho institucional
  dadosServidor: 30,  // Bloco 2: Card de dados do servidor (aumentado para fontes maiores)
  assinaturas: 22,    // Bloco 4: Data e assinaturas finais
  rodape: 8,          // Bloco 5: Rodapé do sistema
  // Bloco 3: Corpo da frequência = calculado dinamicamente
};

// Proporções das logos (conforme solicitado: IDJuv 60%, Governo 30%)
export const LOGO_PROPORCOES = {
  governo: 0.30,  // 30% de destaque visual
  idjuv: 0.60,    // 60% de destaque visual
};

// Espessuras das linhas da tabela (melhoradas para visibilidade)
export const LINHAS_TABELA = {
  externa: 0.5,         // Borda externa da tabela
  horizontal: 0.25,     // Linhas horizontais entre linhas
  vertical: 0.3,        // Linhas verticais entre colunas
  divisoriaTurno: 0.8,  // Divisória entre 1º e 2º turno
  headerInferior: 0.4,  // Borda inferior do header
};

// Paleta de cores institucional
export const CORES = {
  // Cores primárias institucionais
  primaria: { r: 0, g: 68, b: 68 },
  primariaSuave: { r: 0, g: 85, b: 85 },
  secundaria: { r: 41, g: 98, b: 135 },
  accent: { r: 180, g: 145, b: 75 },
  
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
  border: { r: 180, g: 185, b: 195 },       // MAIS ESCURO para visibilidade
  borderLight: { r: 200, g: 205, b: 215 },  // MAIS ESCURO para visibilidade
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
 * @deprecated Use calcularResumoMensalParametrizado do frequenciaCalculoService
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
// BLOCO 1: CABEÇALHO INSTITUCIONAL (~22mm)
// ============================================
interface RenderBloco1Params {
  doc: jsPDF;
  y: number;
  pageWidth: number;
  margin: number;
  contentWidth: number;
}

function renderizarBloco1Cabecalho(params: RenderBloco1Params): number {
  const { doc, y, pageWidth, margin, contentWidth } = params;
  const headerHeight = BLOCO_ALTURAS.cabecalho;
  
  // Calcular alturas das logos conforme proporções solicitadas
  // Base de cálculo: altura disponível do bloco = 22mm
  // IDJuv: 60% → 14mm de altura
  // Governo: 30% → 8mm de altura
  const logoIdjuvHeight = 14;  // 60% do destaque visual
  const logoGovernoHeight = 8; // 30% do destaque visual
  
  // Calcular larguras mantendo proporções originais
  const logoGovernoWidth = logoGovernoHeight * 3.69; // ~29.5mm
  const logoIdjuvWidth = logoIdjuvHeight * 1.55;     // ~21.7mm
  
  const textCenterX = pageWidth / 2;
  
  try {
    // Logo Governo (esquerda, alinhada verticalmente)
    doc.addImage(
      logoGoverno, 
      'JPEG', 
      margin, 
      y + (headerHeight - logoGovernoHeight) / 2, 
      logoGovernoWidth, 
      logoGovernoHeight
    );
    
    // Logo IDJuv (direita, alinhada verticalmente)
    doc.addImage(
      logoIdjuv, 
      'PNG', 
      pageWidth - margin - logoIdjuvWidth, 
      y + (headerHeight - logoIdjuvHeight) / 2, 
      logoIdjuvWidth, 
      logoIdjuvHeight
    );
  } catch (e) {
    console.warn('Logos não carregados');
  }

  // Textos institucionais centralizados
  doc.setTextColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9); // Aumentado de 8 para 9
  doc.text('GOVERNO DO ESTADO DE RORAIMA', textCenterX, y + 6, { align: 'center' });
  
  doc.setFontSize(7.5); // Aumentado de 6.5 para 7.5
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(CORES.texto.r, CORES.texto.g, CORES.texto.b);
  doc.text('Instituto de Desporto, Juventude e Lazer / iDJUV', textCenterX, y + 11, { align: 'center' });
  
  // Título principal
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11); // Aumentado de 10 para 11
  doc.setTextColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
  doc.text('FOLHA INDIVIDUAL DE PRESENÇA', textCenterX, y + 18, { align: 'center' });

  // Linha divisória sutil
  doc.setDrawColor(CORES.border.r, CORES.border.g, CORES.border.b);
  doc.setLineWidth(0.4);
  doc.line(margin, y + headerHeight, pageWidth - margin, y + headerHeight);

  return y + headerHeight + 2;
}

// ============================================
// BLOCO 2: DADOS DO SERVIDOR (~26mm)
// ============================================
interface RenderBloco2Params {
  doc: jsPDF;
  y: number;
  pageWidth: number;
  margin: number;
  contentWidth: number;
  servidor: FrequenciaMensalPDFData['servidor'];
  competencia: FrequenciaMensalPDFData['competencia'];
  cargaHorariaDiaria: number;
}

function renderizarBloco2DadosServidor(params: RenderBloco2Params): number {
  const { doc, y, margin, contentWidth, servidor, competencia, cargaHorariaDiaria } = params;
  const identificacaoHeight = BLOCO_ALTURAS.dadosServidor;
  
  // Fundo branco com borda suave
  doc.setFillColor(CORES.bgCard.r, CORES.bgCard.g, CORES.bgCard.b);
  doc.setDrawColor(CORES.border.r, CORES.border.g, CORES.border.b);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, identificacaoHeight, 1.5, 1.5, 'FD');

  // Barra lateral colorida
  doc.setFillColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
  doc.rect(margin, y, 2.5, identificacaoHeight, 'F');

  const cardPadding = 6;
  const col1 = margin + cardPadding;
  const col2 = margin + contentWidth * 0.35;
  const col3 = margin + contentWidth * 0.68;

  // ============================================
  // DISTRIBUIÇÃO VERTICAL DENTRO DOS 30mm
  // ============================================
  // Zona 1: Nome (y + 5mm)
  // Zona 2: Labels em y + 12mm, Valores em y + 17mm
  // Zona 3: Labels em y + 22mm, Valores em y + 27mm
  // ============================================
  
  const nomeY = y + 5;
  const linha2LabelY = y + 12;
  const linha2ValorY = y + 17;
  const linha3LabelY = y + 22;
  const linha3ValorY = y + 27;

  // === ZONA 1: Nome do Servidor (destaque principal) ===
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11); // Mantém em 11pt (já está bom)
  doc.setTextColor(CORES.preto.r, CORES.preto.g, CORES.preto.b);
  doc.text((servidor.nome_completo || '').toUpperCase(), col1, nomeY);
  
  // Badge de jornada (canto direito)
  const badgeWidth = 24;
  const badgeX = margin + contentWidth - badgeWidth - 4;
  doc.setFillColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
  doc.roundedRect(badgeX, nomeY - 4.5, badgeWidth, 7, 1.5, 1.5, 'F');
  doc.setTextColor(CORES.branco.r, CORES.branco.g, CORES.branco.b);
  doc.setFontSize(9); // AUMENTADO de 7 para 9
  doc.text(`${cargaHorariaDiaria}h/dia`, badgeX + badgeWidth / 2, nomeY, { align: 'center' });

  // === ZONA 2: Dados Administrativos - FONTES AUMENTADAS ===
  const labelStyle = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8); // AUMENTADO de 6 para 8
    doc.setTextColor(CORES.textoSecundario.r, CORES.textoSecundario.g, CORES.textoSecundario.b);
  };
  const valueStyle = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10); // AUMENTADO de 8 para 10
    doc.setTextColor(CORES.preto.r, CORES.preto.g, CORES.preto.b);
  };

  // Matrícula
  labelStyle();
  doc.text('MATRÍCULA', col1, linha2LabelY);
  valueStyle();
  doc.text(servidor.matricula || '—', col1, linha2ValorY);

  // Cargo / Função (com truncamento inteligente)
  labelStyle();
  doc.text('CARGO / FUNÇÃO', col2, linha2LabelY);
  valueStyle();
  const cargoFuncao = servidor.funcao 
    ? `${servidor.cargo || ''} / ${servidor.funcao}` 
    : (servidor.cargo || '—');
  // Calcular largura disponível até col3
  const larguraDisponivelCargo = col3 - col2 - 5;
  let cargoDisplay = cargoFuncao;
  while (doc.getTextWidth(cargoDisplay) > larguraDisponivelCargo && cargoDisplay.length > 3) {
    cargoDisplay = cargoDisplay.substring(0, cargoDisplay.length - 4) + '...';
  }
  doc.text(cargoDisplay, col2, linha2ValorY);

  // Competência
  labelStyle();
  doc.text('COMPETÊNCIA', col3, linha2LabelY);
  valueStyle();
  doc.text(`${MESES[competencia.mes - 1].toUpperCase()} / ${competencia.ano}`, col3, linha2ValorY);

  // === ZONA 3: Unidade e Carga Semanal ===
  labelStyle();
  doc.setFontSize(7); // Label unidade ligeiramente menor para caber
  doc.text('UNIDADE DE LOTAÇÃO', col1, linha3LabelY);
  valueStyle();
  doc.setFontSize(9); // AUMENTADO de 7 para 9
  // Truncar unidade com base na largura real disponível
  const larguraDisponivelUnidade = col3 - col1 - 5;
  let unidadeText = servidor.unidade || '—';
  while (doc.getTextWidth(unidadeText) > larguraDisponivelUnidade && unidadeText.length > 3) {
    unidadeText = unidadeText.substring(0, unidadeText.length - 4) + '...';
  }
  doc.text(unidadeText, col1, linha3ValorY);

  labelStyle();
  doc.setFontSize(7);
  doc.text('CARGA SEMANAL', col3, linha3LabelY);
  valueStyle();
  doc.setFontSize(10); // AUMENTADO de 8 para 10
  doc.text(`${servidor.carga_horaria_semanal || 40}h`, col3, linha3ValorY);

  return y + identificacaoHeight + 2;
}

// ============================================
// BLOCO 3: CORPO DA FREQUÊNCIA (dinâmico)
// ============================================
interface RenderBloco3Params {
  doc: jsPDF;
  y: number;
  pageWidth: number;
  pageHeight: number;
  margin: number;
  contentWidth: number;
  data: FrequenciaMensalPDFData;
  usaDoisTurnos: boolean;
  cargaHorariaDiaria: number;
}

interface ColConfig {
  key: string;
  label: string;
  label2?: string;
  width: number;
  align: 'left' | 'center' | 'right';
}

function renderizarBloco3CorpoFrequencia(params: RenderBloco3Params): number {
  const { doc, y, pageHeight, margin, contentWidth, data, usaDoisTurnos, cargaHorariaDiaria } = params;
  const { tipo, competencia, registros, diasNaoUteis } = data;
  const ultimoDia = getUltimoDiaMes(competencia.ano, competencia.mes);
  
  let currentY = y;
  
  // Determinar estrutura das colunas baseado na JORNADA
  let colunas: ColConfig[] = [];
  
  if (usaDoisTurnos) {
    // JORNADA >= 8H: 2 TURNOS, 2 ASSINATURAS
    const turnoWidth = (contentWidth - 14) / 2;
    const colWidth = turnoWidth / 4;
    
    colunas = [
      { key: 'dia', label: 'DIA', width: 14, align: 'center' },
      { key: 'ent1', label: 'ENT.', label2: '1º', width: colWidth, align: 'center' },
      { key: 'sai1', label: 'SAÍ.', label2: '1º', width: colWidth, align: 'center' },
      { key: 'ass1', label: 'ASSIN.', label2: '1º', width: colWidth + 5, align: 'center' },
      { key: 'abo1', label: 'ABONO', label2: '1º', width: colWidth - 5, align: 'center' },
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

  // Header da tabela
  const headerHeight = usaDoisTurnos ? 12 : 10;
  
  // Calcular altura disponível para a tabela (31 linhas fixas)
  const zonaRodape = BLOCO_ALTURAS.assinaturas + BLOCO_ALTURAS.rodape + 4; // ~34mm de proteção
  const alturaDisponivelTabela = pageHeight - currentY - headerHeight - zonaRodape;
  const totalLinhasTabela = 31;
  
  // Calcular rowHeight dinamicamente
  const rowHeightCalculado = alturaDisponivelTabela / totalLinhasTabela;
  const rowHeight = Math.max(5.5, Math.min(rowHeightCalculado, 7.0));
  
  // ===== HEADER DA TABELA =====
  // Fundo do header
  doc.setFillColor(CORES.headerTabela.r, CORES.headerTabela.g, CORES.headerTabela.b);
  doc.rect(margin, currentY, contentWidth, headerHeight, 'F');
  
  // Borda externa do header (mais forte)
  doc.setDrawColor(CORES.border.r, CORES.border.g, CORES.border.b);
  doc.setLineWidth(LINHAS_TABELA.externa);
  doc.rect(margin, currentY, contentWidth, headerHeight);
  
  // Borda inferior do header (mais forte)
  doc.setLineWidth(LINHAS_TABELA.headerInferior);
  doc.line(margin, currentY + headerHeight, margin + contentWidth, currentY + headerHeight);
  
  // Textos do header
  doc.setTextColor(CORES.preto.r, CORES.preto.g, CORES.preto.b);
  doc.setFont('helvetica', 'bold');
  
  let colX = margin;
  
  if (usaDoisTurnos) {
    doc.setFontSize(7.5);
    
    for (const col of colunas) {
      const centerX = colX + col.width / 2;
      
      if (col.key === 'dia') {
        doc.setFontSize(8.5);
        doc.text(col.label, centerX, currentY + 7, { align: 'center' });
      } else if (col.label2) {
        doc.setFontSize(7.5);
        doc.text(col.label, centerX, currentY + 5.5, { align: 'center' });
        doc.setFontSize(6.5);
        doc.text(`(${col.label2})`, centerX, currentY + 10.5, { align: 'center' });
      }
      
      // Separadores verticais do header
      if (col.key !== 'abo2') {
        if (col.key === 'abo1') {
          // Linha divisória FORTE entre 1º e 2º turno (verde institucional)
          doc.setDrawColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
          doc.setLineWidth(LINHAS_TABELA.divisoriaTurno);
        } else {
          doc.setDrawColor(CORES.border.r, CORES.border.g, CORES.border.b);
          doc.setLineWidth(LINHAS_TABELA.vertical);
        }
        doc.line(colX + col.width, currentY + 1, colX + col.width, currentY + headerHeight - 1);
      }
      
      colX += col.width;
    }
  } else {
    doc.setFontSize(8.5);
    
    for (const col of colunas) {
      const centerX = colX + col.width / 2;
      doc.text(col.label, centerX, currentY + 7, { align: 'center' });
      
      // Separadores verticais
      if (col.key !== 'abo1') {
        doc.setDrawColor(CORES.border.r, CORES.border.g, CORES.border.b);
        doc.setLineWidth(LINHAS_TABELA.vertical);
        doc.line(colX + col.width, currentY + 1, colX + col.width, currentY + headerHeight - 1);
      }
      
      colX += col.width;
    }
  }

  currentY += headerHeight;

  // ===== LINHAS DA TABELA =====
  const registrosDias = registros || gerarRegistrosDiariosBranco(competencia.ano, competencia.mes, diasNaoUteis);
  const totalLinhas = 31;

  for (let linha = 1; linha <= totalLinhas; linha++) {
    const dia = linha <= ultimoDia ? linha : null;
    
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

    // Cor de fundo para dias não úteis
    if (isNaoUtil && !isLinhaVazia) {
      if (isFeriado || isFerias || isLicenca) {
        doc.setFillColor(CORES.bgFeriado.r, CORES.bgFeriado.g, CORES.bgFeriado.b);
      } else {
        doc.setFillColor(CORES.bgFimSemana.r, CORES.bgFimSemana.g, CORES.bgFimSemana.b);
      }
      doc.rect(margin, currentY, contentWidth, rowHeight, 'F');
    } else if (linha % 2 === 0 && !isLinhaVazia) {
      doc.setFillColor(CORES.bgCinza.r, CORES.bgCinza.g, CORES.bgCinza.b);
      doc.rect(margin, currentY, contentWidth, rowHeight, 'F');
    }

    // Borda da linha (mais visível)
    doc.setDrawColor(CORES.border.r, CORES.border.g, CORES.border.b);
    doc.setLineWidth(LINHAS_TABELA.horizontal);
    doc.rect(margin, currentY, contentWidth, rowHeight);

    // Separadores verticais (mais visíveis)
    colX = margin;
    for (let i = 0; i < colunas.length - 1; i++) {
      colX += colunas[i].width;
      
      // Linha divisória entre turnos
      if (usaDoisTurnos && colunas[i].key === 'abo1') {
        doc.setDrawColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
        doc.setLineWidth(LINHAS_TABELA.divisoriaTurno);
      } else {
        doc.setDrawColor(CORES.border.r, CORES.border.g, CORES.border.b);
        doc.setLineWidth(LINHAS_TABELA.vertical);
      }
      doc.line(colX, currentY, colX, currentY + rowHeight);
    }

    // Conteúdo das células
    const textY = currentY + rowHeight / 2 + 1.5;
    colX = margin;
    
    for (const col of colunas) {
      const centerX = colX + col.width / 2;
      
      if (col.key === 'dia') {
        if (dia) {
          const dataAtual = new Date(competencia.ano, competencia.mes - 1, dia);
          const diaSemana = DIAS_SEMANA_ABREV[dataAtual.getDay()];
          
          // Renderizar "DD Xxx" como texto único centralizado para evitar vazamento
          const diaTexto = `${String(dia).padStart(2, '0')} ${diaSemana}`;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          doc.setTextColor(CORES.preto.r, CORES.preto.g, CORES.preto.b);
          doc.text(diaTexto, centerX, textY, { align: 'center' });
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6);
          doc.setTextColor(CORES.borderLight.r, CORES.borderLight.g, CORES.borderLight.b);
          doc.text('—', centerX, textY, { align: 'center' });
        }
      } else if (isLinhaVazia) {
        doc.setTextColor(CORES.borderLight.r, CORES.borderLight.g, CORES.borderLight.b);
        doc.setFontSize(6);
        doc.text('—', centerX, textY, { align: 'center' });
      } else if (isNaoUtil) {
        // Para colunas de entrada/saída em dias não úteis: renderizar hífen central
        if (['ent1', 'sai1', 'ent2', 'sai2', 'abo1', 'abo2'].includes(col.key)) {
          doc.setTextColor(CORES.textoSecundario.r, CORES.textoSecundario.g, CORES.textoSecundario.b);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.text('—', centerX, textY, { align: 'center' });
        } else if (col.key === 'ass1' || col.key === 'ass2') {
          // Manter label do tipo de dia não útil nas colunas de assinatura
          let displayLabel = '';
          if (isDomingo) displayLabel = 'DOMINGO';
          else if (isSabado) displayLabel = 'SÁBADO';
          else if (isFeriado) displayLabel = label || 'FERIADO';
          else if (isFerias) displayLabel = 'FÉRIAS';
          else if (isLicenca) displayLabel = 'LICENÇA';
          else if (isPontoFacultativo) displayLabel = 'PTO. FACULTATIVO';
          else displayLabel = label || situacao.toUpperCase();
          
          if (displayLabel.length > 16) {
            displayLabel = displayLabel.substring(0, 15) + '…';
          }
          
          if (isFeriado || isFerias || isLicenca) {
            doc.setTextColor(CORES.vermelho.r, CORES.vermelho.g, CORES.vermelho.b);
          } else {
            doc.setTextColor(CORES.preto.r, CORES.preto.g, CORES.preto.b);
          }
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(6.5);
          doc.text(displayLabel, centerX, textY, { align: 'center' });
        }
      } else if (tipo === 'preenchida' && registro) {
        doc.setTextColor(CORES.preto.r, CORES.preto.g, CORES.preto.b);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        
        let valor = '';
        if (col.key === 'ent1') valor = registro.entrada_manha || '';
        else if (col.key === 'sai1') valor = registro.saida_manha || '';
        else if (col.key === 'ent2') valor = registro.entrada_tarde || '';
        else if (col.key === 'sai2') valor = registro.saida_tarde || '';
        
        if (valor) {
          doc.text(valor, centerX, textY, { align: 'center' });
        }
      }
      
      colX += col.width;
    }

    currentY += rowHeight;
  }

  return currentY;
}

// ============================================
// BLOCO 4: DATA E ASSINATURAS FINAIS (~22mm)
// ============================================
interface RenderBloco4Params {
  doc: jsPDF;
  y: number;
  pageWidth: number;
  margin: number;
  contentWidth: number;
}

function renderizarBloco4Assinaturas(params: RenderBloco4Params): number {
  const { doc, y, margin, contentWidth } = params;
  
  let currentY = y + 4; // Espaço após a tabela
  
  // Linha de local e data
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9); // AUMENTADO de 8 para 9
  doc.setTextColor(CORES.preto.r, CORES.preto.g, CORES.preto.b);
  doc.text('Boa Vista - RR, _______ de ________________________ de ________.', margin, currentY);

  currentY += 12; // Espaço antes das assinaturas

  // Área de assinaturas
  const assinaturaBoxWidth = contentWidth / 2 - 10;
  
  // Linha de assinatura do servidor
  doc.setDrawColor(CORES.border.r, CORES.border.g, CORES.border.b);
  doc.setLineWidth(0.5); // Mais espessa
  doc.line(margin, currentY, margin + assinaturaBoxWidth, currentY);
  doc.setFontSize(8); // AUMENTADO de 7.5 para 8
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(CORES.preto.r, CORES.preto.g, CORES.preto.b);
  doc.text('Assinatura do(a) Servidor(a)', margin + assinaturaBoxWidth / 2, currentY + 5, { align: 'center' });
  
  // Linha de assinatura da chefia
  const chefiaX = margin + assinaturaBoxWidth + 20;
  doc.line(chefiaX, currentY, margin + contentWidth, currentY);
  doc.text('Visto do(a) Chefe Imediato', chefiaX + assinaturaBoxWidth / 2, currentY + 5, { align: 'center' });

  return currentY + BLOCO_ALTURAS.assinaturas - 12;
}

// ============================================
// BLOCO 5: RODAPÉ DO SISTEMA (~8mm)
// ============================================
interface RenderBloco5Params {
  doc: jsPDF;
  pageWidth: number;
  pageHeight: number;
  margin: number;
  dataGeracao: string;
  usuarioGeracao?: string;
  rodapePersonalizado?: string;
}

function renderizarBloco5Rodape(params: RenderBloco5Params): void {
  const { doc, pageWidth, pageHeight, margin, dataGeracao, usuarioGeracao, rodapePersonalizado } = params;
  
  // Posição fixa: 6mm da borda inferior
  const rodapeY = pageHeight - 6;
  
  doc.setFontSize(5.5);
  doc.setTextColor(CORES.textoSutil.r, CORES.textoSutil.g, CORES.textoSutil.b);
  doc.setFont('helvetica', 'normal');
  
  // Esquerda: Data/hora de geração + usuário
  doc.text(`Gerado em ${dataGeracao}${usuarioGeracao ? ` por ${usuarioGeracao}` : ''}`, margin, rodapeY);
  
  // Centro: Identificação do sistema
  doc.text(`${INSTITUICAO.sigla} • Sistema de Gestão de Pessoas`, pageWidth / 2, rodapeY, { align: 'center' });
  
  // Direita: Texto personalizado (se houver)
  if (rodapePersonalizado) {
    doc.text(rodapePersonalizado, pageWidth - margin, rodapeY, { align: 'right' });
  }
}

// ============================================
// FUNÇÃO PRINCIPAL DE RENDERIZAÇÃO
// (Orquestra os 5 blocos)
// ============================================

export interface RenderizarPaginaParams {
  doc: jsPDF;
  data: FrequenciaMensalPDFData;
  rodapePersonalizado?: string;
}

/**
 * Renderiza uma página de frequência com estrutura de 5 blocos modulares
 */
export function renderizarPaginaFrequencia(params: RenderizarPaginaParams): void {
  const { doc, data, rodapePersonalizado } = params;
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 8;
  const contentWidth = pageWidth - margin * 2;

  const { servidor, competencia, dataGeracao, usuarioGeracao } = data;
  
  // Determinar jornada do motor parametrizado
  const cargaHorariaDiaria = servidor.carga_horaria_diaria || 8;
  const usaDoisTurnos = verificarDoisTurnos(cargaHorariaDiaria);

  let y = margin;

  // ===== BLOCO 1: CABEÇALHO INSTITUCIONAL =====
  y = renderizarBloco1Cabecalho({
    doc, y, pageWidth, margin, contentWidth
  });

  // ===== BLOCO 2: DADOS DO SERVIDOR =====
  y = renderizarBloco2DadosServidor({
    doc, y, pageWidth, margin, contentWidth,
    servidor, competencia, cargaHorariaDiaria
  });

  // ===== BLOCO 3: CORPO DA FREQUÊNCIA =====
  y = renderizarBloco3CorpoFrequencia({
    doc, y, pageWidth, pageHeight, margin, contentWidth,
    data, usaDoisTurnos, cargaHorariaDiaria
  });

  // ===== BLOCO 4: DATA E ASSINATURAS =====
  renderizarBloco4Assinaturas({
    doc, y, pageWidth, margin, contentWidth
  });

  // ===== BLOCO 5: RODAPÉ DO SISTEMA =====
  renderizarBloco5Rodape({
    doc, pageWidth, pageHeight, margin,
    dataGeracao, usuarioGeracao, rodapePersonalizado
  });
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

/**
 * Gerador de PDF para Relatórios de Unidades Locais
 * Utiliza o template institucional padrão do IDJUV
 */
import jsPDF from 'jspdf';
import {
  loadLogos,
  generateInstitutionalHeader,
  generateInstitutionalFooter,
  addPageNumbers,
  addSectionHeader,
  addField,
  addTableHeader,
  addTableRow,
  PAGINA,
  CORES,
  setColor,
  getPageDimensions,
  checkPageBreak,
  formatDate,
  formatCurrency,
  LogoCache,
} from './pdfTemplate';

// ============ INTERFACES ============
export interface UnidadeRelatorioData {
  id: string;
  codigo_unidade: string;
  nome_unidade: string;
  tipo_unidade: string;
  municipio: string;
  endereco_completo: string | null;
  status: string;
  natureza_uso: string | null;
  diretoria_vinculada: string | null;
  unidade_administrativa: string | null;
  autoridade_autorizadora: string | null;
  capacidade: number | null;
  horario_funcionamento: string | null;
  estrutura_disponivel: string | null;
  areas_disponiveis: string[];
  regras_de_uso: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  chefe_atual_id: string | null;
  chefe_atual_nome: string | null;
  chefe_atual_cargo: string | null;
  chefe_ato_numero: string | null;
  chefe_data_inicio: string | null;
  total_patrimonio: number;
  patrimonio_valor_total: number;
  patrimonio_bom_estado: number;
  patrimonio_manutencao: number;
  total_agendamentos: number;
  agendamentos_aprovados: number;
  agendamentos_pendentes: number;
  total_termos_cessao: number;
  termos_vigentes: number;
}

export interface CamposRelatorio {
  codigo: boolean;
  nome: boolean;
  tipo: boolean;
  municipio: boolean;
  endereco: boolean;
  status: boolean;
  natureza: boolean;
  diretoria: boolean;
  capacidade: boolean;
  horario: boolean;
  chefe: boolean;
  patrimonio: boolean;
  agendamentos: boolean;
  termos: boolean;
  areas: boolean;
  regras: boolean;
  observacoes: boolean;
}

export interface FiltrosAplicados {
  municipio?: string;
  tipo?: string;
  status?: string;
  natureza?: string;
  diretoria?: string;
  comChefe?: boolean | 'all';
  comPatrimonio?: boolean | 'all';
  comAgendamentos?: boolean | 'all';
  busca?: string;
}

export interface ConfiguracaoRelatorio {
  titulo?: string;
  subtitulo?: string;
  modo: 'lista' | 'detalhado' | 'resumo';
  campos: CamposRelatorio;
  filtros: FiltrosAplicados;
  incluirEstatisticas: boolean;
  incluirTotalizadores: boolean;
}

// ============ LABELS ============
const TIPO_UNIDADE_LABELS: Record<string, string> = {
  ginasio: 'Ginásio',
  estadio: 'Estádio',
  parque_aquatico: 'Parque Aquático',
  piscina: 'Piscina',
  complexo: 'Complexo Esportivo',
  quadra: 'Quadra',
  outro: 'Outro'
};

const STATUS_LABELS: Record<string, string> = {
  ativa: 'Ativa',
  inativa: 'Inativa',
  manutencao: 'Em Manutenção',
  interditada: 'Interditada'
};

const NATUREZA_LABELS: Record<string, string> = {
  esportivo: 'Esportivo',
  cultural: 'Cultural',
  misto: 'Misto',
  lazer: 'Lazer'
};

// ============ FUNÇÕES AUXILIARES ============

const getLabel = (value: string | null | undefined, labels: Record<string, string>): string => {
  if (!value) return '-';
  return labels[value] || value;
};

// ============ GERAÇÃO DO PDF ============

/**
 * Gera relatório de unidades locais em PDF
 */
export const generateRelatorioUnidadesPDF = async (
  unidades: UnidadeRelatorioData[],
  config: ConfiguracaoRelatorio
): Promise<jsPDF> => {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const logos = await loadLogos();
  
  const { width, height, contentWidth } = getPageDimensions(doc);
  
  // Cabeçalho institucional
  let y = await generateInstitutionalHeader(doc, {
    titulo: config.titulo || 'RELATÓRIO DE UNIDADES LOCAIS',
    subtitulo: config.subtitulo || 'Inventário de Acervo de Unidades Esportivas e Culturais',
    fundoEscuro: true,
  }, logos);
  
  // Informações do relatório
  y += 2;
  setColor(doc, CORES.cinzaMedio);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Data de emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, PAGINA.margemEsquerda, y);
  doc.text(`Total de registros: ${unidades.length}`, width - PAGINA.margemDireita, y, { align: 'right' });
  y += 6;
  
  // Filtros aplicados
  const filtrosTexto = gerarTextoFiltros(config.filtros);
  if (filtrosTexto) {
    setColor(doc, CORES.cinzaEscuro);
    doc.setFontSize(7);
    doc.text(`Filtros: ${filtrosTexto}`, PAGINA.margemEsquerda, y);
    y += 5;
  }
  
  // Linha separadora
  setColor(doc, CORES.cinzaMuitoClaro, 'draw');
  doc.setLineWidth(0.3);
  doc.line(PAGINA.margemEsquerda, y, width - PAGINA.margemDireita, y);
  y += 5;
  
  if (config.modo === 'lista') {
    y = gerarModoLista(doc, unidades, config, y, logos);
  } else if (config.modo === 'detalhado') {
    y = await gerarModoDetalhado(doc, unidades, config, y, logos);
  } else {
    y = gerarModoResumo(doc, unidades, config, y);
  }
  
  // Totalizadores
  if (config.incluirTotalizadores) {
    y = checkPageBreak(doc, y, 40);
    y = adicionarTotalizadores(doc, unidades, y);
  }
  
  // Rodapé e paginação
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    generateInstitutionalFooter(doc, { mostrarData: true });
  }
  addPageNumbers(doc);
  
  return doc;
};

/**
 * Gera texto descritivo dos filtros aplicados
 */
const gerarTextoFiltros = (filtros: FiltrosAplicados): string => {
  const partes: string[] = [];
  
  if (filtros.municipio && filtros.municipio !== 'all') {
    partes.push(`Município: ${filtros.municipio}`);
  }
  if (filtros.tipo && filtros.tipo !== 'all') {
    partes.push(`Tipo: ${TIPO_UNIDADE_LABELS[filtros.tipo] || filtros.tipo}`);
  }
  if (filtros.status && filtros.status !== 'all') {
    partes.push(`Status: ${STATUS_LABELS[filtros.status] || filtros.status}`);
  }
  if (filtros.natureza && filtros.natureza !== 'all') {
    partes.push(`Natureza: ${NATUREZA_LABELS[filtros.natureza] || filtros.natureza}`);
  }
  if (filtros.diretoria && filtros.diretoria !== 'all') {
    partes.push(`Diretoria: ${filtros.diretoria}`);
  }
  if (filtros.comChefe === true) {
    partes.push('Com chefe designado');
  } else if (filtros.comChefe === false) {
    partes.push('Sem chefe designado');
  }
  if (filtros.comPatrimonio === true) {
    partes.push('Com patrimônio');
  } else if (filtros.comPatrimonio === false) {
    partes.push('Sem patrimônio');
  }
  if (filtros.busca) {
    partes.push(`Busca: "${filtros.busca}"`);
  }
  
  return partes.join(' | ');
};

/**
 * Modo Lista - Tabela com colunas selecionadas
 */
const gerarModoLista = (
  doc: jsPDF,
  unidades: UnidadeRelatorioData[],
  config: ConfiguracaoRelatorio,
  startY: number,
  logos: { governo: LogoCache | null; idjuvOficial: LogoCache | null; idjuvDark: LogoCache | null }
): number => {
  const { width, contentWidth } = getPageDimensions(doc);
  const { campos } = config;
  
  // Calcular colunas visíveis e larguras
  interface Coluna {
    header: string;
    width: number;
    key: keyof CamposRelatorio;
    getValue: (u: UnidadeRelatorioData) => string;
  }
  
  const todasColunas: Coluna[] = [
    { header: 'Código', width: 28, key: 'codigo', getValue: (u) => u.codigo_unidade || '-' },
    { header: 'Nome', width: 50, key: 'nome', getValue: (u) => u.nome_unidade || '-' },
    { header: 'Tipo', width: 28, key: 'tipo', getValue: (u) => getLabel(u.tipo_unidade, TIPO_UNIDADE_LABELS) },
    { header: 'Município', width: 30, key: 'municipio', getValue: (u) => u.municipio || '-' },
    { header: 'Status', width: 24, key: 'status', getValue: (u) => getLabel(u.status, STATUS_LABELS) },
    { header: 'Natureza', width: 22, key: 'natureza', getValue: (u) => getLabel(u.natureza_uso, NATUREZA_LABELS) },
    { header: 'Diretoria', width: 35, key: 'diretoria', getValue: (u) => u.diretoria_vinculada || '-' },
    { header: 'Capacidade', width: 22, key: 'capacidade', getValue: (u) => u.capacidade?.toString() || '-' },
    { header: 'Chefe Atual', width: 40, key: 'chefe', getValue: (u) => u.chefe_atual_nome || 'Sem chefe' },
    { header: 'Patrimônio', width: 22, key: 'patrimonio', getValue: (u) => `${u.total_patrimonio} itens` },
    { header: 'Agendamentos', width: 25, key: 'agendamentos', getValue: (u) => u.total_agendamentos.toString() },
    { header: 'Termos', width: 20, key: 'termos', getValue: (u) => u.termos_vigentes.toString() },
  ];
  
  const colunasVisiveis = todasColunas.filter(col => campos[col.key]);
  
  if (colunasVisiveis.length === 0) {
    // Se nenhuma coluna selecionada, mostrar as principais
    colunasVisiveis.push(
      todasColunas.find(c => c.key === 'codigo')!,
      todasColunas.find(c => c.key === 'nome')!,
      todasColunas.find(c => c.key === 'municipio')!,
      todasColunas.find(c => c.key === 'status')!
    );
  }
  
  // Ajustar larguras proporcionalmente
  const totalLargura = colunasVisiveis.reduce((acc, col) => acc + col.width, 0);
  const fator = contentWidth / totalLargura;
  colunasVisiveis.forEach(col => {
    col.width = Math.floor(col.width * fator);
  });
  
  let y = startY;
  
  // Cabeçalho da tabela
  setColor(doc, CORES.primaria, 'fill');
  doc.rect(PAGINA.margemEsquerda, y, contentWidth, 7, 'F');
  
  setColor(doc, CORES.textoBranco);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  
  let x = PAGINA.margemEsquerda + 2;
  colunasVisiveis.forEach(col => {
    doc.text(col.header.toUpperCase(), x, y + 5);
    x += col.width;
  });
  y += 9;
  
  // Linhas de dados
  unidades.forEach((unidade, idx) => {
    // Verificar quebra de página
    if (y > doc.internal.pageSize.height - 25) {
      doc.addPage();
      y = 20;
      
      // Repetir cabeçalho
      setColor(doc, CORES.primaria, 'fill');
      doc.rect(PAGINA.margemEsquerda, y, contentWidth, 7, 'F');
      
      setColor(doc, CORES.textoBranco);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      
      x = PAGINA.margemEsquerda + 2;
      colunasVisiveis.forEach(col => {
        doc.text(col.header.toUpperCase(), x, y + 5);
        x += col.width;
      });
      y += 9;
    }
    
    // Fundo alternado
    if (idx % 2 === 1) {
      setColor(doc, CORES.fundoClaro, 'fill');
      doc.rect(PAGINA.margemEsquerda, y - 3, contentWidth, 6, 'F');
    }
    
    // Dados
    setColor(doc, CORES.textoEscuro);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    
    x = PAGINA.margemEsquerda + 2;
    colunasVisiveis.forEach(col => {
      let valor = col.getValue(unidade);
      // Truncar se muito longo
      const maxChars = Math.floor(col.width / 2);
      if (valor.length > maxChars) {
        valor = valor.substring(0, maxChars - 2) + '...';
      }
      doc.text(valor, x, y + 2);
      x += col.width;
    });
    
    y += 6;
  });
  
  return y + 5;
};

/**
 * Modo Detalhado - Ficha completa de cada unidade
 */
const gerarModoDetalhado = async (
  doc: jsPDF,
  unidades: UnidadeRelatorioData[],
  config: ConfiguracaoRelatorio,
  startY: number,
  logos: { governo: LogoCache | null; idjuvOficial: LogoCache | null; idjuvDark: LogoCache | null }
): Promise<number> => {
  const { campos } = config;
  const { width, contentWidth } = getPageDimensions(doc);
  let y = startY;
  
  for (let i = 0; i < unidades.length; i++) {
    const u = unidades[i];
    
    // Nova página para cada unidade (exceto a primeira)
    if (i > 0) {
      doc.addPage();
      y = await generateInstitutionalHeader(doc, {
        titulo: 'FICHA DE UNIDADE LOCAL',
        subtitulo: `${u.codigo_unidade} - ${u.nome_unidade}`,
        fundoEscuro: true,
      }, logos);
    }
    
    // Cabeçalho da ficha
    y = addSectionHeader(doc, 'IDENTIFICAÇÃO', y);
    
    // Campos em grid
    const colWidth = contentWidth / 3;
    
    if (campos.codigo) {
      y = addField(doc, 'CÓDIGO', u.codigo_unidade || '-', PAGINA.margemEsquerda, y, colWidth - 5);
    }
    
    let currentY = y;
    
    // Linha 1
    if (campos.nome) {
      addField(doc, 'NOME', u.nome_unidade || '-', PAGINA.margemEsquerda, currentY, contentWidth);
      currentY += 12;
    }
    
    // Linha 2
    const linha2Y = currentY;
    if (campos.tipo) {
      addField(doc, 'TIPO', getLabel(u.tipo_unidade, TIPO_UNIDADE_LABELS), PAGINA.margemEsquerda, linha2Y, colWidth);
    }
    if (campos.status) {
      addField(doc, 'STATUS', getLabel(u.status, STATUS_LABELS), PAGINA.margemEsquerda + colWidth, linha2Y, colWidth);
    }
    if (campos.natureza) {
      addField(doc, 'NATUREZA', getLabel(u.natureza_uso, NATUREZA_LABELS), PAGINA.margemEsquerda + colWidth * 2, linha2Y, colWidth);
    }
    currentY = linha2Y + 12;
    
    // Linha 3
    const linha3Y = currentY;
    if (campos.municipio) {
      addField(doc, 'MUNICÍPIO', u.municipio || '-', PAGINA.margemEsquerda, linha3Y, colWidth);
    }
    if (campos.capacidade) {
      addField(doc, 'CAPACIDADE', u.capacidade?.toString() || '-', PAGINA.margemEsquerda + colWidth, linha3Y, colWidth);
    }
    if (campos.horario) {
      addField(doc, 'HORÁRIO', u.horario_funcionamento || '-', PAGINA.margemEsquerda + colWidth * 2, linha3Y, colWidth);
    }
    currentY = linha3Y + 12;
    
    // Endereço
    if (campos.endereco && u.endereco_completo) {
      addField(doc, 'ENDEREÇO', u.endereco_completo, PAGINA.margemEsquerda, currentY, contentWidth);
      currentY += 12;
    }
    
    // Diretoria
    if (campos.diretoria && u.diretoria_vinculada) {
      addField(doc, 'DIRETORIA VINCULADA', u.diretoria_vinculada, PAGINA.margemEsquerda, currentY, contentWidth);
      currentY += 12;
    }
    
    y = currentY + 5;
    
    // Seção: Responsável
    if (campos.chefe) {
      y = checkPageBreak(doc, y, 30);
      y = addSectionHeader(doc, 'RESPONSÁVEL', y);
      
      if (u.chefe_atual_nome) {
        addField(doc, 'NOME', u.chefe_atual_nome, PAGINA.margemEsquerda, y, colWidth * 2);
        addField(doc, 'CARGO', u.chefe_atual_cargo || '-', PAGINA.margemEsquerda + colWidth * 2, y, colWidth);
        y += 12;
        
        if (u.chefe_ato_numero) {
          addField(doc, 'ATO DE NOMEAÇÃO', u.chefe_ato_numero, PAGINA.margemEsquerda, y, colWidth);
          addField(doc, 'DATA DE INÍCIO', formatDate(u.chefe_data_inicio), PAGINA.margemEsquerda + colWidth, y, colWidth);
        }
        y += 12;
      } else {
        setColor(doc, CORES.alerta);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.text('Nenhum responsável designado', PAGINA.margemEsquerda, y + 5);
        y += 12;
      }
    }
    
    // Seção: Patrimônio
    if (campos.patrimonio) {
      y = checkPageBreak(doc, y, 30);
      y = addSectionHeader(doc, 'PATRIMÔNIO', y);
      
      addField(doc, 'TOTAL DE ITENS', u.total_patrimonio.toString(), PAGINA.margemEsquerda, y, colWidth);
      addField(doc, 'VALOR ESTIMADO', formatCurrency(u.patrimonio_valor_total), PAGINA.margemEsquerda + colWidth, y, colWidth);
      addField(doc, 'BOM ESTADO', u.patrimonio_bom_estado.toString(), PAGINA.margemEsquerda + colWidth * 2, y, colWidth);
      y += 15;
    }
    
    // Seção: Agendamentos
    if (campos.agendamentos) {
      y = checkPageBreak(doc, y, 30);
      y = addSectionHeader(doc, 'AGENDAMENTOS', y);
      
      addField(doc, 'TOTAL', u.total_agendamentos.toString(), PAGINA.margemEsquerda, y, colWidth);
      addField(doc, 'APROVADOS', u.agendamentos_aprovados.toString(), PAGINA.margemEsquerda + colWidth, y, colWidth);
      addField(doc, 'PENDENTES', u.agendamentos_pendentes.toString(), PAGINA.margemEsquerda + colWidth * 2, y, colWidth);
      y += 15;
    }
    
    // Seção: Termos de Cessão
    if (campos.termos) {
      y = checkPageBreak(doc, y, 25);
      y = addSectionHeader(doc, 'TERMOS DE CESSÃO', y);
      
      addField(doc, 'TOTAL', u.total_termos_cessao.toString(), PAGINA.margemEsquerda, y, colWidth);
      addField(doc, 'VIGENTES', u.termos_vigentes.toString(), PAGINA.margemEsquerda + colWidth, y, colWidth);
      y += 15;
    }
    
    // Seção: Áreas Disponíveis
    if (campos.areas && u.areas_disponiveis?.length > 0) {
      y = checkPageBreak(doc, y, 25);
      y = addSectionHeader(doc, 'ÁREAS DISPONÍVEIS', y);
      
      setColor(doc, CORES.textoEscuro);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(u.areas_disponiveis.join(', '), PAGINA.margemEsquerda, y + 5);
      y += 15;
    }
    
    // Seção: Observações
    if (campos.observacoes && u.observacoes) {
      y = checkPageBreak(doc, y, 30);
      y = addSectionHeader(doc, 'OBSERVAÇÕES', y);
      
      setColor(doc, CORES.textoEscuro);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(u.observacoes, contentWidth - 5);
      doc.text(lines, PAGINA.margemEsquerda, y + 5);
      y += lines.length * 4 + 10;
    }
  }
  
  return y;
};

/**
 * Modo Resumo - Estatísticas agregadas
 */
const gerarModoResumo = (
  doc: jsPDF,
  unidades: UnidadeRelatorioData[],
  config: ConfiguracaoRelatorio,
  startY: number
): number => {
  const { width, contentWidth } = getPageDimensions(doc);
  let y = startY;
  
  // Estatísticas Gerais
  y = addSectionHeader(doc, 'ESTATÍSTICAS GERAIS', y);
  
  const total = unidades.length;
  const ativas = unidades.filter(u => u.status === 'ativa').length;
  const manutencao = unidades.filter(u => u.status === 'manutencao').length;
  const interditadas = unidades.filter(u => u.status === 'interditada').length;
  const comChefe = unidades.filter(u => u.chefe_atual_id).length;
  const totalPatrimonio = unidades.reduce((acc, u) => acc + u.total_patrimonio, 0);
  const valorPatrimonio = unidades.reduce((acc, u) => acc + u.patrimonio_valor_total, 0);
  
  const colWidth = contentWidth / 4;
  
  addField(doc, 'TOTAL DE UNIDADES', total.toString(), PAGINA.margemEsquerda, y, colWidth);
  addField(doc, 'UNIDADES ATIVAS', ativas.toString(), PAGINA.margemEsquerda + colWidth, y, colWidth);
  addField(doc, 'EM MANUTENÇÃO', manutencao.toString(), PAGINA.margemEsquerda + colWidth * 2, y, colWidth);
  addField(doc, 'INTERDITADAS', interditadas.toString(), PAGINA.margemEsquerda + colWidth * 3, y, colWidth);
  y += 15;
  
  addField(doc, 'COM CHEFE DESIGNADO', comChefe.toString(), PAGINA.margemEsquerda, y, colWidth);
  addField(doc, 'SEM CHEFE DESIGNADO', (total - comChefe).toString(), PAGINA.margemEsquerda + colWidth, y, colWidth);
  addField(doc, 'TOTAL PATRIMÔNIO', `${totalPatrimonio} itens`, PAGINA.margemEsquerda + colWidth * 2, y, colWidth);
  addField(doc, 'VALOR PATRIMÔNIO', formatCurrency(valorPatrimonio), PAGINA.margemEsquerda + colWidth * 3, y, colWidth);
  y += 20;
  
  // Por Tipo
  y = addSectionHeader(doc, 'DISTRIBUIÇÃO POR TIPO', y);
  
  const porTipo = Object.keys(TIPO_UNIDADE_LABELS).map(tipo => ({
    tipo,
    label: TIPO_UNIDADE_LABELS[tipo],
    quantidade: unidades.filter(u => u.tipo_unidade === tipo).length
  })).filter(t => t.quantidade > 0);
  
  porTipo.forEach((item, idx) => {
    const itemX = PAGINA.margemEsquerda + (idx % 4) * (colWidth);
    const itemY = y + Math.floor(idx / 4) * 10;
    addField(doc, item.label.toUpperCase(), item.quantidade.toString(), itemX, itemY, colWidth);
  });
  y += Math.ceil(porTipo.length / 4) * 10 + 10;
  
  // Por Município
  y = checkPageBreak(doc, y, 50);
  y = addSectionHeader(doc, 'DISTRIBUIÇÃO POR MUNICÍPIO', y);
  
  const porMunicipio = [...new Set(unidades.map(u => u.municipio))]
    .filter(Boolean)
    .map(mun => ({
      municipio: mun,
      quantidade: unidades.filter(u => u.municipio === mun).length
    }))
    .sort((a, b) => b.quantidade - a.quantidade);
  
  porMunicipio.forEach((item, idx) => {
    if (y > doc.internal.pageSize.height - 20) {
      doc.addPage();
      y = 20;
    }
    
    const itemX = PAGINA.margemEsquerda + (idx % 3) * (contentWidth / 3);
    if (idx % 3 === 0 && idx > 0) {
      y += 10;
    }
    addField(doc, item.municipio.toUpperCase(), item.quantidade.toString(), itemX, y, contentWidth / 3);
  });
  y += 15;
  
  return y;
};

/**
 * Adiciona totalizadores ao final do relatório
 */
const adicionarTotalizadores = (
  doc: jsPDF,
  unidades: UnidadeRelatorioData[],
  startY: number
): number => {
  const { width, contentWidth } = getPageDimensions(doc);
  let y = startY + 5;
  
  // Linha separadora
  setColor(doc, CORES.secundaria, 'draw');
  doc.setLineWidth(1);
  doc.line(PAGINA.margemEsquerda, y, width - PAGINA.margemDireita, y);
  y += 8;
  
  // Totais
  const total = unidades.length;
  const totalPatrimonio = unidades.reduce((acc, u) => acc + u.total_patrimonio, 0);
  const valorPatrimonio = unidades.reduce((acc, u) => acc + u.patrimonio_valor_total, 0);
  const totalAgendamentos = unidades.reduce((acc, u) => acc + u.total_agendamentos, 0);
  
  setColor(doc, CORES.primaria);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  
  doc.text('TOTALIZADORES', PAGINA.margemEsquerda, y);
  y += 6;
  
  setColor(doc, CORES.textoEscuro);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  const colWidth = contentWidth / 4;
  doc.text(`Unidades: ${total}`, PAGINA.margemEsquerda, y);
  doc.text(`Itens de Patrimônio: ${totalPatrimonio}`, PAGINA.margemEsquerda + colWidth, y);
  doc.text(`Valor Total: ${formatCurrency(valorPatrimonio)}`, PAGINA.margemEsquerda + colWidth * 2, y);
  doc.text(`Agendamentos: ${totalAgendamentos}`, PAGINA.margemEsquerda + colWidth * 3, y);
  
  return y + 10;
};

/**
 * Gera e baixa o PDF
 */
export const downloadRelatorioUnidadesPDF = async (
  unidades: UnidadeRelatorioData[],
  config: ConfiguracaoRelatorio
): Promise<void> => {
  const doc = await generateRelatorioUnidadesPDF(unidades, config);
  
  const dataStr = new Date().toISOString().split('T')[0];
  const modoSufixo = config.modo === 'detalhado' ? '-detalhado' : config.modo === 'resumo' ? '-resumo' : '';
  const filename = `relatorio-unidades${modoSufixo}-${dataStr}.pdf`;
  
  doc.save(filename);
};

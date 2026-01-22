/**
 * Template institucional unificado para geração de PDFs do IDJUV-RR
 * Centraliza estilos, cabeçalhos, rodapés e componentes reutilizáveis
 */
import jsPDF from 'jspdf';
import logoGovernoSrc from '@/assets/logo-governo-roraima.jpg';
import logoIDJUVOficialSrc from '@/assets/logo-idjuv-oficial.png';
import logoIDJUVDarkSrc from '@/assets/logo-idjuv-dark4.png';

// ============ CORES INSTITUCIONAIS ============
export const CORES = {
  // Verde institucional IDJUV
  primaria: { r: 0, g: 68, b: 68 },           // #004444
  secundaria: { r: 39, g: 174, b: 96 },       // #27AE60
  
  // Tons de cinza
  cinzaEscuro: { r: 60, g: 60, b: 60 },
  cinzaMedio: { r: 100, g: 100, b: 100 },
  cinzaClaro: { r: 128, g: 128, b: 128 },
  cinzaMuitoClaro: { r: 230, g: 230, b: 230 },
  fundoClaro: { r: 248, g: 250, b: 252 },
  
  // Texto
  textoEscuro: { r: 0, g: 0, b: 0 },
  textoBranco: { r: 255, g: 255, b: 255 },
  
  // Status
  sucesso: { r: 34, g: 197, b: 94 },
  alerta: { r: 234, g: 179, b: 8 },
  erro: { r: 220, g: 38, b: 38 },
};

// ============ CACHE DE LOGOS ============
export interface LogoCache {
  data: string | null;
  width: number;
  height: number;
}

let cachedLogoGoverno: LogoCache | null = null;
let cachedLogoIDJUVOficial: LogoCache | null = null;
let cachedLogoIDJUVDark: LogoCache | null = null;

/**
 * Carrega imagem como base64 preservando dimensões originais
 */
export const loadImageWithDimensions = async (src: string): Promise<LogoCache> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve({
          data: canvas.toDataURL('image/png'),
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Calcula dimensões mantendo aspect ratio
 * @param originalWidth Largura original da imagem
 * @param originalHeight Altura original da imagem
 * @param maxHeight Altura máxima desejada
 * @returns Dimensões calculadas preservando proporção
 */
export const calculateLogoDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxHeight: number
): { width: number; height: number } => {
  const aspectRatio = originalWidth / originalHeight;
  const height = maxHeight;
  const width = height * aspectRatio;
  return { width, height };
};

/**
 * Carrega e cacheia as logos institucionais com dimensões
 */
export const loadLogos = async (): Promise<{
  governo: LogoCache | null;
  idjuvOficial: LogoCache | null;
  idjuvDark: LogoCache | null;
}> => {
  if (!cachedLogoGoverno) {
    try {
      cachedLogoGoverno = await loadImageWithDimensions(logoGovernoSrc);
    } catch (e) {
      console.warn('Não foi possível carregar logo do governo');
    }
  }
  if (!cachedLogoIDJUVOficial) {
    try {
      cachedLogoIDJUVOficial = await loadImageWithDimensions(logoIDJUVOficialSrc);
    } catch (e) {
      console.warn('Não foi possível carregar logo oficial do IDJUV');
    }
  }
  if (!cachedLogoIDJUVDark) {
    try {
      cachedLogoIDJUVDark = await loadImageWithDimensions(logoIDJUVDarkSrc);
    } catch (e) {
      console.warn('Não foi possível carregar logo dark do IDJUV');
    }
  }
  
  return {
    governo: cachedLogoGoverno,
    idjuvOficial: cachedLogoIDJUVOficial,
    idjuvDark: cachedLogoIDJUVDark,
  };
};

// ============ DIMENSÕES PADRÃO ============
export const PAGINA = {
  margem: 15,
  margemEsquerda: 20,
  margemDireita: 20,
  margemSuperior: 15,
  margemInferior: 20,
};

// ============ INTERFACES ============
export interface HeaderConfig {
  titulo: string;
  subtitulo?: string;
  numero?: string;
  data?: string;
  fundoEscuro?: boolean;
}

export interface FooterConfig {
  sistema?: string;
  mostrarData?: boolean;
  mostrarPaginacao?: boolean;
}

export interface SecaoConfig {
  numerada?: boolean;
  numero?: number;
}

export interface CampoConfig {
  label: string;
  valor: string;
  largura?: number;
  x?: number;
  y?: number;
}

export interface AssinaturaConfig {
  cargo: string;
  nome?: string;
  x?: number;
  largura?: number;
}

// ============ FUNÇÕES AUXILIARES ============

/**
 * Obtém dimensões da página
 */
export const getPageDimensions = (doc: jsPDF) => ({
  width: doc.internal.pageSize.width,
  height: doc.internal.pageSize.height,
  contentWidth: doc.internal.pageSize.width - PAGINA.margemEsquerda - PAGINA.margemDireita,
});

/**
 * Aplica cor ao documento
 */
export const setColor = (doc: jsPDF, cor: { r: number; g: number; b: number }, tipo: 'fill' | 'text' | 'draw' = 'text') => {
  if (tipo === 'fill') {
    doc.setFillColor(cor.r, cor.g, cor.b);
  } else if (tipo === 'draw') {
    doc.setDrawColor(cor.r, cor.g, cor.b);
  } else {
    doc.setTextColor(cor.r, cor.g, cor.b);
  }
};

// ============ CABEÇALHO INSTITUCIONAL ============

// Altura máxima das logos no cabeçalho
const LOGO_MAX_HEIGHT = 14;

/**
 * Adiciona logo com proporção correta
 */
const addLogoWithAspectRatio = (
  doc: jsPDF,
  logo: LogoCache,
  x: number,
  y: number,
  maxHeight: number,
  format: 'JPEG' | 'PNG' = 'PNG'
): number => {
  const dims = calculateLogoDimensions(logo.width, logo.height, maxHeight);
  if (logo.data) {
    doc.addImage(logo.data, format, x, y, dims.width, dims.height);
  }
  return dims.width;
};

/**
 * Gera cabeçalho institucional padrão
 * @param doc Documento jsPDF
 * @param config Configuração do cabeçalho
 * @param logos Logos carregadas
 * @returns Posição Y após o cabeçalho
 */
export const generateInstitutionalHeader = async (
  doc: jsPDF,
  config: HeaderConfig,
  logos?: { governo: LogoCache | null; idjuvOficial: LogoCache | null; idjuvDark: LogoCache | null }
): Promise<number> => {
  const { width } = getPageDimensions(doc);
  const carregadas = logos || await loadLogos();
  
  const headerHeight = 30;
  const logoY = 8;
  const logoMargin = 12;
  
  // Fundo escuro (padrão para header institucional)
  if (config.fundoEscuro !== false) {
    setColor(doc, CORES.primaria, 'fill');
    doc.rect(0, 0, width, headerHeight, 'F');
    
    // Logo Governo (esquerda) - mantendo proporção
    if (carregadas.governo?.data) {
      try {
        addLogoWithAspectRatio(doc, carregadas.governo, logoMargin, logoY, LOGO_MAX_HEIGHT, 'JPEG');
      } catch (e) { /* silently fail */ }
    }
    
    // Logo IDJUV Dark (direita - para fundo escuro) - mantendo proporção
    const logoIdjuv = carregadas.idjuvDark || carregadas.idjuvOficial;
    if (logoIdjuv?.data) {
      try {
        const dims = calculateLogoDimensions(logoIdjuv.width, logoIdjuv.height, LOGO_MAX_HEIGHT);
        doc.addImage(logoIdjuv.data, 'PNG', width - logoMargin - dims.width, logoY, dims.width, dims.height);
      } catch (e) { /* silently fail */ }
    }
    
    // Textos
    setColor(doc, CORES.textoBranco);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('GOVERNO DO ESTADO DE RORAIMA', width / 2, 12, { align: 'center' });
    doc.setFontSize(9);
    doc.text('INSTITUTO DE DESPORTO, JUVENTUDE E LAZER - IDJUV', width / 2, 18, { align: 'center' });
    
    if (config.titulo) {
      doc.setFontSize(11);
      doc.text(config.titulo.toUpperCase(), width / 2, 26, { align: 'center' });
    }
    
    // Linha divisória verde
    setColor(doc, CORES.secundaria, 'draw');
    doc.setLineWidth(1);
    doc.line(0, headerHeight, width, headerHeight);
  } else {
    // Fundo claro (alternativo)
    // Logo Governo (esquerda) - mantendo proporção
    if (carregadas.governo?.data) {
      try {
        addLogoWithAspectRatio(doc, carregadas.governo, logoMargin, logoY, LOGO_MAX_HEIGHT, 'JPEG');
      } catch (e) { /* silently fail */ }
    }
    
    // Logo IDJUV Oficial (direita - para fundo claro) - mantendo proporção
    if (carregadas.idjuvOficial?.data) {
      try {
        const dims = calculateLogoDimensions(carregadas.idjuvOficial.width, carregadas.idjuvOficial.height, LOGO_MAX_HEIGHT);
        doc.addImage(carregadas.idjuvOficial.data, 'PNG', width - logoMargin - dims.width, logoY, dims.width, dims.height);
      } catch (e) { /* silently fail */ }
    }
    
    // Textos
    setColor(doc, CORES.primaria);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('GOVERNO DO ESTADO DE RORAIMA', width / 2, 12, { align: 'center' });
    doc.setFontSize(9);
    doc.text('INSTITUTO DE DESPORTO, JUVENTUDE E LAZER - IDJUV', width / 2, 18, { align: 'center' });
    
    // Linha divisória
    setColor(doc, CORES.primaria, 'draw');
    doc.setLineWidth(0.5);
    doc.line(PAGINA.margemEsquerda, 25, width - PAGINA.margemDireita, 25);
  }
  
  let y = config.fundoEscuro !== false ? 38 : 32;
  
  // Título do documento (se não estiver no header escuro)
  if (config.fundoEscuro === false && config.titulo) {
    setColor(doc, CORES.textoEscuro);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(config.titulo.toUpperCase(), width / 2, y, { align: 'center' });
    y += 8;
  }
  
  // Subtítulo
  if (config.subtitulo) {
    setColor(doc, CORES.cinzaMedio);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(config.subtitulo, width / 2, y, { align: 'center' });
    y += 6;
  }
  
  // Número e Data
  if (config.numero || config.data) {
    setColor(doc, CORES.textoEscuro);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    
    if (config.numero) {
      doc.text(`Nº ${config.numero}`, width / 2, y, { align: 'center' });
      y += 6;
    }
    
    if (config.data) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Data: ${config.data}`, width - PAGINA.margemDireita, y, { align: 'right' });
    }
    y += 4;
  }
  
  // Linha separadora
  setColor(doc, CORES.cinzaMuitoClaro, 'draw');
  doc.setLineWidth(0.3);
  doc.line(PAGINA.margemEsquerda, y, width - PAGINA.margemDireita, y);
  
  return y + 8;
};

// ============ RODAPÉ INSTITUCIONAL ============

/**
 * Gera rodapé institucional padrão
 */
export const generateInstitutionalFooter = (
  doc: jsPDF,
  config: FooterConfig = {}
) => {
  const { width, height } = getPageDimensions(doc);
  const sistema = config.sistema || 'Sistema de Governança Digital IDJUV';
  
  setColor(doc, CORES.cinzaClaro);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  
  doc.text(`Documento gerado pelo ${sistema}`, width / 2, height - 12, { align: 'center' });
  
  if (config.mostrarData !== false) {
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, width / 2, height - 7, { align: 'center' });
  }
};

/**
 * Adiciona numeração de páginas
 */
export const addPageNumbers = (doc: jsPDF) => {
  const totalPages = doc.getNumberOfPages();
  const { width, height } = getPageDimensions(doc);
  
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    setColor(doc, CORES.cinzaClaro);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Página ${i} de ${totalPages}`, width / 2, height - 3, { align: 'center' });
  }
};

// ============ SEÇÕES ============

/**
 * Adiciona cabeçalho de seção com fundo colorido
 */
export const addSectionHeader = (
  doc: jsPDF,
  titulo: string,
  y: number,
  config: SecaoConfig = {}
): number => {
  const { width, contentWidth } = getPageDimensions(doc);
  const tituloCompleto = config.numerada && config.numero 
    ? `${config.numero}. ${titulo.toUpperCase()}`
    : titulo.toUpperCase();
  
  setColor(doc, CORES.secundaria, 'fill');
  doc.rect(PAGINA.margemEsquerda, y, contentWidth, 7, 'F');
  
  setColor(doc, CORES.textoBranco);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(tituloCompleto, PAGINA.margemEsquerda + 4, y + 5);
  
  return y + 11;
};

/**
 * Adiciona cabeçalho de seção simples (sem fundo)
 */
export const addSectionTitle = (
  doc: jsPDF,
  titulo: string,
  y: number,
  config: SecaoConfig = {}
): number => {
  const tituloCompleto = config.numerada && config.numero 
    ? `${config.numero}. ${titulo}`
    : titulo;
  
  setColor(doc, CORES.primaria);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(tituloCompleto, PAGINA.margemEsquerda, y);
  
  return y + 8;
};

// ============ CAMPOS ============

/**
 * Adiciona campo com label e valor
 */
export const addField = (
  doc: jsPDF,
  label: string,
  valor: string,
  x: number,
  y: number,
  largura: number = 80
): number => {
  setColor(doc, CORES.cinzaMedio);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(label, x, y);
  
  setColor(doc, CORES.textoEscuro);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const lines = doc.splitTextToSize(valor || '-', largura - 5);
  doc.text(lines, x, y + 4);
  
  return y + 4 + (lines.length * 4);
};

/**
 * Adiciona campo com linha para preenchimento manual
 */
export const addFieldWithLine = (
  doc: jsPDF,
  label: string,
  valor: string,
  x: number,
  y: number,
  largura: number = 80
): number => {
  setColor(doc, CORES.cinzaMedio);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`${label}:`, x, y);
  
  const labelWidth = doc.getTextWidth(`${label}: `);
  const lineStart = x + labelWidth + 2;
  const lineEnd = x + largura;
  
  if (valor) {
    setColor(doc, CORES.textoEscuro);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(valor, lineStart, y);
  } else {
    setColor(doc, CORES.cinzaMuitoClaro, 'draw');
    doc.setLineWidth(0.3);
    doc.line(lineStart, y + 1, lineEnd, y + 1);
  }
  
  return y + 6;
};

/**
 * Adiciona campo de texto longo (fullwidth)
 */
export const addTextArea = (
  doc: jsPDF,
  label: string,
  valor: string,
  y: number,
  linhas: number = 3
): number => {
  const { contentWidth } = getPageDimensions(doc);
  
  setColor(doc, CORES.cinzaMedio);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(label, PAGINA.margemEsquerda, y);
  y += 5;
  
  if (valor) {
    setColor(doc, CORES.textoEscuro);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(valor, contentWidth - 5);
    doc.text(lines, PAGINA.margemEsquerda, y);
    return y + (lines.length * 4) + 4;
  } else {
    // Linhas vazias para preenchimento
    setColor(doc, CORES.cinzaMuitoClaro, 'draw');
    doc.setLineWidth(0.3);
    for (let i = 0; i < linhas; i++) {
      doc.line(PAGINA.margemEsquerda, y + (i * 6), PAGINA.margemEsquerda + contentWidth, y + (i * 6));
    }
    return y + (linhas * 6) + 4;
  }
};

/**
 * Adiciona checkbox
 */
export const addCheckbox = (
  doc: jsPDF,
  label: string,
  checked: boolean,
  x: number,
  y: number
): number => {
  // Desenha o checkbox
  setColor(doc, CORES.cinzaMedio, 'draw');
  doc.setLineWidth(0.3);
  doc.rect(x, y - 3, 4, 4);
  
  // Marca o checkbox se checked
  if (checked) {
    setColor(doc, CORES.secundaria, 'fill');
    doc.rect(x + 0.8, y - 2.2, 2.4, 2.4, 'F');
  }
  
  // Label
  setColor(doc, CORES.textoEscuro);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(label, x + 7, y);
  
  return y + 6;
};

// ============ ASSINATURAS ============

/**
 * Adiciona área de assinaturas
 */
export const addSignatureArea = (
  doc: jsPDF,
  assinaturas: AssinaturaConfig[],
  y: number
): number => {
  const { width, contentWidth } = getPageDimensions(doc);
  const espacamento = contentWidth / assinaturas.length;
  
  assinaturas.forEach((ass, idx) => {
    const x = ass.x || (PAGINA.margemEsquerda + (espacamento * idx) + espacamento / 2);
    const largura = ass.largura || 60;
    
    // Linha da assinatura
    setColor(doc, CORES.textoEscuro, 'draw');
    doc.setLineWidth(0.3);
    doc.line(x - largura / 2, y, x + largura / 2, y);
    
    // Cargo
    setColor(doc, CORES.textoEscuro);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(ass.cargo, x, y + 5, { align: 'center' });
    
    // Nome (se fornecido)
    if (ass.nome) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text(ass.nome, x, y + 10, { align: 'center' });
    }
  });
  
  return y + 15;
};

/**
 * Adiciona local e data
 */
export const addLocalData = (doc: jsPDF, local: string, y: number): number => {
  const { width } = getPageDimensions(doc);
  const dataFormatada = new Date().toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });
  
  setColor(doc, CORES.textoEscuro);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`${local}, ${dataFormatada}`, width / 2, y, { align: 'center' });
  
  return y + 8;
};

// ============ TABELAS ============

interface TabelaColuna {
  header: string;
  width: number;
  align?: 'left' | 'center' | 'right';
}

/**
 * Adiciona cabeçalho de tabela
 */
export const addTableHeader = (
  doc: jsPDF,
  colunas: TabelaColuna[],
  y: number
): number => {
  const { contentWidth } = getPageDimensions(doc);
  
  setColor(doc, CORES.primaria, 'fill');
  doc.rect(PAGINA.margemEsquerda, y - 4, contentWidth, 7, 'F');
  
  setColor(doc, CORES.textoBranco);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  
  let x = PAGINA.margemEsquerda + 2;
  colunas.forEach(col => {
    doc.text(col.header, x, y);
    x += col.width;
  });
  
  return y + 5;
};

/**
 * Adiciona linha de tabela
 */
export const addTableRow = (
  doc: jsPDF,
  valores: string[],
  colunas: TabelaColuna[],
  y: number,
  alternado: boolean = false
): number => {
  const { contentWidth } = getPageDimensions(doc);
  
  if (alternado) {
    setColor(doc, CORES.fundoClaro, 'fill');
    doc.rect(PAGINA.margemEsquerda, y - 3, contentWidth, 5, 'F');
  }
  
  setColor(doc, CORES.textoEscuro);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  
  let x = PAGINA.margemEsquerda + 2;
  colunas.forEach((col, idx) => {
    const valor = valores[idx] || '-';
    const textoTruncado = valor.substring(0, Math.floor(col.width / 2));
    doc.text(textoTruncado, x, y);
    x += col.width;
  });
  
  return y + 5;
};

// ============ UTILITÁRIOS ============

/**
 * Formata CPF
 */
export const formatCPF = (cpf: string): string => {
  if (!cpf) return '-';
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/**
 * Formata data
 */
export const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('pt-BR');
  } catch {
    return '-';
  }
};

/**
 * Formata moeda
 */
export const formatCurrency = (value: number | null | undefined): string => {
  if (!value && value !== 0) return '-';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

/**
 * Gera número de documento
 */
export const generateDocumentNumber = (prefix: string): string => {
  const now = new Date();
  const year = now.getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}${random}/${year}`;
};

/**
 * Verifica se precisa de nova página
 */
export const checkPageBreak = (
  doc: jsPDF,
  currentY: number,
  neededSpace: number = 40
): number => {
  const { height } = getPageDimensions(doc);
  if (currentY > height - neededSpace) {
    doc.addPage();
    return 30;
  }
  return currentY;
};

// ============ LABELS ============

export const VINCULO_LABELS: Record<string, string> = {
  efetivo: 'Efetivo',
  comissionado: 'Comissionado',
  cedido: 'Cedido',
  temporario: 'Temporário',
  estagiario: 'Estagiário',
  requisitado: 'Requisitado',
};

export const SITUACAO_LABELS: Record<string, string> = {
  ativo: 'Ativo',
  afastado: 'Afastado',
  cedido: 'Cedido',
  licenca: 'Em Licença',
  ferias: 'Em Férias',
  exonerado: 'Exonerado',
  aposentado: 'Aposentado',
  falecido: 'Falecido',
};

export const CATEGORIA_LABELS: Record<string, string> = {
  efetivo: 'Efetivo',
  comissionado: 'Comissionado',
  funcao_gratificada: 'Função Gratificada',
  temporario: 'Temporário',
  estagiario: 'Estagiário',
};

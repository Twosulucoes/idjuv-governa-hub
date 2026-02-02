/**
 * Sistema Institucional de Relatórios e PDFs - IDJuv-RR
 * 
 * Este módulo centraliza TODA a geração de documentos oficiais do sistema,
 * garantindo padronização visual, conformidade administrativa e identidade institucional.
 * 
 * REGRA DE OURO: Nenhum PDF pode ser gerado fora deste padrão.
 * 
 * Estrutura obrigatória:
 * ┌─────────────────────────────────────────────┐
 * │ CABEÇALHO INSTITUCIONAL (fixo em todas pág) │
 * │ - Logo Governo RR (esquerda)                │
 * │ - Logo IDJuv (direita)                      │
 * │ - Textos institucionais (centro)            │
 * ├─────────────────────────────────────────────┤
 * │ TÍTULO DO DOCUMENTO                         │
 * │ - Título principal (obrigatório)            │
 * │ - Subtítulo (opcional)                      │
 * ├─────────────────────────────────────────────┤
 * │ CORPO DO RELATÓRIO                          │
 * │ - Conteúdo específico de cada documento     │
 * ├─────────────────────────────────────────────┤
 * │ RODAPÉ INSTITUCIONAL (fixo em todas pág)   │
 * │ - Sistema, data/hora, usuário, paginação    │
 * └─────────────────────────────────────────────┘
 */

import jsPDF from 'jspdf';
import logoGovernoSrc from '@/assets/logo-governo-roraima.jpg';
import logoIDJUVOficialSrc from '@/assets/logo-idjuv-oficial.png';
import logoIDJUVDarkSrc from '@/assets/logo-idjuv-dark4.png';
import { LOGO_ASPECTOS, getLogosPDF } from './pdfLogos';

// ============ CORES INSTITUCIONAIS ============
export const CORES_INSTITUCIONAIS = {
  // Verde institucional IDJuv
  primaria: { r: 0, g: 68, b: 68 },       // #004444
  secundaria: { r: 39, g: 174, b: 96 },   // #27AE60 - Destaques
  acento: { r: 180, g: 145, b: 75 },      // #B4914B - Dourado institucional
  
  // Textos
  textoEscuro: { r: 33, g: 33, b: 33 },   // #212121
  textoMedio: { r: 100, g: 100, b: 100 }, // #646464
  textoClaro: { r: 128, g: 128, b: 128 }, // #808080
  textoBranco: { r: 255, g: 255, b: 255 },
  
  // Fundos e bordas
  fundoClaro: { r: 248, g: 250, b: 252 }, // #F8FAFC
  bordaClara: { r: 230, g: 230, b: 230 }, // #E6E6E6
  bordaMedia: { r: 200, g: 200, b: 200 }, // #C8C8C8
  
  // Status
  sucesso: { r: 34, g: 197, b: 94 },
  alerta: { r: 234, g: 179, b: 8 },
  erro: { r: 220, g: 38, b: 38 },
} as const;

// ============ MARGENS PADRONIZADAS (em mm) ============
export const MARGENS = {
  superior: 25,    // 2.5 cm
  inferior: 25,    // 2.5 cm
  esquerda: 20,    // 2.0 cm
  direita: 20,     // 2.0 cm
  
  // Derivados
  get larguraUtil() {
    return 210 - this.esquerda - this.direita; // A4 = 210mm
  },
  get alturaUtil() {
    return 297 - this.superior - this.inferior; // A4 = 297mm
  },
} as const;

// ============ TIPOGRAFIA INSTITUCIONAL ============
export const TIPOGRAFIA = {
  // Títulos
  tituloDocumento: { size: 14, font: 'helvetica', style: 'bold' as const },
  subtitulo: { size: 11, font: 'helvetica', style: 'normal' as const },
  
  // Cabeçalho
  governo: { size: 10, font: 'helvetica', style: 'bold' as const },
  orgao: { size: 9, font: 'helvetica', style: 'bold' as const },
  
  // Corpo
  secao: { size: 11, font: 'helvetica', style: 'bold' as const },
  corpo: { size: 10, font: 'helvetica', style: 'normal' as const },
  label: { size: 9, font: 'helvetica', style: 'bold' as const },
  valor: { size: 9, font: 'helvetica', style: 'normal' as const },
  
  // Rodapé
  rodape: { size: 8, font: 'helvetica', style: 'normal' as const },
  paginacao: { size: 8, font: 'helvetica', style: 'normal' as const },
} as const;

// ============ CACHE DE LOGOS ============
interface LogoCache {
  data: string | null;
  width: number;
  height: number;
}

let cachedLogos: {
  governo: LogoCache | null;
  idjuvOficial: LogoCache | null;
  idjuvDark: LogoCache | null;
} | null = null;

/**
 * Carrega imagem como base64 preservando dimensões originais
 */
const loadImageWithDimensions = async (src: string): Promise<LogoCache> => {
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
 * Carrega e cacheia as logos institucionais
 */
export const carregarLogos = async (): Promise<typeof cachedLogos> => {
  if (cachedLogos) return cachedLogos;
  
  cachedLogos = {
    governo: null,
    idjuvOficial: null,
    idjuvDark: null,
  };
  
  try {
    cachedLogos.governo = await loadImageWithDimensions(logoGovernoSrc);
  } catch (e) {
    console.warn('Não foi possível carregar logo do governo');
  }
  
  try {
    cachedLogos.idjuvOficial = await loadImageWithDimensions(logoIDJUVOficialSrc);
  } catch (e) {
    console.warn('Não foi possível carregar logo oficial do IDJuv');
  }
  
  try {
    cachedLogos.idjuvDark = await loadImageWithDimensions(logoIDJUVDarkSrc);
  } catch (e) {
    console.warn('Não foi possível carregar logo dark do IDJuv');
  }
  
  return cachedLogos;
};

// ============ INTERFACES ============

export interface ConfiguracaoDocumento {
  /** Título principal do documento (obrigatório) */
  titulo: string;
  /** Subtítulo opcional */
  subtitulo?: string;
  /** Número do documento (opcional) */
  numero?: string;
  /** Variante visual do cabeçalho */
  variante?: 'escuro' | 'claro';
  /** Nome do usuário que gerou o documento */
  usuario?: string;
  /** Mostrar logomarcas no cabeçalho */
  mostrarLogos?: boolean;
  /** Mostrar rodapé com metadados */
  mostrarRodape?: boolean;
  /** Mostrar paginação */
  mostrarPaginacao?: boolean;
  /** Orientação do documento */
  orientacao?: 'portrait' | 'landscape';
}

export interface MetadadosDocumento {
  sistema: string;
  dataGeracao: Date;
  usuario: string | null;
  versao: string;
}

// ============ FUNÇÕES AUXILIARES ============

/**
 * Aplica cor ao documento
 */
const setCor = (
  doc: jsPDF,
  cor: { r: number; g: number; b: number },
  tipo: 'fill' | 'text' | 'draw' = 'text'
) => {
  if (tipo === 'fill') {
    doc.setFillColor(cor.r, cor.g, cor.b);
  } else if (tipo === 'draw') {
    doc.setDrawColor(cor.r, cor.g, cor.b);
  } else {
    doc.setTextColor(cor.r, cor.g, cor.b);
  }
};

/**
 * Aplica tipografia
 */
const setTipografia = (
  doc: jsPDF,
  config: { size: number; font: string; style: 'normal' | 'bold' | 'italic' }
) => {
  doc.setFont(config.font, config.style);
  doc.setFontSize(config.size);
};

/**
 * Obtém dimensões da página
 */
export const getDimensoesPagina = (doc: jsPDF) => ({
  largura: doc.internal.pageSize.width,
  altura: doc.internal.pageSize.height,
  larguraUtil: doc.internal.pageSize.width - MARGENS.esquerda - MARGENS.direita,
});

// ============ CABEÇALHO INSTITUCIONAL ============

const ALTURA_CABECALHO_ESCURO = 32;
const ALTURA_CABECALHO_CLARO = 28;
const ALTURA_LOGOS = 14; // mm - altura padrão das logos

/**
 * Gera o cabeçalho institucional padrão
 * @returns Posição Y após o cabeçalho (para iniciar o conteúdo)
 */
export const gerarCabecalhoInstitucional = async (
  doc: jsPDF,
  config: ConfiguracaoDocumento,
  paginaAtual: number = 1
): Promise<number> => {
  const { largura } = getDimensoesPagina(doc);
  const logos = await carregarLogos();
  const variante = config.variante || 'escuro';
  const alturaHeader = variante === 'escuro' ? ALTURA_CABECALHO_ESCURO : ALTURA_CABECALHO_CLARO;
  const logoY = 9;
  const logoMargemX = 12;
  
  // Calcular dimensões das logos baseadas na altura padrão
  const logoConfig = getLogosPDF(ALTURA_LOGOS);
  
  if (variante === 'escuro') {
    // ===== VARIANTE ESCURA (padrão) =====
    // Fundo verde institucional
    setCor(doc, CORES_INSTITUCIONAIS.primaria, 'fill');
    doc.rect(0, 0, largura, alturaHeader, 'F');
    
    // Logo Governo (esquerda)
    if (config.mostrarLogos !== false && logos?.governo?.data) {
      try {
        doc.addImage(
          logos.governo.data,
          'JPEG',
          logoMargemX,
          logoY,
          logoConfig.governo.width,
          logoConfig.governo.height
        );
      } catch (e) { /* silently fail */ }
    }
    
    // Logo IDJuv Dark (direita - para fundo escuro)
    if (config.mostrarLogos !== false) {
      const logoIdjuv = logos?.idjuvDark || logos?.idjuvOficial;
      if (logoIdjuv?.data) {
        try {
          doc.addImage(
            logoIdjuv.data,
            'PNG',
            largura - logoMargemX - logoConfig.idjuv.width,
            logoY,
            logoConfig.idjuv.width,
            logoConfig.idjuv.height
          );
        } catch (e) { /* silently fail */ }
      }
    }
    
    // Textos institucionais
    setCor(doc, CORES_INSTITUCIONAIS.textoBranco);
    setTipografia(doc, TIPOGRAFIA.governo);
    doc.text('GOVERNO DO ESTADO DE RORAIMA', largura / 2, 13, { align: 'center' });
    
    setTipografia(doc, TIPOGRAFIA.orgao);
    doc.text('Instituto de Desporto, Juventude e Lazer do Estado de Roraima', largura / 2, 19, { align: 'center' });
    
    // Título do documento no header
    if (config.titulo) {
      setTipografia(doc, { ...TIPOGRAFIA.tituloDocumento, size: 11 });
      doc.text(config.titulo.toUpperCase(), largura / 2, 27, { align: 'center' });
    }
    
    // Linha divisória dourada
    setCor(doc, CORES_INSTITUCIONAIS.acento, 'draw');
    doc.setLineWidth(0.8);
    doc.line(0, alturaHeader, largura, alturaHeader);
    
  } else {
    // ===== VARIANTE CLARA =====
    // Logo Governo (esquerda)
    if (config.mostrarLogos !== false && logos?.governo?.data) {
      try {
        doc.addImage(
          logos.governo.data,
          'JPEG',
          logoMargemX,
          logoY,
          logoConfig.governo.width,
          logoConfig.governo.height
        );
      } catch (e) { /* silently fail */ }
    }
    
    // Logo IDJuv Oficial (direita - para fundo claro)
    if (config.mostrarLogos !== false && logos?.idjuvOficial?.data) {
      try {
        doc.addImage(
          logos.idjuvOficial.data,
          'PNG',
          largura - logoMargemX - logoConfig.idjuv.width,
          logoY,
          logoConfig.idjuv.width,
          logoConfig.idjuv.height
        );
      } catch (e) { /* silently fail */ }
    }
    
    // Textos institucionais
    setCor(doc, CORES_INSTITUCIONAIS.primaria);
    setTipografia(doc, TIPOGRAFIA.governo);
    doc.text('GOVERNO DO ESTADO DE RORAIMA', largura / 2, 13, { align: 'center' });
    
    setTipografia(doc, TIPOGRAFIA.orgao);
    setCor(doc, CORES_INSTITUCIONAIS.textoEscuro);
    doc.text('Instituto de Desporto, Juventude e Lazer do Estado de Roraima', largura / 2, 19, { align: 'center' });
    
    // Linha divisória
    setCor(doc, CORES_INSTITUCIONAIS.primaria, 'draw');
    doc.setLineWidth(0.5);
    doc.line(MARGENS.esquerda, 24, largura - MARGENS.direita, 24);
  }
  
  // ===== BLOCO DE TÍTULO (abaixo do header) =====
  let y = alturaHeader + 8;
  
  // Título (se variante clara ou se quer título destacado abaixo)
  if (variante === 'claro' && config.titulo) {
    setCor(doc, CORES_INSTITUCIONAIS.primaria);
    setTipografia(doc, TIPOGRAFIA.tituloDocumento);
    doc.text(config.titulo.toUpperCase(), largura / 2, y, { align: 'center' });
    y += 7;
  }
  
  // Subtítulo
  if (config.subtitulo) {
    setCor(doc, CORES_INSTITUCIONAIS.textoMedio);
    setTipografia(doc, TIPOGRAFIA.subtitulo);
    doc.text(config.subtitulo, largura / 2, y, { align: 'center' });
    y += 6;
  }
  
  // Número do documento
  if (config.numero) {
    setCor(doc, CORES_INSTITUCIONAIS.textoEscuro);
    setTipografia(doc, TIPOGRAFIA.label);
    doc.text(`Nº ${config.numero}`, largura / 2, y, { align: 'center' });
    y += 5;
  }
  
  // Linha separadora sutil
  setCor(doc, CORES_INSTITUCIONAIS.bordaClara, 'draw');
  doc.setLineWidth(0.3);
  doc.line(MARGENS.esquerda, y + 2, largura - MARGENS.direita, y + 2);
  
  return y + 8;
};

// ============ RODAPÉ INSTITUCIONAL ============

const ALTURA_RODAPE = 18; // mm

/**
 * Gera o rodapé institucional padrão
 * Deve ser chamado APÓS todo o conteúdo, antes de salvar o PDF
 */
export const gerarRodapeInstitucional = (
  doc: jsPDF,
  config: ConfiguracaoDocumento
) => {
  if (config.mostrarRodape === false) return;
  
  const totalPaginas = doc.getNumberOfPages();
  const { largura, altura } = getDimensoesPagina(doc);
  
  const dataGeracao = new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    
    const yBase = altura - ALTURA_RODAPE;
    
    // Linha separadora
    setCor(doc, CORES_INSTITUCIONAIS.bordaClara, 'draw');
    doc.setLineWidth(0.3);
    doc.line(MARGENS.esquerda, yBase, largura - MARGENS.direita, yBase);
    
    // Sistema
    setCor(doc, CORES_INSTITUCIONAIS.textoClaro);
    setTipografia(doc, TIPOGRAFIA.rodape);
    doc.text('Sistema IDJuv', MARGENS.esquerda, yBase + 5);
    
    // Data e usuário (centro)
    let textoMeio = `Gerado em ${dataGeracao}`;
    if (config.usuario) {
      textoMeio += ` | Usuário: ${config.usuario}`;
    }
    doc.text(textoMeio, largura / 2, yBase + 5, { align: 'center' });
    
    // Paginação (direita)
    if (config.mostrarPaginacao !== false) {
      setTipografia(doc, TIPOGRAFIA.paginacao);
      doc.text(
        `Página ${i} de ${totalPaginas}`,
        largura - MARGENS.direita,
        yBase + 5,
        { align: 'right' }
      );
    }
    
    // Aviso de autenticidade
    setTipografia(doc, { ...TIPOGRAFIA.rodape, size: 7 });
    setCor(doc, CORES_INSTITUCIONAIS.textoClaro);
    doc.text(
      'Documento gerado eletronicamente pelo Sistema de Governança Digital',
      largura / 2,
      yBase + 10,
      { align: 'center' }
    );
  }
};

// ============ UTILITÁRIOS DE SEÇÃO ============

/**
 * Adiciona cabeçalho de seção com fundo colorido
 */
export const adicionarSecao = (
  doc: jsPDF,
  titulo: string,
  y: number,
  numero?: number
): number => {
  const { larguraUtil } = getDimensoesPagina(doc);
  const tituloCompleto = numero ? `${numero}. ${titulo.toUpperCase()}` : titulo.toUpperCase();
  
  setCor(doc, CORES_INSTITUCIONAIS.secundaria, 'fill');
  doc.rect(MARGENS.esquerda, y, larguraUtil, 7, 'F');
  
  setCor(doc, CORES_INSTITUCIONAIS.textoBranco);
  setTipografia(doc, TIPOGRAFIA.secao);
  doc.text(tituloCompleto, MARGENS.esquerda + 4, y + 5);
  
  return y + 11;
};

/**
 * Adiciona título de seção simples (sem fundo)
 */
export const adicionarTituloSecao = (
  doc: jsPDF,
  titulo: string,
  y: number,
  numero?: number
): number => {
  const tituloCompleto = numero ? `${numero}. ${titulo}` : titulo;
  
  setCor(doc, CORES_INSTITUCIONAIS.primaria);
  setTipografia(doc, TIPOGRAFIA.secao);
  doc.text(tituloCompleto, MARGENS.esquerda, y);
  
  return y + 8;
};

/**
 * Adiciona campo com label e valor
 */
export const adicionarCampo = (
  doc: jsPDF,
  label: string,
  valor: string,
  x: number,
  y: number,
  largura: number = 80
): number => {
  setCor(doc, CORES_INSTITUCIONAIS.textoMedio);
  setTipografia(doc, TIPOGRAFIA.label);
  doc.text(label, x, y);
  
  setCor(doc, CORES_INSTITUCIONAIS.textoEscuro);
  setTipografia(doc, TIPOGRAFIA.valor);
  const linhas = doc.splitTextToSize(valor || '-', largura - 5);
  doc.text(linhas, x, y + 4);
  
  return y + 4 + (linhas.length * 4);
};

/**
 * Adiciona campo inline (label: valor)
 */
export const adicionarCampoInline = (
  doc: jsPDF,
  label: string,
  valor: string,
  x: number,
  y: number
): number => {
  setCor(doc, CORES_INSTITUCIONAIS.textoMedio);
  setTipografia(doc, TIPOGRAFIA.label);
  doc.text(`${label}:`, x, y);
  
  const labelWidth = doc.getTextWidth(`${label}: `);
  
  setCor(doc, CORES_INSTITUCIONAIS.textoEscuro);
  setTipografia(doc, TIPOGRAFIA.valor);
  doc.text(valor || '-', x + labelWidth, y);
  
  return y + 5;
};

/**
 * Verifica se precisa adicionar nova página
 */
export const verificarQuebraPagina = (
  doc: jsPDF,
  yAtual: number,
  espacoNecessario: number,
  config: ConfiguracaoDocumento
): number => {
  const { altura } = getDimensoesPagina(doc);
  const limiteInferior = altura - MARGENS.inferior - ALTURA_RODAPE;
  
  if (yAtual + espacoNecessario > limiteInferior) {
    doc.addPage();
    // Adiciona cabeçalho na nova página (versão simplificada)
    return gerarCabecalhoPaginaContinuacao(doc, config);
  }
  
  return yAtual;
};

/**
 * Gera cabeçalho simplificado para páginas de continuação
 */
const gerarCabecalhoPaginaContinuacao = (
  doc: jsPDF,
  config: ConfiguracaoDocumento
): number => {
  const { largura } = getDimensoesPagina(doc);
  
  // Linha superior
  setCor(doc, CORES_INSTITUCIONAIS.primaria, 'draw');
  doc.setLineWidth(0.5);
  doc.line(MARGENS.esquerda, 10, largura - MARGENS.direita, 10);
  
  // Título do documento (compacto)
  setCor(doc, CORES_INSTITUCIONAIS.primaria);
  setTipografia(doc, { ...TIPOGRAFIA.tituloDocumento, size: 10 });
  doc.text(config.titulo.toUpperCase(), largura / 2, 16, { align: 'center' });
  
  // Indicação de continuação
  setCor(doc, CORES_INSTITUCIONAIS.textoClaro);
  setTipografia(doc, { ...TIPOGRAFIA.corpo, size: 8 });
  doc.text('(continuação)', largura / 2, 21, { align: 'center' });
  
  // Linha inferior
  setCor(doc, CORES_INSTITUCIONAIS.bordaClara, 'draw');
  doc.setLineWidth(0.3);
  doc.line(MARGENS.esquerda, 24, largura - MARGENS.direita, 24);
  
  return 30;
};

// ============ FACTORY DE DOCUMENTO ============

/**
 * Cria um novo documento PDF institucional padronizado
 * Esta é a função principal que DEVE ser usada para criar qualquer PDF do sistema
 */
export const criarDocumentoInstitucional = async (
  config: ConfiguracaoDocumento
): Promise<{ doc: jsPDF; yInicial: number }> => {
  const doc = new jsPDF({
    orientation: config.orientacao || 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  // Gera o cabeçalho e retorna a posição inicial para o conteúdo
  const yInicial = await gerarCabecalhoInstitucional(doc, config);
  
  return { doc, yInicial };
};

/**
 * Finaliza o documento PDF institucional (adiciona rodapé e prepara para salvar)
 */
export const finalizarDocumentoInstitucional = (
  doc: jsPDF,
  config: ConfiguracaoDocumento
): jsPDF => {
  gerarRodapeInstitucional(doc, config);
  return doc;
};

// ============ EXPORTS ============

export {
  setCor,
  setTipografia,
};

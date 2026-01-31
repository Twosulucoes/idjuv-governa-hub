/**
 * Utilitário centralizado para logos institucionais em PDFs
 * 
 * REGRA: Ambos os logos devem ter a MESMA ALTURA para manter
 * equilíbrio visual em documentos oficiais.
 * 
 * Proporções reais dos logos (medidas em pixels):
 * - Logo Governo RR: ~700x200px → proporção ~3.5:1 (largura:altura)
 * - Logo IDJuv: ~400x340px → proporção ~1.18:1 (largura:altura)
 */

// Proporções reais baseadas nas dimensões originais das imagens
export const LOGO_ASPECTOS = {
  governo: 3.5,  // largura / altura
  idjuv: 1.18,   // largura / altura
} as const;

/**
 * Calcula as dimensões dos logos para uma altura padrão
 * garantindo que ambos tenham a mesma altura visual
 */
export function calcularDimensoesLogos(alturaDesejada: number): {
  governo: { width: number; height: number };
  idjuv: { width: number; height: number };
} {
  return {
    governo: {
      width: alturaDesejada * LOGO_ASPECTOS.governo,
      height: alturaDesejada,
    },
    idjuv: {
      width: alturaDesejada * LOGO_ASPECTOS.idjuv,
      height: alturaDesejada,
    },
  };
}

/**
 * Configuração padrão para cabeçalhos de documentos oficiais
 * Altura padrão: 14mm (tamanho profissional para A4)
 */
export const LOGO_CONFIG_PADRAO = {
  altura: 14, // mm - altura padrão para documentos oficiais
  margemTopo: 1, // mm - espaço entre margem e logo
} as const;

/**
 * Retorna configuração pronta para uso em PDFs
 */
export function getLogosPDF(alturaLogo: number = LOGO_CONFIG_PADRAO.altura) {
  const dims = calcularDimensoesLogos(alturaLogo);
  
  return {
    altura: alturaLogo,
    governo: dims.governo,
    idjuv: dims.idjuv,
    // Largura total ocupada pelos logos (útil para cálculos de layout)
    larguraTotal: dims.governo.width + dims.idjuv.width,
  };
}

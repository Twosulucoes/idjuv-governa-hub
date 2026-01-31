/**
 * Utilitário centralizado para logos institucionais em PDFs
 * 
 * REGRA DE OURO: Ambos os logos devem ter a MESMA ALTURA para manter
 * equilíbrio visual em documentos oficiais, preservando suas proporções originais.
 * 
 * =====================================================================
 * PROPORÇÕES REAIS DAS IMAGENS (medidas originais em pixels):
 * =====================================================================
 * 
 * Logo Governo RR (logo-governo-roraima.jpg):
 *   Dimensões: 1063 x 288 px
 *   Proporção: 1063/288 = 3.69:1 (largura:altura)
 * 
 * Logo IDJuv (logo-idjuv-oficial.png):
 *   Dimensões: 512 x 512 px (quadrado)
 *   Proporção: 512/512 = 1:1 (largura:altura)
 * 
 * IMPORTANTE: Se usar o logo em "logo-idjuv-dark4.png" que tem proporção diferente,
 * ajustar a constante LOGO_ASPECTOS.idjuv conforme necessário.
 * =====================================================================
 */

/**
 * Proporções reais (largura/altura) baseadas nas dimensões originais das imagens
 * ATENÇÃO: Atualizar se as imagens forem substituídas por versões com outras dimensões
 */
export const LOGO_ASPECTOS = {
  governo: 3.69,  // 1063 / 288 px → Logo horizontal do Governo de Roraima
  idjuv: 1.0,     // 512 / 512 px → Logo quadrado do IDJuv
} as const;

/**
 * Calcula as dimensões dos logos para uma altura padrão
 * garantindo que ambos tenham a MESMA ALTURA visual
 * e preservando suas proporções originais (sem distorção)
 */
export function calcularDimensoesLogos(alturaDesejada: number): {
  governo: { width: number; height: number };
  idjuv: { width: number; height: number };
} {
  return {
    governo: {
      width: Math.round(alturaDesejada * LOGO_ASPECTOS.governo * 10) / 10,
      height: alturaDesejada,
    },
    idjuv: {
      width: Math.round(alturaDesejada * LOGO_ASPECTOS.idjuv * 10) / 10,
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
  // Alturas para diferentes contextos:
  alturaCapa: 18, // mm - para capas de lotes/relatórios
  alturaCompacto: 10, // mm - para layouts compactos
} as const;

/**
 * Retorna configuração pronta para uso em PDFs
 * @param alturaLogo Altura desejada em mm (ambos os logos terão esta altura)
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

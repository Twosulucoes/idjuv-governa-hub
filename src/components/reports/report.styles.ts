/**
 * Estilos compartilhados para relatórios (CSS-in-JS)
 *
 * Usado para garantir consistência entre componentes React e geração de PDF.
 *
 * White Label — Fase 4: a cor primária vem do perfil da instituição, mesma
 * fonte do CSS e dos PDFs. Antes havia três paletas divergentes para a mesma
 * marca (CSS azul, PDF #004444, relatórios #004444).
 */

import { getTenantSnapshot } from '@/core/tenant';

/** "#164069" → { r, g, b }. */
function hexParaRGB(hex: string): { r: number; g: number; b: number } {
  const limpo = hex.replace('#', '');
  const cheio = limpo.length === 3 ? limpo.split('').map((c) => c + c).join('') : limpo;
  return {
    r: parseInt(cheio.slice(0, 2), 16),
    g: parseInt(cheio.slice(2, 4), 16),
    b: parseInt(cheio.slice(4, 6), 16),
  };
}

const COR_PRIMARIA_HEX = getTenantSnapshot().marca.corPrimariaHex;

/**
 * Cores institucionais (valores HSL para consistência com Tailwind)
 */
export const REPORT_COLORS = {
  // Cor institucional do tenant
  primary: COR_PRIMARIA_HEX,
  primaryRgb: hexParaRGB(COR_PRIMARIA_HEX),
  
  // Verde secundário
  secondary: "hsl(145, 63%, 42%)", // #27AE60
  secondaryRgb: { r: 39, g: 174, b: 96 },
  
  // Dourado institucional
  accent: "hsl(42, 41%, 50%)", // #B4914B
  accentRgb: { r: 180, g: 145, b: 75 },
  
  // Textos
  textDark: "hsl(0, 0%, 13%)", // #212121
  textMedium: "hsl(0, 0%, 39%)", // #646464
  textLight: "hsl(0, 0%, 50%)", // #808080
  
  // Bordas
  borderLight: "hsl(0, 0%, 90%)", // #E6E6E6
  borderMedium: "hsl(0, 0%, 78%)", // #C8C8C8
} as const;

/**
 * Espaçamentos padrão para impressão (em mm)
 */
export const REPORT_MARGINS = {
  top: 25,     // 2.5 cm
  bottom: 25,  // 2.5 cm
  left: 20,    // 2.0 cm
  right: 20,   // 2.0 cm
} as const;

/**
 * Tipografia institucional
 */
export const REPORT_TYPOGRAPHY = {
  // Família de fontes
  fontFamily: "'Helvetica', 'Arial', sans-serif",
  
  // Tamanhos (em pt para PDF, rem para web)
  sizes: {
    title: { pdf: 14, web: "1.25rem" },
    subtitle: { pdf: 11, web: "1rem" },
    section: { pdf: 11, web: "0.875rem" },
    body: { pdf: 10, web: "0.875rem" },
    label: { pdf: 9, web: "0.75rem" },
    footer: { pdf: 8, web: "0.75rem" },
    tiny: { pdf: 7, web: "0.625rem" },
  },
} as const;

/**
 * Classes Tailwind reutilizáveis para relatórios
 */
export const REPORT_CLASSES = {
  // Container principal
  container: "min-h-screen bg-background flex flex-col print:bg-white print:min-h-0",
  
  // Cabeçalho
  headerDark: "bg-primary text-primary-foreground",
  headerLight: "bg-background border-b border-border",
  
  // Título
  title: "text-lg font-bold uppercase tracking-wide",
  subtitle: "text-sm text-muted-foreground",
  
  // Seções
  sectionHeader: "bg-secondary text-secondary-foreground px-4 py-2 font-semibold text-sm uppercase rounded-sm",
  sectionTitle: "text-primary font-semibold text-sm border-b border-primary/20 pb-1",
  
  // Campos
  fieldLabel: "text-xs text-muted-foreground font-medium",
  fieldValue: "text-sm text-foreground",
  
  // Rodapé
  footer: "text-xs text-muted-foreground",
  
  // Utilitários de impressão
  printHide: "print:hidden",
  printOnly: "hidden print:block",
  pageBreak: "print:break-before-page",
  noBreak: "print:break-inside-avoid",
} as const;

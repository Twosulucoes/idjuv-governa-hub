/**
 * Estilos compartilhados para relatórios (CSS-in-JS)
 * 
 * Usado para garantir consistência entre componentes React e geração de PDF.
 */

/**
 * Cores institucionais (valores HSL para consistência com Tailwind)
 */
export const REPORT_COLORS = {
  // Verde institucional IDJuv
  primary: "hsl(180, 100%, 13%)", // #004444
  primaryRgb: { r: 0, g: 68, b: 68 },
  
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

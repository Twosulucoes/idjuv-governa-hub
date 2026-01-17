/**
 * Constantes de cores semânticas para status
 * Usar estas constantes em vez de cores hardcoded
 * Todas suportam dark mode automaticamente
 */

// Status gerais
export const STATUS_COLORS = {
  // Sucesso / Aprovado / Concluído
  success: "bg-success/15 text-success border-success/30 dark:bg-success/20 dark:text-success",
  
  // Pendente / Aguardando
  pending: "bg-warning/15 text-warning border-warning/30 dark:bg-warning/20",
  
  // Em andamento / Análise
  inProgress: "bg-info/15 text-info border-info/30 dark:bg-info/20",
  
  // Erro / Rejeitado / Cancelado
  error: "bg-destructive/15 text-destructive border-destructive/30 dark:bg-destructive/20",
  
  // Neutro / Inativo / Arquivado
  neutral: "bg-muted text-muted-foreground border-border",
  
  // Primário / Destacado
  primary: "bg-primary/15 text-primary border-primary/30 dark:bg-primary/20",
  
  // Secundário
  secondary: "bg-secondary/15 text-secondary border-secondary/30 dark:bg-secondary/20",
  
  // Destaque / Urgente
  highlight: "bg-highlight/15 text-highlight-foreground border-highlight/30 dark:bg-highlight/20",
} as const;

// Cores para ícones em containers
export const ICON_CONTAINER_COLORS = {
  success: "bg-success/15 text-success dark:bg-success/20",
  warning: "bg-warning/15 text-warning dark:bg-warning/20",
  error: "bg-destructive/15 text-destructive dark:bg-destructive/20",
  info: "bg-info/15 text-info dark:bg-info/20",
  primary: "bg-primary/15 text-primary dark:bg-primary/20",
  secondary: "bg-secondary/15 text-secondary dark:bg-secondary/20",
  neutral: "bg-muted text-muted-foreground",
} as const;

// Cores de texto para valores
export const VALUE_COLORS = {
  positive: "text-success dark:text-success",
  negative: "text-destructive dark:text-destructive",
  warning: "text-warning dark:text-warning",
  info: "text-info dark:text-info",
  neutral: "text-muted-foreground",
} as const;

// Bordas laterais para cards
export const BORDER_COLORS = {
  success: "border-l-4 border-l-success",
  warning: "border-l-4 border-l-warning",
  error: "border-l-4 border-l-destructive",
  info: "border-l-4 border-l-info",
  primary: "border-l-4 border-l-primary",
  secondary: "border-l-4 border-l-secondary",
} as const;

// Gradientes de background para cards
export const GRADIENT_COLORS = {
  success: "bg-gradient-to-br from-success/5 to-background",
  warning: "bg-gradient-to-br from-warning/5 to-background",
  error: "bg-gradient-to-br from-destructive/5 to-background",
  info: "bg-gradient-to-br from-info/5 to-background",
  primary: "bg-gradient-to-br from-primary/5 to-background",
  secondary: "bg-gradient-to-br from-secondary/5 to-background",
  neutral: "bg-gradient-to-br from-muted/30 to-background",
} as const;

// Helper para determinar cor baseada em percentual
export function getPercentageColor(value: number, thresholds = { good: 95, medium: 80 }): string {
  if (value >= thresholds.good) return VALUE_COLORS.positive;
  if (value >= thresholds.medium) return VALUE_COLORS.warning;
  return VALUE_COLORS.negative;
}

// Helper para badge baseado em percentual
export function getPercentageBadgeColor(value: number, thresholds = { good: 95, medium: 80 }): string {
  if (value >= thresholds.good) return STATUS_COLORS.success;
  if (value >= thresholds.medium) return STATUS_COLORS.pending;
  return STATUS_COLORS.error;
}

// Componentes de padrão do design system (camada sobre o shadcn/ui).
// Referência visual: /admin/design-system. Guia: docs/GUIA_FRONTEND.md (Design System).
export { PageHeader, type PageHeaderProps, type Migalha } from "./PageHeader";
export { EmptyState, type EmptyStateProps } from "./EmptyState";
export { StatusBadge, tomDaSituacao, type StatusBadgeProps, type TomStatus } from "./StatusBadge";
export { DataTable, type DataTableProps, type ColunaTabela, type Densidade } from "./DataTable";
export { KpiCard, type KpiCardProps } from "./KpiCard";
export { ChartCard, type ChartCardProps, type TabelaAlternativa } from "./ChartCard";
export { FormSection, type FormSectionProps } from "./form/FormSection";
export { ErrorSummary, type ErrorSummaryProps } from "./form/ErrorSummary";
export { SkipLink, type SkipLinkProps } from "./SkipLink";
export { BarraFiltros, ChipsFiltros, type BarraFiltrosProps, type ChipsFiltrosProps } from "./filtros/BarraFiltros";
export { useEstadoFiltros, type FiltrosDaTela } from "./filtros/useEstadoFiltros";
export {
  aplicarFiltros,
  resolverPeriodo,
  dataISO,
  descreverFiltro,
  estadoParaParams,
  paramsParaEstado,
  PERIODOS_RELATIVOS,
  type FiltroDef,
  type EstadoFiltros,
  type ValorFiltro,
  type PeriodoRelativo,
  type OpcaoFiltro,
} from "./filtros/logica";

import type { TomStatus } from "@/components/design-system";
import type { SituacaoNoRelatorio } from "@/lib/compras/relatorioPesquisaPrecos";

export const FINALIDADE_LABEL: Record<string, string> = {
  licitacao: "Licitação",
  dispensa: "Dispensa",
  inexigibilidade: "Inexigibilidade",
  adesao_ata: "Adesão a ata de registro de preços",
  prorrogacao: "Prorrogação de contrato",
  outra: "Outra",
};

export const SITUACAO_PESQUISA_LABEL: Record<string, string> = {
  em_andamento: "Em andamento",
  concluida: "Concluída",
};

export const TOM_SITUACAO_PESQUISA: Record<string, TomStatus> = {
  em_andamento: "andamento",
  concluida: "sucesso",
};

export const TOM_SITUACAO_AMOSTRA: Record<SituacaoNoRelatorio, TomStatus> = {
  valido: "sucesso",
  excessivo: "erro",
  inexequivel: "erro",
  desconsiderada: "neutro",
};

export const ORIGEM_LABEL: Record<string, string> = {
  compras_gov: "Compras.gov.br",
  pncp: "PNCP",
  manual: "Lançado à mão",
};

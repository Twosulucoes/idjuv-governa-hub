/** Rótulos e tons compartilhados pelas telas da trilha de auditoria. */
import type { TomStatus } from "@/components/design-system";
import type { AuditAction } from "@/types/auth";
import { MODULES_CONFIG } from "@/shared/config/modules.config";

// Tom do selo de cada ação (o texto do rótulo sempre aparece; cor nunca sozinha)
export const TOM_ACAO_TRILHA: Record<AuditAction, TomStatus> = {
  login: "sucesso",
  logout: "neutro",
  login_failed: "erro",
  password_change: "andamento",
  password_reset: "pendente",
  create: "sucesso",
  update: "andamento",
  delete: "erro",
  view: "neutro",
  export: "neutro",
  upload: "neutro",
  download: "neutro",
  approve: "sucesso",
  reject: "erro",
  submit: "andamento",
};

/** Nome do módulo para exibir (o código cru quando não é um módulo do menu, ex.: "folha"). */
export function nomeModulo(codigo: string | null | undefined): string {
  if (!codigo) return "—";
  return MODULES_CONFIG.find((m) => m.codigo === codigo)?.nome ?? codigo;
}

// Entidades que não são tabela do schema public (a trilha do Storage grava "storage.<bucket>").
const ENTIDADES_ROTULO: Record<string, string> = {
  "storage.frequencias": "Arquivo: frequências (Storage)",
  "storage.documentos-requerimento": "Arquivo: documentos de requerimento (Storage)",
};

/** Rótulo da tabela/entidade; o nome técnico quando não há rótulo. */
export function rotuloEntidade(entidade: string | null | undefined): string {
  if (!entidade) return "—";
  return ENTIDADES_ROTULO[entidade] ?? entidade;
}

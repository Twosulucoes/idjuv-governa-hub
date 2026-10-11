/**
 * Lançamento só por servidor do setor (spec docs/superpowers/specs/2026-10-11-lancamento-por-setor-design.md, fase 1).
 *
 * Tipos das tabelas e RPCs da migração 20261011020000_lancamento_por_setor.sql (ainda fora de types.ts, que é gerado):
 *   - setores_modulo: quais unidades da estrutura são o setor de cada módulo (escrita só do papel admin);
 *   - regra_lancamento: modo da regra por módulo (escrita só do papel admin);
 *   - meus_fundamentos_lancamento(): por módulo, se o login tem fundamento para lançar e qual;
 *   - saneamento_lancamento(): servidores ativos sem login vinculado, sem lotação vigente ou com lotação divergente;
 *   - audit_logs.fundamento (jsonb): a via usada (ou negada) em cada gravação.
 */

/** desligado: nada é checado; registrar: só anota na trilha quem seria bloqueado; exigir: o banco recusa (RHS01). */
export type ModoRegraLancamento = "desligado" | "registrar" | "exigir";

export const MODOS_REGRA_LANCAMENTO: ModoRegraLancamento[] = ["desligado", "registrar", "exigir"];

export const MODO_REGRA_LABELS: Record<ModoRegraLancamento, string> = {
  desligado: "Desligado",
  registrar: "Registrar",
  exigir: "Exigir",
};

export const MODO_REGRA_DESCRICOES: Record<ModoRegraLancamento, string> = {
  desligado: "Ninguém é checado e a trilha não anota o fundamento.",
  registrar: "Ninguém é bloqueado; a trilha anota quem seria bloqueado.",
  exigir: "Quem não tem fundamento no setor deixa de lançar: o banco recusa a gravação.",
};

/** Vias de `meus_fundamentos_lancamento()` e de `audit_logs.fundamento->>via`. */
export type ViaFundamento =
  | "lotacao"
  | "designacao"
  | "comissao"
  | "autoatendimento"
  | "chefia"
  | "sistema"
  | "anonimo"
  | "negado_sem_servidor"
  | "negado_setor";

export const VIA_FUNDAMENTO_LABELS: Record<ViaFundamento, string> = {
  lotacao: "Lotação no setor",
  designacao: "Designação para o setor",
  comissao: "Membro de comissão",
  autoatendimento: "Autoatendimento (o que é do próprio servidor)",
  chefia: "Chefia da unidade",
  sistema: "Sistema",
  anonimo: "Formulário público",
  negado_sem_servidor: "Login sem servidor vinculado",
  negado_setor: "Fora do setor (sem lotação, designação ou comissão)",
};

/** Vias que querem dizer "sem fundamento": no modo exigir, a gravação é recusada. */
export const VIAS_NEGADAS: ViaFundamento[] = ["negado_sem_servidor", "negado_setor"];

export interface SetorModulo {
  id: string;
  modulo: string;
  unidade_id: string;
  inclui_subordinadas: boolean;
  ativo: boolean;
  unidade?: { id: string; nome: string; sigla: string | null } | null;
}

export interface RegraLancamento {
  modulo: string;
  modo: ModoRegraLancamento;
}

/** Linha de `meus_fundamentos_lancamento()` (uma por módulo). `ato` vem como o banco mandar (texto ou objeto). */
export interface FundamentoLancamento {
  modulo: string;
  modo: ModoRegraLancamento;
  permitido: boolean | null;
  via: ViaFundamento | string | null;
  unidade_id: string | null;
  ato: unknown;
}

/** Pendência do saneamento (uma linha por servidor; um servidor pode ter mais de um problema). */
export type ProblemaSaneamento = "sem_login" | "sem_lotacao" | "lotacao_divergente" | string;

export const PROBLEMA_SANEAMENTO_LABELS: Record<string, string> = {
  sem_login: "Sem login vinculado",
  sem_lotacao: "Sem lotação vigente",
  lotacao_divergente: "Lotação divergente da unidade atual",
};

export interface LinhaSaneamento {
  servidor_id: string;
  nome: string;
  matricula: string | null;
  problemas: ProblemaSaneamento[];
  detalhe: string | null;
}

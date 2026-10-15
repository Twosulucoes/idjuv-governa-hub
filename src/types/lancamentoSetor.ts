/**
 * Lançamento só por servidor do setor (spec docs/superpowers/specs/2026-10-11-lancamento-por-setor-design.md, fase 1).
 *
 * Tipos das tabelas e RPCs da migração 20261011020000_lancamento_por_setor.sql (tipos do domínio usados pelas telas):
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
  exigir: "Quem não tem fundamento no setor deixa de lançar: o banco recusa a gravação. Liga por migração, módulo a módulo.",
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
  | "negado_sem_login"
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
  negado_sem_login: "Sessão sem usuário identificado",
  negado_sem_servidor: "Login sem servidor vinculado",
  negado_setor: "Fora do setor (sem lotação nem designação)",
};

/** Vias que querem dizer "sem fundamento": no modo exigir, a gravação é recusada. */
export const VIAS_NEGADAS: ViaFundamento[] = ["negado_sem_login", "negado_sem_servidor", "negado_setor"];

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

/** Ato de designação/comissão como o banco grava (jsonb; chaves nulas omitidas, datas em texto ISO). */
export interface AtoFundamento {
  tipo?: string;
  numero?: string;
  data?: string;
  doe_numero?: string;
  doe_data?: string;
}

/**
 * Linha de `meus_fundamentos_lancamento()` (uma por módulo): fundamento de **setor** do login hoje (lotação, cessão,
 * designação ou comissão). Autoatendimento e chefia não aparecem aqui e continuam valendo por registro: `permitido =
 * false` quer dizer "não lança como setor", não "não pode pedir as próprias coisas". `bloqueado = modo 'exigir' e não
 * permitido`.
 */
export interface FundamentoLancamento {
  modulo: string;
  modo: ModoRegraLancamento;
  permitido: boolean;
  bloqueado: boolean;
  via: ViaFundamento | string | null;
  unidade_id: string | null;
  unidade_nome: string | null;
  lotacao_id: string | null;
  cessao_id: string | null;
  designacao_id: string | null;
  comissao_id: string | null;
  ato: AtoFundamento | null;
}

/** Pendência do saneamento (um servidor pode ter mais de uma). */
export type ProblemaSaneamento = "sem_login" | "sem_lotacao" | "lotacao_divergente" | "fundamento_autoconcedido";

export const PROBLEMA_SANEAMENTO_LABELS: Record<ProblemaSaneamento, string> = {
  sem_login: "Sem login vinculado",
  sem_lotacao: "Sem lotação vigente",
  lotacao_divergente: "Lotação divergente da unidade atual",
  fundamento_autoconcedido: "Fundamento autoconcedido (lotação ou cessão lançada por ele mesmo, ou designação aprovada por ele ou por quem a lançou)",
};

/** Linha de `saneamento_lancamento()`: servidor ativo com pelo menos um problema (sem CPF nem outro dado pessoal). */
export interface LinhaSaneamento {
  servidor_id: string;
  nome: string;
  matricula: string | null;
  situacao: string | null;
  tem_login: boolean;
  login_ativo: boolean | null;
  lotacao_unidade_id: string | null;
  lotacao_unidade_nome: string | null;
  unidade_atual_id: string | null;
  unidade_atual_nome: string | null;
  problemas: ProblemaSaneamento[];
}

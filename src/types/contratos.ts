/**
 * Contratos (módulo Contratos, entregas C1 e C2): cadastro, itens, responsáveis (gestor e fiscais), alterações
 * (aditivo, apostilamento, suspensão, rescisão) e histórico.
 * Banco: contratos, itens_contrato e contrato_responsaveis (migração 20261104090000) e contrato_alteracoes (migração
 * 20261115090000); histórico em audit_log_licitacoes.
 * Spec: docs/superpowers/specs/2026-10-27-contratos-gestao-completa-design.md
 */

import type { Database } from "@/integrations/supabase/types";

type Tabelas = Database["public"]["Tables"];

export type Contrato = Tabelas["contratos"]["Row"];
export type ItemContrato = Tabelas["itens_contrato"]["Row"];
export type ContratoResponsavel = Tabelas["contrato_responsaveis"]["Row"];
export type ContratoAlteracao = Tabelas["contrato_alteracoes"]["Row"];
export type RegistroHistorico = Pick<
  Tabelas["audit_log_licitacoes"]["Row"],
  "id" | "tabela_origem" | "registro_id" | "acao" | "campos_alterados" | "dados_anteriores" | "dados_novos" | "usuario_nome" | "created_at"
>;
export type SituacaoContrato = Database["public"]["Enums"]["status_contrato"];

export interface ContratadoResumo {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  cpf_cnpj: string;
}

/** Linha da lista: o contrato, o contratado, o setor e os responsáveis (ativos e antigos; a tela filtra). */
export type ContratoLista = Pick<
  Contrato,
  | "id"
  | "numero_contrato"
  | "ano"
  | "processo_sei"
  | "objeto"
  | "objeto_resumido"
  | "tipo_contrato"
  | "status"
  | "valor_inicial"
  | "valor_atual"
  | "data_inicio"
  | "data_fim"
  | "data_fim_atual"
  | "controla_passagens"
  | "unidade_demandante_id"
> & {
  fornecedor: ContratadoResumo | null;
  unidade: { sigla: string | null; nome: string } | null;
  responsaveis: Pick<ContratoResponsavel, "papel" | "nome" | "servidor_id" | "data_fim">[];
};

export type ContratoFicha = Contrato & {
  fornecedor: ContratadoResumo | null;
  unidade: { id: string; sigla: string | null; nome: string } | null;
};

/**
 * Situações do contrato (enum status_contrato do banco). Desde a C2, "Suspenso" e "Rescindido" saem das alterações
 * (suspensão em aberto e rescisão); o formulário só os mostra para o contrato que já está assim.
 */
export const SITUACOES_CONTRATO = [
  { value: "rascunho", label: "Rascunho" },
  { value: "vigente", label: "Vigente" },
  { value: "suspenso", label: "Suspenso" },
  { value: "aditado", label: "Aditado" },
  { value: "encerrado", label: "Encerrado" },
  { value: "rescindido", label: "Rescindido" },
] as const satisfies readonly { value: SituacaoContrato; label: string }[];

/** Situações que só a aba Alterações dá (suspensão em aberto e rescisão): o banco recusa digitá-las (C2). */
export const SITUACOES_PELAS_ALTERACOES: ReadonlySet<string> = new Set<SituacaoContrato>(["suspenso", "rescindido"]);

/** Mesma lista do CHECK contratos_tipo_contrato_check. */
export const TIPOS_CONTRATO = [
  { value: "servico_continuo", label: "Serviço contínuo" },
  { value: "servico_escopo", label: "Serviço por escopo" },
  { value: "fornecimento", label: "Fornecimento" },
  { value: "obra", label: "Obra ou serviço de engenharia" },
  { value: "locacao", label: "Locação" },
  { value: "outro", label: "Outro" },
] as const;

/** Mesma lista do CHECK de contrato_responsaveis.papel. */
export const PAPEIS_RESPONSAVEL = [
  { value: "gestor", label: "Gestor" },
  { value: "gestor_substituto", label: "Gestor substituto" },
  { value: "fiscal_tecnico", label: "Fiscal técnico" },
  { value: "fiscal_administrativo", label: "Fiscal administrativo" },
  { value: "fiscal_substituto", label: "Fiscal substituto" },
] as const;
export type PapelResponsavel = (typeof PAPEIS_RESPONSAVEL)[number]["value"];

/** Mesma lista do CHECK contrato_alteracoes_especie_check. "Partida" é a situação anterior ao sistema. */
export const ESPECIES_ALTERACAO = [
  { value: "aditivo", label: "Termo aditivo" },
  { value: "apostilamento", label: "Apostilamento" },
  { value: "suspensao", label: "Suspensão" },
  { value: "rescisao", label: "Rescisão" },
  { value: "partida", label: "Situação anterior ao sistema" },
] as const;
export type EspecieAlteracao = (typeof ESPECIES_ALTERACAO)[number]["value"];

/** Mesma lista do CHECK contrato_alteracoes_apostilamento_check (art. 136 da Lei 14.133; prorrogação pelo art. 115, §5º). */
export const MOTIVOS_APOSTILAMENTO = [
  { value: "reajuste", label: "Reajuste" },
  { value: "repactuacao", label: "Repactuação" },
  { value: "dotacao", label: "Dotação orçamentária" },
  { value: "prorrogacao_suspensao", label: "Prorrogação pelo tempo suspenso" },
  { value: "outro", label: "Outro" },
] as const;

/** Mesma lista do CHECK contrato_alteracoes_rescisao_check (formas de extinção do art. 138). */
export const MOTIVOS_RESCISAO = [
  { value: "unilateral", label: "Unilateral (pela Administração)" },
  { value: "consensual", label: "Consensual (acordo entre as partes)" },
  { value: "judicial", label: "Judicial ou arbitral" },
] as const;

/** Mesma lista do CHECK contratos_renovacao_providencia_check: o que o NuAC decidiu para o vencimento. */
export const PROVIDENCIAS_RENOVACAO = [
  { value: "prorrogar", label: "Prorrogação em andamento" },
  { value: "nova_contratacao", label: "Nova contratação em andamento" },
  { value: "encerrar", label: "Encerrar no fim da vigência" },
] as const;
export type ProvidenciaRenovacao = (typeof PROVIDENCIAS_RENOVACAO)[number]["value"];

const rotulo = (lista: readonly { value: string; label: string }[], v: string | null | undefined) =>
  lista.find((x) => x.value === v)?.label ?? v ?? "—";

export const rotuloSituacaoContrato = (v: string | null | undefined) => rotulo(SITUACOES_CONTRATO, v);
export const rotuloTipoContrato = (v: string | null | undefined) => rotulo(TIPOS_CONTRATO, v);
export const rotuloPapel = (v: string | null | undefined) => rotulo(PAPEIS_RESPONSAVEL, v);
export const rotuloMotivoApostilamento = (v: string | null | undefined) => rotulo(MOTIVOS_APOSTILAMENTO, v);
export const rotuloMotivoRescisao = (v: string | null | undefined) => rotulo(MOTIVOS_RESCISAO, v);
export const rotuloProvidencia = (v: string | null | undefined) => rotulo(PROVIDENCIAS_RENOVACAO, v);

/** Nome do contratado como aparece nas telas (nome fantasia quando houver). */
export const nomeContratado = (f: Pick<ContratadoResumo, "razao_social" | "nome_fantasia"> | null | undefined) =>
  f ? f.nome_fantasia || f.razao_social : "—";

/** Gestor ativo e fiscais ativos (sem data de fim); `fiscaisTitulares` deixa de fora o substituto. */
export function responsaveisAtivos<T extends Pick<ContratoResponsavel, "papel" | "data_fim">>(lista: T[]) {
  const ativos = lista.filter((r) => !r.data_fim);
  const fiscais = ativos.filter((r) => r.papel.startsWith("fiscal"));
  return {
    gestor: ativos.find((r) => r.papel === "gestor") ?? null,
    fiscais,
    fiscaisTitulares: fiscais.filter((r) => r.papel !== "fiscal_substituto"),
    ativos,
  };
}

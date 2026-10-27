/**
 * Contratos (módulo Contratos, entrega C1): cadastro, itens, responsáveis (gestor e fiscais) e histórico.
 * Banco: contratos, itens_contrato e contrato_responsaveis (migração 20261104090000); histórico em audit_log_licitacoes.
 * Spec: docs/superpowers/specs/2026-10-27-contratos-gestao-completa-design.md
 */

import type { Database } from "@/integrations/supabase/types";

type Tabelas = Database["public"]["Tables"];

export type Contrato = Tabelas["contratos"]["Row"];
export type ItemContrato = Tabelas["itens_contrato"]["Row"];
export type ContratoResponsavel = Tabelas["contrato_responsaveis"]["Row"];
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

/** Situações do contrato (enum status_contrato do banco). "Aditado" fica para a C2, quando as alterações chegarem. */
export const SITUACOES_CONTRATO = [
  { value: "rascunho", label: "Rascunho" },
  { value: "vigente", label: "Vigente" },
  { value: "suspenso", label: "Suspenso" },
  { value: "aditado", label: "Aditado" },
  { value: "encerrado", label: "Encerrado" },
  { value: "rescindido", label: "Rescindido" },
] as const satisfies readonly { value: SituacaoContrato; label: string }[];

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

const rotulo = (lista: readonly { value: string; label: string }[], v: string | null | undefined) =>
  lista.find((x) => x.value === v)?.label ?? v ?? "—";

export const rotuloSituacaoContrato = (v: string | null | undefined) => rotulo(SITUACOES_CONTRATO, v);
export const rotuloTipoContrato = (v: string | null | undefined) => rotulo(TIPOS_CONTRATO, v);
export const rotuloPapel = (v: string | null | undefined) => rotulo(PAPEIS_RESPONSAVEL, v);

/** Nome do contratado como aparece nas telas (nome fantasia quando houver). */
export const nomeContratado = (f: Pick<ContratadoResumo, "razao_social" | "nome_fantasia"> | null | undefined) =>
  f ? f.nome_fantasia || f.razao_social : "—";

/** Gestor ativo e fiscais ativos (sem data de fim). */
export function responsaveisAtivos<T extends Pick<ContratoResponsavel, "papel" | "data_fim">>(lista: T[]) {
  const ativos = lista.filter((r) => !r.data_fim);
  return {
    gestor: ativos.find((r) => r.papel === "gestor") ?? null,
    fiscais: ativos.filter((r) => r.papel.startsWith("fiscal")),
    ativos,
  };
}

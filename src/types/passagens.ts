/**
 * Passagens aéreas (módulo Contratos): pedidos por processo SEI, passageiros, trechos, cotações e beneficiários.
 * Banco: tabelas passagem_* (migrações 20261031090000 e 20261101090000, prestação de contas e anexos).
 * Spec: docs/superpowers/specs/2026-10-24-contratos-passagens-aereas-design.md
 */

import type { Database } from "@/integrations/supabase/types";

type Tabelas = Database["public"]["Tables"];

export type PassagemBeneficiario = Tabelas["passagem_beneficiarios"]["Row"];
export type PassagemPedido = Tabelas["passagem_pedidos"]["Row"];
export type PassagemPassageiro = Tabelas["passagem_passageiros"]["Row"];
export type PassagemTrecho = Tabelas["passagem_trechos"]["Row"];
export type PassagemCotacao = Tabelas["passagem_cotacoes"]["Row"];
export type PassagemHistorico = Tabelas["passagem_historico"]["Row"];
export type PassagemAnexo = Tabelas["passagem_anexos"]["Row"];

export type TrechoComCotacoes = PassagemTrecho & { cotacoes: PassagemCotacao[] };
export type PassageiroComTrechos = PassagemPassageiro & { trechos: TrechoComCotacoes[] };
export type PedidoCompleto = PassagemPedido & { passageiros: PassageiroComTrechos[] };

/** Só o que a lista e o saldo do contrato precisam de cada trecho. */
export type TrechoResumo = Pick<PassagemTrecho, "id" | "situacao" | "localizador" | "valor_emissao" | "valor_multa" | "valor_reembolso">;
export type PedidoResumo = PassagemPedido & {
  passageiros: (Pick<PassagemPassageiro, "id" | "nome"> & { trechos: TrechoResumo[] })[];
};

/** Situações do pedido, na ordem do fluxo (mesma lista do CHECK do banco). */
export const SITUACOES_PEDIDO = [
  { value: "recebido", label: "Recebido" },
  { value: "cotacao_solicitada", label: "Cotação solicitada" },
  { value: "cotacao_recebida", label: "Cotação recebida" },
  { value: "aprovado", label: "Aprovado" },
  { value: "emitido", label: "Emitido" },
  { value: "concluido", label: "Concluído" },
  { value: "cancelado", label: "Cancelado" },
] as const;
export type SituacaoPedido = (typeof SITUACOES_PEDIDO)[number]["value"];

export const SITUACOES_TRECHO = [
  { value: "a_cotar", label: "A cotar" },
  { value: "cotado", label: "Cotado" },
  { value: "emitido", label: "Emitido" },
  { value: "remarcado", label: "Remarcado" },
  { value: "cancelado", label: "Cancelado" },
  { value: "reembolsado", label: "Reembolsado" },
] as const;
export type SituacaoTrecho = (typeof SITUACOES_TRECHO)[number]["value"];

export const ORIGENS_PEDIDO = [
  { value: "sei", label: "SEI" },
  { value: "email", label: "E-mail" },
  { value: "oficio", label: "Ofício" },
  { value: "outro", label: "Outro" },
] as const;

export const TIPOS_SOLICITANTE = [
  { value: "servidor", label: "Servidor" },
  { value: "beneficiario", label: "Pessoa (beneficiário)" },
  { value: "instituicao", label: "Instituição" },
] as const;
export type TipoSolicitante = (typeof TIPOS_SOLICITANTE)[number]["value"];

export const MODOS_PRESTACAO = [
  { value: "individual", label: "Individual (cada passageiro)" },
  { value: "evento", label: "Único do evento (grupo)" },
  { value: "dispensado", label: "Dispensado" },
] as const;

export const TIPOS_DOCUMENTO = [
  { value: "rg", label: "RG" },
  { value: "cnh", label: "CNH" },
  { value: "passaporte", label: "Passaporte" },
  { value: "outro", label: "Outro" },
] as const;

const rotulo = (lista: readonly { value: string; label: string }[], v: string | null | undefined) =>
  lista.find((x) => x.value === v)?.label ?? v ?? "—";

export const rotuloSituacaoPedido = (v: string | null | undefined) => rotulo(SITUACOES_PEDIDO, v);
export const rotuloSituacaoTrecho = (v: string | null | undefined) => rotulo(SITUACOES_TRECHO, v);
export const rotuloOrigem = (v: string | null | undefined) => rotulo(ORIGENS_PEDIDO, v);
export const rotuloPrestacao = (v: string | null | undefined) => rotulo(MODOS_PRESTACAO, v);
export const rotuloDocumento = (v: string | null | undefined) => rotulo(TIPOS_DOCUMENTO, v);

/** Servidor achado pela busca estreita (passagem_buscar_servidores): sem CPF nem ficha. */
export interface ServidorParaPassagem {
  id: string;
  nome: string;
  matricula: string | null;
  cargo: string | null;
}

/** Viagem do RH de um servidor (passagem_viagens_servidor). */
export interface ViagemDoServidor {
  id: string;
  destino: string;
  data_saida: string;
  data_retorno: string;
  status: string;
  relatorio_apresentado: boolean;
  relatorio_data: string | null;
}

/** Tipos de anexo (mesma lista do CHECK de passagem_anexos). */
export const TIPOS_ANEXO = [
  { value: "cartao_embarque", label: "Cartão de embarque" },
  { value: "bilhete", label: "Bilhete" },
  { value: "relatorio", label: "Relatório" },
  { value: "outro", label: "Outro" },
] as const;
export type TipoAnexo = (typeof TIPOS_ANEXO)[number]["value"];
export const rotuloAnexo = (v: string | null | undefined) => rotulo(TIPOS_ANEXO, v);

/** Pedido emitido com o que a lista de pendências precisa de cada passageiro e trecho. */
export type PedidoParaPendencias = Pick<
  PassagemPedido,
  "id" | "numero_sei" | "evento" | "solicitante_nome" | "prestacao_contas" | "relatorio_evento_entregue_em"
> & {
  passageiros: (Pick<
    PassagemPassageiro,
    "id" | "nome" | "servidor_id" | "viagem_id" | "embarque_entregue_em" | "relatorio_entregue_em" | "prestacao_dispensada"
  > & { trechos: Pick<PassagemTrecho, "data_voo" | "situacao" | "localizador">[] })[];
};

/** Contrato que pode receber passagens (tabela contratos, com o fornecedor). */
export interface ContratoPassagens {
  id: string;
  numero_contrato: string;
  ano: number;
  objeto: string;
  objeto_resumido: string | null;
  valor_atual: number;
  data_inicio: string;
  data_fim: string;
  data_fim_atual: string | null;
  fornecedor: { razao_social: string | null; nome_fantasia: string | null } | null;
}

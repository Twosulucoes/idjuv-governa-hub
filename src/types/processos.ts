/**
 * Processos de contratação (Compras): etapas, formas de contratação e rótulos.
 * Banco: processos_licitatorios + processo_andamentos (migração 20261029090000).
 * Spec: docs/superpowers/specs/2026-10-23-compras-processos-reserva-natureza-design.md
 */

import type { Database } from "@/integrations/supabase/types";

export type ProcessoContratacao = Database["public"]["Tables"]["processos_licitatorios"]["Row"];
export type ProcessoAndamento = Database["public"]["Tables"]["processo_andamentos"]["Row"];
export type ModalidadeLicitacao = Database["public"]["Enums"]["modalidade_licitacao"];

/** Etapas na ordem do processo (mesma lista do CHECK do banco). */
export const ETAPAS_PROCESSO = [
  { value: "abertura", label: "Abertura" },
  { value: "dfd", label: "DFD" },
  { value: "etp", label: "ETP" },
  { value: "tr", label: "Termo de referência" },
  { value: "cotacao", label: "Cotação de preços" },
  { value: "levantamento_tecnico", label: "Levantamento técnico" },
  { value: "instrucao_adesao", label: "Instrução da adesão" },
  { value: "analise_juridica", label: "Análise jurídica" },
  { value: "selecao", label: "Seleção do fornecedor" },
  { value: "contrato", label: "Contrato" },
  { value: "execucao", label: "Execução" },
  { value: "encerrado", label: "Encerrado" },
  { value: "cancelado", label: "Cancelado" },
] as const;

export type EtapaProcesso = (typeof ETAPAS_PROCESSO)[number]["value"];

export const FORMAS_CONTRATACAO: { value: ModalidadeLicitacao; label: string }[] = [
  { value: "pregao_eletronico", label: "Pregão eletrônico" },
  { value: "pregao_presencial", label: "Pregão presencial" },
  { value: "concorrencia", label: "Concorrência" },
  { value: "concurso", label: "Concurso" },
  { value: "leilao", label: "Leilão" },
  { value: "dialogo_competitivo", label: "Diálogo competitivo" },
  { value: "dispensa", label: "Dispensa" },
  { value: "inexigibilidade", label: "Inexigibilidade" },
  { value: "adesao_ata", label: "Adesão à ata de registro de preços" },
];

export const rotuloEtapa = (etapa: string | null | undefined) =>
  ETAPAS_PROCESSO.find((e) => e.value === etapa)?.label ?? etapa ?? "—";

export const rotuloForma = (forma: string | null | undefined) =>
  forma ? (FORMAS_CONTRATACAO.find((f) => f.value === forma)?.label ?? forma) : "A definir";

/** Nº do processo SEI: 00000.000000/0000.00 (aceita também o hífen antes do dígito). */
export const PADRAO_NUMERO_SEI = /^\d{5}\.\d{6}\/\d{4}[.-]\d{2}$/;

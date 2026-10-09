/**
 * Tipos do mural de avisos e do calendário de datas importantes.
 * Tabelas: avisos, avisos_leituras, datas_importantes (migração 20261009120000).
 * Feriados vêm de dias_nao_uteis (Configuração de Frequência) + BrasilAPI.
 */

import type { Modulo } from "@/shared/config/modules.config";

export type PrioridadeAviso = "baixa" | "normal" | "alta" | "urgente";
export type PublicoAviso = "todos" | "modulos";

export interface Aviso {
  id: string;
  titulo: string;
  conteudo: string;
  prioridade: PrioridadeAviso;
  destaque: boolean;
  publico: PublicoAviso;
  modulos_alvo: Modulo[];
  inicio_em: string;
  expira_em: string | null;
  link: string | null;
  ativo: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Aviso com o estado de leitura do usuário logado. */
export interface AvisoComLeitura extends Aviso {
  lido: boolean;
}

export type AvisoInput = Pick<
  Aviso,
  "titulo" | "conteudo" | "prioridade" | "destaque" | "publico" | "modulos_alvo" | "inicio_em" | "expira_em" | "link" | "ativo"
>;

export type TipoDataImportante = "prazo" | "evento" | "reuniao" | "comemorativa" | "outro";

export interface DataImportante {
  id: string;
  titulo: string;
  descricao: string | null;
  data: string; // yyyy-MM-dd
  data_fim: string | null;
  tipo: TipoDataImportante;
  recorrente_anual: boolean;
  modulos_alvo: Modulo[];
  ativo: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type DataImportanteInput = Pick<
  DataImportante,
  "titulo" | "descricao" | "data" | "data_fim" | "tipo" | "recorrente_anual" | "modulos_alvo" | "ativo"
>;

/** Item unificado do calendário (datas cadastradas, feriados e aniversários). */
export type OrigemEventoCalendario = "data_importante" | "feriado" | "aniversario";

export interface EventoDataImportante {
  id: string;
  origem: OrigemEventoCalendario;
  titulo: string;
  descricao?: string | null;
  data: string; // yyyy-MM-dd (ocorrência no ano consultado)
  dataFim?: string | null;
  tipo: TipoDataImportante | "feriado" | "ponto_facultativo" | "aniversario";
}

export const PRIORIDADE_AVISO_LABEL: Record<PrioridadeAviso, string> = {
  baixa: "Baixa",
  normal: "Normal",
  alta: "Alta",
  urgente: "Urgente",
};

export const TIPO_DATA_LABEL: Record<EventoDataImportante["tipo"], string> = {
  prazo: "Prazo",
  evento: "Evento",
  reuniao: "Reunião",
  comemorativa: "Data comemorativa",
  outro: "Outro",
  feriado: "Feriado",
  ponto_facultativo: "Ponto facultativo",
  aniversario: "Aniversário",
};

/** Permissão que libera publicar avisos e cadastrar datas (admin passa por cima). */
export const PERMISSAO_GERENCIAR_AVISOS = "avisos.gerenciar";

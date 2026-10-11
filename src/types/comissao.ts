/**
 * Comissões (tabelas `comissoes` e `comissoes_membros`, migração 20261011020000_lancamento_por_setor.sql).
 * Membro de comissão vigente, com ato, é fundamento de lançamento no módulo da comissão, só no objeto dela
 * (premissa 6 da spec do lançamento por setor). Escrita com `rh.comissoes.gerenciar` (a RLS confere).
 */

export type TipoComissao = "inventario" | "licitacao" | "fiscalizacao_contrato" | "outra";

export const TIPOS_COMISSAO: TipoComissao[] = ["inventario", "licitacao", "fiscalizacao_contrato", "outra"];

export const TIPO_COMISSAO_LABELS: Record<TipoComissao, string> = {
  inventario: "Inventário / levantamento patrimonial",
  licitacao: "Licitação",
  fiscalizacao_contrato: "Fiscalização de contrato",
  outra: "Outra",
};

export type StatusComissao = "ativa" | "encerrada";

export const STATUS_COMISSAO_LABELS: Record<StatusComissao, string> = {
  ativa: "Ativa",
  encerrada: "Encerrada",
};

export type PapelMembroComissao = "presidente" | "membro" | "secretario";

export const PAPEIS_MEMBRO_COMISSAO: PapelMembroComissao[] = ["presidente", "membro", "secretario"];

export const PAPEL_MEMBRO_LABELS: Record<PapelMembroComissao, string> = {
  presidente: "Presidente",
  membro: "Membro",
  secretario: "Secretário(a)",
};

/** Tipos de objeto sugeridos na tela (o objeto é opcional: sem ele a comissão vale no módulo todo). */
export const OBJETO_COMISSAO_LABELS: Record<string, string> = {
  campanha_inventario: "Campanha de inventário",
  contrato: "Contrato",
  processo_licitatorio: "Processo licitatório",
};

export interface Comissao {
  id: string;
  nome: string;
  tipo: TipoComissao;
  modulo: string;
  objeto_tipo: string | null;
  objeto_id: string | null;
  ato_tipo: string | null;
  ato_numero: string | null;
  ato_data: string | null;
  ato_doe_numero: string | null;
  ato_doe_data: string | null;
  data_inicio: string;
  data_fim: string | null;
  motivo: string | null;
  status: StatusComissao;
  created_at?: string;
  membros?: MembroComissao[];
}

export interface MembroComissao {
  id: string;
  comissao_id: string;
  servidor_id: string;
  papel: PapelMembroComissao;
  data_inicio: string;
  data_fim: string | null;
  servidor?: { id: string; nome_completo: string; matricula: string | null } | null;
}

export type DadosComissao = Omit<Comissao, "id" | "created_at" | "membros">;

export type DadosMembroComissao = Omit<MembroComissao, "id" | "servidor">;

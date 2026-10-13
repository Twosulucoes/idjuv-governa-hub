/**
 * Tipos para o módulo de Workflow Administrativo (SEI-like)
 */

// Tipos de processo
export type TipoProcesso = 
  | 'compra' | 'licitacao' | 'rh' | 'patrimonio' | 'lai' 
  | 'governanca' | 'convenio' | 'diaria' | 'viagem' | 'federacao' | 'outro';

export type StatusProcesso = 'aberto' | 'em_tramitacao' | 'suspenso' | 'concluido' | 'arquivado';
export type NivelSigilo = 'publico' | 'restrito' | 'sigiloso';
export type TipoMovimentacao = 'despacho' | 'encaminhamento' | 'juntada' | 'decisao' | 'informacao' | 'ciencia' | 'devolucao';
export type StatusMovimentacao = 'pendente' | 'recebido' | 'respondido' | 'vencido' | 'cancelado';
export type TipoDespacho = 'simples' | 'decisorio' | 'conclusivo';
export type DecisaoDespacho = 'deferido' | 'indeferido' | 'parcialmente_deferido' | 'encaminhar' | 'arquivar' | 'suspender' | 'informar';
export type TipoDocumentoProcesso = 'oficio' | 'nota_tecnica' | 'parecer' | 'despacho' | 'anexo' | 'requerimento' | 'declaracao' | 'certidao' | 'outro';

// Interfaces principais
export interface MovimentacaoProcesso {
  id: string;
  processo_id: string;
  numero_sequencial: number;
  tipo_movimentacao: TipoMovimentacao;
  descricao: string;
  unidade_origem_id?: string;
  unidade_destino_id?: string;
  servidor_origem_id?: string;
  servidor_destino_id?: string;
  prazo_dias?: number;
  prazo_limite?: string;
  /** Etapa do modelo de/para (movimentações feitas pelas RPCs wf_*; nulas nas antigas) */
  etapa_origem_ordem?: number | null;
  etapa_destino_ordem?: number | null;
  status: StatusMovimentacao;
  data_recebimento?: string;
  data_resposta?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  // Joins
  unidade_origem?: { id: string; nome: string; sigla?: string };
  unidade_destino?: { id: string; nome: string; sigla?: string };
  servidor_origem?: { id: string; nome_completo: string };
  servidor_destino?: { id: string; nome_completo: string };
}

export interface Despacho {
  id: string;
  processo_id: string;
  movimentacao_id?: string;
  numero_despacho: number;
  texto_despacho: string;
  tipo_despacho: TipoDespacho;
  fundamentacao_legal?: string;
  decisao?: DecisaoDespacho;
  autoridade_id?: string;
  data_despacho: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  // Joins
  autoridade?: { id: string; nome_completo: string; cargo_atual?: { nome: string } };
}

export interface DocumentoProcesso {
  id: string;
  processo_id: string;
  tipo_documento: TipoDocumentoProcesso;
  numero_documento?: string;
  titulo: string;
  conteudo_textual?: string;
  arquivo_url?: string;
  arquivo_nome?: string;
  arquivo_tamanho?: number;
  hash_sha256?: string;
  sigilo: NivelSigilo;
  ordem: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// Labels para UI
export const TIPO_PROCESSO_LABELS: Record<TipoProcesso, string> = {
  compra: 'Compra',
  licitacao: 'Licitação',
  rh: 'Recursos Humanos',
  patrimonio: 'Patrimônio',
  lai: 'LAI',
  governanca: 'Governança',
  convenio: 'Convênio',
  diaria: 'Diária',
  viagem: 'Viagem',
  federacao: 'Federação',
  outro: 'Outro',
};

export const STATUS_PROCESSO_LABELS: Record<StatusProcesso, string> = {
  aberto: 'Aberto',
  em_tramitacao: 'Em Tramitação',
  suspenso: 'Suspenso',
  concluido: 'Concluído',
  arquivado: 'Arquivado',
};

export const SIGILO_LABELS: Record<NivelSigilo, string> = {
  publico: 'Público',
  restrito: 'Restrito',
  sigiloso: 'Sigiloso',
};

export const TIPO_MOVIMENTACAO_LABELS: Record<TipoMovimentacao, string> = {
  despacho: 'Despacho',
  encaminhamento: 'Encaminhamento',
  juntada: 'Juntada de Documento',
  decisao: 'Decisão',
  informacao: 'Informação',
  ciencia: 'Ciência',
  devolucao: 'Devolução',
};

export const TIPO_DESPACHO_LABELS: Record<TipoDespacho, string> = {
  simples: 'Simples',
  decisorio: 'Decisório',
  conclusivo: 'Conclusivo',
};

export const DECISAO_LABELS: Record<DecisaoDespacho, string> = {
  deferido: 'Deferido',
  indeferido: 'Indeferido',
  parcialmente_deferido: 'Parcialmente Deferido',
  encaminhar: 'Encaminhar',
  arquivar: 'Arquivar',
  suspender: 'Suspender',
  informar: 'Tomar Ciência',
};

// ========================
// ACOMPANHAMENTO DE PROCESSOS DO SEI (modelos, checklist, view da lista)
// Os tipos abaixo seguem as migrações 20261013100000..100200 (types.ts gerado ainda não os conhece).
// ========================

export type SituacaoPrazo = 'em_dia' | 'vence_logo' | 'vencido' | 'sem_prazo';
export type NivelAcessoSigiloso = 'leitura' | 'tramitacao' | 'total';

export interface ModeloProcesso {
  id: string;
  codigo: string;
  nome: string;
  tipo_processo: TipoProcesso;
  base_legal: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface EtapaModelo {
  id: string;
  modelo_id: string;
  ordem: number;
  nome: string;
  /** Sigla da unidade, ou @ORIGEM / @CHEFIA */
  unidade_sigla: string;
  responsavel_rotulo: string | null;
  /** Nulo = etapa sem prazo */
  prazo_dias_uteis: number | null;
}

export interface ItemChecklistModelo {
  id: string;
  modelo_id: string;
  etapa_ordem: number;
  codigo: string;
  descricao: string;
  obrigatorio: boolean;
}

export interface RespostaChecklist {
  id: string;
  processo_id: string;
  item_id: string;
  marcado: boolean;
  marcado_por: string | null;
  marcado_em: string | null;
  observacao: string | null;
}

/** Modelo com etapas e checklist (resultado de useModeloProcesso). */
export interface ModeloProcessoCompleto extends ModeloProcesso {
  etapas: EtapaModelo[];
  checklist: ItemChecklistModelo[];
}

/** Linha da view v_processos_acompanhamento. */
export interface ProcessoAcompanhamento {
  id: string;
  numero_processo: string;
  ano: number;
  numero_formatado: string;
  numero_sei: string | null;
  tipo_processo: TipoProcesso;
  assunto: string;
  descricao: string | null;
  interessado_tipo: 'interno' | 'externo';
  interessado_nome: string;
  interessado_documento: string | null;
  unidade_origem_id: string | null;
  status: StatusProcesso;
  sigilo: NivelSigilo;
  data_abertura: string;
  data_encerramento: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  modelo_id: string | null;
  modelo_codigo: string | null;
  modelo_nome: string | null;
  etapa_atual_ordem: number | null;
  etapa_nome: string | null;
  etapa_total: number;
  unidade_atual_id: string | null;
  unidade_sigla: string | null;
  unidade_nome: string | null;
  etapa_iniciada_em: string | null;
  etapa_prazo_limite: string | null;
  suspenso_desde: string | null;
  situacao_prazo: SituacaoPrazo;
  pendencias_obrigatorias: number;
}

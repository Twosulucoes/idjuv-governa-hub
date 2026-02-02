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
export type ReferenciaPrazo = 'legal' | 'interno' | 'judicial' | 'contratual' | 'regulamentar';

// Interfaces principais
export interface ProcessoAdministrativo {
  id: string;
  numero_processo: string;
  ano: number;
  tipo_processo: TipoProcesso;
  assunto: string;
  descricao?: string;
  interessado_tipo: 'interno' | 'externo';
  interessado_nome: string;
  interessado_documento?: string;
  unidade_origem_id?: string;
  status: StatusProcesso;
  sigilo: NivelSigilo;
  data_abertura: string;
  data_encerramento?: string;
  processo_origem_id?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  // Joins
  unidade_origem?: { id: string; nome: string; sigla?: string };
}

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

export interface PrazoProcesso {
  id: string;
  processo_id: string;
  referencia: ReferenciaPrazo;
  descricao: string;
  base_legal?: string;
  prazo_dias: number;
  data_inicio: string;
  data_limite: string;
  cumprido: boolean;
  data_cumprimento?: string;
  responsavel_id?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  // Joins
  responsavel?: { id: string; nome_completo: string };
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

export const STATUS_PROCESSO_COLORS: Record<StatusProcesso, string> = {
  aberto: 'bg-blue-100 text-blue-800',
  em_tramitacao: 'bg-yellow-100 text-yellow-800',
  suspenso: 'bg-orange-100 text-orange-800',
  concluido: 'bg-green-100 text-green-800',
  arquivado: 'bg-gray-100 text-gray-800',
};

export const SIGILO_LABELS: Record<NivelSigilo, string> = {
  publico: 'Público',
  restrito: 'Restrito',
  sigiloso: 'Sigiloso',
};

export const SIGILO_COLORS: Record<NivelSigilo, string> = {
  publico: 'bg-green-100 text-green-800',
  restrito: 'bg-yellow-100 text-yellow-800',
  sigiloso: 'bg-red-100 text-red-800',
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

export const STATUS_MOVIMENTACAO_LABELS: Record<StatusMovimentacao, string> = {
  pendente: 'Pendente',
  recebido: 'Recebido',
  respondido: 'Respondido',
  vencido: 'Vencido',
  cancelado: 'Cancelado',
};

export const STATUS_MOVIMENTACAO_COLORS: Record<StatusMovimentacao, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  recebido: 'bg-blue-100 text-blue-800',
  respondido: 'bg-green-100 text-green-800',
  vencido: 'bg-red-100 text-red-800',
  cancelado: 'bg-gray-100 text-gray-800',
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

export const TIPO_DOCUMENTO_LABELS: Record<TipoDocumentoProcesso, string> = {
  oficio: 'Ofício',
  nota_tecnica: 'Nota Técnica',
  parecer: 'Parecer',
  despacho: 'Despacho',
  anexo: 'Anexo',
  requerimento: 'Requerimento',
  declaracao: 'Declaração',
  certidao: 'Certidão',
  outro: 'Outro',
};

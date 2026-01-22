// ============================================
// TIPOS DO MÓDULO ASCOM - IDJuv
// ============================================

// Categorias de demanda
export type CategoriaDemandasAscom =
  | 'cobertura_institucional'
  | 'criacao_artes'
  | 'conteudo_institucional'
  | 'gestao_redes_sociais'
  | 'imprensa_relacoes'
  | 'demandas_emergenciais';

// Tipos de demanda
export type TipoDemandaAscom =
  | 'cobertura_fotografica'
  | 'cobertura_audiovisual'
  | 'cobertura_jornalistica'
  | 'cobertura_redes_sociais'
  | 'cobertura_transmissao_ao_vivo'
  | 'arte_redes_sociais'
  | 'arte_banner'
  | 'arte_cartaz'
  | 'arte_folder'
  | 'arte_convite'
  | 'arte_certificado'
  | 'arte_identidade_visual'
  | 'conteudo_noticia_site'
  | 'conteudo_texto_redes'
  | 'conteudo_nota_oficial'
  | 'conteudo_release'
  | 'conteudo_discurso'
  | 'redes_publicacao_programada'
  | 'redes_campanha'
  | 'redes_cobertura_tempo_real'
  | 'imprensa_atendimento'
  | 'imprensa_agendamento_entrevista'
  | 'imprensa_resposta_oficial'
  | 'imprensa_nota_esclarecimento'
  | 'emergencial_crise'
  | 'emergencial_nota_urgente'
  | 'emergencial_posicionamento';

// Status de demanda
export type StatusDemandaAscom =
  | 'rascunho'
  | 'enviada'
  | 'em_analise'
  | 'aguardando_autorizacao'
  | 'aprovada'
  | 'em_execucao'
  | 'concluida'
  | 'indeferida'
  | 'cancelada';

// Prioridade
export type PrioridadeDemandaAscom = 'baixa' | 'normal' | 'alta' | 'urgente';

// Interface principal de Demanda
export interface DemandaAscom {
  id: string;
  numero_demanda: string;
  ano: number;
  
  // Solicitante
  unidade_solicitante_id?: string;
  servidor_solicitante_id?: string;
  nome_responsavel: string;
  cargo_funcao?: string;
  contato_telefone?: string;
  contato_email?: string;
  
  // Classificação
  categoria: CategoriaDemandasAscom;
  tipo: TipoDemandaAscom;
  
  // Detalhamento
  titulo: string;
  descricao_detalhada: string;
  objetivo_institucional?: string;
  publico_alvo?: string;
  
  // Datas e Prazos
  data_evento?: string;
  hora_evento?: string;
  local_evento?: string;
  prazo_entrega: string;
  
  // Status e Controle
  status: StatusDemandaAscom;
  prioridade: PrioridadeDemandaAscom;
  requer_autorizacao_presidencia: boolean;
  
  // Execução ASCOM
  responsavel_ascom_id?: string;
  data_inicio_execucao?: string;
  data_conclusao?: string;
  observacoes_internas_ascom?: string;
  
  // Aprovação
  aprovado_por_id?: string;
  data_aprovacao?: string;
  autorizado_presidencia_por_id?: string;
  data_autorizacao_presidencia?: string;
  justificativa_indeferimento?: string;
  
  // Histórico
  historico_status?: Array<{
    status_anterior: StatusDemandaAscom;
    status_novo: StatusDemandaAscom;
    data: string;
    usuario_id: string;
  }>;
  
  // Auditoria
  created_at: string;
  created_by?: string;
  updated_at: string;
  updated_by?: string;
  
  // Relacionamentos (expandidos)
  unidade_solicitante?: { id: string; nome: string; sigla: string };
  servidor_solicitante?: { id: string; nome_completo: string };
  responsavel_ascom?: { id: string; nome_completo: string };
}

// Anexo de demanda
export interface AnexoDemandaAscom {
  id: string;
  demanda_id: string;
  tipo_anexo: 'solicitacao' | 'entregavel' | 'referencia';
  nome_arquivo: string;
  descricao?: string;
  url_arquivo: string;
  tipo_mime?: string;
  tamanho_bytes?: number;
  created_at: string;
  created_by?: string;
}

// Entregável
export interface EntregavelDemandaAscom {
  id: string;
  demanda_id: string;
  tipo_entregavel: string;
  descricao: string;
  url_arquivo?: string;
  link_publicacao?: string;
  data_entrega: string;
  relatorio_cobertura?: string;
  metricas?: Record<string, any>;
  created_at: string;
  created_by?: string;
}

// Comentário
export interface ComentarioDemandaAscom {
  id: string;
  demanda_id: string;
  tipo: 'comentario' | 'status' | 'interno';
  conteudo: string;
  visivel_solicitante: boolean;
  created_at: string;
  created_by?: string;
}

// Labels
export const CATEGORIA_DEMANDA_LABELS: Record<CategoriaDemandasAscom, string> = {
  cobertura_institucional: 'Cobertura Institucional',
  criacao_artes: 'Criação de Artes e Materiais',
  conteudo_institucional: 'Conteúdo Institucional',
  gestao_redes_sociais: 'Gestão de Redes Sociais',
  imprensa_relacoes: 'Imprensa e Relações Institucionais',
  demandas_emergenciais: 'Demandas Emergenciais'
};

export const TIPO_DEMANDA_LABELS: Record<TipoDemandaAscom, string> = {
  cobertura_fotografica: 'Cobertura Fotográfica',
  cobertura_audiovisual: 'Cobertura Audiovisual (Vídeo)',
  cobertura_jornalistica: 'Cobertura Jornalística',
  cobertura_redes_sociais: 'Cobertura para Redes Sociais',
  cobertura_transmissao_ao_vivo: 'Transmissão ao Vivo',
  arte_redes_sociais: 'Arte para Redes Sociais',
  arte_banner: 'Banner',
  arte_cartaz: 'Cartaz',
  arte_folder: 'Folder',
  arte_convite: 'Convite Institucional',
  arte_certificado: 'Certificado',
  arte_identidade_visual: 'Identidade Visual de Evento',
  conteudo_noticia_site: 'Notícia para Site',
  conteudo_texto_redes: 'Texto para Redes Sociais',
  conteudo_nota_oficial: 'Nota Oficial',
  conteudo_release: 'Release para Imprensa',
  conteudo_discurso: 'Discurso Institucional',
  redes_publicacao_programada: 'Publicação Programada',
  redes_campanha: 'Campanha Institucional',
  redes_cobertura_tempo_real: 'Cobertura em Tempo Real',
  imprensa_atendimento: 'Atendimento à Imprensa',
  imprensa_agendamento_entrevista: 'Agendamento de Entrevistas',
  imprensa_resposta_oficial: 'Resposta Oficial',
  imprensa_nota_esclarecimento: 'Nota de Esclarecimento',
  emergencial_crise: 'Crise Institucional',
  emergencial_nota_urgente: 'Nota Urgente',
  emergencial_posicionamento: 'Posicionamento Público Imediato'
};

export const STATUS_DEMANDA_LABELS: Record<StatusDemandaAscom, string> = {
  rascunho: 'Rascunho',
  enviada: 'Enviada',
  em_analise: 'Em Análise',
  aguardando_autorizacao: 'Aguardando Autorização',
  aprovada: 'Aprovada',
  em_execucao: 'Em Execução',
  concluida: 'Concluída',
  indeferida: 'Indeferida',
  cancelada: 'Cancelada'
};

export const PRIORIDADE_DEMANDA_LABELS: Record<PrioridadeDemandaAscom, string> = {
  baixa: 'Baixa',
  normal: 'Normal',
  alta: 'Alta',
  urgente: 'Urgente'
};

// Cores de status
export const STATUS_DEMANDA_COLORS: Record<StatusDemandaAscom, string> = {
  rascunho: 'bg-gray-100 text-gray-800',
  enviada: 'bg-blue-100 text-blue-800',
  em_analise: 'bg-yellow-100 text-yellow-800',
  aguardando_autorizacao: 'bg-orange-100 text-orange-800',
  aprovada: 'bg-green-100 text-green-800',
  em_execucao: 'bg-purple-100 text-purple-800',
  concluida: 'bg-emerald-100 text-emerald-800',
  indeferida: 'bg-red-100 text-red-800',
  cancelada: 'bg-gray-100 text-gray-500'
};

// Cores de prioridade
export const PRIORIDADE_DEMANDA_COLORS: Record<PrioridadeDemandaAscom, string> = {
  baixa: 'bg-gray-100 text-gray-700',
  normal: 'bg-blue-100 text-blue-700',
  alta: 'bg-orange-100 text-orange-700',
  urgente: 'bg-red-100 text-red-700'
};

// Mapeamento de tipos por categoria
export const TIPOS_POR_CATEGORIA: Record<CategoriaDemandasAscom, TipoDemandaAscom[]> = {
  cobertura_institucional: [
    'cobertura_fotografica',
    'cobertura_audiovisual',
    'cobertura_jornalistica',
    'cobertura_redes_sociais',
    'cobertura_transmissao_ao_vivo'
  ],
  criacao_artes: [
    'arte_redes_sociais',
    'arte_banner',
    'arte_cartaz',
    'arte_folder',
    'arte_convite',
    'arte_certificado',
    'arte_identidade_visual'
  ],
  conteudo_institucional: [
    'conteudo_noticia_site',
    'conteudo_texto_redes',
    'conteudo_nota_oficial',
    'conteudo_release',
    'conteudo_discurso'
  ],
  gestao_redes_sociais: [
    'redes_publicacao_programada',
    'redes_campanha',
    'redes_cobertura_tempo_real'
  ],
  imprensa_relacoes: [
    'imprensa_atendimento',
    'imprensa_agendamento_entrevista',
    'imprensa_resposta_oficial',
    'imprensa_nota_esclarecimento'
  ],
  demandas_emergenciais: [
    'emergencial_crise',
    'emergencial_nota_urgente',
    'emergencial_posicionamento'
  ]
};

// Tipos que requerem autorização da presidência
export const TIPOS_REQUER_AUTORIZACAO: TipoDemandaAscom[] = [
  'conteudo_nota_oficial',
  'emergencial_crise',
  'imprensa_agendamento_entrevista',
  'emergencial_posicionamento',
  'redes_campanha'
];

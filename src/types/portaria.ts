// Tipos para o Sistema de Gestão de Portarias

export type TipoPortaria = 'nomeacao' | 'exoneracao' | 'designacao' | 'dispensa' | 'cessao' | 'ferias' | 'licenca' | 'outro';

export type StatusPortaria = 'minuta' | 'aguardando_assinatura' | 'assinado' | 'aguardando_publicacao' | 'publicado' | 'vigente' | 'revogado';

export type CategoriaPortaria = 'pessoal' | 'estruturante' | 'normativa' | 'delegacao' | 'nomeacao' | 'exoneracao' | 'designacao' | 'dispensa' | 'cessao' | 'ferias' | 'licenca';

export const TIPO_PORTARIA_LABELS: Record<TipoPortaria, string> = {
  nomeacao: 'Nomeação',
  exoneracao: 'Exoneração',
  designacao: 'Designação',
  dispensa: 'Dispensa',
  cessao: 'Cessão',
  ferias: 'Férias',
  licenca: 'Licença',
  outro: 'Outro',
};

export const STATUS_PORTARIA_LABELS: Record<StatusPortaria, string> = {
  // 'minuta' no banco: o ato ainda está sendo feito no SEI (o sistema não redige portaria)
  minuta: 'Aguardando SEI',
  aguardando_assinatura: 'Aguardando Assinatura',
  assinado: 'Assinado',
  aguardando_publicacao: 'Aguardando Publicação',
  publicado: 'Publicado',
  vigente: 'Vigente',
  revogado: 'Revogado',
};

export const STATUS_PORTARIA_COLORS: Record<StatusPortaria, string> = {
  minuta: 'bg-muted text-muted-foreground',
  aguardando_assinatura: 'bg-warning/20 text-warning',
  assinado: 'bg-primary/20 text-primary',
  aguardando_publicacao: 'bg-info/20 text-info',
  publicado: 'bg-success/20 text-success',
  vigente: 'bg-success/30 text-success',
  revogado: 'bg-destructive/20 text-destructive',
};

export const STATUS_PORTARIA_ICONS: Record<StatusPortaria, string> = {
  minuta: 'FileEdit',
  aguardando_assinatura: 'PenTool',
  assinado: 'CheckSquare',
  aguardando_publicacao: 'FileUp',
  publicado: 'Newspaper',
  vigente: 'BadgeCheck',
  revogado: 'XCircle',
};

export interface Portaria {
  id: string;
  numero: string;
  titulo: string;
  tipo: 'portaria' | 'decreto' | 'lei' | 'resolucao' | 'instrucao_normativa' | 'ordem_servico' | 'memorando' | 'oficio' | 'outros';
  status: StatusPortaria;
  categoria?: CategoriaPortaria;
  
  // Datas
  data_documento: string;
  data_publicacao?: string;
  data_vigencia_inicio?: string;
  data_vigencia_fim?: string;
  data_assinatura?: string;
  
  // DOE
  doe_numero?: string;
  doe_data?: string;
  doe_link?: string;

  // Processo SEI onde o ato foi formalizado
  processo_sei?: string | null;
  
  // Conteúdo
  ementa?: string;
  conteudo_html?: string;
  observacoes?: string;
  
  // Arquivos
  arquivo_url?: string;
  arquivo_assinado_url?: string;
  
  // Assinatura
  assinado_por?: string;
  
  // Vínculos
  servidor_id?: string;
  servidores_ids?: string[];
  cargo_id?: string;
  unidade_id?: string;
  provimento_id?: string;
  designacao_id?: string;
  
  // Metadados
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  
  // Joins
  servidor?: {
    id: string;
    nome_completo: string;
    matricula?: string;
    cpf?: string;
  };
  cargo?: {
    id: string;
    nome: string;
    sigla?: string;
  };
  unidade?: {
    id: string;
    nome: string;
    sigla?: string;
  };
  criador?: {
    id: string;
    full_name?: string;
  };
  assinante?: {
    id: string;
    full_name?: string;
  };
}

export interface CreatePortariaData {
  numero?: string; // Número oficial do SEI; se não informado, fica o provisório PENDENTE/AAAA
  titulo: string;
  tipo: 'portaria';
  categoria?: CategoriaPortaria;
  status?: StatusPortaria;
  data_documento: string;
  ementa?: string;
  conteudo_html?: string;
  observacoes?: string;
  servidor_id?: string;
  servidores_ids?: string[];
  cargo_id?: string;
  unidade_id?: string;
  provimento_id?: string;
  designacao_id?: string;
  processo_sei?: string | null;
  doe_numero?: string;
  doe_data?: string;
  data_publicacao?: string;
  data_vigencia_inicio?: string;
  arquivo_url?: string;
}

export interface UpdatePortariaData extends Partial<CreatePortariaData> {
  data_assinatura?: string;
  assinado_por?: string;
  arquivo_assinado_url?: string;
  doe_numero?: string;
  doe_data?: string;
  data_publicacao?: string;
}

// Workflow de portarias
export const WORKFLOW_TRANSITIONS: Record<StatusPortaria, StatusPortaria[]> = {
  minuta: ['aguardando_assinatura', 'revogado'],
  aguardando_assinatura: ['assinado', 'minuta', 'revogado'],
  assinado: ['aguardando_publicacao', 'revogado'],
  aguardando_publicacao: ['publicado', 'revogado'],
  publicado: ['vigente', 'revogado'],
  vigente: ['revogado'],
  revogado: [],
};

// Tipos para Unidades Locais - Módulo Completo de Gestão
// Os tipos abaixo correspondem aos enums do banco de dados

export type TipoUnidadeLocal = 
  | 'ginasio'
  | 'estadio'
  | 'parque_aquatico'
  | 'piscina'
  | 'complexo'
  | 'quadra'
  | 'outro';

export type NaturezaUso = 
  | 'esportivo'
  | 'cultural'
  | 'comunitario'
  | 'misto';

export type StatusUnidadeLocal = 
  | 'ativa'
  | 'inativa'
  | 'manutencao'
  | 'interditada';

export type TipoAtoNomeacao = 
  | 'portaria'
  | 'decreto'
  | 'ato'
  | 'outro';

export type StatusNomeacao = 
  | 'ativo'
  | 'encerrado'
  | 'revogado';

export type TipoSolicitante = 
  | 'pessoa_fisica'
  | 'pessoa_juridica'
  | 'entidade';

// Status de agenda: valores do banco + frontend
export type StatusAgenda = 
  | 'solicitado'
  | 'aprovado'
  | 'rejeitado'
  | 'cancelado'
  | 'concluido';

export type StatusTermoCessao = 
  | 'pendente'
  | 'emitido'
  | 'assinado'
  | 'cancelado';

export type TipoTermo = 
  | 'autorizacao'
  | 'responsabilidade';

export type EstadoConservacao = 
  | 'otimo'
  | 'bom'
  | 'regular'
  | 'ruim'
  | 'inservivel';

export type SituacaoPatrimonio = 
  | 'em_uso'
  | 'em_estoque'
  | 'cedido'
  | 'em_manutencao'
  | 'baixado';

export interface UnidadeLocal {
  id: string;
  codigo_unidade?: string;
  municipio: string;
  tipo_unidade: TipoUnidadeLocal;
  natureza_uso?: string;
  nome_unidade: string;
  endereco_completo?: string;
  status: StatusUnidadeLocal;
  capacidade?: number;
  areas_disponiveis: string[];
  horario_funcionamento?: string;
  regras_de_uso?: string;
  observacoes?: string;
  fotos: string[];
  documentos: string[];
  // Vinculação administrativa
  diretoria_vinculada?: string;
  unidade_administrativa?: string;
  autoridade_autorizadora?: string;
  estrutura_disponivel?: string;
  historico_alteracoes?: any[];
  // Metadados
  created_by?: string;
  created_at?: string;
  updated_by?: string;
  updated_at?: string;
  // Dados agregados
  chefe_atual?: {
    nomeacao_id: string;
    servidor_id: string;
    servidor_nome: string;
    cargo: string;
    data_inicio: string;
    ato_numero: string;
  };
}

export interface NomeacaoChefeUnidade {
  id: string;
  unidade_local_id: string;
  servidor_id: string;
  cargo: string;
  ato_nomeacao_tipo: TipoAtoNomeacao;
  ato_numero: string;
  ato_data_publicacao: string;
  ato_doe_numero?: string;
  ato_doe_data?: string;
  data_inicio: string;
  data_fim?: string;
  status: StatusNomeacao;
  documento_nomeacao_url?: string;
  observacoes?: string;
  created_by?: string;
  created_at?: string;
  updated_by?: string;
  updated_at?: string;
  servidor?: {
    id: string;
    nome_completo: string;
    cpf: string;
    foto_url?: string;
  };
}

export interface PatrimonioUnidade {
  id: string;
  unidade_local_id: string;
  item: string;
  numero_tombo?: string;
  categoria?: string;
  quantidade: number;
  estado_conservacao: EstadoConservacao;
  situacao: SituacaoPatrimonio;
  descricao?: string;
  valor_estimado?: number;
  data_aquisicao?: string;
  anexos: string[];
  observacoes?: string;
  created_by?: string;
  created_at?: string;
  updated_by?: string;
  updated_at?: string;
}

export interface AgendaUnidade {
  id: string;
  unidade_local_id: string;
  numero_protocolo?: string;
  titulo: string;
  descricao?: string;
  tipo_uso: string;
  // Dados do Solicitante
  tipo_solicitante?: string;
  solicitante_nome: string;
  solicitante_documento?: string;
  solicitante_telefone?: string;
  solicitante_email?: string;
  solicitante_razao_social?: string;
  solicitante_cnpj?: string;
  solicitante_endereco?: string;
  responsavel_legal?: string;
  responsavel_legal_documento?: string;
  // Dados da Solicitação
  finalidade_detalhada?: string;
  espaco_especifico?: string;
  data_inicio: string;
  data_fim: string;
  horario_diario?: string;
  area_utilizada?: string;
  publico_estimado?: number;
  // Status e Aprovação
  status: StatusAgenda;
  aprovador_id?: string;
  data_aprovacao?: string;
  motivo_rejeicao?: string;
  // Controle
  historico_status?: any[];
  documentos_anexos?: any[];
  ano_vigencia?: number;
  encerrado_automaticamente?: boolean;
  observacoes?: string;
  created_by?: string;
  created_at?: string;
  updated_by?: string;
  updated_at?: string;
  aprovador?: {
    id: string;
    nome_completo: string;
  };
}

export interface DocumentoCedencia {
  id: string;
  agenda_id: string;
  tipo_documento: string;
  nome_arquivo: string;
  url_arquivo: string;
  tamanho_bytes?: number;
  mime_type?: string;
  versao?: number;
  documento_principal?: boolean;
  observacoes?: string;
  uploaded_by?: string;
  uploaded_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TermoCessao {
  id: string;
  agenda_id: string;
  unidade_local_id: string;
  numero_termo: string;
  numero_protocolo?: string;
  ano: number;
  tipo_termo?: string;
  // Dados do Cessionário
  cessionario_nome: string;
  cessionario_tipo?: string;
  cessionario_documento?: string;
  cessionario_endereco?: string;
  cessionario_telefone?: string;
  cessionario_email?: string;
  // Detalhes
  finalidade: string;
  periodo_inicio: string;
  periodo_fim: string;
  condicoes_uso?: string;
  responsabilidades?: string;
  restricoes_uso?: string;
  // Autoridade
  autoridade_concedente?: string;
  autoridade_cargo?: string;
  chefe_responsavel_id?: string;
  // Status e Documentos
  status: StatusTermoCessao;
  documento_gerado_url?: string;
  documento_assinado_url?: string;
  data_emissao?: string;
  data_assinatura?: string;
  termo_responsabilidade_aceito?: boolean;
  data_aceite_responsabilidade?: string;
  // Histórico
  historico_renovacoes?: any[];
  observacoes?: string;
  created_by?: string;
  created_at?: string;
  updated_by?: string;
  updated_at?: string;
  // Relacionamentos
  agenda?: AgendaUnidade;
  unidade?: UnidadeLocal;
  chefe_responsavel?: NomeacaoChefeUnidade;
}

// Labels
export const TIPO_UNIDADE_LABELS: Record<TipoUnidadeLocal, string> = {
  ginasio: 'Ginásio',
  estadio: 'Estádio',
  parque_aquatico: 'Parque Aquático',
  piscina: 'Piscina',
  complexo: 'Complexo Esportivo',
  quadra: 'Quadra',
  outro: 'Outro',
};

export const NATUREZA_USO_LABELS: Record<NaturezaUso, string> = {
  esportivo: 'Esportivo',
  cultural: 'Cultural',
  comunitario: 'Comunitário',
  misto: 'Misto',
};

export const STATUS_UNIDADE_LABELS: Record<StatusUnidadeLocal, string> = {
  ativa: 'Ativa',
  inativa: 'Inativa',
  manutencao: 'Em Manutenção',
  interditada: 'Interditada',
};

export const STATUS_UNIDADE_COLORS: Record<StatusUnidadeLocal, string> = {
  ativa: 'bg-success text-success-foreground',
  inativa: 'bg-muted text-muted-foreground',
  manutencao: 'bg-warning text-warning-foreground',
  interditada: 'bg-destructive text-destructive-foreground',
};

export const TIPO_ATO_LABELS: Record<TipoAtoNomeacao, string> = {
  portaria: 'Portaria',
  decreto: 'Decreto',
  ato: 'Ato',
  outro: 'Outro',
};

export const STATUS_NOMEACAO_LABELS: Record<StatusNomeacao, string> = {
  ativo: 'Ativo',
  encerrado: 'Encerrado',
  revogado: 'Revogado',
};

export const STATUS_NOMEACAO_COLORS: Record<StatusNomeacao, string> = {
  ativo: 'bg-success text-success-foreground',
  encerrado: 'bg-muted text-muted-foreground',
  revogado: 'bg-destructive text-destructive-foreground',
};

export const TIPO_SOLICITANTE_LABELS: Record<TipoSolicitante, string> = {
  pessoa_fisica: 'Pessoa Física',
  pessoa_juridica: 'Pessoa Jurídica',
  entidade: 'Entidade/Associação',
};

export const STATUS_AGENDA_LABELS: Record<StatusAgenda, string> = {
  solicitado: 'Solicitado',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
  cancelado: 'Cancelado',
  concluido: 'Concluído',
};

export const STATUS_AGENDA_COLORS: Record<StatusAgenda, string> = {
  solicitado: 'bg-warning text-warning-foreground',
  aprovado: 'bg-success text-success-foreground',
  rejeitado: 'bg-destructive text-destructive-foreground',
  cancelado: 'bg-muted text-muted-foreground',
  concluido: 'bg-primary text-primary-foreground',
};

export const STATUS_TERMO_LABELS: Record<StatusTermoCessao, string> = {
  pendente: 'Pendente',
  emitido: 'Emitido',
  assinado: 'Assinado',
  cancelado: 'Cancelado',
};

export const STATUS_TERMO_COLORS: Record<StatusTermoCessao, string> = {
  pendente: 'bg-warning text-warning-foreground',
  emitido: 'bg-info text-info-foreground',
  assinado: 'bg-success text-success-foreground',
  cancelado: 'bg-muted text-muted-foreground',
};

export const ESTADO_CONSERVACAO_LABELS: Record<EstadoConservacao, string> = {
  otimo: 'Ótimo',
  bom: 'Bom',
  regular: 'Regular',
  ruim: 'Ruim',
  inservivel: 'Inservível',
};

export const SITUACAO_PATRIMONIO_LABELS: Record<SituacaoPatrimonio, string> = {
  em_uso: 'Em Uso',
  em_estoque: 'Em Estoque',
  cedido: 'Cedido',
  em_manutencao: 'Em Manutenção',
  baixado: 'Baixado',
};

export const AREAS_DISPONIVEIS_OPTIONS = [
  'Quadra Poliesportiva',
  'Campo de Futebol',
  'Piscina Olímpica',
  'Piscina Semiolímpica',
  'Piscina Infantil',
  'Sala de Musculação',
  'Sala de Ginástica',
  'Vestiários',
  'Arquibancada',
  'Estacionamento',
  'Área de Alimentação',
  'Sala de Reuniões',
  'Auditório',
  'Pista de Atletismo',
  'Quadra de Tênis',
  'Quadra de Vôlei de Praia',
  'Iluminação',
  'Banheiros',
];

export const MUNICIPIOS_RORAIMA = [
  'Alto Alegre',
  'Amajari',
  'Boa Vista',
  'Bonfim',
  'Cantá',
  'Caracaraí',
  'Caroebe',
  'Iracema',
  'Mucajaí',
  'Normandia',
  'Pacaraima',
  'Rorainópolis',
  'São João da Baliza',
  'São Luiz',
  'Uiramutã',
];

export const DIRETORIAS_IDJUV = [
  'Presidência',
  'Diretoria de Esporte',
  'Diretoria de Juventude e Lazer',
  'Diretoria Administrativa e Financeira',
];

export const TIPOS_DOCUMENTO_CEDENCIA = [
  'Requerimento de Solicitação',
  'Documento de Autorização',
  'Termo de Responsabilidade',
  'Comprovante de Identidade',
  'Comprovante de Endereço',
  'Estatuto Social (PJ)',
  'Ata de Eleição (Entidade)',
  'Procuração',
  'Outro',
];

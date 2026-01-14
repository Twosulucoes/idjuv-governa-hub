// ================================================================
// TIPOS PARA GESTÃO DE SERVIDORES POR TIPO
// Baseado na legislação administrativa do IDJuv
// ================================================================

// Tipos de Servidor (princípio estruturante)
export type TipoServidor = 
  | 'efetivo_idjuv'        // Efetivo do IDJuv
  | 'comissionado_idjuv'   // Comissionado do IDJuv
  | 'cedido_entrada'       // Cedido de outro órgão (entrada)
  | 'cedido_saida';        // Efetivo do IDJuv cedido para outro órgão (saída)

// Tipos de Vínculo Funcional
export type TipoVinculoFuncional = 
  | 'efetivo_idjuv'
  | 'comissionado_idjuv'
  | 'cedido_entrada'
  | 'cedido_saida';

// Tipos de Lotação
// NOTA: 'designacao' foi removida - designações agora são entidades separadas (tabela designacoes)
export type TipoLotacao = 
  | 'lotacao_interna'      // Lotação interna padrão
  | 'cessao_interna'       // Cessão dentro do IDJuv
  | 'lotacao_externa';     // Cessão de saída (lotação em outro órgão)

// Status do Provimento
export type StatusProvimento = 
  | 'ativo'
  | 'suspenso'             // Apenas para efetivo em cessão
  | 'encerrado'
  | 'vacante';

// Natureza do Cargo
export type NaturezaCargo = 
  | 'efetivo'
  | 'comissionado';

// Labels para exibição
export const TIPO_SERVIDOR_LABELS: Record<TipoServidor, string> = {
  efetivo_idjuv: 'Efetivo do IDJuv',
  comissionado_idjuv: 'Comissionado do IDJuv',
  cedido_entrada: 'Cedido de Outro Órgão (Entrada)',
  cedido_saida: 'Cedido para Outro Órgão (Saída)',
};

export const TIPO_SERVIDOR_COLORS: Record<TipoServidor, string> = {
  efetivo_idjuv: 'bg-success/20 text-success border-success/30',
  comissionado_idjuv: 'bg-primary/20 text-primary border-primary/30',
  cedido_entrada: 'bg-info/20 text-info border-info/30',
  cedido_saida: 'bg-warning/20 text-warning border-warning/30',
};

export const TIPO_VINCULO_LABELS: Record<TipoVinculoFuncional, string> = {
  efetivo_idjuv: 'Efetivo do IDJuv',
  comissionado_idjuv: 'Comissionado do IDJuv',
  cedido_entrada: 'Cedido (Entrada)',
  cedido_saida: 'Cedido (Saída)',
};

export const TIPO_LOTACAO_LABELS: Record<TipoLotacao, string> = {
  lotacao_interna: 'Lotação Interna',
  cessao_interna: 'Cessão Interna',
  lotacao_externa: 'Lotação Externa (Cessão Saída)',
};

export const STATUS_PROVIMENTO_LABELS: Record<StatusProvimento, string> = {
  ativo: 'Ativo',
  suspenso: 'Suspenso',
  encerrado: 'Encerrado',
  vacante: 'Vacante',
};

export const STATUS_PROVIMENTO_COLORS: Record<StatusProvimento, string> = {
  ativo: 'bg-success/20 text-success border-success/30',
  suspenso: 'bg-warning/20 text-warning border-warning/30',
  encerrado: 'bg-muted text-muted-foreground border-muted',
  vacante: 'bg-info/20 text-info border-info/30',
};

export const NATUREZA_CARGO_LABELS: Record<NaturezaCargo, string> = {
  efetivo: 'Efetivo',
  comissionado: 'Comissionado',
};

// Interfaces

// Interface VinculoFuncional removida - tabela foi dropada
// Dados de vínculo agora são gerenciados via servidores.tipo_servidor + cessoes

export interface Provimento {
  id: string;
  servidor_id: string;
  cargo_id: string;
  unidade_id?: string;
  status: StatusProvimento;
  
  // Datas
  data_nomeacao: string;
  data_posse?: string;
  data_exercicio?: string;
  data_encerramento?: string;
  
  // Ato de nomeação
  ato_nomeacao_tipo?: string;
  ato_nomeacao_numero?: string;
  ato_nomeacao_data?: string;
  ato_nomeacao_doe_numero?: string;
  ato_nomeacao_doe_data?: string;
  ato_nomeacao_url?: string;
  
  // Ato de encerramento
  ato_encerramento_tipo?: string;
  ato_encerramento_numero?: string;
  ato_encerramento_data?: string;
  motivo_encerramento?: string;
  
  observacoes?: string;
  
  created_at?: string;
  created_by?: string;
  
  // Joins
  cargo?: {
    id: string;
    nome: string;
    sigla?: string;
    natureza?: NaturezaCargo;
  };
  unidade?: {
    id: string;
    nome: string;
    sigla?: string;
  };
}

export interface Cessao {
  id: string;
  servidor_id: string;
  tipo: 'entrada' | 'saida';
  
  // Para entrada
  orgao_origem?: string;
  cargo_origem?: string;
  vinculo_origem?: string;
  
  // Para saída
  orgao_destino?: string;
  cargo_destino?: string;
  
  // Ônus
  onus?: 'origem' | 'destino' | 'compartilhado';
  
  // Função no IDJuv (para entrada)
  funcao_exercida_idjuv?: string;
  unidade_idjuv_id?: string;
  
  // Datas
  data_inicio: string;
  data_fim?: string;
  data_retorno?: string;
  ativa: boolean;
  
  // Ato de cessão
  ato_tipo?: string;
  ato_numero?: string;
  ato_data?: string;
  ato_doe_numero?: string;
  ato_doe_data?: string;
  ato_url?: string;
  
  // Ato de retorno
  ato_retorno_numero?: string;
  ato_retorno_data?: string;
  
  observacoes?: string;
  fundamentacao_legal?: string;
  
  created_at?: string;
  created_by?: string;
  
  // Joins
  unidade_idjuv?: {
    id: string;
    nome: string;
    sigla?: string;
  };
}

export interface LotacaoCompleta {
  id: string;
  servidor_id: string;
  unidade_id: string;
  cargo_id?: string;
  tipo_lotacao: TipoLotacao;
  data_inicio: string;
  data_fim?: string;
  funcao_exercida?: string;
  orgao_externo?: string;
  ato_numero?: string;
  ato_data?: string;
  ato_url?: string;
  tipo_movimentacao?: string;
  documento_referencia?: string;
  observacao?: string;
  ativo: boolean;
  
  created_at?: string;
  
  // Joins
  unidade?: {
    id: string;
    nome: string;
    sigla?: string;
  };
  cargo?: {
    id: string;
    nome: string;
    sigla?: string;
  };
  servidor?: {
    id: string;
    nome_completo: string;
    matricula?: string;
  };
}

// View de situação completa
export interface ServidorSituacao {
  id: string;
  nome_completo: string;
  cpf: string;
  matricula?: string;
  tipo_servidor?: TipoServidor;
  situacao: string;
  foto_url?: string;
  email_institucional?: string;
  telefone_celular?: string;
  
  // Vínculo
  vinculo_id?: string;
  tipo_vinculo?: TipoVinculoFuncional;
  vinculo_inicio?: string;
  vinculo_orgao_origem?: string;
  vinculo_orgao_destino?: string;
  
  // Provimento
  provimento_id?: string;
  cargo_id?: string;
  cargo_nome?: string;
  cargo_sigla?: string;
  cargo_natureza?: NaturezaCargo;
  data_nomeacao?: string;
  data_posse?: string;
  provimento_status?: StatusProvimento;
  
  // Lotação
  lotacao_id?: string;
  unidade_id?: string;
  unidade_nome?: string;
  unidade_sigla?: string;
  tipo_lotacao?: TipoLotacao;
  lotacao_inicio?: string;
  lotacao_funcao?: string;
  
  // Cessão
  cessao_id?: string;
  cessao_tipo?: 'entrada' | 'saida';
  cessao_orgao_origem?: string;
  cessao_orgao_destino?: string;
  cessao_inicio?: string;
  cessao_onus?: string;
}

// Regras de negócio por tipo de servidor
export const REGRAS_TIPO_SERVIDOR: Record<TipoServidor, {
  permiteCargo: boolean;
  tiposCargo: NaturezaCargo[];
  permiteLotacaoInterna: boolean;
  permiteLotacaoExterna: boolean;
  requereProvimento: boolean;
  requereOrgaoOrigem: boolean;
  requereOrgaoDestino: boolean;
  descricao: string;
}> = {
  efetivo_idjuv: {
    permiteCargo: true,
    tiposCargo: ['efetivo'],
    permiteLotacaoInterna: true,
    permiteLotacaoExterna: false,
    requereProvimento: true,
    requereOrgaoOrigem: false,
    requereOrgaoDestino: false,
    descricao: 'Servidor efetivo do quadro permanente do IDJuv',
  },
  comissionado_idjuv: {
    permiteCargo: true,
    tiposCargo: ['comissionado'],
    permiteLotacaoInterna: true,
    permiteLotacaoExterna: false,
    requereProvimento: true,
    requereOrgaoOrigem: false,
    requereOrgaoDestino: false,
    descricao: 'Servidor comissionado do IDJuv',
  },
  cedido_entrada: {
    permiteCargo: false,
    tiposCargo: [],
    permiteLotacaoInterna: true,
    permiteLotacaoExterna: false,
    requereProvimento: false,
    requereOrgaoOrigem: true,
    requereOrgaoDestino: false,
    descricao: 'Servidor cedido de outro órgão para o IDJuv',
  },
  cedido_saida: {
    permiteCargo: true, // Mantém cargo efetivo
    tiposCargo: ['efetivo'],
    permiteLotacaoInterna: false,
    permiteLotacaoExterna: true,
    requereProvimento: false, // Provimento existente fica suspenso
    requereOrgaoOrigem: false,
    requereOrgaoDestino: true,
    descricao: 'Servidor efetivo do IDJuv cedido para outro órgão',
  },
};

// Tipos de atos
export const TIPOS_ATO = [
  { value: 'portaria', label: 'Portaria' },
  { value: 'decreto', label: 'Decreto' },
  { value: 'lei', label: 'Lei' },
  { value: 'resolucao', label: 'Resolução' },
];

// Tipos de ônus
export const TIPOS_ONUS = [
  { value: 'origem', label: 'Ônus do Órgão de Origem' },
  { value: 'destino', label: 'Ônus do Órgão de Destino' },
  { value: 'compartilhado', label: 'Ônus Compartilhado' },
];

// Motivos de encerramento do provimento
export const MOTIVOS_ENCERRAMENTO = [
  { value: 'exoneracao', label: 'Exoneração' },
  { value: 'termino_mandato', label: 'Término de Mandato' },
  { value: 'cessao_comissionado', label: 'Cessão (Comissionado)' },
  { value: 'aposentadoria', label: 'Aposentadoria' },
  { value: 'falecimento', label: 'Falecimento' },
  { value: 'demissao', label: 'Demissão' },
];

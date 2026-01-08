// ============================================
// TIPOS DO SISTEMA DE RH
// ============================================

// Re-exportar tipos de servidor
export * from './servidor';

// Enums (mantidos para compatibilidade)
export type VinculoFuncional = 
  | 'efetivo'
  | 'comissionado'
  | 'cedido'
  | 'temporario'
  | 'estagiario'
  | 'requisitado';

export type SituacaoFuncional = 
  | 'ativo'
  | 'afastado'
  | 'cedido'
  | 'licenca'
  | 'ferias'
  | 'exonerado'
  | 'aposentado'
  | 'falecido';

export type TipoMovimentacaoFuncional = 
  | 'nomeacao'
  | 'exoneracao'
  | 'designacao'
  | 'dispensa'
  | 'promocao'
  | 'transferencia'
  | 'cessao'
  | 'requisicao'
  | 'redistribuicao'
  | 'remocao'
  | 'afastamento'
  | 'retorno'
  | 'aposentadoria'
  | 'vacancia';

export type TipoPortariaRH = 
  | 'nomeacao'
  | 'exoneracao'
  | 'designacao'
  | 'dispensa'
  | 'ferias'
  | 'viagem'
  | 'cessao'
  | 'afastamento'
  | 'substituicao'
  | 'gratificacao'
  | 'comissao'
  | 'outro';

export type TipoLicenca = 
  | 'maternidade'
  | 'paternidade'
  | 'medica'
  | 'casamento'
  | 'luto'
  | 'interesse_particular'
  | 'capacitacao'
  | 'premio'
  | 'mandato_eletivo'
  | 'mandato_classista'
  | 'outra';

export type TipoAfastamento = 
  | 'licenca'
  | 'suspensao'
  | 'cessao'
  | 'disposicao'
  | 'servico_externo'
  | 'missao'
  | 'outro';

// Labels para exibição
export const VINCULO_LABELS: Record<VinculoFuncional, string> = {
  efetivo: 'Efetivo',
  comissionado: 'Comissionado',
  cedido: 'Cedido',
  temporario: 'Temporário',
  estagiario: 'Estagiário',
  requisitado: 'Requisitado',
};

export const SITUACAO_LABELS: Record<SituacaoFuncional, string> = {
  ativo: 'Ativo',
  afastado: 'Afastado',
  cedido: 'Cedido',
  licenca: 'Licença',
  ferias: 'Férias',
  exonerado: 'Exonerado',
  aposentado: 'Aposentado',
  falecido: 'Falecido',
};

export const SITUACAO_COLORS: Record<SituacaoFuncional, string> = {
  ativo: 'bg-success/20 text-success border-success/30',
  afastado: 'bg-warning/20 text-warning border-warning/30',
  cedido: 'bg-info/20 text-info border-info/30',
  licenca: 'bg-warning/20 text-warning border-warning/30',
  ferias: 'bg-primary/20 text-primary border-primary/30',
  exonerado: 'bg-destructive/20 text-destructive border-destructive/30',
  aposentado: 'bg-muted text-muted-foreground border-muted',
  falecido: 'bg-muted text-muted-foreground border-muted',
};

export const MOVIMENTACAO_LABELS: Record<TipoMovimentacaoFuncional, string> = {
  nomeacao: 'Nomeação',
  exoneracao: 'Exoneração',
  designacao: 'Designação',
  dispensa: 'Dispensa',
  promocao: 'Promoção',
  transferencia: 'Transferência',
  cessao: 'Cessão',
  requisicao: 'Requisição',
  redistribuicao: 'Redistribuição',
  remocao: 'Remoção',
  afastamento: 'Afastamento',
  retorno: 'Retorno',
  aposentadoria: 'Aposentadoria',
  vacancia: 'Vacância',
};

export const PORTARIA_TIPO_LABELS: Record<TipoPortariaRH, string> = {
  nomeacao: 'Nomeação',
  exoneracao: 'Exoneração',
  designacao: 'Designação',
  dispensa: 'Dispensa',
  ferias: 'Férias',
  viagem: 'Viagem/Diária',
  cessao: 'Cessão',
  afastamento: 'Afastamento',
  substituicao: 'Substituição',
  gratificacao: 'Gratificação',
  comissao: 'Comissão',
  outro: 'Outro',
};

export const LICENCA_LABELS: Record<TipoLicenca, string> = {
  maternidade: 'Licença Maternidade',
  paternidade: 'Licença Paternidade',
  medica: 'Licença Médica',
  casamento: 'Licença Casamento',
  luto: 'Licença Luto',
  interesse_particular: 'Licença para Interesse Particular',
  capacitacao: 'Licença Capacitação',
  premio: 'Licença Prêmio',
  mandato_eletivo: 'Mandato Eletivo',
  mandato_classista: 'Mandato Classista',
  outra: 'Outra',
};

export const AFASTAMENTO_LABELS: Record<TipoAfastamento, string> = {
  licenca: 'Licença',
  suspensao: 'Suspensão',
  cessao: 'Cessão',
  disposicao: 'À Disposição',
  servico_externo: 'Serviço Externo',
  missao: 'Missão',
  outro: 'Outro',
};

// Interfaces
export interface Dependente {
  nome: string;
  parentesco: string;
  data_nascimento?: string;
  cpf?: string;
}

export interface Servidor {
  id: string;
  user_id?: string;
  
  // Dados pessoais
  nome_completo: string;
  nome_social?: string;
  data_nascimento?: string;
  sexo?: 'M' | 'F' | 'O';
  estado_civil?: string;
  nacionalidade?: string;
  naturalidade_cidade?: string;
  naturalidade_uf?: string;
  
  // Documentos
  cpf: string;
  rg?: string;
  rg_orgao_expedidor?: string;
  rg_uf?: string;
  rg_data_emissao?: string;
  titulo_eleitor?: string;
  titulo_zona?: string;
  titulo_secao?: string;
  pis_pasep?: string;
  ctps_numero?: string;
  ctps_serie?: string;
  ctps_uf?: string;
  cnh_numero?: string;
  cnh_categoria?: string;
  cnh_validade?: string;
  certificado_reservista?: string;
  
  // Contato
  email_pessoal?: string;
  email_institucional?: string;
  telefone_fixo?: string;
  telefone_celular?: string;
  telefone_emergencia?: string;
  contato_emergencia_nome?: string;
  contato_emergencia_parentesco?: string;
  
  // Endereço
  endereco_logradouro?: string;
  endereco_numero?: string;
  endereco_complemento?: string;
  endereco_bairro?: string;
  endereco_cidade?: string;
  endereco_uf?: string;
  endereco_cep?: string;
  
  // Dados bancários
  banco_codigo?: string;
  banco_nome?: string;
  banco_agencia?: string;
  banco_conta?: string;
  banco_tipo_conta?: string;
  
  // Dados funcionais
  matricula?: string;
  vinculo: VinculoFuncional;
  situacao: SituacaoFuncional;
  cargo_atual_id?: string;
  unidade_atual_id?: string;
  data_admissao?: string;
  data_posse?: string;
  data_exercicio?: string;
  data_desligamento?: string;
  carga_horaria?: number;
  regime_juridico?: string;
  
  // Remuneração
  remuneracao_bruta?: number;
  gratificacoes?: number;
  descontos?: number;
  
  // Escolaridade
  escolaridade?: string;
  formacao_academica?: string;
  instituicao_ensino?: string;
  ano_conclusao?: number;
  cursos_especializacao?: string[];
  
  // Dependentes
  dependentes?: Dependente[];
  
  // Declarações
  declaracao_bens_url?: string;
  declaracao_bens_data?: string;
  declaracao_acumulacao_url?: string;
  declaracao_acumulacao_data?: string;
  acumula_cargo?: boolean;
  acumulo_descricao?: string;
  
  // Outros
  observacoes?: string;
  foto_url?: string;
  ativo?: boolean;
  
  // Metadados
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  
  // Joins
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
}

export interface HistoricoFuncional {
  id: string;
  servidor_id: string;
  tipo: TipoMovimentacaoFuncional;
  data_evento: string;
  data_vigencia_inicio?: string;
  data_vigencia_fim?: string;
  
  cargo_anterior_id?: string;
  cargo_novo_id?: string;
  unidade_anterior_id?: string;
  unidade_nova_id?: string;
  
  portaria_numero?: string;
  portaria_data?: string;
  documento_url?: string;
  diario_oficial_numero?: string;
  diario_oficial_data?: string;
  
  descricao?: string;
  fundamentacao_legal?: string;
  observacoes?: string;
  
  created_at?: string;
  created_by?: string;
  
  // Joins
  cargo_anterior?: { id: string; nome: string };
  cargo_novo?: { id: string; nome: string };
  unidade_anterior?: { id: string; nome: string; sigla?: string };
  unidade_nova?: { id: string; nome: string; sigla?: string };
}

export interface PortariaServidor {
  id: string;
  servidor_id: string;
  numero: string;
  ano: number;
  data_publicacao: string;
  tipo: TipoPortariaRH;
  assunto: string;
  ementa?: string;
  conteudo?: string;
  data_vigencia_inicio?: string;
  data_vigencia_fim?: string;
  documento_url?: string;
  diario_oficial_numero?: string;
  diario_oficial_data?: string;
  historico_id?: string;
  status?: 'vigente' | 'revogada' | 'substituida';
  portaria_revogadora_id?: string;
  observacoes?: string;
  created_at?: string;
  created_by?: string;
}

export interface ViagemDiaria {
  id: string;
  servidor_id: string;
  data_saida: string;
  data_retorno: string;
  destino_cidade: string;
  destino_uf: string;
  destino_pais?: string;
  finalidade: string;
  justificativa?: string;
  portaria_numero?: string;
  portaria_data?: string;
  portaria_url?: string;
  quantidade_diarias?: number;
  valor_diaria?: number;
  valor_total?: number;
  meio_transporte?: string;
  veiculo_oficial?: boolean;
  passagem_aerea?: boolean;
  relatorio_apresentado?: boolean;
  relatorio_data?: string;
  relatorio_url?: string;
  status?: 'solicitada' | 'autorizada' | 'em_andamento' | 'concluida' | 'cancelada';
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface FeriasServidor {
  id: string;
  servidor_id: string;
  periodo_aquisitivo_inicio: string;
  periodo_aquisitivo_fim: string;
  data_inicio: string;
  data_fim: string;
  dias_gozados: number;
  abono_pecuniario?: boolean;
  dias_abono?: number;
  parcela?: number;
  total_parcelas?: number;
  portaria_numero?: string;
  portaria_data?: string;
  portaria_url?: string;
  status?: 'programada' | 'em_gozo' | 'concluida' | 'interrompida' | 'cancelada';
  observacoes?: string;
  created_at?: string;
  created_by?: string;
}

export interface LicencaAfastamento {
  id: string;
  servidor_id: string;
  tipo_afastamento: TipoAfastamento;
  tipo_licenca?: TipoLicenca;
  data_inicio: string;
  data_fim?: string;
  dias_afastamento?: number;
  portaria_numero?: string;
  portaria_data?: string;
  portaria_url?: string;
  documento_comprobatorio_url?: string;
  cid?: string;
  medico_nome?: string;
  crm?: string;
  orgao_destino?: string;
  onus_origem?: boolean;
  status?: 'ativa' | 'encerrada' | 'prorrogada' | 'cancelada';
  fundamentacao_legal?: string;
  observacoes?: string;
  created_at?: string;
  created_by?: string;
}

export interface OcorrenciaServidor {
  id: string;
  servidor_id: string;
  tipo: string;
  data_ocorrencia: string;
  descricao: string;
  documento_url?: string;
  created_at?: string;
  created_by?: string;
}

// Estados brasileiros
export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export const ESTADOS_CIVIS = [
  'Solteiro(a)',
  'Casado(a)',
  'Divorciado(a)',
  'Viúvo(a)',
  'União Estável',
  'Separado(a)',
];

export const ESCOLARIDADES = [
  'Ensino Fundamental Incompleto',
  'Ensino Fundamental Completo',
  'Ensino Médio Incompleto',
  'Ensino Médio Completo',
  'Ensino Superior Incompleto',
  'Ensino Superior Completo',
  'Pós-Graduação',
  'Mestrado',
  'Doutorado',
];

export const BANCOS = [
  { codigo: '001', nome: 'Banco do Brasil' },
  { codigo: '104', nome: 'Caixa Econômica Federal' },
  { codigo: '033', nome: 'Santander' },
  { codigo: '341', nome: 'Itaú Unibanco' },
  { codigo: '237', nome: 'Bradesco' },
  { codigo: '756', nome: 'Sicoob' },
  { codigo: '748', nome: 'Sicredi' },
  { codigo: '077', nome: 'Inter' },
  { codigo: '260', nome: 'Nubank' },
  { codigo: '336', nome: 'C6 Bank' },
];

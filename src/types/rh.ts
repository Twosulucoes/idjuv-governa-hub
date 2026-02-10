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

// ============================================
// TIPOS DE VÍNCULO EXTERNO (Segundo Vínculo)
// ============================================

export type VinculoExternoEsfera = 
  | 'federal'
  | 'estadual_rr'
  | 'estadual_outro'
  | 'municipal';

export type VinculoExternoSituacao = 
  | 'ativo'
  | 'licenciado'
  | 'cedido'
  | 'afastado';

export type VinculoExternoForma = 
  | 'informal'
  | 'cessao'
  | 'requisicao'
  | 'licenca';

export const VINCULO_EXTERNO_ESFERA_LABELS: Record<VinculoExternoEsfera, string> = {
  federal: 'Federal (União)',
  estadual_rr: 'Estadual (Roraima)',
  estadual_outro: 'Estadual (Outro Estado)',
  municipal: 'Municipal',
};

export const VINCULO_EXTERNO_SITUACAO_LABELS: Record<VinculoExternoSituacao, string> = {
  ativo: 'Ativo no Órgão de Origem',
  licenciado: 'Licenciado',
  cedido: 'Cedido',
  afastado: 'Afastado',
};

export const VINCULO_EXTERNO_FORMA_LABELS: Record<VinculoExternoForma, string> = {
  informal: 'Informal (sem ato formal)',
  cessao: 'Cessão Formal',
  requisicao: 'Requisição',
  licenca: 'Licença para Exercício em Outro Órgão',
};

// Constantes para Ficha SEGAD
export const RACAS_CORES = [
  'Branca',
  'Preta',
  'Parda',
  'Amarela',
  'Indígena',
  'Não declarada',
];

export const TIPOS_PCD = [
  'Física',
  'Auditiva',
  'Visual',
  'Intelectual',
  'Múltipla',
  'Outra',
];

export const TIPOS_SANGUINEOS = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Não sei'
];

export const CATEGORIAS_RESERVA = [
  '1ª Categoria',
  '2ª Categoria', 
  '3ª Categoria',
];

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
  raca_cor?: string;
  pcd?: boolean;
  pcd_tipo?: string;
  nome_mae?: string;
  nome_pai?: string;
  tipo_sanguineo?: string;
  
  // Documentos
  cpf: string;
  rg?: string;
  rg_orgao_expedidor?: string;
  rg_uf?: string;
  rg_data_emissao?: string;
  titulo_eleitor?: string;
  titulo_zona?: string;
  titulo_secao?: string;
  titulo_cidade_votacao?: string;
  titulo_uf_votacao?: string;
  titulo_data_emissao?: string;
  pis_pasep?: string;
  ctps_numero?: string;
  ctps_serie?: string;
  ctps_uf?: string;
  ctps_data_emissao?: string;
  cnh_numero?: string;
  cnh_categoria?: string;
  cnh_validade?: string;
  cnh_data_expedicao?: string;
  cnh_primeira_habilitacao?: string;
  cnh_uf?: string;
  certificado_reservista?: string;
  reservista_orgao?: string;
  reservista_data_emissao?: string;
  reservista_categoria?: string;
  reservista_ano?: number;
  
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
  situacao: SituacaoFuncional;
  data_admissao?: string;
  data_posse?: string;
  data_exercicio?: string;
  data_desligamento?: string;
  carga_horaria?: number;
  regime_juridico?: string;
  tipo_servidor?: string;
  vinculo?: string;
  orgao_origem?: string;
  funcao_exercida?: string;
  
  // Primeiro Emprego
  ano_inicio_primeiro_emprego?: number;
  ano_fim_primeiro_emprego?: number;
  
  // Moléstia Grave
  molestia_grave?: boolean;
  
  // Estrangeiro
  estrangeiro_data_chegada?: string;
  estrangeiro_data_limite_permanencia?: string;
  estrangeiro_registro_nacional?: string;
  estrangeiro_ano_chegada?: number;
  
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

// ============================================
// CÓDIGOS SEGAD - Mapeamento para Ficha Cadastral
// ============================================

export const SEGAD_ESTADO_CIVIL: Record<string, string> = {
  'solteiro(a)': '1-SOLTEIRO(A)',
  'solteiro': '1-SOLTEIRO(A)',
  'casado(a)': '2-CASADO(A)',
  'casado': '2-CASADO(A)',
  'divorciado(a)': '3-DIVORCIADO(A)',
  'divorciado': '3-DIVORCIADO(A)',
  'viúvo(a)': '4-VIÚVO(A)',
  'viuvo(a)': '4-VIÚVO(A)',
  'viuvo': '4-VIÚVO(A)',
  'união estável': '5-UNIÃO ESTÁVEL',
  'uniao estavel': '5-UNIÃO ESTÁVEL',
  'separado(a)': '6-SEPARADO(A)',
  'separado': '6-SEPARADO(A)',
};

export const SEGAD_TIPO_PCD: Record<string, string> = {
  'não deficiente': '99-NÃO DEFICIENTE',
  'nao deficiente': '99-NÃO DEFICIENTE',
  '': '99-NÃO DEFICIENTE',
  'física': '01-FÍSICA',
  'fisica': '01-FÍSICA',
  'auditiva': '02-AUDITIVA',
  'visual': '03-VISUAL',
  'intelectual': '04-INTELECTUAL',
  'múltipla': '05-MÚLTIPLA',
  'multipla': '05-MÚLTIPLA',
  'outra': '06-OUTRA',
};

export const SEGAD_RACA_COR: Record<string, string> = {
  'branca': '1-BRANCA',
  'preta': '2-PRETA',
  'parda': '3-PARDA',
  'amarela': '4-AMARELA',
  'indígena': '5-INDÍGENA',
  'indigena': '5-INDÍGENA',
  'não declarada': '6-NÃO DECLARADA',
  'nao declarada': '6-NÃO DECLARADA',
};

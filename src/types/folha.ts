// Tipos para o módulo de Folha de Pagamento - Alinhados com o banco de dados

export type TipoRubrica = 'provento' | 'desconto' | 'encargo' | 'informativo';
export type TipoCalculoRubrica = 'fixo' | 'percentual' | 'formula' | 'referencia' | 'manual' | 'tabela';
export type StatusFolha = 'previa' | 'aberta' | 'processando' | 'fechada' | 'reaberta';

export interface Rubrica {
  id: string;
  codigo: string;
  descricao: string;
  tipo: TipoRubrica;
  tipo_calculo?: TipoCalculoRubrica;
  percentual?: number;
  valor_fixo?: number;
  incidencia_irrf?: boolean;
  incidencia_inss?: boolean;
  incidencia_fgts?: boolean;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ParametroFolha {
  id: string;
  tipo_parametro: string;
  valor: number;
  descricao?: string;
  vigencia_inicio: string;
  vigencia_fim?: string;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FaixaINSS {
  id: string;
  valor_minimo: number;
  valor_maximo: number;
  aliquota: number;
  faixa_ordem: number;
  vigencia_inicio: string;
  vigencia_fim?: string;
  created_at?: string;
}

export interface FaixaIRRF {
  id: string;
  valor_minimo: number;
  valor_maximo: number;
  aliquota: number;
  parcela_deduzir: number;
  faixa_ordem: number;
  vigencia_inicio: string;
  vigencia_fim?: string;
  created_at?: string;
}

export interface BancoCNAB {
  id: string;
  codigo_banco: string;
  nome: string;
  nome_reduzido?: string;
  layout_cnab240?: boolean;
  layout_cnab400?: boolean;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ContaAutarquia {
  id: string;
  banco_id?: string;
  banco?: Partial<BancoCNAB>;
  descricao: string;
  agencia: string;
  agencia_digito?: string;
  conta: string;
  conta_digito?: string;
  tipo_conta?: string;
  uso_principal?: string;
  convenio_pagamento?: string;
  codigo_cedente?: string;
  codigo_transmissao?: string;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FolhaPagamento {
  id: string;
  competencia_ano: number;
  competencia_mes: number;
  status: StatusFolha;
  data_processamento?: string;
  data_fechamento?: string;
  total_bruto?: number;
  total_descontos?: number;
  total_liquido?: number;
  quantidade_fichas?: number;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FichaFinanceira {
  id: string;
  folha_id: string;
  servidor_id: string;
  servidor?: {
    nome_completo: string;
    matricula: string;
  };
  total_proventos?: number;
  total_descontos?: number;
  valor_liquido?: number;
  base_inss?: number;
  valor_inss?: number;
  base_irrf?: number;
  valor_irrf?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Consignacao {
  id: string;
  servidor_id?: string;
  servidor?: {
    nome_completo: string;
    matricula: string;
  };
  consignataria_nome: string;
  consignataria_codigo?: string;
  consignataria_cnpj?: string;
  numero_contrato?: string;
  tipo_consignacao?: string;
  valor_total?: number;
  valor_parcela: number;
  total_parcelas: number;
  parcelas_pagas?: number;
  saldo_devedor?: number;
  data_inicio: string;
  data_fim?: string;
  rubrica_id?: string;
  ativo?: boolean;
  suspenso?: boolean;
  quitado?: boolean;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DependenteIRRF {
  id: string;
  servidor_id?: string;
  nome: string;
  tipo_dependente: string;
  data_nascimento: string;
  cpf?: string;
  data_inicio_deducao: string;
  data_fim_deducao?: string;
  deduz_irrf?: boolean;
  ativo?: boolean;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ConfigAutarquia {
  id: string;
  razao_social: string;
  nome_fantasia?: string;
  cnpj: string;
  natureza_juridica?: string;
  codigo_municipio?: string;
  endereco_logradouro?: string;
  endereco_numero?: string;
  endereco_complemento?: string;
  endereco_bairro?: string;
  endereco_cidade?: string;
  endereco_uf?: string;
  endereco_cep?: string;
  telefone?: string;
  email_institucional?: string;
  site?: string;
  responsavel_legal?: string;
  cpf_responsavel?: string;
  cargo_responsavel?: string;
  responsavel_contabil?: string;
  cpf_contabil?: string;
  crc_contabil?: string;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Labels para exibição
export const TIPO_RUBRICA_LABELS: Record<TipoRubrica, string> = {
  provento: 'Provento',
  desconto: 'Desconto',
  encargo: 'Encargo',
  informativo: 'Informativo',
};

export const STATUS_FOLHA_LABELS: Record<StatusFolha, string> = {
  previa: 'Prévia',
  aberta: 'Aberta',
  processando: 'Processando',
  fechada: 'Fechada',
  reaberta: 'Reaberta',
};

export const STATUS_FOLHA_COLORS: Record<StatusFolha, string> = {
  previa: 'bg-gray-100 text-gray-800',
  aberta: 'bg-blue-100 text-blue-800',
  processando: 'bg-yellow-100 text-yellow-800',
  fechada: 'bg-green-100 text-green-800',
  reaberta: 'bg-purple-100 text-purple-800',
};

export const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

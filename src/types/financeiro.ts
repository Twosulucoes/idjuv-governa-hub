// ============================================
// TIPOS DO MÓDULO FINANCEIRO - AUTARQUIA IDJuv
// ============================================

// ===========================================
// ENUMS
// ===========================================

export type StatusWorkflowFinanceiro = 
  | 'rascunho'
  | 'pendente_analise'
  | 'em_analise'
  | 'aprovado'
  | 'rejeitado'
  | 'cancelado'
  | 'executado'
  | 'estornado';

export type TipoAlteracaoOrcamentaria = 
  | 'suplementacao'
  | 'reducao'
  | 'remanejamento'
  | 'transposicao'
  | 'transferencia'
  | 'credito_especial'
  | 'credito_extraordinario';

export type StatusEmpenho = 
  | 'emitido'
  | 'parcialmente_liquidado'
  | 'liquidado'
  | 'parcialmente_pago'
  | 'pago'
  | 'anulado';

export type TipoEmpenho = 'ordinario' | 'estimativo' | 'global';

export type StatusLiquidacao = 
  | 'pendente'
  | 'atestada'
  | 'aprovada'
  | 'rejeitada'
  | 'cancelada';

export type StatusPagamento = 
  | 'programado'
  | 'autorizado'
  | 'pago'
  | 'devolvido'
  | 'estornado'
  | 'cancelado';

export type TipoReceita = 
  | 'repasse_tesouro'
  | 'convenio'
  | 'doacao'
  | 'restituicao'
  | 'rendimento_aplicacao'
  | 'taxa_servico'
  | 'multa'
  | 'outros';

export type StatusAdiantamento = 
  | 'solicitado'
  | 'autorizado'
  | 'liberado'
  | 'em_uso'
  | 'prestacao_pendente'
  | 'prestado'
  | 'aprovado'
  | 'rejeitado'
  | 'bloqueado';

export type TipoContaBancaria = 'corrente' | 'poupanca' | 'aplicacao' | 'vinculada';

export type StatusConciliacao = 'pendente' | 'conciliado' | 'divergente' | 'justificado';

export type NaturezaConta = 
  | 'ativo'
  | 'passivo'
  | 'patrimonio_liquido'
  | 'receita'
  | 'despesa'
  | 'resultado';

// ===========================================
// CADASTROS BASE
// ===========================================

export interface PlanoContas {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string | null;
  natureza: NaturezaConta;
  nivel: number;
  conta_pai_id?: string | null;
  aceita_lancamento: boolean;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

export interface FonteRecurso {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string | null;
  origem?: string | null;
  detalhamento_fonte?: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface NaturezaDespesa {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string | null;
  categoria_economica?: string | null;
  grupo_natureza?: string | null;
  modalidade_aplicacao?: string | null;
  elemento?: string | null;
  subelemento?: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProgramaOrcamentario {
  id: string;
  codigo: string;
  nome: string;
  objetivo?: string | null;
  exercicio: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface AcaoOrcamentaria {
  id: string;
  programa_id: string;
  codigo: string;
  nome: string;
  tipo: string;
  descricao?: string | null;
  produto?: string | null;
  unidade_medida?: string | null;
  meta_fisica?: number | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  programa?: ProgramaOrcamentario;
}

// ===========================================
// ORÇAMENTO
// ===========================================

export interface Dotacao {
  id: string;
  exercicio: number;
  unidade_orcamentaria_id?: string | null;
  programa_id?: string | null;
  acao_id?: string | null;
  natureza_despesa_id?: string | null;
  fonte_recurso_id?: string | null;
  codigo_dotacao: string;
  paoe?: string | null;
  regional?: string | null;
  cod_acompanhamento?: string | null;
  idu?: string | null;
  tro?: string | null;
  valor_inicial: number;
  valor_suplementado: number;
  valor_reduzido: number;
  valor_atual: number;
  valor_bloqueado: number;
  valor_reserva: number;
  valor_ped: number;
  valor_empenhado: number;
  valor_liquidado: number;
  valor_em_liquidacao: number;
  valor_pago: number;
  saldo_disponivel: number;
  valor_restos_pagar: number;
  bloqueado: boolean;
  motivo_bloqueio?: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  // Joins
  unidade?: { id: string; nome: string; sigla: string };
  programa?: ProgramaOrcamentario;
  acao?: AcaoOrcamentaria;
  natureza_despesa?: NaturezaDespesa;
  fonte_recurso?: FonteRecurso;
}

export interface AlteracaoOrcamentaria {
  id: string;
  numero: string;
  exercicio: number;
  tipo: TipoAlteracaoOrcamentaria;
  data_alteracao: string;
  dotacao_origem_id?: string | null;
  dotacao_destino_id?: string | null;
  valor: number;
  justificativa: string;
  fundamentacao_legal?: string | null;
  status: StatusWorkflowFinanceiro;
  aprovado_por?: string | null;
  aprovado_em?: string | null;
  observacoes?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

// ===========================================
// CONTAS BANCÁRIAS
// ===========================================

export interface ContaBancaria {
  id: string;
  banco_codigo: string;
  banco_nome: string;
  agencia: string;
  agencia_digito?: string | null;
  conta: string;
  conta_digito?: string | null;
  tipo: TipoContaBancaria;
  nome_conta: string;
  finalidade?: string | null;
  fonte_recurso_id?: string | null;
  saldo_atual: number;
  data_ultimo_saldo?: string | null;
  responsavel_id?: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  // Joins
  fonte_recurso?: FonteRecurso;
  responsavel?: { id: string; nome_completo: string };
}

// ===========================================
// SOLICITAÇÕES DE DESPESA
// ===========================================

export interface SolicitacaoDespesa {
  id: string;
  numero: string;
  exercicio: number;
  data_solicitacao: string;
  unidade_solicitante_id: string;
  servidor_solicitante_id?: string | null;
  tipo_despesa: string;
  objeto: string;
  justificativa: string;
  valor_estimado: number;
  dotacao_sugerida_id?: string | null;
  fornecedor_id?: string | null;
  contrato_id?: string | null;
  processo_licitatorio_id?: string | null;
  status: StatusWorkflowFinanceiro;
  prioridade: string;
  prazo_execucao?: string | null;
  parecer_ci?: string | null;
  ci_aprovado_por?: string | null;
  ci_aprovado_em?: string | null;
  ressalvas_ci?: string | null;
  autorizado_por?: string | null;
  autorizado_em?: string | null;
  motivo_rejeicao?: string | null;
  observacoes?: string | null;
  historico_status: StatusHistorico[];
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  // Joins
  unidade_solicitante?: { id: string; nome: string; sigla: string };
  servidor_solicitante?: { id: string; nome_completo: string };
  dotacao_sugerida?: Dotacao;
  fornecedor?: { id: string; razao_social: string };
  itens?: SolicitacaoItem[];
}

export interface SolicitacaoItem {
  id: string;
  solicitacao_id: string;
  item_numero: number;
  descricao: string;
  unidade?: string | null;
  quantidade: number;
  valor_unitario_estimado?: number | null;
  valor_total_estimado: number; // computed
  observacoes?: string | null;
  created_at: string;
}

export interface StatusHistorico {
  status_anterior: string;
  status_novo: string;
  data: string;
  usuario_id?: string;
}

// ===========================================
// EMPENHOS
// ===========================================

export interface Empenho {
  id: string;
  numero: string;
  exercicio: number;
  data_empenho: string;
  solicitacao_id?: string | null;
  dotacao_id: string;
  fornecedor_id: string;
  contrato_id?: string | null;
  tipo: TipoEmpenho;
  natureza_despesa_id?: string | null;
  fonte_recurso_id?: string | null;
  valor_empenhado: number;
  valor_liquidado: number;
  valor_pago: number;
  valor_anulado: number;
  saldo_liquidar: number; // computed
  saldo_pagar: number; // computed
  objeto: string;
  processo_sei?: string | null;
  status: StatusEmpenho;
  emitido_por?: string | null;
  inscrito_rp: boolean;
  data_inscricao_rp?: string | null;
  tipo_rp?: string | null;
  observacoes?: string | null;
  historico_status: StatusHistorico[];
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  // Joins
  dotacao?: Dotacao;
  fornecedor?: { id: string; razao_social: string; cnpj_cpf: string };
  contrato?: { id: string; numero: string };
  natureza_despesa?: NaturezaDespesa;
  fonte_recurso?: FonteRecurso;
  liquidacoes?: Liquidacao[];
}

// ===========================================
// LIQUIDAÇÕES
// ===========================================

export interface Liquidacao {
  id: string;
  numero: string;
  exercicio: number;
  data_liquidacao: string;
  empenho_id: string;
  tipo_documento: string;
  numero_documento: string;
  serie_documento?: string | null;
  data_documento: string;
  chave_nfe?: string | null;
  valor_documento: number;
  valor_liquidado: number;
  valor_retencoes: number;
  valor_liquido: number; // computed
  retencao_inss: number;
  retencao_irrf: number;
  retencao_iss: number;
  outras_retencoes: number;
  atestado_por?: string | null;
  atestado_em?: string | null;
  cargo_atestante?: string | null;
  status: StatusLiquidacao;
  aprovado_por?: string | null;
  aprovado_em?: string | null;
  motivo_rejeicao?: string | null;
  observacoes?: string | null;
  historico_status: StatusHistorico[];
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  // Joins
  empenho?: Empenho;
  pagamentos?: Pagamento[];
}

// ===========================================
// PAGAMENTOS
// ===========================================

export interface Pagamento {
  id: string;
  numero: string;
  exercicio: number;
  data_pagamento: string;
  liquidacao_id: string;
  empenho_id: string;
  conta_bancaria_id: string;
  fornecedor_id?: string | null;
  banco_favorecido?: string | null;
  agencia_favorecido?: string | null;
  conta_favorecido?: string | null;
  tipo_conta_favorecido?: string | null;
  valor_bruto: number;
  valor_retencoes: number;
  valor_liquido: number; // computed
  forma_pagamento: string;
  identificador_transacao?: string | null;
  data_efetivacao?: string | null;
  status: StatusPagamento;
  autorizado_por?: string | null;
  autorizado_em?: string | null;
  executado_por?: string | null;
  executado_em?: string | null;
  estornado: boolean;
  data_estorno?: string | null;
  motivo_estorno?: string | null;
  estornado_por?: string | null;
  observacoes?: string | null;
  historico_status: StatusHistorico[];
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  // Joins
  liquidacao?: Liquidacao;
  empenho?: Empenho;
  conta_bancaria?: ContaBancaria;
  fornecedor?: { id: string; razao_social: string };
}

// ===========================================
// RECEITAS
// ===========================================

export interface Receita {
  id: string;
  numero: string;
  exercicio: number;
  data_receita: string;
  tipo: TipoReceita;
  fonte_recurso_id?: string | null;
  conta_bancaria_id?: string | null;
  origem_descricao: string;
  documento_origem?: string | null;
  entidade_pagadora?: string | null;
  cnpj_cpf_pagador?: string | null;
  valor: number;
  convenio_id?: string | null;
  conciliado: boolean;
  conciliacao_id?: string | null;
  observacoes?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  // Joins
  fonte_recurso?: FonteRecurso;
  conta_bancaria?: ContaBancaria;
}

// ===========================================
// ADIANTAMENTOS
// ===========================================

export interface Adiantamento {
  id: string;
  numero: string;
  exercicio: number;
  data_solicitacao: string;
  servidor_suprido_id: string;
  unidade_id: string;
  valor_solicitado: number;
  valor_aprovado?: number | null;
  valor_utilizado: number;
  valor_devolvido: number;
  finalidade: string;
  periodo_utilizacao_inicio?: string | null;
  periodo_utilizacao_fim?: string | null;
  prazo_prestacao_contas?: string | null;
  empenho_id?: string | null;
  dotacao_id?: string | null;
  conta_bancaria_id?: string | null;
  conta_suprido_banco?: string | null;
  conta_suprido_agencia?: string | null;
  conta_suprido_numero?: string | null;
  status: StatusAdiantamento;
  autorizado_por?: string | null;
  autorizado_em?: string | null;
  liberado_por?: string | null;
  liberado_em?: string | null;
  data_liberacao?: string | null;
  data_prestacao?: string | null;
  prestacao_aprovada_por?: string | null;
  prestacao_aprovada_em?: string | null;
  parecer_prestacao?: string | null;
  bloqueado: boolean;
  data_bloqueio?: string | null;
  motivo_bloqueio?: string | null;
  observacoes?: string | null;
  historico_status: StatusHistorico[];
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  // Joins
  servidor_suprido?: { id: string; nome_completo: string; cpf: string };
  unidade?: { id: string; nome: string; sigla: string };
  empenho?: Empenho;
  itens?: AdiantamentoItem[];
}

export interface AdiantamentoItem {
  id: string;
  adiantamento_id: string;
  item_numero: number;
  tipo_documento: string;
  numero_documento?: string | null;
  data_documento: string;
  cnpj_cpf_fornecedor?: string | null;
  nome_fornecedor?: string | null;
  descricao: string;
  valor: number;
  valido?: boolean | null;
  motivo_invalido?: string | null;
  validado_por?: string | null;
  validado_em?: string | null;
  documento_id?: string | null;
  created_at: string;
}

// ===========================================
// CONCILIAÇÃO BANCÁRIA
// ===========================================

export interface ExtratoBancario {
  id: string;
  conta_bancaria_id: string;
  mes_referencia: number;
  ano_referencia: number;
  saldo_anterior?: number | null;
  total_creditos: number;
  total_debitos: number;
  saldo_final?: number | null;
  data_importacao: string;
  arquivo_original?: string | null;
  importado_por?: string | null;
  conciliado: boolean;
  conciliado_por?: string | null;
  conciliado_em?: string | null;
  created_at: string;
  // Joins
  conta_bancaria?: ContaBancaria;
  transacoes?: ExtratoTransacao[];
}

export interface ExtratoTransacao {
  id: string;
  extrato_id: string;
  data_transacao: string;
  data_balancete?: string | null;
  tipo: 'C' | 'D';
  valor: number;
  historico?: string | null;
  documento?: string | null;
  numero_sequencial?: number | null;
  status: StatusConciliacao;
  pagamento_id?: string | null;
  receita_id?: string | null;
  justificativa_divergencia?: string | null;
  conciliado_por?: string | null;
  conciliado_em?: string | null;
  created_at: string;
}

// ===========================================
// CONTABILIDADE
// ===========================================

export interface LancamentoContabil {
  id: string;
  numero: string;
  data_lancamento: string;
  data_competencia: string;
  conta_debito_id: string;
  conta_credito_id: string;
  valor: number;
  tipo_origem: string;
  origem_id?: string | null;
  historico: string;
  complemento?: string | null;
  exercicio: number;
  mes_referencia: number;
  fechamento_id?: string | null;
  estornado: boolean;
  lancamento_estorno_id?: string | null;
  created_at: string;
  created_by?: string | null;
  // Joins
  conta_debito?: PlanoContas;
  conta_credito?: PlanoContas;
}

export interface FechamentoMensal {
  id: string;
  exercicio: number;
  mes: number;
  data_fechamento: string;
  total_receitas: number;
  total_despesas: number;
  resultado_mes: number;
  status: 'aberto' | 'fechado' | 'reaberto';
  fechado_por?: string | null;
  fechado_em?: string | null;
  reaberto_por?: string | null;
  reaberto_em?: string | null;
  motivo_reabertura?: string | null;
  observacoes?: string | null;
  created_at: string;
  updated_at: string;
}

// ===========================================
// DOCUMENTOS
// ===========================================

export interface DocumentoFinanceiro {
  id: string;
  entidade_tipo: string;
  entidade_id: string;
  nome_arquivo: string;
  tipo_arquivo?: string | null;
  tamanho_bytes?: number | null;
  storage_path: string;
  hash_arquivo?: string | null;
  categoria: string;
  obrigatorio: boolean;
  numero_documento?: string | null;
  data_documento?: string | null;
  valor_documento?: number | null;
  versao: number;
  documento_anterior_id?: string | null;
  uploaded_by?: string | null;
  uploaded_at: string;
  ip_address?: string | null;
  ativo: boolean;
  excluido_por?: string | null;
  excluido_em?: string | null;
  motivo_exclusao?: string | null;
  created_at: string;
}

// ===========================================
// PARÂMETROS
// ===========================================

export interface ParametroFinanceiro {
  id: string;
  chave: string;
  valor: string;
  tipo: string;
  descricao?: string | null;
  categoria?: string | null;
  editavel: boolean;
  created_at: string;
  updated_at: string;
}

// ===========================================
// DASHBOARD / RESUMOS
// ===========================================

export interface ResumoOrcamentario {
  dotacao_inicial: number;
  suplementacoes: number;
  reducoes: number;
  dotacao_atual: number;
  empenhado: number;
  liquidado: number;
  pago: number;
  saldo_disponivel: number;
  percentual_executado: number;
}

export interface ResumoFinanceiro {
  total_receitas: number;
  total_despesas: number;
  saldo_contas: number;
  adiantamentos_pendentes: number;
  pagamentos_programados: number;
  conciliacao_pendente: number;
}

// ===========================================
// LABELS E CONSTANTES
// ===========================================

export const STATUS_WORKFLOW_LABELS: Record<StatusWorkflowFinanceiro, string> = {
  rascunho: 'Rascunho',
  pendente_analise: 'Pendente de Análise',
  em_analise: 'Em Análise',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
  cancelado: 'Cancelado',
  executado: 'Executado',
  estornado: 'Estornado',
};

export const STATUS_EMPENHO_LABELS: Record<StatusEmpenho, string> = {
  emitido: 'Emitido',
  parcialmente_liquidado: 'Parcialmente Liquidado',
  liquidado: 'Liquidado',
  parcialmente_pago: 'Parcialmente Pago',
  pago: 'Pago',
  anulado: 'Anulado',
};

export const STATUS_PAGAMENTO_LABELS: Record<StatusPagamento, string> = {
  programado: 'Programado',
  autorizado: 'Autorizado',
  pago: 'Pago',
  devolvido: 'Devolvido',
  estornado: 'Estornado',
  cancelado: 'Cancelado',
};

export const STATUS_ADIANTAMENTO_LABELS: Record<StatusAdiantamento, string> = {
  solicitado: 'Solicitado',
  autorizado: 'Autorizado',
  liberado: 'Liberado',
  em_uso: 'Em Uso',
  prestacao_pendente: 'Prestação Pendente',
  prestado: 'Prestado',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
  bloqueado: 'Bloqueado',
};

export const TIPO_EMPENHO_LABELS: Record<TipoEmpenho, string> = {
  ordinario: 'Ordinário',
  estimativo: 'Estimativo',
  global: 'Global',
};

export const TIPO_ALTERACAO_LABELS: Record<TipoAlteracaoOrcamentaria, string> = {
  suplementacao: 'Suplementação',
  reducao: 'Redução',
  remanejamento: 'Remanejamento',
  transposicao: 'Transposição',
  transferencia: 'Transferência',
  credito_especial: 'Crédito Especial',
  credito_extraordinario: 'Crédito Extraordinário',
};

export const TIPO_RECEITA_LABELS: Record<TipoReceita, string> = {
  repasse_tesouro: 'Repasse do Tesouro',
  convenio: 'Convênio',
  doacao: 'Doação',
  restituicao: 'Restituição',
  rendimento_aplicacao: 'Rendimento de Aplicação',
  taxa_servico: 'Taxa de Serviço',
  multa: 'Multa',
  outros: 'Outros',
};

export const TIPO_DESPESA_OPTIONS = [
  { value: 'material', label: 'Material de Consumo' },
  { value: 'servico', label: 'Serviço' },
  { value: 'diaria', label: 'Diária' },
  { value: 'evento', label: 'Evento' },
  { value: 'repasse', label: 'Repasse' },
  { value: 'obra', label: 'Obra' },
  { value: 'equipamento', label: 'Equipamento' },
];

export const PRIORIDADE_OPTIONS = [
  { value: 'baixa', label: 'Baixa', color: 'bg-gray-100 text-gray-800' },
  { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-800' },
  { value: 'alta', label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgente', label: 'Urgente', color: 'bg-red-100 text-red-800' },
];

export const FORMA_PAGAMENTO_OPTIONS = [
  { value: 'ted', label: 'TED' },
  { value: 'pix', label: 'PIX' },
  { value: 'doc', label: 'DOC' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'ob', label: 'Ordem Bancária' },
  { value: 'cheque', label: 'Cheque' },
];

// ===========================================
// RESTOS A PAGAR
// ===========================================

export type StatusRestoPagar = 'inscrito' | 'em_liquidacao' | 'liquidado' | 'pago' | 'cancelado' | 'prescrito';
export type TipoRestoPagar = 'processado' | 'nao_processado';

export interface RestoPagar {
  id: string;
  empenho_id: string;
  exercicio_origem: number;
  exercicio_inscricao: number;
  tipo: TipoRestoPagar;
  valor_inscrito: number;
  valor_cancelado: number;
  valor_liquidado: number;
  valor_pago: number;
  saldo: number;
  status: StatusRestoPagar;
  data_inscricao: string;
  data_cancelamento?: string | null;
  data_prescricao?: string | null;
  motivo_cancelamento?: string | null;
  observacoes?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  // Joins
  empenho?: Empenho;
}

export const STATUS_RAP_LABELS: Record<StatusRestoPagar, string> = {
  inscrito: 'Inscrito',
  em_liquidacao: 'Em Liquidação',
  liquidado: 'Liquidado',
  pago: 'Pago',
  cancelado: 'Cancelado',
  prescrito: 'Prescrito',
};

export const TIPO_RAP_LABELS: Record<TipoRestoPagar, string> = {
  processado: 'Processado',
  nao_processado: 'Não Processado',
};

// ===========================================
// SUB-EMPENHOS
// ===========================================

export type TipoSubEmpenho = 'reforco' | 'anulacao';
export type StatusSubEmpenho = 'ativo' | 'cancelado';

export interface SubEmpenho {
  id: string;
  empenho_id: string;
  numero: string;
  tipo: TipoSubEmpenho;
  valor: number;
  data_registro: string;
  justificativa: string;
  documento_referencia?: string | null;
  status: StatusSubEmpenho;
  observacoes?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  // Joins
  empenho?: Empenho;
}

export const TIPO_SUB_EMPENHO_LABELS: Record<TipoSubEmpenho, string> = {
  reforco: 'Reforço',
  anulacao: 'Anulação',
};

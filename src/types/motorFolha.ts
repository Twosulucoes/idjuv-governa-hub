/**
 * ============================================
 * TIPOS DO MOTOR DE CÁLCULO DA FOLHA DE PAGAMENTO
 * ============================================
 * 
 * Interfaces e tipos para o motor de cálculo parametrizado.
 * Mantém compatibilidade com estruturas legadas.
 * 
 * @author Sistema IDJUV
 * @version 1.0.0
 * @date 03/02/2026
 */

// ============================================
// TIPOS DE CONFIGURAÇÃO (BANCO DE DADOS)
// ============================================

export interface ConfigTipoRubrica {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string;
  natureza: 'provento' | 'desconto' | 'encargo' | 'informativo';
  grupo?: string;
  subgrupo?: string;
  ordem_exibicao: number;
  exibe_contracheque?: boolean;
  exibe_relatorio?: boolean;
  ativo: boolean;
}

export interface ConfigRubrica {
  id: string;
  instituicao_id?: string;
  tipo_rubrica_id?: string;
  codigo: string;
  nome: string;
  descricao?: string;
  natureza: 'provento' | 'desconto' | 'encargo' | 'informativo';
  tipo_calculo: 'fixo' | 'percentual' | 'formula' | 'referencia' | 'tabela' | 'manual';
  valor_fixo?: number;
  percentual?: number;
  formula?: string;
  rubrica_base_id?: string;
  valor_minimo?: number;
  valor_maximo?: number;
  teto_constitucional?: boolean;
  incide_inss: boolean;
  incide_irrf: boolean;
  incide_fgts: boolean;
  incide_ferias?: boolean;
  incide_13_salario?: boolean;
  incide_rescisao?: boolean;
  compoe_base_inss: boolean;
  compoe_base_irrf: boolean;
  compoe_base_fgts?: boolean;
  automatica?: boolean;
  obrigatoria?: boolean;
  proporcional_dias?: boolean;
  proporcional_horas?: boolean;
  desconta_faltas?: boolean;
  codigo_esocial?: string;
  natureza_esocial?: string;
  vigencia_inicio: string;
  vigencia_fim?: string;
  ordem_calculo: number;
  ativo: boolean;
}

export interface ConfigIncidencia {
  id: string;
  rubrica_origem_id: string;
  rubrica_destino_id: string;
  tipo_incidencia: 'base_calculo' | 'deducao' | 'composicao' | 'referencia';
  percentual?: number;
  ativo: boolean;
  vigencia_inicio: string;
  vigencia_fim?: string;
}

export interface ConfigRegraCalculo {
  id: string;
  rubrica_id?: string;
  nome: string;
  descricao?: string;
  tipo_escopo?: string;
  escopo_id?: string;
  condicao?: Record<string, unknown>;
  parametros: Record<string, unknown>;
  prioridade: number;
  ativo: boolean;
  vigencia_inicio: string;
  vigencia_fim?: string;
}

// ============================================
// TIPOS DE CONTEXTO DO SERVIDOR
// ============================================

export interface ContextoServidorFolha {
  servidor_id: string;
  nome_completo: string;
  cpf: string;
  matricula: string;
  pis_pasep?: string;
  
  // Vida funcional
  cargo_id?: string;
  cargo_nome?: string;
  cargo_vencimento?: number;
  lotacao_id?: string;
  unidade_id?: string;
  unidade_nome?: string;
  centro_custo_id?: string;
  tipo_vinculo?: string;
  carga_horaria?: number;
  data_admissao?: string;
  
  // Dados bancários
  banco_codigo?: string;
  banco_agencia?: string;
  banco_conta?: string;
  banco_tipo_conta?: string;
  
  // Frequência (dados do mês)
  dias_trabalhados?: number;
  dias_uteis?: number;
  faltas?: number;
  horas_extras_50?: number;
  horas_extras_100?: number;
  horas_noturnas?: number;
  
  // Dependentes
  quantidade_dependentes_irrf?: number;
}

export interface ParametrosFolhaCalculo {
  competencia_ano: number;
  competencia_mes: number;
  data_referencia: string;
  
  // Parâmetros globais
  salario_minimo: number;
  valor_dependente_irrf: number;
  teto_inss: number;
  teto_constitucional?: number;
  
  // Alíquotas patronais
  aliquota_inss_patronal: number;
  aliquota_rat: number;
  aliquota_outras_entidades: number;
  
  // Margem consignável
  margem_consignavel_percentual: number;
}

// ============================================
// TIPOS DE RESULTADO DO CÁLCULO
// ============================================

export interface ItemCalculoRubrica {
  rubrica_id: string;
  rubrica_codigo: string;
  rubrica_descricao: string;
  natureza: 'provento' | 'desconto' | 'encargo' | 'informativo';
  tipo_calculo: string;
  referencia?: number;
  base_calculo?: number;
  percentual?: number;
  valor: number;
  origem: 'automatico' | 'manual' | 'importado' | 'legado';
  ordem_calculo: number;
  incidencias_aplicadas?: string[];
  observacao?: string;
}

export interface ResultadoCalculoServidor {
  servidor_id: string;
  competencia_ano: number;
  competencia_mes: number;
  
  // Itens calculados
  itens: ItemCalculoRubrica[];
  
  // Totais
  total_proventos: number;
  total_descontos: number;
  valor_liquido: number;
  
  // Bases de cálculo
  base_inss: number;
  base_irrf: number;
  base_fgts: number;
  
  // Impostos calculados
  valor_inss: number;
  valor_irrf: number;
  
  // Encargos patronais
  inss_patronal: number;
  rat: number;
  outras_entidades: number;
  total_encargos: number;
  
  // Margem consignável
  base_consignavel: number;
  margem_consignavel: number;
  margem_utilizada?: number;
  
  // Metadados
  processado_em: string;
  versao_motor: string;
  usou_fallback: boolean;
  fallback_detalhes: string[];
  warnings: string[];
  
  // Contexto usado
  contexto: ContextoServidorFolha;
}

export interface ResultadoCalculoFolha {
  folha_id?: string;
  competencia_ano: number;
  competencia_mes: number;
  tipo_folha: 'mensal' | 'complementar' | 'decimo_terceiro' | 'ferias' | 'rescisao';
  
  // Servidores calculados
  servidores: ResultadoCalculoServidor[];
  
  // Totais consolidados
  total_bruto: number;
  total_descontos: number;
  total_liquido: number;
  total_inss_servidor: number;
  total_inss_patronal: number;
  total_irrf: number;
  total_encargos_patronais: number;
  
  // Estatísticas
  quantidade_servidores: number;
  servidores_com_erro: number;
  servidores_com_warning: number;
  
  // Metadados
  processado_em: string;
  duracao_ms: number;
  versao_motor: string;
}

// ============================================
// TIPOS DE LOG E AUDITORIA
// ============================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntryCalculo {
  timestamp: string;
  level: LogLevel;
  servidor_id?: string;
  rubrica_codigo?: string;
  mensagem: string;
  dados?: Record<string, unknown>;
}

export interface ConfiguracaoMotor {
  // Comportamento
  modo_debug: boolean;
  log_detalhado: boolean;
  validar_resultados: boolean;
  
  // Fallbacks
  permitir_fallback: boolean;
  notificar_fallback: boolean;
  
  // Limites
  timeout_por_servidor_ms: number;
  max_tentativas_rubrica: number;
  
  // Compatibilidade
  usar_rubricas_legadas: boolean;
  priorizar_config_nova: boolean;
}

// ============================================
// CONSTANTES E DEFAULTS
// ============================================

export const CONFIG_MOTOR_PADRAO: ConfiguracaoMotor = {
  modo_debug: false,
  log_detalhado: false,
  validar_resultados: true,
  permitir_fallback: true,
  notificar_fallback: true,
  timeout_por_servidor_ms: 30000,
  max_tentativas_rubrica: 3,
  usar_rubricas_legadas: true,
  priorizar_config_nova: true,
};

export const VERSAO_MOTOR = '1.0.0';

// ============================================
// TIPOS DE FAIXAS (INSS/IRRF)
// ============================================

export interface FaixaINSSCalculo {
  faixa_ordem: number;
  valor_minimo: number;
  valor_maximo: number;
  aliquota: number;
}

export interface FaixaIRRFCalculo {
  faixa_ordem: number;
  valor_minimo: number;
  valor_maximo: number;
  aliquota: number;
  parcela_deduzir: number;
}

// ============================================
// TIPOS DE CONSIGNAÇÃO
// ============================================

export interface ConsignacaoAtiva {
  id: string;
  servidor_id: string;
  consignataria_nome: string;
  consignataria_codigo?: string;
  numero_contrato?: string;
  valor_parcela: number;
  parcelas_restantes: number;
  rubrica_codigo?: string;
}

// ============================================
// TIPOS DO MÓDULO DE FREQUÊNCIA
// Parametrizações Institucionais
// ============================================

// Escopo de aplicação da jornada
export type EscopoJornada = 'orgao' | 'unidade' | 'cargo' | 'servidor';

// Tipo de regime de trabalho
export type TipoRegime = 'presencial' | 'teletrabalho' | 'hibrido' | 'plantao' | 'escala';

// Tipo de dia não útil
export type TipoDiaNaoUtil = 
  | 'feriado_nacional' 
  | 'feriado_estadual' 
  | 'feriado_municipal'
  | 'ponto_facultativo' 
  | 'recesso' 
  | 'suspensao_expediente' 
  | 'expediente_reduzido';

// Impacto nas horas
export type ImpactoHoras = 'neutro' | 'reduz' | 'compensa';

// Quem autoriza compensação
export type AutorizadorCompensacao = 'chefia' | 'rh' | 'ambos';

// Tipo de assinatura
export type TipoAssinatura = 'manual' | 'digital' | 'ambas';

// Quem valida final
export type ValidadorFinal = 'servidor' | 'chefia' | 'rh';

// Status de fechamento
export type StatusFechamento = 'aberto' | 'fechado_servidor' | 'fechado_chefia' | 'consolidado';

// Status de solicitação de abono
export type StatusSolicitacaoAbono = 'pendente' | 'aprovado_chefia' | 'aprovado_rh' | 'aprovado' | 'rejeitado' | 'cancelado';

// ============================================
// INTERFACES DE CONFIGURAÇÃO
// ============================================

// 1. Configuração de Jornada
export interface ConfigJornadaPadrao {
  id: string;
  nome: string;
  descricao?: string;
  
  // Carga horária
  carga_horaria_diaria: number;
  carga_horaria_semanal: number;
  
  // Horários
  entrada_manha?: string;
  saida_manha?: string;
  entrada_tarde?: string;
  saida_tarde?: string;
  
  // Intervalo
  intervalo_minimo: number;
  intervalo_maximo: number;
  intervalo_obrigatorio: boolean;
  intervalo_remunerado: boolean;
  
  // Tolerâncias
  tolerancia_atraso: number;
  tolerancia_saida_antecipada: number;
  tolerancia_intervalo: number;
  banco_tolerancia_diario: boolean;
  banco_tolerancia_mensal: boolean;
  
  // Escopo
  escopo: EscopoJornada;
  unidade_id?: string;
  cargo_id?: string;
  servidor_id?: string;
  
  // Metadados
  ativo: boolean;
  padrao: boolean;
  created_at?: string;
  updated_at?: string;
  
  // Relacionamentos expandidos
  unidade?: { nome: string; sigla?: string };
  cargo?: { nome: string };
  servidor?: { nome_completo: string };
}

// 2. Regime de Trabalho
export interface RegimeTrabalho {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string;
  tipo: TipoRegime;
  padrao_escala?: string;
  dias_trabalho: number[];
  exige_registro_ponto: boolean;
  exige_assinatura_servidor: boolean;
  exige_validacao_chefia: boolean;
  permite_ponto_remoto: boolean;
  exige_localizacao: boolean;
  exige_foto: boolean;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

// 3. Dia Não Útil
export interface DiaNaoUtil {
  id: string;
  data: string;
  nome: string;
  tipo: TipoDiaNaoUtil;
  conta_frequencia: boolean;
  exige_compensacao: boolean;
  horas_expediente?: number;
  recorrente: boolean;
  mes_recorrente?: number;
  dia_recorrente?: number;
  abrangencia: 'todas' | 'especifica';
  unidades_aplicaveis?: string[];
  ativo: boolean;
  created_at?: string;
  observacao?: string;
}

// 4. Tipo de Abono
export interface TipoAbono {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string;
  conta_como_presenca: boolean;
  exige_documento: boolean;
  exige_aprovacao_chefia: boolean;
  exige_aprovacao_rh: boolean;
  impacto_horas: ImpactoHoras;
  max_horas_dia?: number;
  max_ocorrencias_mes?: number;
  tipos_documento_aceitos?: string[];
  ativo: boolean;
  ordem: number;
  created_at?: string;
  updated_at?: string;
}

// 5. Configuração de Compensação
export interface ConfigCompensacao {
  id: string;
  nome: string;
  permite_banco_horas: boolean;
  compensacao_automatica: boolean;
  compensacao_manual: boolean;
  prazo_compensar_dias: number;
  limite_acumulo_horas: number;
  limite_horas_extras_dia: number;
  limite_horas_extras_mes: number;
  quem_autoriza: AutorizadorCompensacao;
  exibe_na_frequencia: boolean;
  exibe_na_impressao: boolean;
  aplicar_a_todos: boolean;
  unidade_id?: string;
  ativo: boolean;
  padrao: boolean;
  created_at?: string;
  updated_at?: string;
}

// 6. Configuração de Fechamento
export interface ConfigFechamentoFrequencia {
  id: string;
  ano: number;
  mes: number;
  data_limite_servidor?: string;
  data_limite_chefia?: string;
  data_limite_rh?: string;
  status: StatusFechamento;
  permite_reabertura: boolean;
  prazo_reabertura_dias: number;
  reabertura_exige_justificativa: boolean;
  servidor_pode_fechar: boolean;
  chefia_pode_fechar: boolean;
  rh_pode_fechar: boolean;
  fechado_em?: string;
  fechado_por?: string;
  consolidado_em?: string;
  consolidado_por?: string;
  created_at?: string;
  updated_at?: string;
}

// 7. Configuração de Assinatura
export interface ConfigAssinaturaFrequencia {
  id: string;
  nome: string;
  assinatura_servidor_obrigatoria: boolean;
  assinatura_chefia_obrigatoria: boolean;
  assinatura_rh_obrigatoria: boolean;
  tipo_assinatura: TipoAssinatura;
  ordem_assinaturas: string[];
  quem_valida_final: ValidadorFinal;
  texto_declaracao: string;
  ativo: boolean;
  padrao: boolean;
  created_at?: string;
  updated_at?: string;
}

// 8. Solicitação de Abono
export interface SolicitacaoAbono {
  id: string;
  servidor_id: string;
  tipo_abono_id: string;
  data_inicio: string;
  data_fim: string;
  hora_inicio?: string;
  hora_fim?: string;
  justificativa: string;
  documento_url?: string;
  status: StatusSolicitacaoAbono;
  aprovado_chefia_por?: string;
  aprovado_chefia_em?: string;
  aprovado_rh_por?: string;
  aprovado_rh_em?: string;
  motivo_rejeicao?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  
  // Relacionamentos expandidos
  servidor?: { nome_completo: string; matricula?: string };
  tipo_abono?: TipoAbono;
}

// 9. Fechamento Individual
export interface FrequenciaFechamento {
  id: string;
  servidor_id: string;
  ano: number;
  mes: number;
  assinado_servidor: boolean;
  assinado_servidor_em?: string;
  validado_chefia: boolean;
  validado_chefia_por?: string;
  validado_chefia_em?: string;
  consolidado_rh: boolean;
  consolidado_rh_por?: string;
  consolidado_rh_em?: string;
  reaberto: boolean;
  reaberto_por?: string;
  reaberto_em?: string;
  justificativa_reabertura?: string;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
  
  // Relacionamentos expandidos
  servidor?: { nome_completo: string; matricula?: string };
}

// 10. Regime por Servidor
export interface ServidorRegime {
  id: string;
  servidor_id: string;
  regime_id: string;
  jornada_id?: string;
  data_inicio: string;
  data_fim?: string;
  carga_horaria_customizada?: number;
  dias_trabalho_customizados?: number[];
  observacoes?: string;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
  
  // Relacionamentos expandidos
  servidor?: { nome_completo: string; matricula?: string };
  regime?: RegimeTrabalho;
  jornada?: ConfigJornadaPadrao;
}

// ============================================
// LABELS E CONSTANTES
// ============================================

export const TIPO_DIA_NAO_UTIL_LABELS: Record<TipoDiaNaoUtil, string> = {
  feriado_nacional: 'Feriado Nacional',
  feriado_estadual: 'Feriado Estadual',
  feriado_municipal: 'Feriado Municipal',
  ponto_facultativo: 'Ponto Facultativo',
  recesso: 'Recesso Administrativo',
  suspensao_expediente: 'Suspensão de Expediente',
  expediente_reduzido: 'Expediente Reduzido',
};

export const TIPO_REGIME_LABELS: Record<TipoRegime, string> = {
  presencial: 'Presencial',
  teletrabalho: 'Teletrabalho',
  hibrido: 'Híbrido',
  plantao: 'Plantão',
  escala: 'Escala',
};

export const STATUS_FECHAMENTO_LABELS: Record<StatusFechamento, string> = {
  aberto: 'Aberto',
  fechado_servidor: 'Fechado pelo Servidor',
  fechado_chefia: 'Validado pela Chefia',
  consolidado: 'Consolidado pelo RH',
};

export const STATUS_SOLICITACAO_LABELS: Record<StatusSolicitacaoAbono, string> = {
  pendente: 'Pendente',
  aprovado_chefia: 'Aprovado pela Chefia',
  aprovado_rh: 'Aprovado pelo RH',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
  cancelado: 'Cancelado',
};

export const ESCOPO_JORNADA_LABELS: Record<EscopoJornada, string> = {
  orgao: 'Órgão (Geral)',
  unidade: 'Unidade Específica',
  cargo: 'Cargo Específico',
  servidor: 'Servidor Individual',
};

export const DIAS_SEMANA_LABELS: Record<number, string> = {
  0: 'Domingo',
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado',
};

export const DIAS_SEMANA_SIGLA: Record<number, string> = {
  0: 'Dom',
  1: 'Seg',
  2: 'Ter',
  3: 'Qua',
  4: 'Qui',
  5: 'Sex',
  6: 'Sáb',
};

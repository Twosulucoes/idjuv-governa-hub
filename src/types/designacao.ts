// Tipos para Designações Temporárias
// Quando um servidor é designado para trabalhar em outra unidade sem mudar sua lotação

export type StatusDesignacao = 'pendente' | 'aprovada' | 'rejeitada' | 'encerrada';

export const STATUS_DESIGNACAO_LABELS: Record<StatusDesignacao, string> = {
  pendente: 'Pendente',
  aprovada: 'Aprovada',
  rejeitada: 'Rejeitada',
  encerrada: 'Encerrada',
};

export const STATUS_DESIGNACAO_COLORS: Record<StatusDesignacao, string> = {
  pendente: 'bg-warning/20 text-warning border-warning/30',
  aprovada: 'bg-success/20 text-success border-success/30',
  rejeitada: 'bg-destructive/20 text-destructive border-destructive/30',
  encerrada: 'bg-muted text-muted-foreground border-muted',
};

export interface Designacao {
  id: string;
  servidor_id: string;
  lotacao_id?: string;
  unidade_origem_id: string;
  unidade_destino_id: string;
  
  // Período
  data_inicio: string;
  data_fim?: string;
  
  // Aprovação
  status: StatusDesignacao;
  aprovado_por?: string;
  data_aprovacao?: string;
  motivo_rejeicao?: string;
  
  // Ato administrativo
  ato_tipo?: string;
  ato_numero?: string;
  ato_data?: string;
  ato_doe_numero?: string;
  ato_doe_data?: string;
  
  // Metadados
  justificativa?: string;
  observacao?: string;
  ativo: boolean;
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
  unidade_origem?: {
    id: string;
    nome: string;
    sigla?: string;
  };
  unidade_destino?: {
    id: string;
    nome: string;
    sigla?: string;
  };
  lotacao?: {
    id: string;
    cargo?: {
      id: string;
      nome: string;
      sigla?: string;
    };
  };
  aprovador?: {
    id: string;
    full_name?: string;
  };
}

export interface CreateDesignacaoData {
  servidor_id: string;
  lotacao_id?: string;
  unidade_origem_id: string;
  unidade_destino_id: string;
  data_inicio: string;
  data_fim?: string;
  justificativa?: string;
  ato_tipo?: string;
  ato_numero?: string;
  ato_data?: string;
  ato_doe_numero?: string;
  ato_doe_data?: string;
  observacao?: string;
}

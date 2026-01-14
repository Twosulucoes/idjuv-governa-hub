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
  minuta: 'Minuta',
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
  numero?: string; // Se não informado, será gerado automaticamente
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
}

export interface UpdatePortariaData extends Partial<CreatePortariaData> {
  data_assinatura?: string;
  assinado_por?: string;
  arquivo_assinado_url?: string;
  doe_numero?: string;
  doe_data?: string;
  data_publicacao?: string;
}

// Templates de portarias
export const PORTARIA_TEMPLATES = {
  nomeacao_comissionado: {
    titulo: 'Portaria de Nomeação - Cargo em Comissão',
    ementa: 'Nomeia servidor para cargo em comissão.',
    template: `O PRESIDENTE DO INSTITUTO DE DESENVOLVIMENTO DA JUVENTUDE DO ESTADO DE RORAIMA – IDJUV, no uso de suas atribuições legais conferidas pela Lei nº 2.301, de 10 de janeiro de 2025,

RESOLVE:

Art. 1º NOMEAR {{NOME_SERVIDOR}}, inscrito(a) no CPF nº {{CPF}}, para exercer o cargo em comissão de {{CARGO}}, símbolo {{SIMBOLO}}, no(a) {{UNIDADE}}, do Instituto de Desenvolvimento da Juventude do Estado de Roraima – IDJUV.

Art. 2º Esta Portaria entra em vigor na data de sua publicação.

Boa Vista-RR, {{DATA_EXTENSO}}.

{{NOME_PRESIDENTE}}
Presidente do IDJUV`,
  },
  nomeacao_efetivo: {
    titulo: 'Portaria de Nomeação - Cargo Efetivo',
    ementa: 'Nomeia servidor aprovado em concurso público.',
    template: `O PRESIDENTE DO INSTITUTO DE DESENVOLVIMENTO DA JUVENTUDE DO ESTADO DE RORAIMA – IDJUV, no uso de suas atribuições legais conferidas pela Lei nº 2.301, de 10 de janeiro de 2025,

RESOLVE:

Art. 1º NOMEAR {{NOME_SERVIDOR}}, inscrito(a) no CPF nº {{CPF}}, aprovado(a) em concurso público, para exercer o cargo efetivo de {{CARGO}}, no(a) {{UNIDADE}}, do Instituto de Desenvolvimento da Juventude do Estado de Roraima – IDJUV.

Art. 2º O(A) servidor(a) terá o prazo de 30 (trinta) dias para tomar posse, nos termos da legislação vigente.

Art. 3º Esta Portaria entra em vigor na data de sua publicação.

Boa Vista-RR, {{DATA_EXTENSO}}.

{{NOME_PRESIDENTE}}
Presidente do IDJUV`,
  },
  exoneracao_pedido: {
    titulo: 'Portaria de Exoneração a Pedido',
    ementa: 'Exonera servidor a pedido.',
    template: `O PRESIDENTE DO INSTITUTO DE DESENVOLVIMENTO DA JUVENTUDE DO ESTADO DE RORAIMA – IDJUV, no uso de suas atribuições legais conferidas pela Lei nº 2.301, de 10 de janeiro de 2025,

RESOLVE:

Art. 1º EXONERAR, a pedido, {{NOME_SERVIDOR}}, inscrito(a) no CPF nº {{CPF}}, do cargo de {{CARGO}}, no(a) {{UNIDADE}}, do Instituto de Desenvolvimento da Juventude do Estado de Roraima – IDJUV.

Art. 2º Esta Portaria entra em vigor na data de sua publicação.

Boa Vista-RR, {{DATA_EXTENSO}}.

{{NOME_PRESIDENTE}}
Presidente do IDJUV`,
  },
  exoneracao_oficio: {
    titulo: 'Portaria de Exoneração de Ofício',
    ementa: 'Exonera servidor de ofício.',
    template: `O PRESIDENTE DO INSTITUTO DE DESENVOLVIMENTO DA JUVENTUDE DO ESTADO DE RORAIMA – IDJUV, no uso de suas atribuições legais conferidas pela Lei nº 2.301, de 10 de janeiro de 2025,

RESOLVE:

Art. 1º EXONERAR, de ofício, {{NOME_SERVIDOR}}, inscrito(a) no CPF nº {{CPF}}, do cargo de {{CARGO}}, no(a) {{UNIDADE}}, do Instituto de Desenvolvimento da Juventude do Estado de Roraima – IDJUV.

Art. 2º Esta Portaria entra em vigor na data de sua publicação.

Boa Vista-RR, {{DATA_EXTENSO}}.

{{NOME_PRESIDENTE}}
Presidente do IDJUV`,
  },
  designacao: {
    titulo: 'Portaria de Designação',
    ementa: 'Designa servidor para exercício em outra unidade.',
    template: `O PRESIDENTE DO INSTITUTO DE DESENVOLVIMENTO DA JUVENTUDE DO ESTADO DE RORAIMA – IDJUV, no uso de suas atribuições legais conferidas pela Lei nº 2.301, de 10 de janeiro de 2025,

RESOLVE:

Art. 1º DESIGNAR {{NOME_SERVIDOR}}, inscrito(a) no CPF nº {{CPF}}, ocupante do cargo de {{CARGO}}, lotado(a) no(a) {{UNIDADE_ORIGEM}}, para exercer suas atividades no(a) {{UNIDADE_DESTINO}}, sem prejuízo de sua lotação original.

Art. 2º A designação terá vigência de {{DATA_INICIO}} a {{DATA_FIM}}.

Art. 3º Esta Portaria entra em vigor na data de sua publicação.

Boa Vista-RR, {{DATA_EXTENSO}}.

{{NOME_PRESIDENTE}}
Presidente do IDJUV`,
  },
  dispensa: {
    titulo: 'Portaria de Dispensa de Designação',
    ementa: 'Dispensa servidor de designação.',
    template: `O PRESIDENTE DO INSTITUTO DE DESENVOLVIMENTO DA JUVENTUDE DO ESTADO DE RORAIMA – IDJUV, no uso de suas atribuições legais conferidas pela Lei nº 2.301, de 10 de janeiro de 2025,

RESOLVE:

Art. 1º DISPENSAR {{NOME_SERVIDOR}}, inscrito(a) no CPF nº {{CPF}}, da designação para exercício no(a) {{UNIDADE_DESTINO}}, retornando às suas atividades no(a) {{UNIDADE_ORIGEM}}.

Art. 2º Esta Portaria entra em vigor na data de sua publicação.

Boa Vista-RR, {{DATA_EXTENSO}}.

{{NOME_PRESIDENTE}}
Presidente do IDJUV`,
  },
};

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

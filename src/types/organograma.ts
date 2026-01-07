// Tipos para o Organograma

export type TipoUnidade = 
  | 'presidencia'
  | 'diretoria'
  | 'departamento'
  | 'setor'
  | 'divisao'
  | 'secao'
  | 'coordenacao';

export interface UnidadeOrganizacional {
  id: string;
  nome: string;
  sigla?: string;
  tipo: TipoUnidade;
  nivel: number;
  superior_id?: string;
  descricao?: string;
  competencias?: string[];
  atribuicoes?: string;
  cargo_chefe_id?: string;
  servidor_responsavel_id?: string;
  servidor_responsavel?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  lei_criacao_numero?: string;
  lei_criacao_data?: string;
  telefone?: string;
  ramal?: string;
  email?: string;
  localizacao?: string;
  ativo: boolean;
  subordinados?: UnidadeOrganizacional[];
}

export interface Cargo {
  id: string;
  nome: string;
  sigla?: string;
  categoria: 'efetivo' | 'comissionado' | 'funcao_gratificada' | 'temporario' | 'estagiario';
  nivel_hierarquico: number;
  escolaridade?: string;
  vencimento_base?: number;
  quantidade_vagas: number;
  ativo: boolean;
}

export interface Lotacao {
  id: string;
  servidor_id: string;
  unidade_id: string;
  cargo_id?: string;
  data_inicio: string;
  data_fim?: string;
  ativo: boolean;
  servidor?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    email?: string;
  };
  cargo?: Cargo;
}

// Cores por tipo de unidade
export const CORES_UNIDADE: Record<TipoUnidade, { bg: string; border: string; text: string }> = {
  presidencia: { bg: 'bg-primary', border: 'border-primary', text: 'text-primary-foreground' },
  diretoria: { bg: 'bg-secondary', border: 'border-secondary', text: 'text-secondary-foreground' },
  departamento: { bg: 'bg-accent', border: 'border-accent', text: 'text-accent-foreground' },
  setor: { bg: 'bg-highlight', border: 'border-highlight', text: 'text-primary-foreground' },
  divisao: { bg: 'bg-info', border: 'border-info', text: 'text-primary-foreground' },
  secao: { bg: 'bg-success', border: 'border-success', text: 'text-primary-foreground' },
  coordenacao: { bg: 'bg-warning', border: 'border-warning', text: 'text-primary-foreground' },
};

export const LABELS_UNIDADE: Record<TipoUnidade, string> = {
  presidencia: 'Presidência',
  diretoria: 'Diretoria',
  departamento: 'Departamento',
  setor: 'Setor',
  divisao: 'Divisão',
  secao: 'Seção',
  coordenacao: 'Coordenação',
};

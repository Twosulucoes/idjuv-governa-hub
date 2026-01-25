// ============================================
// TIPOS DO SISTEMA DE PERFIS E PERMISSÕES
// ============================================

// Perfil do sistema
export interface Perfil {
  id: string;
  nome: string;
  descricao: string | null;
  nivel: 'sistema' | 'organizacional' | 'operacional';
  nivel_hierarquia: number;
  perfil_pai_id: string | null;
  ativo: boolean;
  is_sistema: boolean;
  cor: string | null;
  icone: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  // Relacionamentos
  perfil_pai?: Perfil;
  filhos?: Perfil[];
  funcoes?: PerfilFuncao[];
}

// Função (feature) do sistema
export interface FuncaoSistema {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  modulo: string;
  submodulo: string | null;
  tipo_acao: string;
  funcao_pai_id: string | null;
  rota: string | null;
  icone: string | null;
  ordem: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  funcao_pai?: FuncaoSistema;
  filhos?: FuncaoSistema[];
}

// Associação Perfil-Função (permissão)
export interface PerfilFuncao {
  id: string;
  perfil_id: string;
  funcao_id: string;
  concedido: boolean;
  created_at: string;
  created_by: string | null;
  // Relacionamentos
  perfil?: Perfil;
  funcao?: FuncaoSistema;
}

// Associação Usuário-Perfil
export interface UsuarioPerfil {
  id: string;
  user_id: string;
  perfil_id: string;
  ativo: boolean;
  data_inicio: string;
  data_fim: string | null;
  created_at: string;
  created_by: string | null;
  // Relacionamentos
  perfil?: Perfil;
}

// Árvore hierárquica de funções
export interface FuncaoArvore extends FuncaoSistema {
  filhos: FuncaoArvore[];
  selecionado?: boolean;
  indeterminado?: boolean;
}

// Árvore hierárquica de perfis
export interface PerfilArvore extends Perfil {
  filhos: PerfilArvore[];
  funcoes_count?: number;
}

// Labels de módulos
export const MODULO_LABELS: Record<string, string> = {
  'rh': 'Recursos Humanos',
  'governanca': 'Governança',
  'admin': 'Administração',
  'relatorios': 'Relatórios',
  'financeiro': 'Financeiro',
  'processos': 'Processos'
};

// Labels de tipos de ação
export const TIPO_ACAO_LABELS: Record<string, string> = {
  'visualizar': 'Visualizar',
  'criar': 'Criar',
  'editar': 'Editar',
  'excluir': 'Excluir',
  'aprovar': 'Aprovar',
  'exportar': 'Exportar'
};

// Labels de níveis de perfil
export const NIVEL_PERFIL_LABELS: Record<string, string> = {
  'sistema': 'Sistema',
  'organizacional': 'Organizacional',
  'operacional': 'Operacional'
};

// Cores para níveis
export const NIVEL_PERFIL_CORES: Record<string, string> = {
  'sistema': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  'organizacional': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'operacional': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
};

// Ícones padrão para tipos de ação
export const TIPO_ACAO_ICONES: Record<string, string> = {
  'visualizar': 'Eye',
  'criar': 'Plus',
  'editar': 'Pencil',
  'excluir': 'Trash2',
  'aprovar': 'CheckCircle',
  'exportar': 'Download'
};

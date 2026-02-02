// ============================================
// TIPOS DO SISTEMA RBAC INSTITUCIONAL
// ============================================

/**
 * Domínios do sistema RBAC institucional
 * Cada domínio representa um módulo funcional
 */
export const DOMINIOS = [
  'admin',
  'workflow',
  'compras',
  'contratos',
  'rh',
  'orcamento',
  'patrimonio',
  'governanca',
  'transparencia',
] as const;

export type Dominio = typeof DOMINIOS[number];

/**
 * Capacidades padrão do sistema
 */
export const CAPACIDADES = [
  'visualizar',
  'criar',
  'tramitar',
  'aprovar',
  'avaliar',
  'responder',
  'administrar',
  'self',
] as const;

export type Capacidade = typeof CAPACIDADES[number];

/**
 * Permissão institucional do banco de dados
 */
export interface Permissao {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  dominio: Dominio;
  capacidade: Capacidade;
  ordem: number;
  ativo: boolean;
  created_at: string;
}

/**
 * Perfil institucional
 */
export interface Perfil {
  id: string;
  nome: string;
  descricao: string | null;
  codigo: string | null;
  nivel: 'sistema' | 'organizacional' | 'operacional';
  nivel_hierarquia: number;
  perfil_pai_id: string | null;
  ativo: boolean;
  is_sistema: boolean;
  cor: string | null;
  icone: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Associação Perfil-Permissão
 */
export interface PerfilPermissao {
  id: string;
  perfil_id: string;
  permissao_id: string;
  concedido: boolean;
  created_at: string;
  created_by: string | null;
}

/**
 * Associação Usuário-Perfil
 */
export interface UsuarioPerfil {
  id: string;
  user_id: string;
  perfil_id: string;
  ativo: boolean;
  data_inicio: string;
  data_fim: string | null;
  created_at: string;
  created_by: string | null;
  perfil?: Perfil;
}

/**
 * Usuário para administração
 */
export interface UsuarioAdmin {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_active: boolean;
  tipo_usuario: 'servidor' | 'tecnico';
  created_at: string;
  perfis: UsuarioPerfil[];
}

// Labels amigáveis para domínios
export const DOMINIO_LABELS: Record<Dominio, string> = {
  admin: 'Administração',
  workflow: 'Processos',
  compras: 'Compras',
  contratos: 'Contratos',
  rh: 'Recursos Humanos',
  orcamento: 'Orçamento',
  patrimonio: 'Patrimônio',
  governanca: 'Governança',
  transparencia: 'Transparência',
};

// Ícones para domínios (nome do Lucide icon)
export const DOMINIO_ICONES: Record<Dominio, string> = {
  admin: 'Settings',
  workflow: 'Workflow',
  compras: 'ShoppingCart',
  contratos: 'FileCheck',
  rh: 'Users',
  orcamento: 'Wallet',
  patrimonio: 'Package',
  governanca: 'Scale',
  transparencia: 'Eye',
};

// Labels amigáveis para capacidades
export const CAPACIDADE_LABELS: Record<Capacidade, string> = {
  visualizar: 'Visualizar',
  criar: 'Criar',
  tramitar: 'Tramitar',
  aprovar: 'Aprovar',
  avaliar: 'Avaliar',
  responder: 'Responder',
  administrar: 'Administrar',
  self: 'Próprio',
};

// Cores para níveis de perfil
export const NIVEL_PERFIL_CORES: Record<string, string> = {
  sistema: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  organizacional: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  operacional: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

// Labels para níveis
export const NIVEL_PERFIL_LABELS: Record<string, string> = {
  sistema: 'Sistema',
  organizacional: 'Organizacional',
  operacional: 'Operacional',
};

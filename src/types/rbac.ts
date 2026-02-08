// ============================================
// TIPOS DO SISTEMA RBAC (Role-Based Access Control)
// Baseado na spec: .lovable/specs/rbac-spec.md
// ============================================

// Re-exportar do módulo central de configuração
export { MODULOS, type Modulo, MODULES_CONFIG, getModuleByCode, findModuleByRoute, MODULO_COR_CLASSES, getModuloCorClass } from '@/shared/config/modules.config';
import { MODULOS, type Modulo, MODULES_CONFIG } from '@/shared/config/modules.config';

// ============================================
// TIPOS DO NOVO SISTEMA RBAC
// ============================================

// Roles disponíveis no sistema (enum app_role do banco)
export type AppRole = 'admin' | 'manager' | 'user';

// Módulos disponíveis (alias para Modulo)
export type AppModule = Modulo;

// User Role do banco (tabela user_roles)
export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  created_by: string | null;
}

// User Module do banco (tabela user_modules)
export interface UserModule {
  id: string;
  user_id: string;
  module: Modulo;
  created_at: string;
  created_by: string | null;
}

// Labels para roles
export const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Administrador',
  manager: 'Gestor',
  user: 'Usuário'
};

// Cores para badges de roles
export const ROLE_COLORS: Record<AppRole, string> = {
  admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  user: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
};

// ============================================
// TIPOS LEGADOS (COMPATIBILIDADE)
// ============================================

// Códigos de perfil antigos (mapeados para roles)
export const PERFIL_CODIGOS = ['super_admin', 'gestor', 'servidor'] as const;
export type PerfilCodigo = typeof PERFIL_CODIGOS[number];

// Mapeamento de perfis antigos para novos roles
export const PERFIL_TO_ROLE: Record<PerfilCodigo, AppRole> = {
  super_admin: 'admin',
  gestor: 'manager',
  servidor: 'user'
};

// Mapeamento reverso
export const ROLE_TO_PERFIL: Record<AppRole, PerfilCodigo> = {
  admin: 'super_admin',
  manager: 'gestor',
  user: 'servidor'
};

// Perfil do sistema (simplificado para compatibilidade)
export interface Perfil {
  id: string;
  nome: string;
  codigo: PerfilCodigo;
  descricao: string | null;
  pode_aprovar: boolean;
  created_at: string;
}

// Associação Usuário-Perfil (para compatibilidade)
export interface UsuarioPerfil {
  id: string;
  user_id: string;
  perfil_id: string;
  created_at: string;
  created_by: string | null;
  perfil?: Perfil;
}

// Módulo liberado para um usuário (para compatibilidade)
export interface UsuarioModulo {
  id: string;
  user_id: string;
  modulo: Modulo;
  created_at: string;
  created_by: string | null;
}

// Usuário para administração
export interface UsuarioAdmin {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_active: boolean;
  tipo_usuario: 'servidor' | 'tecnico';
  created_at: string;
  // Novo sistema
  role?: AppRole;
  // Legado (para compatibilidade)
  perfil?: UsuarioPerfil | null;
  modulos: Modulo[];
}

// Labels amigáveis para módulos - derivado do MODULES_CONFIG
export const MODULO_LABELS: Record<Modulo, string> = MODULES_CONFIG.reduce((acc, m) => {
  acc[m.codigo] = m.nome;
  return acc;
}, {} as Record<Modulo, string>);

// Ícones para módulos (emoji)
export const MODULO_ICONES: Record<Modulo, string> = {
  admin: '⚙️',
  workflow: '🔄',
  compras: '🛒',
  contratos: '📝',
  rh: '👥',
  financeiro: '💰',
  patrimonio: '📦',
  governanca: '⚖️',
  integridade: '🛡️',
  transparencia: '👁️',
  comunicacao: '📢',
  programas: '🎓',
  gestores_escolares: '🏫',
  federacoes: '🏆',
};

// Labels para perfis
export const PERFIL_LABELS: Record<PerfilCodigo, string> = {
  super_admin: 'Super Administrador',
  gestor: 'Gestor',
  servidor: 'Servidor',
};

// Descrições para perfis
export const PERFIL_DESCRICOES: Record<PerfilCodigo, string> = {
  super_admin: 'Acesso total ao sistema',
  gestor: 'Pode aprovar processos e acessar módulos selecionados',
  servidor: 'Acesso aos módulos selecionados',
};

// Cores para perfis
export const PERFIL_CORES: Record<PerfilCodigo, string> = {
  super_admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  gestor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  servidor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

// Alias para compatibilidade com código legado
export const DOMINIOS = MODULOS;
export type Dominio = Modulo;
export const DOMINIO_LABELS = MODULO_LABELS;

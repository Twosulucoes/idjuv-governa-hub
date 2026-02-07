// ============================================
// TIPOS DO SISTEMA RBAC SIMPLIFICADO (3 PERFIS)
// ============================================

// Re-exportar do módulo central de configuração
export { MODULOS, type Modulo, MODULES_CONFIG, getModuleByCode, findModuleByRoute, MODULO_COR_CLASSES, getModuloCorClass } from '@/shared/config/modules.config';
import { MODULOS, type Modulo, MODULES_CONFIG } from '@/shared/config/modules.config';

/**
 * Códigos de perfil do sistema (apenas 3)
 */
export const PERFIL_CODIGOS = ['super_admin', 'gestor', 'servidor'] as const;
export type PerfilCodigo = typeof PERFIL_CODIGOS[number];

/**
 * Perfil do sistema (simplificado)
 * Compatível com o schema do banco que ainda tem campos extras
 */
export interface Perfil {
  id: string;
  nome: string;
  codigo: PerfilCodigo;
  descricao: string | null;
  pode_aprovar: boolean;
  created_at: string;
}

/**
 * Perfil do banco (com todos os campos do schema atual)
 * Usado internamente para mapear dados do Supabase
 */
export interface PerfilDB {
  id: string;
  nome: string;
  codigo: string;
  descricao: string | null;
  ativo?: boolean;
  cor?: string | null;
  icone?: string | null;
  nivel?: string;
  nivel_hierarquia?: number;
  perfil_pai_id?: string | null;
  is_sistema?: boolean;
  pode_aprovar?: boolean;
  created_at: string;
  created_by?: string | null;
  updated_at?: string;
  updated_by?: string | null;
}

/**
 * Associação Usuário-Perfil (1:1)
 */
export interface UsuarioPerfil {
  id: string;
  user_id: string;
  perfil_id: string;
  created_at: string;
  created_by: string | null;
  perfil?: Perfil;
}

/**
 * Módulo liberado para um usuário
 */
export interface UsuarioModulo {
  id: string;
  user_id: string;
  modulo: Modulo;
  created_at: string;
  created_by: string | null;
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
  perfil?: UsuarioPerfil | null;
  modulos: Modulo[];
}

// Labels amigáveis para módulos - derivado do MODULES_CONFIG
export const MODULO_LABELS: Record<Modulo, string> = MODULES_CONFIG.reduce((acc, m) => {
  acc[m.codigo] = m.nome;
  return acc;
}, {} as Record<Modulo, string>);

// Ícones para módulos (emoji) - mapeamento para componentes que usam emoji
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

// ============================================
// TIPOS LEGADOS (COMPATIBILIDADE)
// ============================================

// Alias para compatibilidade com código legado
export const DOMINIOS = MODULOS;
export type Dominio = Modulo;
export const DOMINIO_LABELS = MODULO_LABELS;
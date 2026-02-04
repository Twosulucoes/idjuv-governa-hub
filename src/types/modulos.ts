// ============================================
// TIPOS DO SISTEMA DE MÓDULOS
// ============================================

/**
 * Módulo do sistema (catálogo)
 */
export interface ModuloSistema {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  icone: string | null;
  cor: string | null;
  ordem: number;
  ativo: boolean;
  prefixos_rota: string[];
  created_at: string;
}

/**
 * Associação usuário-módulo
 */
export interface UsuarioModulo {
  id: string;
  user_id: string;
  modulo_id: string;
  ativo: boolean;
  created_at: string;
  created_by: string | null;
  modulo?: ModuloSistema;
}

/**
 * Módulo com status de acesso para um usuário
 */
export interface ModuloAcesso {
  modulo: ModuloSistema;
  autorizado: boolean;
}

/**
 * Dados do usuário para verificação de módulos
 */
export interface UsuarioModulosData {
  restringirModulos: boolean;
  modulosAutorizados: string[];
}

/**
 * Mapeamento de cores de módulos para Tailwind
 */
export const MODULO_COR_CLASSES: Record<string, string> = {
  slate: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200',
  green: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-200',
  orange: 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-200',
  emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-200',
  indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-200',
  cyan: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-800 dark:text-cyan-200',
  rose: 'bg-rose-100 text-rose-800 dark:bg-rose-800 dark:text-rose-200',
  yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200',
  pink: 'bg-pink-100 text-pink-800 dark:bg-pink-800 dark:text-pink-200',
  red: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200',
};

/**
 * Obtém a classe de cor para um módulo
 */
export function getModuloCorClass(cor: string | null): string {
  return MODULO_COR_CLASSES[cor || 'slate'] || MODULO_COR_CLASSES.slate;
}

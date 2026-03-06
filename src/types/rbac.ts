// ============================================
// TIPOS DO SISTEMA DE PERMISSÕES (Baseado em Módulos)
// Acesso é 100% baseado em módulos e permissões granulares
// Sem conceito de "role" separado
// ============================================

// Re-exportar do módulo central de configuração
export { MODULOS, type Modulo, MODULES_CONFIG, getModuleByCode, findModuleByRoute, MODULO_COR_CLASSES, getModuloCorClass } from '@/shared/config/modules.config';
import { MODULOS, type Modulo, MODULES_CONFIG } from '@/shared/config/modules.config';

// ============================================
// TIPOS DO SISTEMA DE MÓDULOS
// ============================================

// Módulos disponíveis (alias)
export type AppModule = Modulo;

// User Module do banco (tabela user_modules)
export interface UserModule {
  id: string;
  user_id: string;
  module: Modulo;
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
  organizacoes: '🏛️',
  gabinete: '🏢',
  patrimonio_mobile: '📱',
  arbitros: '⚖️',
};

// Alias para compatibilidade com código legado
export const DOMINIOS = MODULOS;
export type Dominio = Modulo;
export const DOMINIO_LABELS = MODULO_LABELS;

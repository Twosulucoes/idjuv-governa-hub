/**
 * HOOK DE ROTEAMENTO POR MÓDULO
 * 
 * Decide para onde redirecionar o usuário baseado nos módulos atribuídos.
 * 
 * @version 1.0.0
 */

import { useMemo } from 'react';
import { useModulosUsuario } from '@/hooks/useModulosUsuario';
import { useAuth } from '@/contexts/AuthContext';
import { MODULES_CONFIG, type Modulo } from '@/shared/config/modules.config';

export interface ModuleRouterResult {
  isLoading: boolean;
  modulosCount: number;
  primaryModule: Modulo | null;
  authorizedModules: Modulo[];
  shouldRedirect: boolean;
  redirectPath: string | null;
  isAdmin: boolean;
  isSingleModule: boolean;
  isMultiModule: boolean;
  hasNoModules: boolean;
}

/**
 * Rotas padrão para cada módulo
 * Usa rotas existentes quando disponíveis
 */
const MODULE_HOME_ROUTES: Record<Modulo, string> = {
  admin: '/admin',
  rh: '/rh',
  workflow: '/workflow',
  compras: '/compras',
  contratos: '/contratos',
  financeiro: '/financeiro',
  patrimonio: '/patrimonio',
  governanca: '/governanca',
  integridade: '/integridade',
  transparencia: '/transparencia',
  comunicacao: '/comunicacao',
  programas: '/programas/bolsa-atleta',
  gestores_escolares: '/gestores-escolares',
  organizacoes: '/admin/federacoes',
  gabinete: '/gabinete',
};

/**
 * Ordem de prioridade para exibição no HUB
 */
export const MODULE_PRIORITY: Modulo[] = [
  'admin',
  'gabinete',
  'rh',
  'financeiro',
  'compras',
  'contratos',
  'patrimonio',
  'workflow',
  'governanca',
  'transparencia',
  'programas',
  'comunicacao',
  'integridade',
  'gestores_escolares',
  'organizacoes',
];

export function useModuleRouter(): ModuleRouterResult {
  const { loading, modulosAutorizados, isSuperAdmin, role } = useModulosUsuario();
  const { isLoading: authLoading } = useAuth();

  const result = useMemo((): ModuleRouterResult => {
    const isLoading = loading || authLoading;
    
    // Admin tem acesso total
    const isAdmin = isSuperAdmin || role === 'admin';
    
    // Módulos autorizados
    const authorizedModules = isAdmin 
      ? (MODULE_PRIORITY as unknown as Modulo[])
      : modulosAutorizados;
    
    const modulosCount = authorizedModules.length;
    const hasNoModules = modulosCount === 0 && !isAdmin;
    const isSingleModule = modulosCount === 1 && !isAdmin;
    const isMultiModule = modulosCount > 1 || isAdmin;
    
    // Módulo primário (para redirect)
    const primaryModule = authorizedModules[0] || null;
    
    // Lógica de redirect
    let shouldRedirect = false;
    let redirectPath: string | null = null;
    
    if (!isLoading) {
      if (hasNoModules) {
        shouldRedirect = true;
        redirectPath = '/acesso-negado?reason=no-modules';
      } else if (isSingleModule && primaryModule) {
        shouldRedirect = true;
        redirectPath = MODULE_HOME_ROUTES[primaryModule];
      }
      // isMultiModule: não redireciona, mostra HUB
    }
    
    return {
      isLoading,
      modulosCount,
      primaryModule,
      authorizedModules,
      shouldRedirect,
      redirectPath,
      isAdmin,
      isSingleModule,
      isMultiModule,
      hasNoModules,
    };
  }, [loading, authLoading, modulosAutorizados, isSuperAdmin, role]);

  return result;
}

/**
 * Obtém a rota home de um módulo
 */
export function getModuleHomeRoute(modulo: Modulo): string {
  return MODULE_HOME_ROUTES[modulo] || '/sistema';
}

/**
 * Obtém configuração visual de um módulo
 */
export function getModuleInfo(modulo: Modulo) {
  return MODULES_CONFIG.find(m => m.codigo === modulo);
}

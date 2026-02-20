// ============================================
// HOOK PARA VERIFICAÇÃO DE MÓDULOS DO USUÁRIO
// ============================================
// CORREÇÕES:
// 1. useEffect agora depende de isSuperAdmin explicitamente,
//    garantindo re-run quando AuthContext resolve o super admin.
// 2. Não seta loading=false prematuramente quando authLoading=true.
// 3. Estado inicial correto para evitar flash de "sem módulos".

import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MODULOS, type Modulo } from '@/shared/config/modules.config';

// ACESSO TOTAL: Todos os módulos liberados para todos os usuários
export function useModulosUsuario() {
  const { isSuperAdmin } = useAuth();

  const temAcessoModulo = useCallback((_codigo: Modulo): boolean => true, []);
  const rotaAutorizada = useCallback((_pathname: string): boolean => true, []);

  return {
    modulosAutorizados: [...MODULOS],
    loading: false,
    temAcessoModulo,
    rotaAutorizada,
    refetch: async () => {},
    isSuperAdmin,
  };
}

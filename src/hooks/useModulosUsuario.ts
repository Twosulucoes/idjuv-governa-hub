// ============================================
// HOOK PARA VERIFICAÇÃO DE MÓDULOS DO USUÁRIO
// Baseado em dados reais do banco via get_my_access_context()
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MODULOS, type Modulo, findModuleByRoute } from '@/shared/config/modules.config';

interface AccessContext {
  is_active: boolean;
  is_admin: boolean;
  modules: string[] | null;
  roles: string[] | null;
}

export function useModulosUsuario() {
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState<AccessContext | null>(null);

  const fetchContext = useCallback(async () => {
    if (!user?.id) {
      setContext(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_my_access_context');
      if (error) {
        console.error('[useModulosUsuario] Erro:', error);
        setContext(null);
      } else {
        setContext(data as unknown as AccessContext);
      }
    } catch (err) {
      console.error('[useModulosUsuario] Exceção:', err);
      setContext(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!authLoading) {
      fetchContext();
    }
  }, [authLoading, fetchContext]);

  const isSuperAdmin = context?.is_admin ?? user?.isSuperAdmin ?? false;

  // Módulos autorizados: se admin, todos; senão, apenas os atribuídos
  const modulosAutorizados: Modulo[] = isSuperAdmin
    ? [...MODULOS]
    : (context?.modules ?? [])
        .filter((m): m is Modulo => MODULOS.includes(m as Modulo));

  const temAcessoModulo = useCallback((codigo: Modulo): boolean => {
    if (isSuperAdmin) return true;
    return modulosAutorizados.includes(codigo);
  }, [isSuperAdmin, modulosAutorizados]);

  const rotaAutorizada = useCallback((pathname: string): boolean => {
    if (isSuperAdmin) return true;
    const modConfig = findModuleByRoute(pathname);
    if (!modConfig) return false;
    return temAcessoModulo(modConfig.codigo);
  }, [isSuperAdmin, temAcessoModulo]);

  return {
    modulosAutorizados,
    loading: authLoading || loading,
    temAcessoModulo,
    rotaAutorizada,
    refetch: fetchContext,
    isSuperAdmin,
    isActive: context?.is_active ?? false,
  };
}

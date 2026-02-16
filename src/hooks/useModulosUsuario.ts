// ============================================
// HOOK PARA VERIFICAÇÃO DE MÓDULOS DO USUÁRIO
// Acesso baseado exclusivamente em user_modules
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MODULOS, type Modulo, findModuleByRoute } from '@/shared/config/modules.config';

export function useModulosUsuario() {
  const { user, isSuperAdmin, isLoading: authLoading } = useAuth();
  const [modulosAutorizados, setModulosAutorizados] = useState<Modulo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchModulosUsuario = useCallback(async () => {
    if (authLoading) return;
    
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      // Super admin via AuthContext tem acesso total
      if (isSuperAdmin) {
        console.log('[useModulosUsuario] Super Admin - acesso total');
        setModulosAutorizados([...MODULOS]);
        setLoading(false);
        return;
      }

      // Buscar módulos autorizados
      const { data: modulosData } = await supabase
        .from('user_modules')
        .select('module')
        .eq('user_id', user.id);

      const modulos = (modulosData || [])
        .map((m: any) => m.module)
        .filter((m: string): m is Modulo => MODULOS.includes(m as Modulo));
      
      console.log('[useModulosUsuario] Módulos carregados:', modulos);
      setModulosAutorizados(modulos);
    } catch (error) {
      console.error('[useModulosUsuario] Erro:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, isSuperAdmin, authLoading]);

  useEffect(() => {
    fetchModulosUsuario();
  }, [fetchModulosUsuario]);

  const temAcessoModulo = useCallback((codigo: Modulo): boolean => {
    if (isSuperAdmin) return true;
    return modulosAutorizados.includes(codigo);
  }, [isSuperAdmin, modulosAutorizados]);

  const rotaAutorizada = useCallback((pathname: string): boolean => {
    if (isSuperAdmin) return true;
    
    const modulo = findModuleByRoute(pathname);
    if (!modulo) return true;
    
    return modulosAutorizados.includes(modulo.codigo);
  }, [isSuperAdmin, modulosAutorizados]);

  return {
    modulosAutorizados,
    loading: loading || authLoading,
    temAcessoModulo,
    rotaAutorizada,
    refetch: fetchModulosUsuario,
    isSuperAdmin,
  };
}

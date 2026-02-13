// ============================================
// HOOK PARA VERIFICAÇÃO DE MÓDULOS DO USUÁRIO
// Acesso baseado exclusivamente em user_modules
// Suporta Dev Mode para simulação
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MODULOS, type Modulo, findModuleByRoute } from '@/shared/config/modules.config';

const DEV_MODE_STORAGE_KEY = 'dev-mode-overrides';
const DEV_MODE_ENABLED_KEY = 'dev-mode-enabled';

interface DevModeOverrides {
  modules: Modulo[];
  isSuperAdmin: boolean;
}

function getDevModeOverrides(): DevModeOverrides | null {
  try {
    const enabled = localStorage.getItem(DEV_MODE_ENABLED_KEY) === 'true';
    if (!enabled) return null;
    
    const saved = localStorage.getItem(DEV_MODE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { modules: parsed.modules || [], isSuperAdmin: parsed.isSuperAdmin || false };
    }
  } catch {
    // Ignora erros
  }
  return null;
}

export function useModulosUsuario() {
  const { user, isSuperAdmin: authIsSuperAdmin } = useAuth();
  const [modulosAutorizados, setModulosAutorizados] = useState<Modulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [devModeActive, setDevModeActive] = useState(false);

  const devOverrides = getDevModeOverrides();
  const isSuperAdmin = devOverrides?.isSuperAdmin ?? authIsSuperAdmin;

  const fetchModulosUsuario = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const overrides = getDevModeOverrides();
    if (overrides) {
      console.log('[useModulosUsuario] Dev Mode ativo - usando overrides:', overrides);
      setDevModeActive(true);
      setModulosAutorizados(overrides.modules);
      setLoading(false);
      return;
    }

    setDevModeActive(false);

    try {
      // Super admin via AuthContext tem acesso total
      if (authIsSuperAdmin) {
        console.log('[useModulosUsuario] Super Admin detectado via AuthContext - acesso total');
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
  }, [user?.id, authIsSuperAdmin]);

  useEffect(() => {
    const handleDevModeChange = () => {
      fetchModulosUsuario();
    };
    
    window.addEventListener('dev-mode-changed', handleDevModeChange);
    return () => window.removeEventListener('dev-mode-changed', handleDevModeChange);
  }, [fetchModulosUsuario]);

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
    loading,
    temAcessoModulo,
    rotaAutorizada,
    refetch: fetchModulosUsuario,
    devModeActive,
    isSuperAdmin,
  };
}

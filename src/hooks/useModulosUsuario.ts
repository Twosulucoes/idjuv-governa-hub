// ============================================
// HOOK PARA VERIFICAÇÃO DE MÓDULOS DO USUÁRIO (RBAC)
// Usando as novas tabelas user_roles e user_modules
// Suporta Dev Mode para simulação de diferentes perfis
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MODULOS, type Modulo, findModuleByRoute } from '@/shared/config/modules.config';
import type { AppRole } from '@/types/rbac';

const DEV_MODE_STORAGE_KEY = 'dev-mode-overrides';
const DEV_MODE_ENABLED_KEY = 'dev-mode-enabled';

interface DevModeOverrides {
  role: AppRole | null;
  modules: Modulo[];
  isSuperAdmin: boolean;
}

function getDevModeOverrides(): DevModeOverrides | null {
  try {
    const enabled = localStorage.getItem(DEV_MODE_ENABLED_KEY) === 'true';
    if (!enabled) return null;
    
    const saved = localStorage.getItem(DEV_MODE_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignora erros
  }
  return null;
}

export function useModulosUsuario() {
  const { user, isSuperAdmin: authIsSuperAdmin } = useAuth();
  const [modulosAutorizados, setModulosAutorizados] = useState<Modulo[]>([]);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [devModeActive, setDevModeActive] = useState(false);

  // Verificar Dev Mode overrides
  const devOverrides = getDevModeOverrides();
  const isSuperAdmin = devOverrides?.isSuperAdmin ?? authIsSuperAdmin;

  // Buscar dados de módulos do usuário
  const fetchModulosUsuario = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    // Se Dev Mode está ativo, usar overrides
    const overrides = getDevModeOverrides();
    if (overrides) {
      console.log('[useModulosUsuario] Dev Mode ativo - usando overrides:', overrides);
      setDevModeActive(true);
      setRole(overrides.role);
      setModulosAutorizados(overrides.modules);
      setLoading(false);
      return;
    }

    setDevModeActive(false);

    try {
      // Super admin via AuthContext tem acesso total
      if (authIsSuperAdmin) {
        console.log('[useModulosUsuario] Super Admin detectado via AuthContext - acesso total');
        setRole('admin');
        setModulosAutorizados([...MODULOS]);
        setLoading(false);
        return;
      }

      // Buscar role do usuário (nova tabela)
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      const userRole = (roleData?.role as AppRole) || null;
      setRole(userRole);

      // Admin tem todos os módulos
      if (userRole === 'admin') {
        console.log('[useModulosUsuario] Admin detectado via role - acesso total');
        setModulosAutorizados([...MODULOS]);
        setLoading(false);
        return;
      }

      // Buscar módulos autorizados para usuários comuns
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

  // Listener para mudanças no Dev Mode
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

  // Verificar se módulo está autorizado
  const temAcessoModulo = useCallback((codigo: Modulo): boolean => {
    // Admin tem acesso total
    if (isSuperAdmin || role === 'admin') return true;
    
    // Verificar lista
    return modulosAutorizados.includes(codigo);
  }, [isSuperAdmin, role, modulosAutorizados]);

  // Verificar se rota está em módulo autorizado
  const rotaAutorizada = useCallback((pathname: string): boolean => {
    // Admin tem acesso total
    if (isSuperAdmin || role === 'admin') return true;
    
    // Usar a função do modules.config para mapear rota -> módulo
    const modulo = findModuleByRoute(pathname);
    
    // Rota não mapeada a nenhum módulo = permitida
    if (!modulo) return true;
    
    // Verificar se tem acesso ao módulo da rota
    return modulosAutorizados.includes(modulo.codigo);
  }, [isSuperAdmin, role, modulosAutorizados]);

  return {
    modulosAutorizados,
    role,
    // Compatibilidade
    perfilCodigo: role === 'admin' ? 'super_admin' : role === 'manager' ? 'gestor' : 'servidor',
    loading,
    temAcessoModulo,
    rotaAutorizada,
    refetch: fetchModulosUsuario,
    // Dev Mode
    devModeActive,
    isSuperAdmin,
  };
}

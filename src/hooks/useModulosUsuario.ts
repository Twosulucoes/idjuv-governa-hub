// ============================================
// HOOK PARA VERIFICAÇÃO DE MÓDULOS DO USUÁRIO
// ============================================
// CORREÇÕES:
// 1. useEffect agora depende de isSuperAdmin explicitamente,
//    garantindo re-run quando AuthContext resolve o super admin.
// 2. Não seta loading=false prematuramente quando authLoading=true.
// 3. Estado inicial correto para evitar flash de "sem módulos".

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MODULOS, type Modulo, findModuleByRoute } from '@/shared/config/modules.config';

export function useModulosUsuario() {
  const { user, isSuperAdmin, isLoading: authLoading } = useAuth();
  const [modulosAutorizados, setModulosAutorizados] = useState<Modulo[]>([]);
  // ✅ CORREÇÃO: loading começa true e só vira false após auth + fetch resolverem
  const [loading, setLoading] = useState(true);
  // Ref para evitar setState em componente desmontado
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchModulosUsuario = useCallback(async () => {
    // ✅ CORREÇÃO: Aguarda auth resolver antes de qualquer coisa
    if (authLoading) {
      return;
    }

    if (!user?.id) {
      if (mountedRef.current) {
        setModulosAutorizados([]);
        setLoading(false);
      }
      return;
    }

    // ✅ CORREÇÃO: isSuperAdmin agora é verificado APÓS auth resolver
    // O useEffect depende de isSuperAdmin, então vai rodar novamente
    // quando AuthContext terminar de buscar as permissões do banco.
    if (isSuperAdmin) {
      console.log('[useModulosUsuario] Super Admin confirmado - acesso total');
      if (mountedRef.current) {
        setModulosAutorizados([...MODULOS]);
        setLoading(false);
      }
      return;
    }

    try {
      const { data: modulosData, error } = await supabase
        .from('user_modules')
        .select('module')
        .eq('user_id', user.id);

      if (error) {
        console.error('[useModulosUsuario] Erro ao buscar módulos:', error);
      }

      const modulos = (modulosData || [])
        .map((m: any) => m.module as string)
        .filter((m): m is Modulo => MODULOS.includes(m as Modulo));

      console.log('[useModulosUsuario] Módulos carregados:', modulos);

      if (mountedRef.current) {
        setModulosAutorizados(modulos);
      }
    } catch (error) {
      console.error('[useModulosUsuario] Erro inesperado:', error);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [user?.id, isSuperAdmin, authLoading]);
  // ✅ CORREÇÃO: isSuperAdmin na dependência garante re-run quando
  // o AuthContext termina de resolver o RPC usuario_eh_super_admin

  useEffect(() => {
    // Resetar loading quando auth ainda está carregando
    if (authLoading) {
      setLoading(true);
      return;
    }
    fetchModulosUsuario();
  }, [fetchModulosUsuario, authLoading]);

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
    // ✅ CORREÇÃO: loading é o estado local real, não misturado com authLoading
    // O chamador que precisar saber se auth está carregando pode usar useAuth() diretamente
    loading,
    temAcessoModulo,
    rotaAutorizada,
    refetch: fetchModulosUsuario,
    isSuperAdmin,
  };
}

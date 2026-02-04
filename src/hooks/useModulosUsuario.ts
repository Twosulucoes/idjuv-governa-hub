// ============================================
// HOOK PARA VERIFICAÇÃO DE MÓDULOS DO USUÁRIO
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { ModuloSistema, UsuarioModulosData } from '@/types/modulos';

export function useModulosUsuario() {
  const { user, isSuperAdmin } = useAuth();
  const [modulos, setModulos] = useState<ModuloSistema[]>([]);
  const [modulosAutorizados, setModulosAutorizados] = useState<string[]>([]);
  const [restringirModulos, setRestringirModulos] = useState(false);
  const [loading, setLoading] = useState(true);

  // Buscar dados de módulos do usuário
  const fetchModulosUsuario = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      // Buscar catálogo de módulos
      const { data: modulosData } = await supabase
        .from('modulos_sistema')
        .select('*')
        .eq('ativo', true)
        .order('ordem');

      setModulos(modulosData || []);

      // Buscar flag de restrição do profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('restringir_modulos')
        .eq('id', user.id)
        .single();

      const restringir = profileData?.restringir_modulos ?? false;
      setRestringirModulos(restringir);

      // Se tem restrição, buscar módulos autorizados
      if (restringir) {
        const { data: autorizadosData } = await supabase
          .from('usuario_modulos')
          .select('modulo_id, modulo:modulos_sistema(codigo)')
          .eq('user_id', user.id)
          .eq('ativo', true);

        const codigos = (autorizadosData || [])
          .map(a => (a.modulo as any)?.codigo)
          .filter(Boolean);
        
        setModulosAutorizados(codigos);
      } else {
        // Sem restrição = todos os módulos autorizados
        setModulosAutorizados((modulosData || []).map(m => m.codigo));
      }
    } catch (error) {
      console.error('[useModulosUsuario] Erro:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchModulosUsuario();
  }, [fetchModulosUsuario]);

  // Verificar se módulo está autorizado
  const temAcessoModulo = useCallback((codigo: string): boolean => {
    // Super admin tem acesso total
    if (isSuperAdmin) return true;
    
    // Sem restrição = acesso total
    if (!restringirModulos) return true;
    
    // Com restrição = verificar lista
    return modulosAutorizados.includes(codigo);
  }, [isSuperAdmin, restringirModulos, modulosAutorizados]);

  // Verificar se rota está em módulo autorizado
  const rotaAutorizada = useCallback((pathname: string): boolean => {
    // Super admin tem acesso total
    if (isSuperAdmin) return true;
    
    // Sem restrição = acesso total
    if (!restringirModulos) return true;
    
    // Encontrar módulo que cobre a rota
    const moduloRota = modulos.find(m => 
      m.prefixos_rota.some(prefixo => 
        pathname === prefixo || pathname.startsWith(prefixo + '/')
      )
    );
    
    // Se não encontrou módulo, permitir (rota não mapeada)
    if (!moduloRota) return true;
    
    // Verificar se módulo está autorizado
    return modulosAutorizados.includes(moduloRota.codigo);
  }, [isSuperAdmin, restringirModulos, modulos, modulosAutorizados]);

  // Obter módulo de uma rota
  const getModuloDaRota = useCallback((pathname: string): ModuloSistema | null => {
    return modulos.find(m => 
      m.prefixos_rota.some(prefixo => 
        pathname === prefixo || pathname.startsWith(prefixo + '/')
      )
    ) || null;
  }, [modulos]);

  return {
    modulos,
    modulosAutorizados,
    restringirModulos,
    loading,
    temAcessoModulo,
    rotaAutorizada,
    getModuloDaRota,
    refetch: fetchModulosUsuario,
  };
}

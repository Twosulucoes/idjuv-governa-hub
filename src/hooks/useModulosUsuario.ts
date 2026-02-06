// ============================================
// HOOK PARA VERIFICAÇÃO DE MÓDULOS DO USUÁRIO (SIMPLIFICADO)
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MODULOS, type Modulo, findModuleByRoute } from '@/shared/config/modules.config';

export function useModulosUsuario() {
  const { user, isSuperAdmin } = useAuth();
  const [modulosAutorizados, setModulosAutorizados] = useState<Modulo[]>([]);
  const [perfilCodigo, setPerfilCodigo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Buscar dados de módulos do usuário
  const fetchModulosUsuario = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      // Buscar perfil do usuário
      const { data: perfilData } = await supabase
        .from('usuario_perfis')
        .select('perfil:perfis(codigo)')
        .eq('user_id', user.id)
        .maybeSingle();

      const codigo = (perfilData?.perfil as any)?.codigo || null;
      setPerfilCodigo(codigo);

      // Super admin tem todos os módulos
      if (codigo === 'super_admin') {
        setModulosAutorizados([...MODULOS]);
        setLoading(false);
        return;
      }

      // Buscar módulos autorizados
      const { data: modulosData } = await supabase
        .from('usuario_modulos')
        .select('modulo')
        .eq('user_id', user.id);

      const modulos = (modulosData || [])
        .map(m => m.modulo)
        .filter((m): m is Modulo => MODULOS.includes(m as Modulo));
      
      setModulosAutorizados(modulos);
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
  const temAcessoModulo = useCallback((codigo: Modulo): boolean => {
    // Super admin tem acesso total
    if (isSuperAdmin || perfilCodigo === 'super_admin') return true;
    
    // Verificar lista
    return modulosAutorizados.includes(codigo);
  }, [isSuperAdmin, perfilCodigo, modulosAutorizados]);

  // Verificar se rota está em módulo autorizado
  const rotaAutorizada = useCallback((pathname: string): boolean => {
    // Super admin tem acesso total
    if (isSuperAdmin || perfilCodigo === 'super_admin') return true;
    
    // Usar a função do modules.config para mapear rota -> módulo
    const modulo = findModuleByRoute(pathname);
    
    // Rota não mapeada a nenhum módulo = permitida
    if (!modulo) return true;
    
    // Verificar se tem acesso ao módulo da rota
    return modulosAutorizados.includes(modulo.codigo);
  }, [isSuperAdmin, perfilCodigo, modulosAutorizados]);

  return {
    modulosAutorizados,
    perfilCodigo,
    loading,
    temAcessoModulo,
    rotaAutorizada,
    refetch: fetchModulosUsuario,
  };
}
// ============================================
// HOOK PARA VERIFICAÇÃO DE MÓDULOS DO USUÁRIO (SIMPLIFICADO)
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MODULOS, type Modulo } from '@/types/rbac';

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
        .map(m => m.modulo as Modulo)
        .filter(Boolean);
      
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
    
    // Mapear prefixos de rota para módulos
    const rotaModuloMap: Record<string, Modulo> = {
      '/admin': 'admin',
      '/rh': 'rh',
      '/workflow': 'workflow',
      '/processos': 'workflow',
      '/compras': 'compras',
      '/licitacoes': 'compras',
      '/contratos': 'contratos',
      '/patrimonio': 'patrimonio',
      '/financeiro': 'financeiro',
      '/orcamento': 'orcamento',
      '/governanca': 'governanca',
      '/transparencia': 'transparencia',
    };
    
    // Encontrar módulo que cobre a rota
    for (const [prefixo, modulo] of Object.entries(rotaModuloMap)) {
      if (pathname === prefixo || pathname.startsWith(prefixo + '/')) {
        return modulosAutorizados.includes(modulo);
      }
    }
    
    // Rota não mapeada = permitida
    return true;
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

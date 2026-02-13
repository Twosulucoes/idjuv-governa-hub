/**
 * Hook para buscar permissões do usuário autenticado
 * 
 * Baseado exclusivamente em user_modules e module_permissions_catalog.
 * Sem conceito de "role".
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MODULOS, type Modulo } from '@/shared/config/modules.config';

export interface PermissaoUsuario {
  funcao_id: string;
  funcao_codigo: string;
  funcao_nome: string;
  modulo: string;
  submodulo: string | null;
  tipo_acao: string;
  perfil_nome: string;
  rota?: string | null;
  icone?: string | null;
}

interface UsePermissoesUsuarioReturn {
  permissoes: PermissaoUsuario[];
  loading: boolean;
  error: string | null;
  temPermissao: (codigo: string) => boolean;
  temAlgumaPermissao: (codigos: string[]) => boolean;
  temTodasPermissoes: (codigos: string[]) => boolean;
  permissoesPorModulo: Record<string, PermissaoUsuario[]>;
  refetch: () => Promise<void>;
  modules: Modulo[];
  isAdmin: boolean;
}

export function usePermissoesUsuario(): UsePermissoesUsuarioReturn {
  const { user, isAuthenticated, isSuperAdmin } = useAuth();
  const [permissoes, setPermissoes] = useState<PermissaoUsuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modules, setModules] = useState<Modulo[]>([]);

  const fetchPermissoes = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setPermissoes([]);
      setModules([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Super admin tem tudo
      if (isSuperAdmin) {
        setModules([...MODULOS]);
        const todasPermissoes: PermissaoUsuario[] = MODULOS.map(m => ({
          funcao_id: m,
          funcao_codigo: m,
          funcao_nome: m,
          modulo: m,
          submodulo: null,
          tipo_acao: 'full',
          perfil_nome: 'Super Admin',
        }));
        setPermissoes(todasPermissoes);
        setLoading(false);
        return;
      }

      // Buscar módulos do usuário
      const { data: modulesData } = await supabase
        .from('user_modules')
        .select('module')
        .eq('user_id', user.id);

      const userModules = (modulesData || [])
        .map((m: any) => m.module)
        .filter((m: string): m is Modulo => MODULOS.includes(m as Modulo));
      
      setModules(userModules);

      // Gerar permissões baseadas nos módulos
      const permissoesDoModulo: PermissaoUsuario[] = userModules.map(m => ({
        funcao_id: m,
        funcao_codigo: m,
        funcao_nome: m,
        modulo: m,
        submodulo: null,
        tipo_acao: 'access',
        perfil_nome: 'Usuário',
      }));
      
      setPermissoes(permissoesDoModulo);
    } catch (err: any) {
      console.error('[Permissões] Erro ao buscar:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id, isAuthenticated, isSuperAdmin]);

  useEffect(() => {
    fetchPermissoes();
  }, [fetchPermissoes]);

  const isAdmin = isSuperAdmin || modules.includes('admin' as Modulo);

  const temPermissao = useCallback((codigo: string): boolean => {
    if (isSuperAdmin || modules.includes('admin' as Modulo)) return true;
    
    const modulo = codigo.split('.')[0] as Modulo;
    return modules.includes(modulo);
  }, [isSuperAdmin, modules]);

  const temAlgumaPermissao = useCallback((codigos: string[]): boolean => {
    return codigos.some(codigo => temPermissao(codigo));
  }, [temPermissao]);

  const temTodasPermissoes = useCallback((codigos: string[]): boolean => {
    return codigos.every(codigo => temPermissao(codigo));
  }, [temPermissao]);

  const permissoesPorModulo = useMemo(() => {
    const grupos: Record<string, PermissaoUsuario[]> = {};
    permissoes.forEach(p => {
      if (!grupos[p.modulo]) grupos[p.modulo] = [];
      grupos[p.modulo].push(p);
    });
    return grupos;
  }, [permissoes]);

  return {
    permissoes,
    loading,
    error,
    temPermissao,
    temAlgumaPermissao,
    temTodasPermissoes,
    permissoesPorModulo,
    refetch: fetchPermissoes,
    modules,
    isAdmin,
  };
}

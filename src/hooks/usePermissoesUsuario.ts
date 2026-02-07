/**
 * Hook para buscar permissões do usuário autenticado
 * 
 * ATUALIZADO: Agora usa as novas tabelas user_roles e user_modules
 * do sistema RBAC simplificado.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MODULOS, type Modulo } from '@/shared/config/modules.config';
import type { AppRole } from '@/types/rbac';

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
  // Novo sistema
  role: AppRole | null;
  modules: Modulo[];
  isAdmin: boolean;
}

export function usePermissoesUsuario(): UsePermissoesUsuarioReturn {
  const { user, isAuthenticated, isSuperAdmin } = useAuth();
  const [permissoes, setPermissoes] = useState<PermissaoUsuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [modules, setModules] = useState<Modulo[]>([]);

  const fetchPermissoes = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setPermissoes([]);
      setModules([]);
      setRole(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Super admin tem tudo
      if (isSuperAdmin) {
        setRole('admin');
        setModules([...MODULOS]);
        // Gerar permissões sintéticas para todos os módulos
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

      // Buscar role do usuário
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      const userRole = (roleData?.role as AppRole) || null;
      setRole(userRole);

      // Admin tem todos os módulos
      if (userRole === 'admin') {
        setModules([...MODULOS]);
        const todasPermissoes: PermissaoUsuario[] = MODULOS.map(m => ({
          funcao_id: m,
          funcao_codigo: m,
          funcao_nome: m,
          modulo: m,
          submodulo: null,
          tipo_acao: 'full',
          perfil_nome: 'Admin',
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
        perfil_nome: userRole || 'user',
      }));
      
      setPermissoes(permissoesDoModulo);
    } catch (err: any) {
      console.error('[Permissões] Erro ao buscar:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id, isAuthenticated, isSuperAdmin]);

  // Carrega permissões quando usuário muda
  useEffect(() => {
    fetchPermissoes();
  }, [fetchPermissoes]);

  // Verifica se tem uma permissão específica (agora baseado em módulos)
  const temPermissao = useCallback((codigo: string): boolean => {
    if (isSuperAdmin || role === 'admin') return true;
    
    // Extrair módulo do código (ex: 'rh.servidores.criar' -> 'rh')
    const modulo = codigo.split('.')[0] as Modulo;
    return modules.includes(modulo);
  }, [isSuperAdmin, role, modules]);

  // Verifica se tem pelo menos uma das permissões
  const temAlgumaPermissao = useCallback((codigos: string[]): boolean => {
    return codigos.some(codigo => temPermissao(codigo));
  }, [temPermissao]);

  // Verifica se tem todas as permissões
  const temTodasPermissoes = useCallback((codigos: string[]): boolean => {
    return codigos.every(codigo => temPermissao(codigo));
  }, [temPermissao]);

  // Agrupa permissões por módulo
  const permissoesPorModulo = useMemo(() => {
    const grupos: Record<string, PermissaoUsuario[]> = {};
    
    permissoes.forEach(p => {
      if (!grupos[p.modulo]) {
        grupos[p.modulo] = [];
      }
      grupos[p.modulo].push(p);
    });

    return grupos;
  }, [permissoes]);

  const isAdmin = role === 'admin' || isSuperAdmin;

  return {
    permissoes,
    loading,
    error,
    temPermissao,
    temAlgumaPermissao,
    temTodasPermissoes,
    permissoesPorModulo,
    refetch: fetchPermissoes,
    role,
    modules,
    isAdmin,
  };
}

// ============================================
// HOOK PRINCIPAL DO SISTEMA DE PERMISSÕES
// Baseado exclusivamente em módulos (user_modules)
// ============================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { UserModule, Modulo } from '@/types/rbac';

interface UseRBACReturn {
  isLoading: boolean;
  error: string | null;
  isActive: boolean;
  modules: Modulo[];
  hasModule: (module: Modulo) => boolean;
  canAccessModule: (module: Modulo) => boolean;
  isAdmin: boolean;
  refetch: () => Promise<void>;
}

export function useRBAC(): UseRBACReturn {
  const { user, isSuperAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userModules, setUserModules] = useState<UserModule[]>([]);
  const [isActive, setIsActive] = useState(false);

  const fetchUserPermissions = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('is_active')
        .eq('id', user.id)
        .maybeSingle();

      setIsActive(profileData?.is_active ?? false);

      const { data: modulesData, error: modulesError } = await supabase
        .from('user_modules')
        .select('*')
        .eq('user_id', user.id);

      if (modulesError) throw modulesError;
      setUserModules((modulesData || []) as UserModule[]);
    } catch (err: any) {
      console.error('Erro ao buscar permissões:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUserPermissions();
  }, [fetchUserPermissions]);

  const modules = useMemo(() => 
    userModules.map(m => m.module as Modulo), 
    [userModules]
  );

  const hasModule = useCallback((checkModule: Modulo): boolean => {
    return modules.includes(checkModule);
  }, [modules]);

  const canAccessModule = useCallback((checkModule: Modulo): boolean => {
    if (!isActive) return false;
    if (isSuperAdmin) return true;
    return hasModule(checkModule);
  }, [isActive, isSuperAdmin, hasModule]);

  const isAdmin = isSuperAdmin || hasModule('admin' as Modulo);

  return {
    isLoading,
    error,
    isActive,
    modules,
    hasModule,
    canAccessModule,
    isAdmin,
    refetch: fetchUserPermissions,
  };
}

// ============================================
// HOOK PARA ADMIN: GERENCIAR MÓDULOS
// ============================================

interface UseAdminRBACReturn {
  fetchUserModules: (userId: string) => Promise<UserModule[]>;
  addUserModule: (userId: string, module: Modulo) => Promise<void>;
  removeUserModule: (userId: string, module: Modulo) => Promise<void>;
  setUserModules: (userId: string, modules: Modulo[]) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useAdminRBAC(): UseAdminRBACReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserModules = useCallback(async (userId: string): Promise<UserModule[]> => {
    const { data, error } = await supabase
      .from('user_modules')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return (data || []) as UserModule[];
  }, []);

  const addUserModule = useCallback(async (userId: string, module: Modulo): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: catalog } = await supabase
        .from('module_permissions_catalog')
        .select('permission_code')
        .eq('module_code', module as string);

      const permissions = (catalog || []).map((c: any) => c.permission_code);

      const { error } = await supabase
        .from('user_modules')
        .insert({ user_id: userId, module, permissions } as any);
      
      if (error && !error.message.includes('duplicate')) throw error;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeUserModule = useCallback(async (userId: string, module: Modulo): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('user_modules')
        .delete()
        .eq('user_id', userId)
        .eq('module', module as any);
      
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setUserModules = useCallback(async (userId: string, modules: Modulo[]): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await supabase
        .from('user_modules')
        .delete()
        .eq('user_id', userId);
      
      if (modules.length > 0) {
        const { data: catalog } = await supabase
          .from('module_permissions_catalog')
          .select('module_code, permission_code')
          .in('module_code', modules as string[]);

        const permsByModule = (catalog || []).reduce<Record<string, string[]>>((acc, c: any) => {
          if (!acc[c.module_code]) acc[c.module_code] = [];
          acc[c.module_code].push(c.permission_code);
          return acc;
        }, {});

        const inserts = modules.map(module => ({
          user_id: userId,
          module,
          permissions: permsByModule[module] || [],
        }));
        
        const { error } = await supabase
          .from('user_modules')
          .insert(inserts as any);
        
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    fetchUserModules,
    addUserModule,
    removeUserModule,
    setUserModules,
    isLoading,
    error,
  };
}

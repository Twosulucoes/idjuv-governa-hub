// ============================================
// HOOK PRINCIPAL DO SISTEMA RBAC
// Baseado na spec: .lovable/specs/rbac-spec.md
// ============================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { AppRole, UserRole, UserModule, Modulo } from '@/types/rbac';

interface UseRBACReturn {
  // Estado
  isLoading: boolean;
  error: string | null;
  
  // Contexto do usuário
  isActive: boolean;
  role: AppRole | null;
  modules: Modulo[];
  
  // Verificações
  hasRole: (role: AppRole) => boolean;
  hasModule: (module: Modulo) => boolean;
  canAccessModule: (module: Modulo) => boolean;
  isAdmin: boolean;
  isManager: boolean;
  
  // Refresh
  refetch: () => Promise<void>;
}

export function useRBAC(): UseRBACReturn {
  const { user, isSuperAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
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
      // Buscar profile para verificar is_active
      const { data: profileData } = await supabase
        .from('profiles')
        .select('is_active')
        .eq('id', user.id)
        .maybeSingle();

      setIsActive(profileData?.is_active ?? false);

      // Buscar role do usuário
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (roleError) throw roleError;
      setUserRole(roleData as UserRole | null);

      // Buscar módulos do usuário
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

  // Derivações
  const role = userRole?.role ?? null;
  const modules = useMemo(() => 
    userModules.map(m => m.module as Modulo), 
    [userModules]
  );

  // Verificações
  const hasRole = useCallback((checkRole: AppRole): boolean => {
    return role === checkRole;
  }, [role]);

  const hasModule = useCallback((checkModule: Modulo): boolean => {
    return modules.includes(checkModule);
  }, [modules]);

  const canAccessModule = useCallback((checkModule: Modulo): boolean => {
    if (!isActive) return false;
    if (isSuperAdmin || role === 'admin') return true;
    return hasModule(checkModule);
  }, [isActive, isSuperAdmin, role, hasModule]);

  const isAdmin = isSuperAdmin || role === 'admin';
  const isManager = role === 'manager';

  return {
    isLoading,
    error,
    isActive,
    role,
    modules,
    hasRole,
    hasModule,
    canAccessModule,
    isAdmin,
    isManager,
    refetch: fetchUserPermissions,
  };
}

// ============================================
// HOOK PARA ADMIN: GERENCIAR PERMISSÕES
// ============================================

interface UseAdminRBACReturn {
  // Listar
  fetchUserRoles: () => Promise<UserRole[]>;
  fetchUserModules: (userId: string) => Promise<UserModule[]>;
  
  // Gerenciar roles
  setUserRole: (userId: string, role: AppRole) => Promise<void>;
  
  // Gerenciar módulos
  addUserModule: (userId: string, module: Modulo) => Promise<void>;
  removeUserModule: (userId: string, module: Modulo) => Promise<void>;
  setUserModules: (userId: string, modules: Modulo[]) => Promise<void>;
  
  // Estado
  isLoading: boolean;
  error: string | null;
}

export function useAdminRBAC(): UseAdminRBACReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRoles = useCallback(async (): Promise<UserRole[]> => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .order('created_at');
    
    if (error) throw error;
    return (data || []) as UserRole[];
  }, []);

  const fetchUserModules = useCallback(async (userId: string): Promise<UserModule[]> => {
    const { data, error } = await supabase
      .from('user_modules')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return (data || []) as UserModule[];
  }, []);

  const setUserRole = useCallback(async (userId: string, role: AppRole): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role }, { onConflict: 'user_id' });
      
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addUserModule = useCallback(async (userId: string, module: Modulo): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('user_modules')
        .insert({ user_id: userId, module });
      
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
        .eq('module', module);
      
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
      // Remover todos os módulos atuais
      await supabase
        .from('user_modules')
        .delete()
        .eq('user_id', userId);
      
      // Inserir novos módulos
      if (modules.length > 0) {
        const inserts = modules.map(module => ({
          user_id: userId,
          module
        }));
        
        const { error } = await supabase
          .from('user_modules')
          .insert(inserts);
        
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
    fetchUserRoles,
    fetchUserModules,
    setUserRole,
    addUserModule,
    removeUserModule,
    setUserModules,
    isLoading,
    error,
  };
}

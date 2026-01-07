// ============================================
// CONTEXTO DE AUTENTICAÇÃO E PERMISSÕES
// ============================================

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthUser, AppRole, AppPermission, AuthState } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';

// ============================================
// INTERFACE DO CONTEXTO
// ============================================

interface AuthContextType extends AuthState {
  // Funções de autenticação
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  
  // Funções de verificação de permissões
  hasPermission: (permission: AppPermission) => boolean;
  hasAnyPermission: (permissions: AppPermission[]) => boolean;
  hasAllPermissions: (permissions: AppPermission[]) => boolean;
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
  canAccess: (requiredRoles: AppRole[]) => boolean;
  
  // Refresh de dados
  refreshUser: () => Promise<void>;
}

// ============================================
// CRIAÇÃO DO CONTEXTO
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// PROVIDER DO CONTEXTO
// ============================================

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // ============================================
  // FUNÇÕES AUXILIARES
  // ============================================

  // Busca os dados completos do usuário (profile, role, permissions)
  const fetchUserData = useCallback(async (authUser: User): Promise<AuthUser | null> => {
    try {
      // Buscar profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      // Buscar role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authUser.id)
        .maybeSingle();

      // Buscar permissões diretas
      const { data: directPermissions } = await supabase
        .from('user_permissions')
        .select('permission')
        .eq('user_id', authUser.id);

      // Buscar permissões do role
      const userRole = (roleData?.role as AppRole) || 'user';
      const { data: rolePermissions } = await supabase
        .from('role_permissions')
        .select('permission')
        .eq('role', userRole);

      // Combinar permissões únicas
      const allPermissions = new Set<AppPermission>();
      directPermissions?.forEach(p => allPermissions.add(p.permission as AppPermission));
      rolePermissions?.forEach(p => allPermissions.add(p.permission as AppPermission));

      return {
        id: authUser.id,
        email: authUser.email || '',
        fullName: profile?.full_name || null,
        avatarUrl: profile?.avatar_url || null,
        role: userRole,
        permissions: Array.from(allPermissions)
      };
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      return null;
    }
  }, []);

  // ============================================
  // EFEITOS
  // ============================================

  useEffect(() => {
    // Configurar listener de mudanças de autenticação PRIMEIRO
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        
        if (session?.user) {
          // Usar setTimeout para evitar deadlock
          setTimeout(() => {
            fetchUserData(session.user).then(userData => {
              setUser(userData);
              setIsLoading(false);
            });
          }, 0);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    // DEPOIS verificar sessão existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserData(session.user).then(userData => {
          setUser(userData);
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  // ============================================
  // FUNÇÕES DE AUTENTICAÇÃO
  // ============================================

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao entrar",
          description: error.message === 'Invalid login credentials' 
            ? 'Email ou senha incorretos'
            : error.message
        });
        return { error };
      }

      toast({
        title: "Bem-vindo!",
        description: "Login realizado com sucesso."
      });

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName
          }
        }
      });

      if (error) {
        let message = error.message;
        if (error.message.includes('already registered')) {
          message = 'Este email já está cadastrado';
        }
        
        toast({
          variant: "destructive",
          title: "Erro ao cadastrar",
          description: message
        });
        return { error };
      }

      toast({
        title: "Conta criada!",
        description: "Você já pode fazer login."
      });

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      
      toast({
        title: "Até logo!",
        description: "Você saiu do sistema."
      });
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  const refreshUser = async () => {
    if (session?.user) {
      const userData = await fetchUserData(session.user);
      setUser(userData);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/auth?mode=reset`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao enviar email",
          description: error.message
        });
        return { error };
      }

      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir a senha."
      });

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao atualizar senha",
          description: error.message
        });
        return { error };
      }

      toast({
        title: "Senha atualizada!",
        description: "Sua nova senha foi salva com sucesso."
      });

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // ============================================
  // FUNÇÕES DE VERIFICAÇÃO DE PERMISSÕES
  // ============================================

  // Verifica se usuário tem uma permissão específica
  const hasPermission = useCallback((permission: AppPermission): boolean => {
    if (!user) return false;
    // Admin tem todas as permissões
    if (user.role === 'admin') return true;
    return user.permissions.includes(permission);
  }, [user]);

  // Verifica se usuário tem pelo menos uma das permissões
  const hasAnyPermission = useCallback((permissions: AppPermission[]): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return permissions.some(permission => user.permissions.includes(permission));
  }, [user]);

  // Verifica se usuário tem todas as permissões
  const hasAllPermissions = useCallback((permissions: AppPermission[]): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return permissions.every(permission => user.permissions.includes(permission));
  }, [user]);

  // Verifica se usuário tem um role específico
  const hasRole = useCallback((role: AppRole): boolean => {
    if (!user) return false;
    return user.role === role;
  }, [user]);

  // Verifica se usuário tem pelo menos um dos roles
  const hasAnyRole = useCallback((roles: AppRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  }, [user]);

  // Verifica se usuário pode acessar (baseado em hierarquia de roles)
  const canAccess = useCallback((requiredRoles: AppRole[]): boolean => {
    if (!user) return false;
    // Admin sempre pode acessar
    if (user.role === 'admin') return true;
    return requiredRoles.includes(user.role);
  }, [user]);

  // ============================================
  // VALOR DO CONTEXTO
  // ============================================

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    canAccess,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================
// HOOK PARA USAR O CONTEXTO
// ============================================

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

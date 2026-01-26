// ============================================
// CONTEXTO DE AUTENTICAÇÃO - SUPABASE EXTERNO
// ============================================

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, clearOldSessions, isSupabaseConfigured } from '@/lib/supabase';
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
  
  // Status da conexão
  isConfigured: boolean;
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
  const [isConfigured] = useState(isSupabaseConfigured());
  const { toast } = useToast();

  // ============================================
  // FUNÇÕES AUXILIARES
  // ============================================

  // Busca os dados completos do usuário (profile, perfis, permissões)
  const fetchUserData = useCallback(async (authUser: User): Promise<AuthUser | null> => {
    try {
      // Buscar profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      // Buscar perfis do usuário via usuario_perfis
      const { data: usuarioPerfis } = await supabase
        .from('usuario_perfis')
        .select(`
          perfil:perfis(codigo, nome, nivel_hierarquia)
        `)
        .eq('user_id', authUser.id)
        .eq('ativo', true);

      // Determinar role principal (maior nível hierárquico)
      let userRole: AppRole = 'user';
      if (usuarioPerfis && usuarioPerfis.length > 0) {
        const perfis = usuarioPerfis
          .map((up: any) => up.perfil)
          .filter(Boolean)
          .sort((a: any, b: any) => (b.nivel_hierarquia || 0) - (a.nivel_hierarquia || 0));
        
        if (perfis[0]?.codigo) {
          // Mapear código do perfil para AppRole
          const codigoToRole: Record<string, AppRole> = {
            'super_admin': 'admin',
            'admin': 'admin',
            'gerente': 'manager',
            'operador': 'user',
            'consulta': 'guest',
          };
          userRole = codigoToRole[perfis[0].codigo] || 'user';
        }
      }

      // Buscar permissões via RPC
      const { data: permissoesData } = await supabase.rpc('listar_permissoes_usuario', {
        check_user_id: authUser.id
      });

      const permissions: AppPermission[] = permissoesData
        ?.map((p: any) => p.funcao_codigo as AppPermission)
        .filter(Boolean) || [];

      return {
        id: authUser.id,
        email: authUser.email || '',
        fullName: profile?.full_name || null,
        avatarUrl: profile?.avatar_url || null,
        role: userRole,
        permissions
      };
    } catch (error) {
      console.error('[Auth] Erro ao buscar dados do usuário:', error);
      // Retorna usuário básico mesmo com erro
      return {
        id: authUser.id,
        email: authUser.email || '',
        fullName: null,
        avatarUrl: null,
        role: 'user',
        permissions: []
      };
    }
  }, []);

  // ============================================
  // EFEITOS
  // ============================================

  useEffect(() => {
    if (!isConfigured) {
      console.warn('[Auth] Supabase não configurado');
      setIsLoading(false);
      return;
    }

    // Limpar sessões antigas na inicialização
    clearOldSessions();

    // Configurar listener de mudanças de autenticação PRIMEIRO
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[Auth] Estado alterado:', event);
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
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.warn('[Auth] Erro ao recuperar sessão:', error.message);
        // Limpar sessão corrompida
        supabase.auth.signOut();
        setIsLoading(false);
        return;
      }

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
  }, [fetchUserData, isConfigured]);

  // ============================================
  // FUNÇÕES DE AUTENTICAÇÃO
  // ============================================

  const signIn = async (email: string, password: string) => {
    if (!isConfigured) {
      return { error: new Error('Supabase não configurado') };
    }

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
    if (!isConfigured) {
      return { error: new Error('Supabase não configurado') };
    }

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
    if (!isConfigured) {
      return { error: new Error('Supabase não configurado') };
    }

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
    if (!isConfigured) {
      return { error: new Error('Supabase não configurado') };
    }

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

  const hasPermission = useCallback((permission: AppPermission): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.permissions.includes(permission);
  }, [user]);

  const hasAnyPermission = useCallback((permissions: AppPermission[]): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return permissions.some(permission => user.permissions.includes(permission));
  }, [user]);

  const hasAllPermissions = useCallback((permissions: AppPermission[]): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return permissions.every(permission => user.permissions.includes(permission));
  }, [user]);

  const hasRole = useCallback((role: AppRole): boolean => {
    if (!user) return false;
    return user.role === role;
  }, [user]);

  const hasAnyRole = useCallback((roles: AppRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  }, [user]);

  const canAccess = useCallback((requiredRoles: AppRole[]): boolean => {
    if (!user) return false;
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
    isConfigured,
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

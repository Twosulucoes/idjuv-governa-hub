// ============================================
// CONTEXTO DE AUTENTICAÇÃO - FASE 6
// ============================================
// Sistema baseado EXCLUSIVAMENTE em permissões
// Roles são derivados do banco, nunca hardcoded

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, clearOldSessions, isSupabaseConfigured } from '@/lib/supabase';
import { AuthUser, PermissionCode, PermissaoUsuario, AuthState } from '@/types/auth';
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
  
  // ============================================
  // FUNÇÕES DE VERIFICAÇÃO DE PERMISSÕES
  // ============================================
  
  /**
   * Verifica se usuário tem uma permissão específica
   * @param codigo Código da permissão (ex: 'rh.servidores.criar')
   */
  hasPermission: (codigo: PermissionCode) => boolean;
  
  /**
   * Verifica se usuário tem QUALQUER uma das permissões
   * @param codigos Array de códigos de permissão
   */
  hasAnyPermission: (codigos: PermissionCode[]) => boolean;
  
  /**
   * Verifica se usuário tem TODAS as permissões
   * @param codigos Array de códigos de permissão
   */
  hasAllPermissions: (codigos: PermissionCode[]) => boolean;
  
  /**
   * Verifica se usuário é super_admin (bypass total)
   */
  isSuperAdmin: boolean;
  
  /**
   * Obtém todas as permissões do usuário
   */
  getUserPermissions: () => PermissionCode[];
  
  /**
   * Obtém permissões detalhadas (com metadados)
   */
  getPermissoesDetalhadas: () => PermissaoUsuario[];
  
  // Refresh de dados
  refreshUser: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
  
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
  // BUSCA DE PERMISSÕES VIA RPC
  // ============================================

  const fetchPermissoes = useCallback(async (userId: string): Promise<{
    permissions: PermissionCode[];
    permissoesDetalhadas: PermissaoUsuario[];
    isSuperAdmin: boolean;
  }> => {
    try {
      // Verificar se é super_admin via RPC dedicado
      const { data: isSuperAdminResult } = await supabase.rpc('usuario_eh_super_admin', {
        check_user_id: userId
      });
      
      const isSuperAdmin = isSuperAdminResult === true;

      // Buscar permissões detalhadas via RPC
      const { data: permissoesData, error } = await supabase.rpc('listar_permissoes_usuario', {
        check_user_id: userId
      });

      if (error) {
        console.error('[Auth] Erro ao buscar permissões:', error);
        return { permissions: [], permissoesDetalhadas: [], isSuperAdmin };
      }

      const permissoesDetalhadas: PermissaoUsuario[] = permissoesData || [];
      const permissions: PermissionCode[] = permissoesDetalhadas
        .map(p => p.funcao_codigo)
        .filter(Boolean);

      return { permissions, permissoesDetalhadas, isSuperAdmin };
    } catch (error) {
      console.error('[Auth] Erro ao buscar permissões:', error);
      return { permissions: [], permissoesDetalhadas: [], isSuperAdmin: false };
    }
  }, []);

  // ============================================
  // BUSCA DADOS COMPLETOS DO USUÁRIO
  // ============================================

  const fetchUserData = useCallback(async (authUser: User): Promise<AuthUser | null> => {
    try {
      // Buscar profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      // Buscar permissões
      const { permissions, permissoesDetalhadas, isSuperAdmin } = await fetchPermissoes(authUser.id);

      return {
        id: authUser.id,
        email: authUser.email || '',
        fullName: profile?.full_name || null,
        avatarUrl: profile?.avatar_url || null,
        permissions,
        permissoesDetalhadas,
        isSuperAdmin,
        servidorId: profile?.servidor_id || undefined,
        tipoUsuario: profile?.tipo_usuario || undefined,
      };
    } catch (error) {
      console.error('[Auth] Erro ao buscar dados do usuário:', error);
      // Retorna usuário básico mesmo com erro
      return {
        id: authUser.id,
        email: authUser.email || '',
        fullName: null,
        avatarUrl: null,
        permissions: [],
        permissoesDetalhadas: [],
        isSuperAdmin: false,
      };
    }
  }, [fetchPermissoes]);

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

  const refreshPermissions = async () => {
    if (user && session?.user) {
      const { permissions, permissoesDetalhadas, isSuperAdmin } = await fetchPermissoes(session.user.id);
      setUser(prev => prev ? {
        ...prev,
        permissions,
        permissoesDetalhadas,
        isSuperAdmin,
      } : null);
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

  /**
   * Verifica se usuário tem uma permissão específica
   * Super Admin tem bypass total
   */
  const hasPermission = useCallback((codigo: PermissionCode): boolean => {
    if (!user) return false;
    
    // Super Admin tem todas as permissões
    if (user.isSuperAdmin) return true;
    
    // Verificar permissão exata
    if (user.permissions.includes(codigo)) return true;
    
    // Verificar permissão pai (ex: 'rh' permite 'rh.servidores.criar')
    const partes = codigo.split('.');
    for (let i = partes.length - 1; i > 0; i--) {
      const permissaoPai = partes.slice(0, i).join('.');
      if (user.permissions.includes(permissaoPai)) return true;
    }
    
    return false;
  }, [user]);

  /**
   * Verifica se usuário tem QUALQUER uma das permissões
   */
  const hasAnyPermission = useCallback((codigos: PermissionCode[]): boolean => {
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    if (!codigos || codigos.length === 0) return true;
    
    return codigos.some(codigo => hasPermission(codigo));
  }, [user, hasPermission]);

  /**
   * Verifica se usuário tem TODAS as permissões
   */
  const hasAllPermissions = useCallback((codigos: PermissionCode[]): boolean => {
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    if (!codigos || codigos.length === 0) return true;
    
    return codigos.every(codigo => hasPermission(codigo));
  }, [user, hasPermission]);

  /**
   * Obtém todas as permissões do usuário
   */
  const getUserPermissions = useCallback((): PermissionCode[] => {
    return user?.permissions || [];
  }, [user]);

  /**
   * Obtém permissões detalhadas
   */
  const getPermissoesDetalhadas = useCallback((): PermissaoUsuario[] => {
    return user?.permissoesDetalhadas || [];
  }, [user]);

  // ============================================
  // VALOR DO CONTEXTO
  // ============================================

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isConfigured,
    isSuperAdmin: user?.isSuperAdmin || false,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getUserPermissions,
    getPermissoesDetalhadas,
    refreshUser,
    refreshPermissions,
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

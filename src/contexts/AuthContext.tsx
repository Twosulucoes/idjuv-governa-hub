// ============================================
// CONTEXTO DE AUTENTICAÇÃO — VERSÃO DEFINITIVA
// ============================================
// Estratégia: onAuthStateChange é a ÚNICA fonte de verdade.
// signIn/signOut apenas disparam a ação — o listener processa o resultado.
// Sem race conditions, sem duplicação.

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { AuthUser, PermissionCode, PermissaoUsuario, AuthState } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  hasPermission: (codigo: PermissionCode) => boolean;
  hasAnyPermission: (codigos: PermissionCode[]) => boolean;
  hasAllPermissions: (codigos: PermissionCode[]) => boolean;
  isSuperAdmin: boolean;
  getUserPermissions: () => PermissionCode[];
  getPermissoesDetalhadas: () => PermissaoUsuario[];
  refreshUser: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type PermissionsResult = {
  permissions: PermissionCode[];
  permissoesDetalhadas: PermissaoUsuario[];
  isSuperAdmin: boolean;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured] = useState(isSupabaseConfigured());
  const permissionsCache = useRef<Map<string, { data: PermissionsResult; ts: number }>>(new Map());
  const { toast } = useToast();
  // Controla se está processando um evento para evitar duplicatas
  const processingRef = useRef(false);

  const CACHE_TTL_MS = 60_000;

  // ============================================
  // BUSCA DE PERMISSÕES
  // ============================================

  const fetchPermissoes = useCallback(async (userId: string): Promise<PermissionsResult> => {
    const cached = permissionsCache.current.get(userId);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const [rolesResponse, modulesResponse] = await Promise.all([
        supabase.from('user_roles').select('role').eq('user_id', userId),
        supabase.from('user_modules').select('module').eq('user_id', userId),
      ]);

      if (rolesResponse.error) console.error('[Auth] Erro user_roles:', rolesResponse.error);
      if (modulesResponse.error) console.error('[Auth] Erro user_modules:', modulesResponse.error);

      const isSuperAdmin = (rolesResponse.data || []).some((r: any) => r.role === 'admin');
      const permissions: PermissionCode[] = (modulesResponse.data || []).map((m: any) => m.module as PermissionCode);

      const permissoesDetalhadas: PermissaoUsuario[] = permissions.map(p => ({
        funcao_id: p,
        funcao_codigo: p,
        funcao_nome: p,
        modulo: p,
        submodulo: null,
        tipo_acao: 'access',
        perfil_nome: isSuperAdmin ? 'Super Admin' : 'Usuário',
        rota: null,
        icone: null,
      }));

      console.log('[Auth] Permissões — isSuperAdmin:', isSuperAdmin, '| módulos:', permissions);

      const result: PermissionsResult = { permissions, permissoesDetalhadas, isSuperAdmin };
      permissionsCache.current.set(userId, { data: result, ts: Date.now() });
      return result;
    } catch (error) {
      console.error('[Auth] Exceção ao buscar permissões:', error);
      return { permissions: [], permissoesDetalhadas: [], isSuperAdmin: false };
    }
  }, []);

  // ============================================
  // BUSCA DADOS DO USUÁRIO
  // ============================================

  const fetchUserData = useCallback(async (authUser: User): Promise<AuthUser> => {
    console.log('[Auth] fetchUserData:', authUser.email);

    try {
      const [profileResponse, permissionsResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle(),
        fetchPermissoes(authUser.id),
      ]);

      const profile = profileResponse.data;
      const { permissions, permissoesDetalhadas, isSuperAdmin } = permissionsResult;

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
        requiresPasswordChange: profile?.requires_password_change || false,
      };
    } catch (error) {
      console.error('[Auth] Exceção em fetchUserData:', error);
      return {
        id: authUser.id,
        email: authUser.email || '',
        fullName: null,
        avatarUrl: null,
        permissions: [],
        permissoesDetalhadas: [],
        isSuperAdmin: false,
        requiresPasswordChange: false,
      };
    }
  }, [fetchPermissoes]);

  // ============================================
  // INICIALIZAÇÃO — onAuthStateChange é a ÚNICA fonte de verdade
  // ============================================

  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    // O listener processa TODOS os eventos de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!isMounted) return;
      console.log('[Auth] onAuthStateChange:', event, currentSession?.user?.email || 'sem sessão');

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        permissionsCache.current.clear();
        setIsLoading(false);
        return;
      }

      if (event === 'TOKEN_REFRESHED' && currentSession) {
        setSession(currentSession);
        return;
      }

      if (
        (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') &&
        currentSession?.user
      ) {
        setSession(currentSession);
        permissionsCache.current.delete(currentSession.user.id);
        const userData = await fetchUserData(currentSession.user);
        if (isMounted) {
          setUser(userData);
          setIsLoading(false);
        }
        return;
      }

      // Sem sessão no INITIAL_SESSION
      if (event === 'INITIAL_SESSION' && !currentSession) {
        setSession(null);
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserData, isConfigured]);

  // ============================================
  // AUTENTICAÇÃO
  // ============================================

  const signIn = async (email: string, password: string) => {
    if (!isConfigured) return { error: new Error('Sistema não configurado') };

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erro ao entrar',
          description: error.message === 'Invalid login credentials'
            ? 'Email ou senha incorretos'
            : error.message,
        });
        return { error };
      }

      // O onAuthStateChange (SIGNED_IN) vai processar o resultado automaticamente
      toast({ title: 'Bem-vindo!', description: 'Login realizado com sucesso.' });
      return { error: null };
    } catch (error) {
      console.error('[Auth] Exceção no signIn:', error);
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!isConfigured) return { error: new Error('Sistema não configurado') };

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { full_name: fullName },
        },
      });

      if (error) {
        const message = error.message.includes('already registered')
          ? 'Este email já está cadastrado'
          : error.message;
        toast({ variant: 'destructive', title: 'Erro ao cadastrar', description: message });
        return { error };
      }

      toast({ title: 'Conta criada!', description: 'Você já pode fazer login.' });
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      permissionsCache.current.clear();
      await supabase.auth.signOut({ scope: 'local' });
      toast({ title: 'Até logo!', description: 'Você saiu do sistema.' });
    } catch (error) {
      console.error('Erro ao sair:', error);
      // Força limpeza mesmo com erro
      setUser(null);
      setSession(null);
    }
  };

  const refreshUser = async () => {
    if (!session?.user) return;
    permissionsCache.current.delete(session.user.id);
    const userData = await fetchUserData(session.user);
    setUser(userData);
  };

  const refreshPermissions = async () => {
    if (!user || !session?.user) return;
    permissionsCache.current.delete(session.user.id);
    const { permissions, permissoesDetalhadas, isSuperAdmin } = await fetchPermissoes(session.user.id);
    setUser({ ...user, permissions, permissoesDetalhadas, isSuperAdmin });
  };

  // ============================================
  // PERMISSÕES
  // ============================================

  const hasPermission = useCallback((codigo: PermissionCode): boolean => {
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    if (user.permissions.includes(codigo)) return true;

    const partes = codigo.split('.');
    for (let i = partes.length - 1; i > 0; i--) {
      const pai = partes.slice(0, i).join('.');
      if (user.permissions.includes(pai)) return true;
    }
    return false;
  }, [user]);

  const hasAnyPermission = useCallback((codigos: PermissionCode[]): boolean => {
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    if (!codigos?.length) return true;
    return codigos.some(c => hasPermission(c));
  }, [user, hasPermission]);

  const hasAllPermissions = useCallback((codigos: PermissionCode[]): boolean => {
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    if (!codigos?.length) return true;
    return codigos.every(c => hasPermission(c));
  }, [user, hasPermission]);

  const getUserPermissions = useCallback((): PermissionCode[] => user?.permissions || [], [user]);
  const getPermissoesDetalhadas = useCallback((): PermissaoUsuario[] => user?.permissoesDetalhadas || [], [user]);

  const resetPassword = async (email: string) => {
    if (!isConfigured) return { error: new Error('Sistema não configurado') };
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });
      if (error) {
        toast({ variant: 'destructive', title: 'Erro ao enviar email', description: error.message });
        return { error };
      }
      toast({ title: 'Email enviado!', description: 'Verifique sua caixa de entrada.' });
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const updatePassword = async (newPassword: string) => {
    if (!isConfigured) return { error: new Error('Sistema não configurado') };
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast({ variant: 'destructive', title: 'Erro ao atualizar senha', description: error.message });
        return { error };
      }
      toast({ title: 'Senha atualizada!', description: 'Sua nova senha foi salva.' });
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // ============================================
  // CONTEXTO
  // ============================================

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!session,
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
// HOOK
// ============================================

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    if (import.meta.hot) {
      console.warn('[Auth] Context not found - HMR reload');
      return {
        user: null,
        isLoading: true,
        isAuthenticated: false,
        isConfigured: true,
        isSuperAdmin: false,
        signIn: async () => ({ error: new Error('Context not ready') }),
        signUp: async () => ({ error: new Error('Context not ready') }),
        signOut: async () => {},
        resetPassword: async () => ({ error: new Error('Context not ready') }),
        updatePassword: async () => ({ error: new Error('Context not ready') }),
        hasPermission: () => false,
        hasAnyPermission: () => false,
        hasAllPermissions: () => false,
        getUserPermissions: () => [],
        getPermissoesDetalhadas: () => [],
        refreshUser: async () => {},
        refreshPermissions: async () => {},
      } as AuthContextType;
    }
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};


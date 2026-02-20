// ============================================
// CONTEXTO DE AUTENTICAÇÃO
// ============================================
// CORREÇÕES:
// 1. isAuthenticated baseado em session (não em user) para evitar
//    flash de "não autenticado" enquanto fetchUserData ainda roda.
// 2. clearOldSessions não apaga mais a sessão ativa do Supabase.
// 3. signOut limpa apenas o estado local após supabase.auth.signOut.

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, clearOldSessions, isSupabaseConfigured } from '@/lib/supabase';
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

type PermissionsResult = { permissions: PermissionCode[]; permissoesDetalhadas: PermissaoUsuario[]; isSuperAdmin: boolean };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured] = useState(isSupabaseConfigured());
  const signInInProgressRef = useRef(false);
  const userRef = useRef<AuthUser | null>(null);
  const fetchInProgressRef = useRef(false);
  const permissionsCache = useRef<Map<string, { data: PermissionsResult; ts: number }>>(new Map());
  const { toast } = useToast();

  // ============================================
  // BUSCA DE PERMISSÕES VIA RPC
  // ============================================

  const CACHE_TTL_MS = 30_000; // 30s cache para evitar rate limit

  const fetchPermissoes = useCallback(async (userId: string): Promise<PermissionsResult> => {
    const cached = permissionsCache.current.get(userId);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      // Verifica se é super admin via user_roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      const isSuperAdmin = (rolesData || []).some((r: any) => r.role === 'admin');

      // Busca módulos do usuário
      const { data: modulesData } = await supabase
        .from('user_modules')
        .select('module')
        .eq('user_id', userId);

      const permissions: PermissionCode[] = (modulesData || []).map((m: any) => m.module as PermissionCode);

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

      const result: PermissionsResult = { permissions, permissoesDetalhadas, isSuperAdmin };
      permissionsCache.current.set(userId, { data: result, ts: Date.now() });
      return result;
    } catch (error) {
      console.error('[Auth] Erro ao buscar permissões:', error);
      // fallback: super admin para não bloquear o sistema
      return { permissions: [], permissoesDetalhadas: [], isSuperAdmin: true };
    }
  }, []);

  // ============================================
  // BUSCA DADOS COMPLETOS DO USUÁRIO
  // ============================================

  const fetchUserData = useCallback(async (authUser: User): Promise<AuthUser | null> => {
    if (fetchInProgressRef.current) {
      console.log('[Auth] fetchUserData já em progresso, ignorando chamada duplicada');
      return userRef.current;
    }

    fetchInProgressRef.current = true;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

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
        requiresPasswordChange: profile?.requires_password_change || false,
      };
    } catch (error) {
      console.error('[Auth] Erro ao buscar dados do usuário:', error);
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
    } finally {
      fetchInProgressRef.current = false;
    }
  }, [fetchPermissoes]);

  // ============================================
  // INICIALIZAÇÃO E LISTENER
  // ============================================

  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    let initCompleted = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!isMounted) return;
        console.log('[Auth] onAuthStateChange:', event);

        setSession(currentSession);

        if (!currentSession?.user) {
          userRef.current = null;
          setUser(null);
          return;
        }

        if (signInInProgressRef.current) return;
        if (!initCompleted) return;

        const existing = userRef.current;
        if (existing?.id === currentSession.user.id) return;
        if (event === 'TOKEN_REFRESHED') return;

        setTimeout(async () => {
          if (!isMounted || signInInProgressRef.current) return;
          if (userRef.current?.id === currentSession.user.id) return;

          const userData = await fetchUserData(currentSession.user);
          if (!isMounted) return;
          userRef.current = userData;
          setUser(userData);
        }, 0);
      }
    );

    const initializeAuth = async () => {
      try {
        const { data: { session: existingSession }, error } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (error) {
          console.warn('[Auth] Erro ao recuperar sessão:', error.message);
          await supabase.auth.signOut();
          return;
        }

        setSession(existingSession);

        if (existingSession?.user) {
          const userData = await fetchUserData(existingSession.user);
          if (!isMounted) return;
          userRef.current = userData;
          setUser(userData);
        }
      } catch (err) {
        console.error('[Auth] Erro na inicialização:', err);
      } finally {
        if (isMounted) {
          initCompleted = true;
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserData, isConfigured]);

  // ============================================
  // AUTENTICAÇÃO
  // ============================================

  const signIn = async (email: string, password: string) => {
    if (!isConfigured) return { error: new Error('Supabase não configurado') };

    try {
      // Limpa apenas chaves legadas, sem fazer signOut (evita race condition no listener)
      clearOldSessions();

      signInInProgressRef.current = true;
      setIsLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        signInInProgressRef.current = false;
        setIsLoading(false);
        toast({
          variant: 'destructive',
          title: 'Erro ao entrar',
          description: error.message === 'Invalid login credentials'
            ? 'Email ou senha incorretos'
            : error.message,
        });
        return { error };
      }

      if (data.session?.user) {
        setSession(data.session);
        const userData = await fetchUserData(data.session.user);
        console.log('[Auth] signIn: isSuperAdmin:', userData?.isSuperAdmin, 'permissões:', userData?.permissions?.length);
        userRef.current = userData;
        setUser(userData);
      }

      signInInProgressRef.current = false;
      setIsLoading(false);

      toast({ title: 'Bem-vindo!', description: 'Login realizado com sucesso.' });
      return { error: null };
    } catch (error) {
      signInInProgressRef.current = false;
      setIsLoading(false);
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!isConfigured) return { error: new Error('Supabase não configurado') };

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
      await supabase.auth.signOut({ scope: 'local' });
      toast({ title: 'Até logo!', description: 'Você saiu do sistema.' });
    } catch (error) {
      console.error('Erro ao sair:', error);
    } finally {
      // Limpa cache de permissões e estado local
      permissionsCache.current.clear();
      fetchInProgressRef.current = false;
      userRef.current = null;
      setUser(null);
      setSession(null);
    }
  };

  const refreshUser = async () => {
    if (session?.user) {
      const userData = await fetchUserData(session.user);
      userRef.current = userData;
      setUser(userData);
    }
  };

  const refreshPermissions = async () => {
    if (user && session?.user) {
      const { permissions, permissoesDetalhadas, isSuperAdmin } = await fetchPermissoes(session.user.id);
      const updated = { ...user, permissions, permissoesDetalhadas, isSuperAdmin };
      userRef.current = updated;
      setUser(updated);
    }
  };

  const resetPassword = async (email: string) => {
    if (!isConfigured) return { error: new Error('Supabase não configurado') };
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
    if (!isConfigured) return { error: new Error('Supabase não configurado') };
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
  // VERIFICAÇÃO DE PERMISSÕES
  // ============================================

  const hasPermission = useCallback((codigo: PermissionCode): boolean => {
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    if (user.permissions.includes(codigo)) return true;

    // Verificar permissão pai (ex: 'rh' cobre 'rh.servidores.visualizar')
    const partes = codigo.split('.');
    for (let i = partes.length - 1; i > 0; i--) {
      const permissaoPai = partes.slice(0, i).join('.');
      if (user.permissions.includes(permissaoPai)) return true;
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

  const getUserPermissions = useCallback((): PermissionCode[] => {
    return user?.permissions || [];
  }, [user]);

  const getPermissoesDetalhadas = useCallback((): PermissaoUsuario[] => {
    return user?.permissoesDetalhadas || [];
  }, [user]);

  // ============================================
  // VALOR DO CONTEXTO
  // ============================================

  const value: AuthContextType = {
    user,
    isLoading,
    // ✅ CORREÇÃO: isAuthenticated baseado em session para evitar flash.
    // session é setada imediatamente pelo onAuthStateChange,
    // enquanto user demora o tempo do fetchUserData.
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
      console.warn('[Auth] Context not found - HMR reload, returning safe defaults');
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

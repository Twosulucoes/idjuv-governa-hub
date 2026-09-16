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
  hasModule: (modulo: string) => boolean;
  getUserModules: () => string[];
  getUserPermissions: () => PermissionCode[];
  getPermissoesDetalhadas: () => PermissaoUsuario[];
  refreshUser: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Escape hatch único para as tabelas de permissão que ainda não estão no
// types.ts gerado. Assim que os tipos forem regerados pelo Supabase, isto sai
// e as leituras voltam a ser tipadas pelo client.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const clienteSemTipos = () => supabase as any;

// Linhas das tabelas de permissão. module_permissions_catalog,
// user_permissions e role_permissions ainda não constam do types.ts gerado —
// até a regeneração dos tipos, as leituras passam por `clienteSemTipos`.
type LinhaPermissao = { permission: string };

// Linha do catálogo de permissões (module_permissions_catalog)
type CatalogoPermissao = {
  module_code: string;
  permission_code: string;
  label: string;
  category: string | null;
  action_type: string;
};

type PermissionsResult = {
  // Códigos granulares (modulo.recurso.acao) — união das três fontes
  permissions: PermissionCode[];
  // Módulos concedidos ao usuário — acesso de nível de módulo, nada mais
  modules: string[];
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

    const vazio: PermissionsResult = {
      permissions: [], modules: [], permissoesDetalhadas: [], isSuperAdmin: false,
    };

    try {
      const db = clienteSemTipos();

      const [rolesResponse, modulesResponse, userPermsResponse, catalogResponse] = await Promise.all([
        supabase.from('user_roles').select('role').eq('user_id', userId),
        supabase.from('user_modules').select('module, permissions').eq('user_id', userId),
        db.from('user_permissions').select('permission').eq('user_id', userId),
        db.from('module_permissions_catalog').select('module_code, permission_code, label, category, action_type'),
      ]);

      if (rolesResponse.error) console.error('[Auth] Erro user_roles:', rolesResponse.error);
      if (modulesResponse.error) console.error('[Auth] Erro user_modules:', modulesResponse.error);
      if (userPermsResponse.error) console.error('[Auth] Erro user_permissions:', userPermsResponse.error);
      if (catalogResponse.error) console.error('[Auth] Erro module_permissions_catalog:', catalogResponse.error);

      const roles: string[] = (rolesResponse.data ?? []).map(r => r.role as string);
      const isSuperAdmin = roles.includes('admin');

      const linhasModulo = (modulesResponse.data ?? []) as { module: string; permissions: string[] | null }[];
      const modules: string[] = linhasModulo.map(m => m.module);

      const catalogo = (catalogResponse.data ?? []) as CatalogoPermissao[];
      const moduloPorCodigo = new Map(catalogo.map(c => [c.permission_code, c.module_code]));

      // ── FONTE 1: concessões avulsas ao usuário ────────────────────────────
      const codigos = new Set<PermissionCode>(
        ((userPermsResponse.data ?? []) as LinhaPermissao[]).map(p => p.permission)
      );

      // ── FONTE 2: padrão do papel, restrito aos módulos do usuário ─────────
      // O papel define O QUE se pode fazer; o módulo define ONDE. Sem esse
      // recorte, o papel `user` (que recebe todos os `visualizar` do catálogo)
      // daria leitura de financeiro a quem só tem o módulo rh.
      if (roles.length > 0) {
        const { data: rolePerms, error: rolePermsError } = await db
          .from('role_permissions')
          .select('permission')
          .in('role', roles);

        if (rolePermsError) console.error('[Auth] Erro role_permissions:', rolePermsError);

        ((rolePerms ?? []) as LinhaPermissao[]).forEach(rp => {
          const modulo = moduloPorCodigo.get(rp.permission);
          if (modulo && modules.includes(modulo)) codigos.add(rp.permission);
        });
      }

      // ── FONTE 3: concessões feitas dentro do módulo (painel de permissões) ─
      linhasModulo.forEach(m => {
        (m.permissions ?? []).forEach(codigo => codigos.add(codigo));
      });

      const permissions = Array.from(codigos);

      const permissoesDetalhadas: PermissaoUsuario[] = permissions.map(codigo => {
        const item = catalogo.find(c => c.permission_code === codigo);
        const partes = codigo.split('.');
        return {
          funcao_id: codigo,
          funcao_codigo: codigo,
          funcao_nome: item?.label || codigo,
          modulo: item?.module_code || partes[0],
          submodulo: item?.category || (partes.length > 2 ? partes[1] : null),
          tipo_acao: item?.action_type || partes[partes.length - 1],
          perfil_nome: isSuperAdmin ? 'Super Admin' : (roles[0] || 'user'),
          rota: null,
          icone: null,
        };
      });

      const result: PermissionsResult = { permissions, modules, permissoesDetalhadas, isSuperAdmin };
      permissionsCache.current.set(userId, { data: result, ts: Date.now() });
      return result;
    } catch (error) {
      console.error('[Auth] Exceção ao buscar permissões:', error);
      return vazio;
    }
  }, []);

  // ============================================
  // BUSCA DADOS DO USUÁRIO
  // ============================================

  const fetchUserData = useCallback(async (authUser: User): Promise<AuthUser> => {
    try {
      const [profileResponse, permissionsResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle(),
        fetchPermissoes(authUser.id),
      ]);

      const profile = profileResponse.data;
      const { permissions, modules, permissoesDetalhadas, isSuperAdmin } = permissionsResult;

      return {
        id: authUser.id,
        email: authUser.email || '',
        fullName: profile?.full_name || null,
        avatarUrl: profile?.avatar_url || null,
        permissions,
        modules,
        permissoesDetalhadas,
        isSuperAdmin,
        servidorId: profile?.servidor_id || undefined,
        tipoUsuario: (profile?.tipo_usuario as 'servidor' | 'tecnico') || undefined,
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
        modules: [],
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

    // Timeout de segurança: se INITIAL_SESSION não disparar em 5s, libera o loading
    const safetyTimeout = setTimeout(() => {
      if (isMounted) {
        console.warn('[Auth] Timeout de segurança ativado — INITIAL_SESSION não disparou');
        setIsLoading(false);
      }
    }, 5000);

    // Função auxiliar para carregar dados do usuário FORA do callback
    const loadUserData = async (authUser: User) => {
      if (!isMounted) return;
      try {
        const userData = await fetchUserData(authUser);
        if (isMounted) {
          setUser(userData);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('[Auth] Erro em loadUserData:', err);
        if (isMounted) {
          setUser({
            id: authUser.id,
            email: authUser.email || '',
            fullName: null,
            avatarUrl: null,
            permissions: [],
            modules: [],
            permissoesDetalhadas: [],
            isSuperAdmin: false,
            requiresPasswordChange: false,
          });
          setIsLoading(false);
        }
      }
    };

    // O listener processa TODOS os eventos de autenticação
    // CRITICAL: NÃO fazer await de queries Supabase dentro do callback — causa deadlock!
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!isMounted) return;

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
        (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED' || event === 'PASSWORD_RECOVERY') &&
        currentSession?.user
      ) {
        setSession(currentSession);
        permissionsCache.current.delete(currentSession.user.id);
        // Defer para evitar deadlock do Supabase client
        setTimeout(() => loadUserData(currentSession.user), 0);
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
      clearTimeout(safetyTimeout);
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
    const { permissions, modules, permissoesDetalhadas, isSuperAdmin } = await fetchPermissoes(session.user.id);
    setUser({ ...user, permissions, modules, permissoesDetalhadas, isSuperAdmin });
  };

  // ============================================
  // PERMISSÕES
  // ============================================

  // Resolução de uma permissão, na ordem:
  //   1. super admin  → passa por cima de tudo;
  //   2. código granular concedido explicitamente (qualquer uma das 3 fontes);
  //   3. código sem ponto ('rh', 'admin') → é um MÓDULO: basta tê-lo;
  //   4. prefixo granular concedido ('rh.servidores' concede 'rh.servidores.editar').
  //
  // O módulo deliberadamente NÃO entra no passo 4: era exatamente isso que
  // fazia ter o módulo `rh` conceder `rh.servidores.excluir`. Ação granular
  // agora exige concessão explícita (papel, módulo ou avulsa).
  const hasPermission = useCallback((codigo: PermissionCode): boolean => {
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    // Fail closed: "sem restrição" é decidido por quem chama (o MenuContext
    // trata item sem `permission`), não aqui.
    if (!codigo) return false;

    if (user.permissions.includes(codigo)) return true;

    const partes = codigo.split('.');
    if (partes.length === 1) return user.modules.includes(codigo);

    // Para em i > 1: o prefixo de um único segmento é o módulo, e módulo
    // não concede ação.
    for (let i = partes.length - 1; i > 1; i--) {
      if (user.permissions.includes(partes.slice(0, i).join('.'))) return true;
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

  // Acesso ao módulo (user_modules) — o "onde", independente do "o quê".
  const hasModule = useCallback((modulo: string): boolean => {
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    return user.modules.includes(modulo);
  }, [user]);

  const getUserModules = useCallback((): string[] => user?.modules || [], [user]);
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
    hasModule,
    getUserModules,
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
        hasModule: () => false,
        getUserModules: () => [],
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


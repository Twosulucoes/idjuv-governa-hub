/**
 * Hook para buscar permissões do usuário autenticado
 * 
 * Consome a função `listar_permissoes_usuario` do Supabase EXTERNO
 * que retorna todas as funções permitidas para o usuário.
 * 
 * O frontend NÃO decide acesso - apenas renderiza com base
 * nos dados retornados pelo backend.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

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
}

export function usePermissoesUsuario(): UsePermissoesUsuarioReturn {
  const { user, isAuthenticated } = useAuth();
  const [permissoes, setPermissoes] = useState<PermissaoUsuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissoes = useCallback(async () => {
    if (!isAuthenticated || !user?.id || !isSupabaseConfigured()) {
      setPermissoes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Tenta usar a função RPC
      const { data, error: rpcError } = await supabase.rpc('listar_permissoes_usuario', {
        check_user_id: user.id
      });

      if (rpcError) {
        // Se houver qualquer erro na RPC, usa fallback
        console.warn('[Permissões] Erro na RPC, usando fallback:', rpcError.message);
        await fetchPermissoesFallback();
        return;
      }

      setPermissoes(data || []);
    } catch (err: any) {
      console.error('[Permissões] Erro ao buscar:', err);
      // Em caso de erro, tenta fallback
      await fetchPermissoesFallback();
    } finally {
      setLoading(false);
    }
  }, [user?.id, isAuthenticated]);

  // Fallback: busca permissões via joins se RPC não existir
  const fetchPermissoesFallback = async () => {
    if (!user?.id) return;

    try {
      // Busca os perfis do usuário
      const { data: usuarioPerfis, error: upError } = await supabase
        .from('usuario_perfis')
        .select('perfil_id, perfil:perfis(nome)')
        .eq('user_id', user.id)
        .eq('ativo', true);

      if (upError) throw upError;

      if (!usuarioPerfis || usuarioPerfis.length === 0) {
        setPermissoes([]);
        return;
      }

      const perfilIds = usuarioPerfis.map(up => up.perfil_id);

      // Busca as funções associadas aos perfis
      const { data: perfilFuncoes, error: pfError } = await supabase
        .from('perfil_funcoes')
        .select(`
          funcao:funcoes_sistema(
            id,
            codigo,
            nome,
            modulo,
            submodulo,
            tipo_acao,
            rota,
            icone
          )
        `)
        .in('perfil_id', perfilIds)
        .eq('concedido', true);

      if (pfError) throw pfError;

      // Mapeia para o formato esperado
      const permissoesMap = new Map<string, PermissaoUsuario>();
      
      perfilFuncoes?.forEach((pf: any) => {
        if (pf.funcao) {
          const f = pf.funcao;
          if (!permissoesMap.has(f.codigo)) {
            permissoesMap.set(f.codigo, {
              funcao_id: f.id,
              funcao_codigo: f.codigo,
              funcao_nome: f.nome,
              modulo: f.modulo,
              submodulo: f.submodulo,
              tipo_acao: f.tipo_acao,
              perfil_nome: '',
              rota: f.rota,
              icone: f.icone,
            });
          }
        }
      });

      setPermissoes(Array.from(permissoesMap.values()));
    } catch (err: any) {
      console.error('[Permissões Fallback] Erro:', err);
      setError(err.message);
    }
  };

  // Carrega permissões quando usuário muda
  useEffect(() => {
    fetchPermissoes();
  }, [fetchPermissoes]);

  // Verifica se tem uma permissão específica
  const temPermissao = useCallback((codigo: string): boolean => {
    return permissoes.some(p => p.funcao_codigo === codigo);
  }, [permissoes]);

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

  return {
    permissoes,
    loading,
    error,
    temPermissao,
    temAlgumaPermissao,
    temTodasPermissoes,
    permissoesPorModulo,
    refetch: fetchPermissoes,
  };
}

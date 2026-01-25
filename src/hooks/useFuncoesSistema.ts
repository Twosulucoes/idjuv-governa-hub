// ============================================
// HOOK DE GERENCIAMENTO DE FUNÇÕES DO SISTEMA
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { getActiveSupabaseClient } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import type { FuncaoSistema, FuncaoArvore } from '@/types/perfis';

export function useFuncoesSistema() {
  const [funcoes, setFuncoes] = useState<FuncaoSistema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Buscar todas as funções
  const fetchFuncoes = useCallback(async () => {
    const supabase = getActiveSupabaseClient();
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('funcoes_sistema')
        .select('*')
        .order('modulo')
        .order('ordem');

      if (fetchError) throw fetchError;
      setFuncoes(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao buscar funções:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFuncoes();
  }, [fetchFuncoes]);

  // Criar função
  const criarFuncao = async (funcao: Omit<FuncaoSistema, 'id' | 'created_at' | 'updated_at'>) => {
    const supabase = getActiveSupabaseClient();
    try {
      const { data, error } = await supabase
        .from('funcoes_sistema')
        .insert(funcao)
        .select()
        .single();

      if (error) throw error;

      setFuncoes(prev => [...prev, data]);
      toast({ title: 'Função criada com sucesso!' });
      return data;
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro ao criar função', description: err.message });
      throw err;
    }
  };

  // Atualizar função
  const atualizarFuncao = async (id: string, updates: Partial<FuncaoSistema>) => {
    const supabase = getActiveSupabaseClient();
    try {
      const { data, error } = await supabase
        .from('funcoes_sistema')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setFuncoes(prev => prev.map(f => f.id === id ? data : f));
      toast({ title: 'Função atualizada com sucesso!' });
      return data;
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar função', description: err.message });
      throw err;
    }
  };

  // Excluir função
  const excluirFuncao = async (id: string) => {
    const supabase = getActiveSupabaseClient();
    try {
      const { error } = await supabase
        .from('funcoes_sistema')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFuncoes(prev => prev.filter(f => f.id !== id));
      toast({ title: 'Função excluída com sucesso!' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro ao excluir função', description: err.message });
      throw err;
    }
  };

  // Construir árvore hierárquica de funções
  const construirArvore = useCallback((): FuncaoArvore[] => {
    const funcaoMap = new Map<string, FuncaoArvore>();
    
    // Criar mapa de funções
    funcoes.forEach(f => {
      funcaoMap.set(f.id, { ...f, filhos: [] });
    });

    const raizes: FuncaoArvore[] = [];

    // Construir hierarquia
    funcoes.forEach(f => {
      const funcao = funcaoMap.get(f.id)!;
      if (f.funcao_pai_id && funcaoMap.has(f.funcao_pai_id)) {
        funcaoMap.get(f.funcao_pai_id)!.filhos.push(funcao);
      } else {
        raizes.push(funcao);
      }
    });

    // Ordenar por ordem
    const ordenar = (arr: FuncaoArvore[]) => {
      arr.sort((a, b) => a.ordem - b.ordem);
      arr.forEach(f => ordenar(f.filhos));
    };
    ordenar(raizes);

    return raizes;
  }, [funcoes]);

  // Agrupar por módulo
  const agruparPorModulo = useCallback((): Record<string, FuncaoArvore[]> => {
    const arvore = construirArvore();
    const grupos: Record<string, FuncaoArvore[]> = {};
    
    arvore.forEach(f => {
      if (!grupos[f.modulo]) {
        grupos[f.modulo] = [];
      }
      grupos[f.modulo].push(f);
    });

    return grupos;
  }, [construirArvore]);

  return {
    funcoes,
    loading,
    error,
    fetchFuncoes,
    criarFuncao,
    atualizarFuncao,
    excluirFuncao,
    construirArvore,
    agruparPorModulo
  };
}

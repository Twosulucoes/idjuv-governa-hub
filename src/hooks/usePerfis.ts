// ============================================
// HOOK DE GERENCIAMENTO DE PERFIS
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Perfil, PerfilArvore } from '@/types/perfis';

export function usePerfis() {
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Buscar todos os perfis
  const fetchPerfis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('perfis')
        .select('*')
        .order('nivel_hierarquia', { ascending: false });

      if (fetchError) throw fetchError;
      setPerfis(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao buscar perfis:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPerfis();
  }, [fetchPerfis]);

  // Criar perfil
  const criarPerfil = async (perfil: Omit<Perfil, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>) => {
    try {
      const { data, error } = await supabase
        .from('perfis')
        .insert(perfil)
        .select()
        .single();

      if (error) throw error;

      setPerfis(prev => [...prev, data]);
      toast({ title: 'Perfil criado com sucesso!' });
      return data;
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro ao criar perfil', description: err.message });
      throw err;
    }
  };

  // Atualizar perfil
  const atualizarPerfil = async (id: string, updates: Partial<Perfil>) => {
    try {
      const { data, error } = await supabase
        .from('perfis')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setPerfis(prev => prev.map(p => p.id === id ? data : p));
      toast({ title: 'Perfil atualizado com sucesso!' });
      return data;
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar perfil', description: err.message });
      throw err;
    }
  };

  // Excluir perfil
  const excluirPerfil = async (id: string) => {
    try {
      const perfil = perfis.find(p => p.id === id);
      if (perfil?.is_sistema) {
        throw new Error('Não é possível excluir perfis de sistema');
      }

      const { error } = await supabase
        .from('perfis')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPerfis(prev => prev.filter(p => p.id !== id));
      toast({ title: 'Perfil excluído com sucesso!' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro ao excluir perfil', description: err.message });
      throw err;
    }
  };

  // Construir árvore hierárquica de perfis
  const construirArvore = useCallback((): PerfilArvore[] => {
    const perfilMap = new Map<string, PerfilArvore>();
    
    // Criar mapa de perfis
    perfis.forEach(p => {
      perfilMap.set(p.id, { ...p, filhos: [] });
    });

    const raizes: PerfilArvore[] = [];

    // Construir hierarquia
    perfis.forEach(p => {
      const perfil = perfilMap.get(p.id)!;
      if (p.perfil_pai_id && perfilMap.has(p.perfil_pai_id)) {
        perfilMap.get(p.perfil_pai_id)!.filhos.push(perfil);
      } else {
        raizes.push(perfil);
      }
    });

    // Ordenar por nível hierárquico
    const ordenar = (arr: PerfilArvore[]) => {
      arr.sort((a, b) => b.nivel_hierarquia - a.nivel_hierarquia);
      arr.forEach(p => ordenar(p.filhos));
    };
    ordenar(raizes);

    return raizes;
  }, [perfis]);

  return {
    perfis,
    loading,
    error,
    fetchPerfis,
    criarPerfil,
    atualizarPerfil,
    excluirPerfil,
    construirArvore
  };
}

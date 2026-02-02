// ============================================
// HOOK DE PERFIS RBAC (NOVO)
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Perfil, PerfilPermissao, Permissao } from '@/types/rbac';

export function useAdminPerfis() {
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      setPerfis((data || []) as Perfil[]);
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
  const criarPerfil = async (dados: Partial<Perfil>) => {
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('perfis')
        .insert({
          nome: dados.nome,
          descricao: dados.descricao,
          nivel: dados.nivel || 'operacional',
          nivel_hierarquia: dados.nivel_hierarquia || 10,
          perfil_pai_id: dados.perfil_pai_id,
          ativo: dados.ativo ?? true,
          is_sistema: false,
          cor: dados.cor,
          icone: dados.icone,
        })
        .select()
        .single();

      if (error) throw error;

      setPerfis(prev => [...prev, data as Perfil]);
      toast({ title: 'Perfil criado com sucesso!' });
      return data as Perfil;
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro ao criar perfil', description: err.message });
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Atualizar perfil
  const atualizarPerfil = async (id: string, updates: Partial<Perfil>) => {
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('perfis')
        .update({
          nome: updates.nome,
          descricao: updates.descricao,
          nivel: updates.nivel,
          nivel_hierarquia: updates.nivel_hierarquia,
          perfil_pai_id: updates.perfil_pai_id,
          ativo: updates.ativo,
          cor: updates.cor,
          icone: updates.icone,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setPerfis(prev => prev.map(p => p.id === id ? data as Perfil : p));
      toast({ title: 'Perfil atualizado!' });
      return data as Perfil;
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar perfil', description: err.message });
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Excluir perfil (apenas não-sistema)
  const excluirPerfil = async (id: string) => {
    const perfil = perfis.find(p => p.id === id);
    if (perfil?.is_sistema) {
      toast({ variant: 'destructive', title: 'Não é possível excluir perfis de sistema' });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('perfis')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPerfis(prev => prev.filter(p => p.id !== id));
      toast({ title: 'Perfil excluído!' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro ao excluir perfil', description: err.message });
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Buscar permissões de um perfil
  const buscarPermissoesDoPerfil = async (perfilId: string): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from('perfil_permissoes')
        .select('permissao_id')
        .eq('perfil_id', perfilId)
        .eq('concedido', true);

      if (error) throw error;
      return (data || []).map(p => p.permissao_id);
    } catch (err: any) {
      console.error('Erro ao buscar permissões do perfil:', err);
      return [];
    }
  };

  // Alternar permissão do perfil
  const alternarPermissaoPerfil = async (perfilId: string, permissaoId: string, conceder: boolean) => {
    setSaving(true);
    try {
      if (conceder) {
        // Inserir ou atualizar
        const { error } = await supabase
          .from('perfil_permissoes')
          .upsert({
            perfil_id: perfilId,
            permissao_id: permissaoId,
            concedido: true,
          }, {
            onConflict: 'perfil_id,permissao_id'
          });

        if (error) throw error;
      } else {
        // Remover ou marcar como não concedido
        const { error } = await supabase
          .from('perfil_permissoes')
          .delete()
          .eq('perfil_id', perfilId)
          .eq('permissao_id', permissaoId);

        if (error) throw error;
      }

      toast({ title: conceder ? 'Permissão concedida' : 'Permissão removida' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar permissão', description: err.message });
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return {
    perfis,
    perfisAtivos: perfis.filter(p => p.ativo),
    loading,
    saving,
    error,
    fetchPerfis,
    criarPerfil,
    atualizarPerfil,
    excluirPerfil,
    buscarPermissoesDoPerfil,
    alternarPermissaoPerfil,
  };
}

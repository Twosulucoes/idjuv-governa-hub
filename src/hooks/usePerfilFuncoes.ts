// ============================================
// HOOK DE GERENCIAMENTO DE PERMISSÕES (PERFIL-FUNÇÃO)
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { PerfilFuncao } from '@/types/perfis';

export function usePerfilFuncoes(perfilId?: string) {
  const [permissoes, setPermissoes] = useState<PerfilFuncao[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Buscar permissões de um perfil
  const fetchPermissoes = useCallback(async (id?: string) => {
    const targetId = id || perfilId;
    if (!targetId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('perfil_funcoes')
        .select('*, funcao:funcoes_sistema(*)')
        .eq('perfil_id', targetId);

      if (error) throw error;
      setPermissoes(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar permissões:', err);
    } finally {
      setLoading(false);
    }
  }, [perfilId]);

  useEffect(() => {
    if (perfilId) {
      fetchPermissoes(perfilId);
    }
  }, [perfilId, fetchPermissoes]);

  // Verificar se perfil tem permissão para uma função
  const temPermissao = useCallback((funcaoId: string): boolean => {
    return permissoes.some(p => p.funcao_id === funcaoId && p.concedido);
  }, [permissoes]);

  // Conceder permissão
  const concederPermissao = async (perfilIdParam: string, funcaoId: string) => {
    setSaving(true);
    try {
      // Verificar se já existe
      const existente = permissoes.find(p => p.perfil_id === perfilIdParam && p.funcao_id === funcaoId);

      if (existente) {
        // Atualizar para concedido
        const { error } = await supabase
          .from('perfil_funcoes')
          .update({ concedido: true })
          .eq('id', existente.id);

        if (error) throw error;
        setPermissoes(prev => prev.map(p => 
          p.id === existente.id ? { ...p, concedido: true } : p
        ));
      } else {
        // Criar nova permissão
        const { data, error } = await supabase
          .from('perfil_funcoes')
          .insert({ perfil_id: perfilIdParam, funcao_id: funcaoId, concedido: true })
          .select()
          .single();

        if (error) throw error;
        setPermissoes(prev => [...prev, data]);
      }

      toast({ title: 'Permissão concedida!' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro ao conceder permissão', description: err.message });
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Revogar permissão
  const revogarPermissao = async (perfilIdParam: string, funcaoId: string) => {
    setSaving(true);
    try {
      const existente = permissoes.find(p => p.perfil_id === perfilIdParam && p.funcao_id === funcaoId);

      if (existente) {
        const { error } = await supabase
          .from('perfil_funcoes')
          .update({ concedido: false })
          .eq('id', existente.id);

        if (error) throw error;
        setPermissoes(prev => prev.map(p => 
          p.id === existente.id ? { ...p, concedido: false } : p
        ));
      }

      toast({ title: 'Permissão revogada!' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro ao revogar permissão', description: err.message });
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Alternar permissão
  const alternarPermissao = async (perfilIdParam: string, funcaoId: string) => {
    const tem = permissoes.some(p => p.perfil_id === perfilIdParam && p.funcao_id === funcaoId && p.concedido);
    if (tem) {
      await revogarPermissao(perfilIdParam, funcaoId);
    } else {
      await concederPermissao(perfilIdParam, funcaoId);
    }
  };

  // Buscar todas as permissões (para matriz)
  const fetchTodasPermissoes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('perfil_funcoes')
        .select('*');

      if (error) throw error;
      setPermissoes(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar todas as permissões:', err);
    } finally {
      setLoading(false);
    }
  };

  // Verificar permissão genérica (para qualquer perfil)
  const verificarPermissao = useCallback((perfilIdCheck: string, funcaoId: string): boolean => {
    return permissoes.some(p => p.perfil_id === perfilIdCheck && p.funcao_id === funcaoId && p.concedido);
  }, [permissoes]);

  return {
    permissoes,
    loading,
    saving,
    fetchPermissoes,
    fetchTodasPermissoes,
    temPermissao,
    verificarPermissao,
    concederPermissao,
    revogarPermissao,
    alternarPermissao
  };
}

// ============================================
// HOOK DE GERENCIAMENTO DE USUÁRIO-PERFIS
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { getActiveSupabaseClient } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import type { UsuarioPerfil } from '@/types/perfis';

interface UsuarioComPerfis {
  id: string;
  email: string;
  full_name: string | null;
  perfis: UsuarioPerfil[];
}

export function useUsuarioPerfis(userId?: string) {
  const [usuarioPerfis, setUsuarioPerfis] = useState<UsuarioPerfil[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioComPerfis[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Buscar perfis de um usuário
  const fetchPerfisDoUsuario = useCallback(async (id?: string) => {
    const supabase = getActiveSupabaseClient();
    const targetId = id || userId;
    if (!targetId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('usuario_perfis')
        .select('*, perfil:perfis(*)')
        .eq('user_id', targetId)
        .eq('ativo', true);

      if (error) throw error;
      setUsuarioPerfis(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar perfis do usuário:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchPerfisDoUsuario(userId);
    }
  }, [userId, fetchPerfisDoUsuario]);

  // Buscar todos os usuários com seus perfis
  const fetchUsuariosComPerfis = async () => {
    const supabase = getActiveSupabaseClient();
    setLoading(true);
    try {
      // Buscar usuários
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('is_active', true)
        .order('full_name');

      if (profilesError) throw profilesError;

      // Buscar associações usuário-perfil
      const { data: associacoesData, error: associacoesError } = await supabase
        .from('usuario_perfis')
        .select('*, perfil:perfis(*)')
        .eq('ativo', true);

      if (associacoesError) throw associacoesError;

      // Montar estrutura
      const usuariosComPerfis: UsuarioComPerfis[] = (profilesData || []).map(user => ({
        id: user.id,
        email: user.email || '',
        full_name: user.full_name,
        perfis: (associacoesData || []).filter(a => a.user_id === user.id)
      }));

      setUsuarios(usuariosComPerfis);
    } catch (err: any) {
      console.error('Erro ao buscar usuários com perfis:', err);
    } finally {
      setLoading(false);
    }
  };

  // Verificar se usuário tem um perfil
  const temPerfil = useCallback((perfilId: string): boolean => {
    return usuarioPerfis.some(up => up.perfil_id === perfilId && up.ativo);
  }, [usuarioPerfis]);

  // Associar perfil a usuário
  const associarPerfil = async (userIdParam: string, perfilId: string) => {
    const supabase = getActiveSupabaseClient();
    setSaving(true);
    try {
      // Verificar se já existe
      const { data: existente } = await supabase
        .from('usuario_perfis')
        .select('id, ativo')
        .eq('user_id', userIdParam)
        .eq('perfil_id', perfilId)
        .single();

      if (existente) {
        // Reativar se estava inativo
        if (!existente.ativo) {
          const { error } = await supabase
            .from('usuario_perfis')
            .update({ ativo: true, data_inicio: new Date().toISOString(), data_fim: null })
            .eq('id', existente.id);

          if (error) throw error;
        }
      } else {
        // Criar nova associação
        const { error } = await supabase
          .from('usuario_perfis')
          .insert({ user_id: userIdParam, perfil_id: perfilId, ativo: true });

        if (error) throw error;
      }

      toast({ title: 'Perfil associado ao usuário!' });
      if (userId === userIdParam) {
        await fetchPerfisDoUsuario(userIdParam);
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro ao associar perfil', description: err.message });
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Desassociar perfil de usuário
  const desassociarPerfil = async (userIdParam: string, perfilId: string) => {
    const supabase = getActiveSupabaseClient();
    setSaving(true);
    try {
      const { error } = await supabase
        .from('usuario_perfis')
        .update({ ativo: false, data_fim: new Date().toISOString() })
        .eq('user_id', userIdParam)
        .eq('perfil_id', perfilId);

      if (error) throw error;

      toast({ title: 'Perfil removido do usuário!' });
      if (userId === userIdParam) {
        await fetchPerfisDoUsuario(userIdParam);
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro ao remover perfil', description: err.message });
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Alternar perfil
  const alternarPerfil = async (userIdParam: string, perfilId: string) => {
    const tem = usuarioPerfis.some(up => up.user_id === userIdParam && up.perfil_id === perfilId && up.ativo);
    if (tem) {
      await desassociarPerfil(userIdParam, perfilId);
    } else {
      await associarPerfil(userIdParam, perfilId);
    }
  };

  return {
    usuarioPerfis,
    usuarios,
    loading,
    saving,
    fetchPerfisDoUsuario,
    fetchUsuariosComPerfis,
    temPerfil,
    associarPerfil,
    desassociarPerfil,
    alternarPerfil
  };
}

// ============================================
// HOOK DE USUÁRIOS RBAC (NOVO)
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { UsuarioAdmin, UsuarioPerfil, Perfil } from '@/types/rbac';

export function useAdminUsuarios() {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Buscar todos os usuários com seus perfis
  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Buscar profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, is_active, tipo_usuario, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Buscar associações usuário-perfil
      const { data: associacoes, error: associacoesError } = await supabase
        .from('usuario_perfis')
        .select('*, perfil:perfis(*)')
        .eq('ativo', true);

      if (associacoesError) throw associacoesError;

      // Combinar dados
      const usuariosData: UsuarioAdmin[] = (profiles || []).map(p => ({
        id: p.id,
        email: p.email || '',
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        is_active: p.is_active ?? true,
        tipo_usuario: p.tipo_usuario || 'servidor',
        created_at: p.created_at,
        perfis: (associacoes || [])
          .filter(a => a.user_id === p.id)
          .map(a => ({
            id: a.id,
            user_id: a.user_id,
            perfil_id: a.perfil_id,
            ativo: a.ativo,
            data_inicio: a.data_inicio,
            data_fim: a.data_fim,
            created_at: a.created_at,
            created_by: a.created_by,
            perfil: a.perfil as Perfil,
          })),
      }));

      setUsuarios(usuariosData);
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao buscar usuários:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  // Associar perfil a usuário
  const associarPerfil = async (userId: string, perfilId: string) => {
    setSaving(true);
    try {
      // Verificar se já existe
      const { data: existente } = await supabase
        .from('usuario_perfis')
        .select('id, ativo')
        .eq('user_id', userId)
        .eq('perfil_id', perfilId)
        .single();

      if (existente) {
        if (!existente.ativo) {
          // Reativar
          const { error } = await supabase
            .from('usuario_perfis')
            .update({ 
              ativo: true, 
              data_inicio: new Date().toISOString(), 
              data_fim: null 
            })
            .eq('id', existente.id);

          if (error) throw error;
        }
      } else {
        // Criar nova associação
        const { error } = await supabase
          .from('usuario_perfis')
          .insert({ 
            user_id: userId, 
            perfil_id: perfilId, 
            ativo: true 
          });

        if (error) throw error;
      }

      toast({ title: 'Perfil associado ao usuário!' });
      await fetchUsuarios();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro ao associar perfil', description: err.message });
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Desassociar perfil de usuário
  const desassociarPerfil = async (userId: string, perfilId: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('usuario_perfis')
        .update({ 
          ativo: false, 
          data_fim: new Date().toISOString() 
        })
        .eq('user_id', userId)
        .eq('perfil_id', perfilId);

      if (error) throw error;

      toast({ title: 'Perfil removido do usuário!' });
      await fetchUsuarios();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro ao remover perfil', description: err.message });
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Bloquear/desbloquear usuário
  const toggleUsuarioAtivo = async (userId: string, ativo: boolean, motivo?: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_active: ativo,
          blocked_at: ativo ? null : new Date().toISOString(),
          blocked_reason: ativo ? null : motivo,
        })
        .eq('id', userId);

      if (error) throw error;

      toast({ title: ativo ? 'Usuário desbloqueado' : 'Usuário bloqueado' });
      await fetchUsuarios();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message });
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return {
    usuarios,
    usuariosAtivos: usuarios.filter(u => u.is_active),
    loading,
    saving,
    error,
    fetchUsuarios,
    associarPerfil,
    desassociarPerfil,
    toggleUsuarioAtivo,
  };
}

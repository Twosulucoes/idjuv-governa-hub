// ============================================
// HOOK DE USUÁRIOS (SISTEMA SIMPLIFICADO)
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { UsuarioAdmin, Modulo, PerfilCodigo, Perfil } from '@/types/rbac';

export function useAdminUsuarios() {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Buscar todos os usuários com seus perfis e módulos
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
      const { data: perfilAssociacoes, error: perfilError } = await supabase
        .from('usuario_perfis')
        .select('*, perfil:perfis(id, nome, codigo, descricao, pode_aprovar, created_at)');

      if (perfilError) throw perfilError;

      // Buscar módulos dos usuários
      const { data: modulosData, error: modulosError } = await supabase
        .from('usuario_modulos')
        .select('*');

      if (modulosError) throw modulosError;

      // Combinar dados
      const usuariosData: UsuarioAdmin[] = (profiles || []).map(p => {
        const perfilAssoc = (perfilAssociacoes || []).find(a => a.user_id === p.id);
        const modulosUsuario = (modulosData || [])
          .filter(m => m.user_id === p.id)
          .map(m => m.modulo as Modulo);

        // Mapear o perfil aninhado
        let perfilMapeado: { id: string; user_id: string; perfil_id: string; created_at: string; created_by: string | null; perfil?: Perfil } | null = null;
        
        if (perfilAssoc) {
          const perfilDB = perfilAssoc.perfil as any;
          perfilMapeado = {
            id: perfilAssoc.id,
            user_id: perfilAssoc.user_id,
            perfil_id: perfilAssoc.perfil_id,
            created_at: perfilAssoc.created_at,
            created_by: perfilAssoc.created_by,
            perfil: perfilDB ? {
              id: perfilDB.id,
              nome: perfilDB.nome,
              codigo: perfilDB.codigo as PerfilCodigo,
              descricao: perfilDB.descricao,
              pode_aprovar: perfilDB.pode_aprovar ?? (perfilDB.codigo === 'super_admin' || perfilDB.codigo === 'gestor'),
              created_at: perfilDB.created_at,
            } : undefined,
          };
        }

        return {
          id: p.id,
          email: p.email || '',
          full_name: p.full_name,
          avatar_url: p.avatar_url,
          is_active: p.is_active ?? true,
          tipo_usuario: (p.tipo_usuario || 'servidor') as 'servidor' | 'tecnico',
          created_at: p.created_at,
          perfil: perfilMapeado,
          modulos: modulosUsuario,
        };
      });

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

  // Definir perfil do usuário
  const definirPerfil = async (userId: string, perfilCodigo: PerfilCodigo | null) => {
    setSaving(true);
    try {
      if (perfilCodigo === null) {
        // Remover perfil
        const { error } = await supabase
          .from('usuario_perfis')
          .delete()
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Buscar ID do perfil
        const { data: perfil, error: perfilError } = await supabase
          .from('perfis')
          .select('id')
          .eq('codigo', perfilCodigo)
          .single();

        if (perfilError) throw perfilError;

        // Upsert associação
        const { error } = await supabase
          .from('usuario_perfis')
          .upsert({
            user_id: userId,
            perfil_id: perfil.id,
          }, {
            onConflict: 'user_id',
          });

        if (error) throw error;
      }

      toast({ title: 'Perfil atualizado!' });
      await fetchUsuarios();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro ao definir perfil', description: err.message });
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Adicionar módulo ao usuário
  const adicionarModulo = async (userId: string, modulo: Modulo) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('usuario_modulos')
        .insert({
          user_id: userId,
          modulo,
        });

      if (error) throw error;

      toast({ title: 'Módulo adicionado!' });
      await fetchUsuarios();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro ao adicionar módulo', description: err.message });
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Remover módulo do usuário
  const removerModulo = async (userId: string, modulo: Modulo) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('usuario_modulos')
        .delete()
        .eq('user_id', userId)
        .eq('modulo', modulo);

      if (error) throw error;

      toast({ title: 'Módulo removido!' });
      await fetchUsuarios();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro ao remover módulo', description: err.message });
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Toggle módulo
  const toggleModulo = async (userId: string, modulo: Modulo, temAtualmente: boolean) => {
    if (temAtualmente) {
      await removerModulo(userId, modulo);
    } else {
      await adicionarModulo(userId, modulo);
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
    definirPerfil,
    adicionarModulo,
    removerModulo,
    toggleModulo,
    toggleUsuarioAtivo,
  };
}

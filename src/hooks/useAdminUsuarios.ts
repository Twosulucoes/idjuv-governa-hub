// ============================================
// HOOK DE USUÁRIOS (SISTEMA DE MÓDULOS)
// Gerencia user_modules - sem conceito de role
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { UsuarioAdmin, Modulo } from '@/types/rbac';

export function useAdminUsuarios() {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, is_active, tipo_usuario, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: modulosData, error: modulosError } = await supabase
        .from('user_modules')
        .select('*');

      if (modulosError) throw modulosError;

      const usuariosData: UsuarioAdmin[] = (profiles || []).map(p => {
        const modulosUsuario = (modulosData || [])
          .filter((m: any) => m.user_id === p.id)
          .map((m: any) => m.module as Modulo);

        return {
          id: p.id,
          email: p.email || '',
          full_name: p.full_name,
          avatar_url: p.avatar_url,
          is_active: p.is_active ?? true,
          tipo_usuario: (p.tipo_usuario || 'servidor') as 'servidor' | 'tecnico',
          created_at: p.created_at,
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

  // Adicionar módulo ao usuário
  const adicionarModulo = async (userId: string, modulo: Modulo) => {
    setSaving(true);
    try {
      // Buscar permissões do catálogo
      const { data: catalog } = await supabase
        .from('module_permissions_catalog')
        .select('permission_code')
        .eq('module_code', modulo as string);

      const permissions = (catalog || []).map((c: any) => c.permission_code);

      const { error } = await supabase
        .from('user_modules')
        .insert({ user_id: userId, module: modulo, permissions } as any);

      if (error && !error.message.includes('duplicate')) throw error;

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
        .from('user_modules')
        .delete()
        .eq('user_id', userId)
        .eq('module', modulo as any);

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
    adicionarModulo,
    removerModulo,
    toggleModulo,
    toggleUsuarioAtivo,
  };
}

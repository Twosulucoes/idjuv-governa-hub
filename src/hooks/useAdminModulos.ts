// ============================================
// HOOK PARA ADMINISTRAÇÃO DE MÓDULOS POR USUÁRIO
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ModuloSistema, UsuarioModulo } from '@/types/modulos';

interface UsuarioModulosAdmin {
  userId: string;
  restringirModulos: boolean;
  modulosAutorizados: UsuarioModulo[];
}

export function useAdminModulos() {
  const [modulos, setModulos] = useState<ModuloSistema[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Buscar catálogo de módulos
  const fetchModulos = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('modulos_sistema')
        .select('*')
        .eq('ativo', true)
        .order('ordem');

      if (error) throw error;
      setModulos(data || []);
    } catch (error: any) {
      console.error('[useAdminModulos] Erro ao buscar módulos:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Erro ao carregar módulos', 
        description: error.message 
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchModulos();
  }, [fetchModulos]);

  // Buscar módulos autorizados de um usuário específico
  const fetchModulosUsuario = useCallback(async (userId: string): Promise<UsuarioModulosAdmin | null> => {
    try {
      // Buscar flag do profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('restringir_modulos')
        .eq('id', userId)
        .single();

      // Buscar módulos autorizados
      const { data: modulosData, error } = await supabase
        .from('usuario_modulos')
        .select('*, modulo:modulos_sistema(*)')
        .eq('user_id', userId)
        .eq('ativo', true);

      if (error) throw error;

      return {
        userId,
        restringirModulos: profile?.restringir_modulos ?? false,
        modulosAutorizados: (modulosData || []) as UsuarioModulo[],
      };
    } catch (error: any) {
      console.error('[useAdminModulos] Erro ao buscar módulos do usuário:', error);
      return null;
    }
  }, []);

  // Alternar flag restringir_modulos
  const toggleRestringirModulos = useCallback(async (userId: string, restringir: boolean) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ restringir_modulos: restringir })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: restringir ? 'Restrição ativada' : 'Restrição desativada',
        description: restringir 
          ? 'Usuário agora só acessa módulos autorizados' 
          : 'Usuário acessa todos os módulos permitidos por seus perfis',
      });

      return true;
    } catch (error: any) {
      toast({ 
        variant: 'destructive', 
        title: 'Erro ao alterar restrição', 
        description: error.message 
      });
      return false;
    } finally {
      setSaving(false);
    }
  }, [toast]);

  // Autorizar módulo para usuário
  const autorizarModulo = useCallback(async (userId: string, moduloId: string) => {
    setSaving(true);
    try {
      // Verificar se já existe (pode estar inativo)
      const { data: existente } = await supabase
        .from('usuario_modulos')
        .select('id, ativo')
        .eq('user_id', userId)
        .eq('modulo_id', moduloId)
        .maybeSingle();

      if (existente) {
        if (!existente.ativo) {
          // Reativar
          const { error } = await supabase
            .from('usuario_modulos')
            .update({ ativo: true })
            .eq('id', existente.id);

          if (error) throw error;
        }
        // Se já estava ativo, não faz nada
      } else {
        // Criar nova associação
        const { error } = await supabase
          .from('usuario_modulos')
          .insert({ 
            user_id: userId, 
            modulo_id: moduloId, 
            ativo: true 
          });

        if (error) throw error;
      }

      toast({ title: 'Módulo autorizado!' });
      return true;
    } catch (error: any) {
      toast({ 
        variant: 'destructive', 
        title: 'Erro ao autorizar módulo', 
        description: error.message 
      });
      return false;
    } finally {
      setSaving(false);
    }
  }, [toast]);

  // Remover autorização de módulo
  const desautorizarModulo = useCallback(async (userId: string, moduloId: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('usuario_modulos')
        .update({ ativo: false })
        .eq('user_id', userId)
        .eq('modulo_id', moduloId);

      if (error) throw error;

      toast({ title: 'Autorização removida!' });
      return true;
    } catch (error: any) {
      toast({ 
        variant: 'destructive', 
        title: 'Erro ao remover autorização', 
        description: error.message 
      });
      return false;
    } finally {
      setSaving(false);
    }
  }, [toast]);

  // Toggle autorização de módulo
  const toggleModuloAutorizado = useCallback(async (
    userId: string, 
    moduloId: string, 
    autorizado: boolean
  ) => {
    if (autorizado) {
      return autorizarModulo(userId, moduloId);
    } else {
      return desautorizarModulo(userId, moduloId);
    }
  }, [autorizarModulo, desautorizarModulo]);

  return {
    modulos,
    loading,
    saving,
    fetchModulos,
    fetchModulosUsuario,
    toggleRestringirModulos,
    autorizarModulo,
    desautorizarModulo,
    toggleModuloAutorizado,
  };
}

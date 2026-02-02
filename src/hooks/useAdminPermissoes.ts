// ============================================
// HOOK DE PERMISSÕES RBAC (NOVO)
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Permissao, Dominio } from '@/types/rbac';

export function useAdminPermissoes() {
  const [permissoes, setPermissoes] = useState<Permissao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Buscar todas as permissões (finitas, institucionais)
  const fetchPermissoes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('permissoes')
        .select('*')
        .eq('ativo', true)
        .order('dominio')
        .order('ordem');

      if (fetchError) throw fetchError;
      setPermissoes((data || []) as Permissao[]);
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao buscar permissões:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissoes();
  }, [fetchPermissoes]);

  // Agrupar permissões por domínio
  const agruparPorDominio = useCallback((): Record<Dominio, Permissao[]> => {
    const grupos: Record<string, Permissao[]> = {};
    
    permissoes.forEach(p => {
      if (!grupos[p.dominio]) {
        grupos[p.dominio] = [];
      }
      grupos[p.dominio].push(p);
    });

    return grupos as Record<Dominio, Permissao[]>;
  }, [permissoes]);

  return {
    permissoes,
    loading,
    error,
    fetchPermissoes,
    agruparPorDominio,
  };
}

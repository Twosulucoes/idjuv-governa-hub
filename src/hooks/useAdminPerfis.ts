// ============================================
// HOOK DE PERFIS (SISTEMA SIMPLIFICADO)
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Perfil, PerfilCodigo } from '@/types/rbac';

export function useAdminPerfis() {
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar todos os perfis
  const fetchPerfis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('perfis')
        .select('*')
        .order('created_at');

      if (fetchError) throw fetchError;
      
      // Mapear para o tipo Perfil (simplificado)
      // A coluna pode_aprovar pode não existir ainda no banco
      const perfisData: Perfil[] = (data || []).map(p => ({
        id: p.id,
        nome: p.nome,
        codigo: p.codigo as PerfilCodigo,
        descricao: p.descricao,
        pode_aprovar: p.codigo === 'super_admin' || p.codigo === 'gestor',
        created_at: p.created_at,
      }));
      
      setPerfis(perfisData);
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

  return {
    perfis,
    perfisAtivos: perfis, // Todos são ativos no sistema simplificado
    loading,
    error,
    fetchPerfis,
  };
}

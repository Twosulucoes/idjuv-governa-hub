/**
 * Leituras do histórico do processo (movimentações, despachos, documentos).
 * A escrita no processo é só pelas RPCs wf_* (@/hooks/useAcompanhamentoProcessos); as tabelas não têm policy de
 * INSERT/UPDATE para o front.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { MovimentacaoProcesso, Despacho, DocumentoProcesso } from '@/types/workflow';

// MOVIMENTAÇÕES
export function useMovimentacoes(processoId: string | undefined) {
  return useQuery({
    queryKey: ['movimentacoes-processo', processoId],
    queryFn: async () => {
      if (!processoId) return [];
      const { data, error } = await supabase
        .from('movimentacoes_processo')
        .select(`
          *,
          unidade_origem:estrutura_organizacional!unidade_origem_id(id, nome, sigla),
          unidade_destino:estrutura_organizacional!unidade_destino_id(id, nome, sigla),
          servidor_origem:servidores!servidor_origem_id(id, nome_completo),
          servidor_destino:servidores!servidor_destino_id(id, nome_completo)
        `)
        .eq('processo_id', processoId)
        .order('numero_sequencial', { ascending: true });
      
      if (error) throw error;
      return data as MovimentacaoProcesso[];
    },
    enabled: !!processoId,
  });
}

// DESPACHOS
export function useDespachos(processoId: string | undefined) {
  return useQuery({
    queryKey: ['despachos-processo', processoId],
    queryFn: async () => {
      if (!processoId) return [];
      const { data, error } = await supabase
        .from('despachos')
        .select(`
          *,
          autoridade:servidores!autoridade_id(id, nome_completo)
        `)
        .eq('processo_id', processoId)
        .order('numero_despacho', { ascending: true });
      
      if (error) throw error;
      return data as Despacho[];
    },
    enabled: !!processoId,
  });
}

// DOCUMENTOS
export function useDocumentosProcesso(processoId: string | undefined) {
  return useQuery({
    queryKey: ['documentos-processo', processoId],
    queryFn: async () => {
      if (!processoId) return [];
      const { data, error } = await supabase
        .from('documentos_processo')
        .select('*')
        .eq('processo_id', processoId)
        .order('ordem', { ascending: true });
      
      if (error) throw error;
      return data as DocumentoProcesso[];
    },
    enabled: !!processoId,
  });
}

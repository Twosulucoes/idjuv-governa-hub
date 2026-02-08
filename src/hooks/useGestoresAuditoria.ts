/**
 * Hook para auditoria do workflow de Gestores Escolares
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HistoricoWorkflow {
  historico_id: string;
  gestor_id: string;
  gestor_nome: string;
  gestor_cpf: string;
  gestor_email: string;
  escola_nome: string | null;
  escola_municipio: string | null;
  status_anterior: string | null;
  status_novo: string;
  acao: string;
  responsavel: string | null;
  usuario_id: string | null;
  detalhes: Record<string, unknown>;
  data_acao: string;
  status_atual: string;
  data_criacao: string;
  ultima_atualizacao: string;
  alerta_parado: boolean;
  dias_no_status_atual: number;
}

export interface MetricasAuditoria {
  totalAcoes: number;
  acoesPorTipo: Record<string, number>;
  acoesPorResponsavel: Record<string, number>;
  gestoresParados: number;
  tempoMedioConfirmacao: number | null;
}

const QUERY_KEY = ['gestores-auditoria'];

export function useGestoresAuditoria() {
  // Buscar histórico da view
  const {
    data: historico = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<HistoricoWorkflow[]> => {
      const { data, error } = await supabase
        .from('v_gestores_workflow_auditoria')
        .select('*')
        .order('data_acao', { ascending: false });

      if (error) throw error;
      return data as HistoricoWorkflow[];
    },
  });

  // Buscar histórico por gestor
  const buscarHistoricoPorGestor = async (gestorId: string): Promise<HistoricoWorkflow[]> => {
    const { data, error } = await supabase
      .from('v_gestores_workflow_auditoria')
      .select('*')
      .eq('gestor_id', gestorId)
      .order('data_acao', { ascending: true });

    if (error) throw error;
    return data as HistoricoWorkflow[];
  };

  // Calcular métricas
  const metricas: MetricasAuditoria = {
    totalAcoes: historico.length,
    acoesPorTipo: historico.reduce((acc, h) => {
      acc[h.acao] = (acc[h.acao] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    acoesPorResponsavel: historico
      .filter(h => h.responsavel && h.responsavel !== 'Sistema (Pré-cadastro)' && h.responsavel !== 'Sistema (Migração)')
      .reduce((acc, h) => {
        const resp = h.responsavel || 'Sem responsável';
        acc[resp] = (acc[resp] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    gestoresParados: [...new Set(historico.filter(h => h.alerta_parado).map(h => h.gestor_id))].length,
    tempoMedioConfirmacao: null, // Calcular se necessário
  };

  // Agrupar por gestor para timeline
  const historicosPorGestor = historico.reduce((acc, h) => {
    if (!acc[h.gestor_id]) {
      acc[h.gestor_id] = {
        gestor_id: h.gestor_id,
        gestor_nome: h.gestor_nome,
        escola_nome: h.escola_nome,
        status_atual: h.status_atual,
        alerta_parado: h.alerta_parado,
        dias_no_status_atual: h.dias_no_status_atual,
        acoes: [],
      };
    }
    acc[h.gestor_id].acoes.push(h);
    return acc;
  }, {} as Record<string, {
    gestor_id: string;
    gestor_nome: string;
    escola_nome: string | null;
    status_atual: string;
    alerta_parado: boolean;
    dias_no_status_atual: number;
    acoes: HistoricoWorkflow[];
  }>);

  // Gestores com problemas (parados ou com status "problema")
  const gestoresComProblemas = Object.values(historicosPorGestor).filter(
    g => g.alerta_parado || g.status_atual === 'problema'
  );

  return {
    historico,
    historicosPorGestor: Object.values(historicosPorGestor),
    gestoresComProblemas,
    metricas,
    isLoading,
    error,
    refetch,
    buscarHistoricoPorGestor,
  };
}

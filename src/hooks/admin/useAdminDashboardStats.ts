/**
 * Hook para estatísticas do Dashboard Administrativo
 * Consome dados reais do banco de dados
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DashboardStats {
  servidoresAtivos: number;
  unidades: number;
  documentos: number;
  cargos: number;
  servidoresTrend?: string;
  documentosTrend?: string;
}

export function useAdminDashboardStats() {
  return useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async (): Promise<DashboardStats> => {
      // Buscar contagem de servidores ativos
      const { count: servidoresAtivos } = await supabase
        .from("servidores")
        .select("*", { count: "exact", head: true })
        .eq("ativo", true);

      // Buscar contagem de unidades organizacionais
      const { count: unidades } = await supabase
        .from("estrutura_organizacional")
        .select("*", { count: "exact", head: true })
        .eq("ativo", true);

      // Buscar contagem de documentos (processos administrativos)
      const { count: documentos } = await supabase
        .from("processos_administrativos")
        .select("*", { count: "exact", head: true });

      // Buscar contagem de cargos
      const { count: cargos } = await supabase
        .from("cargos")
        .select("*", { count: "exact", head: true })
        .eq("ativo", true);

      // Calcular tendências (servidores novos este mês)
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);

      const { count: servidoresNovosMes } = await supabase
        .from("servidores")
        .select("*", { count: "exact", head: true })
        .gte("created_at", inicioMes.toISOString());

      // Documentos novos esta semana
      const inicioSemana = new Date();
      inicioSemana.setDate(inicioSemana.getDate() - 7);

      const { count: documentosNovosSemana } = await supabase
        .from("processos_administrativos")
        .select("*", { count: "exact", head: true })
        .gte("created_at", inicioSemana.toISOString());

      return {
        servidoresAtivos: servidoresAtivos || 0,
        unidades: unidades || 0,
        documentos: documentos || 0,
        cargos: cargos || 0,
        servidoresTrend: servidoresNovosMes && servidoresNovosMes > 0 
          ? `+${servidoresNovosMes} este mês` 
          : undefined,
        documentosTrend: documentosNovosSemana && documentosNovosSemana > 0 
          ? `+${documentosNovosSemana} esta semana` 
          : undefined,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: false,
  });
}

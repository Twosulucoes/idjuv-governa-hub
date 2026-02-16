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
      // Executar todas as queries em paralelo para evitar abort
      const [
        servidoresRes,
        unidadesRes,
        documentosRes,
        cargosRes,
        servidoresNovosRes,
        documentosNovosRes,
      ] = await Promise.all([
        supabase
          .from("servidores")
          .select("id", { count: "exact", head: true })
          .eq("ativo", true),
        supabase
          .from("estrutura_organizacional")
          .select("id", { count: "exact", head: true })
          .eq("ativo", true),
        supabase
          .from("processos_administrativos")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("cargos")
          .select("id", { count: "exact", head: true })
          .eq("ativo", true),
        (() => {
          const inicioMes = new Date();
          inicioMes.setDate(1);
          inicioMes.setHours(0, 0, 0, 0);
          return supabase
            .from("servidores")
            .select("id", { count: "exact", head: true })
            .gte("created_at", inicioMes.toISOString());
        })(),
        (() => {
          const inicioSemana = new Date();
          inicioSemana.setDate(inicioSemana.getDate() - 7);
          return supabase
            .from("processos_administrativos")
            .select("id", { count: "exact", head: true })
            .gte("created_at", inicioSemana.toISOString());
        })(),
      ]);

      const servidoresAtivos = servidoresRes.count ?? 0;
      const unidades = unidadesRes.count ?? 0;
      const documentos = documentosRes.count ?? 0;
      const cargos = cargosRes.count ?? 0;
      const servidoresNovosMes = servidoresNovosRes.count ?? 0;
      const documentosNovosSemana = documentosNovosRes.count ?? 0;

      return {
        servidoresAtivos,
        unidades,
        documentos,
        cargos,
        servidoresTrend: servidoresNovosMes > 0
          ? `+${servidoresNovosMes} este mês`
          : undefined,
        documentosTrend: documentosNovosSemana > 0
          ? `+${documentosNovosSemana} esta semana`
          : undefined,
      };
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

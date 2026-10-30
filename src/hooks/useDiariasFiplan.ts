/**
 * Camada de dados das diárias do FIPLAN (tabela `fin_diarias_fiplan`, FIP 002). Só leitura: quem grava é o
 * importador (`importar_diarias_fiplan`), que invalida as chaves `["diarias-fiplan"]` e `["diarias-fiplan-viagens"]`.
 * Leem o Financeiro, o RH e o próprio servidor (RLS da migração 20261113090000).
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type DiariaFiplan = Tables<"fin_diarias_fiplan">;

/** Diárias do exercício, das viagens mais recentes para as mais antigas. */
export function useDiariasFiplan(exercicio: number) {
  return useQuery({
    queryKey: ["diarias-fiplan", exercicio],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fin_diarias_fiplan")
        .select("*")
        .eq("exercicio", exercicio)
        .order("data_saida", { ascending: false, nullsFirst: false })
        .order("credor_nome");
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Última importação do FIP 002 no exercício (null se nunca importado). */
export function useUltimaImportacaoDiarias(exercicio: number) {
  return useQuery({
    queryKey: ["diarias-fiplan", "ultima", exercicio],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("importacoes")
        .select("created_at")
        .eq("tipo", "diarias_fiplan")
        .eq("exercicio", exercicio)
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      return data?.[0]?.created_at ?? null;
    },
  });
}

/** Diárias do FIPLAN de um servidor, de todos os exercícios (aba Viagens da ficha funcional). */
export function useDiariasFiplanDoServidor(servidorId: string | undefined) {
  return useQuery({
    queryKey: ["diarias-fiplan", "servidor", servidorId],
    enabled: !!servidorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fin_diarias_fiplan")
        .select("*")
        .eq("servidor_id", servidorId!)
        .order("data_saida", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type PagamentoDaViagem = Pick<DiariaFiplan, "viagem_id" | "data_pagamento" | "prestou_contas" | "valor_empenhado">;

/** Diárias pagas no FIPLAN das viagens do RH, por viagem (selo "Paga no FIPLAN" em /rh/viagens). */
export function useDiariasPagasPorViagem(viagemIds: string[]) {
  return useQuery({
    queryKey: ["diarias-fiplan-viagens", viagemIds],
    enabled: viagemIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fin_diarias_fiplan")
        .select("viagem_id, data_pagamento, prestou_contas, valor_empenhado")
        .in("viagem_id", viagemIds);
      if (error) throw error;
      const mapa = new Map<string, PagamentoDaViagem>();
      for (const d of data ?? []) if (d.viagem_id) mapa.set(d.viagem_id, d);
      return mapa;
    },
  });
}

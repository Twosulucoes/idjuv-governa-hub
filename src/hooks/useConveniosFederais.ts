/**
 * Convênios federais do Transferegov (só leitura): propostas com emendas e convênio, movimentos do convênio
 * e a última sincronização da rotina diária. As tabelas fin_tg_* são trocadas inteiras pela rotina
 * (fin_tg_carregar); a tela não grava nada. Permissão: financeiro.convenios.visualizar.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type PropostaFederal = Tables<"fin_tg_propostas">;
export type EmendaFederal = Tables<"fin_tg_emendas">;
export type ConvenioFederal = Tables<"fin_tg_convenios">;
export type MovimentoFederal = Tables<"fin_tg_movimentos">;
export type SincronizacaoTransferegov = Tables<"fin_tg_sincronizacoes">;

export interface PropostaComConvenio extends PropostaFederal {
  emendas: EmendaFederal[];
  /** Uma proposta vira no máximo um convênio; null enquanto não vira */
  convenio: ConvenioFederal | null;
}

function montar(linha: PropostaFederal & { fin_tg_emendas: EmendaFederal[]; fin_tg_convenios: ConvenioFederal[] }): PropostaComConvenio {
  const { fin_tg_emendas, fin_tg_convenios, ...proposta } = linha;
  return { ...proposta, emendas: fin_tg_emendas ?? [], convenio: fin_tg_convenios?.[0] ?? null };
}

export function useConveniosFederais() {
  return useQuery({
    queryKey: ["fin_tg_propostas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fin_tg_propostas")
        .select("*, fin_tg_emendas(*), fin_tg_convenios(*)")
        .order("data_proposta", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []).map(montar);
    },
  });
}

export function useConvenioFederal(idProposta: number | undefined) {
  return useQuery({
    queryKey: ["fin_tg_propostas", idProposta],
    enabled: idProposta !== undefined && Number.isFinite(idProposta),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fin_tg_propostas")
        .select("*, fin_tg_emendas(*), fin_tg_convenios(*)")
        .eq("id_proposta", idProposta!)
        .maybeSingle();
      if (error) throw error;
      return data ? montar(data) : null;
    },
  });
}

export function useMovimentosConvenioFederal(numeroConvenio: string | undefined) {
  return useQuery({
    queryKey: ["fin_tg_movimentos", numeroConvenio],
    enabled: !!numeroConvenio,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fin_tg_movimentos")
        .select("*")
        .eq("numero_convenio", numeroConvenio!)
        .order("data", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUltimaSincronizacaoTransferegov() {
  return useQuery({
    queryKey: ["fin_tg_sincronizacoes", "ultima"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fin_tg_sincronizacoes")
        .select("*")
        .order("executada_em", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

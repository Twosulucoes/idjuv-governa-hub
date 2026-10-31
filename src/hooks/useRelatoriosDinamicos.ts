/**
 * Dados do Gerador de relatórios: linhas da fonte escolhida e os modelos salvos (relatorios_modelos).
 * Spec: docs/superpowers/specs/2026-10-30-gerador-relatorios-design.md
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { ConfigRelatorio, FonteRelatorio } from "@/lib/relatoriosDinamicos/tipos";

export interface ModeloRelatorio {
  id: string;
  modulo: string;
  fonte: string;
  nome: string;
  descricao: string | null;
  configuracao: unknown;
  compartilhado: boolean;
  criado_por: string;
  updated_at: string;
}

export function useLinhasFonte(fonte: FonteRelatorio<unknown> | undefined, exercicio: number) {
  return useQuery({
    queryKey: ["relatorio_fonte", fonte?.id ?? null, exercicio],
    enabled: Boolean(fonte),
    queryFn: () => fonte!.carregar(exercicio),
    // Lista grande: não refaz a leitura a cada troca de coluna ou filtro (tudo é feito na tela).
    staleTime: 5 * 60 * 1000,
  });
}

export function useModelosRelatorio(modulo: string) {
  return useQuery({
    queryKey: ["relatorios_modelos", modulo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("relatorios_modelos")
        .select("id, modulo, fonte, nome, descricao, configuracao, compartilhado, criado_por, updated_at")
        .eq("modulo", modulo)
        .order("nome");
      if (error) throw error;
      return (data ?? []) as ModeloRelatorio[];
    },
  });
}

export interface SalvarModelo {
  id?: string;
  modulo: string;
  nome: string;
  descricao?: string | null;
  compartilhado: boolean;
  config: ConfigRelatorio;
}

export function useSalvarModeloRelatorio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (m: SalvarModelo): Promise<ModeloRelatorio> => {
      const linha = {
        modulo: m.modulo,
        fonte: m.config.fonte,
        nome: m.nome.trim(),
        descricao: m.descricao?.trim() || null,
        compartilhado: m.compartilhado,
        configuracao: m.config as unknown as Json,
      };
      const consulta = m.id
        ? supabase.from("relatorios_modelos").update(linha).eq("id", m.id)
        : supabase.from("relatorios_modelos").insert(linha);
      const { data, error } = await consulta
        .select("id, modulo, fonte, nome, descricao, configuracao, compartilhado, criado_por, updated_at")
        .single();
      if (error) throw error;
      return data as ModeloRelatorio;
    },
    onSuccess: (m) => qc.invalidateQueries({ queryKey: ["relatorios_modelos", m.modulo] }),
  });
}

export function useExcluirModeloRelatorio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (m: Pick<ModeloRelatorio, "id" | "modulo">) => {
      const { error } = await supabase.from("relatorios_modelos").delete().eq("id", m.id);
      if (error) throw error;
      return m;
    },
    onSuccess: (m) => qc.invalidateQueries({ queryKey: ["relatorios_modelos", m.modulo] }),
  });
}

/**
 * Hooks da configuração de IA da instituição (ia_config, ia_uso).
 * - useConfigIA(): a linha única de configuração, se existir
 * - useSalvarConfigIA(): grava provedor, modelo e limites (cria a linha id = true na primeira vez)
 * - useSalvarChaveIA(): grava a chave de API no Vault (só escrita, via RPC)
 * - useTestarIA(): chamada mínima ao provedor pela Edge Function ia-gateway
 * - useResumoUsoIA(): chamadas e tokens do mês corrente
 * - useIADisponivel(): IA ligada e a pessoa com permissão de usar (para mostrar os botões)
 *
 * Quem pode ver/editar é decidido pela RLS e pelas funções (ia.configurar / ia.usar).
 * As tabelas ainda não estão nos tipos gerados, por isso o cliente `db` sem tipos.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  COLUNAS_CONFIG_IA,
  type ConfigIA,
  type ConfigIAInput,
  type ResultadoTesteIA,
  type ResumoUsoIA,
} from "@/types/ia";

const db = supabase as unknown as SupabaseClient;

const CHAVE_CONFIG = ["config-ia"] as const;
const CHAVE_USO = ["ia-uso-mes"] as const;
const CHAVE_DISPONIVEL = ["ia-disponivel"] as const;

export function useConfigIA() {
  return useQuery({
    queryKey: CHAVE_CONFIG,
    queryFn: async (): Promise<ConfigIA | null> => {
      const { data, error } = await db.from("ia_config").select(COLUNAS_CONFIG_IA).maybeSingle();
      if (error) throw error;
      return (data as unknown as ConfigIA | null) ?? null;
    },
  });
}

export function useSalvarConfigIA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dados: ConfigIAInput) => {
      // "Upsert" em dois passos, como em useConfigEnvio: `id` não tem GRANT de UPDATE, e o
      // upsert do PostgREST incluiria `id` no SET do ON CONFLICT.
      const { data, error } = await db.from("ia_config").update(dados).eq("id", true).select("id");
      if (error) throw error;
      if (!data || data.length === 0) {
        const { error: insertError } = await db.from("ia_config").insert({ id: true, ...dados });
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      toast.success("Configuração de IA salva");
    },
    onError: (e: Error) => toast.error("Erro ao salvar configuração: " + e.message),
    // Trocar provedor/URL apaga a chave e desliga a IA no banco: recarrega mesmo em erro.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CHAVE_CONFIG });
      queryClient.invalidateQueries({ queryKey: CHAVE_DISPONIVEL });
    },
  });
}

export function useSalvarChaveIA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chave: string) => {
      const { data, error } = await db.rpc("salvar_chave_ia", { p_chave: chave });
      if (error) throw error;
      return data as string | null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAVE_CONFIG });
      toast.success("Chave gravada com segurança");
    },
    onError: (e: Error) => toast.error("Erro ao gravar a chave: " + e.message),
  });
}

export function useTestarIA() {
  return useMutation({
    mutationFn: async (): Promise<ResultadoTesteIA> => {
      const { data, error } = await supabase.functions.invoke("ia-gateway", {
        body: { recurso: "testar" },
      });
      if (error) {
        // Respostas 4xx/5xx da função chegam como FunctionsHttpError; a mensagem útil está no corpo.
        const corpo = await (error as { context?: Response }).context?.json?.().catch(() => null);
        throw new Error(corpo?.error || error.message || "Falha ao testar a conexão");
      }
      const resultado = data as Partial<ResultadoTesteIA> & { error?: string };
      if (resultado?.error) throw new Error(resultado.error);
      if (resultado?.ok !== true) throw new Error("O provedor não confirmou a conexão");
      return resultado as ResultadoTesteIA;
    },
    onSuccess: () => toast.success("Conexão com o provedor de IA funcionando"),
    onError: (e: Error) => toast.error("Teste falhou: " + e.message),
  });
}

export function useResumoUsoIA() {
  return useQuery({
    queryKey: CHAVE_USO,
    queryFn: async (): Promise<ResumoUsoIA> => {
      const { data, error } = await db.rpc("resumo_uso_ia_mes");
      if (error) throw error;
      const r = (data ?? {}) as Partial<ResumoUsoIA>;
      return {
        chamadas: Number(r.chamadas ?? 0),
        tokens_entrada: Number(r.tokens_entrada ?? 0),
        tokens_saida: Number(r.tokens_saida ?? 0),
        teto_tokens_mes: r.teto_tokens_mes == null ? null : Number(r.teto_tokens_mes),
      };
    },
  });
}

/** true só com a IA ligada e a pessoa com permissão de usar; qualquer erro conta como indisponível. */
export function useIADisponivel() {
  return useQuery({
    queryKey: CHAVE_DISPONIVEL,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await db.rpc("ia_disponivel");
      if (error) throw error;
      return data === true;
    },
    staleTime: 5 * 60 * 1000,
  });
}

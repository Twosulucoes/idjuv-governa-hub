/**
 * Hooks da configuração de envio de e-mail e WhatsApp (config_envio, envios_log).
 * - useConfigEnvio(): as duas linhas de configuração (e-mail e WhatsApp), se existirem
 * - useSalvarConfigEnvio(): grava os campos de um canal (cria a linha na primeira vez)
 * - useSalvarSegredoEnvio(): grava a credencial no Vault (só escrita, via RPC)
 * - useTestarEnvio(): dispara um teste pela Edge Function enviar-notificacao
 * - useEnviosLog(): últimos disparos
 *
 * Quem pode ver/editar é decidido pela RLS (admin.envios / admin.envios.configurar).
 * As tabelas ainda não estão nos tipos gerados, por isso o cliente `db` sem tipos.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  COLUNAS_CONFIG_ENVIO,
  type CanalEnvio,
  type ConfigEnvio,
  type ConfigEnvioInput,
  type EnvioLog,
} from "@/types/envios";

const db = supabase as unknown as SupabaseClient;

const CHAVE_CONFIG = ["config-envio"] as const;
const CHAVE_LOG = ["envios-log"] as const;

export function useConfigEnvio() {
  return useQuery({
    queryKey: CHAVE_CONFIG,
    queryFn: async (): Promise<Partial<Record<CanalEnvio, ConfigEnvio>>> => {
      const { data, error } = await db.from("config_envio").select(COLUNAS_CONFIG_ENVIO);
      if (error) throw error;
      const porCanal: Partial<Record<CanalEnvio, ConfigEnvio>> = {};
      ((data || []) as unknown as ConfigEnvio[]).forEach((c) => (porCanal[c.canal] = c));
      return porCanal;
    },
  });
}

export function useSalvarConfigEnvio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ canal, dados }: { canal: CanalEnvio; dados: ConfigEnvioInput }) => {
      // Sem upsert: `canal` não tem GRANT de UPDATE (a chave não muda).
      const { data, error } = await db.from("config_envio").update(dados).eq("canal", canal).select("canal");
      if (error) throw error;
      if (!data || data.length === 0) {
        const { error: insertError } = await db.from("config_envio").insert({ canal, ...dados });
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAVE_CONFIG });
      toast.success("Configuração salva");
    },
    onError: (e: Error) => toast.error("Erro ao salvar configuração: " + e.message),
  });
}

export function useSalvarSegredoEnvio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ canal, segredo }: { canal: CanalEnvio; segredo: string }) => {
      const { error } = await db.rpc("salvar_segredo_envio", { p_canal: canal, p_segredo: segredo });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAVE_CONFIG });
      toast.success("Credencial gravada com segurança");
    },
    onError: (e: Error) => toast.error("Erro ao gravar credencial: " + e.message),
  });
}

export function useTestarEnvio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ canal, destino }: { canal: CanalEnvio; destino: string }) => {
      const { data, error } = await supabase.functions.invoke("enviar-notificacao", {
        body: { acao: "teste", canal, destino },
      });
      if (error) {
        // Respostas 4xx da função chegam como FunctionsHttpError; a mensagem útil está no corpo.
        const corpo = await (error as { context?: Response }).context?.json?.().catch(() => null);
        throw new Error(corpo?.error || error.message || "Falha ao chamar o envio de teste");
      }
      const resultado = data as { status?: string; erro?: string | null; error?: string };
      if (resultado?.error) throw new Error(resultado.error);
      if (resultado?.status !== "enviado") throw new Error(resultado?.erro || "O teste não foi enviado");
    },
    onSuccess: () => toast.success("Teste enviado. Confira a caixa de entrada ou o WhatsApp de destino."),
    onError: (e: Error) => toast.error("Teste falhou: " + e.message),
    onSettled: () => queryClient.invalidateQueries({ queryKey: CHAVE_LOG }),
  });
}

export function useEnviosLog(limite = 100) {
  return useQuery({
    queryKey: [...CHAVE_LOG, limite],
    queryFn: async (): Promise<EnvioLog[]> => {
      const { data, error } = await db
        .from("envios_log")
        .select("id, criado_em, canal, provedor, destinatario, assunto, origem_modulo, origem_id, status, erro, id_externo")
        .order("criado_em", { ascending: false })
        .limit(limite);
      if (error) throw error;
      return (data || []) as EnvioLog[];
    },
  });
}

/** Mostra só o começo do usuário do e-mail ou os 4 últimos dígitos do telefone. */
export function mascararDestinatario(destinatario: string): string {
  if (destinatario.includes("@")) {
    const [usuario, dominio] = destinatario.split("@");
    return `${usuario.slice(0, 2)}***@${dominio}`;
  }
  return destinatario.length > 4 ? `***${destinatario.slice(-4)}` : destinatario;
}

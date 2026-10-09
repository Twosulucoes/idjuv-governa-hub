/**
 * Hooks do mural de avisos (tabelas avisos e avisos_leituras).
 * - useAvisosVigentes(): avisos que o usuário logado deve ver agora, com estado de leitura
 * - useAvisosGestao(): todos os avisos (gestor) + mutations de criar/editar/excluir
 * - useMarcarAvisoLido(): registra a leitura do usuário
 *
 * Quem vê o quê é decidido pela RLS (público-alvo por módulo, validade, ativo); o filtro
 * de vigência abaixo só existe porque o gestor recebe também rascunhos e expirados.
 * As tabelas ainda não estão nos tipos gerados, por isso o cliente `db` sem tipos.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Aviso, AvisoComLeitura, AvisoInput, PrioridadeAviso } from "@/types/avisos";

const db = supabase as unknown as SupabaseClient;

const PESO_PRIORIDADE: Record<PrioridadeAviso, number> = { urgente: 0, alta: 1, normal: 2, baixa: 3 };

export function avisoVigente(aviso: Aviso, agora = new Date()): boolean {
  return (
    aviso.ativo &&
    new Date(aviso.inicio_em) <= agora &&
    (!aviso.expira_em || new Date(aviso.expira_em) > agora)
  );
}

export function ordenarAvisos<T extends Aviso>(avisos: T[]): T[] {
  return [...avisos].sort(
    (a, b) =>
      PESO_PRIORIDADE[a.prioridade] - PESO_PRIORIDADE[b.prioridade] ||
      Number(b.destaque) - Number(a.destaque) ||
      b.inicio_em.localeCompare(a.inicio_em),
  );
}

const CINCO_MINUTOS = 5 * 60 * 1000;

export function useAvisosVigentes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["avisos", "vigentes", user?.id],
    enabled: !!user?.id,
    staleTime: CINCO_MINUTOS,
    refetchInterval: CINCO_MINUTOS,
    queryFn: async (): Promise<AvisoComLeitura[]> => {
      const agora = new Date().toISOString();
      const [avisosRes, leiturasRes] = await Promise.all([
        db
          .from("avisos")
          .select("*")
          .eq("ativo", true)
          .lte("inicio_em", agora)
          .or(`expira_em.is.null,expira_em.gt."${agora}"`)
          .order("inicio_em", { ascending: false })
          .limit(100),
        db
          .from("avisos_leituras")
          .select("aviso_id")
          .eq("user_id", user!.id),
      ]);

      if (avisosRes.error) throw avisosRes.error;
      if (leiturasRes.error) throw leiturasRes.error;

      const lidos = new Set(((leiturasRes.data || []) as { aviso_id: string }[]).map((l) => l.aviso_id));
      // O gestor recebe da RLS todos os avisos; no sino e na faixa ele só vê os do seu público.
      const meuPublico = (a: Aviso) =>
        a.publico === "todos" || user!.isSuperAdmin || a.modulos_alvo.some((m) => user!.modules.includes(m));
      const avisos = ((avisosRes.data || []) as Aviso[])
        .filter(meuPublico)
        .map((a) => ({ ...a, lido: lidos.has(a.id) }));
      return ordenarAvisos(avisos);
    },
  });
}

export function useMarcarAvisoLido() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (avisoIds: string[]) => {
      if (avisoIds.length === 0) return;
      const { error } = await db
        .from("avisos_leituras")
        .upsert(avisoIds.map((aviso_id) => ({ aviso_id })), { onConflict: "aviso_id,user_id", ignoreDuplicates: true });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["avisos"] }),
    onError: (error: Error) => toast.error("Não foi possível marcar como lido: " + error.message),
  });
}

export function useAvisosGestao(habilitado: boolean) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["avisos", "gestao", user?.id],
    enabled: habilitado && !!user?.id,
    queryFn: async (): Promise<(Aviso & { leituras: number })[]> => {
      const { data, error } = await db
        .from("avisos")
        .select("*, avisos_leituras(count)")
        .order("inicio_em", { ascending: false })
        .limit(500);
      if (error) throw error;
      return ((data || []) as unknown as (Aviso & { avisos_leituras: { count: number }[] })[]).map(
        ({ avisos_leituras, ...aviso }) => ({ ...aviso, leituras: avisos_leituras?.[0]?.count ?? 0 }),
      );
    },
  });

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ["avisos"] });

  const salvar = useMutation({
    mutationFn: async ({ id, ...input }: AvisoInput & { id?: string }) => {
      const payload = { ...input, modulos_alvo: input.publico === "todos" ? [] : input.modulos_alvo };
      const { error } = id
        ? await db.from("avisos").update(payload).eq("id", id)
        : await db.from("avisos").insert(payload);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      invalidar();
      toast.success(vars.id ? "Aviso atualizado" : "Aviso publicado");
    },
    onError: (error: Error) => toast.error("Erro ao salvar aviso: " + error.message),
  });

  const excluir = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("avisos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidar();
      toast.success("Aviso excluído");
    },
    onError: (error: Error) => toast.error("Erro ao excluir aviso: " + error.message),
  });

  return { ...query, avisos: query.data ?? [], salvar, excluir };
}

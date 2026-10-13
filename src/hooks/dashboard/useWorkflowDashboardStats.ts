/**
 * Indicadores do painel de Workflow/Processos, contados em v_processos_acompanhamento.
 * A view respeita a RLS (security_invoker): o usuário só conta o que pode ver, inclusive o sigilo.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUnidadeDoUsuario } from "@/hooks/useAcompanhamentoProcessos";

export interface GrupoContagem {
  /** Chave para a lista filtrada (código do modelo) */
  modeloCodigo: string;
  rotulo: string;
  total: number;
  /** Só em "por etapa": ordem da etapa */
  etapa?: number;
}

export interface WorkflowStats {
  naMinhaUnidade: number;
  vencidos: number;
  ativos: number;
  porTipo: GrupoContagem[];
  porEtapa: GrupoContagem[];
}

interface LinhaPainel {
  modelo_codigo: string | null;
  modelo_nome: string | null;
  etapa_atual_ordem: number | null;
  etapa_nome: string | null;
  unidade_atual_id: string | null;
  situacao_prazo: string;
}

const SEM_MODELO = "Sem modelo";

async function buscarStats(unidadeId: string | null): Promise<WorkflowStats> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any; // a view nova ainda não está em types.ts (gerado)
  const { data, error } = await db
    .from("v_processos_acompanhamento")
    .select("modelo_codigo, modelo_nome, etapa_atual_ordem, etapa_nome, unidade_atual_id, situacao_prazo")
    .in("status", ["aberto", "em_tramitacao"]);
  if (error) throw error;
  const linhas = (data ?? []) as LinhaPainel[];

  const porTipo = new Map<string, GrupoContagem>();
  const porEtapa = new Map<string, GrupoContagem>();
  for (const l of linhas) {
    const modeloCodigo = l.modelo_codigo ?? "";
    const modeloNome = l.modelo_nome ?? SEM_MODELO;
    const t = porTipo.get(modeloCodigo) ?? { modeloCodigo, rotulo: modeloNome, total: 0 };
    t.total += 1;
    porTipo.set(modeloCodigo, t);

    if (l.modelo_codigo && l.etapa_atual_ordem) {
      const chave = `${l.modelo_codigo}#${l.etapa_atual_ordem}`;
      const e = porEtapa.get(chave) ?? {
        modeloCodigo,
        etapa: l.etapa_atual_ordem,
        rotulo: `${modeloNome}: ${l.etapa_atual_ordem}. ${l.etapa_nome ?? "Etapa"}`,
        total: 0,
      };
      e.total += 1;
      porEtapa.set(chave, e);
    }
  }
  const ordenar = (m: Map<string, GrupoContagem>) =>
    [...m.values()].sort((a, b) => b.total - a.total || a.rotulo.localeCompare(b.rotulo, "pt-BR"));

  return {
    ativos: linhas.length,
    naMinhaUnidade: unidadeId ? linhas.filter((l) => l.unidade_atual_id === unidadeId).length : 0,
    vencidos: linhas.filter((l) => l.situacao_prazo === "vencido").length,
    porTipo: ordenar(porTipo),
    porEtapa: ordenar(porEtapa).slice(0, 10),
  };
}

export function useWorkflowDashboardStats() {
  const unidade = useUnidadeDoUsuario();
  const query = useQuery({
    queryKey: ["workflow-dashboard-stats", unidade.data ?? null],
    enabled: !unidade.isLoading,
    queryFn: () => buscarStats(unidade.data ?? null),
    staleTime: 1000 * 60 * 5,
  });
  return {
    ...query,
    isLoading: query.isLoading || unidade.isLoading,
    isError: query.isError || unidade.isError,
    semLotacao: unidade.isSuccess && !unidade.data,
    refetch: async () => {
      if (unidade.isError) await unidade.refetch();
      return query.refetch();
    },
  };
}

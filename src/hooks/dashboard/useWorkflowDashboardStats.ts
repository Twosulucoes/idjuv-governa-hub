/**
 * Indicadores do painel de Workflow/Processos, contados em v_processos_acompanhamento.
 * A view respeita a RLS (security_invoker): o usuário só conta o que pode ver, inclusive o sigilo.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { CHAVE_PAINEL_WORKFLOW, LIMITE_LINHAS, STATUS_ATIVOS, useUnidadeDoUsuario } from "@/hooks/useAcompanhamentoProcessos";

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
  /** Os agrupamentos por tipo/etapa foram calculados sobre as primeiras linhas (limite atingido) */
  agrupamentoParcial: boolean;
  porTipo: GrupoContagem[];
  porEtapa: GrupoContagem[];
}

interface LinhaPainel {
  modelo_codigo: string | null;
  modelo_nome: string | null;
  etapa_atual_ordem: number | null;
  etapa_nome: string | null;
}

const SEM_MODELO = "Sem modelo";

async function buscarStats(unidadeId: string | null): Promise<WorkflowStats> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any; // a view nova ainda não está em types.ts (gerado)
  const ativos = () => db.from("v_processos_acompanhamento").select("id", { count: "exact", head: true }).in("status", STATUS_ATIVOS);
  const contar = async (q: PromiseLike<{ count: number | null; error: unknown }>) => {
    const { count, error } = await q;
    if (error) throw error;
    return count ?? 0;
  };
  const [total, naMinhaUnidade, vencidos, lista] = await Promise.all([
    contar(ativos()),
    unidadeId ? contar(ativos().eq("unidade_atual_id", unidadeId)) : Promise.resolve(0),
    contar(ativos().eq("situacao_prazo", "vencido")),
    db
      .from("v_processos_acompanhamento")
      .select("modelo_codigo, modelo_nome, etapa_atual_ordem, etapa_nome")
      .in("status", STATUS_ATIVOS)
      .range(0, LIMITE_LINHAS - 1),
  ]);
  if (lista.error) throw lista.error;
  const linhas = (lista.data ?? []) as LinhaPainel[];

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
    ativos: total,
    naMinhaUnidade,
    vencidos,
    agrupamentoParcial: linhas.length >= LIMITE_LINHAS,
    porTipo: ordenar(porTipo),
    porEtapa: ordenar(porEtapa).slice(0, 10),
  };
}

export function useWorkflowDashboardStats() {
  const unidade = useUnidadeDoUsuario();
  const query = useQuery({
    // as mutações do acompanhamento (criarMutacaoRpc) invalidam esta chave
    queryKey: [CHAVE_PAINEL_WORKFLOW, unidade.data ?? null],
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

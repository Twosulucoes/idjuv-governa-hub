// Hook do relatório anual de governança e integridade (RelatorioGovernancaPage).
// Lê só os cadastros reais (matriz de riscos, planos de tratamento, controles internos, checklists de
// conformidade, matriz RACI e canal de denúncias) e devolve os mesmos dados que o PDF imprime.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  limitesDoExercicio,
  montarRelatorioGovernanca,
  type LinhasRelatorioGovernanca,
} from "@/lib/relatorioGovernanca";
import type { DadosRelatorioGovernanca } from "@/lib/documentos/modelos/governanca/relatorioAnual";

/** Lança o erro do Supabase ou devolve as linhas (lista vazia quando não há). */
function linhas<T>(r: { data: T[] | null; error: unknown }): T[] {
  if (r.error) throw r.error;
  return r.data ?? [];
}

async function buscarLinhas(ano: number, incluirDenuncias: boolean): Promise<LinhasRelatorioGovernanca> {
  const { inicio, fim, proximoInicio } = limitesDoExercicio(ano);

  const [checklists, processos, riscos, planos, avaliacoes, denuncias] = await Promise.all([
    supabase.from("checklists_conformidade").select("id, nome, orgao_fiscalizador").eq("exercicio", ano).eq("ativo", true).order("nome"),
    supabase.from("matriz_raci_processos").select("modulo_sistema").eq("ativo", true).lt("created_at", proximoInicio),
    supabase
      .from("riscos_institucionais")
      .select("nivel_risco_inerente, nivel_risco_residual, status")
      .eq("ativo", true)
      .lte("data_identificacao", fim),
    supabase
      .from("planos_tratamento_risco")
      .select("titulo, status, percentual_execucao, prazo_inicio, prazo_conclusao")
      .eq("ativo", true)
      .lt("created_at", proximoInicio)
      .order("prazo_conclusao", { ascending: true, nullsFirst: false }),
    supabase.from("avaliacoes_controle").select("efetividade").gte("data_avaliacao", inicio).lte("data_avaliacao", fim),
    incluirDenuncias
      ? supabase.from("denuncias").select("status").gte("created_at", inicio).lt("created_at", proximoInicio)
      : Promise.resolve(null),
  ]);

  const listaChecklists = linhas(checklists);
  const itensChecklist = listaChecklists.length
    ? linhas(await supabase.from("itens_checklist").select("id, checklist_id").eq("ativo", true).in("checklist_id", listaChecklists.map((c) => c.id)))
    : [];
  const respostasChecklist = itensChecklist.length
    ? linhas(
        await supabase
          .from("respostas_checklist")
          .select("item_id, status, updated_at")
          .eq("exercicio", ano)
          .in("item_id", itensChecklist.map((i) => i.id)),
      )
    : [];

  return {
    checklists: listaChecklists,
    itensChecklist,
    respostasChecklist,
    processos: linhas(processos),
    riscos: linhas(riscos),
    planos: linhas(planos),
    avaliacoesControle: linhas(avaliacoes),
    denuncias: denuncias === null ? null : linhas(denuncias),
  };
}

/**
 * Dados do relatório de governança do exercício `ano`.
 * `incluirDenuncias` só com permissão `integridade.gerenciar`: sem ela a RLS devolve lista vazia, que
 * seria lida como "zero denúncias"; por isso a seção nem é consultada.
 */
export function useRelatorioGovernanca(ano: number, incluirDenuncias: boolean) {
  return useQuery({
    queryKey: ["relatorio-governanca", ano, incluirDenuncias],
    queryFn: async (): Promise<DadosRelatorioGovernanca> => montarRelatorioGovernanca(ano, await buscarLinhas(ano, incluirDenuncias)),
  });
}

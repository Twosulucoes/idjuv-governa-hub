/**
 * Quadro de vagas (migração 20261012150000_rh_quadro_vagas).
 *
 * Cada vaga do cargo tem código único (`vagas_cargo`); quem ocupa é o provimento (`provimentos.vaga_id`), e o banco
 * recusa duas pessoas na mesma vaga no mesmo período. A situação atual vem de `v_quadro_vagas` e a linha do tempo de
 * `v_vagas_historico`. A importação da planilha é a RPC `rh_importar_quadro_vagas` (simula antes de gravar).
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type SituacaoVaga = "livre" | "ocupada" | "extinta";

export interface VagaQuadro {
  id: string;
  codigo: string;
  cargo_id: string;
  cargo_nome: string;
  cargo_sigla: string | null;
  cargo_categoria: string;
  unidade_id: string | null;
  unidade_nome: string | null;
  unidade_sigla: string | null;
  data_criacao: string;
  ato_criacao: string | null;
  data_extincao: string | null;
  ato_extincao: string | null;
  observacoes: string | null;
  situacao: SituacaoVaga;
  provimento_id: string | null;
  ocupante_servidor_id: string | null;
  ocupante_nome: string | null;
  ocupante_desde: string | null;
  ocupante_status: string | null;
}

export type EventoVaga = "vaga_criada" | "vaga_extinta" | "entrada" | "saida";

export interface EventoHistoricoVaga {
  data: string;
  evento: EventoVaga;
  vaga_id: string;
  codigo: string;
  cargo_id: string;
  cargo_nome: string;
  cargo_sigla: string | null;
  unidade_id: string | null;
  unidade_sigla: string | null;
  provimento_id: string | null;
  servidor_id: string | null;
  servidor_nome: string | null;
  detalhe: string | null;
  registrado_em: string | null;
}

/** Uma linha da planilha, já com as chaves que a RPC entende. */
export interface LinhaPlanilhaVagas {
  cargo: string;
  sigla?: string;
  categoria?: string;
  vencimento?: string;
  unidade?: string;
  quantidade?: string;
  codigo?: string;
  lei_numero?: string;
  lei_data?: string;
}

export interface RelatorioImportacaoVagas {
  gravado: boolean;
  linhas: number;
  cargos_criados: number;
  cargos_existentes: number;
  vagas_criadas: number;
  vagas_existentes: number;
  ocupantes_vinculados: number;
  erros: { linha: number; erro: string }[];
  avisos: { linha?: number; aviso: string }[];
}

// As views e a RPC ainda não estão em types.ts (gerado): consulta sem tipagem do client.
const db = supabase as unknown as SupabaseClient;

// No mesmo dia, a saída do anterior vem antes da entrada do sucessor.
const ORDEM_EVENTO: Record<EventoVaga, number> = { vaga_criada: 0, saida: 1, entrada: 2, vaga_extinta: 3 };

export function useQuadroVagas() {
  return useQuery({
    queryKey: ["quadro-vagas"],
    queryFn: async () => {
      const { data, error } = await db.from("v_quadro_vagas").select("*").order("codigo");
      if (error) throw error;
      return (data ?? []) as VagaQuadro[];
    },
  });
}

/** Linha do tempo de uma vaga (vagaId) ou de todo o quadro (sem vagaId), da mais recente para a mais antiga. */
export function useHistoricoVagas(vagaId?: string | null, habilitado = true) {
  return useQuery({
    queryKey: ["quadro-vagas", "historico", vagaId ?? "todas"],
    enabled: habilitado,
    queryFn: async () => {
      let query = db.from("v_vagas_historico").select("*").order("data", { ascending: false }).limit(1000);
      if (vagaId) query = query.eq("vaga_id", vagaId);
      const { data, error } = await query;
      if (error) throw error;
      return ((data ?? []) as EventoHistoricoVaga[]).sort(
        (a, b) => b.data.localeCompare(a.data) || ORDEM_EVENTO[b.evento] - ORDEM_EVENTO[a.evento],
      );
    },
  });
}

export function useImportarQuadroVagas() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ linhas, gravar }: { linhas: LinhaPlanilhaVagas[]; gravar: boolean }) => {
      const { data, error } = await db.rpc("rh_importar_quadro_vagas", { p_linhas: linhas, p_gravar: gravar });
      if (error) throw new Error(error.message);
      return data as RelatorioImportacaoVagas;
    },
    onSuccess: (relatorio) => {
      if (relatorio.gravado) {
        queryClient.invalidateQueries({ queryKey: ["quadro-vagas"] });
        queryClient.invalidateQueries({ queryKey: ["cargos"] });
      }
    },
  });
}

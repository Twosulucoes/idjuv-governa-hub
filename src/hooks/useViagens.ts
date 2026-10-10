/**
 * Camada de dados de viagens a serviço e diárias (tabela `viagens_diarias`).
 * Listagem com o servidor (e o cargo, que define o valor da diária), servidores
 * para o formulário e mutations de criar/atualizar/status/cancelar/excluir/
 * workflow DIRAF. Regras puras em `@/lib/diariasRegras`.
 *
 * A chave `["viagens"]` é prefixo de todas as listagens; `["viagens-servidor", id]`
 * é a aba de histórico de `ServidorDetalhePage` e `["rh-dashboard-stats"]` o KPI
 * do painel de RH — ambas são invalidadas a cada alteração.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { SemPermissaoError, exigirLinhaAfetada } from "@/lib/supabaseErros";
import { textoCancelamento } from "@/lib/diariasRegras";
import type {
  ServidorParaViagem,
  StatusViagemDiaria,
  ViagemDiaria,
  ViagemDiariaComServidor,
  ViagemDiariaEdicao,
  ViagemDiariaInput,
  WorkflowDirafStatus,
} from "@/types/rh";

export { SemPermissaoError };

const SELECT_SERVIDOR = "id, nome_completo, matricula, cargo_atual_id, cargo:cargos!servidores_cargo_atual_id_fkey(categoria, nivel_hierarquico)";

const SELECT_COM_SERVIDOR = `
  *,
  servidor:servidores!viagens_diarias_servidor_id_fkey(${SELECT_SERVIDOR})
`;

/** Formata data `YYYY-MM-DD` sem deslocamento de fuso. */
export const formatarDataViagem = (d?: string | null) => (d ? format(parseISO(d), "dd/MM/yyyy") : "-");

export interface FiltrosViagens {
  servidorId?: string | null;
  status?: StatusViagemDiaria | null;
}

/** Viagens com o servidor, mais recentes primeiro; filtros opcionais aplicados no banco. */
export function useViagens(filtros: FiltrosViagens = {}) {
  const servidorId = filtros.servidorId ?? null;
  const status = filtros.status ?? null;
  return useQuery({
    queryKey: ["viagens", { servidorId, status }],
    queryFn: async () => {
      let query = supabase.from("viagens_diarias").select(SELECT_COM_SERVIDOR);
      if (servidorId) query = query.eq("servidor_id", servidorId);
      if (status) query = query.eq("status", status);
      const { data, error } = await query.order("data_saida", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ViagemDiariaComServidor[];
    },
  });
}

/** Servidores ativos para seleção no formulário, com o cargo atual (categoria e nível). */
export function useServidoresParaViagem() {
  return useQuery({
    queryKey: ["servidores-viagem"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servidores")
        .select(SELECT_SERVIDOR)
        .eq("ativo", true)
        .order("nome_completo");
      if (error) throw error;
      return (data || []) as unknown as ServidorParaViagem[];
    },
  });
}

/** Invalida as queries afetadas por qualquer alteração em viagens. */
function useInvalidarViagens() {
  const queryClient = useQueryClient();
  return (servidorId?: string | null) => {
    queryClient.invalidateQueries({ queryKey: ["viagens"] });
    queryClient.invalidateQueries({ queryKey: ["rh-dashboard-stats"] });
    if (servidorId) queryClient.invalidateQueries({ queryKey: ["viagens-servidor", servidorId] });
  };
}

export function useCriarViagem() {
  const invalidar = useInvalidarViagens();
  return useMutation({
    mutationFn: async (input: ViagemDiariaInput) => {
      const { data, error } = await supabase
        .from("viagens_diarias")
        .insert({ ...input, status: input.status || "solicitada" })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ViagemDiaria;
    },
    onSuccess: (data) => invalidar(data.servidor_id),
  });
}

export function useAtualizarViagem() {
  const invalidar = useInvalidarViagens();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<ViagemDiariaEdicao> & { id: string }) => {
      const resultado = await supabase.from("viagens_diarias").update(input).eq("id", id).select("id, servidor_id");
      return exigirLinhaAfetada(resultado, "alterar");
    },
    onSuccess: (data) => invalidar(data.servidor_id),
  });
}

export function useAtualizarStatusViagem() {
  const invalidar = useInvalidarViagens();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: StatusViagemDiaria }) => {
      const resultado = await supabase.from("viagens_diarias").update({ status }).eq("id", id).select("id, servidor_id");
      return exigirLinhaAfetada(resultado, "alterar");
    },
    onSuccess: (data) => invalidar(data.servidor_id),
  });
}

/** Cancela a viagem registrando o motivo em `observacoes` (não há coluna própria). */
export function useCancelarViagem() {
  const invalidar = useInvalidarViagens();
  return useMutation({
    mutationFn: async ({ id, motivo, observacoesAtuais }: { id: string; motivo: string; observacoesAtuais?: string | null }) => {
      const resultado = await supabase
        .from("viagens_diarias")
        .update({ status: "cancelada", observacoes: textoCancelamento(motivo, new Date(), observacoesAtuais) })
        .eq("id", id)
        .select("id, servidor_id");
      return exigirLinhaAfetada(resultado, "alterar");
    },
    onSuccess: (data) => invalidar(data.servidor_id),
  });
}

export function useExcluirViagem() {
  const invalidar = useInvalidarViagens();
  return useMutation({
    mutationFn: async ({ id, servidorId }: { id: string; servidorId?: string }) => {
      // Com RLS, um DELETE sem permissão não dá erro: retorna zero linhas.
      // O `.select()` permite detectar isso e avisar o usuário.
      const resultado = await supabase.from("viagens_diarias").delete().eq("id", id).select("id");
      exigirLinhaAfetada(resultado, "excluir");
      return servidorId;
    },
    onSuccess: (servidorId) => invalidar(servidorId),
  });
}

export interface WorkflowDirafInput {
  id: string;
  status: WorkflowDirafStatus;
  numeroSei?: string | null;
  observacoes?: string | null;
}

/**
 * Workflow DIRAF: grava etapa, nº do SEI e observações; carimba `solicitado_em`/
 * `concluido_em` conforme a etapa. Concluir exige o número do processo SEI.
 */
export function useAtualizarWorkflowDiraf() {
  const invalidar = useInvalidarViagens();
  return useMutation({
    mutationFn: async ({ id, status, numeroSei, observacoes }: WorkflowDirafInput) => {
      const numeroSeiLimpo = numeroSei?.trim() || null;
      if (status === "concluido" && !numeroSeiLimpo) {
        throw new Error("O número do processo SEI é obrigatório para concluir o workflow.");
      }
      const atualizacao: Partial<ViagemDiariaInput> = {
        workflow_diraf_status: status,
        workflow_diraf_observacoes: observacoes?.trim() || null,
      };
      if (numeroSeiLimpo) atualizacao.numero_sei_diarias = numeroSeiLimpo;
      if (status === "solicitado") atualizacao.workflow_diraf_solicitado_em = new Date().toISOString();
      if (status === "concluido") atualizacao.workflow_diraf_concluido_em = new Date().toISOString();

      const resultado = await supabase.from("viagens_diarias").update(atualizacao).eq("id", id).select("id, servidor_id");
      return exigirLinhaAfetada(resultado, "alterar");
    },
    onSuccess: (data) => invalidar(data.servidor_id),
  });
}

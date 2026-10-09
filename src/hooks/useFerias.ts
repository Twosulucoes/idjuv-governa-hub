/**
 * Camada de dados de férias de servidores (tabela `ferias_servidor`).
 * Listagem geral, férias por servidor, ocupações para checagem de sobreposição
 * e mutations de criar/atualizar/status/excluir. Regras puras em `@/lib/feriasRegras`.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import {
  AFASTAMENTO_LABELS,
  LICENCA_LABELS,
  FERIAS_STATUS_LABELS,
  type FeriasServidor,
  type FeriasServidorComServidor,
  type FeriasServidorInput,
  type Ocupacao,
  type StatusFeriasServidor,
} from "@/types/rh";

const SELECT_COM_SERVIDOR = `
  *,
  servidor:servidores!ferias_servidor_servidor_id_fkey(id, nome_completo)
`;

/** Formata data `YYYY-MM-DD` sem deslocamento de fuso; vazio = "em aberto". */
export const formatarDataFerias = (d?: string | null) => (d ? format(parseISO(d), "dd/MM/yyyy") : "em aberto");
const fmt = formatarDataFerias;

/** Servidor na lista do formulário (data de admissão sugere o período aquisitivo). */
export interface ServidorParaFerias {
  id: string;
  nome_completo: string;
  data_admissao?: string | null;
}

/** Todas as férias, com o servidor, mais recentes primeiro. */
export function useFerias() {
  return useQuery({
    queryKey: ["ferias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ferias_servidor")
        .select(SELECT_COM_SERVIDOR)
        .order("data_inicio", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as FeriasServidorComServidor[];
    },
  });
}

/** Servidores ativos para seleção no formulário. */
export function useServidoresParaFerias() {
  return useQuery({
    queryKey: ["servidores-ferias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servidores")
        .select("id, nome_completo, data_admissao")
        .eq("ativo", true)
        .order("nome_completo");
      if (error) throw error;
      return (data || []) as ServidorParaFerias[];
    },
  });
}

/** Todas as férias de um servidor (base do saldo por período aquisitivo). */
export function useFeriasServidor(servidorId?: string | null) {
  return useQuery({
    queryKey: ["ferias-servidor", servidorId],
    enabled: !!servidorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ferias_servidor")
        .select("*")
        .eq("servidor_id", servidorId!)
        .order("periodo_aquisitivo_inicio", { ascending: false })
        .order("parcela", { ascending: true });
      if (error) throw error;
      return (data || []) as FeriasServidor[];
    },
  });
}

/**
 * Períodos em que o servidor já está ocupado: férias não canceladas, licenças/
 * afastamentos ativos ou prorrogados e cessões de saída ativas, normalizados em `Ocupacao`.
 */
export function useOcupacoesServidor(servidorId?: string | null) {
  return useQuery({
    queryKey: ["ocupacoes-servidor", servidorId],
    enabled: !!servidorId,
    queryFn: async (): Promise<Ocupacao[]> => {
      const [ferias, licencas, cessoes] = await Promise.all([
        supabase
          .from("ferias_servidor")
          .select("id, data_inicio, data_fim, status, parcela, total_parcelas")
          .eq("servidor_id", servidorId!)
          .or("status.is.null,status.neq.cancelada"),
        supabase
          .from("licencas_afastamentos")
          .select("id, data_inicio, data_fim, status, tipo_afastamento, tipo_licenca")
          .eq("servidor_id", servidorId!)
          .in("status", ["ativa", "prorrogada"]),
        supabase
          .from("cessoes")
          .select("id, data_inicio, data_fim, ativa, tipo, orgao_destino")
          .eq("servidor_id", servidorId!)
          .eq("ativa", true)
          .eq("tipo", "saida"),
      ]);
      if (ferias.error) throw ferias.error;
      if (licencas.error) throw licencas.error;
      if (cessoes.error) throw cessoes.error;

      const ocupacoes: Ocupacao[] = [];

      for (const f of ferias.data || []) {
        const rotulo = FERIAS_STATUS_LABELS[(f.status || "programada") as StatusFeriasServidor] || f.status;
        ocupacoes.push({
          id: f.id,
          tipo: "ferias",
          inicio: f.data_inicio,
          fim: f.data_fim,
          status: f.status || undefined,
          descricao: `Férias (${rotulo}, parcela ${f.parcela ?? 1}/${f.total_parcelas ?? 1}) de ${fmt(f.data_inicio)} a ${fmt(f.data_fim)}`,
        });
      }

      for (const l of licencas.data || []) {
        const nome =
          (l.tipo_licenca && LICENCA_LABELS[l.tipo_licenca as keyof typeof LICENCA_LABELS]) ||
          AFASTAMENTO_LABELS[l.tipo_afastamento as keyof typeof AFASTAMENTO_LABELS] ||
          "Licença/afastamento";
        ocupacoes.push({
          id: l.id,
          tipo: "licenca",
          inicio: l.data_inicio,
          fim: l.data_fim,
          status: l.status || undefined,
          descricao: `${nome} de ${fmt(l.data_inicio)} a ${fmt(l.data_fim)}`,
        });
      }

      for (const c of cessoes.data || []) {
        ocupacoes.push({
          id: c.id,
          tipo: "cessao",
          inicio: c.data_inicio,
          fim: c.data_fim,
          descricao: `Cessão para ${c.orgao_destino || "outro órgão"} de ${fmt(c.data_inicio)} a ${fmt(c.data_fim)}`,
        });
      }

      return ocupacoes;
    },
  });
}

/** Invalida as queries afetadas por qualquer alteração em férias. */
function useInvalidarFerias() {
  const queryClient = useQueryClient();
  return (servidorId?: string | null) => {
    queryClient.invalidateQueries({ queryKey: ["ferias"] });
    if (servidorId) {
      queryClient.invalidateQueries({ queryKey: ["ferias-servidor", servidorId] });
      queryClient.invalidateQueries({ queryKey: ["ocupacoes-servidor", servidorId] });
    }
  };
}

/**
 * Erro lançado quando a operação não afeta linha alguma: com RLS, UPDATE/DELETE
 * sem permissão não dá erro, apenas retorna zero linhas.
 */
export class SemPermissaoError extends Error {
  constructor(acao: "alterar" | "excluir") {
    super(
      acao === "excluir"
        ? "Sem permissão para excluir; cancele o registro."
        : "Sem permissão para alterar o registro.",
    );
    this.name = "SemPermissaoError";
  }
}

/** Resultado de UPDATE/DELETE: lança se houve erro ou se nenhuma linha foi afetada. */
function exigirLinhaAfetada<T>(
  resultado: { data: T[] | null; error: { code?: string; message: string } | null },
  acao: "alterar" | "excluir",
): T {
  if (resultado.error) {
    if (resultado.error.code === "42501") throw new SemPermissaoError(acao);
    throw resultado.error;
  }
  if (!resultado.data || resultado.data.length === 0) throw new SemPermissaoError(acao);
  return resultado.data[0];
}

export function useCriarFerias() {
  const invalidar = useInvalidarFerias();
  return useMutation({
    mutationFn: async (input: FeriasServidorInput) => {
      const { data, error } = await supabase
        .from("ferias_servidor")
        .insert({ ...input, status: input.status || "programada" })
        .select()
        .single();
      if (error) throw error;
      return data as FeriasServidor;
    },
    onSuccess: (data) => invalidar(data.servidor_id),
  });
}

export function useAtualizarFerias() {
  const invalidar = useInvalidarFerias();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<FeriasServidorInput> & { id: string }) => {
      const resultado = await supabase.from("ferias_servidor").update(input).eq("id", id).select("id, servidor_id");
      return exigirLinhaAfetada(resultado, "alterar");
    },
    onSuccess: (data) => invalidar(data.servidor_id),
  });
}

export function useAtualizarStatusFerias() {
  const invalidar = useInvalidarFerias();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: StatusFeriasServidor }) => {
      const resultado = await supabase.from("ferias_servidor").update({ status }).eq("id", id).select("id, servidor_id");
      return exigirLinhaAfetada(resultado, "alterar");
    },
    onSuccess: (data) => invalidar(data.servidor_id),
  });
}


export function useExcluirFerias() {
  const invalidar = useInvalidarFerias();
  return useMutation({
    mutationFn: async ({ id, servidorId }: { id: string; servidorId?: string }) => {
      // Com RLS, um DELETE sem permissão não dá erro: retorna zero linhas.
      // O `.select()` permite detectar isso e avisar o usuário.
      const resultado = await supabase.from("ferias_servidor").delete().eq("id", id).select("id");
      exigirLinhaAfetada(resultado, "excluir");
      return servidorId;
    },
    onSuccess: (servidorId) => invalidar(servidorId),
  });
}

/**
 * Comissões e membros (tabelas `comissoes` e `comissoes_membros`, migração 20261011020000_lancamento_por_setor.sql).
 * Membro de comissão vigente, com ato, é fundamento de lançamento no módulo e no objeto da comissão. A escrita exige
 * `rh.comissoes.gerenciar` (RLS); a tela só esconde os botões.
 *
 * As tabelas ainda não estão em types.ts (gerado, não editar): consulta sem tipagem do client, como em
 * useTrilhaAuditoria.ts.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { descreverErroBanco } from "@/lib/folhaFichaRegras";
import type { Comissao, DadosComissao, DadosMembroComissao, MembroComissao } from "@/types/comissao";

// Cast local mínimo: comissoes e comissoes_membros não estão em types.ts (gerado); este client só é usado aqui.
const db = supabase as unknown as SupabaseClient;

const CHAVE = ["comissoes"] as const;

const COLUNAS_COMISSAO =
  "id, nome, tipo, modulo, objeto_tipo, objeto_id, ato_tipo, ato_numero, ato_data, ato_doe_numero, ato_doe_data, " +
  "data_inicio, data_fim, motivo, status, created_at";

const COLUNAS_MEMBRO =
  "id, comissao_id, servidor_id, papel, data_inicio, data_fim, servidor:servidores(id, nome_completo, matricula)";

/** Comissões com os membros (a lista é pequena: sem paginação no servidor). */
export function useComissoes() {
  return useQuery({
    queryKey: CHAVE,
    queryFn: async (): Promise<Comissao[]> => {
      const { data, error } = await db
        .from("comissoes")
        .select(`${COLUNAS_COMISSAO}, membros:comissoes_membros(${COLUNAS_MEMBRO})`)
        .order("data_inicio", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Comissao[];
    },
  });
}

/** Campos de texto vazios viram nulo (o banco não guarda "" no lugar de "não informado"). */
function limpar<T extends Record<string, unknown>>(dados: T): T {
  const saida: Record<string, unknown> = {};
  Object.entries(dados).forEach(([k, v]) => {
    saida[k] = typeof v === "string" && v.trim() === "" ? null : typeof v === "string" ? v.trim() : v;
  });
  return saida as T;
}

export function useSalvarComissao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dados }: { id?: string; dados: DadosComissao }) => {
      const linha = limpar(dados);
      if (id) {
        const { error } = await db.from("comissoes").update(linha).eq("id", id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await db.from("comissoes").insert(linha).select("id").single();
      if (error) throw error;
      return (data as { id: string }).id;
    },
    onSuccess: (_id, { id }) => {
      qc.invalidateQueries({ queryKey: CHAVE });
      qc.invalidateQueries({ queryKey: ["fundamentos-lancamento"] });
      toast.success(id ? "Comissão atualizada." : "Comissão cadastrada.");
    },
    onError: (erro) => toast.error(`Não foi possível gravar a comissão: ${descreverErroBanco(erro)}`),
  });
}

export function useSalvarMembroComissao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dados }: { id?: string; dados: DadosMembroComissao }) => {
      const linha = limpar(dados);
      const { error } = id
        ? await db.from("comissoes_membros").update(linha).eq("id", id)
        : await db.from("comissoes_membros").insert(linha);
      if (error) throw error;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: CHAVE });
      qc.invalidateQueries({ queryKey: ["fundamentos-lancamento"] });
      toast.success(id ? "Membro atualizado." : "Membro incluído.");
    },
    onError: (erro) => toast.error(`Não foi possível gravar o membro: ${descreverErroBanco(erro)}`),
  });
}

export function useExcluirMembroComissao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (membro: Pick<MembroComissao, "id">) => {
      const { error } = await db.from("comissoes_membros").delete().eq("id", membro.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CHAVE });
      qc.invalidateQueries({ queryKey: ["fundamentos-lancamento"] });
      toast.success("Membro retirado da comissão.");
    },
    onError: (erro) => toast.error(`Não foi possível retirar o membro: ${descreverErroBanco(erro)}`),
  });
}

export interface ServidorOpcao {
  id: string;
  nome_completo: string;
  matricula: string | null;
}

/** Servidores ativos para escolher membro. */
export function useServidoresAtivosOpcoes(habilitado = true) {
  return useQuery({
    queryKey: ["servidores-ativos-opcoes"],
    enabled: habilitado,
    queryFn: async (): Promise<ServidorOpcao[]> => {
      const { data, error } = await supabase
        .from("servidores")
        .select("id, nome_completo, matricula")
        .eq("ativo", true)
        .order("nome_completo");
      if (error) throw error;
      return (data ?? []) as ServidorOpcao[];
    },
  });
}

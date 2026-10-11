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
import { buscarTodasPaginas } from "@/hooks/useRelatoriosRH";
import type { Comissao, DadosComissao, DadosMembroComissao, MembroComissao } from "@/types/comissao";

// Cast local mínimo: comissoes e comissoes_membros não estão em types.ts (gerado); este client só é usado aqui.
const db = supabase as unknown as SupabaseClient;

const CHAVE = ["comissoes"] as const;

const COLUNAS_COMISSAO =
  "id, nome, tipo, modulo, objeto_tipo, objeto_id, ato_tipo, ato_numero, ato_data, ato_doe_numero, ato_doe_data, " +
  "data_inicio, data_fim, motivo, status, created_at";

const COLUNAS_MEMBRO =
  "id, comissao_id, servidor_id, papel, data_inicio, data_fim, servidor:servidores(id, nome_completo, matricula)";

/**
 * Recusas do banco ao gravar comissão e membro, em texto para a tela:
 *   - objeto obrigatório quando o tipo não é "outra" (CHECK de comissoes) e par objeto_tipo/objeto_id;
 *   - membro que é o próprio servidor de quem grava ou quem criou a comissão (RAISE do trigger: o texto do banco passa);
 *   - período inválido (CHECK).
 * O resto vai para `descreverErroBanco` (sem DETAIL, sem nome de tabela).
 */
export function mensagemErroComissao(erro: unknown): string {
  const e = (erro && typeof erro === "object" ? erro : null) as { code?: string; message?: string } | null;
  const msg = e?.message ?? "";
  if (e?.code === "23514") {
    if (/objeto/i.test(msg)) {
      return "Informe o objeto da comissão (campanha, contrato ou processo): é obrigatório quando o tipo não é \"Outra\".";
    }
    if (/periodo/i.test(msg)) return "O fim não pode ser antes do início.";
  }
  if (e?.code === "23505") return "Este servidor já é membro desta comissão.";
  // Regras de trigger (autoinclusão, criador da comissão): o RAISE traz o motivo em português
  const recusaRls = e?.code === "42501" && /row-level security/i.test(msg);
  if (msg && (e?.code === "P0001" || (e?.code === "42501" && !recusaRls) || e?.code === "22023")) return msg;
  return descreverErroBanco(erro);
}

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
    onError: (erro) => toast.error(`Não foi possível gravar a comissão: ${mensagemErroComissao(erro)}`),
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
    onError: (erro) => toast.error(`Não foi possível gravar o membro: ${mensagemErroComissao(erro)}`),
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
    onError: (erro) => toast.error(`Não foi possível retirar o membro: ${mensagemErroComissao(erro)}`),
  });
}

export interface ServidorOpcao {
  id: string;
  nome_completo: string;
  matricula: string | null;
}

/** Servidores ativos para escolher membro (todas as páginas: o PostgREST corta em 1000 por consulta). */
export function useServidoresAtivosOpcoes(habilitado = true) {
  return useQuery({
    queryKey: ["servidores-ativos-opcoes"],
    enabled: habilitado,
    queryFn: () =>
      buscarTodasPaginas<ServidorOpcao>((de, ate) =>
        supabase
          .from("servidores")
          .select("id, nome_completo, matricula")
          .eq("ativo", true)
          .order("nome_completo")
          .order("id")
          .range(de, ate),
      ),
  });
}

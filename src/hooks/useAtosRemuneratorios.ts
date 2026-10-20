/**
 * Atos remuneratórios (migração 20261020100000): o ato que muda valores da folha e o que ele muda.
 *
 * Contrato com o banco:
 *  - ler exige o módulo rh; criar, editar, excluir e aplicar exigem também financeiro.folha.configurar (RLS e RPC);
 *  - o ato nasce em rascunho; itens só mudam com o ato em rascunho; aplicado, o ato e os itens não mudam nem saem
 *    (RHE02); para corrigir, registra-se outro ato;
 *  - `aplicar_ato_remuneratorio` aplica tudo ou nada e grava o valor anterior de cada item; a folha passa a ler o
 *    vencimento do cargo pela vigência (`vencimento_cargo_em`).
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { descreverErroBanco } from "@/lib/folhaFichaRegras";
import type { AlvoItemAto } from "@/lib/atosRemuneratorios";

const CHAVE = ["atos-remuneratorios"];

/** Texto do RAISE das regras do ato (RHE02, 22023, P0002 e o 42501 da RPC) passa como veio; o resto, texto fixo. */
export function mensagemErroAto(erro: unknown): string {
  const e = (erro && typeof erro === "object" ? erro : null) as { code?: string; message?: string } | null;
  const recusaRls = e?.code === "42501" && /row-level security/i.test(e.message ?? "");
  if (e?.message && ["RHE02", "22023", "P0002", "42501"].includes(e.code ?? "") && !recusaRls) return e.message;
  if (e?.code === "23505") return "Este alvo já está no ato: edite o item existente.";
  return descreverErroBanco(erro);
}

const consultaAtos = () =>
  supabase
    .from("atos_remuneratorios")
    .select(
      `*, itens:atos_remuneratorios_itens(*, cargo:cargos(id, nome, sigla, vencimento_base),
       rubrica:rubricas(id, codigo, descricao, formula_valor))`,
    )
    .order("vigencia_inicio", { ascending: false })
    .order("created_at", { ascending: false });

export type AtoRemuneratorio = NonNullable<Awaited<ReturnType<typeof consultaAtos>>["data"]>[number];
export type ItemAtoRemuneratorio = AtoRemuneratorio["itens"][number];

export function useAtosRemuneratorios() {
  return useQuery({
    queryKey: CHAVE,
    queryFn: async () => {
      const { data, error } = await consultaAtos();
      if (error) throw error;
      return data;
    },
  });
}

/** Cargos ativos com o vencimento do cadastro (valor vigente hoje), para os itens e o reajuste geral. */
export function useCargosParaReajuste() {
  return useQuery({
    queryKey: ["cargos", "reajuste"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cargos")
        .select("id, nome, sigla, categoria, vencimento_base")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });
}

/** Última competência com folha fechada, para avisar vigência retroativa. */
export function useUltimaFolhaFechada() {
  return useQuery({
    queryKey: ["folhas-pagamento", "ultima-fechada"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("folhas_pagamento")
        .select("competencia_ano, competencia_mes")
        .eq("status", "fechada")
        .order("competencia_ano", { ascending: false })
        .order("competencia_mes", { ascending: false })
        .limit(1);
      if (error) throw error;
      const f = data?.[0];
      return f ? { ano: f.competencia_ano, mes: f.competencia_mes } : null;
    },
  });
}

function useInvalidar() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: CHAVE });
}

export type DadosAto = Pick<
  TablesInsert<"atos_remuneratorios">,
  "tipo_ato" | "numero" | "data_ato" | "data_publicacao" | "vigencia_inicio" | "ementa" | "percentual" | "processo_sei" | "link_publicacao" | "observacoes"
>;

export function useSalvarAto() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: async (p: { id?: string; dados: DadosAto }) => {
      if (p.id) {
        const { data, error } = await supabase
          .from("atos_remuneratorios")
          .update(p.dados as TablesUpdate<"atos_remuneratorios">)
          .eq("id", p.id)
          .select("id")
          .single();
        if (error) throw error;
        return data.id;
      }
      const { data, error } = await supabase.from("atos_remuneratorios").insert(p.dados).select("id").single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      invalidar();
      toast.success("Ato salvo.");
    },
    onError: (e) => toast.error(mensagemErroAto(e)),
  });
}

export function useExcluirAto() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from("atos_remuneratorios").delete().eq("id", id).select("id");
      if (error) throw error;
      if (!data?.length) throw new Error("O ato não foi excluído (já aplicado ou sem permissão).");
    },
    onSuccess: () => {
      invalidar();
      toast.success("Rascunho excluído.");
    },
    onError: (e) => toast.error(mensagemErroAto(e)),
  });
}

export interface NovoItemAto {
  alvo: AlvoItemAto;
  cargo_id?: string | null;
  rubrica_id?: string | null;
  tipo_parametro?: string | null;
  valor_novo: number;
  observacao?: string | null;
}

export function useAdicionarItensAto() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: async (p: { atoId: string; itens: NovoItemAto[] }) => {
      if (!p.itens.length) return 0;
      const { error } = await supabase.from("atos_remuneratorios_itens").insert(
        p.itens.map((i) => ({
          ato_id: p.atoId,
          alvo: i.alvo,
          cargo_id: i.alvo === "cargo" ? i.cargo_id : null,
          rubrica_id: i.alvo === "rubrica" ? i.rubrica_id : null,
          tipo_parametro: i.alvo === "parametro" ? i.tipo_parametro : null,
          valor_novo: i.valor_novo,
          observacao: i.observacao ?? null,
        })),
      );
      if (error) throw error;
      return p.itens.length;
    },
    onSuccess: (n) => {
      invalidar();
      if (n) toast.success(n === 1 ? "Item incluído no ato." : `${n} itens incluídos no ato.`);
    },
    onError: (e) => toast.error(mensagemErroAto(e)),
  });
}

export function useRemoverItemAto() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("atos_remuneratorios_itens").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidar(),
    onError: (e) => toast.error(mensagemErroAto(e)),
  });
}

export function useAplicarAto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (atoId: string) => {
      const { data, error } = await supabase.rpc("aplicar_ato_remuneratorio", { p_ato_id: atoId });
      if (error) throw error;
      return data as { cargos: number; rubricas: number; parametros: number };
    },
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: CHAVE });
      queryClient.invalidateQueries({ queryKey: ["cargos"] });
      queryClient.invalidateQueries({ queryKey: ["rubricas"] });
      queryClient.invalidateQueries({ queryKey: ["parametros-folha"] });
      toast.success(`Ato aplicado: ${r.cargos} cargo(s), ${r.rubricas} rubrica(s), ${r.parametros} parâmetro(s).`);
    },
    onError: (e) => toast.error(mensagemErroAto(e)),
  });
}

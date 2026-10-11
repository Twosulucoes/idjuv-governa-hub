/**
 * Lançamento só por servidor do setor — camada de dados da fase 1 (migração 20261011020000_lancamento_por_setor.sql;
 * spec docs/superpowers/specs/2026-10-11-lancamento-por-setor-design.md).
 *
 *   - useFundamentosLancamento: RPC meus_fundamentos_lancamento() (fundamento do login em cada módulo);
 *   - useRegrasLancamento / useSalvarModoRegra: regra_lancamento (modo por módulo; escrita só do papel admin);
 *   - useSetoresModulo / useAdicionarSetorModulo / useAlterarSetorModulo: setores_modulo (escrita só do papel admin);
 *   - useUnidadesEstrutura: unidades ativas de estrutura_organizacional para escolher o setor;
 *   - useSaneamentoLancamento: RPC saneamento_lancamento() (admin ou rh.auditoria.visualizar);
 *   - useBloqueiosLancamento: linhas da trilha com fundamento negado, pelo hook da trilha (cursor na sequencia).
 *
 * A RLS e as RPCs são a fronteira; a tela só escolhe o que pedir. Recusa da regra no modo exigir: SQLSTATE RHS01, com a
 * mensagem do banco (`descreverErroBanco` em folhaFichaRegras.ts e `mensagemErroBanco` em useArquivosFolha.ts). Este hook
 * não importa useArquivosFolha: o aviso de fundamento entra no layout de todo o RH e não deve carregar o gerador de CNAB.
 *
 * As tabelas e RPCs novas ainda não estão em types.ts (gerado, não editar): consulta sem tipagem do client.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { buscarTrilhaParaExportar, type FiltrosTrilha, type LinhaTrilha } from "@/hooks/useTrilhaAuditoria";
import { descreverErroBanco } from "@/lib/folhaFichaRegras";
import { normalizarFundamentos, normalizarSaneamento, semCascata } from "@/lib/lancamentoSetorRegras";
import {
  VIAS_NEGADAS,
  type FundamentoLancamento,
  type LinhaSaneamento,
  type ModoRegraLancamento,
  type RegraLancamento,
  type SetorModulo,
} from "@/types/lancamentoSetor";

// Cast local mínimo: setores_modulo, regra_lancamento e as RPCs da regra de setor não estão em types.ts (gerado);
// este client sem tipagem só é usado neste hook.
const db = supabase as unknown as SupabaseClient;

const CHAVE_FUNDAMENTOS = ["fundamentos-lancamento"] as const;
const CHAVE_REGRAS = ["regra-lancamento"] as const;
const CHAVE_SETORES = ["setores-modulo"] as const;

// ============================================================================
// Fundamentos do login
// ============================================================================

/**
 * Fundamento de setor do login em cada módulo (modo da regra, permitido, bloqueado, via, unidade, ato). Cache curto
 * (30 s): lotação, designação e comissão mudam fora desta sessão. Erro (42501 para usuário inativo, banco sem a
 * migração) não derruba a tela: a lista fica vazia e nenhum aviso aparece.
 *
 * Autoatendimento e chefia não aparecem na RPC e continuam valendo por registro: `podeLancar` é só para lançamentos
 * do setor. Não use para travar telas do próprio servidor (pedir férias, frequência, requerimentos) nem de aprovação
 * da chefia.
 */
export function useFundamentosLancamento(habilitado = true) {
  const { isAuthenticated, user } = useAuth();
  const consulta = useQuery({
    queryKey: [...CHAVE_FUNDAMENTOS, user?.id ?? null],
    enabled: isAuthenticated && habilitado,
    staleTime: 30_000,
    retry: false,
    queryFn: async (): Promise<FundamentoLancamento[]> => {
      const { data, error } = await db.rpc("meus_fundamentos_lancamento");
      if (error) throw error;
      return normalizarFundamentos(data);
    },
  });

  const doModulo = (modulo: string) => consulta.data?.find((f) => f.modulo === modulo) ?? null;

  return {
    ...consulta,
    fundamentos: consulta.data ?? [],
    doModulo,
    /** Pode fazer lançamentos do setor no módulo (`bloqueado` = exigir sem fundamento). Enquanto carrega, não bloqueia. */
    podeLancar: (modulo: string) => !doModulo(modulo)?.bloqueado,
  };
}

// ============================================================================
// Regra por módulo
// ============================================================================

export function useRegrasLancamento() {
  return useQuery({
    queryKey: CHAVE_REGRAS,
    queryFn: async (): Promise<RegraLancamento[]> => {
      const { data, error } = await db.from("regra_lancamento").select("modulo, modo");
      if (error) throw error;
      return (data ?? []) as RegraLancamento[];
    },
  });
}

/** Troca o modo da regra de um módulo (upsert por módulo). Só o papel admin grava (RLS). */
export function useSalvarModoRegra() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ modulo, modo }: { modulo: string; modo: ModoRegraLancamento }) => {
      const { error } = await db.from("regra_lancamento").upsert({ modulo, modo }, { onConflict: "modulo" });
      if (error) throw error;
    },
    onSuccess: (_d, { modo }) => {
      qc.invalidateQueries({ queryKey: CHAVE_REGRAS });
      qc.invalidateQueries({ queryKey: CHAVE_FUNDAMENTOS });
      toast.success(`Regra gravada: modo ${modo}.`);
    },
    onError: (erro) => toast.error(`Não foi possível gravar a regra: ${descreverErroBanco(erro)}`),
  });
}

// ============================================================================
// Setores de cada módulo
// ============================================================================

/** Todos os setores cadastrados (ativos e desativados), com a unidade. */
export function useSetoresModulo() {
  return useQuery({
    queryKey: CHAVE_SETORES,
    queryFn: async (): Promise<SetorModulo[]> => {
      const { data, error } = await db
        .from("setores_modulo")
        .select("id, modulo, unidade_id, inclui_subordinadas, ativo, unidade:estrutura_organizacional(id, nome, sigla)")
        .order("modulo");
      if (error) throw error;
      return (data ?? []) as unknown as SetorModulo[];
    },
  });
}

/**
 * Inclui uma unidade como setor do módulo. Se ela já esteve cadastrada (desativada), reativa a mesma linha em vez de
 * criar outra.
 */
export function useAdicionarSetorModulo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dados: {
      modulo: string;
      unidade_id: string;
      inclui_subordinadas: boolean;
      existente?: SetorModulo | null;
    }) => {
      if (dados.existente) {
        const { error } = await db
          .from("setores_modulo")
          .update({ ativo: true, inclui_subordinadas: dados.inclui_subordinadas })
          .eq("id", dados.existente.id);
        if (error) throw error;
        return;
      }
      const { error } = await db.from("setores_modulo").insert({
        modulo: dados.modulo,
        unidade_id: dados.unidade_id,
        inclui_subordinadas: dados.inclui_subordinadas,
        ativo: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CHAVE_SETORES });
      qc.invalidateQueries({ queryKey: CHAVE_FUNDAMENTOS });
      toast.success("Setor incluído.");
    },
    onError: (erro) => toast.error(`Não foi possível incluir o setor: ${descreverErroBanco(erro)}`),
  });
}

/** Liga/desliga as subordinadas ou desativa o setor (a linha fica, para a trilha; incluir de novo a reativa). */
export function useAlterarSetorModulo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...campos }: { id: string; inclui_subordinadas?: boolean; ativo?: boolean }) => {
      const { error } = await db.from("setores_modulo").update(campos).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, { ativo }) => {
      qc.invalidateQueries({ queryKey: CHAVE_SETORES });
      qc.invalidateQueries({ queryKey: CHAVE_FUNDAMENTOS });
      toast.success(ativo === false ? "Setor retirado do módulo." : "Setor atualizado.");
    },
    onError: (erro) => toast.error(`Não foi possível alterar o setor: ${descreverErroBanco(erro)}`),
  });
}

export interface UnidadeEstrutura {
  id: string;
  nome: string;
  sigla: string | null;
  superior_id: string | null;
}

/** Unidades ativas da estrutura organizacional (para escolher setor). */
export function useUnidadesEstrutura(habilitado = true) {
  return useQuery({
    queryKey: ["estrutura-unidades-ativas"],
    enabled: habilitado,
    queryFn: async (): Promise<UnidadeEstrutura[]> => {
      const { data, error } = await supabase
        .from("estrutura_organizacional")
        .select("id, nome, sigla, superior_id")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return (data ?? []) as UnidadeEstrutura[];
    },
  });
}

// ============================================================================
// Saneamento e relatório "quem seria bloqueado"
// ============================================================================

/** Servidores ativos sem login vinculado, sem lotação vigente ou com lotação divergente. */
export function useSaneamentoLancamento(habilitado = true) {
  return useQuery({
    queryKey: ["saneamento-lancamento"],
    enabled: habilitado,
    queryFn: async (): Promise<LinhaSaneamento[]> => {
      const { data, error } = await db.rpc("saneamento_lancamento");
      if (error) throw error;
      return normalizarSaneamento(data);
    },
  });
}

/** Máximo de linhas lidas da trilha no relatório de bloqueios (o período reduz; a tela avisa quando cortou). */
export const LIMITE_RELATORIO_BLOQUEIOS = 5000;

export interface FiltrosBloqueios {
  /** yyyy-MM-dd, inclusivo. */
  inicio?: string;
  fim?: string;
  /** Sem módulo: todos os que a RLS libera (o admin lê todos; rh.auditoria.visualizar só o rh). */
  modulo?: string;
}

/**
 * Linhas da trilha cujo fundamento foi negado (negado_sem_servidor, negado_setor) no período, até o limite, lidas em
 * páginas pelo cursor da `sequencia` (buscarTrilhaParaExportar). As gravações em cascata (`fundamento.em_cascata`, a
 * linha leva o fundamento de quem disparou e não é checada) ficam de fora, no servidor e de novo aqui.
 */
export function useBloqueiosLancamento(filtros: FiltrosBloqueios, habilitado = true) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: ["bloqueios-lancamento", filtros],
    enabled: habilitado,
    queryFn: async (): Promise<{ linhas: LinhaTrilha[]; cortado: boolean }> => {
      const f: FiltrosTrilha = {
        inicio: filtros.inicio,
        fim: filtros.fim,
        modulo: filtros.modulo,
        vias: VIAS_NEGADAS,
        semCascata: true,
      };
      const lidas = await buscarTrilhaParaExportar(f, qc, LIMITE_RELATORIO_BLOQUEIOS);
      return { linhas: semCascata(lidas), cortado: lidas.length >= LIMITE_RELATORIO_BLOQUEIOS };
    },
  });
}

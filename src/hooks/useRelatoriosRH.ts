/**
 * Camada de dados dos relatórios gerenciais de RH (férias, licenças, viagens e folha).
 * Queries próprias, separadas de `useFerias`/`useViagens`/`useFolhaPagamento`, com filtros
 * aplicados no banco (período por sobreposição, status, ônus) e unidade via `!inner` no embed
 * do servidor. Regras puras em `@/lib/relatoriosRHRegras` e `@/lib/relatoriosFolhaRegras`.
 *
 * LGPD: colunas explícitas (nunca `*`); nada de CPF, CID/CRM/médico, documento
 * comprobatório, observações ou dados bancários. Folha só em agregados (sem servidor).
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUnidadesParaFiltro } from "@/hooks/useRelatorios";
import {
  filtroSobreposicao,
  ordenarPorUnidadeENome,
  periodoValido,
  rotuloUnidade,
  type FiltroPeriodoUnidade,
  type FiltroViagens,
  type LinhaFeriasRelatorio,
  type LinhaLicencaRelatorio,
  type LinhaViagemRelatorio,
} from "@/lib/relatoriosRHRegras";
import type { FichaAgregavel, FolhaResumo, ItemAgregavel } from "@/lib/relatoriosFolhaRegras";

export type { FichaAgregavel, FolhaResumo, ItemAgregavel };
export type { FiltroPeriodoUnidade, FiltroViagens, LinhaFeriasRelatorio, LinhaLicencaRelatorio, LinhaViagemRelatorio };

/** Tamanho pedido por página (o servidor pode devolver menos se `max-rows` for menor). */
const PAGINA = 1000;

/**
 * Embed do servidor com unidade e cargo. `!inner` só com filtro de unidade: faz o
 * `.eq("servidor.unidade_atual_id", …)` valer sobre a linha principal (sem ele o PostgREST
 * apenas anularia o embed).
 */
const embedServidor = (fk: string, comUnidade: boolean) =>
  `servidor:servidores!${fk}${comUnidade ? "!inner" : ""}(` +
  `id, nome_completo, matricula, unidade_atual_id, ` +
  `unidade:estrutura_organizacional!servidores_unidade_atual_id_fkey(id, nome, sigla), ` +
  `cargo:cargos!servidores_cargo_atual_id_fkey(nome))`;

/** Chave de cache estável a partir dos filtros (undefined vira null). */
const chave = (f: FiltroPeriodoUnidade | FiltroViagens) => [
  f.inicio,
  f.fim,
  f.unidadeId ?? null,
  f.status ?? null,
  "tipoOnus" in f ? (f.tipoOnus ?? null) : null,
];

/** Query construída com um offset de página (para `.range`). */
type ConstrutorPagina = (de: number, ate: number) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>;

/**
 * Percorre todas as páginas até vir uma vazia. Avança pelo que de fato veio (e não por
 * `PAGINA`), para não pular linhas se o `max-rows` do servidor for menor que o pedido.
 */
async function buscarTodasPaginas<T>(construir: ConstrutorPagina): Promise<T[]> {
  const todas: T[] = [];
  for (let de = 0; ; ) {
    const { data, error } = await construir(de, de + PAGINA - 1);
    if (error) throw error;
    const pagina = (data ?? []) as T[];
    if (pagina.length === 0) break;
    todas.push(...pagina);
    de += pagina.length;
  }
  return todas;
}

// ============================================
// FÉRIAS
// ============================================

const SELECT_FERIAS = (comUnidade: boolean) => `
  id, servidor_id, periodo_aquisitivo_inicio, periodo_aquisitivo_fim, data_inicio, data_fim,
  dias_gozados, parcela, total_parcelas, portaria_numero, status,
  ${embedServidor("ferias_servidor_servidor_id_fkey", comUnidade)}
`;

/** Férias que cruzam o período, com unidade/status opcionais; ordenadas por unidade e nome. */
export function useFeriasRelatorio(filtros: FiltroPeriodoUnidade) {
  const valido = periodoValido(filtros.inicio, filtros.fim);
  return useQuery({
    queryKey: ["relatorio-rh-ferias", ...chave(filtros)],
    enabled: valido,
    queryFn: async () => {
      const sobre = filtroSobreposicao("data_inicio", "data_fim", filtros.inicio, filtros.fim);
      const linhas = await buscarTodasPaginas<LinhaFeriasRelatorio>((de, ate) => {
        let q = supabase
          .from("ferias_servidor")
          .select(SELECT_FERIAS(!!filtros.unidadeId))
          .lte(sobre.colunaInicio, sobre.ateFim)
          .or(sobre.expressaoOr)
          .order("data_inicio")
          .order("id")
          .range(de, ate);
        if (filtros.status) q = q.eq("status", filtros.status);
        if (filtros.unidadeId) q = q.eq("servidor.unidade_atual_id", filtros.unidadeId);
        return q;
      });
      return ordenarPorUnidadeENome(linhas);
    },
  });
}

// ============================================
// LICENÇAS E AFASTAMENTOS
// ============================================

const SELECT_LICENCAS = (comUnidade: boolean) => `
  id, servidor_id, tipo_afastamento, tipo_licenca, data_inicio, data_fim, dias_afastamento,
  status, portaria_numero, orgao_destino,
  ${embedServidor("licencas_afastamentos_servidor_id_fkey", comUnidade)}
`;

/** Licenças/afastamentos que cruzam o período (`data_fim` nula entra se já iniciou). */
export function useLicencasRelatorio(filtros: FiltroPeriodoUnidade) {
  const valido = periodoValido(filtros.inicio, filtros.fim);
  return useQuery({
    queryKey: ["relatorio-rh-licencas", ...chave(filtros)],
    enabled: valido,
    queryFn: async () => {
      const sobre = filtroSobreposicao("data_inicio", "data_fim", filtros.inicio, filtros.fim);
      const linhas = await buscarTodasPaginas<LinhaLicencaRelatorio>((de, ate) => {
        let q = supabase
          .from("licencas_afastamentos")
          .select(SELECT_LICENCAS(!!filtros.unidadeId))
          .lte(sobre.colunaInicio, sobre.ateFim)
          .or(sobre.expressaoOr)
          .order("data_inicio")
          .order("id")
          .range(de, ate);
        if (filtros.status) q = q.eq("status", filtros.status);
        if (filtros.unidadeId) q = q.eq("servidor.unidade_atual_id", filtros.unidadeId);
        return q;
      });
      return ordenarPorUnidadeENome(linhas);
    },
  });
}

// ============================================
// VIAGENS E DIÁRIAS
// ============================================

const SELECT_VIAGENS = (comUnidade: boolean) => `
  id, servidor_id, destino_cidade, destino_uf, destino_pais, data_saida, data_retorno,
  tipo_onus, quantidade_diarias, valor_diaria, valor_total, status, relatorio_apresentado,
  ${embedServidor("viagens_diarias_servidor_id_fkey", comUnidade)}
`;

/** Viagens cujo intervalo saída..retorno cruza o período, com unidade/status/ônus opcionais. */
export function useViagensRelatorio(filtros: FiltroViagens) {
  const valido = periodoValido(filtros.inicio, filtros.fim);
  return useQuery({
    queryKey: ["relatorio-rh-viagens", ...chave(filtros)],
    enabled: valido,
    queryFn: async () => {
      const sobre = filtroSobreposicao("data_saida", "data_retorno", filtros.inicio, filtros.fim);
      const linhas = await buscarTodasPaginas<LinhaViagemRelatorio>((de, ate) => {
        let q = supabase
          .from("viagens_diarias")
          .select(SELECT_VIAGENS(!!filtros.unidadeId))
          .lte(sobre.colunaInicio, sobre.ateFim)
          .or(sobre.expressaoOr)
          .order("data_saida")
          .order("id")
          .range(de, ate);
        if (filtros.status) q = q.eq("status", filtros.status);
        if (filtros.tipoOnus) q = q.eq("tipo_onus", filtros.tipoOnus);
        if (filtros.unidadeId) q = q.eq("servidor.unidade_atual_id", filtros.unidadeId);
        return q;
      });
      return ordenarPorUnidadeENome(linhas);
    },
  });
}

// ============================================
// UNIDADE SELECIONADA
// ============================================

/** Rótulo "SIGLA - Nome" da unidade filtrada (para o subtítulo do PDF), ou `undefined` se "Todas". */
export function useNomeUnidadeSelecionada(unidadeId: string | undefined): string | undefined {
  const { data: unidades = [] } = useUnidadesParaFiltro();
  return useMemo(() => {
    if (!unidadeId) return undefined;
    const u = unidades.find((x) => x.id === unidadeId);
    return u ? rotuloUnidade(u) : undefined;
  }, [unidadeId, unidades]);
}

// ============================================
// FOLHA DE PAGAMENTO (só agregados, sem servidor)
// ============================================

const SELECT_FOLHAS = `
  id, competencia_ano, competencia_mes, tipo_folha, status, quantidade_servidores,
  total_bruto, total_descontos, total_liquido, total_inss_servidor, total_inss_patronal,
  total_irrf, total_encargos_patronais
`;

/** Ano plausível para competência (evita consulta com valor vazio/NaN do select). */
const anoValido = (ano: number | undefined): ano is number =>
  Number.isInteger(ano) && (ano as number) >= 2000 && (ano as number) <= 2100;

/**
 * Folhas do ano (todas, inclusive prévias/rascunho, com o status visível), por mês e tipo.
 * Query própria: `useFolhasPagamento` usa `select('*')`.
 */
export function useFolhasDoAno(ano: number | undefined) {
  return useQuery({
    queryKey: ["relatorio-folha-folhas", ano ?? null],
    enabled: anoValido(ano),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("folhas_pagamento")
        .select(SELECT_FOLHAS)
        .eq("competencia_ano", ano as number)
        .order("competencia_mes")
        .order("tipo_folha")
        .order("id");
      if (error) throw error;
      return (data ?? []) as FolhaResumo[];
    },
  });
}

/** Fichas de uma folha só com as colunas agregáveis por unidade (sem nome, CPF, banco, PIS). */
export function useFichasDaFolhaAgregadas(folhaId: string | undefined) {
  return useQuery({
    queryKey: ["relatorio-folha-fichas", folhaId ?? null],
    enabled: !!folhaId,
    queryFn: () =>
      buscarTodasPaginas<FichaAgregavel>((de, ate) =>
        supabase
          .from("fichas_financeiras")
          .select("unidade_id, unidade_nome, total_proventos, total_descontos, valor_liquido, valor_inss, valor_irrf")
          .eq("folha_id", folhaId as string)
          .order("id")
          .range(de, ate),
      ),
  });
}

/** Itens (rubricas lançadas) de todas as fichas da folha, via `!inner` na ficha. */
export function useItensDaFolha(folhaId: string | undefined) {
  return useQuery({
    queryKey: ["relatorio-folha-itens", folhaId ?? null],
    enabled: !!folhaId,
    queryFn: () =>
      buscarTodasPaginas<ItemAgregavel>((de, ate) =>
        supabase
          .from("itens_ficha_financeira")
          .select("tipo, descricao, valor, ficha:fichas_financeiras!inner(folha_id)")
          .eq("ficha.folha_id", folhaId as string)
          .order("id")
          .range(de, ate),
      ),
  });
}

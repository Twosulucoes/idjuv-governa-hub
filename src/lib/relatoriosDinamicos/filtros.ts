/**
 * GERADOR DE RELATÓRIOS DINÂMICOS — filtros da fonte na barra de filtros do design system.
 * As definições saem do catálogo de colunas (`ColunaFonte.filtro`); o estado é o da barra (JSON puro), salvo
 * no modelo como está, então "este mês" continua relativo.
 */

import {
  aplicarFiltros,
  descreverFiltro,
  limparEstado,
  type EstadoFiltros,
  type FiltroDef,
} from "@/components/design-system/filtros/logica";
import { formatarValor } from "./formatar";
import type { ColunaFonte, FonteRelatorio } from "./tipos";

/** Filtros principais (à vista na barra): os três primeiros da fonte. */
const PRINCIPAIS = 3;

function definicao<T>(c: ColunaFonte<T>, principal: boolean): FiltroDef<T> | null {
  const base = { id: c.id, rotulo: c.rotulo, principal };
  switch (c.filtro) {
    case "lista":
      return {
        ...base,
        tipo: "lista",
        valor: (l) => {
          const v = c.valor(l);
          return v === null || v === "" ? null : formatarValor(v, c.tipo);
        },
      };
    case "periodo":
      return {
        ...base,
        tipo: "periodo",
        valor: (l) => {
          const v = c.valor(l);
          return typeof v === "string" ? v : null;
        },
      };
    case "faixa":
      return {
        ...base,
        tipo: "faixa",
        formato: c.tipo === "moeda" ? "moeda" : "numero",
        valor: (l) => {
          const v = c.valor(l);
          return typeof v === "number" ? v : null;
        },
      };
    case "booleano":
      return { ...base, tipo: "booleano", valor: (l) => c.valor(l) === true };
    default:
      return null;
  }
}

export function filtrosDaFonte<T>(fonte: FonteRelatorio<T>): FiltroDef<T>[] {
  return fonte.colunas
    .filter((c) => c.filtro)
    .map((c, i) => definicao(c, i < PRINCIPAIS))
    .filter((d): d is FiltroDef<T> => d !== null);
}

/** Estado salvo no modelo → só o que a barra conhece e com valor. */
export function estadoDosFiltros<T>(defs: FiltroDef<T>[], salvo: Record<string, unknown>): EstadoFiltros {
  return limparEstado(defs, salvo as EstadoFiltros);
}

export function filtrarLinhas<T>(linhas: T[], defs: FiltroDef<T>[], estado: EstadoFiltros, hoje = new Date()): T[] {
  return aplicarFiltros(linhas, defs, estado, hoje);
}

/** "Situação: Pago, Emitido" — uma linha por filtro ativo, para o PDF e a planilha. */
export function descreverFiltros<T>(defs: FiltroDef<T>[], estado: EstadoFiltros): string[] {
  return defs.filter((d) => estado[d.id]).map((d) => `${d.rotulo}: ${descreverFiltro(d, estado[d.id])}`);
}

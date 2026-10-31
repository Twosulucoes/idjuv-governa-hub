/**
 * GERADOR DE RELATÓRIOS DINÂMICOS — montagem (funções puras)
 *
 * Recebe as linhas já filtradas pela barra de filtros e devolve ordenadas, agrupadas (até 2 níveis) e com os
 * totais escolhidos por coluna. Também saneia uma configuração salva quando o catálogo da fonte mudou.
 */

import type {
  ColunaFonte,
  ConfigRelatorio,
  FonteRelatorio,
  FuncaoTotal,
  GrupoResultado,
  ResultadoRelatorio,
  ValorCelula,
} from "./tipos";
import { MAX_AGRUPAMENTOS } from "./tipos";
import { formatarValor } from "./formatar";

export const SEM_VALOR = "(sem valor)";

const comparador = new Intl.Collator("pt-BR", { numeric: true, sensitivity: "base" });

function comparar(a: ValorCelula, b: ValorCelula): number {
  // Vazio sempre por último, qualquer que seja a direção escolhida para o resto.
  const va = a === null || a === "";
  const vb = b === null || b === "";
  if (va || vb) return va === vb ? 0 : va ? 1 : -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);
  return comparador.compare(String(a), String(b));
}

export function ordenarLinhas<T>(linhas: T[], coluna: ColunaFonte<T> | undefined, direcao: "asc" | "desc"): T[] {
  if (!coluna) return linhas;
  const sinal = direcao === "desc" ? -1 : 1;
  return [...linhas].sort((x, y) => {
    const a = coluna.valor(x);
    const b = coluna.valor(y);
    const vazio = a === null || a === "" || b === null || b === "";
    return vazio ? comparar(a, b) : sinal * comparar(a, b);
  });
}

/** Total de uma coluna numérica; null quando não há nenhum valor. */
export function calcularTotal<T>(linhas: T[], coluna: ColunaFonte<T>, funcao: FuncaoTotal): number | null {
  const valores = linhas.map((l) => coluna.valor(l)).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (valores.length === 0) return funcao === "soma" ? 0 : null;
  switch (funcao) {
    case "soma":
      return arredondar(valores.reduce((s, v) => s + v, 0));
    case "media":
      return arredondar(valores.reduce((s, v) => s + v, 0) / valores.length);
    case "maior":
      return Math.max(...valores);
    case "menor":
      return Math.min(...valores);
  }
}

/** Evita 0,1 + 0,2 = 0,30000000000000004 nos subtotais de moeda. */
const arredondar = (v: number) => Math.round(v * 100) / 100;

function totaisDe<T>(linhas: T[], colunas: ColunaFonte<T>[], totais: ConfigRelatorio["totais"]): Record<string, number | null> {
  const r: Record<string, number | null> = {};
  for (const c of colunas) {
    const f = totais[c.id];
    if (f) r[c.id] = calcularTotal(linhas, c, f);
  }
  return r;
}

function agrupar<T>(
  linhas: T[],
  niveis: ColunaFonte<T>[],
  colunas: ColunaFonte<T>[],
  totais: ConfigRelatorio["totais"],
): GrupoResultado<T>[] {
  const [nivel, ...resto] = niveis;
  const mapa = new Map<string, { valor: ValorCelula; linhas: T[] }>();
  for (const l of linhas) {
    const valor = nivel.valor(l);
    const rotulo = valor === null || valor === "" ? SEM_VALOR : formatarValor(valor, nivel.tipo);
    const g = mapa.get(rotulo) ?? { valor, linhas: [] };
    g.linhas.push(l);
    mapa.set(rotulo, g);
  }
  return [...mapa.entries()]
    .sort(([, a], [, b]) => comparar(a.valor, b.valor))
    .map(([rotulo, g]) => ({
      rotulo,
      quantidade: g.linhas.length,
      totais: totaisDe(g.linhas, colunas, totais),
      subgrupos: resto.length > 0 ? agrupar(g.linhas, resto, colunas, totais) : [],
      linhas: resto.length > 0 ? [] : g.linhas,
    }));
}

/**
 * Monta o resultado sobre as linhas já filtradas. As colunas de agrupamento não precisam estar entre as colunas
 * impressas; os totais só valem para colunas impressas e numéricas.
 */
export function montarRelatorio<T>(fonte: FonteRelatorio<T>, config: ConfigRelatorio, linhasFiltradas: T[]): ResultadoRelatorio<T> {
  const porId = new Map(fonte.colunas.map((c) => [c.id, c]));
  const colunas = config.colunas.map((id) => porId.get(id)).filter((c): c is ColunaFonte<T> => Boolean(c));
  const numericas = colunas.filter((c) => c.tipo === "moeda" || c.tipo === "numero");
  const ordem = config.ordenacao ? porId.get(config.ordenacao.coluna) : undefined;
  const linhas = ordenarLinhas(linhasFiltradas, ordem, config.ordenacao?.direcao ?? "asc");
  const niveis = config.agrupamentos
    .map((id) => porId.get(id))
    .filter((c): c is ColunaFonte<T> => Boolean(c))
    .slice(0, MAX_AGRUPAMENTOS);
  return {
    colunas,
    linhas,
    grupos: niveis.length > 0 ? agrupar(linhas, niveis, numericas, config.totais) : null,
    totais: totaisDe(linhas, numericas, config.totais),
    quantidade: linhas.length,
  };
}

/** Configuração inicial ao escolher a fonte: colunas marcadas como padrão, sem filtro nem agrupamento. */
export function configPadrao<T>(fonte: FonteRelatorio<T>): ConfigRelatorio {
  return {
    versao: 1,
    fonte: fonte.id,
    titulo: fonte.rotulo,
    colunas: fonte.colunas.filter((c) => c.padrao).map((c) => c.id),
    filtros: {},
    agrupamentos: [],
    totais: Object.fromEntries(
      fonte.colunas.filter((c) => c.padrao && c.tipo === "moeda").map((c) => [c.id, "soma" as FuncaoTotal]),
    ),
    ordenacao: null,
    orientacao: "auto",
  };
}

const FUNCOES: FuncaoTotal[] = ["soma", "media", "maior", "menor"];

/**
 * Abre uma configuração salva contra o catálogo atual: coluna que não existe mais é descartada (e listada para
 * a tela avisar), e o que vier fora do formato volta ao padrão. Nunca lança.
 */
export function sanearConfig<T>(fonte: FonteRelatorio<T>, bruta: unknown): { config: ConfigRelatorio; ignoradas: string[] } {
  const base = configPadrao(fonte);
  const c = (bruta && typeof bruta === "object" ? bruta : {}) as Partial<ConfigRelatorio>;
  const ids = new Set(fonte.colunas.map((x) => x.id));
  const ignoradas = new Set<string>();
  const validos = (lista: unknown): string[] => {
    if (!Array.isArray(lista)) return [];
    return lista.filter((id): id is string => {
      if (typeof id !== "string") return false;
      if (!ids.has(id)) ignoradas.add(id);
      return ids.has(id);
    });
  };
  const colunas = [...new Set(validos(c.colunas))];
  const agrupaveis = new Set(fonte.colunas.filter((x) => x.agrupavel).map((x) => x.id));
  const agrupamentos = [...new Set(validos(c.agrupamentos))].filter((id) => agrupaveis.has(id)).slice(0, MAX_AGRUPAMENTOS);
  // Sem totais no que foi salvo (ou lixo): os do padrão da fonte.
  const totais: ConfigRelatorio["totais"] = c.totais && typeof c.totais === "object" ? {} : { ...base.totais };
  if (c.totais && typeof c.totais === "object") {
    for (const [id, f] of Object.entries(c.totais)) {
      if (!ids.has(id)) ignoradas.add(id);
      else if (FUNCOES.includes(f as FuncaoTotal)) totais[id] = f as FuncaoTotal;
    }
  }
  const ord = c.ordenacao;
  const ordenacao =
    ord && typeof ord === "object" && typeof ord.coluna === "string" && ids.has(ord.coluna)
      ? { coluna: ord.coluna, direcao: ord.direcao === "desc" ? ("desc" as const) : ("asc" as const) }
      : null;
  if (ord && typeof ord === "object" && typeof ord.coluna === "string" && !ids.has(ord.coluna)) ignoradas.add(ord.coluna);
  const filtros: Record<string, unknown> = {};
  if (c.filtros && typeof c.filtros === "object" && !Array.isArray(c.filtros)) {
    for (const [id, v] of Object.entries(c.filtros)) {
      if (ids.has(id)) filtros[id] = v;
      else ignoradas.add(id);
    }
  }
  return {
    config: {
      versao: 1,
      fonte: fonte.id,
      titulo: typeof c.titulo === "string" && c.titulo.trim() ? c.titulo.trim().slice(0, 150) : base.titulo,
      colunas: colunas.length > 0 ? colunas : base.colunas,
      filtros,
      agrupamentos,
      totais,
      ordenacao,
      orientacao: c.orientacao === "retrato" || c.orientacao === "paisagem" ? c.orientacao : "auto",
    },
    ignoradas: [...ignoradas],
  };
}

/** Acima de 6 colunas o relatório sai deitado. */
export function orientacaoEfetiva(config: Pick<ConfigRelatorio, "orientacao" | "colunas">): "retrato" | "paisagem" {
  if (config.orientacao !== "auto") return config.orientacao;
  return config.colunas.length > 6 ? "paisagem" : "retrato";
}

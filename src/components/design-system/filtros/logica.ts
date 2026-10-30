// Regras dos filtros dinâmicos (sem React): tipos, aplicação sobre as linhas,
// períodos relativos, contagem de opções, texto dos chips e leitura/escrita na URL.
// O estado é JSON puro: dá para guardar no navegador, na URL ou num modelo salvo.

export type ValorData = string | Date | null | undefined;

interface FiltroBase {
  id: string;
  rotulo: string;
  /** Fica à vista na barra; os demais aparecem em "Mais filtros". */
  principal?: boolean;
}

export interface OpcaoFiltro {
  valor: string;
  rotulo: string;
}

export interface FiltroLista<T> extends FiltroBase {
  tipo: "lista";
  /** Valor da linha (um ou vários). Vazio não entra nas opções. */
  valor: (linha: T) => string | string[] | null | undefined;
  /** Opções fixas, na ordem desejada. Sem elas, as opções saem dos próprios dados. */
  opcoes?: OpcaoFiltro[];
  /** Rótulo de um valor que não está em `opcoes` (ex.: código → nome). */
  rotuloOpcao?: (valor: string) => string;
}

export interface FiltroPeriodo<T> extends FiltroBase {
  tipo: "periodo";
  /** Data da linha (ISO "AAAA-MM-DD…" ou Date). */
  valor: (linha: T) => ValorData;
}

export interface FiltroFaixa<T> extends FiltroBase {
  tipo: "faixa";
  valor: (linha: T) => number | null | undefined;
  formato?: "moeda" | "numero";
}

export interface FiltroBooleano<T> extends FiltroBase {
  tipo: "booleano";
  /** Com o filtro ligado, ficam só as linhas em que isto é verdadeiro. */
  valor: (linha: T) => boolean;
}

export type FiltroDef<T> = FiltroLista<T> | FiltroPeriodo<T> | FiltroFaixa<T> | FiltroBooleano<T>;

export const PERIODOS_RELATIVOS = [
  { valor: "hoje", rotulo: "Hoje" },
  { valor: "ultimos_7_dias", rotulo: "Últimos 7 dias" },
  { valor: "ultimos_30_dias", rotulo: "Últimos 30 dias" },
  { valor: "mes_atual", rotulo: "Este mês" },
  { valor: "mes_anterior", rotulo: "Mês passado" },
  { valor: "trimestre_atual", rotulo: "Este trimestre" },
  { valor: "ano_atual", rotulo: "Este ano" },
] as const;

export type PeriodoRelativo = (typeof PERIODOS_RELATIVOS)[number]["valor"];

export type ValorFiltro =
  | { valores: string[] }
  | { relativo: PeriodoRelativo }
  | { de?: string; ate?: string }
  | { min?: number; max?: number }
  | { ativo: true };

export type EstadoFiltros = Record<string, ValorFiltro>;

// --- datas -----------------------------------------------------------------

const doisDigitos = (n: number) => String(n).padStart(2, "0");

/** Data local em "AAAA-MM-DD". */
export function dataISO(d: Date): string {
  return `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}`;
}

function paraDiaISO(v: ValorData): string | null {
  if (v == null || v === "") return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : dataISO(v);
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(v);
  return m ? m[1] : null;
}

function ultimoDiaDoMes(ano: number, mes: number): Date {
  return new Date(ano, mes + 1, 0);
}

/** Intervalo fechado (inclusive) de um período relativo, a partir de `hoje`. */
export function resolverPeriodo(relativo: PeriodoRelativo, hoje = new Date()): { de: string; ate: string } {
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();
  const dia = (d: number) => new Date(ano, mes, d);
  switch (relativo) {
    case "hoje":
      return { de: dataISO(hoje), ate: dataISO(hoje) };
    case "ultimos_7_dias":
      return { de: dataISO(dia(hoje.getDate() - 6)), ate: dataISO(hoje) };
    case "ultimos_30_dias":
      return { de: dataISO(dia(hoje.getDate() - 29)), ate: dataISO(hoje) };
    case "mes_atual":
      return { de: dataISO(dia(1)), ate: dataISO(ultimoDiaDoMes(ano, mes)) };
    case "mes_anterior":
      return { de: dataISO(new Date(ano, mes - 1, 1)), ate: dataISO(ultimoDiaDoMes(ano, mes - 1)) };
    case "trimestre_atual": {
      const inicio = Math.floor(mes / 3) * 3;
      return { de: dataISO(new Date(ano, inicio, 1)), ate: dataISO(ultimoDiaDoMes(ano, inicio + 2)) };
    }
    case "ano_atual":
      return { de: `${ano}-01-01`, ate: `${ano}-12-31` };
  }
}

// --- validação do estado ---------------------------------------------------

/** Valor que não filtra nada (lista vazia, faixa sem limites…) conta como ausente. */
export function filtroAtivo(def: FiltroDef<unknown>, v: ValorFiltro | undefined): boolean {
  if (!v) return false;
  switch (def.tipo) {
    case "lista":
      return "valores" in v && v.valores.length > 0;
    case "periodo":
      return ("relativo" in v && Boolean(v.relativo)) || ("de" in v && Boolean(v.de)) || ("ate" in v && Boolean(v.ate));
    case "faixa":
      return ("min" in v && v.min != null) || ("max" in v && v.max != null);
    case "booleano":
      return "ativo" in v && v.ativo === true;
  }
}

/** Mantém só os filtros conhecidos e com valor; usado ao ler da URL ou do navegador. */
export function limparEstado<T>(defs: FiltroDef<T>[], estado: EstadoFiltros): EstadoFiltros {
  const saida: EstadoFiltros = {};
  for (const def of defs) {
    const v = estado[def.id];
    if (filtroAtivo(def as FiltroDef<unknown>, v)) saida[def.id] = v;
  }
  return saida;
}

export function contarAtivos<T>(defs: FiltroDef<T>[], estado: EstadoFiltros): number {
  return defs.filter((d) => filtroAtivo(d as FiltroDef<unknown>, estado[d.id])).length;
}

// --- aplicação -------------------------------------------------------------

function valoresDaLinha<T>(def: FiltroLista<T>, linha: T): string[] {
  const v = def.valor(linha);
  if (v == null || v === "") return [];
  return (Array.isArray(v) ? v : [v]).filter((x) => x != null && x !== "");
}

function intervaloDoPeriodo(v: ValorFiltro, hoje: Date): { de?: string; ate?: string } {
  if ("relativo" in v) return resolverPeriodo(v.relativo, hoje);
  return v as { de?: string; ate?: string };
}

function passa<T>(def: FiltroDef<T>, v: ValorFiltro, linha: T, hoje: Date): boolean {
  switch (def.tipo) {
    case "lista": {
      const escolhidos = (v as { valores: string[] }).valores;
      return valoresDaLinha(def, linha).some((x) => escolhidos.includes(x));
    }
    case "periodo": {
      const dia = paraDiaISO(def.valor(linha));
      if (!dia) return false;
      const { de, ate } = intervaloDoPeriodo(v, hoje);
      return (!de || dia >= de) && (!ate || dia <= ate);
    }
    case "faixa": {
      const n = def.valor(linha);
      if (n == null || Number.isNaN(Number(n))) return false;
      const { min, max } = v as { min?: number; max?: number };
      return (min == null || Number(n) >= min) && (max == null || Number(n) <= max);
    }
    case "booleano":
      return def.valor(linha);
  }
}

/** Linhas que passam em todos os filtros ativos (E entre filtros, OU dentro de uma lista). */
export function aplicarFiltros<T>(dados: T[], defs: FiltroDef<T>[], estado: EstadoFiltros, hoje = new Date()): T[] {
  const ativos = defs.filter((d) => filtroAtivo(d as FiltroDef<unknown>, estado[d.id]));
  if (ativos.length === 0) return dados;
  return dados.filter((linha) => ativos.every((d) => passa(d, estado[d.id], linha, hoje)));
}

/**
 * Opções de um filtro de lista com a quantidade de linhas de cada uma,
 * considerando os outros filtros já escolhidos (o próprio filtro fica de fora,
 * para dar para marcar mais de uma opção).
 */
export function opcoesComContagem<T>(
  def: FiltroLista<T>,
  dados: T[],
  defs: FiltroDef<T>[],
  estado: EstadoFiltros,
  hoje = new Date(),
): Array<OpcaoFiltro & { quantidade: number }> {
  const { [def.id]: _proprio, ...outros } = estado;
  const base = aplicarFiltros(dados, defs, outros, hoje);
  const contagem = new Map<string, number>();
  for (const linha of base) for (const v of new Set(valoresDaLinha(def, linha))) contagem.set(v, (contagem.get(v) ?? 0) + 1);

  const escolhidos = estado[def.id] && "valores" in estado[def.id] ? (estado[def.id] as { valores: string[] }).valores : [];
  const rotular = (valor: string) => def.rotuloOpcao?.(valor) ?? valor;

  if (def.opcoes) {
    return def.opcoes.map((o) => ({ ...o, quantidade: contagem.get(o.valor) ?? 0 }));
  }
  // Opções dos dados: todas as que aparecem em qualquer linha, mais as já escolhidas.
  const todos = new Set<string>(escolhidos);
  for (const linha of dados) valoresDaLinha(def, linha).forEach((v) => todos.add(v));
  return [...todos]
    .map((valor) => ({ valor, rotulo: rotular(valor), quantidade: contagem.get(valor) ?? 0 }))
    .sort((a, b) => a.rotulo.localeCompare(b.rotulo, "pt-BR", { numeric: true, sensitivity: "base" }));
}

// --- texto dos chips ---------------------------------------------------------

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const numero = new Intl.NumberFormat("pt-BR");

export function formatarNumeroFiltro(n: number, formato: FiltroFaixa<unknown>["formato"]): string {
  return formato === "moeda" ? moeda.format(n) : numero.format(n);
}

const dataBR = (iso: string) => iso.split("-").reverse().join("/");

/** Texto curto do valor escolhido, para o chip (ex.: "Pago, Emitido", "este mês", "acima de R$ 10.000,00"). */
export function descreverFiltro<T>(def: FiltroDef<T>, v: ValorFiltro): string {
  switch (def.tipo) {
    case "lista": {
      const valores = (v as { valores: string[] }).valores;
      const rotulo = (x: string) => def.opcoes?.find((o) => o.valor === x)?.rotulo ?? def.rotuloOpcao?.(x) ?? x;
      if (valores.length <= 2) return valores.map(rotulo).join(", ");
      return `${rotulo(valores[0])} e mais ${valores.length - 1}`;
    }
    case "periodo": {
      if ("relativo" in v) return PERIODOS_RELATIVOS.find((p) => p.valor === v.relativo)?.rotulo.toLowerCase() ?? v.relativo;
      const { de, ate } = v as { de?: string; ate?: string };
      if (de && ate) return de === ate ? dataBR(de) : `${dataBR(de)} a ${dataBR(ate)}`;
      return de ? `a partir de ${dataBR(de)}` : `até ${dataBR(ate!)}`;
    }
    case "faixa": {
      const { min, max } = v as { min?: number; max?: number };
      const f = (n: number) => formatarNumeroFiltro(n, def.formato);
      if (min != null && max != null) return `${f(min)} a ${f(max)}`;
      return min != null ? `a partir de ${f(min)}` : `até ${f(max!)}`;
    }
    case "booleano":
      return "sim";
  }
}

// --- URL -------------------------------------------------------------------
// lista: id=a,b · período: id=mes_atual ou id=2026-01-01..2026-03-31 ·
// faixa: id=100..500 (lado vazio = sem limite) · sim/não: id=1

const RELATIVOS = new Set<string>(PERIODOS_RELATIVOS.map((p) => p.valor));
const DIA = /^\d{4}-\d{2}-\d{2}$/;

function textoParaValor<T>(def: FiltroDef<T>, texto: string): ValorFiltro | null {
  switch (def.tipo) {
    case "lista": {
      const valores = texto
        .split(",")
        .map((x) => {
          try {
            return decodeURIComponent(x);
          } catch {
            return x;
          }
        })
        .filter(Boolean);
      return valores.length ? { valores } : null;
    }
    case "periodo": {
      if (RELATIVOS.has(texto)) return { relativo: texto as PeriodoRelativo };
      const [de, ate] = texto.split("..");
      const v: { de?: string; ate?: string } = {};
      if (de && DIA.test(de)) v.de = de;
      if (ate && DIA.test(ate)) v.ate = ate;
      return v.de || v.ate ? v : null;
    }
    case "faixa": {
      const [a, b] = texto.split("..");
      const v: { min?: number; max?: number } = {};
      if (a && Number.isFinite(Number(a))) v.min = Number(a);
      if (b && Number.isFinite(Number(b))) v.max = Number(b);
      return v.min != null || v.max != null ? v : null;
    }
    case "booleano":
      return texto === "1" ? { ativo: true } : null;
  }
}

function valorParaTexto<T>(def: FiltroDef<T>, v: ValorFiltro): string {
  switch (def.tipo) {
    case "lista":
      // A vírgula separa valores; dentro de um valor ela vai codificada.
      return (v as { valores: string[] }).valores.map((x) => x.replace(/%/g, "%25").replace(/,/g, "%2C")).join(",");
    case "periodo":
      if ("relativo" in v) return v.relativo;
      return `${(v as { de?: string }).de ?? ""}..${(v as { ate?: string }).ate ?? ""}`;
    case "faixa":
      return `${(v as { min?: number }).min ?? ""}..${(v as { max?: number }).max ?? ""}`;
    case "booleano":
      return "1";
  }
}

/** Lê da URL os filtros conhecidos; `null` quando nenhum deles está na URL. */
export function paramsParaEstado<T>(params: URLSearchParams, defs: FiltroDef<T>[]): EstadoFiltros | null {
  let algum = false;
  const estado: EstadoFiltros = {};
  for (const def of defs) {
    const texto = params.get(def.id);
    if (texto == null) continue;
    algum = true;
    const v = textoParaValor(def, texto);
    if (v) estado[def.id] = v;
  }
  return algum ? estado : null;
}

/** Escreve o estado na URL, sem tocar nos outros parâmetros (ex.: exercício). */
export function estadoParaParams<T>(estado: EstadoFiltros, defs: FiltroDef<T>[], base: URLSearchParams): URLSearchParams {
  const params = new URLSearchParams(base);
  for (const def of defs) {
    const v = estado[def.id];
    if (filtroAtivo(def as FiltroDef<unknown>, v)) params.set(def.id, valorParaTexto(def, v));
    else params.delete(def.id);
  }
  return params;
}

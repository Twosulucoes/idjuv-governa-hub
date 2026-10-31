/**
 * GERADOR DE RELATÓRIOS DINÂMICOS — saída para o PDF (motor de documentos) e para a planilha.
 * Funções puras: a tela chama `emitirDocumento` e a exportação de planilha com o que sai daqui.
 */

import type { DadosRelatorioGerador, GrupoRelatorioGerador } from "@/lib/documentos/modelos/relatorios/gerador";
import type { ColunaTabela } from "@/lib/documentos";
import type { ColunaFonte, ConfigRelatorio, FonteRelatorio, GrupoResultado, ResultadoRelatorio } from "./tipos";
import { ROTULO_FUNCAO_TOTAL } from "./tipos";
import { formatarValor } from "./formatar";

const numerica = (tipo: ColunaFonte<unknown>["tipo"]) => tipo === "moeda" || tipo === "numero";

/** "Empenhado: soma · Liquidado: média". */
export function legendaTotais<T>(resultado: ResultadoRelatorio<T>, config: ConfigRelatorio): string {
  return resultado.colunas
    .filter((c) => config.totais[c.id])
    .map((c) => `${c.rotulo}: ${ROTULO_FUNCAO_TOTAL[config.totais[c.id]].toLowerCase()}`)
    .join(" · ");
}

function totaisFormatados<T>(colunas: ColunaFonte<T>[], totais: Record<string, number | null>) {
  const r: Record<string, string> = {};
  for (const c of colunas) if (c.id in totais) r[c.id] = formatarValor(totais[c.id], c.tipo);
  return r;
}

const linhaFormatada = <T>(colunas: ColunaFonte<T>[], l: T) =>
  Object.fromEntries(colunas.map((c) => [c.id, formatarValor(c.valor(l), c.tipo)]));

function grupoPdf<T>(colunas: ColunaFonte<T>[], g: GrupoResultado<T>): GrupoRelatorioGerador {
  return {
    rotulo: g.rotulo,
    quantidade: g.quantidade,
    totais: totaisFormatados(colunas, g.totais),
    subgrupos: g.subgrupos.map((s) => grupoPdf(colunas, s)),
    linhas: g.linhas.map((l) => linhaFormatada(colunas, l)),
  };
}

export function nomeDoArquivo(titulo: string, extensao: "pdf" | "xlsx", agora = new Date()): string {
  const base = titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60) || "relatorio";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${base}_${agora.getFullYear()}-${p(agora.getMonth() + 1)}-${p(agora.getDate())}_${p(agora.getHours())}${p(agora.getMinutes())}.${extensao}`;
}

export function paraPdf<T>(
  fonte: FonteRelatorio<T>,
  config: ConfigRelatorio,
  resultado: ResultadoRelatorio<T>,
  filtros: string[],
  agora = new Date(),
): DadosRelatorioGerador {
  const colunas: ColunaTabela[] = resultado.colunas.map((c) => ({
    chave: c.id,
    titulo: c.rotulo,
    peso: c.peso ?? (numerica(c.tipo) ? 1.2 : 1),
    alinhamento: numerica(c.tipo) ? "direita" : c.tipo === "data" || c.tipo === "booleano" ? "centro" : "esquerda",
  }));
  return {
    titulo: config.titulo.trim() || fonte.rotulo,
    fonte: fonte.rotulo,
    filtros,
    colunas,
    quantidade: resultado.quantidade,
    grupos: resultado.grupos?.map((g) => grupoPdf(resultado.colunas, g)),
    linhas: resultado.grupos ? undefined : resultado.linhas.map((l) => linhaFormatada(resultado.colunas, l)),
    totais: totaisFormatados(resultado.colunas, resultado.totais),
    legendaTotais: legendaTotais(resultado, config) || undefined,
    nomeArquivo: nomeDoArquivo(config.titulo || fonte.rotulo, "pdf", agora),
  };
}

export type CelulaPlanilha = string | number | null;

/**
 * Planilha em linhas: título, fonte e filtros no topo; cabeçalho; linhas com o valor cru (número fica número,
 * data fica dd/mm/aaaa); cada grupo com uma linha de título e uma de subtotal; total geral no fim.
 * `colunasMoeda` são os índices das colunas a formatar como R$.
 */
export function paraPlanilha<T>(
  fonte: FonteRelatorio<T>,
  config: ConfigRelatorio,
  resultado: ResultadoRelatorio<T>,
  filtros: string[],
): { linhas: CelulaPlanilha[][]; colunasMoeda: number[]; linhaCabecalho: number } {
  const cols = resultado.colunas;
  const vazio = (): CelulaPlanilha[] => cols.map(() => null);
  const crua = (c: ColunaFonte<T>, l: T): CelulaPlanilha => {
    const v = c.valor(l);
    if (v === null || v === "") return null;
    if (typeof v === "number") return v;
    return formatarValor(v, c.tipo);
  };
  const linhaTotais = (rotulo: string, totais: Record<string, number | null>): CelulaPlanilha[] => {
    const r = vazio();
    cols.forEach((c, i) => {
      if (c.id in totais) r[i] = totais[c.id];
    });
    if (r[0] === null) r[0] = rotulo;
    return r;
  };
  const linhas: CelulaPlanilha[][] = [
    [config.titulo.trim() || fonte.rotulo],
    [`Fonte: ${fonte.rotulo}`],
    [filtros.length > 0 ? `Filtros: ${filtros.join(" · ")}` : "Filtros: nenhum (todos os registros)"],
    [],
    cols.map((c) => c.rotulo),
  ];
  const linhaCabecalho = linhas.length - 1;
  const emitirGrupo = (g: GrupoResultado<T>, caminho: string[]) => {
    const rotulos = [...caminho, g.rotulo];
    linhas.push([`${rotulos.join(" / ")} (${g.quantidade})`]);
    if (g.subgrupos.length > 0) g.subgrupos.forEach((s) => emitirGrupo(s, rotulos));
    else g.linhas.forEach((l) => linhas.push(cols.map((c) => crua(c, l))));
    linhas.push(linhaTotais(`Subtotal: ${g.quantidade} registro(s)`, g.totais));
  };
  if (resultado.grupos) resultado.grupos.forEach((g) => emitirGrupo(g, []));
  else resultado.linhas.forEach((l) => linhas.push(cols.map((c) => crua(c, l))));
  linhas.push(linhaTotais(`Total geral: ${resultado.quantidade} registro(s)`, resultado.totais));
  return {
    linhas,
    colunasMoeda: cols.map((c, i) => (c.tipo === "moeda" ? i : -1)).filter((i) => i >= 0),
    linhaCabecalho,
  };
}

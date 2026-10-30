/**
 * GERADOR DE RELATÓRIOS DINÂMICOS — tipos
 *
 * Uma "fonte" é uma lista que o sistema já tem (dotações do QDD, empenhos, diárias…) descrita por um catálogo de
 * colunas. O usuário escolhe colunas, filtros, agrupamentos, totais e ordem; essa escolha é a `ConfigRelatorio`,
 * que pode ser salva em `relatorios_modelos` (só a configuração, nunca os dados).
 * Spec: docs/superpowers/specs/2026-10-30-gerador-relatorios-design.md
 */

export type TipoColuna = "texto" | "moeda" | "numero" | "data" | "booleano";

export type ValorCelula = string | number | boolean | null;

/** Filtro que a coluna oferece na barra de filtros. */
export type TipoFiltroColuna = "lista" | "periodo" | "faixa" | "booleano";

export interface ColunaFonte<T> {
  id: string;
  rotulo: string;
  tipo: TipoColuna;
  /** Data: texto ISO "AAAA-MM-DD". Moeda/número: number. */
  valor: (linha: T) => ValorCelula;
  /** Pode ser usada para agrupar (texto, mês, sim/não). */
  agrupavel?: boolean;
  filtro?: TipoFiltroColuna;
  /** Marcada ao escolher a fonte. */
  padrao?: boolean;
  /** Largura relativa no PDF (padrão 1). */
  peso?: number;
}

export interface FonteRelatorio<T = unknown> {
  id: string;
  /** Código do módulo (modules.config.ts); vai para `relatorios_modelos.modulo`. */
  modulo: string;
  rotulo: string;
  descricao: string;
  /** Sem a permissão a fonte nem aparece (o RLS da tabela de origem já esconderia as linhas). */
  permissao?: string;
  carregar: (exercicio: number) => Promise<T[]>;
  colunas: ColunaFonte<T>[];
}

export type FuncaoTotal = "soma" | "media" | "maior" | "menor";

export const ROTULO_FUNCAO_TOTAL: Record<FuncaoTotal, string> = {
  soma: "Soma",
  media: "Média",
  maior: "Maior",
  menor: "Menor",
};

export type Orientacao = "auto" | "retrato" | "paisagem";

export interface ConfigRelatorio {
  versao: 1;
  fonte: string;
  titulo: string;
  /** Ordem = ordem de impressão. */
  colunas: string[];
  /** Estado da barra de filtros (JSON puro; período pode ser relativo, ex.: mês atual). */
  filtros: Record<string, unknown>;
  /** Até 2 níveis. */
  agrupamentos: string[];
  totais: Record<string, FuncaoTotal>;
  ordenacao: { coluna: string; direcao: "asc" | "desc" } | null;
  orientacao: Orientacao;
}

export const MAX_AGRUPAMENTOS = 2;

export interface GrupoResultado<T> {
  rotulo: string;
  quantidade: number;
  totais: Record<string, number | null>;
  /** Grupo do último nível traz as linhas; os demais, os subgrupos. */
  subgrupos: GrupoResultado<T>[];
  linhas: T[];
}

export interface ResultadoRelatorio<T> {
  colunas: ColunaFonte<T>[];
  /** Linhas já filtradas e ordenadas. */
  linhas: T[];
  /** null quando não há agrupamento. */
  grupos: GrupoResultado<T>[] | null;
  totais: Record<string, number | null>;
  quantidade: number;
}

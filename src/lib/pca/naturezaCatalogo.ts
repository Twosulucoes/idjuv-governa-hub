/**
 * Natureza de despesa indicada pelo catálogo CATMAT/CATSER (portal de dados abertos do Compras.gov.br), casada com as
 * naturezas do estado, e a ordem de força das sugestões na reserva do processo. Funções puras, testadas em
 * naturezaCatalogo.test.ts. Spec: docs/superpowers/specs/2026-10-25-compras-natureza-pelo-catalogo-design.md
 */

/** Natureza como a Edge Function catalogo-compras devolve (código federal de 8 dígitos). */
export interface NaturezaDoPortal {
  codigo: string;
  nome: string | null;
  ativo: boolean;
}

/** Natureza do sistema (fin_naturezas_despesa): código como o FIPLAN escreve, com ou sem pontos. */
export interface NaturezaDoSistema {
  id: string;
  codigo: string;
}

export interface NaturezaIndicada {
  id: string;
  /** true = mesmo subelemento do catálogo; false = casou só pelo elemento (o estado não tem o subelemento federal). */
  exata: boolean;
}

const digitos = (codigo: string | null | undefined) => (codigo ?? "").replace(/\D/g, "");

/** Id por código só com dígitos; com código repetido, fica o primeiro. */
function mapaPorDigitos(naturezas: NaturezaDoSistema[]): Map<string, string> {
  const mapa = new Map<string, string>();
  for (const n of naturezas) {
    const d = digitos(n.codigo);
    if (d && !mapa.has(d)) mapa.set(d, n.id);
  }
  return mapa;
}

/**
 * Código que pode ser natureza de um PCA ou de uma reserva nova: 8 dígitos, categoria 3 ou 4, grupo 1 a 6 e elemento
 * diferente de 92 (despesas de exercícios anteriores). Descarta o lixo do portal (ex.: 30903030).
 */
export function naturezaUtil(codigo: string): boolean {
  return /^[34][1-6]\d{6}$/.test(codigo) && codigo.slice(4, 6) !== "92";
}

/**
 * Naturezas do sistema indicadas pelo catálogo, na ordem do portal, sem repetir. Casa primeiro os 8 dígitos; se o
 * estado não tem o subelemento federal, casa o elemento (6 dígitos ou terminado em 00). Inativa no portal não entra.
 */
export function casarNaturezasDoCatalogo(portal: NaturezaDoPortal[], sistema: NaturezaDoSistema[]): NaturezaIndicada[] {
  const porDigitos = mapaPorDigitos(sistema);
  const indicadas = new Map<string, NaturezaIndicada>();
  for (const p of portal) {
    if (!p.ativo || !naturezaUtil(p.codigo)) continue;
    const exata = porDigitos.get(p.codigo);
    const elemento = porDigitos.get(p.codigo.slice(0, 6)) ?? porDigitos.get(`${p.codigo.slice(0, 6)}00`);
    const id = exata ?? elemento;
    if (!id) continue;
    const anterior = indicadas.get(id);
    if (!anterior || (!anterior.exata && exata)) indicadas.set(id, { id, exata: !!exata });
  }
  return [...indicadas.values()];
}

/** De onde vem a sugestão da reserva, da mais forte para a mais fraca. */
export const ORIGENS_SUGESTAO = ["ped", "empenho", "pca", "catalogo"] as const;
export type OrigemSugestao = (typeof ORIGENS_SUGESTAO)[number];

export const ROTULO_ORIGEM: Record<OrigemSugestao, string> = {
  ped: "do PED",
  empenho: "do empenho",
  pca: "do PCA",
  catalogo: "do catálogo",
};

/** Natureza sugerida: por id (PCA, catálogo) ou pelo código (PED e empenho trazem o código da natureza). */
export interface PistaNatureza {
  origem: OrigemSugestao;
  naturezaId?: string | null;
  naturezaCodigo?: string | null;
}

/**
 * Para cada natureza do sistema, a origem mais forte que a indica. `naturezas` traz id e código das naturezas
 * escolhíveis (as do QDD), para casar as pistas que só têm o código.
 */
export function origensPorNatureza(pistas: PistaNatureza[], naturezas: NaturezaDoSistema[]): Map<string, OrigemSugestao> {
  const idPorDigitos = mapaPorDigitos(naturezas);
  const forca = (o: OrigemSugestao) => ORIGENS_SUGESTAO.indexOf(o);
  const resultado = new Map<string, OrigemSugestao>();
  for (const p of pistas) {
    // Código em subelemento (3.3.90.39.16) casa com o elemento do QDD (3.3.90.39) quando o subelemento não está lá
    const d = digitos(p.naturezaCodigo);
    const id = p.naturezaId || idPorDigitos.get(d) || (d.length >= 6 ? idPorDigitos.get(d.slice(0, 6)) ?? idPorDigitos.get(`${d.slice(0, 6)}00`) : undefined);
    if (!id) continue;
    const atual = resultado.get(id);
    if (!atual || forca(p.origem) < forca(atual)) resultado.set(id, p.origem);
  }
  return resultado;
}

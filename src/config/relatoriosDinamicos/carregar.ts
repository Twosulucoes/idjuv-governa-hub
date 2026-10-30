/**
 * Leitura das fontes do Gerador de relatórios: de mil em mil linhas (limite do PostgREST) até o teto.
 * As linhas vêm com o RLS do usuário; o gerador não abre nada que a tela de origem já não mostre.
 */

/** Acima disso a tela pede para filtrar mais (por exercício). */
export const TETO_LINHAS = 20000;
const PAGINA = 1000;

export class LimiteDeLinhasError extends Error {
  constructor() {
    super(`A fonte passou de ${TETO_LINHAS.toLocaleString("pt-BR")} linhas.`);
    this.name = "LimiteDeLinhasError";
  }
}

type Pagina<T> = (de: number, ate: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

export async function carregarPaginado<T>(pagina: Pagina<T>): Promise<T[]> {
  const todas: T[] = [];
  for (let de = 0; ; de += PAGINA) {
    const { data, error } = await pagina(de, de + PAGINA - 1);
    if (error) throw new Error(error.message);
    const lote = data ?? [];
    todas.push(...lote);
    if (lote.length < PAGINA) return todas;
    if (todas.length >= TETO_LINHAS) throw new LimiteDeLinhasError();
  }
}

export const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** "2026-03-05" → "2026-03" (colunas de mês para agrupar e filtrar). */
export const mesDe = (iso: string | null | undefined): string | null => (iso && /^\d{4}-\d{2}/.test(iso) ? iso.slice(0, 7) : null);

/**
 * Partes da dotação completa do FIPLAN ("17302.0001.08.244.030.2544.9900.33903300.1500.0000.1.1"):
 * natureza e fonte, para fontes que só trazem o texto da dotação (PEDs).
 */
export function partesDotacaoFiplan(dotacao: string | null | undefined): { natureza: string | null; fonte: string | null; paoe: string | null } {
  const p = (dotacao ?? "").split(".");
  if (p.length < 9) return { natureza: null, fonte: null, paoe: null };
  const fonte = p[8];
  return {
    natureza: /^\d{8}$/.test(p[7]) ? p[7] : null,
    fonte: /^\d{4}$/.test(fonte) ? `${fonte[0]}.${fonte.slice(1)}` : null,
    paoe: p[5] || null,
  };
}

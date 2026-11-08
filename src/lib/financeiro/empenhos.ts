/**
 * Valores da lista de Empenhos. O FIP 614 traz o valor original do EMP (`valor_empenhado`) e os estornos à parte
 * (`valor_anulado`). O que vale para o orçamento, e o que o QDD e o painel mostram, é o líquido: original − estornos.
 * Somar o original faz a lista contradizer o painel (achado F1 do teste do Financeiro de 06/11/2026).
 */

export interface ValoresEmpenho {
  valor_empenhado: number | string | null;
  valor_anulado: number | string | null;
  saldo_liquidar?: number | string | null;
}

const n = (v: number | string | null | undefined) => Number(v) || 0;

/** Empenhado líquido de estornos; anulado por inteiro dá zero. */
export function empenhadoLiquido(e: ValoresEmpenho): number {
  return Math.max(0, Math.round((n(e.valor_empenhado) - n(e.valor_anulado)) * 100) / 100);
}

export interface TotaisEmpenhos {
  quantidade: number;
  original: number;
  estornado: number;
  liquido: number;
  saldoLiquidar: number;
}

/** Totais das linhas à vista (rodapé da lista). Soma em centavos para não acumular erro de ponto flutuante. */
export function totaisEmpenhos(lista: ValoresEmpenho[]): TotaisEmpenhos {
  const c = (v: number) => Math.round(v * 100);
  let original = 0;
  let estornado = 0;
  let liquido = 0;
  let saldo = 0;
  for (const e of lista) {
    original += c(n(e.valor_empenhado));
    estornado += c(n(e.valor_anulado));
    liquido += c(empenhadoLiquido(e));
    saldo += c(n(e.saldo_liquidar));
  }
  return { quantidade: lista.length, original: original / 100, estornado: estornado / 100, liquido: liquido / 100, saldoLiquidar: saldo / 100 };
}

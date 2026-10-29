// Tempo limite para chamadas a APIs externas (ver docs/INTEGRACOES_EXTERNAS.md §1).
// Sem import do Deno: os testes rodam no vitest (tempoLimite.test.ts).
//
// O limite vale até chegarem os cabeçalhos da resposta. Depois disso o relógio para, para não cortar no meio
// uma resposta em streaming (o assistente de compras manda a revisão aos poucos). Sem limite, a função fica
// presa até o runtime derrubar a requisição e o usuário não recebe nada.

/** Limite para a IA (Gemini): abaixo do tempo que o runtime da VPS dá a cada requisição. */
export const TEMPO_LIMITE_IA_MS = 40_000;

export class TempoEsgotado extends Error {
  constructor(public readonly servico: string) {
    super(`${servico} não respondeu a tempo`);
    this.name = "TempoEsgotado";
  }
}

export async function fetchComTempoLimite(
  servico: string,
  url: string,
  init: RequestInit,
  ms: number,
  fetchFn: typeof fetch = fetch,
): Promise<Response> {
  const controle = new AbortController();
  const relogio = setTimeout(() => controle.abort(), ms);
  try {
    return await fetchFn(url, { ...init, signal: controle.signal });
  } catch (e) {
    if (controle.signal.aborted) throw new TempoEsgotado(servico);
    throw e;
  } finally {
    clearTimeout(relogio);
  }
}

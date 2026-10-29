// Conferência do segredo da rotina diária do Transferegov e validação do pedido.
// Sem import do Deno: os testes rodam no vitest (token.test.ts).

/** Segredo curto demais não vale: a função fica desligada até alguém configurar um de verdade. */
export const TAMANHO_MINIMO_TOKEN = 32;

/** Compara o token recebido com o configurado sem vazar, pelo tempo, quantos caracteres batem. */
export async function tokenConfere(recebido: string | null, configurado: string | undefined): Promise<boolean> {
  if (!configurado || configurado.length < TAMANHO_MINIMO_TOKEN || !recebido) return false;
  const codificar = (t: string) => crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
  const [a, b] = await Promise.all([codificar(recebido), codificar(configurado)]);
  const x = new Uint8Array(a);
  const y = new Uint8Array(b);
  let diferenca = 0;
  for (let i = 0; i < x.length; i++) diferenca |= x[i] ^ y[i];
  return diferenca === 0;
}

/** Limites do que a rotina pode mandar de uma vez (o espelho de uma instituição tem poucas linhas). */
export const LIMITES = { propostas: 2000, emendas: 5000, convenios: 2000, movimentos: 50000 } as const;

export interface PedidoCarga {
  cnpj: string;
  data_carga: string | null;
  dados: Record<keyof typeof LIMITES, unknown[]>;
}

/** Confere o formato do pedido de carga; devolve a mensagem do problema ou o pedido arrumado. */
export function validarCarga(corpo: unknown): { erro: string } | { pedido: PedidoCarga } {
  const c = corpo as Record<string, unknown> | null;
  if (!c || typeof c !== "object") return { erro: "Pedido inválido" };
  const cnpj = typeof c.cnpj === "string" ? c.cnpj : "";
  if (!/^\d{14}$/.test(cnpj)) return { erro: "CNPJ inválido" };
  const dataCarga = c.data_carga == null ? null : String(c.data_carga);
  if (dataCarga !== null && Number.isNaN(Date.parse(dataCarga))) return { erro: "Data da carga inválida" };
  const dados = (c.dados ?? {}) as Record<string, unknown>;
  const saida = {} as PedidoCarga["dados"];
  for (const [chave, limite] of Object.entries(LIMITES) as [keyof typeof LIMITES, number][]) {
    const lista = dados[chave] ?? [];
    if (!Array.isArray(lista)) return { erro: `${chave} não é uma lista` };
    if (lista.length > limite) return { erro: `${chave}: mais de ${limite} linhas` };
    if (lista.some((l) => !l || typeof l !== "object" || Array.isArray(l))) return { erro: `${chave}: linha inválida` };
    saida[chave] = lista;
  }
  return { pedido: { cnpj, data_carga: dataCarga, dados: saida } };
}

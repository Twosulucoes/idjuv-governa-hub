/**
 * Nº do processo SEI: a mesma chave que o banco calcula em `sei_normalizar` (migração 20261102090000), para a tela
 * agrupar o resultado do localizador e saber se o termo digitado é um número. Mudou aqui, mude no SQL (e nos testes
 * dos dois lados: `numeroSei.test.ts` e o bloco LOCALIZADOR de `scripts/db/testar-rls.sql`).
 */

const COMPLETO = /(\d{5})\D{0,3}(\d{6})\D{0,3}(\d{4})\D{0,3}(\d{2})/;
const ABREVIADO = /^\D*(\d{6})\D{0,3}(\d{2})\D{0,3}(\d{2})\D*$/;

/**
 * Chave NNNNNN/AA-DV (sequencial, ano com 2 dígitos, dígito verificador) do nº completo (17302.000885/2026.92) ou
 * abreviado do FIPLAN (000885/26-92); null quando o texto não parece um nº SEI.
 */
export function chaveSei(texto: string | null | undefined): string | null {
  const t = texto ?? "";
  const completo = COMPLETO.exec(t);
  if (completo) return `${completo[2]}/${completo[3].slice(2)}-${completo[4]}`;
  const abreviado = ABREVIADO.exec(t);
  if (abreviado) return `${abreviado[1]}/${abreviado[2]}-${abreviado[3]}`;
  return null;
}

/** Menor termo que a busca aceita (o banco não devolve nada abaixo disso). */
export const TERMO_MINIMO = 3;

/** O termo está pronto para ir ao banco? */
export function termoBuscavel(termo: string): boolean {
  return termo.trim().length >= TERMO_MINIMO;
}

/**
 * Validação de links vindos do banco ou digitados pelo usuário, antes de virar `href`/`window.open`.
 *
 * Um valor como `javascript:...` gravado no banco rodaria código na origem do app ao ser clicado (XSS).
 * A regra é uma só para o app inteiro: só passa `http(s)` absoluto ou caminho interno (`/x`).
 */

/** Regex para validar campo de link em schema zod (mesma regra de `RegistrarPublicacaoDialog`). */
export const REGEX_URL_HTTP = /^https?:\/\//i;

/** Mensagem padrão do zod para link que não é `http(s)`. */
export const MENSAGEM_URL_HTTP = "Informe um link começando com http:// ou https://";

/** Tem caractere de controle (tab, LF, CR...)? O parser de URL os apaga, o que mascara o protocolo. */
function temCaractereDeControle(texto: string): boolean {
  return [...texto].some((c) => c.charCodeAt(0) < 0x20 || c.charCodeAt(0) === 0x7f);
}

/**
 * Devolve a URL normalizada se for `http(s)` absoluto; senão `null`.
 * Base de `urlSegura` e de `abrirUrlExterna` (`@/lib/storageArquivos`).
 */
export function urlHttpAbsoluta(valor: string | null | undefined): string | null {
  if (!valor) return null;
  const texto = valor.trim();
  if (!texto || temCaractereDeControle(texto)) return null;
  let url: URL;
  try {
    url = new URL(texto);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  return url.href;
}

/**
 * Devolve o link pronto para `href`/`window.open` só se for seguro:
 * - `http(s)` absoluto (normalizado pelo parser de URL);
 * - caminho interno que começa com `/` (mas não `//`, que é URL de outro host, nem `/\`).
 * Qualquer outra coisa (`javascript:`, `data:`, `vbscript:`, relativo sem barra, vazio) devolve `undefined`.
 */
export function urlSegura(valor: string | null | undefined): string | undefined {
  if (!valor) return undefined;
  const texto = valor.trim();
  if (!texto || temCaractereDeControle(texto)) return undefined;
  if (texto.startsWith("/")) {
    // `//host` e `/\host` são tratados pelo navegador como outro host
    if (texto.startsWith("//") || texto.startsWith("/\\")) return undefined;
    return texto;
  }
  return urlHttpAbsoluta(texto) ?? undefined;
}

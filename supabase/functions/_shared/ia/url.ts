/**
 * Validação da URL base de um provedor "compatível com OpenAI".
 *
 * A URL é digitada pelo administrador e recebe a chave de API no header, então
 * não pode apontar para a rede interna da VPS nem para um destino que o servidor
 * não controla por inteiro. Esta checagem roda no gateway antes de cada chamada
 * (o CHECK da tabela `ia_config` é a primeira barreira; esta é a segunda).
 *
 * Recusa: esquema diferente de `https:`, usuário/senha na URL, query ou fragmento,
 * `localhost`, `*.localhost`, `*.local`, `*.internal`, IPv6 literal e IPv4 em
 * 0/8, 10/8, 100.64/10, 127/8, 169.254/16, 172.16/12 e 192.168/16. Recusa também
 * nome sem ponto (ex.: `kong`, `db`), que resolve para serviços da rede Docker.
 *
 * O parser WHATWG (`new URL`) normaliza formas alternativas de IPv4
 * (`2130706433`, `0x7f.1`, `127.1`) para a forma com pontos antes da checagem.
 */

/** Faixas IPv4 recusadas: [primeiro octeto, segundo octeto mínimo, segundo octeto máximo]. */
const FAIXAS_IPV4_RECUSADAS: Array<[number, number, number]> = [
  [0, 0, 255], // 0.0.0.0/8
  [10, 0, 255], // 10.0.0.0/8
  [100, 64, 127], // 100.64.0.0/10 (CGNAT)
  [127, 0, 255], // 127.0.0.0/8 (loopback)
  [169, 254, 254], // 169.254.0.0/16 (link-local, metadados de nuvem)
  [172, 16, 31], // 172.16.0.0/12
  [192, 168, 168], // 192.168.0.0/16
];

function ipv4Recusado(host: string): boolean {
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  return FAIXAS_IPV4_RECUSADAS.some(([o1, min, max]) => a === o1 && b >= min && b <= max);
}

/** Devolve a mensagem de erro (em português) ou `null` se a URL base for aceita. */
export function validarUrlBase(url: string): string | null {
  if (typeof url !== "string" || url.trim() === "") return "Informe a URL base do provedor.";
  const bruta = url.trim();

  let u: URL;
  try {
    u = new URL(bruta);
  } catch {
    return "A URL base não é uma URL válida.";
  }

  if (u.protocol !== "https:") return "A URL base precisa usar https://.";
  if (u.username !== "" || u.password !== "" || /^https:\/\/[^/]*@/i.test(bruta)) {
    return "A URL base não pode conter usuário ou senha.";
  }
  // `new URL("https://x/?")` devolve search vazio: confere também o texto digitado.
  if (u.search !== "" || u.hash !== "" || bruta.includes("?") || bruta.includes("#")) {
    return "A URL base não pode ter parâmetros (?) nem fragmento (#).";
  }

  const host = u.hostname.toLowerCase().replace(/\.+$/, "");
  if (host === "") return "A URL base não tem servidor.";
  if (host.startsWith("[") || host.includes(":")) {
    return "A URL base não pode usar endereço IPv6 literal.";
  }
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    return "A URL base não pode apontar para a rede local ou interna.";
  }
  if (ipv4Recusado(host)) return "A URL base não pode apontar para endereço IP privado ou reservado.";
  // Nome sem ponto (`kong`, `db`, `auth`) resolve para serviços da rede Docker da VPS.
  if (!host.includes(".")) return "A URL base precisa de um nome de domínio completo.";

  return null;
}

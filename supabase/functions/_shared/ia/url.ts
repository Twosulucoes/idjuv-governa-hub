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
 * 0/8, 10/8, 100.64/10, 127/8, 169.254/16, 172.16/12, 192.0.0/24, 192.168/16,
 * 198.18/15, 224/4 (multicast) e 240/4 (reservado, inclui 255.255.255.255).
 * Recusa também nome sem ponto (ex.: `kong`, `db`), que resolve para serviços da
 * rede Docker.
 *
 * O parser WHATWG (`new URL`) normaliza formas alternativas de IPv4
 * (`2130706433`, `0x7f.1`, `127.1`) para a forma com pontos antes da checagem.
 *
 * `validarUrlBase` só olha o texto. `verificarDestino` completa a checagem
 * resolvendo o nome (A e AAAA) e recusando se algum endereço for privado/reservado.
 */

/** Faixas IPv4 recusadas em notação CIDR: [endereço base, tamanho do prefixo]. */
const FAIXAS_IPV4_RECUSADAS: Array<[string, number]> = [
  ["0.0.0.0", 8], // "esta rede"
  ["10.0.0.0", 8], // privada
  ["100.64.0.0", 10], // CGNAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local (metadados de nuvem)
  ["172.16.0.0", 12], // privada
  ["192.0.0.0", 24], // atribuições de protocolo da IETF
  ["192.168.0.0", 16], // privada
  ["198.18.0.0", 15], // testes de desempenho
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reservado (inclui 255.255.255.255)
];

/** IPv4 com pontos para inteiro de 32 bits sem sinal; `null` se não for IPv4 válido. */
function ipv4ParaNumero(host: string): number | null {
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  const partes = m.slice(1).map(Number);
  if (partes.some((n) => n > 255)) return null;
  return ((partes[0] << 24) >>> 0) + (partes[1] << 16) + (partes[2] << 8) + partes[3];
}

function numeroNaFaixa(ip: number, base: string, prefixo: number): boolean {
  const b = ipv4ParaNumero(base) as number;
  const mascara = prefixo === 0 ? 0 : (0xffffffff << (32 - prefixo)) >>> 0;
  return ((ip & mascara) >>> 0) === ((b & mascara) >>> 0);
}

function numeroIpv4Recusado(ip: number): boolean {
  return FAIXAS_IPV4_RECUSADAS.some(([base, prefixo]) => numeroNaFaixa(ip, base, prefixo));
}

function ipv4Recusado(host: string): boolean {
  const ip = ipv4ParaNumero(host);
  return ip !== null && numeroIpv4Recusado(ip);
}

/**
 * IPv6 para 8 grupos de 16 bits (aceita `::` e IPv4 embutido no fim, como
 * `::ffff:10.0.0.1`). Devolve `null` se não conseguir interpretar.
 */
function ipv6ParaGrupos(endereco: string): number[] | null {
  let s = endereco.trim().toLowerCase().replace(/^\[|\]$/g, "");
  const zona = s.indexOf("%");
  if (zona !== -1) s = s.slice(0, zona);
  // IPv4 embutido no fim vira dois grupos hexadecimais.
  const v4 = s.match(/^(.*:)(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (v4) {
    const n = ipv4ParaNumero(v4[2]);
    if (n === null) return null;
    s = `${v4[1]}${(n >>> 16).toString(16)}:${(n & 0xffff).toString(16)}`;
  }
  const metades = s.split("::");
  if (metades.length > 2) return null;
  const ler = (t: string): number[] | null => {
    if (t === "") return [];
    const grupos = t.split(":");
    if (grupos.some((g) => !/^[0-9a-f]{1,4}$/.test(g))) return null;
    return grupos.map((g) => parseInt(g, 16));
  };
  const esquerda = ler(metades[0]);
  const direita = metades.length === 2 ? ler(metades[1]) : [];
  if (!esquerda || !direita) return null;
  if (metades.length === 1) return esquerda.length === 8 ? esquerda : null;
  const faltam = 8 - esquerda.length - direita.length;
  if (faltam < 1) return null;
  return [...esquerda, ...new Array(faltam).fill(0), ...direita];
}

/**
 * IPv6 recusado: `::`, `::1`, fc00::/7 (ULA), fe80::/10 (link-local), ff00::/8
 * (multicast), `::ffff:a.b.c.d` e 64:ff9b::/96 (NAT64) com IPv4 recusado embutido.
 * Endereço que não se consegue interpretar também é recusado.
 */
function ipv6Recusado(endereco: string): boolean {
  const g = ipv6ParaGrupos(endereco);
  if (!g) return true;
  const zerosAte = (n: number) => g.slice(0, n).every((x) => x === 0);
  const v4Embutido = ((g[6] << 16) >>> 0) + g[7];
  if (zerosAte(7) && (g[7] === 0 || g[7] === 1)) return true; // :: e ::1
  if ((g[0] & 0xfe00) === 0xfc00) return true; // fc00::/7
  if ((g[0] & 0xffc0) === 0xfe80) return true; // fe80::/10
  if ((g[0] & 0xff00) === 0xff00) return true; // ff00::/8
  if (zerosAte(5) && g[5] === 0xffff) return numeroIpv4Recusado(v4Embutido); // ::ffff:0:0/96
  if (g[0] === 0x64 && g[1] === 0xff9b && g.slice(2, 6).every((x) => x === 0)) {
    return numeroIpv4Recusado(v4Embutido); // 64:ff9b::/96
  }
  return false;
}

/** Endereço devolvido pelo DNS (IPv4 ou IPv6) que não pode receber a chamada. */
function enderecoRecusado(endereco: string): boolean {
  if (endereco.includes(":")) return ipv6Recusado(endereco);
  const ip = ipv4ParaNumero(endereco);
  return ip === null || numeroIpv4Recusado(ip);
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

/** Resolve um nome no DNS; `tipo` é "A" ou "AAAA". Injetável nos testes. */
export type ResolverDns = (host: string, tipo: "A" | "AAAA") => Promise<string[]>;

const resolverPadrao: ResolverDns = (host, tipo) => Deno.resolveDns(host, tipo);

function normalizarHost(host: string): string {
  return host.trim().toLowerCase().replace(/\.+$/, "");
}

/**
 * Checagem de destino feita no gateway antes de chamar um provedor "compatível
 * com OpenAI": aplica `validarUrlBase`, recusa os hosts de `hostsProibidos` (o
 * próprio Supabase da instância, preenchido por quem chama) e resolve o nome (A e
 * AAAA), recusando se QUALQUER endereço for privado, loopback, link-local ou
 * reservado, ou se o nome não resolver. Devolve a mensagem de erro ou `null`.
 *
 * Risco residual: o `fetch` resolve o nome de novo, então um DNS que muda a
 * resposta entre esta checagem e a conexão (DNS rebinding) ainda passa. A correção
 * definitiva é bloquear a saída para redes internas no firewall da VPS (egress).
 */
export async function verificarDestino(
  url: string,
  resolver: ResolverDns = resolverPadrao,
  hostsProibidos: string[] = [],
): Promise<string | null> {
  const erroTexto = validarUrlBase(url);
  if (erroTexto) return erroTexto;

  const host = normalizarHost(new URL(url.trim()).hostname);
  if (hostsProibidos.some((h) => h && normalizarHost(h) === host)) {
    return "A URL base não pode apontar para o próprio servidor do sistema.";
  }

  // IPv4 literal já passou pelas faixas em `validarUrlBase`: não há o que resolver.
  if (ipv4ParaNumero(host) !== null) return null;

  const [a, aaaa] = await Promise.allSettled([resolver(host, "A"), resolver(host, "AAAA")]);
  const enderecos = [
    ...(a.status === "fulfilled" && Array.isArray(a.value) ? a.value : []),
    ...(aaaa.status === "fulfilled" && Array.isArray(aaaa.value) ? aaaa.value : []),
  ];
  if (enderecos.length === 0) {
    return "A URL base é inválida: não foi possível resolver o endereço.";
  }
  if (enderecos.some((e) => typeof e !== "string" || enderecoRecusado(e))) {
    return "A URL base resolve para endereço IP privado ou reservado.";
  }
  return null;
}

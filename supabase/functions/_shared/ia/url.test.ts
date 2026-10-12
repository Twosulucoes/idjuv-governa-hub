import { assertEquals, assertNotEquals } from "jsr:@std/assert@1";
import { type ResolverDns, validarUrlBase, verificarDestino } from "./url.ts";

Deno.test("validarUrlBase aceita URLs públicas em https", () => {
  assertEquals(validarUrlBase("https://openrouter.ai/api/v1"), null);
  assertEquals(validarUrlBase("https://openrouter.ai/api/v1/"), null);
  assertEquals(validarUrlBase("https://api.groq.com:443/openai/v1"), null);
  assertEquals(validarUrlBase("https://8.8.8.8/v1"), null);
  assertEquals(validarUrlBase("https://172.32.0.1/v1"), null); // fora de 172.16/12
  assertEquals(validarUrlBase("https://100.128.0.1/v1"), null); // fora de 100.64/10
  assertEquals(validarUrlBase("https://192.0.1.1/v1"), null); // fora de 192.0.0/24
  assertEquals(validarUrlBase("https://198.20.0.1/v1"), null); // fora de 198.18/15
  assertEquals(validarUrlBase("https://223.255.255.255/v1"), null); // antes de 224/4
});

const recusadas: Array<[string, string]> = [
  ["vazia", ""],
  ["não é URL", "não é url"],
  ["http", "http://openrouter.ai/api/v1"],
  ["ftp", "ftp://openrouter.ai/api/v1"],
  ["usuário e senha", "https://usuario:senha@openrouter.ai/api/v1"],
  ["só usuário", "https://usuario@openrouter.ai/api/v1"],
  ["query", "https://openrouter.ai/api/v1?x=1"],
  ["query vazia", "https://openrouter.ai/api/v1?"],
  ["fragmento", "https://openrouter.ai/api/v1#topo"],
  ["localhost", "https://localhost/v1"],
  ["localhost com ponto final", "https://localhost./v1"],
  ["*.localhost", "https://api.localhost/v1"],
  ["*.local", "https://servidor.local/v1"],
  ["*.internal", "https://metadata.google.internal/v1"],
  ["nome sem ponto (Docker)", "https://kong:8000/v1"],
  ["IPv6 literal", "https://[::1]/v1"],
  ["IPv6 público literal", "https://[2001:4860:4860::8888]/v1"],
  ["0/8", "https://0.0.0.0/v1"],
  ["10/8", "https://10.1.2.3/v1"],
  ["100.64/10", "https://100.64.0.1/v1"],
  ["100.64/10 (fim)", "https://100.127.255.255/v1"],
  ["127/8", "https://127.0.0.1/v1"],
  ["127/8 decimal", "https://2130706433/v1"],
  ["127/8 hexadecimal", "https://0x7f.1/v1"],
  ["169.254/16", "https://169.254.169.254/latest"],
  ["172.16/12", "https://172.16.0.1/v1"],
  ["172.16/12 (fim)", "https://172.31.255.255/v1"],
  ["192.168/16", "https://192.168.0.10/v1"],
  ["192.0.0/24", "https://192.0.0.8/v1"],
  ["198.18/15", "https://198.18.0.1/v1"],
  ["198.18/15 (fim)", "https://198.19.255.255/v1"],
  ["224/4 multicast", "https://224.0.0.251/v1"],
  ["224/4 multicast (fim)", "https://239.255.255.255/v1"],
  ["240/4 reservado", "https://240.0.0.1/v1"],
  ["broadcast", "https://255.255.255.255/v1"],
];

for (const [nome, url] of recusadas) {
  Deno.test(`validarUrlBase recusa ${nome}`, () => {
    const erro = validarUrlBase(url);
    assertNotEquals(erro, null);
    assertEquals(typeof erro, "string");
  });
}

// ---------------------------------------------------------------------------
// verificarDestino (DNS falso: os testes não usam rede)
// ---------------------------------------------------------------------------

function dns(a: string[], aaaa: string[] = []): ResolverDns {
  return (_host, tipo) => Promise.resolve(tipo === "A" ? a : aaaa);
}

const URL_OK = "https://openrouter.ai/api/v1";

Deno.test("verificarDestino aceita nome que resolve só para endereços públicos", async () => {
  assertEquals(await verificarDestino(URL_OK, dns(["104.18.2.115"], ["2606:4700::6812:273"])), null);
  assertEquals(await verificarDestino(URL_OK, dns(["8.8.8.8"])), null); // AAAA vazio
  assertEquals(await verificarDestino(URL_OK, dns([], ["2001:4860:4860::8888"])), null); // só AAAA
  assertEquals(await verificarDestino(URL_OK, dns([], ["::ffff:8.8.8.8"])), null);
  assertEquals(await verificarDestino(URL_OK, dns([], ["64:ff9b::808:808"])), null); // NAT64 de 8.8.8.8
  // AAAA falha (sem registro) mas A responde: aceita
  const soA: ResolverDns = (_h, t) => t === "A" ? Promise.resolve(["8.8.8.8"]) : Promise.reject(new Error("NotFound"));
  assertEquals(await verificarDestino(URL_OK, soA), null);
});

Deno.test("verificarDestino aceita IPv4 literal público sem consultar o DNS", async () => {
  const nuncaResolve: ResolverDns = () => Promise.reject(new Error("não deveria resolver"));
  assertEquals(await verificarDestino("https://8.8.8.8/v1", nuncaResolve), null);
});

const enderecosRecusados: Array<[string, string[], string[]]> = [
  ["A em 10/8", ["10.0.0.1"], []],
  ["A em 127/8", ["127.0.0.1"], []],
  ["A em 169.254/16", ["169.254.169.254"], []],
  ["A em 198.18/15", ["198.18.5.5"], []],
  ["A em 240/4", ["255.255.255.255"], []],
  ["um público e um privado", ["8.8.8.8", "192.168.1.1"], []],
  ["AAAA ::1", [], ["::1"]],
  ["AAAA ::", [], ["::"]],
  ["AAAA fc00::/7", [], ["fd12:3456::1"]],
  ["AAAA fe80::/10", [], ["fe80::1"]],
  ["AAAA multicast", [], ["ff02::1"]],
  ["AAAA ::ffff:10.0.0.1", [], ["::ffff:10.0.0.1"]],
  ["AAAA ::ffff:7f00:1 (hex)", [], ["::ffff:7f00:1"]],
  ["AAAA 64:ff9b::/96 de privado", [], ["64:ff9b::a00:1"]],
  ["AAAA ilegível", [], ["não-é-ip"]],
  ["A público, AAAA privado", ["8.8.8.8"], ["fe80::1"]],
];

for (const [nome, a, aaaa] of enderecosRecusados) {
  Deno.test(`verificarDestino recusa ${nome}`, async () => {
    const erro = await verificarDestino(URL_OK, dns(a, aaaa));
    assertEquals(typeof erro, "string");
  });
}

Deno.test("verificarDestino recusa quando o nome não resolve", async () => {
  const falha: ResolverDns = () => Promise.reject(new Error("NXDOMAIN"));
  const erro = await verificarDestino(URL_OK, falha);
  assertEquals(typeof erro, "string");
  assertEquals(erro?.includes("não foi possível resolver o endereço"), true);
  assertNotEquals(await verificarDestino(URL_OK, dns([], [])), null); // resposta vazia
});

Deno.test("verificarDestino recusa o host da própria instância (hostsProibidos)", async () => {
  const publico = dns(["8.8.8.8"]);
  assertNotEquals(await verificarDestino("https://bd.exemplo.gov.br/v1", publico, ["bd.exemplo.gov.br"]), null);
  assertNotEquals(await verificarDestino("https://BD.exemplo.gov.br./v1", publico, ["bd.exemplo.gov.br"]), null);
  assertEquals(await verificarDestino("https://outro.exemplo.gov.br/v1", publico, ["bd.exemplo.gov.br"]), null);
});

Deno.test("verificarDestino repete a validação do texto da URL", async () => {
  assertNotEquals(await verificarDestino("http://openrouter.ai/v1", dns(["8.8.8.8"])), null);
});

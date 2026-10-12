import { assertEquals, assertNotEquals } from "jsr:@std/assert@1";
import { validarUrlBase } from "./url.ts";

Deno.test("validarUrlBase aceita URLs públicas em https", () => {
  assertEquals(validarUrlBase("https://openrouter.ai/api/v1"), null);
  assertEquals(validarUrlBase("https://openrouter.ai/api/v1/"), null);
  assertEquals(validarUrlBase("https://api.groq.com:443/openai/v1"), null);
  assertEquals(validarUrlBase("https://8.8.8.8/v1"), null);
  assertEquals(validarUrlBase("https://172.32.0.1/v1"), null); // fora de 172.16/12
  assertEquals(validarUrlBase("https://100.128.0.1/v1"), null); // fora de 100.64/10
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
];

for (const [nome, url] of recusadas) {
  Deno.test(`validarUrlBase recusa ${nome}`, () => {
    const erro = validarUrlBase(url);
    assertNotEquals(erro, null);
    assertEquals(typeof erro, "string");
  });
}

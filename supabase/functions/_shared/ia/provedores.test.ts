import {
  assert,
  assertEquals,
  assertFalse,
  assertInstanceOf,
  assertRejects,
  assertStringIncludes,
} from "jsr:@std/assert@1";
import {
  type ConfigProvedor,
  ErroProvedor,
  gerarStream,
  gerarTexto,
  type PedidoIA,
  type UsoIA,
  validarUrlBase,
} from "./provedores.ts";

// ---------------------------------------------------------------------------
// Apoio: fetch falso que registra o Request e devolve a fixture
// ---------------------------------------------------------------------------

const CHAVE = "sk-segredo-de-teste-1234";
const PEDIDO: PedidoIA = { sistema: "Você é útil.", prompt: "Escreva um DFD.", maxTokens: 500 };

function falso(resposta: () => Response) {
  const pedidos: Request[] = [];
  const f = ((input: RequestInfo | URL, init?: RequestInit) => {
    pedidos.push(new Request(input, init));
    return Promise.resolve(resposta());
  }) as typeof fetch;
  return { f, pedidos };
}

function json(corpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** SSE em pedaços que cortam linhas no meio, para testar o buffer. */
function sse(texto: string, tamanhoPedaco = 7): Response {
  const bytes = new TextEncoder().encode(texto);
  let i = 0;
  const corpo = new ReadableStream<Uint8Array>({
    pull(c) {
      if (i >= bytes.length) return c.close();
      c.enqueue(bytes.slice(i, i + tamanhoPedaco));
      i += tamanhoPedaco;
    },
  });
  return new Response(corpo, { headers: { "content-type": "text/event-stream" } });
}

async function lerTudo(s: ReadableStream<Uint8Array>): Promise<string> {
  return await new Response(s).text();
}

/** Lê a saída como o front (`useAICPSI.ts`) lê: concatena `choices[0].delta.content`. */
function textoDoFront(saida: string): string {
  let texto = "";
  for (const linha of saida.split("\n")) {
    if (!linha.startsWith("data: ")) continue;
    const dados = linha.slice(6).trim();
    if (dados === "[DONE]") break;
    texto += JSON.parse(dados).choices?.[0]?.delta?.content ?? "";
  }
  return texto;
}

function coletor() {
  const usos: UsoIA[] = [];
  return { usos, aoTerminar: (u: UsoIA) => usos.push(u) };
}

function conferirSemChaveNaUrl(req: Request) {
  assertFalse(req.url.includes(CHAVE), "a chave não pode ir na URL");
  assertFalse(decodeURIComponent(req.url).includes(CHAVE), "a chave não pode ir na URL");
}

function conferirFetchSeguro(req: Request) {
  assertEquals(req.method, "POST");
  assertEquals(req.redirect, "manual");
  assert(req.signal, "precisa de AbortSignal (timeout)");
  assertEquals(req.headers.get("content-type"), "application/json");
}

const cfgOpenAI: ConfigProvedor = { provedor: "openai", url_base: null, modelo: "gpt-teste", chave: CHAVE };
const cfgAnthropic: ConfigProvedor = { provedor: "anthropic", url_base: null, modelo: "claude-teste", chave: CHAVE };
const cfgGemini: ConfigProvedor = { provedor: "gemini", url_base: null, modelo: "gemini-teste", chave: CHAVE };
const cfgCompat: ConfigProvedor = {
  provedor: "compativel_openai",
  url_base: "https://openrouter.ai/api/v1/",
  modelo: "meta/llama:free",
  chave: CHAVE,
};

// ---------------------------------------------------------------------------
// gerarTexto por provedor
// ---------------------------------------------------------------------------

Deno.test("OpenAI: URL, Bearer, corpo, texto e tokens", async () => {
  const { f, pedidos } = falso(() =>
    json({
      choices: [{ message: { content: "Olá" }, finish_reason: "stop" }],
      usage: { prompt_tokens: 12, completion_tokens: 3 },
    })
  );
  const r = await gerarTexto(cfgOpenAI, PEDIDO, f);
  assertEquals(r, { texto: "Olá", tokensEntrada: 12, tokensSaida: 3, estimado: false, cortado: false });

  const req = pedidos[0];
  assertEquals(req.url, "https://api.openai.com/v1/chat/completions");
  assertEquals(req.headers.get("authorization"), `Bearer ${CHAVE}`);
  conferirSemChaveNaUrl(req);
  conferirFetchSeguro(req);
  const corpo = await req.json();
  assertEquals(corpo, {
    model: "gpt-teste",
    messages: [
      { role: "system", content: PEDIDO.sistema },
      { role: "user", content: PEDIDO.prompt },
    ],
    max_tokens: 500,
  });
});

Deno.test("OpenAI: finish_reason length vira cortado", async () => {
  const { f } = falso(() =>
    json({
      choices: [{ message: { content: "Olá" }, finish_reason: "length" }],
      usage: { prompt_tokens: 1, completion_tokens: 500 },
    })
  );
  assert((await gerarTexto(cfgOpenAI, PEDIDO, f)).cortado);
});

Deno.test("Anthropic: URL, x-api-key, versão, system separado, texto e tokens", async () => {
  const { f, pedidos } = falso(() =>
    json({
      content: [{ type: "text", text: "Parte 1. " }, { type: "tool_use", id: "x" }, { type: "text", text: "Parte 2." }],
      stop_reason: "end_turn",
      usage: { input_tokens: 20, output_tokens: 6 },
    })
  );
  const r = await gerarTexto(cfgAnthropic, PEDIDO, f);
  assertEquals(r, { texto: "Parte 1. Parte 2.", tokensEntrada: 20, tokensSaida: 6, estimado: false, cortado: false });

  const req = pedidos[0];
  assertEquals(req.url, "https://api.anthropic.com/v1/messages");
  assertEquals(req.headers.get("x-api-key"), CHAVE);
  assertEquals(req.headers.get("anthropic-version"), "2023-06-01");
  assertEquals(req.headers.get("authorization"), null);
  conferirSemChaveNaUrl(req);
  conferirFetchSeguro(req);
  assertEquals(await req.json(), {
    model: "claude-teste",
    max_tokens: 500,
    system: PEDIDO.sistema,
    messages: [{ role: "user", content: PEDIDO.prompt }],
  });
});

Deno.test("Anthropic: stop_reason max_tokens vira cortado", async () => {
  const { f } = falso(() =>
    json({ content: [{ type: "text", text: "x" }], stop_reason: "max_tokens", usage: { input_tokens: 1, output_tokens: 500 } })
  );
  assert((await gerarTexto(cfgAnthropic, PEDIDO, f)).cortado);
});

Deno.test("Gemini: URL com modelo codificado, x-goog-api-key, texto e tokens", async () => {
  const { f, pedidos } = falso(() =>
    json({
      candidates: [{
        content: { parts: [{ text: "pensando", thought: true }, { text: "Resp" }, { text: "osta" }] },
        finishReason: "STOP",
      }],
      usageMetadata: { promptTokenCount: 30, candidatesTokenCount: 4, thoughtsTokenCount: 10 },
    })
  );
  const cfg = { ...cfgGemini, modelo: "gemini/teste 2" };
  const r = await gerarTexto(cfg, PEDIDO, f);
  assertEquals(r, { texto: "Resposta", tokensEntrada: 30, tokensSaida: 14, estimado: false, cortado: false });

  const req = pedidos[0];
  assertEquals(
    req.url,
    "https://generativelanguage.googleapis.com/v1beta/models/gemini%2Fteste%202:generateContent",
  );
  assertEquals(req.headers.get("x-goog-api-key"), CHAVE);
  conferirSemChaveNaUrl(req);
  assertFalse(new URL(req.url).searchParams.has("key"));
  conferirFetchSeguro(req);
  assertEquals(await req.json(), {
    systemInstruction: { parts: [{ text: PEDIDO.sistema }] },
    contents: [{ role: "user", parts: [{ text: PEDIDO.prompt }] }],
    generationConfig: { maxOutputTokens: 500 },
  });
});

Deno.test("Gemini: finishReason MAX_TOKENS vira cortado", async () => {
  const { f } = falso(() =>
    json({
      candidates: [{ content: { parts: [{ text: "x" }] }, finishReason: "MAX_TOKENS" }],
      usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 500 },
    })
  );
  assert((await gerarTexto(cfgGemini, PEDIDO, f)).cortado);
});

Deno.test("Compatível: URL base sem barra final, Bearer e chave fora da URL", async () => {
  const { f, pedidos } = falso(() =>
    json({ choices: [{ message: { content: "ok" }, finish_reason: "stop" }], usage: { prompt_tokens: 5, completion_tokens: 1 } })
  );
  const r = await gerarTexto(cfgCompat, PEDIDO, f);
  assertEquals(r.texto, "ok");
  assertFalse(r.estimado);
  const req = pedidos[0];
  assertEquals(req.url, "https://openrouter.ai/api/v1/chat/completions");
  assertEquals(req.headers.get("authorization"), `Bearer ${CHAVE}`);
  conferirSemChaveNaUrl(req);
  conferirFetchSeguro(req);
  assertEquals((await req.json()).model, "meta/llama:free");
});

Deno.test("Compatível sem usage: estima ceil(caracteres/4) com estimado true", async () => {
  const texto = "a".repeat(10); // ceil(10/4) = 3
  const { f } = falso(() => json({ choices: [{ message: { content: texto }, finish_reason: "stop" }] }));
  const r = await gerarTexto(cfgCompat, PEDIDO, f);
  const entrada = Math.ceil((PEDIDO.sistema.length + PEDIDO.prompt.length) / 4);
  assertEquals(r, { texto, tokensEntrada: entrada, tokensSaida: 3, estimado: true, cortado: false });
});

Deno.test("Compatível com URL base inválida: ErroProvedor 400 sem chamar o provedor", async () => {
  for (const url_base of [null, "http://openrouter.ai/v1", "https://169.254.169.254/latest", "https://kong:8000"]) {
    const { f, pedidos } = falso(() => json({}));
    const cfg = { ...cfgCompat, url_base };
    const e1 = await assertRejects(() => gerarTexto(cfg, PEDIDO, f), ErroProvedor);
    assertEquals(e1.status, 400);
    const e2 = await assertRejects(() => gerarStream(cfg, PEDIDO, () => {}, f), ErroProvedor);
    assertEquals(e2.status, 400);
    assertEquals(pedidos.length, 0);
  }
});

Deno.test("validarUrlBase é reexportado por provedores.ts", () => {
  assertEquals(validarUrlBase("https://openrouter.ai/api/v1"), null);
});

// ---------------------------------------------------------------------------
// Erros do provedor
// ---------------------------------------------------------------------------

const CORPO_SECRETO = `{"error":{"message":"Incorrect API key provided: ${CHAVE}. Detalhe interno XYZ"}}`;

for (const cfg of [cfgOpenAI, cfgAnthropic, cfgGemini, cfgCompat]) {
  Deno.test(`${cfg.provedor}: 401 vira ErroProvedor 401 sem o corpo nem a chave`, async () => {
    const { f } = falso(() => new Response(CORPO_SECRETO, { status: 401 }));
    for (const chamada of [() => gerarTexto(cfg, PEDIDO, f), () => gerarStream(cfg, PEDIDO, () => {}, f)]) {
      const e = await assertRejects(chamada, ErroProvedor);
      assertEquals(e.status, 401);
      assertStringIncludes(e.message, "HTTP 401");
      assertStringIncludes(e.message, "confira a chave");
      assertFalse(e.message.includes(CHAVE));
      assertFalse(e.message.includes("XYZ"));
    }
  });

  Deno.test(`${cfg.provedor}: 302 vira ErroProvedor 502`, async () => {
    const { f } = falso(() =>
      new Response(null, { status: 302, headers: { location: "http://169.254.169.254/" } })
    );
    for (const chamada of [() => gerarTexto(cfg, PEDIDO, f), () => gerarStream(cfg, PEDIDO, () => {}, f)]) {
      const e = await assertRejects(chamada, ErroProvedor);
      assertEquals(e.status, 502);
      assertStringIncludes(e.message, "302");
    }
  });
}

Deno.test("403 pede para conferir a chave; 429 cita o limite do provedor; 500 só o status", async () => {
  const casos: Array<[number, string]> = [[403, "confira a chave"], [429, "limite do provedor"], [500, "HTTP 500"]];
  for (const [status, trecho] of casos) {
    const { f } = falso(() => new Response(CORPO_SECRETO, { status }));
    const e = await assertRejects(() => gerarTexto(cfgOpenAI, PEDIDO, f), ErroProvedor);
    assertEquals(e.status, status);
    assertStringIncludes(e.message, `HTTP ${status}`);
    assertStringIncludes(e.message, trecho);
    assertFalse(e.message.includes("XYZ"));
  }
});

Deno.test("HTML ou JSON inesperado com 200 vira ErroProvedor 502 sem o corpo", async () => {
  const fixtures = [
    () => new Response("<html>Gateway XYZ</html>", { status: 200 }),
    () => json({ inesperado: "XYZ" }),
    () => json([1, 2, 3]),
  ];
  for (const cfg of [cfgOpenAI, cfgAnthropic, cfgGemini]) {
    for (const fixture of fixtures) {
      const { f } = falso(fixture);
      const e = await assertRejects(() => gerarTexto(cfg, PEDIDO, f), ErroProvedor);
      assertEquals(e.status, 502);
      assertFalse(e.message.includes("XYZ"));
    }
  }
});

Deno.test("Falha de rede vira ErroProvedor 502 sem a URL nem a chave", async () => {
  const f = (() => Promise.reject(new TypeError(`falhou ao conectar em https://x/?key=${CHAVE}`))) as typeof fetch;
  const e = await assertRejects(() => gerarTexto(cfgGemini, PEDIDO, f), ErroProvedor);
  assertEquals(e.status, 502);
  assertFalse(e.message.includes(CHAVE));
});

Deno.test("Timeout vira ErroProvedor 504", async () => {
  const f = (() => Promise.reject(new DOMException("tempo esgotado", "TimeoutError"))) as typeof fetch;
  const e = await assertRejects(() => gerarTexto(cfgOpenAI, PEDIDO, f), ErroProvedor);
  assertEquals(e.status, 504);
});

// ---------------------------------------------------------------------------
// Stream
// ---------------------------------------------------------------------------

function linhaFront(texto: string): string {
  return `data: ${JSON.stringify({ choices: [{ delta: { content: texto } }] })}\n\n`;
}

Deno.test("OpenAI stream: traduz para o SSE do front, termina em [DONE] e entrega os tokens", async () => {
  const { f, pedidos } = falso(() =>
    sse(
      'data: {"choices":[{"delta":{"role":"assistant","content":""}}]}\n\n' +
        'data: {"choices":[{"delta":{"content":"Olá, "}}]}\n\n' +
        ": keep-alive\n\n" +
        'data: {"choices":[{"delta":{"content":"mundo"},"finish_reason":"length"}]}\n\n' +
        'data: {"choices":[],"usage":{"prompt_tokens":11,"completion_tokens":2}}\n\n' +
        "data: [DONE]\n\n",
    )
  );
  const { usos, aoTerminar } = coletor();
  const saida = await lerTudo(await gerarStream(cfgOpenAI, PEDIDO, aoTerminar, f));
  assertEquals(saida, linhaFront("Olá, ") + linhaFront("mundo") + "data: [DONE]\n\n");
  assertEquals(textoDoFront(saida), "Olá, mundo");
  assertEquals(usos, [{ tokensEntrada: 11, tokensSaida: 2, estimado: false, cortado: true }]);

  const req = pedidos[0];
  conferirFetchSeguro(req);
  conferirSemChaveNaUrl(req);
  const corpo = await req.json();
  assertEquals(corpo.stream, true);
  assertEquals(corpo.stream_options, { include_usage: true });
  assertEquals(corpo.max_tokens, 500);
});

Deno.test("Anthropic stream: traduz eventos, termina em [DONE] e entrega os tokens", async () => {
  const { f, pedidos } = falso(() =>
    sse(
      "event: message_start\n" +
        'data: {"type":"message_start","message":{"usage":{"input_tokens":25,"output_tokens":1}}}\n\n' +
        "event: content_block_start\n" +
        'data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}\n\n' +
        "event: ping\n" +
        'data: {"type":"ping"}\n\n' +
        "event: content_block_delta\n" +
        'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Bom "}}\n\n' +
        "event: content_block_delta\n" +
        'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"dia"}}\n\n' +
        "event: message_delta\n" +
        'data: {"type":"message_delta","delta":{"stop_reason":"max_tokens"},"usage":{"output_tokens":9}}\n\n' +
        "event: message_stop\n" +
        'data: {"type":"message_stop"}\n\n',
      5,
    )
  );
  const { usos, aoTerminar } = coletor();
  const saida = await lerTudo(await gerarStream(cfgAnthropic, PEDIDO, aoTerminar, f));
  assertEquals(saida, linhaFront("Bom ") + linhaFront("dia") + "data: [DONE]\n\n");
  assertEquals(usos, [{ tokensEntrada: 25, tokensSaida: 9, estimado: false, cortado: true }]);
  assertEquals((await pedidos[0].json()).stream, true);
  assertEquals(pedidos[0].headers.get("x-api-key"), CHAVE);
});

Deno.test("Gemini stream: endpoint alt=sse, traduz, termina em [DONE] e entrega os tokens", async () => {
  const { f, pedidos } = falso(() =>
    sse(
      'data: {"candidates":[{"content":{"parts":[{"text":"Pri"}]}}],"usageMetadata":{"promptTokenCount":40}}\r\n\r\n' +
        'data: {"candidates":[{"content":{"parts":[{"text":"meiro"}]},"finishReason":"MAX_TOKENS"}],' +
        '"usageMetadata":{"promptTokenCount":40,"candidatesTokenCount":7}}\r\n\r\n',
    )
  );
  const { usos, aoTerminar } = coletor();
  const saida = await lerTudo(await gerarStream(cfgGemini, PEDIDO, aoTerminar, f));
  assertEquals(saida, linhaFront("Pri") + linhaFront("meiro") + "data: [DONE]\n\n");
  assertEquals(usos, [{ tokensEntrada: 40, tokensSaida: 7, estimado: false, cortado: true }]);

  const req = pedidos[0];
  assertEquals(
    req.url,
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-teste:streamGenerateContent?alt=sse",
  );
  assertEquals(req.headers.get("x-goog-api-key"), CHAVE);
  conferirSemChaveNaUrl(req);
  conferirFetchSeguro(req);
});

Deno.test("Compatível stream sem usage: estima tokens e marca estimado", async () => {
  const { f } = falso(() =>
    sse(
      'data: {"choices":[{"delta":{"content":"abcde"}}]}\n\n' +
        'data: {"choices":[{"delta":{"content":"fgh"},"finish_reason":"stop"}]}\n\n' +
        "data: [DONE]",
    )
  );
  const { usos, aoTerminar } = coletor();
  const saida = await lerTudo(await gerarStream(cfgCompat, PEDIDO, aoTerminar, f));
  assertEquals(textoDoFront(saida), "abcdefgh");
  assert(saida.endsWith("data: [DONE]\n\n"));
  const entrada = Math.ceil((PEDIDO.sistema.length + PEDIDO.prompt.length) / 4);
  assertEquals(usos, [{ tokensEntrada: entrada, tokensSaida: 2, estimado: true, cortado: false }]);
});

Deno.test("cancel() do stream chama aoTerminar uma única vez com o que foi contado", async () => {
  let corpoCancelado = false;
  const corpo = new ReadableStream<Uint8Array>({
    start(c) {
      c.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"12345678"}}]}\n\n'));
      // não fecha: provedor ainda "gerando"
    },
    cancel() {
      corpoCancelado = true;
    },
  });
  const { f } = falso(() => new Response(corpo));
  const { usos, aoTerminar } = coletor();
  const s = await gerarStream(cfgCompat, PEDIDO, aoTerminar, f);
  const reader = s.getReader();
  const primeiro = await reader.read();
  assertEquals(new TextDecoder().decode(primeiro.value), linhaFront("12345678"));
  assertEquals(usos.length, 0);

  await reader.cancel("pessoa fechou a aba");
  assertEquals(usos.length, 1);
  assertEquals(usos[0].tokensSaida, 2);
  assert(usos[0].estimado);
  assert(corpoCancelado, "o corpo do provedor precisa ser cancelado");

  await reader.cancel().catch(() => {});
  assertEquals(usos.length, 1);
});

Deno.test("Erro no meio do stream: stream falha com ErroProvedor e aoTerminar é chamado uma vez", async () => {
  let enviou = false;
  const corpo = new ReadableStream<Uint8Array>({
    pull(c) {
      if (!enviou) {
        enviou = true;
        c.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"abcd"}}]}\n\n'));
        return;
      }
      c.error(new Error("conexão caiu XYZ"));
    },
  });
  const { f } = falso(() => new Response(corpo));
  const { usos, aoTerminar } = coletor();
  const s = await gerarStream(cfgOpenAI, PEDIDO, aoTerminar, f);
  const e = await assertRejects(() => lerTudo(s));
  assertInstanceOf(e, ErroProvedor);
  assertEquals(e.status, 502);
  assertFalse(e.message.includes("XYZ"));
  assertEquals(usos.length, 1);
  assertEquals(usos[0].tokensSaida, 1);
});

Deno.test("Anthropic: evento error no stream encerra com ErroProvedor e chama aoTerminar uma vez", async () => {
  const { f } = falso(() =>
    sse(
      'data: {"type":"message_start","message":{"usage":{"input_tokens":3}}}\n\n' +
        'data: {"type":"error","error":{"type":"overloaded_error","message":"XYZ"}}\n\n',
    )
  );
  const { usos, aoTerminar } = coletor();
  const s = await gerarStream(cfgAnthropic, PEDIDO, aoTerminar, f);
  const e = await assertRejects(() => lerTudo(s));
  assertInstanceOf(e, ErroProvedor);
  assertFalse(e.message.includes("XYZ"));
  assertEquals(usos.length, 1);
  assertEquals(usos[0].tokensEntrada, 3);
});

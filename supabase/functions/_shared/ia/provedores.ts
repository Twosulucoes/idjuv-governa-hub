/**
 * Adaptadores de provedor de IA (OpenAI, Anthropic, Gemini e compatíveis com OpenAI).
 *
 * Cada chamada de IA do sistema passa por aqui (via `ia-gateway`). Regras:
 * - a chave vai só no header do provedor, nunca na URL, em log ou em mensagem de erro;
 * - todo `fetch` usa `redirect: "manual"` (3xx é recusado) e timeout de 120 s;
 * - erro do provedor vira `ErroProvedor` com o status HTTP e sem o corpo da resposta;
 * - quando o provedor não informa tokens, estima `ceil(caracteres / 4)` com `estimado: true`;
 * - o stream sai sempre no formato que o front já lê (`src/hooks/useAICPSI.ts`):
 *   `data: {"choices":[{"delta":{"content":"..."}}]}` por trecho e `data: [DONE]` no fim.
 *
 * Só Web APIs (sem dependências npm), para rodar no Edge Runtime e no `deno test`.
 */

import { validarUrlBase } from "./url.ts";

export { validarUrlBase };

export type ProvedorIA = "openai" | "anthropic" | "gemini" | "compativel_openai";

export interface ConfigProvedor {
  provedor: ProvedorIA;
  url_base: string | null;
  modelo: string;
  chave: string;
}

export interface PedidoIA {
  sistema: string;
  prompt: string;
  maxTokens: number;
}

export interface UsoIA {
  tokensEntrada: number;
  tokensSaida: number;
  estimado: boolean;
  cortado: boolean;
}

export interface RespostaIA extends UsoIA {
  texto: string;
}

/** Erro mostrável ao usuário: só status HTTP e mensagem nossa (nunca corpo do provedor nem chave). */
export class ErroProvedor extends Error {
  constructor(public status: number, mensagem: string) {
    super(mensagem);
    this.name = "ErroProvedor";
  }
}

const TIMEOUT_MS = 120_000;
const URL_OPENAI = "https://api.openai.com/v1";
const URL_ANTHROPIC = "https://api.anthropic.com/v1/messages";
const URL_GEMINI = "https://generativelanguage.googleapis.com/v1beta/models";
const VERSAO_ANTHROPIC = "2023-06-01";

const encoder = new TextEncoder();

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------

function estimarTokens(caracteres: number): number {
  return Math.ceil(caracteres / 4);
}

function numero(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : undefined;
}

/** Monta o uso final: o que o provedor informou ou a estimativa por caracteres. */
function montarUso(
  p: PedidoIA,
  textoLen: number,
  entrada: number | undefined,
  saida: number | undefined,
  cortado: boolean,
): UsoIA {
  const estimado = entrada === undefined || saida === undefined;
  return {
    tokensEntrada: entrada ?? estimarTokens(p.sistema.length + p.prompt.length),
    tokensSaida: saida ?? estimarTokens(textoLen),
    estimado,
    cortado,
  };
}

function mensagemErroHttp(status: number): string {
  const base = `O provedor de IA recusou o pedido (HTTP ${status})`;
  if (status === 401 || status === 403) return `${base}; confira a chave.`;
  if (status === 429) return `${base}; limite do provedor atingido, tente de novo em instantes.`;
  return `${base}.`;
}

function erroRespostaInesperada(): ErroProvedor {
  return new ErroProvedor(502, "O provedor de IA devolveu uma resposta inesperada.");
}

/** Descarta o corpo sem lê-lo (libera o recurso; o conteúdo nunca é usado nem logado). */
async function descartarCorpo(res: Response): Promise<void> {
  try {
    await res.body?.cancel();
  } catch {
    // corpo já consumido/fechado
  }
}

interface Chamada {
  url: string;
  headers: Record<string, string>;
  corpo: unknown;
}

/** `fetch` com redirect manual, timeout e tradução de erro HTTP para `ErroProvedor`. */
async function chamar(f: typeof fetch, c: Chamada): Promise<Response> {
  let res: Response;
  try {
    res = await f(c.url, {
      method: "POST",
      headers: { "content-type": "application/json", ...c.headers },
      body: JSON.stringify(c.corpo),
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    // A mensagem original pode citar a URL; não é repassada.
    if (e instanceof DOMException && (e.name === "TimeoutError" || e.name === "AbortError")) {
      throw new ErroProvedor(504, "O provedor de IA demorou demais para responder.");
    }
    throw new ErroProvedor(502, "Não foi possível falar com o provedor de IA.");
  }

  if ((res.status >= 300 && res.status < 400) || res.type === "opaqueredirect") {
    await descartarCorpo(res);
    throw new ErroProvedor(
      502,
      `O provedor de IA respondeu com redirecionamento (HTTP ${res.status}), que não é aceito.`,
    );
  }
  if (!res.ok) {
    await descartarCorpo(res);
    throw new ErroProvedor(res.status, mensagemErroHttp(res.status));
  }
  return res;
}

async function lerJson(res: Response): Promise<Record<string, unknown>> {
  let texto: string;
  try {
    texto = await res.text();
  } catch (e) {
    if (e instanceof DOMException && (e.name === "TimeoutError" || e.name === "AbortError")) {
      throw new ErroProvedor(504, "O provedor de IA demorou demais para responder.");
    }
    throw erroRespostaInesperada();
  }
  try {
    const v = JSON.parse(texto);
    if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  } catch {
    // HTML ou texto: cai no erro abaixo
  }
  throw erroRespostaInesperada();
}

// deno-lint-ignore no-explicit-any
type Json = any;

// ---------------------------------------------------------------------------
// Montagem do pedido por provedor
// ---------------------------------------------------------------------------

function montarChamada(cfg: ConfigProvedor, p: PedidoIA, stream: boolean): Chamada {
  switch (cfg.provedor) {
    case "openai":
    case "compativel_openai": {
      let base = URL_OPENAI;
      if (cfg.provedor === "compativel_openai") {
        const erro = validarUrlBase(cfg.url_base ?? "");
        if (erro) throw new ErroProvedor(400, erro);
        base = (cfg.url_base as string).trim().replace(/\/+$/, "");
      }
      const corpo: Record<string, unknown> = {
        model: cfg.modelo,
        messages: [
          { role: "system", content: p.sistema },
          { role: "user", content: p.prompt },
        ],
        max_tokens: p.maxTokens,
      };
      if (stream) {
        corpo.stream = true;
        corpo.stream_options = { include_usage: true };
      }
      return {
        url: `${base}/chat/completions`,
        headers: { authorization: `Bearer ${cfg.chave}` },
        corpo,
      };
    }
    case "anthropic": {
      const corpo: Record<string, unknown> = {
        model: cfg.modelo,
        max_tokens: p.maxTokens,
        system: p.sistema,
        messages: [{ role: "user", content: p.prompt }],
      };
      if (stream) corpo.stream = true;
      return {
        url: URL_ANTHROPIC,
        headers: { "x-api-key": cfg.chave, "anthropic-version": VERSAO_ANTHROPIC },
        corpo,
      };
    }
    case "gemini": {
      const modelo = encodeURIComponent(cfg.modelo);
      return {
        url: stream
          ? `${URL_GEMINI}/${modelo}:streamGenerateContent?alt=sse`
          : `${URL_GEMINI}/${modelo}:generateContent`,
        headers: { "x-goog-api-key": cfg.chave },
        corpo: {
          systemInstruction: { parts: [{ text: p.sistema }] },
          contents: [{ role: "user", parts: [{ text: p.prompt }] }],
          generationConfig: { maxOutputTokens: p.maxTokens },
        },
      };
    }
    default:
      throw new ErroProvedor(400, "Provedor de IA desconhecido.");
  }
}

/** Texto das partes do Gemini, ignorando as de raciocínio (`thought: true`). */
function textoGemini(candidato: Json): string {
  const partes = candidato?.content?.parts;
  if (!Array.isArray(partes)) return "";
  return partes
    .filter((pt: Json) => pt && typeof pt.text === "string" && pt.thought !== true)
    .map((pt: Json) => pt.text as string)
    .join("");
}

/** Tokens de saída do Gemini: resposta + raciocínio (os dois são cobrados). */
function saidaGemini(meta: Json): number | undefined {
  const resposta = numero(meta?.candidatesTokenCount);
  const raciocinio = numero(meta?.thoughtsTokenCount);
  if (resposta === undefined && raciocinio === undefined) return undefined;
  return (resposta ?? 0) + (raciocinio ?? 0);
}

// ---------------------------------------------------------------------------
// Resposta completa
// ---------------------------------------------------------------------------

/** Gera texto completo (sem stream). Lança `ErroProvedor` em qualquer falha. */
export async function gerarTexto(
  cfg: ConfigProvedor,
  p: PedidoIA,
  f: typeof fetch = fetch,
): Promise<RespostaIA> {
  const res = await chamar(f, montarChamada(cfg, p, false));
  const d: Json = await lerJson(res);

  let texto: string;
  let entrada: number | undefined;
  let saida: number | undefined;
  let cortado: boolean;

  switch (cfg.provedor) {
    case "openai":
    case "compativel_openai": {
      const escolha = Array.isArray(d.choices) ? d.choices[0] : undefined;
      if (!escolha || typeof escolha !== "object") throw erroRespostaInesperada();
      const conteudo = escolha.message?.content;
      texto = typeof conteudo === "string" ? conteudo : "";
      cortado = escolha.finish_reason === "length";
      entrada = numero(d.usage?.prompt_tokens);
      saida = numero(d.usage?.completion_tokens);
      break;
    }
    case "anthropic": {
      if (!Array.isArray(d.content)) throw erroRespostaInesperada();
      texto = d.content
        .filter((b: Json) => b?.type === "text" && typeof b.text === "string")
        .map((b: Json) => b.text as string)
        .join("");
      cortado = d.stop_reason === "max_tokens";
      entrada = numero(d.usage?.input_tokens);
      saida = numero(d.usage?.output_tokens);
      break;
    }
    case "gemini": {
      // Sem `candidates` só é válido quando o pedido foi bloqueado (`promptFeedback`).
      if (!Array.isArray(d.candidates) && !d.promptFeedback) throw erroRespostaInesperada();
      const candidato = Array.isArray(d.candidates) ? d.candidates[0] : undefined;
      texto = textoGemini(candidato);
      cortado = candidato?.finishReason === "MAX_TOKENS";
      entrada = numero(d.usageMetadata?.promptTokenCount);
      saida = saidaGemini(d.usageMetadata);
      break;
    }
    default:
      throw new ErroProvedor(400, "Provedor de IA desconhecido.");
  }

  return { texto, ...montarUso(p, texto.length, entrada, saida, cortado) };
}

// ---------------------------------------------------------------------------
// Stream
// ---------------------------------------------------------------------------

/** Estado acumulado durante o stream (o que o provedor já informou). */
interface EstadoStream {
  entrada?: number;
  saida?: number;
  cortado: boolean;
  /** Erro reportado pelo provedor dentro do stream (evento `error` da Anthropic). */
  erro?: boolean;
}

/** Interpreta o JSON de uma linha `data:` e devolve o texto novo (se houver). */
type Interpretador = (d: Json, estado: EstadoStream) => string | undefined;

const interpretarOpenAI: Interpretador = (d, e) => {
  const escolha = Array.isArray(d?.choices) ? d.choices[0] : undefined;
  if (escolha?.finish_reason === "length") e.cortado = true;
  // Alguns compatíveis mandam `usage` em todo trecho: fica o último.
  const entrada = numero(d?.usage?.prompt_tokens);
  const saida = numero(d?.usage?.completion_tokens);
  if (entrada !== undefined) e.entrada = entrada;
  if (saida !== undefined) e.saida = saida;
  const texto = escolha?.delta?.content;
  return typeof texto === "string" ? texto : undefined;
};

const interpretarAnthropic: Interpretador = (d, e) => {
  switch (d?.type) {
    case "message_start": {
      const entrada = numero(d.message?.usage?.input_tokens);
      if (entrada !== undefined) e.entrada = entrada;
      const saida = numero(d.message?.usage?.output_tokens);
      if (saida !== undefined && e.saida === undefined) e.saida = saida;
      return undefined;
    }
    case "content_block_delta":
      return d.delta?.type === "text_delta" && typeof d.delta.text === "string"
        ? d.delta.text
        : undefined;
    case "message_delta": {
      if (d.delta?.stop_reason === "max_tokens") e.cortado = true;
      const saida = numero(d.usage?.output_tokens);
      if (saida !== undefined) e.saida = saida;
      return undefined;
    }
    case "error":
      e.erro = true;
      return undefined;
    default:
      return undefined;
  }
};

const interpretarGemini: Interpretador = (d, e) => {
  const candidato = Array.isArray(d?.candidates) ? d.candidates[0] : undefined;
  if (candidato?.finishReason === "MAX_TOKENS") e.cortado = true;
  // `usageMetadata` vem acumulado: fica o último.
  const entrada = numero(d?.usageMetadata?.promptTokenCount);
  const saida = saidaGemini(d?.usageMetadata);
  if (entrada !== undefined) e.entrada = entrada;
  if (saida !== undefined) e.saida = saida;
  const texto = textoGemini(candidato);
  return texto === "" ? undefined : texto;
};

function trechoFront(texto: string): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: texto } }] })}\n\n`);
}

/**
 * Traduz o SSE do provedor para o SSE do front. `aoTerminar` é chamado uma única
 * vez: no fim do stream, no erro de leitura/erro do provedor ou no `cancel()`.
 */
function traduzirStream(
  corpo: ReadableStream<Uint8Array>,
  interpretar: Interpretador,
  p: PedidoIA,
  aoTerminar: (u: UsoIA) => void,
): ReadableStream<Uint8Array> {
  const reader = corpo.getReader();
  const decoder = new TextDecoder();
  const estado: EstadoStream = { cortado: false };
  let buffer = "";
  let textoLen = 0;
  let terminado = false;

  const finalizar = () => {
    if (terminado) return;
    terminado = true;
    try {
      aoTerminar(montarUso(p, textoLen, estado.entrada, estado.saida, estado.cortado));
    } catch {
      // falha no registro de uso não derruba o stream da pessoa
    }
  };

  /** Processa uma linha SSE; devolve o trecho a enviar ao front, se houver. */
  const processarLinha = (linhaBruta: string): Uint8Array | undefined => {
    const linha = linhaBruta.replace(/\r$/, "");
    if (!linha.startsWith("data:")) return undefined; // `event:`, `:` (keep-alive), vazias
    const dados = linha.slice(5).trim();
    if (!dados || dados === "[DONE]") return undefined;
    let json: Json;
    try {
      json = JSON.parse(dados);
    } catch {
      return undefined; // linha malformada: mesma tolerância do parser do front
    }
    const texto = interpretar(json, estado);
    if (!texto) return undefined;
    textoLen += texto.length;
    return trechoFront(texto);
  };

  const encerrarComErro = (controller: ReadableStreamDefaultController<Uint8Array>) => {
    finalizar();
    reader.cancel().catch(() => {});
    controller.error(new ErroProvedor(502, "O provedor de IA interrompeu a resposta."));
  };

  return new ReadableStream<Uint8Array>({
    // O ReadableStream só chama `pull` de novo se a chamada anterior enfileirou algo:
    // por isso lê do provedor até ter um trecho para o front (pedaço sem linha
    // completa, `event:`, keep-alive e linhas só de uso não produzem saída).
    async pull(controller) {
      while (true) {
        let leitura: ReadableStreamReadResult<Uint8Array>;
        try {
          leitura = await reader.read();
        } catch {
          // timeout de 120 s, conexão caída ou corpo abortado
          finalizar();
          controller.error(new ErroProvedor(502, "O provedor de IA interrompeu a resposta."));
          return;
        }

        if (leitura.done) {
          buffer += decoder.decode();
          for (const linha of buffer.split("\n")) {
            const trecho = processarLinha(linha);
            if (trecho) controller.enqueue(trecho);
          }
          buffer = "";
          if (estado.erro) return encerrarComErro(controller);
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          finalizar();
          return;
        }

        buffer += decoder.decode(leitura.value, { stream: true });
        let enfileirou = false;
        let fim: number;
        while ((fim = buffer.indexOf("\n")) !== -1) {
          const linha = buffer.slice(0, fim);
          buffer = buffer.slice(fim + 1);
          const trecho = processarLinha(linha);
          if (trecho) {
            controller.enqueue(trecho);
            enfileirou = true;
          }
        }
        if (estado.erro) return encerrarComErro(controller);
        if (enfileirou) return;
      }
    },
    async cancel(motivo) {
      finalizar();
      try {
        await reader.cancel(motivo);
      } catch {
        // já fechado
      }
    },
  });
}

/**
 * Gera resposta em stream, já no formato SSE do front.
 *
 * Se o pedido falhar antes do stream começar (HTTP de erro, 3xx, URL base inválida),
 * a Promise rejeita com `ErroProvedor` e `aoTerminar` NÃO é chamado: quem chamou
 * registra o erro. Depois que o stream é devolvido, `aoTerminar` é chamado uma única
 * vez (fim, erro no meio ou `cancel()`), com os tokens contados até ali.
 */
export async function gerarStream(
  cfg: ConfigProvedor,
  p: PedidoIA,
  aoTerminar: (u: UsoIA) => void,
  f: typeof fetch = fetch,
): Promise<ReadableStream<Uint8Array>> {
  const res = await chamar(f, montarChamada(cfg, p, true));
  if (!res.body) throw erroRespostaInesperada();

  const interpretar = cfg.provedor === "anthropic"
    ? interpretarAnthropic
    : cfg.provedor === "gemini"
    ? interpretarGemini
    : interpretarOpenAI;

  return traduzirStream(res.body, interpretar, p, aoTerminar);
}

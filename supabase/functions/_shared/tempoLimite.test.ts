import { describe, expect, it } from "vitest";
import { fetchComTempoLimite, TempoEsgotado } from "./tempoLimite.ts";

/** fetch falso que só responde depois de `ms` e respeita o AbortSignal. */
function fetchLento(ms: number): typeof fetch {
  return ((_url: string, init?: RequestInit) =>
    new Promise<Response>((resolve, reject) => {
      const t = setTimeout(() => resolve(new Response("ok")), ms);
      init?.signal?.addEventListener("abort", () => {
        clearTimeout(t);
        reject(new DOMException("abortado", "AbortError"));
      });
    })) as typeof fetch;
}

describe("fetchComTempoLimite", () => {
  it("devolve a resposta quando ela chega antes do limite", async () => {
    const resp = await fetchComTempoLimite("IA", "https://x", {}, 200, fetchLento(5));
    expect(await resp.text()).toBe("ok");
  });

  it("vira TempoEsgotado quando o serviço não responde", async () => {
    const promessa = fetchComTempoLimite("IA", "https://x", {}, 10, fetchLento(500));
    await expect(promessa).rejects.toBeInstanceOf(TempoEsgotado);
    await expect(promessa).rejects.toThrow("IA não respondeu a tempo");
  });

  it("repassa erro de rede que não é o tempo limite", async () => {
    const falha = (() => Promise.reject(new TypeError("rede"))) as unknown as typeof fetch;
    await expect(fetchComTempoLimite("IA", "https://x", {}, 200, falha)).rejects.toThrow("rede");
  });

  it("para o relógio depois dos cabeçalhos (não corta o corpo em streaming)", async () => {
    let sinal: AbortSignal | undefined;
    const rapido = ((_u: string, init?: RequestInit) => {
      sinal = init?.signal ?? undefined;
      return Promise.resolve(new Response("ok"));
    }) as typeof fetch;
    await fetchComTempoLimite("IA", "https://x", {}, 10, rapido);
    await new Promise((r) => setTimeout(r, 30));
    expect(sinal?.aborted).toBe(false);
  });
});

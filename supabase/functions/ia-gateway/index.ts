// ============================================================================
// ia-gateway: porta única de IA do sistema (substitui a antiga cpsi-ai-assistant).
// ============================================================================
// A configuração (provedor, modelo, chave no Vault, limites) vem do banco da instância
// pela RPC ia_config_servidor, que só o service role executa. Ordem fixa do handler:
//
//   CORS (ALLOWED_ORIGINS) → sessão → permissão (pode_usar_ia / pode_configurar_ia no
//   "testar", com o cliente da pessoa) → validação do corpo → ia_config_servidor() →
//   desligada? 409 → teto mensal de tokens? 429 → consumir_cota_uso (por hora) →
//   provedor → INSERT ia_uso (também em erro e cortado; no stream, ao terminar).
//
// Recursos:
//   - "cpsi":   assistente dos formulários do CPSI (_shared/ia/recursos/cpsi.ts);
//   - "testar": chamada mínima para conferir provedor/chave; funciona com a IA desligada.
//
// Erros sempre em JSON { error, codigo }. Nunca vão para log nem para a resposta:
// a chave, o texto do pedido e o texto devolvido pelo modelo.
// ============================================================================

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import {
  type ConfigProvedor,
  ErroProvedor,
  gerarStream,
  gerarTexto,
  type PedidoIA,
  type ProvedorIA,
  type UsoIA,
} from "../_shared/ia/provedores.ts";
import { ErroRecurso, MENSAGEM_CORTADO, prepararCpsi } from "../_shared/ia/recursos/cpsi.ts";

// CORS com allowlist por ambiente (mesmo padrão de admin-create-user/delete-user).
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allowOrigin = ALLOWED_ORIGINS.length === 0
    ? "*"
    : ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}

function respostaJson(cors: Record<string, string>, status: number, corpo: unknown): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function erro(cors: Record<string, string>, status: number, codigo: string, mensagem: string) {
  return respostaJson(cors, status, { error: mensagem, codigo });
}

/** Chamada mínima do "testar": só confere que provedor, modelo e chave respondem. */
const PEDIDO_TESTE: PedidoIA = {
  sistema: "Responda apenas com a palavra OK.",
  prompt: "Teste de conexão. Responda OK.",
  maxTokens: 16,
};

/** Formato devolvido por ia_config_servidor() (só o que o gateway usa). */
interface ConfigServidor {
  ativo: boolean;
  provedor: ProvedorIA | null;
  url_base: string | null;
  modelo: string | null;
  limite_chamadas_hora: number;
  teto_tokens_mes: number | string | null;
  tokens_mes: number | string | null;
  chave: string | null;
}

type StatusUso = "ok" | "erro" | "cortado";

/** Mantém a promessa viva após a resposta, quando o runtime oferece `waitUntil`. */
function emSegundoPlano(p: Promise<unknown>) {
  // deno-lint-ignore no-explicit-any
  const runtime = (globalThis as any).EdgeRuntime;
  try {
    runtime?.waitUntil?.(p);
  } catch {
    // runtime sem waitUntil: a promessa segue sozinha
  }
}

Deno.serve(async (req) => {
  const cors = corsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  try {
    // ---- sessão --------------------------------------------------------------
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return erro(cors, 401, "sem_sessao", "Não autorizado");

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user: caller }, error: callerError } = await supabaseUser.auth.getUser();
    if (callerError || !caller) return erro(cors, 401, "sem_sessao", "Sessão inválida");

    // ---- permissão (o recurso decide qual) ------------------------------------
    const body = await req.json().catch(() => null);
    const recurso = body?.recurso;
    if (recurso !== "cpsi" && recurso !== "testar") {
      return erro(cors, 400, "pedido_invalido", "Recurso de IA desconhecido");
    }

    const funcaoPermissao = recurso === "testar" ? "pode_configurar_ia" : "pode_usar_ia";
    const { data: permitido, error: permissaoError } = await supabaseUser.rpc(funcaoPermissao);
    if (permissaoError) {
      console.error("ia-gateway: falha ao validar permissões");
      return erro(cors, 500, "erro_interno", "Falha ao validar permissões");
    }
    if (permitido !== true) {
      return erro(
        cors,
        403,
        "sem_permissao",
        recurso === "testar"
          ? "Acesso negado. Requer a permissão de configurar a IA."
          : "Acesso negado. Requer a permissão de usar o assistente de IA.",
      );
    }

    // ---- validação do corpo ---------------------------------------------------
    let pedido: PedidoIA;
    let stream = false;
    let tratar: (texto: string) => unknown = () => null;
    if (recurso === "cpsi") {
      const preparo = prepararCpsi(body);
      if ("erro" in preparo) return erro(cors, 400, "pedido_invalido", preparo.erro);
      ({ pedido, stream, tratar } = preparo);
    } else {
      pedido = PEDIDO_TESTE;
    }

    // ---- configuração da instituição (service role) ---------------------------
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data: cfgBruta, error: cfgError } = await admin.rpc("ia_config_servidor");
    if (cfgError) {
      console.error("ia-gateway: falha ao ler a configuração de IA");
      return erro(cors, 500, "erro_interno", "Falha ao ler a configuração de IA");
    }
    const cfg = cfgBruta as ConfigServidor | null;

    if (recurso === "testar") {
      if (!cfg || !cfg.chave || !cfg.provedor || !cfg.modelo) {
        return erro(cors, 409, "sem_chave", "Cadastre a chave antes de testar");
      }
    } else if (!cfg || !cfg.ativo || !cfg.chave || !cfg.provedor || !cfg.modelo) {
      return erro(cors, 409, "ia_desligada", "A IA não está habilitada nesta instituição");
    }

    // ---- teto mensal de tokens -------------------------------------------------
    const teto = cfg.teto_tokens_mes === null || cfg.teto_tokens_mes === undefined
      ? null
      : Number(cfg.teto_tokens_mes);
    const tokensMes = Number(cfg.tokens_mes ?? 0);
    if (teto !== null && Number.isFinite(teto) && tokensMes >= teto) {
      return erro(
        cors,
        429,
        "teto_mes",
        "O teto mensal de tokens de IA da instituição foi atingido. Fale com a administração.",
      );
    }

    // ---- cota por pessoa por hora ------------------------------------------------
    const limiteHora = Number(cfg.limite_chamadas_hora) || 30;
    const { data: dentroDaCota, error: cotaError } = await admin.rpc("consumir_cota_uso", {
      _usuario: caller.id,
      _tipo: "ia",
      _quantidade: 1,
      _limite: limiteHora,
      _modulo: "compras",
      _descricao: `IA: ${recurso}`,
    });
    if (cotaError) {
      console.error("ia-gateway: falha ao verificar o limite de uso");
      return erro(cors, 500, "erro_interno", "Falha ao verificar o limite de uso");
    }
    if (dentroDaCota !== true) {
      return erro(
        cors,
        429,
        "cota_hora",
        `Limite de ${limiteHora} pedidos por hora ao assistente atingido. Tente mais tarde.`,
      );
    }

    // ---- provedor ------------------------------------------------------------------
    const cfgProvedor: ConfigProvedor = {
      provedor: cfg.provedor,
      url_base: cfg.url_base,
      modelo: cfg.modelo,
      chave: cfg.chave,
    };
    const registrar = criarRegistro(admin, caller.id, recurso, cfgProvedor);

    try {
      if (stream) {
        let uso: UsoIA | null = null;
        const interno = await gerarStream(cfgProvedor, pedido, (u) => {
          uso = u;
        });
        return new Response(acompanharStream(interno, () => uso, registrar), {
          headers: { ...cors, "Content-Type": "text/event-stream" },
        });
      }

      const resposta = await gerarTexto(cfgProvedor, pedido);

      if (recurso === "testar") {
        // Com 16 tokens o corte é esperado (modelos com raciocínio): a conexão funcionou.
        await registrar(resposta, resposta.cortado ? "cortado" : "ok");
        return respostaJson(cors, 200, {
          ok: true,
          provedor: cfgProvedor.provedor,
          modelo: cfgProvedor.modelo,
        });
      }

      if (resposta.cortado) {
        await registrar(resposta, "cortado");
        return erro(cors, 422, "cortado", MENSAGEM_CORTADO);
      }

      let corpo: unknown;
      try {
        corpo = tratar(resposta.texto);
      } catch (e) {
        if (e instanceof ErroRecurso) {
          await registrar(resposta, "erro");
          return erro(cors, e.status, e.codigo, e.message);
        }
        throw e;
      }
      await registrar(resposta, "ok");
      return respostaJson(cors, 200, corpo);
    } catch (e) {
      if (e instanceof ErroProvedor) {
        // Falha antes do stream começar ou na resposta completa: aoTerminar não roda.
        await registrar(null, "erro");
        console.error(`ia-gateway: provedor recusou ou falhou (status ${e.status})`);
        return erro(cors, e.status === 504 ? 504 : 502, "provedor", e.message);
      }
      throw e;
    }
  } catch (e) {
    // Só o tipo do erro vai para o log: a mensagem pode carregar dados do pedido.
    console.error("ia-gateway: erro inesperado", e instanceof Error ? e.name : typeof e);
    return erro(cors, 500, "erro_interno", "Erro ao processar o pedido de IA");
  }
});

/**
 * Devolve a função que grava uma linha em ia_uso (service role). Nunca lança: falha
 * no registro só gera um log genérico. Sem uso conhecido (erro antes da resposta),
 * grava zero tokens.
 */
function criarRegistro(
  admin: SupabaseClient,
  userId: string,
  recurso: string,
  cfg: ConfigProvedor,
): (uso: UsoIA | null, status: StatusUso) => Promise<void> {
  return async (uso, status) => {
    try {
      const { error } = await admin.from("ia_uso").insert({
        user_id: userId,
        recurso,
        provedor: cfg.provedor,
        modelo: cfg.modelo,
        tokens_entrada: uso?.tokensEntrada ?? 0,
        tokens_saida: uso?.tokensSaida ?? 0,
        tokens_estimados: uso?.estimado ?? false,
        status,
      });
      if (error) console.error("ia-gateway: falha ao registrar o uso de IA");
    } catch {
      console.error("ia-gateway: falha ao registrar o uso de IA");
    }
  };
}

/**
 * Repassa o stream já traduzido e registra o uso uma única vez, sem bloquear a resposta:
 * fim normal → 'ok' (ou 'cortado' se o provedor cortou por tamanho); erro no meio → 'erro';
 * pessoa fechou a aba (cancel) → 'cortado', com os tokens contados até ali.
 * O uso vem do `aoTerminar` de `gerarStream`, que roda antes do fim/erro chegar aqui.
 */
function acompanharStream(
  interno: ReadableStream<Uint8Array>,
  lerUso: () => UsoIA | null,
  registrar: (uso: UsoIA | null, status: StatusUso) => Promise<void>,
): ReadableStream<Uint8Array> {
  const reader = interno.getReader();
  let registrado = false;
  const fechar = (status: (uso: UsoIA | null) => StatusUso) => {
    if (registrado) return;
    registrado = true;
    const uso = lerUso();
    emSegundoPlano(registrar(uso, status(uso)));
  };

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          fechar((uso) => (uso?.cortado ? "cortado" : "ok"));
          return;
        }
        controller.enqueue(value);
      } catch (e) {
        fechar(() => "erro");
        controller.error(e);
      }
    },
    async cancel(motivo) {
      try {
        await reader.cancel(motivo);
      } catch {
        // já fechado
      }
      fechar(() => "cortado");
    },
  });
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CABECALHOS_CLIENTE_SUPABASE, montarCors } from "../_shared/cors.ts";

// Sugestão de casamentos da conciliação mensal (aba "Fechamento mensal"): recebe só as pendências que sobraram
// das regras automáticas e pede ao Gemini grupos que se correspondem. Nada é gravado aqui: a tela mostra cada
// sugestão e o usuário aceita ou recusa (src/lib/conciliacao/sugestoes.ts confere de novo no navegador).
// Exige sessão, o módulo financeiro e a permissão pagamento.conciliar (a mesma que grava a conciliação).
// CPF/CNPJ do histórico são apagados aqui também, antes de sair para a API.

const LIMITE_CHAMADAS_HORA = 20;
const LIMITE_PENDENCIAS = 400;
const LIMITE_TOKENS_RESPOSTA = 8192;
const ORCAMENTO_RACIOCINIO = 4096;

const SYSTEM_PROMPT = `Você ajuda a fazer a conciliação bancária mensal de um órgão público (quadro da SEFAZ).
Recebe as pendências que sobraram depois das regras automáticas: lançamentos do razão do FIPLAN (lado "contabil")
e do extrato do banco (lado "bancario"), cada um com natureza "debito" ou "credito" e valor em centavos.

Correspondência: um débito do razão (entrada no ativo) corresponde a um crédito do banco, e um crédito do razão a um
débito do banco. Dentro do mesmo lado, um débito e um crédito podem se anular (estorno, lançamento de ajuste).
Um grupo só é válido se a soma dos valores de natureza "debito" for igual à soma dos de natureza "credito".

Sugira só grupos com motivo claro no histórico, no documento, no tipo ou na data: tarifa do banco registrada depois
no razão, rendimento da aplicação registrado no razão, ordem bancária cancelada e emitida de novo, pagamento em lote,
devolução, estorno. Não sugira grupo só porque os valores batem por acaso. Use só ids da lista, cada id em um grupo
no máximo. O motivo vai para a justificativa do casamento: uma frase curta em português. Sem nada claro, devolva a
lista vazia.`;

interface Pendencia {
  id: string;
  lado: "contabil" | "bancario";
  natureza: "debito" | "credito";
  data: string;
  documento: string;
  tipo: string;
  historico: string;
  valorCentavos: number;
}

function respostaJson(cors: Record<string, string>, status: number, corpo: unknown) {
  return new Response(JSON.stringify(corpo), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

const texto = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : null);

/** Troca por *** o que parece CPF ou CNPJ (o mesmo de mascararDocumentosPessoais no front). */
const mascarar = (t: string) =>
  t.replace(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g, "***").replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, "***");

/** Pendências do pedido, conferidas campo a campo; null se o pedido não tiver a forma esperada. */
function lerPendencias(corpo: unknown): Pendencia[] | null {
  const lista = (corpo as { pendencias?: unknown })?.pendencias;
  if (!Array.isArray(lista) || lista.length < 2 || lista.length > LIMITE_PENDENCIAS) return null;
  const ids = new Set<string>();
  const pendencias: Pendencia[] = [];
  for (const p of lista as Record<string, unknown>[]) {
    const id = texto(p?.id, 10);
    const data = texto(p?.data, 10);
    const documento = texto(p?.documento, 40);
    const tipo = texto(p?.tipo, 10);
    const historico = texto(p?.historico, 200);
    const valor = p?.valorCentavos;
    if (!id || !/^p\d+$/.test(id) || ids.has(id)) return null;
    if (p.lado !== "contabil" && p.lado !== "bancario") return null;
    if (p.natureza !== "debito" && p.natureza !== "credito") return null;
    if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data) || documento === null || tipo === null || historico === null) return null;
    if (typeof valor !== "number" || !Number.isInteger(valor) || valor <= 0) return null;
    ids.add(id);
    pendencias.push({ id, lado: p.lado, natureza: p.natureza, data, documento, tipo, historico: mascarar(historico), valorCentavos: valor });
  }
  return pendencias;
}

/** Grupos da resposta que fecham (débitos = créditos), com ids conhecidos e cada id uma vez só. */
function gruposValidos(pendencias: Pendencia[], resposta: unknown): { ids: string[]; motivo: string }[] {
  const porId = new Map(pendencias.map((p) => [p.id, p]));
  const usados = new Set<string>();
  const sugestoes = (resposta as { sugestoes?: unknown })?.sugestoes;
  if (!Array.isArray(sugestoes)) return [];
  const validas: { ids: string[]; motivo: string }[] = [];
  for (const s of sugestoes as { ids?: unknown; motivo?: unknown }[]) {
    if (!Array.isArray(s?.ids) || typeof s.motivo !== "string" || !s.motivo.trim()) continue;
    const ids = [...new Set(s.ids.filter((id): id is string => typeof id === "string"))];
    if (ids.length < 2 || ids.length !== s.ids.length || ids.some((id) => !porId.has(id) || usados.has(id))) continue;
    const saldo = ids.reduce((t, id) => {
      const p = porId.get(id)!;
      return t + (p.natureza === "debito" ? p.valorCentavos : -p.valorCentavos);
    }, 0);
    if (saldo !== 0) continue;
    ids.forEach((id) => usados.add(id));
    validas.push({ ids, motivo: s.motivo.trim().slice(0, 300) });
  }
  return validas;
}

serve(async (req) => {
  const cors = montarCors(req, { cabecalhos: CABECALHOS_CLIENTE_SUPABASE, metodos: "POST, OPTIONS" });
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return respostaJson(cors, 405, { error: "Método não permitido" });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return respostaJson(cors, 401, { error: "Não autorizado" });

    const supabaseUser = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: callerError } = await supabaseUser.auth.getUser();
    if (callerError || !caller) return respostaJson(cors, 401, { error: "Sessão inválida" });

    const [{ data: temModulo, error: moduloError }, { data: podeConciliar, error: permissaoError }] = await Promise.all([
      supabaseUser.rpc("can_access_module", { _user_id: caller.id, _module: "financeiro" }),
      supabaseUser.rpc("has_permission_code", { _user_id: caller.id, _permission: "pagamento.conciliar" }),
    ]);
    if (moduloError || permissaoError) return respostaJson(cors, 500, { error: "Falha ao validar permissões" });
    if (!temModulo || !podeConciliar) {
      return respostaJson(cors, 403, { error: "Acesso negado. Requer a permissão de conciliar pagamentos." });
    }

    const pendencias = lerPendencias(await req.json().catch(() => null));
    if (!pendencias) return respostaJson(cors, 400, { error: "Pedido inválido" });

    // Cota por usuário na última hora (service role: só ela executa consumir_cota_uso).
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: dentroDaCota, error: cotaError } = await admin.rpc("consumir_cota_uso", {
      _usuario: caller.id,
      _tipo: "conciliacao_ia",
      _quantidade: 1,
      _limite: LIMITE_CHAMADAS_HORA,
      _modulo: "financeiro",
      _descricao: `Sugestão de casamentos da conciliação mensal (${pendencias.length} pendências)`,
    });
    if (cotaError) return respostaJson(cors, 500, { error: "Falha ao verificar o limite de uso" });
    if (!dentroDaCota) {
      return respostaJson(cors, 429, { error: `Limite de ${LIMITE_CHAMADAS_HORA} sugestões por hora atingido. Tente mais tarde.` });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY não configurada");
    const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-flash-latest";

    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": GEMINI_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: `Pendências:\n${JSON.stringify(pendencias)}` }] }],
        generationConfig: {
          maxOutputTokens: LIMITE_TOKENS_RESPOSTA,
          thinkingConfig: { thinkingBudget: ORCAMENTO_RACIOCINIO },
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              sugestoes: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: { ids: { type: "ARRAY", items: { type: "STRING" } }, motivo: { type: "STRING" } },
                  required: ["ids", "motivo"],
                },
              },
            },
            required: ["sugestoes"],
          },
        },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return respostaJson(cors, 429, { error: "O serviço de IA está ocupado. Tente novamente em instantes." });
      }
      // Só status e tamanho no log: o corpo do erro pode repetir o pedido.
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, `(${errText.length} caracteres)`);
      throw new Error("Erro no serviço de IA");
    }

    const dados = await aiResponse.json();
    const conteudo: string = dados.candidates?.[0]?.content?.parts?.[0]?.text || "";
    let resposta: unknown;
    try {
      resposta = JSON.parse(conteudo);
    } catch {
      console.error("Resposta da IA sem JSON:", `(${conteudo.length} caracteres)`);
      return respostaJson(cors, 422, { error: "Não foi possível ler a resposta da IA. Tente novamente." });
    }
    const validos = gruposValidos(pendencias, resposta);
    const devolvidos = (resposta as { sugestoes?: unknown[] })?.sugestoes?.length ?? 0;
    // Só contagens no log: quantos grupos a IA devolveu e quantos fecharam
    console.log("conciliacao-ia-sugestoes:", `${pendencias.length} pendências, ${devolvidos} grupos da IA, ${validos.length} válidos`);
    return respostaJson(cors, 200, { sugestoes: validos });
  } catch (error) {
    console.error("conciliacao-ia-sugestoes:", error instanceof Error ? error.message : "erro");
    return respostaJson(cors, 500, { error: "Erro ao gerar as sugestões" });
  }
});

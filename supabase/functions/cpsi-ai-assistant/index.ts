import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS com allowlist por ambiente (mesmo padrão de admin-create-user/delete-user).
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function corsHeaders(req: Request) {
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

const SYSTEM_PROMPT = `Você é um especialista em compras públicas e contratações inovadoras do Brasil.
Você conhece profundamente:
- LC 182/2021 (Marco Legal das Startups e Empreendedorismo Inovador)
- Lei 14.133/2021 (Nova Lei de Licitações)
- IN SEGES/MP nº 5/2017 (Planejamento da Contratação)
- CPSI (Contrato Público de Solução Inovadora), arts. 11 a 16 da LC 182/2021

Você escreve em português formal, com linguagem técnica adequada para documentos oficiais da administração pública brasileira.
Seja objetivo, preciso e fundamentado legalmente. Use parágrafos curtos e linguagem direta.
Quando apropriado, cite artigos de lei e normas. Não invente dados numéricos — use placeholders como "[VALOR]" ou "[PRAZO]" quando não tiver informação.`;

/**
 * Traduz o stream SSE nativo do Gemini (`data: {"candidates":[{"content":
 * {"parts":[{"text":"..."}]}}]}`) para o formato OpenAI-compatible
 * (`data: {"choices":[{"delta":{"content":"..."}}]}`) que o frontend já lê,
 * terminando com `data: [DONE]`.
 */
function translateGeminiStreamToOpenAI(geminiBody: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const reader = geminiBody.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
        return;
      }

      buffer += decoder.decode(value, { stream: true });
      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newlineIndex).replace(/\r$/, "");
        buffer = buffer.slice(newlineIndex + 1);
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (!jsonStr) continue;

        try {
          const parsed = JSON.parse(jsonStr);
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const chunk = JSON.stringify({ choices: [{ delta: { content: text } }] });
            controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
          }
        } catch {
          // linha parcial/malformada — mesma tolerância do parser do frontend
        }
      }
    },
    cancel() {
      reader.cancel();
    },
  });
}

interface RequestBody {
  action: "fill_all" | "fill_field" | "review";
  documentType: "dfd" | "etp" | "tr";
  context?: string; // User description for fill_all
  fieldName?: string; // For fill_field
  fieldLabel?: string; // Human-readable label
  currentValue?: string; // Current field value for review
  formData?: Record<string, string>; // Current form state for context
}

serve(async (req) => {
  const cors = corsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  try {
    // Esta função chama a API do Gemini (GEMINI_API_KEY, cobrada por uso) —
    // exige sessão autenticada válida para evitar uso anônimo/abusivo de
    // créditos. Qualquer usuário autenticado pode chamar (não é ação
    // admin-only, é usada nos formulários de CPSI/compras), mas nunca sem
    // sessão.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: caller }, error: callerError } = await supabaseUser.auth.getUser();
    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: "Sessão inválida" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY não configurada");
    const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";

    const body: RequestBody = await req.json();
    const { action, documentType, context, fieldName, fieldLabel, currentValue, formData } = body;

    let userPrompt = "";

    const docNames: Record<string, string> = {
      dfd: "Documento de Formalização de Demanda (DFD)",
      etp: "Estudo Técnico Preliminar (ETP)",
      tr: "Termo de Referência (TR)",
    };

    if (action === "fill_all") {
      const fieldsByType: Record<string, { name: string; label: string; description: string }[]> = {
        dfd: [
          { name: "areaRequisitante", label: "Área Requisitante", description: "Setor que demanda a contratação" },
          { name: "responsavel", label: "Responsável", description: "Nome do responsável pela demanda" },
          { name: "cargo", label: "Cargo/Função", description: "Cargo do responsável" },
          { name: "problemaIdentificado", label: "Problema Identificado", description: "Problema que motiva a busca por solução inovadora" },
          { name: "necessidade", label: "Necessidade da Contratação", description: "Por que soluções tradicionais não atendem" },
          { name: "alinhamentoEstrategico", label: "Alinhamento Estratégico", description: "Relação com PPA, LOA, metas institucionais" },
          { name: "resultadosEsperados", label: "Resultados Esperados", description: "Resultados mensuráveis esperados" },
          { name: "previsaoContratacao", label: "Previsão de Contratação", description: "Período previsto" },
        ],
        etp: [
          { name: "descricaoNecessidade", label: "Descrição da Necessidade", description: "Necessidade a ser atendida" },
          { name: "areaRequisitante", label: "Área Requisitante", description: "Setor demandante" },
          { name: "requisitosTecnicos", label: "Requisitos Técnicos", description: "Requisitos de arquitetura e tecnologia" },
          { name: "requisitosNegocio", label: "Requisitos de Negócio", description: "Funcionalidades e integrações necessárias" },
          { name: "estimativaValor", label: "Estimativa de Valor", description: "Valor estimado da contratação" },
          { name: "metodologiaEstimativa", label: "Metodologia de Estimativa", description: "Como o valor foi estimado" },
          { name: "justificativaContratacao", label: "Justificativa", description: "Por que contratar via CPSI" },
          { name: "descricaoSolucao", label: "Descrição da Solução", description: "Solução inovadora pretendida" },
          { name: "diferencialInovador", label: "Diferencial Inovador", description: "O que torna a solução inovadora" },
          { name: "ganhoEficiencia", label: "Ganho de Eficiência", description: "Benefícios concretos" },
          { name: "baseComparativa", label: "Base Comparativa", description: "Comparação com soluções tradicionais" },
          { name: "ambienteTeste", label: "Ambiente de Teste", description: "Onde a solução será testada" },
          { name: "criteriosAvaliacao", label: "Critérios de Avaliação", description: "KPIs e métricas de sucesso" },
          { name: "prazoTeste", label: "Prazo do Teste", description: "Duração da demonstração" },
          { name: "riscos", label: "Riscos Identificados", description: "Principais riscos" },
          { name: "mitigacao", label: "Medidas de Mitigação", description: "Ações para mitigar riscos" },
          { name: "viabilidadeTecnica", label: "Viabilidade Técnica", description: "Demonstração de viabilidade técnica" },
          { name: "viabilidadeOrcamentaria", label: "Viabilidade Orçamentária", description: "Fonte de recursos" },
        ],
        tr: [
          { name: "objeto", label: "Objeto", description: "Objeto da contratação" },
          { name: "justificativa", label: "Justificativa", description: "Interesse público e necessidade" },
          { name: "fundamentacaoLegal", label: "Fundamentação Legal", description: "Base legal da contratação" },
          { name: "descricaoDetalhada", label: "Descrição Detalhada", description: "Detalhamento da solução" },
          { name: "modulosSistema", label: "Módulos do Sistema", description: "Módulos e funcionalidades" },
          { name: "requisitosTecnicos", label: "Requisitos Técnicos", description: "Requisitos funcionais obrigatórios" },
          { name: "requisitosSeguranca", label: "Requisitos de Segurança", description: "LGPD, criptografia, auditoria" },
          { name: "requisitosDesempenho", label: "Requisitos de Desempenho", description: "SLA, uptime, escalabilidade" },
          { name: "metricas", label: "Métricas", description: "KPIs de avaliação" },
          { name: "criteriosAceite", label: "Critérios de Aceite", description: "Condições para aceite" },
          { name: "prazoExecucao", label: "Prazo de Execução", description: "Prazo total" },
          { name: "cronograma", label: "Cronograma", description: "Fases e marcos" },
          { name: "valorEstimado", label: "Valor Estimado", description: "Valor da contratação" },
          { name: "condicoesPagamento", label: "Condições de Pagamento", description: "Forma de pagamento" },
          { name: "obrigatoesContratada", label: "Obrigações da Contratada", description: "Obrigações do fornecedor" },
          { name: "obrigatoesContratante", label: "Obrigações da Contratante", description: "Obrigações do órgão" },
          { name: "sancoes", label: "Sanções", description: "Penalidades aplicáveis" },
        ],
      };

      const fields = fieldsByType[documentType] || [];
      const fieldsList = fields.map(f => `- "${f.name}": ${f.label} — ${f.description}`).join("\n");

      userPrompt = `O usuário descreveu a seguinte necessidade de contratação via CPSI:

"${context || "Sistema de governança digital integrado para órgão público estadual"}"

Gere o conteúdo completo para um ${docNames[documentType]} preenchendo TODOS os campos abaixo.
Retorne um JSON válido com as chaves exatas listadas. Cada valor deve ser um texto em português formal, adequado para documento oficial.

Campos:
${fieldsList}

IMPORTANTE: Retorne APENAS o JSON, sem markdown, sem explicações, sem código.`;

    } else if (action === "fill_field") {
      const existingContext = formData
        ? Object.entries(formData)
            .filter(([_, v]) => v && v.trim())
            .map(([k, v]) => `${k}: ${v}`)
            .join("\n")
        : "";

      userPrompt = `Estou preenchendo um ${docNames[documentType]} para contratação via CPSI.

${existingContext ? `Contexto dos campos já preenchidos:\n${existingContext}\n` : ""}
Gere o conteúdo para o campo "${fieldLabel || fieldName}" (${fieldName}).
${currentValue ? `O valor atual é: "${currentValue}". Melhore e expanda este texto.` : "Gere um texto inicial adequado."}

Retorne APENAS o texto do campo, sem aspas, sem explicações adicionais. Use linguagem formal adequada para documento oficial.`;

    } else if (action === "review") {
      const allFields = formData
        ? Object.entries(formData)
            .filter(([_, v]) => v && v.trim())
            .map(([k, v]) => `**${k}**: ${v}`)
            .join("\n\n")
        : "";

      userPrompt = `Revise o seguinte ${docNames[documentType]} para CPSI quanto a:
1. Conformidade legal (LC 182/2021, Lei 14.133/2021, IN SEGES/MP nº 5/2017)
2. Clareza e objetividade da redação
3. Completude dos campos (identifique campos vazios ou insuficientes)
4. Coerência entre as seções
5. Adequação da linguagem para documento oficial

Documento para revisão:
${allFields}

Forneça uma análise estruturada com:
- ✅ Pontos positivos
- ⚠️ Pontos de atenção
- ❌ Correções necessárias
- 💡 Sugestões de melhoria

Seja específico e cite artigos de lei quando pertinente.`;
    }

    const isStreaming = action === "review";
    const geminiEndpoint = isStreaming
      ? `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse`
      : `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

    const aiResponse = await fetch(geminiEndpoint, {
      method: "POST",
      headers: {
        "x-goog-api-key": GEMINI_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }), {
          status: 429,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error("Erro no serviço de IA");
    }

    // For review, traduz o stream nativo do Gemini (SSE com
    // candidates[0].content.parts[0].text) para o formato OpenAI-compatible
    // (choices[0].delta.content) que o frontend (useAICPSI.ts) já sabe ler —
    // evita mudar o parser do lado do cliente.
    if (isStreaming) {
      return new Response(translateGeminiStreamToOpenAI(aiResponse.body!), {
        headers: { ...cors, "Content-Type": "text/event-stream" },
      });
    }

    // For fill_all and fill_field, return the full response
    const data = await aiResponse.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (action === "fill_all") {
      // Parse JSON from content
      let parsed: Record<string, string>;
      try {
        // Try to extract JSON from potential markdown code blocks
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
        parsed = JSON.parse(jsonMatch[1]!.trim());
      } catch {
        console.error("Failed to parse AI JSON:", content);
        return new Response(JSON.stringify({ error: "Não foi possível processar a resposta da IA. Tente novamente." }), {
          status: 422,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ fields: parsed }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // fill_field
    return new Response(JSON.stringify({ content }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("cpsi-ai-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});

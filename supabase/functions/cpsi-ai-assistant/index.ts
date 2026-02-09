import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é um especialista em compras públicas e contratações inovadoras do Brasil.
Você conhece profundamente:
- LC 182/2021 (Marco Legal das Startups e Empreendedorismo Inovador)
- Lei 14.133/2021 (Nova Lei de Licitações)
- IN SEGES/MP nº 5/2017 (Planejamento da Contratação)
- CPSI (Contrato Público de Solução Inovadora), arts. 11 a 16 da LC 182/2021

Você escreve em português formal, com linguagem técnica adequada para documentos oficiais da administração pública brasileira.
Seja objetivo, preciso e fundamentado legalmente. Use parágrafos curtos e linguagem direta.
Quando apropriado, cite artigos de lei e normas. Não invente dados numéricos — use placeholders como "[VALOR]" ou "[PRAZO]" quando não tiver informação.`;

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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

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

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        stream: action === "review",
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA insuficientes." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error("Erro no serviço de IA");
    }

    // For review, stream the response
    if (action === "review") {
      return new Response(aiResponse.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // For fill_all and fill_field, return the full response
    const data = await aiResponse.json();
    const content = data.choices?.[0]?.message?.content || "";

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
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ fields: parsed }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // fill_field
    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("cpsi-ai-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

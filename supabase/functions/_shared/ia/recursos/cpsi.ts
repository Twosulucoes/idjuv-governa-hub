/**
 * Recurso "cpsi" do `ia-gateway`: assistente de IA dos formulários do CPSI (DFD, ETP e TR).
 *
 * Prompts, lista de campos, validação e parse de JSON vieram da antiga Edge Function
 * `cpsi-ai-assistant`, sem mudar o texto. As respostas continuam as mesmas que o front
 * (`src/hooks/useAICPSI.ts`) já lê: `{ fields }` no `fill_all`, `{ content }` no
 * `fill_field` e stream SSE no `review`.
 *
 * Este módulo não chama provedor nem banco: só monta o pedido e trata o texto devolvido.
 */

import type { PedidoIA } from "../provedores.ts";

/** Erro do recurso com status HTTP e mensagem mostrável (nunca inclui o texto do modelo). */
export class ErroRecurso extends Error {
  constructor(public status: number, mensagem: string, public codigo: string) {
    super(mensagem);
    this.name = "ErroRecurso";
  }
}

export const SYSTEM_PROMPT = `Você é um especialista em compras públicas e contratações inovadoras do Brasil.
Você conhece profundamente:
- LC 182/2021 (Marco Legal das Startups e Empreendedorismo Inovador)
- Lei 14.133/2021 (Nova Lei de Licitações)
- IN SEGES/MP nº 5/2017 (Planejamento da Contratação)
- CPSI (Contrato Público de Solução Inovadora), arts. 11 a 16 da LC 182/2021

Você escreve em português formal, com linguagem técnica adequada para documentos oficiais da administração pública brasileira.
Seja objetivo, preciso e fundamentado legalmente. Use parágrafos curtos e linguagem direta.
Quando apropriado, cite artigos de lei e normas. Não invente dados numéricos — use placeholders como "[VALOR]" ou "[PRAZO]" quando não tiver informação.`;

// Limites de tamanho do pedido e da resposta (o provedor é cobrado por token).
export const LIMITE_CAMPO = 10000; // caracteres por campo de texto (cabe o que a própria IA preenche)
export const LIMITE_TOTAL = 60000; // caracteres somando todos os campos do pedido
export const LIMITE_ENTRADAS = 60; // entradas em formData
export const LIMITE_TOKENS_RESPOSTA = 16384; // inclui o raciocínio do modelo, quando houver
const ACOES = ["fill_all", "fill_field", "review"];
const DOCUMENTOS = ["dfd", "etp", "tr"];

export interface CorpoCpsi {
  action: "fill_all" | "fill_field" | "review";
  documentType: "dfd" | "etp" | "tr";
  context?: string; // descrição da necessidade (fill_all)
  fieldName?: string; // campo a preencher (fill_field)
  fieldLabel?: string; // rótulo legível do campo
  currentValue?: string; // valor atual do campo
  formData?: Record<string, string>; // estado atual do formulário (contexto)
}

/** Mensagem de erro se o pedido passar dos limites de tamanho ou tiver ação/documento desconhecido. */
export function validarPedido(body: CorpoCpsi): string | null {
  if (!ACOES.includes(body?.action) || !DOCUMENTOS.includes(body?.documentType)) {
    return "Pedido inválido";
  }
  const textos: unknown[] = [body.context, body.fieldName, body.fieldLabel, body.currentValue];
  if (body.formData !== undefined) {
    if (typeof body.formData !== "object" || body.formData === null || Array.isArray(body.formData)) {
      return "Pedido inválido";
    }
    const entradas = Object.entries(body.formData);
    if (entradas.length > LIMITE_ENTRADAS) return "Pedido inválido";
    for (const [k, v] of entradas) textos.push(k, v);
  }
  let total = 0;
  for (const t of textos) {
    if (t === undefined || t === null) continue;
    if (typeof t !== "string") return "Pedido inválido";
    if (t.length > LIMITE_CAMPO) return `Cada campo pode ter no máximo ${LIMITE_CAMPO} caracteres.`;
    total += t.length;
  }
  if (total > LIMITE_TOTAL) return `O documento passa de ${LIMITE_TOTAL} caracteres; revise por partes.`;
  return null;
}

const docNames: Record<string, string> = {
  dfd: "Documento de Formalização de Demanda (DFD)",
  etp: "Estudo Técnico Preliminar (ETP)",
  tr: "Termo de Referência (TR)",
};

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

/** Monta o prompt do usuário (texto idêntico ao da antiga `cpsi-ai-assistant`). */
function montarPrompt(body: CorpoCpsi): string {
  const { action, documentType, context, fieldName, fieldLabel, currentValue, formData } = body;

  if (action === "fill_all") {
    const fields = fieldsByType[documentType] || [];
    const fieldsList = fields.map((f) => `- "${f.name}": ${f.label} — ${f.description}`).join("\n");

    return `O usuário descreveu a seguinte necessidade de contratação via CPSI:

"${context || "Sistema de governança digital integrado para órgão público estadual"}"

Gere o conteúdo completo para um ${docNames[documentType]} preenchendo TODOS os campos abaixo.
Retorne um JSON válido com as chaves exatas listadas. Cada valor deve ser um texto em português formal, adequado para documento oficial.

Campos:
${fieldsList}

IMPORTANTE: Retorne APENAS o JSON, sem markdown, sem explicações, sem código.`;
  }

  if (action === "fill_field") {
    const existingContext = formData
      ? Object.entries(formData)
        .filter(([_, v]) => v && v.trim())
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n")
      : "";

    return `Estou preenchendo um ${docNames[documentType]} para contratação via CPSI.

${existingContext ? `Contexto dos campos já preenchidos:\n${existingContext}\n` : ""}
Gere o conteúdo para o campo "${fieldLabel || fieldName}" (${fieldName}).
${currentValue ? `O valor atual é: "${currentValue}". Melhore e expanda este texto.` : "Gere um texto inicial adequado."}

Retorne APENAS o texto do campo, sem aspas, sem explicações adicionais. Use linguagem formal adequada para documento oficial.`;
  }

  // review
  const allFields = formData
    ? Object.entries(formData)
      .filter(([_, v]) => v && v.trim())
      .map(([k, v]) => `**${k}**: ${v}`)
      .join("\n\n")
    : "";

  return `Revise o seguinte ${docNames[documentType]} para CPSI quanto a:
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

/** Mensagem do 422 quando a resposta passa do tamanho máximo (usada pelo gateway). */
export const MENSAGEM_CORTADO =
  "A resposta da IA passou do tamanho máximo. Preencha por campos ou resuma a descrição.";

/** Extrai o JSON do `fill_all` (aceita bloco de código markdown). Lança `ErroRecurso` 422. */
export function extrairCampos(content: string): Record<string, string> {
  try {
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
    return JSON.parse(jsonMatch[1]!.trim());
  } catch {
    // O texto do modelo nunca vai para log nem para a resposta.
    throw new ErroRecurso(
      422,
      "Não foi possível processar a resposta da IA. Tente novamente.",
      "resposta_invalida",
    );
  }
}

export type PreparoCpsi =
  | { erro: string }
  | { pedido: PedidoIA; stream: boolean; tratar: (texto: string) => unknown };

/**
 * Valida o corpo e monta o pedido ao provedor.
 * - `stream` é true só no `review` (o gateway devolve o SSE do provedor traduzido);
 * - `tratar` converte o texto completo no corpo da resposta (`{ fields }` ou `{ content }`)
 *   e lança `ErroRecurso` se o JSON do `fill_all` vier inválido.
 */
export function prepararCpsi(body: unknown): PreparoCpsi {
  const corpo = body as CorpoCpsi;
  const invalido = validarPedido(corpo);
  if (invalido) return { erro: invalido };

  const pedido: PedidoIA = {
    sistema: SYSTEM_PROMPT,
    prompt: montarPrompt(corpo),
    maxTokens: LIMITE_TOKENS_RESPOSTA,
  };
  const tratar = corpo.action === "fill_all"
    ? (texto: string) => ({ fields: extrairCampos(texto) })
    : (texto: string) => ({ content: texto });

  return { pedido, stream: corpo.action === "review", tratar };
}

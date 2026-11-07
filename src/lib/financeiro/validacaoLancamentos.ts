/**
 * Validação dos lançamentos de contingência (empenho, liquidação e pagamento feitos fora do FIPLAN).
 *
 * Mesmo padrão dos outros formulários do Financeiro (emenda, favorecido, conta): ao enviar, cada campo com
 * problema ganha a sua mensagem, em vez do aviso genérico do navegador. As regras ficam aqui, puras, para os
 * três diálogos usarem a mesma conta e para o teste conferir as mensagens.
 */

import { z } from "zod";

/** Mensagem por campo; vazio = tudo certo. */
export type ErrosFormulario<C extends string> = Partial<Record<C, string>>;

const escolha = (mensagem: string) => z.string().min(1, mensagem);

/** Valor em reais digitado no campo numérico (texto); `minimo` inclusivo. */
const dinheiro = (rotulo: string, minimo: number) =>
  z.string().refine((v) => v.trim() !== "" && Number.isFinite(Number(v)) && Number(v) >= minimo, {
    message: minimo > 0 ? `Informe o ${rotulo} (maior que zero)` : `${rotulo} inválido`,
  });

/** Campo de valor que pode ficar vazio (retenções). */
const dinheiroOpcional = (rotulo: string) =>
  z.string().refine((v) => v.trim() === "" || (Number.isFinite(Number(v)) && Number(v) >= 0), {
    message: `${rotulo} não pode ser negativo`,
  });

function errosDe<C extends string>(resultado: z.SafeParseReturnType<unknown, unknown>): ErrosFormulario<C> {
  if (resultado.success) return {};
  const erros: ErrosFormulario<C> = {};
  for (const issue of resultado.error.issues) {
    const campo = issue.path[0] as C | undefined;
    if (campo && !erros[campo]) erros[campo] = issue.message;
  }
  return erros;
}

// ── Empenho ─────────────────────────────────────────────────────────────────

const schemaEmpenho = z.object({
  dotacao_id: escolha("Escolha a dotação"),
  fornecedor_id: escolha("Escolha o fornecedor ou credor"),
  valor_empenhado: dinheiro("valor empenhado", 0.01),
  objeto: z.string().trim().min(3, "Descreva o objeto (mínimo de 3 caracteres)"),
});

export type CampoEmpenho = keyof z.infer<typeof schemaEmpenho>;

/** `saldoDotacao`: saldo da dotação escolhida, para recusar valor acima dele. */
export function validarEmpenho(
  form: Record<CampoEmpenho, string>,
  saldoDotacao?: number | null,
): ErrosFormulario<CampoEmpenho> {
  const erros = errosDe<CampoEmpenho>(schemaEmpenho.safeParse(form));
  if (!erros.valor_empenhado && saldoDotacao != null && Number(form.valor_empenhado) > saldoDotacao) {
    erros.valor_empenhado = "Valor acima do saldo disponível da dotação";
  }
  return erros;
}

// ── Liquidação ──────────────────────────────────────────────────────────────

const schemaLiquidacao = z.object({
  empenho_id: escolha("Escolha o empenho"),
  numero_documento: z.string().trim().min(1, "Informe o número do documento"),
  data_documento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data do documento"),
  valor_documento: dinheiro("valor do documento", 0.01),
  valor_liquidado: dinheiro("valor a liquidar", 0.01),
  retencao_inss: dinheiroOpcional("INSS"),
  retencao_irrf: dinheiroOpcional("IRRF"),
  retencao_iss: dinheiroOpcional("ISS"),
  outras_retencoes: dinheiroOpcional("Outras retenções"),
});

export type CampoLiquidacao = keyof z.infer<typeof schemaLiquidacao>;

/** `saldoLiquidar`: saldo a liquidar do empenho escolhido. */
export function validarLiquidacao(
  form: Record<CampoLiquidacao, string>,
  saldoLiquidar?: number | null,
): ErrosFormulario<CampoLiquidacao> {
  const erros = errosDe<CampoLiquidacao>(schemaLiquidacao.safeParse(form));
  if (!erros.valor_liquidado && saldoLiquidar != null && Number(form.valor_liquidado) > saldoLiquidar) {
    erros.valor_liquidado = "Valor acima do saldo a liquidar do empenho";
  }
  return erros;
}

// ── Pagamento ───────────────────────────────────────────────────────────────

const schemaPagamento = z.object({
  liquidacao_id: escolha("Escolha a liquidação aprovada"),
  conta_bancaria_id: escolha("Escolha a conta de saída"),
  valor_bruto: dinheiro("valor bruto", 0.01),
  valor_retencoes: dinheiroOpcional("Retenções"),
});

export type CampoPagamento = keyof z.infer<typeof schemaPagamento>;

export function validarPagamento(form: Record<CampoPagamento, string>): ErrosFormulario<CampoPagamento> {
  const erros = errosDe<CampoPagamento>(schemaPagamento.safeParse(form));
  if (!erros.valor_bruto && !erros.valor_retencoes && (Number(form.valor_retencoes) || 0) > Number(form.valor_bruto)) {
    erros.valor_retencoes = "Retenções maiores que o valor bruto";
  }
  return erros;
}

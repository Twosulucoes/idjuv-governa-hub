/**
 * Regras puras das faturas da agência de passagens: conferência da nota com os bilhetes, bilhetes a faturar, saldo
 * do contrato (emitido, faturado, pago) e empenho do exercício × emitido. O banco (migração 20261103090000) também
 * exige atesto, liquidação, OB e motivo; aqui ficam as mensagens para a tela.
 * Plano: docs/superpowers/plans/2026-10-25-contratos-passagens-entrega3.md
 */

import { valorTrecho } from "@/lib/passagens/regras";
import type { PassagemTrecho } from "@/types/passagens";

type Valor = number | string | null | undefined;
type TrechoValores = Pick<PassagemTrecho, "situacao" | "localizador" | "valor_emissao" | "valor_multa" | "valor_reembolso">;
type BilheteValores = TrechoValores & { data_emissao: string | null };

const num = (v: Valor) => Number(v ?? 0) || 0;
const centavos = (v: number) => Math.round(v * 100) / 100;

/** Dias de atraso a partir dos quais o bilhete sem nota ganha destaque. */
export const PRAZO_FATURAR_DIAS = 30;

export function conferirFatura(valorNota: Valor, itens: { valor: Valor }[]) {
  const soma = centavos(itens.reduce((s, i) => s + num(i.valor), 0));
  const diferenca = centavos(num(valorNota) - soma);
  return { soma, diferenca, confere: diferenca === 0 };
}

const diasEntre = (de: string, ate: string) =>
  Math.round((Date.parse(`${ate}T00:00:00Z`) - Date.parse(`${de}T00:00:00Z`)) / 86_400_000);

/** Bilhetes emitidos (com valor) que ainda não estão em nota; `hoje` em AAAA-MM-DD. */
export function aFaturar<T extends BilheteValores & { id: string }>(
  trechos: T[],
  faturados: ReadonlySet<string>,
  hoje: string,
  prazoDias = PRAZO_FATURAR_DIAS,
) {
  return trechos
    .filter((t) => t.localizador && !faturados.has(t.id) && valorTrecho(t) > 0)
    .map((t) => {
      const dias = t.data_emissao ? Math.max(0, diasEntre(t.data_emissao, hoje)) : 0;
      return { trecho: t, valor: valorTrecho(t), dias, atrasado: dias > prazoDias };
    })
    .sort((a, b) => b.dias - a.dias);
}

/**
 * Saldo do contrato. emitido = bilhetes (entrega 1); faturado e pago = valor das notas não canceladas e das pagas;
 * a faturar = bilhetes sem nota; comprometido = faturado + a faturar; saldo = valor − comprometido.
 */
export function saldoContratoCompleto(
  valorContrato: Valor,
  bilhetes: (TrechoValores & { id: string })[],
  faturas: { situacao: string; valor: Valor; itens: { trecho_id: string }[] }[],
) {
  const validas = faturas.filter((f) => f.situacao !== "cancelada");
  const faturados = new Set(validas.flatMap((f) => f.itens.map((i) => i.trecho_id)));
  const emitido = centavos(bilhetes.reduce((s, t) => s + valorTrecho(t), 0));
  const faturado = centavos(validas.reduce((s, f) => s + num(f.valor), 0));
  const pago = centavos(validas.filter((f) => f.situacao === "paga").reduce((s, f) => s + num(f.valor), 0));
  const semNota = centavos(bilhetes.filter((t) => !faturados.has(t.id)).reduce((s, t) => s + valorTrecho(t), 0));
  const valor = num(valorContrato);
  const comprometido = centavos(faturado + semNota);
  return { valor, emitido, faturado, pago, aFaturar: semNota, comprometido, saldo: centavos(valor - comprometido) };
}

export interface EmpenhoTotais {
  exercicio: number;
  valor_empenhado: Valor;
  valor_anulado: Valor;
  valor_liquidado: Valor;
  valor_pago: Valor;
}

/** Por exercício (mais novo primeiro): empenhado − anulado × bilhetes emitidos no ano (data de emissão). */
export function saldoEmpenhoPorExercicio(empenhos: EmpenhoTotais[], bilhetes: BilheteValores[]) {
  const anos = new Map<number, { empenhado: number; liquidado: number; pago: number; emitido: number }>();
  const ano = (a: number) => {
    if (!anos.has(a)) anos.set(a, { empenhado: 0, liquidado: 0, pago: 0, emitido: 0 });
    return anos.get(a)!;
  };
  for (const e of empenhos) {
    const l = ano(e.exercicio);
    l.empenhado += num(e.valor_empenhado) - num(e.valor_anulado);
    l.liquidado += num(e.valor_liquidado);
    l.pago += num(e.valor_pago);
  }
  for (const t of bilhetes) {
    if (!t.data_emissao) continue;
    ano(Number(t.data_emissao.slice(0, 4))).emitido += valorTrecho(t);
  }
  return [...anos.entries()]
    .sort(([a], [b]) => b - a)
    .map(([exercicio, l]) => ({
      exercicio,
      empenhado: centavos(l.empenhado),
      liquidado: centavos(l.liquidado),
      pago: centavos(l.pago),
      emitido: centavos(l.emitido),
      disponivel: centavos(l.empenhado - l.emitido),
    }));
}

export type SituacaoFatura = "recebida" | "atestada" | "liquidada" | "paga" | "cancelada";

const FLUXO: Record<SituacaoFatura, SituacaoFatura[]> = {
  recebida: ["atestada", "cancelada"],
  atestada: ["liquidada", "recebida", "cancelada"],
  liquidada: ["paga", "atestada", "cancelada"],
  paga: ["liquidada"],
  cancelada: [],
};

export function proximasSituacoesFatura(atual: string): SituacaoFatura[] {
  return FLUXO[atual as SituacaoFatura] ?? [];
}

type DadosSituacao = {
  atesto_data: string | null;
  atesto_documento_sei: string | null;
  liquidacao_data: string | null;
  pagamento_data: string | null;
  ob_numero: string | null;
  cancelamento_motivo: string | null;
};

const preenchido = (v: string | null) => !!v && v.trim().length > 0;

/** O que falta para a fatura ir para `nova` (mesmas regras dos CHECKs de passagem_faturas). */
export function pendenciasSituacaoFatura(nova: SituacaoFatura, d: DadosSituacao): string[] {
  const falta: string[] = [];
  if (["atestada", "liquidada", "paga"].includes(nova) && !(d.atesto_data && preenchido(d.atesto_documento_sei))) {
    falta.push("Informe a data e o nº do documento SEI do atesto.");
  }
  if (["liquidada", "paga"].includes(nova) && !d.liquidacao_data) falta.push("Informe a data da liquidação.");
  if (nova === "paga" && !(d.pagamento_data && preenchido(d.ob_numero))) falta.push("Informe a data do pagamento e o nº da OB.");
  if (nova === "cancelada" && (d.cancelamento_motivo ?? "").trim().length < 3) falta.push("Escreva o motivo do cancelamento.");
  return falta;
}

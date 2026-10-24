/**
 * Regras puras das passagens aéreas: quanto cada trecho custa ao contrato, resumo do pedido, saldo do contrato e
 * o que falta para mudar a situação do pedido. Spec: docs/superpowers/specs/2026-10-24-contratos-passagens-aereas-design.md
 */

import type { PassagemTrecho, SituacaoPedido } from "@/types/passagens";

type TrechoValores = Pick<PassagemTrecho, "situacao" | "localizador" | "valor_emissao" | "valor_multa" | "valor_reembolso">;
type ComTrechos = { trechos: TrechoValores[] };

const num = (v: number | string | null | undefined) => Number(v ?? 0) || 0;
const centavos = (v: number) => Math.round(v * 100) / 100;

/**
 * Quanto o trecho pesa no contrato. Sem localizador (nunca emitido) = 0. Emitido, depois de qualquer mudança
 * (remarcado, cancelado ou reembolsado), = emissão + multa − reembolso: a agência cobra o bilhete até devolver.
 */
export function valorTrecho(t: TrechoValores): number {
  if (!t.localizador) return 0;
  return Math.max(0, centavos(num(t.valor_emissao) + num(t.valor_multa) - num(t.valor_reembolso)));
}

const ABERTOS = new Set(["a_cotar", "cotado"]);

export function resumoPedido(passageiros: ComTrechos[]) {
  const trechos = passageiros.flatMap((p) => p.trechos);
  return {
    passageiros: passageiros.length,
    trechos: trechos.length,
    emitidos: trechos.filter((t) => !!t.localizador).length,
    pendentes: trechos.filter((t) => ABERTOS.has(t.situacao)).length,
    valor: centavos(trechos.reduce((s, t) => s + valorTrecho(t), 0)),
  };
}

/** Saldo do contrato a partir dos bilhetes emitidos (faturado e pago entram na entrega 3). */
export function saldoContrato(valorContrato: number | string, pedidos: { passageiros: ComTrechos[] }[]) {
  const emitido = centavos(pedidos.reduce((s, p) => s + resumoPedido(p.passageiros).valor, 0));
  const valor = num(valorContrato);
  return { valor, emitido, saldo: centavos(valor - emitido) };
}

const FLUXO: Record<SituacaoPedido, SituacaoPedido[]> = {
  recebido: ["cotacao_solicitada", "cancelado"],
  cotacao_solicitada: ["cotacao_recebida", "cancelado"],
  cotacao_recebida: ["aprovado", "cotacao_solicitada", "cancelado"],
  aprovado: ["emitido", "cancelado"],
  emitido: ["concluido", "cancelado"],
  concluido: [],
  cancelado: [],
};

export function proximasSituacoes(atual: string): SituacaoPedido[] {
  return FLUXO[atual as SituacaoPedido] ?? [];
}

/** O que falta para o pedido ir para `nova` (lista vazia = pode ir). */
export function pendenciasParaSituacao(
  nova: SituacaoPedido,
  pedido: { aprovacao_documento_sei: string | null; aprovacao_data: string | null },
  passageiros: ComTrechos[],
): string[] {
  const trechos = passageiros.flatMap((p) => p.trechos);
  if (nova === "aprovado" && (!pedido.aprovacao_documento_sei || !pedido.aprovacao_data)) {
    return ["Informe o nº do documento SEI e a data da aprovação do Presidente."];
  }
  if (nova === "emitido" && !trechos.some((t) => t.localizador)) {
    return ["Registre a emissão de ao menos um trecho."];
  }
  if (nova === "concluido") {
    const abertos = trechos.filter((t) => ABERTOS.has(t.situacao)).length;
    if (abertos) {
      return [`${abertos} ${abertos === 1 ? "trecho ainda está" : "trechos ainda estão"} a cotar ou cotado: emita ou cancele antes de concluir.`];
    }
  }
  return [];
}

export const somenteDigitos = (v: string) => v.replace(/\D/g, "");

/** CPF na lista: só os 6 dígitos do meio (LGPD). */
export function mascararCpf(cpf: string | null | undefined): string {
  const d = somenteDigitos(cpf ?? "");
  return d.length === 11 ? `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**` : "—";
}

/** timestamptz → valor de `<input type="datetime-local">` no fuso do navegador ("" se vazio). */
export function paraDataHoraLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Valor do `datetime-local` → ISO (null se vazio). */
export function deDataHoraLocal(v: string | null | undefined): string | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function formatarDataHora(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

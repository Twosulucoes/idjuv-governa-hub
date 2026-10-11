/**
 * Rótulos e formatação dos movimentos bancários, compartilhados pela conciliação e pelo detalhe do pagamento.
 */

import {
  mascararDocumento,
  ROTULO_TIPO_LANCAMENTO,
  type SituacaoMovimentoBancario,
  type TipoLancamentoBancario,
} from "./comum";

export const documentoMascarado = mascararDocumento;

export const ROTULO_SITUACAO_MOVIMENTO: Record<SituacaoMovimentoBancario, string> = {
  enviado: "Enviado",
  pago: "Pago",
  recusado: "Recusado",
};

export const rotuloTipoLancamento = (t: string) => ROTULO_TIPO_LANCAMENTO[t as TipoLancamentoBancario] ?? t;

export const ROTULO_ORIGEM_ARQUIVO: Record<string, string> = { obn600: "OBN600", cnab240: "CNAB 240" };

export const dataBR = (iso: string | null | undefined) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "—");

export function contaFavorecido(m: { banco: string | null; agencia: string | null; conta: string | null }): string {
  if (!m.banco && !m.agencia && !m.conta) return "—";
  return [m.banco, m.agencia, m.conta].filter(Boolean).join(" / ");
}

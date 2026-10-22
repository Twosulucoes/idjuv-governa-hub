/**
 * Leitor do extrato OFX do Banco do Brasil (conta corrente), para a conciliação mensal.
 *
 * O BB exporta OFX 1.02 em SGML (tags sem fechamento) e Windows-1252. Do `CHECKNUM` saem as referências ao FIPLAN:
 * - "EMISSÃO ORDEM BANCÁRIA": `4` + ano (2) + nº da RE com DV (9 dígitos). Ex.: 426000151 = RE 26.00015-1.
 * - "ORDEM BANC CANCELADA": `4` + ano + nº da NOB com DV + 4 dígitos (em geral `0000`; já veio
 *   `0001`), 13 dígitos no total. Ex.: 4260008860000 = NOB 26.00088-6; 4260000710001 = NOB 26.00007-1.
 * Aplicação e resgate automáticos (ida e volta entre a conta e o fundo) vêm marcados em `interno`; somados
 * (`movimentoDoFundo`), dão o movimento do fundo no mês.
 */

import { centavosDeTextoPonto } from "./tipos";

export interface LancamentoOfx {
  data: string;
  valorCentavos: number;
  /** FITID do banco: único por lançamento. */
  fitid: string;
  checknum: string;
  memo: string;
  /** "26.00015-1" quando o débito é a emissão de uma RE. */
  re?: string;
  /** "26.00088-6" quando o crédito é uma OB cancelada. */
  nob?: string;
  /** Aplicação ou resgate automático do fundo. */
  interno: boolean;
}

export interface ExtratoOfx {
  banco: string;
  conta: string;
  inicio: string | null;
  fim: string | null;
  lancamentos: LancamentoOfx[];
}

const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();

const dataOfx = (s: string | undefined): string | null => {
  const m = /^(\d{4})(\d{2})(\d{2})/.exec((s ?? "").trim());
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
};

/** Valor da tag SGML/XML (`<TAG>valor`, com ou sem `</TAG>`). */
const tag = (bloco: string, nome: string) => {
  const m = new RegExp(`<${nome}>([^<\\r\\n]*)`, "i").exec(bloco);
  return m ? m[1].trim() : undefined;
};

/** Número do FIPLAN no formato "AA.NNNNN-D". */
const numeroFiplan = (ano: string, seq: string, dv: string) => `${ano}.${seq}-${dv}`;

export function referenciaDoChecknum(checknum: string, memo: string): Pick<LancamentoOfx, "re" | "nob"> {
  const m = semAcento(memo);
  const d = checknum.replace(/\D/g, "");
  if (m.startsWith("EMISSAO ORDEM BANCARIA") && /^4\d{8}$/.test(d)) {
    return { re: numeroFiplan(d.slice(1, 3), d.slice(3, 8), d.slice(8, 9)) };
  }
  if (m.startsWith("ORDEM BANC CANCELADA") && /^4\d{12}$/.test(d)) {
    return { nob: numeroFiplan(d.slice(1, 3), d.slice(3, 8), d.slice(8, 9)) };
  }
  return {};
}

/** O que entrou e saiu do fundo no extrato (positivos). */
export interface MovimentoFundo {
  /** "BB-APLIC": débito na conta, entrada no fundo. */
  aplicacoesCentavos: number;
  /** "Resgate automático": crédito na conta, saída do fundo. */
  resgatesCentavos: number;
}

/** Aplicações e resgates automáticos do extrato: com o saldo anterior e o rendimento, dão o saldo do fundo. */
export function movimentoDoFundo(extrato: ExtratoOfx): MovimentoFundo {
  let aplicacoesCentavos = 0;
  let resgatesCentavos = 0;
  for (const l of extrato.lancamentos) {
    if (!l.interno) continue;
    if (l.valorCentavos < 0) aplicacoesCentavos -= l.valorCentavos;
    else resgatesCentavos += l.valorCentavos;
  }
  return { aplicacoesCentavos, resgatesCentavos };
}

export function ehMovimentoInterno(memo: string): boolean {
  const m = semAcento(memo);
  return m.startsWith("BB-APLIC") || m.startsWith("RESGATE AUTOMATICO");
}

export function lerExtratoOfx(texto: string): ExtratoOfx {
  if (!/<OFX>/i.test(texto)) throw new Error("O arquivo não é um extrato OFX.");
  const conta = tag(texto, "ACCTID") ?? "";
  const banco = tag(texto, "BANKID") ?? "";
  const lancamentos: LancamentoOfx[] = [];
  const blocos = texto.split(/<STMTTRN>/i).slice(1);
  for (const bruto of blocos) {
    const bloco = bruto.split(/<\/STMTTRN>/i)[0];
    const data = dataOfx(tag(bloco, "DTPOSTED"));
    const valor = centavosDeTextoPonto(tag(bloco, "TRNAMT") ?? "");
    if (!data || valor === null) throw new Error("Lançamento do OFX sem data ou valor.");
    const memo = (tag(bloco, "MEMO") ?? "").replace(/\s+/g, " ").trim();
    const checknum = tag(bloco, "CHECKNUM") ?? "";
    lancamentos.push({
      data,
      valorCentavos: valor,
      fitid: tag(bloco, "FITID") ?? "",
      checknum,
      memo,
      interno: ehMovimentoInterno(memo),
      ...referenciaDoChecknum(checknum, memo),
    });
  }
  return {
    banco,
    conta,
    inicio: dataOfx(tag(texto, "DTSTART")),
    fim: dataOfx(tag(texto, "DTEND")),
    lancamentos,
  };
}

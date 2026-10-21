/**
 * Leitores dos relatórios do FIPLAN usados na conciliação mensal, a partir das linhas posicionadas do PDF
 * (`lerLinhasPdf`):
 * - FIP630 (Razão Analítico por Conta/Conta Corrente): lançamentos do mês e o saldo do razão ("Total Geral
 *   Unidade Orçamentária");
 * - FIP103 (Relação de Pagamentos BB por RE): a RE de cada NOB. O nome do credor não é lido.
 *
 * Débito e crédito são separados pela coluna: o número que termina antes do início do cabeçalho "CRÉDITO" é
 * débito; antes de "SALDO", crédito; depois, saldo.
 */

import type { LinhaPdf, TrechoPdf } from "@/lib/importacao/pdfTexto";
import { centavosDeTextoBR, type NaturezaConciliacao } from "./tipos";

const NUMERO_FIPLAN = /^\d{5}\.\d{4}\.\d{2}\.\d{5}-\d$/;
const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();

/** "17302.0001.26.00015-1" → "26.00015-1" (como o extrato do banco cita a RE e a NOB). */
export const numeroCurto = (numero: string) => numero.slice(-10);

export interface LancamentoRazao {
  data: string;
  documento: string;
  gru: string;
  tipo: string;
  historico: string;
  natureza: NaturezaConciliacao;
  valorCentavos: number;
  ug: string;
  contaContabil: string;
}

export interface RazaoFip630 {
  exercicio: number;
  saldoRazaoCentavos: number;
  lancamentos: LancamentoRazao[];
}

interface Colunas {
  credito: number;
  saldo: number;
}

const textoDaLinha = (l: LinhaPdf) => l.trechos.map((t) => t.texto).join(" ");

/** Saldo com o "D"/"C" que vem depois: D positivo (ativo), C negativo. */
function saldoAssinado(trechos: TrechoPdf[]): number | null {
  for (let i = trechos.length - 1; i >= 0; i--) {
    const v = centavosDeTextoBR(trechos[i].texto);
    if (v === null) continue;
    const dc = trechos[i + 1]?.texto.trim().toUpperCase();
    return dc === "C" ? -v : v;
  }
  return null;
}

export function lerRazaoFip630(linhas: LinhaPdf[]): RazaoFip630 {
  const todo = linhas.map(textoDaLinha).join("\n");
  if (!/FIP630/.test(todo)) throw new Error("O PDF não é o FIP630 (Razão Analítico por Conta/Conta Corrente).");
  const mEx = /Exerc[ií]cio igual a (\d{4})/i.exec(todo);
  if (!mEx) throw new Error("FIP630 sem o exercício nos critérios.");
  const exercicio = Number(mEx[1]);

  let colunas: Colunas | null = null;
  let ug = "";
  let contaContabil = "";
  let saldoRazao: number | null = null;
  const lancamentos: LancamentoRazao[] = [];
  let ultimo: LancamentoRazao | null = null;

  for (const linha of linhas) {
    const t = linha.trechos;
    const texto = textoDaLinha(linha);
    const cab = semAcento(texto);
    if (cab.includes("DEBITO") && cab.includes("CREDITO") && cab.includes("SALDO")) {
      const x = (rotulo: string) => t.find((tr) => semAcento(tr.texto) === rotulo)?.x;
      const credito = x("CREDITO");
      const saldo = x("SALDO");
      if (credito !== undefined && saldo !== undefined) colunas = { credito, saldo };
      ultimo = null;
      continue;
    }
    const mUg = /^UG (\d{4})/.exec(texto);
    if (mUg) {
      ug = mUg[1];
      ultimo = null;
      continue;
    }
    const mConta = /^CONTA (\d(\.\d{1,2}){6,})/.exec(texto);
    if (mConta) {
      contaContabil = mConta[1];
      ultimo = null;
      continue;
    }
    if (/^Total Geral Unidade Or[cç]ament[aá]ria/i.test(texto)) {
      saldoRazao = saldoAssinado(t);
      ultimo = null;
      continue;
    }
    if (/^\d{2}\/\d{2}$/.test(t[0]?.texto ?? "") && NUMERO_FIPLAN.test(t[1]?.texto ?? "")) {
      if (!colunas) throw new Error("FIP630 sem o cabeçalho das colunas antes dos lançamentos.");
      const [dia, mes] = t[0].texto.split("/");
      let debito = 0;
      let credito = 0;
      const historico: string[] = [];
      for (const tr of t.slice(4)) {
        const v = centavosDeTextoBR(tr.texto);
        if (v === null) {
          if (!/^[DC]$/.test(tr.texto.trim())) historico.push(tr.texto);
          continue;
        }
        if (tr.xFim < colunas.credito) debito = v;
        else if (tr.xFim < colunas.saldo) credito = v;
      }
      if ((debito > 0) === (credito > 0)) {
        throw new Error(`FIP630: lançamento ${t[1].texto} de ${t[0].texto} sem débito nem crédito (ou com os dois).`);
      }
      ultimo = {
        data: `${exercicio}-${mes}-${dia}`,
        documento: t[1].texto,
        gru: t[2]?.texto ?? "",
        tipo: t[3]?.texto ?? "",
        historico: historico.join(" "),
        natureza: debito > 0 ? "debito" : "credito",
        valorCentavos: debito > 0 ? debito : credito,
        ug,
        contaContabil,
      };
      lancamentos.push(ultimo);
      continue;
    }
    // Rodapé da página (data/hora da emissão, usuário, "Página: N de M"): não é histórico
    if (/P[aá]gina:\s*\d+/i.test(texto)) {
      ultimo = null;
      continue;
    }
    // Continuação do histórico do lançamento anterior (linha só com texto, sem data)
    if (ultimo && !/^(Total|Usu[aá]rio|COORDENADORIA|FIP630|\*|DATA|B\+A)/i.test(texto) && t.every((tr) => centavosDeTextoBR(tr.texto) === null)) {
      ultimo.historico = `${ultimo.historico} ${texto}`.trim();
      continue;
    }
    ultimo = null;
  }
  if (saldoRazao === null) throw new Error("FIP630 sem o \"Total Geral Unidade Orçamentária\" (saldo do razão).");
  return { exercicio, saldoRazaoCentavos: saldoRazao, lancamentos };
}

export interface NobFip103 {
  nob: string;
  re: string;
  valorCentavos: number;
}

export interface RelacaoFip103 {
  nobs: NobFip103[];
  /** Subtotal impresso de cada RE (número completo). */
  totaisRe: Map<string, number>;
}

export function lerRelacaoFip103(linhas: LinhaPdf[]): RelacaoFip103 {
  const todo = linhas.map(textoDaLinha).join("\n");
  if (!/FIP103/.test(todo)) throw new Error("O PDF não é o FIP103 (Relação de Pagamentos BB por RE).");
  const nobs: NobFip103[] = [];
  const totaisRe = new Map<string, number>();
  let re = "";
  for (const linha of linhas) {
    const t = linha.trechos;
    const texto = textoDaLinha(linha);
    const mRe = /^RE: (\d{5}\.\d{4}\.\d{2}\.\d{5}-\d)/.exec(texto);
    if (mRe) {
      re = mRe[1];
      continue;
    }
    const mSub = /^SUB TOTAL RE: (\d{5}\.\d{4}\.\d{2}\.\d{5}-\d) /.exec(texto);
    if (mSub) {
      const v = centavosDeTextoBR(t[t.length - 1].texto);
      if (v !== null) totaisRe.set(mSub[1], v);
      continue;
    }
    if (NUMERO_FIPLAN.test(t[0]?.texto ?? "")) {
      const v = centavosDeTextoBR(t[t.length - 1].texto);
      if (!re || v === null) throw new Error(`FIP103: NOB ${t[0].texto} fora de uma RE ou sem valor.`);
      nobs.push({ nob: t[0].texto, re, valorCentavos: v });
    }
  }
  for (const [numero, total] of totaisRe) {
    const soma = nobs.filter((n) => n.re === numero).reduce((s, n) => s + n.valorCentavos, 0);
    if (soma !== total) throw new Error(`FIP103: as NOBs da RE ${numero} não somam o subtotal impresso.`);
  }
  return { nobs, totaisRe };
}

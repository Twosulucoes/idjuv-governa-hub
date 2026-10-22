/**
 * Leitor do extrato mensal de fundo de investimento do BB ("Consultas - Investimentos Fundos - Mensal", PDF), para a
 * conciliação mensal: do "Resumo do mês" de cada fundo saem saldo anterior, aplicações, resgates, rendimento e saldo
 * atual. O rendimento que entra no quadro é o líquido (bruto − IR − IOF), que é o que muda o saldo do fundo.
 */

import type { LinhaPdf } from "@/lib/importacao/pdfTexto";
import { centavosDeTextoBR } from "./tipos";

export interface ResumoFundo {
  fundo: string;
  saldoAnteriorCentavos: number;
  aplicacoesCentavos: number;
  resgatesCentavos: number;
  rendimentoLiquidoCentavos: number;
  saldoAtualCentavos: number;
}

export interface ExtratoFundoBB {
  agencia: string;
  /** Conta com DV, como o BB imprime ("10050-1"). */
  conta: string;
  /** "2026-07". */
  mes: string;
  /** Um por fundo do extrato; os totais somam todos. */
  fundos: ResumoFundo[];
  total: Omit<ResumoFundo, "fundo">;
}

const MESES = ["JANEIRO", "FEVEREIRO", "MARCO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];
const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();

/** Rótulos do "Resumo do mês" e o campo de cada um. */
const ROTULOS: [RegExp, keyof Omit<ResumoFundo, "fundo">][] = [
  [/^SALDO ANTERIOR$/, "saldoAnteriorCentavos"],
  [/^APLICACOES \(\+\)$/, "aplicacoesCentavos"],
  [/^RESGATES \(-\)$/, "resgatesCentavos"],
  [/^RENDIMENTO LIQUIDO$/, "rendimentoLiquidoCentavos"],
  [/^SALDO ATUAL =?$/, "saldoAtualCentavos"],
];

export function lerExtratoFundoBB(linhas: LinhaPdf[]): ExtratoFundoBB {
  const textos = linhas.map((l) => l.trechos.map((t) => t.texto).join(" ").replace(/\s+/g, " ").trim());
  if (!textos.some((t) => /Investimentos Fundos/i.test(t))) {
    throw new Error("O PDF não é o extrato mensal de fundos do BB (Consultas - Investimentos Fundos - Mensal).");
  }
  const valorDepois = (prefixo: RegExp) => {
    const t = textos.find((x) => prefixo.test(x));
    return t ? t.replace(prefixo, "").trim() : "";
  };
  const agencia = /^[\d-]+/.exec(valorDepois(/^Ag[eê]ncia\s+/i))?.[0] ?? "";
  const conta = /^[\d-]+/.exec(valorDepois(/^Conta\s+/i))?.[0] ?? "";
  const mMes = /^(\S+)\/(\d{4})/.exec(semAcento(valorDepois(/^M[eê]s\/ano refer[eê]ncia\s+/i)));
  const indiceMes = mMes ? MESES.indexOf(mMes[1]) : -1;
  if (!mMes || indiceMes < 0) throw new Error("Extrato do fundo sem o mês de referência.");
  const mes = `${mMes[2]}-${String(indiceMes + 1).padStart(2, "0")}`;

  const fundos: ResumoFundo[] = [];
  let nomeFundo = "";
  let atual: Partial<ResumoFundo> | null = null;
  const fechar = () => {
    if (!atual) return;
    for (const [, campo] of ROTULOS) {
      if (atual[campo] === undefined) throw new Error(`Extrato do fundo ${atual.fundo}: "Resumo do mês" incompleto.`);
    }
    const r = atual as ResumoFundo;
    if (r.saldoAnteriorCentavos + r.aplicacoesCentavos - r.resgatesCentavos + r.rendimentoLiquidoCentavos !== r.saldoAtualCentavos) {
      throw new Error(`Extrato do fundo ${r.fundo}: o resumo do mês não fecha com o saldo atual.`);
    }
    fundos.push(r);
    atual = null;
  };

  for (const t of textos) {
    if (/ - CNPJ:/i.test(t)) {
      fechar();
      nomeFundo = t.split(/ - CNPJ:/i)[0].trim();
      continue;
    }
    if (/^Resumo do m[eê]s$/i.test(t)) {
      fechar();
      atual = { fundo: nomeFundo };
      continue;
    }
    if (!atual) continue;
    const m = /^(.*?)\s+(-?[\d.]+,\d{2})$/.exec(t);
    if (!m) continue;
    const rotulo = ROTULOS.find(([re]) => re.test(semAcento(m[1].trim())));
    const valor = centavosDeTextoBR(m[2]);
    if (rotulo && valor !== null && atual[rotulo[1]] === undefined) atual[rotulo[1]] = valor;
    if (rotulo?.[1] === "saldoAtualCentavos") fechar();
  }
  fechar();
  if (!fundos.length) throw new Error("Extrato do fundo sem o \"Resumo do mês\".");

  const soma = (campo: keyof Omit<ResumoFundo, "fundo">) => fundos.reduce((s, f) => s + f[campo], 0);
  return {
    agencia,
    conta,
    mes,
    fundos,
    total: {
      saldoAnteriorCentavos: soma("saldoAnteriorCentavos"),
      aplicacoesCentavos: soma("aplicacoesCentavos"),
      resgatesCentavos: soma("resgatesCentavos"),
      rendimentoLiquidoCentavos: soma("rendimentoLiquidoCentavos"),
      saldoAtualCentavos: soma("saldoAtualCentavos"),
    },
  };
}

/**
 * Conciliação bancária mensal (quadro da SEFAZ). Spec:
 * docs/superpowers/specs/2026-10-21-financeiro-conciliacao-mensal-design.md
 *
 * Valores em centavos (inteiro), para somar sem erro de ponto flutuante. Datas em ISO (AAAA-MM-DD).
 */

/** Histórico do crédito bancário que o rendimento do fundo no mês vira (o OFX não traz o rendimento). */
export const HISTORICO_RENDIMENTO = "RENDIMENTOS APLICAÇÃO FINANCEIRA";

/** Razão do FIPLAN (contábil) ou extrato do banco (bancário). */
export type LadoConciliacao = "contabil" | "bancario";
export type NaturezaConciliacao = "debito" | "credito";

/** De onde o item veio: o mês, uma pendência em aberto do mês anterior ou a abertura (implantação). */
export type OrigemItemConciliacao = "mes" | "anterior" | "abertura";

/** Regra que casou o item (ou o tirou da conta, em `interno`). */
export type RegraConciliacao = "interno" | "re" | "ob_cancelada" | "repasse" | "valor_data" | "estorno" | "manual";

/** Nome de cada regra na tela, no PDF e na planilha. */
export const ROTULO_REGRA: Record<RegraConciliacao, string> = {
  interno: "Interno do razão",
  re: "RE (pagamentos)",
  ob_cancelada: "OB cancelada",
  repasse: "Repasse do Tesouro",
  valor_data: "Valor e data",
  estorno: "Estorno",
  manual: "Manual",
};

/** As quatro listas do quadro da SEFAZ, na ordem do quadro. */
export const LISTAS_PENDENCIAS: { lado: LadoConciliacao; natureza: NaturezaConciliacao; titulo: string; sinal: string }[] = [
  { lado: "contabil", natureza: "debito", titulo: "Débitos contábeis não correspondidos no banco", sinal: "(-)" },
  { lado: "contabil", natureza: "credito", titulo: "Créditos contábeis não correspondidos no banco", sinal: "(+)" },
  { lado: "bancario", natureza: "debito", titulo: "Débitos bancários não correspondidos no razão", sinal: "(-)" },
  { lado: "bancario", natureza: "credito", titulo: "Créditos bancários não correspondidos no razão", sinal: "(+)" },
];

export interface ItemConciliacao {
  /** Identificador estável dentro do cálculo (no banco, o id da linha). */
  id: string;
  lado: LadoConciliacao;
  natureza: NaturezaConciliacao;
  data: string;
  /** Nº do documento: no razão, o do FIPLAN (NOB, ARR, NLA); no extrato, o CHECKNUM. */
  documento: string;
  /** Tipo do documento no razão (NOB, ARR, NLA…); no extrato, vazio. */
  tipo: string;
  historico: string;
  valorCentavos: number;
  /** RE da NOB (do FIP103) ou RE do débito do extrato. */
  re?: string;
  /** NOB citada (OB cancelada no extrato). */
  nob?: string;
  origem: OrigemItemConciliacao;
  /** Pendência do mês anterior: id do item de lá (no banco, `item_origem_id`). */
  itemOrigemId?: string;
}

export interface Casamento {
  regra: RegraConciliacao;
  itens: string[];
  /** Obrigatória no casamento manual. */
  justificativa?: string;
}

export interface ResultadoConciliacao {
  casamentos: Casamento[];
  /** Itens sem par, na ordem em que entraram. */
  pendentes: ItemConciliacao[];
}

export interface QuadroConciliacao {
  saldoRazaoCentavos: number;
  debitosContabeisCentavos: number;
  creditosContabeisCentavos: number;
  debitosBancariosCentavos: number;
  creditosBancariosCentavos: number;
  saldoAjustadoCentavos: number;
  saldoExtratoCentavos: number;
  diferencaCentavos: number;
}

/** "1.234,56" → 123456. Vazio ou inválido → null. */
export function centavosDeTextoBR(texto: string): number | null {
  const t = texto.trim();
  if (!/^-?\d{1,3}(\.\d{3})*,\d{2}$/.test(t) && !/^-?\d+,\d{2}$/.test(t)) return null;
  const negativo = t.startsWith("-");
  const n = Number(t.replace(/[-.]/g, "").replace(",", ""));
  return negativo ? -n : n;
}

/** "-1234.56" (OFX) → -123456. */
export function centavosDeTextoPonto(texto: string): number | null {
  const t = texto.trim();
  if (!/^-?\d+(\.\d{1,2})?$/.test(t)) return null;
  const negativo = t.startsWith("-");
  const [inteiro, frac = ""] = t.replace("-", "").split(".");
  const n = Number(inteiro) * 100 + Number(frac.padEnd(2, "0"));
  return negativo ? -n : n;
}

export function formatarCentavos(c: number): string {
  return (c / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

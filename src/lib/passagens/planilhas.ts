/**
 * Linhas das planilhas das passagens (exportadas por src/export/exportExcel.ts): bilhetes emitidos no período, com
 * a fatura de cada um, e faturas do contrato. "Por beneficiário" e "por instituição" saem da planilha de bilhetes,
 * com o filtro da própria planilha.
 */

import { formatDateBR } from "@/lib/formatters";
import { conferirFatura } from "@/lib/passagens/faturas";
import { valorTrecho } from "@/lib/passagens/regras";
import { rotuloSituacaoFatura, rotuloSituacaoTrecho, type BilheteDoContrato, type FaturaComItens } from "@/types/passagens";

type FaturaDoBilhete = { valor: number | string; fatura: { numero: string; situacao: string; pagamento_data: string | null; ob_numero: string | null } | null } | null;

const n = (v: number | string | null | undefined) => Number(v ?? 0) || 0;
const data = (v: string | null | undefined) => (v ? formatDateBR(v) : "");

export function linhasPlanilhaBilhetes(bilhetes: (BilheteDoContrato & { item: FaturaDoBilhete })[]) {
  return bilhetes.map((b) => {
    const f = b.item?.fatura ?? null;
    return {
      "Emissão": data(b.data_emissao),
      "Processo SEI": b.passageiro.pedido.numero_sei,
      "Evento": b.passageiro.pedido.evento ?? "",
      "Quem pediu": b.passageiro.pedido.solicitante_nome ?? "",
      "Passageiro": b.passageiro.nome ?? "",
      "Trecho": `${b.origem} - ${b.destino}`,
      "Data do voo": data(b.data_voo),
      "Companhia": b.companhia ?? "",
      "Localizador": b.localizador ?? "",
      "Bilhete": b.numero_bilhete ?? "",
      "Situação": rotuloSituacaoTrecho(b.situacao),
      "Valor da emissão": n(b.valor_emissao),
      "Multa": n(b.valor_multa),
      "Reembolso": n(b.valor_reembolso),
      "Valor": valorTrecho(b),
      "Fatura": f?.numero ?? "",
      "Situação da fatura": f ? rotuloSituacaoFatura(f.situacao) : "a faturar",
      "Pago em": data(f?.pagamento_data),
      "OB": f?.ob_numero ?? "",
    };
  });
}

export function linhasPlanilhaFaturas(faturas: FaturaComItens[]) {
  return faturas.map((f) => {
    const c = conferirFatura(f.valor, f.itens);
    return {
      "Nota": f.numero,
      "Emissão": data(f.data_emissao),
      "Valor da nota": n(f.valor),
      "Bilhetes": f.itens.length,
      "Soma dos bilhetes": c.soma,
      "Diferença": c.diferenca,
      "Situação": rotuloSituacaoFatura(f.situacao),
      "Atesto": data(f.atesto_data),
      "Documento SEI do atesto": f.atesto_documento_sei ?? "",
      "Liquidação": data(f.liquidacao_data),
      "Pagamento": data(f.pagamento_data),
      "OB": f.ob_numero ?? "",
      "Processo SEI do pagamento": f.processo_sei_pagamento ?? "",
      "Motivo do cancelamento": f.cancelamento_motivo ?? "",
    };
  });
}

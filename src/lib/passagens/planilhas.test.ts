import { describe, expect, it } from "vitest";
import { linhasPlanilhaBilhetes, linhasPlanilhaFaturas } from "./planilhas";
import type { BilheteDoContrato, FaturaComItens } from "@/types/passagens";

const bilhete = {
  id: "t1",
  origem: "BVB",
  destino: "BSB",
  data_voo: "2026-11-03",
  situacao: "remarcado",
  localizador: "ABC123",
  numero_bilhete: "957",
  companhia: "Cia",
  data_emissao: "2026-10-01",
  valor_emissao: 1000,
  valor_multa: 150,
  valor_reembolso: 0,
  passageiro: { id: "p1", nome: "Atleta", pedido: { id: "d1", numero_sei: "SEI-1", evento: "Jogos", solicitante_nome: "Federação", contrato_id: "c1" } },
} as BilheteDoContrato;

describe("planilhas das passagens", () => {
  it("bilhete com a fatura paga e bilhete a faturar", () => {
    const [pago, aberto] = linhasPlanilhaBilhetes([
      { ...bilhete, item: { valor: 1150, fatura: { numero: "NF-1", situacao: "paga", pagamento_data: "2026-10-20", ob_numero: "OB1" } } },
      { ...bilhete, id: "t2", item: null },
    ]);
    expect(pago).toMatchObject({ "Trecho": "BVB - BSB", "Situação": "Remarcado", "Valor": 1150, "Fatura": "NF-1", "Situação da fatura": "Paga", "Pago em": "20/10/2026", "OB": "OB1", "Quem pediu": "Federação" });
    expect(aberto).toMatchObject({ "Fatura": "", "Situação da fatura": "a faturar", "Pago em": "" });
  });

  it("fatura com a conferência dos bilhetes", () => {
    const [l] = linhasPlanilhaFaturas([
      { numero: "NF-1", data_emissao: "2026-10-10", valor: 1200, situacao: "atestada", atesto_data: "2026-10-12", atesto_documento_sei: "111", liquidacao_data: null, pagamento_data: null, ob_numero: null, processo_sei_pagamento: null, cancelamento_motivo: null, itens: [{ id: "i", trecho_id: "t1", valor: 1150 }] } as unknown as FaturaComItens,
    ]);
    expect(l).toMatchObject({ "Nota": "NF-1", "Bilhetes": 1, "Soma dos bilhetes": 1150, "Diferença": 50, "Situação": "Atestada", "Atesto": "12/10/2026", "Pagamento": "" });
  });
});

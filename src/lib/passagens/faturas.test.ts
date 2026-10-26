import { describe, expect, it } from "vitest";
import {
  aFaturar,
  conferirFatura,
  pendenciasSituacaoFatura,
  proximasSituacoesFatura,
  saldoContratoCompleto,
  saldoEmpenhoPorExercicio,
} from "./faturas";

const bilhete = (id: string, valor: number, data_emissao = "2026-10-01", o: Record<string, unknown> = {}) => ({
  id,
  situacao: "emitido",
  localizador: "ABC" + id,
  data_emissao,
  valor_emissao: valor,
  valor_multa: 0,
  valor_reembolso: 0,
  ...o,
});

describe("conferirFatura", () => {
  it("soma os bilhetes e mostra a diferença para a nota", () => {
    expect(conferirFatura(1500, [{ valor: 800 }, { valor: 700 }])).toEqual({ soma: 1500, diferenca: 0, confere: true });
    expect(conferirFatura("1500.10", [{ valor: "800.05" }, { valor: 700 }])).toEqual({ soma: 1500.05, diferenca: 0.05, confere: false });
    expect(conferirFatura(100, [])).toEqual({ soma: 0, diferenca: 100, confere: false });
  });
});

describe("aFaturar", () => {
  it("lista bilhete emitido sem nota, com os dias e o atraso depois de 30", () => {
    const r = aFaturar(
      [bilhete("1", 800, "2026-09-01"), bilhete("2", 700, "2026-10-20"), bilhete("3", 500), { ...bilhete("4", 0), localizador: null }],
      new Set(["3"]),
      "2026-10-25",
    );
    expect(r.map((x) => [x.trecho.id, x.valor, x.dias, x.atrasado])).toEqual([
      ["1", 800, 54, true],
      ["2", 700, 5, false],
    ]);
  });
  it("bilhete reembolsado por inteiro não fica a faturar", () => {
    expect(aFaturar([bilhete("1", 800, "2026-09-01", { situacao: "reembolsado", valor_reembolso: 800 })], new Set(), "2026-10-25")).toEqual([]);
  });
});

describe("saldoContratoCompleto", () => {
  it("faturado e pago pelas notas; a faturar pelos bilhetes sem nota; canceladas fora", () => {
    const r = saldoContratoCompleto(
      10000,
      [bilhete("1", 800), bilhete("2", 700), bilhete("3", 500)],
      [
        { situacao: "paga", valor: 800, itens: [{ trecho_id: "1" }] },
        { situacao: "atestada", valor: 700, itens: [{ trecho_id: "2" }] },
        { situacao: "cancelada", valor: 999, itens: [] },
      ],
    );
    expect(r).toEqual({ valor: 10000, emitido: 2000, faturado: 1500, pago: 800, aFaturar: 500, comprometido: 2000, saldo: 8000 });
  });
});

describe("saldoEmpenhoPorExercicio", () => {
  it("empenhado líquido do ano × bilhetes emitidos no ano", () => {
    const r = saldoEmpenhoPorExercicio(
      [
        { exercicio: 2026, valor_empenhado: 1000, valor_anulado: 100, valor_liquidado: 500, valor_pago: 300 },
        { exercicio: 2026, valor_empenhado: "200", valor_anulado: 0, valor_liquidado: 0, valor_pago: 0 },
        { exercicio: 2025, valor_empenhado: 50, valor_anulado: 0, valor_liquidado: 50, valor_pago: 50 },
      ],
      [bilhete("1", 800, "2026-03-01"), bilhete("2", 400, "2026-10-01"), bilhete("3", 70, "2024-12-01")],
    );
    expect(r).toEqual([
      { exercicio: 2026, empenhado: 1100, liquidado: 500, pago: 300, emitido: 1200, disponivel: -100 },
      { exercicio: 2025, empenhado: 50, liquidado: 50, pago: 50, emitido: 0, disponivel: 50 },
      { exercicio: 2024, empenhado: 0, liquidado: 0, pago: 0, emitido: 70, disponivel: -70 },
    ]);
  });
});

describe("situação da fatura", () => {
  it("segue o fluxo, volta um passo e cancela antes de paga", () => {
    expect(proximasSituacoesFatura("recebida")).toEqual(["atestada", "cancelada"]);
    expect(proximasSituacoesFatura("atestada")).toEqual(["liquidada", "recebida", "cancelada"]);
    expect(proximasSituacoesFatura("liquidada")).toEqual(["paga", "atestada", "cancelada"]);
    expect(proximasSituacoesFatura("paga")).toEqual(["liquidada"]);
    expect(proximasSituacoesFatura("cancelada")).toEqual([]);
  });
  it("pede o que o banco exige", () => {
    const vazio = { atesto_data: null, atesto_documento_sei: null, liquidacao_data: null, pagamento_data: null, ob_numero: null, cancelamento_motivo: null };
    expect(pendenciasSituacaoFatura("atestada", vazio)).toEqual(["Informe a data e o nº do documento SEI do atesto."]);
    expect(pendenciasSituacaoFatura("liquidada", { ...vazio, atesto_data: "2026-10-01", atesto_documento_sei: "1" })).toEqual(["Informe a data da liquidação."]);
    expect(pendenciasSituacaoFatura("paga", { ...vazio, atesto_data: "2026-10-01", atesto_documento_sei: "1", liquidacao_data: "2026-10-02" }))
      .toEqual(["Informe a data do pagamento e o nº da OB."]);
    expect(pendenciasSituacaoFatura("cancelada", { ...vazio, cancelamento_motivo: "x" })).toEqual(["Escreva o motivo do cancelamento."]);
    expect(pendenciasSituacaoFatura("recebida", vazio)).toEqual([]);
  });
});

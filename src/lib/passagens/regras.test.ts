import { describe, expect, it } from "vitest";
import {
  deDataHoraLocal,
  mascararCpf,
  paraDataHoraLocal,
  pendenciasParaSituacao,
  proximasSituacoes,
  resumoPedido,
  saldoContrato,
  somenteDigitos,
  valorTrecho,
} from "./regras";

const trecho = (o: Partial<Parameters<typeof valorTrecho>[0]> = {}) => ({
  situacao: "a_cotar",
  localizador: null,
  valor_emissao: 0,
  valor_multa: 0,
  valor_reembolso: 0,
  ...o,
});

describe("valorTrecho", () => {
  it("trecho sem emissão não custa nada, mesmo cancelado", () => {
    expect(valorTrecho(trecho())).toBe(0);
    expect(valorTrecho(trecho({ situacao: "cancelado", valor_emissao: 500 }))).toBe(0);
  });
  it("emitido = valor da emissão", () => {
    expect(valorTrecho(trecho({ situacao: "emitido", localizador: "ABC123", valor_emissao: 1060.5 }))).toBe(1060.5);
  });
  it("remarcado soma a multa", () => {
    expect(valorTrecho(trecho({ situacao: "remarcado", localizador: "ABC123", valor_emissao: 1000, valor_multa: 150 }))).toBe(1150);
  });
  it("cancelado depois de emitido continua cobrado até o reembolso", () => {
    expect(valorTrecho(trecho({ situacao: "cancelado", localizador: "X", valor_emissao: 800, valor_multa: 100 }))).toBe(900);
    expect(
      valorTrecho(trecho({ situacao: "reembolsado", localizador: "X", valor_emissao: 800, valor_multa: 100, valor_reembolso: 700 })),
    ).toBe(200);
  });
  it("nunca negativo e com centavos certos", () => {
    expect(valorTrecho(trecho({ situacao: "reembolsado", localizador: "X", valor_emissao: 100, valor_reembolso: 150 }))).toBe(0);
    expect(valorTrecho(trecho({ situacao: "emitido", localizador: "X", valor_emissao: 0.1, valor_multa: 0.2 }))).toBe(0.3);
  });
  it("aceita valores em texto (numeric do PostgREST)", () => {
    expect(valorTrecho(trecho({ situacao: "emitido", localizador: "X", valor_emissao: "99.90" as unknown as number }))).toBe(99.9);
  });
});

describe("resumoPedido", () => {
  it("conta passageiros, trechos e soma o emitido", () => {
    const r = resumoPedido([
      { trechos: [trecho({ situacao: "emitido", localizador: "A", valor_emissao: 100 }), trecho()] },
      { trechos: [trecho({ situacao: "cotado" })] },
    ]);
    expect(r).toEqual({ passageiros: 2, trechos: 3, emitidos: 1, pendentes: 2, valor: 100 });
  });
});

describe("saldoContrato", () => {
  it("soma o emitido dos pedidos não cancelados e também dos cancelados com bilhete", () => {
    const pedidos = [
      { situacao: "emitido", passageiros: [{ trechos: [trecho({ situacao: "emitido", localizador: "A", valor_emissao: 300 })] }] },
      { situacao: "cancelado", passageiros: [{ trechos: [trecho({ situacao: "cancelado", localizador: "B", valor_emissao: 200, valor_multa: 50 })] }] },
      { situacao: "recebido", passageiros: [{ trechos: [trecho()] }] },
    ];
    expect(saldoContrato(1000, pedidos)).toEqual({ valor: 1000, emitido: 550, saldo: 450 });
  });
});

describe("proximasSituacoes", () => {
  it("segue o fluxo e sempre permite cancelar enquanto aberto", () => {
    expect(proximasSituacoes("recebido")).toEqual(["cotacao_solicitada", "cancelado"]);
    expect(proximasSituacoes("cotacao_recebida")).toEqual(["aprovado", "cotacao_solicitada", "cancelado"]);
    expect(proximasSituacoes("emitido")).toEqual(["concluido", "cancelado"]);
    expect(proximasSituacoes("concluido")).toEqual([]);
    expect(proximasSituacoes("cancelado")).toEqual([]);
  });
});

describe("pendenciasParaSituacao", () => {
  const pedido = { aprovacao_documento_sei: null, aprovacao_data: null };
  it("aprovado exige documento e data da aprovação", () => {
    expect(pendenciasParaSituacao("aprovado", pedido, [])).toEqual(["Informe o nº do documento SEI e a data da aprovação do Presidente."]);
    expect(pendenciasParaSituacao("aprovado", { aprovacao_documento_sei: "123", aprovacao_data: "2026-10-24" }, [])).toEqual([]);
  });
  it("emitido exige ao menos um trecho emitido", () => {
    expect(pendenciasParaSituacao("emitido", pedido, [{ trechos: [trecho()] }])).toEqual(["Registre a emissão de ao menos um trecho."]);
    expect(pendenciasParaSituacao("emitido", pedido, [{ trechos: [trecho({ situacao: "emitido", localizador: "A" })] }])).toEqual([]);
  });
  it("concluído exige todos os trechos fechados", () => {
    expect(pendenciasParaSituacao("concluido", pedido, [{ trechos: [trecho({ situacao: "emitido", localizador: "A" }), trecho({ situacao: "cotado" })] }]))
      .toEqual(["1 trecho ainda está a cotar ou cotado: emita ou cancele antes de concluir."]);
  });
});

describe("CPF", () => {
  it("guarda só dígitos e mascara na lista", () => {
    expect(somenteDigitos("529.982.247-25")).toBe("52998224725");
    expect(mascararCpf("52998224725")).toBe("***.982.247-**");
    expect(mascararCpf("123")).toBe("—");
  });
});

describe("data e hora do voo", () => {
  it("ida e volta pelo datetime-local", () => {
    const iso = deDataHoraLocal("2026-11-03T07:45");
    expect(iso).not.toBeNull();
    expect(paraDataHoraLocal(iso)).toBe("2026-11-03T07:45");
    expect(deDataHoraLocal("")).toBeNull();
    expect(paraDataHoraLocal(null)).toBe("");
  });
});

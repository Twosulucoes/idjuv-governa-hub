import { describe, expect, it } from "vitest";
import {
  PRAZO_PADRAO_DIAS,
  lerPrazo,
  pendenciasDoPassageiro,
  pendenciasDoPedido,
  podeConcluir,
  retornoDoPassageiro,
  somarDias,
} from "./prestacao";

const voo = (data_voo: string, o: Partial<{ situacao: string; localizador: string | null }> = {}) => ({
  data_voo,
  situacao: "emitido",
  localizador: "ABC123",
  ...o,
});

const passageiro = (o: Record<string, unknown> = {}) => ({
  id: "p1",
  nome: "Ana",
  servidor_id: null as string | null,
  embarque_entregue_em: null as string | null,
  relatorio_entregue_em: null as string | null,
  prestacao_dispensada: false,
  trechos: [voo("2099-03-01"), voo("2099-03-05")],
  ...o,
});

const pedido = (o: Record<string, unknown> = {}) => ({
  prestacao_contas: "individual",
  relatorio_evento_entregue_em: null as string | null,
  passageiros: [passageiro()],
  ...o,
});

describe("somarDias e lerPrazo", () => {
  it("soma dias corridos na virada do mês", () => {
    expect(somarDias("2099-02-26", 5)).toBe("2099-03-03");
  });
  it("prazo do módulo: número inteiro positivo; senão o padrão", () => {
    expect(lerPrazo({ passagens_prazo_prestacao_dias: 10 })).toBe(10);
    expect(lerPrazo({ passagens_prazo_prestacao_dias: "7" })).toBe(7);
    expect(lerPrazo({ passagens_prazo_prestacao_dias: -1 })).toBe(PRAZO_PADRAO_DIAS);
    expect(lerPrazo(null)).toBe(PRAZO_PADRAO_DIAS);
    expect(lerPrazo([])).toBe(PRAZO_PADRAO_DIAS);
  });
});

describe("retornoDoPassageiro", () => {
  it("último voo emitido e não cancelado", () => {
    expect(retornoDoPassageiro([voo("2099-03-01"), voo("2099-03-05")])).toBe("2099-03-05");
    expect(retornoDoPassageiro([voo("2099-03-01"), voo("2099-03-09", { situacao: "cancelado" })])).toBe("2099-03-01");
    expect(retornoDoPassageiro([voo("2099-03-01"), voo("2099-03-09", { situacao: "reembolsado" })])).toBe("2099-03-01");
    expect(retornoDoPassageiro([voo("2099-03-01", { situacao: "remarcado" })])).toBe("2099-03-01");
  });
  it("sem bilhete emitido não há retorno", () => {
    expect(retornoDoPassageiro([voo("2099-03-01", { situacao: "cotado", localizador: null })])).toBeNull();
    expect(retornoDoPassageiro([])).toBeNull();
  });
});

describe("pendenciasDoPassageiro", () => {
  const ctx = { prazoDias: 5, hoje: "2099-03-12", relatorioRh: false };

  it("individual: cartão e relatório, vencendo 5 dias depois do retorno", () => {
    expect(pendenciasDoPassageiro("individual", passageiro(), ctx)).toEqual([
      { tipo: "embarque", vencimento: "2099-03-10", diasAtraso: 2 },
      { tipo: "relatorio", vencimento: "2099-03-10", diasAtraso: 2 },
    ]);
  });
  it("antes do vencimento o atraso é zero", () => {
    expect(pendenciasDoPassageiro("individual", passageiro(), { ...ctx, hoje: "2099-03-07" })[0].diasAtraso).toBe(0);
  });
  it("antes de voltar não há pendência; com ignorarData, há", () => {
    expect(pendenciasDoPassageiro("individual", passageiro(), { ...ctx, hoje: "2099-03-04" })).toEqual([]);
    expect(pendenciasDoPassageiro("individual", passageiro(), { ...ctx, hoje: "2099-03-04", ignorarData: true })).toHaveLength(2);
  });
  it("entregue some da lista", () => {
    expect(pendenciasDoPassageiro("individual", passageiro({ embarque_entregue_em: "2099-03-06", relatorio_entregue_em: "2099-03-06" }), ctx)).toEqual([]);
  });
  it("relatório apresentado no RH conta como entregue", () => {
    expect(pendenciasDoPassageiro("individual", passageiro({ servidor_id: "s1" }), { ...ctx, relatorioRh: true }).map((p) => p.tipo)).toEqual(["embarque"]);
  });
  it("evento e dispensado: só o cartão de embarque", () => {
    expect(pendenciasDoPassageiro("evento", passageiro(), ctx).map((p) => p.tipo)).toEqual(["embarque"]);
    expect(pendenciasDoPassageiro("dispensado", passageiro(), ctx).map((p) => p.tipo)).toEqual(["embarque"]);
  });
  it("passageiro dispensado ou sem bilhete: nada", () => {
    expect(pendenciasDoPassageiro("individual", passageiro({ prestacao_dispensada: true }), ctx)).toEqual([]);
    expect(pendenciasDoPassageiro("individual", passageiro({ trechos: [] }), ctx)).toEqual([]);
  });
});

describe("pendenciasDoPedido e podeConcluir", () => {
  const ctx = { prazoDias: 5, hoje: "2099-03-12", relatorioRh: {} as Record<string, boolean> };

  it("evento: relatório único vence pelo último retorno do grupo", () => {
    const p = pedido({
      prestacao_contas: "evento",
      passageiros: [
        passageiro({ embarque_entregue_em: "2099-03-06" }),
        passageiro({ id: "p2", nome: "Bia", embarque_entregue_em: "2099-03-06", trechos: [voo("2099-03-02"), voo("2099-03-06")] }),
      ],
    });
    expect(pendenciasDoPedido(p, ctx)).toEqual([
      { passageiroId: null, nome: null, tipo: "relatorio_evento", vencimento: "2099-03-11", diasAtraso: 1 },
    ]);
    expect(pendenciasDoPedido({ ...p, relatorio_evento_entregue_em: "2099-03-07" }, ctx)).toEqual([]);
  });
  it("evento com todos dispensados não pede relatório do grupo", () => {
    const p = pedido({ prestacao_contas: "evento", passageiros: [passageiro({ prestacao_dispensada: true })] });
    expect(pendenciasDoPedido(p, ctx)).toEqual([]);
  });
  it("ordena pelo atraso e identifica o passageiro", () => {
    const p = pedido({
      passageiros: [
        passageiro({ relatorio_entregue_em: "2099-03-06" }),
        passageiro({ id: "p2", nome: "Bia", trechos: [voo("2099-03-01")] }),
      ],
    });
    expect(pendenciasDoPedido(p, ctx).map((x) => `${x.nome}:${x.tipo}:${x.diasAtraso}`)).toEqual([
      "Bia:embarque:6",
      "Bia:relatorio:6",
      "Ana:embarque:2",
    ]);
  });
  it("relatório do RH por passageiro", () => {
    const p = pedido({ passageiros: [passageiro({ servidor_id: "s1", embarque_entregue_em: "2099-03-06" })] });
    expect(pendenciasDoPedido(p, { ...ctx, relatorioRh: { p1: true } })).toEqual([]);
  });
  it("só conclui sem pendência, mesmo antes do vencimento ou do retorno", () => {
    expect(podeConcluir(pedido(), { ...ctx, hoje: "2099-03-02" })).toBe(false);
    const entregue = pedido({ passageiros: [passageiro({ embarque_entregue_em: "2099-03-06", relatorio_entregue_em: "2099-03-06" })] });
    expect(podeConcluir(entregue, ctx)).toBe(true);
  });
});

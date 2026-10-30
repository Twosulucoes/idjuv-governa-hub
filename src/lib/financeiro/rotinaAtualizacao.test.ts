import { describe, expect, it } from "vitest";
import { ROTINA_FINANCEIRO, resumirRotina, situacaoDoItem } from "./rotinaAtualizacao";

// 24/10/2026, meio-dia, para não depender do fuso
const hoje = new Date(2026, 9, 24, 12);

describe("situacaoDoItem", () => {
  it("semanal: até 7 dias está em dia, 8 dias atrasado", () => {
    expect(situacaoDoItem("semanal", new Date(2026, 9, 17, 12).toISOString(), hoje)).toBe("em_dia");
    expect(situacaoDoItem("semanal", new Date(2026, 9, 16, 11).toISOString(), hoje)).toBe("atrasado");
  });

  it("sem registro é nunca importado, menos o que é sob demanda", () => {
    expect(situacaoDoItem("semanal", null, hoje)).toBe("nunca");
    expect(situacaoDoItem("mensal", null, hoje)).toBe("nunca");
    expect(situacaoDoItem("anual", null, hoje)).toBe("nunca");
    expect(situacaoDoItem("sob_demanda", null, hoje)).toBe("sob_demanda");
    expect(situacaoDoItem("sob_demanda", "2026-01-01T10:00:00Z", hoje)).toBe("sob_demanda");
  });

  it("mensal: o mês anterior fechado está em dia; antes do dia 10 ainda vale o retrasado", () => {
    expect(situacaoDoItem("mensal", "2026-09-01", hoje)).toBe("em_dia");
    expect(situacaoDoItem("mensal", "2026-08-01", hoje)).toBe("atrasado");
    const dia9 = new Date(2026, 9, 9, 12);
    expect(situacaoDoItem("mensal", "2026-08-01", dia9)).toBe("em_dia");
    expect(situacaoDoItem("mensal", "2026-07-01", dia9)).toBe("atrasado");
  });

  it("mensal: vira o ano sem quebrar", () => {
    const janeiro = new Date(2027, 0, 15, 12);
    expect(situacaoDoItem("mensal", "2026-12-01", janeiro)).toBe("em_dia");
    expect(situacaoDoItem("mensal", "2026-11-01", janeiro)).toBe("atrasado");
    expect(situacaoDoItem("mensal", "2026-11-01", new Date(2027, 0, 5, 12))).toBe("em_dia");
  });

  it("anual: qualquer importação do exercício está em dia", () => {
    expect(situacaoDoItem("anual", "2026-02-03T10:00:00Z", hoje)).toBe("em_dia");
  });

  it("exercício encerrado não atrasa", () => {
    expect(situacaoDoItem("semanal", "2025-12-20T10:00:00Z", hoje, { encerrado: true })).toBe("em_dia");
    expect(situacaoDoItem("mensal", "2025-06-01", hoje, { encerrado: true })).toBe("em_dia");
    expect(situacaoDoItem("semanal", null, hoje, { encerrado: true })).toBe("nunca");
  });
});

describe("resumirRotina", () => {
  it("conta só os itens com prazo", () => {
    expect(resumirRotina(["em_dia", "atrasado", "nunca", "sob_demanda", "em_dia"])).toEqual({ emDia: 2, comPrazo: 4 });
  });
});

describe("ROTINA_FINANCEIRO", () => {
  it("cada item tem passos e um destino; os importadores abrem na própria tela", () => {
    expect(ROTINA_FINANCEIRO.map((i) => i.id)).toEqual([
      "qdd_fiplan",
      "empenhos_fip614",
      "peds_fiplan",
      "arquivo_bancario",
      "conciliacao",
      "classificadores_fiplan",
    ]);
    for (const item of ROTINA_FINANCEIRO) {
      expect(item.passos.length).toBeGreaterThan(0);
      if (item.importador) expect(item.destino).toBe(`/financeiro/atualizar?importador=${item.importador}`);
    }
  });
});

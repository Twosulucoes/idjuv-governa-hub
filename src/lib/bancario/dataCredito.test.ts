import { describe, expect, it } from "vitest";
import { conjuntoFeriados, dataCreditoPadrao, deIso, problemaDataCredito } from "./dataCredito";

const hoje = new Date(2026, 9, 20); // terça, 20/10/2026

describe("data de crédito da remessa", () => {
  it("usa o dia de pagamento no mês da competência, recuando do fim de semana", () => {
    // 31/10/2026 é sábado: recua para sexta, 30/10
    expect(dataCreditoPadrao({ ano: 2026, mes: 10, diaPagamento: 31, hoje })).toBe("2026-10-30");
    // dia 30 em fevereiro vira o último dia (28/02/2027 é domingo → sexta, 26/02)
    expect(dataCreditoPadrao({ ano: 2027, mes: 2, diaPagamento: 30, hoje })).toBe("2027-02-26");
  });

  it("sem dia configurado, último dia útil do mês", () => {
    expect(dataCreditoPadrao({ ano: 2026, mes: 11, hoje })).toBe("2026-11-30");
  });

  it("competência já paga ou de hoje: próximo dia útil depois de hoje", () => {
    expect(dataCreditoPadrao({ ano: 2026, mes: 9, diaPagamento: 30, hoje })).toBe("2026-10-21");
    const sexta = new Date(2026, 9, 23);
    expect(dataCreditoPadrao({ ano: 2026, mes: 10, diaPagamento: 23, hoje: sexta })).toBe("2026-10-26");
  });

  it("pula feriado", () => {
    const feriados = new Set(["2026-10-30"]);
    expect(dataCreditoPadrao({ ano: 2026, mes: 10, diaPagamento: 31, hoje, feriados })).toBe("2026-10-29");
  });

  it("recusa data passada, de hoje, de fim de semana, de feriado ou que não existe", () => {
    expect(problemaDataCredito("2026-10-20", hoje)).toMatch(/amanhã/);
    expect(problemaDataCredito("2026-10-24", hoje)).toMatch(/dia útil/);
    expect(problemaDataCredito("2026-11-02", hoje, new Set(["2026-11-02"]))).toMatch(/dia útil/);
    expect(problemaDataCredito("2026-09-31", hoje)).toMatch(/Informe/);
    expect(problemaDataCredito("2026-10-21", hoje)).toBeNull();
    expect(deIso("2026-09-31")).toBeNull();
  });
});

describe("conjuntoFeriados", () => {
  it("repete o recorrente em cada ano e ignora o inativo", () => {
    const f = conjuntoFeriados(
      [
        { data: "2020-12-25", recorrente: true },
        { data: "2026-10-05", recorrente: false },
        { data: "2026-11-20", ativo: false },
      ],
      [2026, 2027],
    );
    expect([...f].sort()).toEqual(["2026-10-05", "2026-12-25", "2027-12-25"]);
  });
});

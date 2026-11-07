import { describe, expect, it } from "vitest";
import {
  diasDePrazo,
  diasEntre,
  exigeProximaAcao,
  faltaNaProximaAcao,
  proximaEtapaSugerida,
  situacaoPrazo,
  somarDias,
  textoPrazo,
} from "./proximaAcao";

describe("proximaEtapaSugerida", () => {
  it("segue a ordem do processo e termina no encerramento", () => {
    expect(proximaEtapaSugerida("abertura")).toBe("dfd");
    expect(proximaEtapaSugerida("etp")).toBe("tr");
    expect(proximaEtapaSugerida("execucao")).toBe("encerrado");
  });

  it("etapa final ou desconhecida não tem seguinte", () => {
    expect(proximaEtapaSugerida("encerrado")).toBeNull();
    expect(proximaEtapaSugerida("cancelado")).toBeNull();
    expect(proximaEtapaSugerida("outra")).toBeNull();
    expect(exigeProximaAcao("cancelado")).toBe(false);
    expect(exigeProximaAcao("tr")).toBe(true);
  });
});

describe("prazo", () => {
  it("usa os dias do banco e cai no padrão", () => {
    expect(diasDePrazo("etp")).toBe(15);
    expect(diasDePrazo("etp", [{ etapa: "etp", dias_prazo: 20, dias_limite_parado: 15 }])).toBe(20);
    expect(diasDePrazo("x")).toBe(10);
  });

  it("soma dias atravessando mês e ano", () => {
    expect(somarDias("2026-11-25", 10)).toBe("2026-12-05");
    expect(somarDias("2026-12-28", 5)).toBe("2027-01-02");
    expect(diasEntre("2026-11-07", "2026-11-10")).toBe(3);
  });

  it("classifica e descreve o prazo", () => {
    const hoje = "2026-11-07";
    expect(situacaoPrazo(null, hoje)).toBeNull();
    expect(situacaoPrazo("2026-11-05", hoje)).toBe("vencido");
    expect(situacaoPrazo("2026-11-07", hoje)).toBe("hoje");
    expect(situacaoPrazo("2026-11-10", hoje)).toBe("proximo");
    expect(situacaoPrazo("2026-11-11", hoje)).toBe("em_dia");
    expect(textoPrazo("2026-11-05", hoje)).toBe("venceu há 2 dias");
    expect(textoPrazo("2026-11-06", hoje)).toBe("venceu ontem");
    expect(textoPrazo("2026-11-08", hoje)).toBe("vence amanhã");
    expect(textoPrazo("2026-11-12", hoje)).toBe("faltam 5 dias");
  });
});

describe("faltaNaProximaAcao", () => {
  const base = { etapa: "etp", data: "2026-11-07" };
  it("pede próxima etapa, responsável e prazo, como o banco", () => {
    expect(faltaNaProximaAcao(base)).toBe("Informe a próxima etapa.");
    expect(faltaNaProximaAcao({ ...base, proxima_etapa: "tr", responsavel_setor: "  " })).toMatch(/responsável/);
    expect(faltaNaProximaAcao({ ...base, proxima_etapa: "tr", responsavel_setor: "IDJUV/PRESI" })).toMatch(/prazo/);
    expect(
      faltaNaProximaAcao({ ...base, proxima_etapa: "tr", responsavel_servidor_id: "s", prazo_proxima: "2026-11-06" }),
    ).toMatch(/antes da data/);
    expect(faltaNaProximaAcao({ ...base, proxima_etapa: "tr", responsavel_servidor_id: "s", prazo_proxima: "2026-11-07" })).toBeNull();
  });

  it("encerrado e cancelado não pedem nada", () => {
    expect(faltaNaProximaAcao({ etapa: "encerrado", data: "2026-11-07" })).toBeNull();
  });
});

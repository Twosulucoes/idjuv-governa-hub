import { describe, expect, it } from "vitest";
import { FAIXAS_VENCIMENTO, descricaoVigencia, dentroDoPrazo, diasAte, situacaoVigencia, tomFaixa } from "./vigencia";

const HOJE = "2026-10-27";
const ct = (o: Partial<Parameters<typeof situacaoVigencia>[0]> = {}) => ({
  status: "vigente",
  data_fim: "2027-12-31",
  data_fim_atual: null,
  ...o,
});

describe("diasAte", () => {
  it("conta dias corridos entre datas, sem fuso", () => {
    expect(diasAte("2026-10-27", HOJE)).toBe(0);
    expect(diasAte("2026-10-28", HOJE)).toBe(1);
    expect(diasAte("2026-10-26", HOJE)).toBe(-1);
    expect(diasAte("2027-10-27", HOJE)).toBe(365);
  });
  it("aceita Date como hoje (usa o dia local)", () => {
    expect(diasAte("2026-10-28", new Date(2026, 9, 27, 23, 59))).toBe(1);
  });
});

describe("situacaoVigencia", () => {
  it("rascunho e encerrado não têm prazo", () => {
    expect(situacaoVigencia(ct({ status: "rascunho" }), HOJE)).toEqual({ faixa: "rascunho", dias: null });
    expect(situacaoVigencia(ct({ status: "encerrado" }), HOJE)).toEqual({ faixa: "encerrado", dias: null });
    expect(situacaoVigencia(ct({ status: "rescindido", data_fim: "2026-10-01" }), HOJE)).toEqual({ faixa: "encerrado", dias: null });
  });
  it("usa o fim atual quando existe", () => {
    expect(situacaoVigencia(ct({ data_fim: "2026-10-01", data_fim_atual: "2027-12-31" }), HOJE).faixa).toBe("vigente");
    expect(situacaoVigencia(ct({ data_fim: "2027-12-31", data_fim_atual: "2026-11-10" }), HOJE)).toEqual({ faixa: "ate30", dias: 14 });
  });
  it("vira cada faixa no dia certo", () => {
    const faixa = (fim: string) => situacaoVigencia(ct({ data_fim: fim }), HOJE).faixa;
    expect(faixa("2026-10-26")).toBe("vencido");
    expect(faixa("2026-10-27")).toBe("ate30"); // vence hoje
    expect(faixa("2026-11-26")).toBe("ate30"); // 30 dias
    expect(faixa("2026-11-27")).toBe("ate60"); // 31 dias
    expect(faixa("2026-12-26")).toBe("ate60"); // 60 dias
    expect(faixa("2026-12-27")).toBe("ate90");
    expect(faixa("2027-01-25")).toBe("ate90"); // 90 dias
    expect(faixa("2027-01-26")).toBe("ate120");
    expect(faixa("2027-02-24")).toBe("ate120"); // 120 dias
    expect(faixa("2027-02-25")).toBe("vigente");
  });
  it("suspenso e aditado seguem a data", () => {
    expect(situacaoVigencia(ct({ status: "suspenso", data_fim: "2026-10-20" }), HOJE).faixa).toBe("vencido");
    expect(situacaoVigencia(ct({ status: "aditado", data_fim: "2026-11-01" }), HOJE).faixa).toBe("ate30");
  });
  it("sem data de fim fica vigente sem prazo", () => {
    expect(situacaoVigencia(ct({ data_fim: null }), HOJE)).toEqual({ faixa: "vigente", dias: null });
  });
});

describe("descricaoVigencia e tomFaixa", () => {
  it("texto do selo", () => {
    expect(descricaoVigencia({ faixa: "vencido", dias: -1 })).toBe("Vencido há 1 dia");
    expect(descricaoVigencia({ faixa: "vencido", dias: -12 })).toBe("Vencido há 12 dias");
    expect(descricaoVigencia({ faixa: "ate30", dias: 0 })).toBe("Vence hoje");
    expect(descricaoVigencia({ faixa: "ate30", dias: 1 })).toBe("Vence amanhã");
    expect(descricaoVigencia({ faixa: "ate90", dias: 75 })).toBe("Vence em 75 dias");
    expect(descricaoVigencia({ faixa: "vigente", dias: 400 })).toBe("Vigente");
    expect(descricaoVigencia({ faixa: "rascunho", dias: null })).toBe("Rascunho");
    expect(descricaoVigencia({ faixa: "encerrado", dias: null })).toBe("Encerrado");
  });
  it("tom do selo pela urgência", () => {
    expect(tomFaixa("vencido")).toBe("erro");
    expect(tomFaixa("ate30")).toBe("erro");
    expect(tomFaixa("ate60")).toBe("pendente");
    expect(tomFaixa("ate120")).toBe("andamento");
    expect(tomFaixa("vigente")).toBe("sucesso");
    expect(tomFaixa("encerrado")).toBe("neutro");
  });
});

describe("dentroDoPrazo", () => {
  it("filtro 'vence em até N dias' não pega vencido, encerrado nem rascunho", () => {
    expect(dentroDoPrazo({ faixa: "ate30", dias: 10 }, 30)).toBe(true);
    expect(dentroDoPrazo({ faixa: "ate90", dias: 75 }, 60)).toBe(false);
    expect(dentroDoPrazo({ faixa: "ate90", dias: 75 }, 90)).toBe(true);
    expect(dentroDoPrazo({ faixa: "vencido", dias: -3 }, 120)).toBe(false);
    expect(dentroDoPrazo({ faixa: "encerrado", dias: null }, 120)).toBe(false);
  });
  it("as opções do filtro são os prazos de aviso", () => {
    expect(FAIXAS_VENCIMENTO.map((f) => f.dias)).toEqual([30, 60, 90, 120]);
  });
});

import { describe, expect, it } from "vitest";
import { alertasConvenio, diasAte, espelhoDesatualizado, percentual, rotuloTipoAutor } from "./conveniosFederais";

const hoje = new Date(2026, 9, 29); // 29/10/2026

describe("diasAte", () => {
  it("conta dias corridos e fica negativo depois da data", () => {
    expect(diasAte("2026-12-31", hoje)).toBe(63);
    expect(diasAte("2026-10-29", hoje)).toBe(0);
    expect(diasAte("2026-10-20", hoje)).toBe(-9);
    expect(diasAte(null, hoje)).toBeNull();
    expect(diasAte("lixo", hoje)).toBeNull();
  });
});

describe("alertasConvenio", () => {
  it("convênio real de 29/10: não assinado, vigência e prestação em 31/12 ainda longe do aviso", () => {
    const c = { assinado: false, fim_vigencia: "2026-12-31", data_limite_prestacao_contas: "2026-12-31" };
    expect(alertasConvenio(c, hoje)).toEqual([{ tom: "pendente", texto: "Instrumento ainda não assinado" }]);
  });

  it("avisa a 60 dias, marca vencido como erro e põe o erro primeiro", () => {
    const c = { assinado: true, fim_vigencia: "2026-11-28", data_limite_prestacao_contas: "2026-10-28" };
    expect(alertasConvenio(c, hoje)).toEqual([
      { tom: "erro", texto: "Prestação de contas venceu há 1 dia" },
      { tom: "pendente", texto: "Vigência vence em 30 dias" },
    ]);
    expect(alertasConvenio({ ...c, fim_vigencia: "2026-10-29" }, hoje).map((a) => a.texto)).toEqual([
      "Vigência vence hoje",
      "Prestação de contas venceu há 1 dia",
    ]);
  });

  it("sem convênio ou sem datas não há alerta", () => {
    expect(alertasConvenio(null, hoje)).toEqual([]);
    expect(alertasConvenio({ assinado: null, fim_vigencia: null, data_limite_prestacao_contas: null }, hoje)).toEqual([]);
  });
});

describe("espelhoDesatualizado", () => {
  const agora = new Date("2026-10-29T12:00:00-04:00");
  it("em dia até 3 dias; parado ou nunca rodou é desatualizado", () => {
    expect(espelhoDesatualizado("2026-10-29T09:05:00-04:00", agora)).toBe(false);
    expect(espelhoDesatualizado("2026-10-25T09:05:00-04:00", agora)).toBe(true);
    expect(espelhoDesatualizado(null, agora)).toBe(true);
  });
});

describe("percentual", () => {
  it("arredonda, limita a 100 e devolve null sem total", () => {
    expect(percentual(2450000, 2453000)).toBe(100);
    expect(percentual(1000, 3000)).toBe(33);
    expect(percentual(null, 100)).toBe(0);
    expect(percentual(10, 0)).toBeNull();
  });
});

describe("rotuloTipoAutor", () => {
  it("traduz os tipos conhecidos e deixa o resto legível", () => {
    expect(rotuloTipoAutor("COMISSAO")).toBe("Comissão");
    expect(rotuloTipoAutor("INDIVIDUAL")).toBe("Individual");
    expect(rotuloTipoAutor("OUTRO TIPO")).toBe("Outro tipo");
  });
});

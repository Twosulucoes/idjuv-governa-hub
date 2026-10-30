import { describe, expect, it } from "vitest";
import { alertasConvenio, descreverMudanca, diasAte, espelhoDesatualizado, formatarValorMudanca, percentual, rotuloTipoAutor } from "./conveniosFederais";

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

describe("descreverMudanca", () => {
  const base = { chave: "7AADDI", campo: null, valor_anterior: null, valor_novo: null, dados: null };

  it("campo alterado com rótulo e valor no jeito da tela", () => {
    expect(descreverMudanca({ ...base, entidade: "convenio", tipo: "alterado", campo: "assinado", valor_anterior: "false", valor_novo: "true" }))
      .toBe("Convênio · Assinado: Não → Sim");
    expect(descreverMudanca({ ...base, entidade: "convenio", tipo: "alterado", campo: "fim_vigencia", valor_anterior: "2026-12-31", valor_novo: "2027-06-30" }))
      .toBe("Convênio · Fim da vigência: 31/12/2026 → 30/06/2027");
    expect(descreverMudanca({ ...base, entidade: "convenio", tipo: "alterado", campo: "valor_desembolsado", valor_anterior: null, valor_novo: "1000.5" }))
      .toBe("Convênio · Desembolsado: vazio → R$ 1.000,50");
  });

  it("novo e removido dizem o que é", () => {
    expect(descreverMudanca({ ...base, entidade: "movimento", tipo: "novo", chave: "desembolso:7",
      dados: { tipo: "desembolso", numero: "2026OB1", valor: 2450000 } }))
      .toBe("Desembolso 2026OB1 de R$ 2.450.000,00: novo no Transferegov");
    expect(descreverMudanca({ ...base, entidade: "emenda", tipo: "removido", chave: "2214543:50060001", dados: { numero_emenda: "50060001" } }))
      .toBe("Emenda 50060001: saiu do Transferegov");
  });

  it("campo sem rótulo fica legível", () => {
    expect(formatarValorMudanca("objeto", "Arena")).toBe("Arena");
    expect(descreverMudanca({ ...base, entidade: "proposta", tipo: "alterado", campo: "campo_novo", valor_anterior: "a", valor_novo: "b" }))
      .toBe("Proposta · campo novo: a → b");
  });
});

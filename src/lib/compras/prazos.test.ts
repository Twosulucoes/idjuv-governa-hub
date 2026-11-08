import { describe, expect, it } from "vitest";
import {
  chavePopupPrazos,
  lerAvisos,
  normalizarAvisos,
  prazoUrgente,
  rotuloTipoPrazo,
  situacaoExibida,
  textoAvisos,
  textoMeuPrazo,
  TIPOS_PRAZO_MANUAIS,
} from "./prazos";

describe("avisos", () => {
  it("normaliza como o banco: 1 a 365, sem repetir, do maior para o menor, sempre com o 1", () => {
    expect(normalizarAvisos([2, 30, 2, 0, 400])).toEqual([30, 2, 1]);
    expect(normalizarAvisos([])).toEqual([1]);
  });

  it("lê o texto do campo e recusa o que não é dia", () => {
    expect(lerAvisos("30, 15 7")).toEqual([30, 15, 7, 1]);
    expect(lerAvisos("")).toEqual([1]);
    expect(lerAvisos("5, x")).toBeNull();
    expect(lerAvisos("0")).toBeNull();
    expect(lerAvisos("366")).toBeNull();
    expect(textoAvisos([5, 2])).toBe("5, 2, 1");
  });
});

describe("situação e tipos", () => {
  it("vencido é calculado só para prazo em aberto", () => {
    expect(situacaoExibida("aberto", "2026-11-07", "2026-11-08")).toBe("vencido");
    expect(situacaoExibida("remarcado", "2026-11-07", "2026-11-08")).toBe("vencido");
    expect(situacaoExibida("aberto", "2026-11-08", "2026-11-08")).toBe("aberto");
    expect(situacaoExibida("cumprido", "2026-11-01", "2026-11-08")).toBe("cumprido");
  });

  it("a próxima ação não se lança à mão", () => {
    expect(TIPOS_PRAZO_MANUAIS.map((t): string => t.value)).not.toContain("proxima_acao");
    expect(rotuloTipoPrazo("vigencia_ata")).toBe("Vigência da ata");
    expect(rotuloTipoPrazo("outro")).toBe("outro");
  });
});

describe("pop-up e sino", () => {
  it("texto do item", () => {
    expect(textoMeuPrazo({ categoria: "vencido", dias: -1 })).toBe("venceu ontem");
    expect(textoMeuPrazo({ categoria: "vencido", dias: -4 })).toBe("venceu há 4 dias");
    expect(textoMeuPrazo({ categoria: "proximo", dias: 0 })).toBe("vence hoje");
    expect(textoMeuPrazo({ categoria: "proximo", dias: 3 })).toBe("vence em 3 dias");
    expect(textoMeuPrazo({ categoria: "parado", dias: 20 })).toBe("parado há 20 dias");
  });

  it("dia de aviso não é urgente; a chave muda a cada entrada", () => {
    expect(prazoUrgente({ categoria: "aviso" })).toBe(false);
    expect(prazoUrgente({ categoria: "parado" })).toBe(true);
    expect(chavePopupPrazos("u1", "2026-11-08T10:00:00Z")).not.toBe(chavePopupPrazos("u1", "2026-11-09T08:00:00Z"));
  });
});

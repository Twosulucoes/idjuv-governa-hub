import { describe, expect, it } from "vitest";
import { descricaoPortaria, ordenarPorPapel, periodoDesignacao } from "./responsaveis";

describe("descricaoPortaria", () => {
  it("junta número, data e documento SEI", () => {
    expect(descricaoPortaria({ portaria_numero: "Portaria 10/2026", portaria_data: "2026-01-05", portaria_documento_sei: "12345678" }))
      .toBe("Portaria 10/2026, de 05/01/2026 (SEI 12345678)");
  });
  it("usa só o que houver", () => {
    expect(descricaoPortaria({ portaria_numero: null, portaria_data: null, portaria_documento_sei: "999" })).toBe("SEI 999");
    expect(descricaoPortaria({ portaria_numero: "Portaria 3/2026", portaria_data: null, portaria_documento_sei: null })).toBe("Portaria 3/2026");
    expect(descricaoPortaria({ portaria_numero: null, portaria_data: "2026-01-05", portaria_documento_sei: null })).toBeNull();
  });
});

describe("periodoDesignacao", () => {
  it("em exercício e encerrada", () => {
    expect(periodoDesignacao({ data_inicio: "2026-01-05", data_fim: null, motivo_saida: null })).toBe("desde 05/01/2026");
    expect(periodoDesignacao({ data_inicio: "2026-01-05", data_fim: "2026-06-30", motivo_saida: "substituído" }))
      .toBe("05/01/2026 a 30/06/2026 · substituído");
  });
});

describe("ordenarPorPapel", () => {
  it("gestor antes dos fiscais; no mesmo papel, o mais recente antes", () => {
    const l = [
      { papel: "fiscal_tecnico", data_inicio: "2026-07-01", nome: "C" },
      { papel: "gestor", data_inicio: "2026-01-05", nome: "A" },
      { papel: "fiscal_tecnico", data_inicio: "2026-08-01", nome: "D" },
      { papel: "gestor_substituto", data_inicio: "2026-01-05", nome: "B" },
    ];
    expect(ordenarPorPapel(l).map((r) => r.nome)).toEqual(["A", "B", "D", "C"]);
  });
});

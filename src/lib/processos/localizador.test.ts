import { describe, expect, it } from "vitest";
import { ORIGENS, agruparPorProcesso, resumoDasFontes, type RegistroLocalizado } from "./localizador";

function registro(p: Partial<RegistroLocalizado>): RegistroLocalizado {
  return {
    chave: null,
    numero_sei: null,
    origem: "contratacao",
    registro_id: "id",
    ref: null,
    titulo: null,
    situacao: null,
    onde: null,
    atualizado_em: null,
    valor: null,
    ...p,
  };
}

describe("agruparPorProcesso", () => {
  const linhas = [
    registro({ chave: "000885/26-92", numero_sei: "000885/26-92", origem: "empenho", registro_id: "e1", titulo: "Empenho 1", atualizado_em: "2026-10-20" }),
    registro({ chave: "000885/26-92", numero_sei: "17302.000885/2026.92", origem: "contratacao", registro_id: "c1", titulo: "Água mineral", onde: "CPL", atualizado_em: "2026-10-01" }),
    registro({ chave: "000885/26-92", numero_sei: "000885/26-92", origem: "empenho", registro_id: "e2", titulo: "Empenho 2", atualizado_em: "2026-10-22" }),
    registro({ chave: "000123/26-10", numero_sei: "17302.000123/2026.10", origem: "passagem", registro_id: "p1", titulo: "Viagem", atualizado_em: "2026-09-01" }),
    registro({ chave: null, numero_sei: "sem número", origem: "documento", registro_id: "d1", titulo: "Portaria 1" }),
  ];
  const grupos = agruparPorProcesso(linhas);

  it("junta os registros do mesmo nº, em qualquer formato", () => {
    expect(grupos.map((g) => g.chave)).toEqual(["000885/26-92", "000123/26-10", "documento:d1"]);
    expect(grupos[0].registros.map((r) => r.registro_id)).toEqual(["c1", "e2", "e1"]);
  });

  it("mostra o nº completo, o título do processo e onde ele está", () => {
    expect(grupos[0].numeroSei).toBe("17302.000885/2026.92");
    expect(grupos[0].titulo).toBe("Água mineral");
    expect(grupos[0].onde).toBe("CPL");
    expect(grupos[0].ultimaMovimentacao).toBe("2026-10-22");
  });

  it("resume as fontes do cartão", () => {
    expect(resumoDasFontes(grupos[0].registros)).toBe("1 processo de contratação · 2 empenhos");
  });
});

describe("links dos registros", () => {
  it("leva cada fonte à tela dela", () => {
    expect(ORIGENS.contratacao.link({ registro_id: "x", ref: null })).toBe("/compras/processos/x");
    expect(ORIGENS.pca.link({ registro_id: "x", ref: "2026" })).toBe("/compras/pca/2026");
    expect(ORIGENS.termo_cessao.link({ registro_id: "x", ref: "u1" })).toBe("/unidades/u1");
    expect(ORIGENS.documento.link({ registro_id: "x", ref: "portaria" })).toBe("/gabinete/portarias");
    expect(ORIGENS.documento.link({ registro_id: "x", ref: "memorando" })).toBe("/admin/documentos");
  });
});

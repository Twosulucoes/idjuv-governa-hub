import { describe, expect, it } from "vitest";
import { casarNaturezasDoCatalogo, naturezaUtil, origensPorNatureza } from "./naturezaCatalogo";

const SISTEMA = [
  { id: "tic", codigo: "3.3.90.40" },
  { id: "tic99", codigo: "3.3.90.40.99" },
  { id: "consumo", codigo: "3.3.90.30.00" },
  { id: "terceiros", codigo: "33903900" },
  { id: "permanente", codigo: "4.4.90.52" },
];

describe("naturezaUtil", () => {
  it("aceita código de 8 dígitos com categoria e grupo válidos", () => {
    expect(naturezaUtil("33904099")).toBe(true);
    expect(naturezaUtil("44905228")).toBe(true);
  });
  it("descarta lixo do portal e despesas de exercícios anteriores", () => {
    expect(naturezaUtil("30903030")).toBe(false);
    expect(naturezaUtil("99903007")).toBe(false);
    expect(naturezaUtil("44909202")).toBe(false);
    expect(naturezaUtil("339040")).toBe(false);
  });
});

describe("casarNaturezasDoCatalogo", () => {
  it("casa o subelemento quando o estado tem, senão o elemento", () => {
    const r = casarNaturezasDoCatalogo(
      [
        { codigo: "33904099", nome: "OUTROS SERVICOS DE TIC", ativo: true },
        { codigo: "33903016", nome: null, ativo: true },
      ],
      SISTEMA,
    );
    expect(r).toEqual([
      { id: "tic99", exata: true },
      { id: "consumo", exata: false },
    ]);
  });
  it("ignora inativa, lixo, modalidade que o estado não tem e repetida", () => {
    const r = casarNaturezasDoCatalogo(
      [
        { codigo: "33909285", nome: null, ativo: false },
        { codigo: "30903030", nome: null, ativo: true },
        { codigo: "33914099", nome: null, ativo: true },
        { codigo: "33903994", nome: null, ativo: true },
        { codigo: "33903916", nome: null, ativo: true },
      ],
      SISTEMA,
    );
    expect(r).toEqual([{ id: "terceiros", exata: false }]);
  });
  it("sem nada no catálogo, nenhuma indicação", () => {
    expect(casarNaturezasDoCatalogo([], SISTEMA)).toEqual([]);
  });
});

describe("origensPorNatureza", () => {
  it("a origem mais forte vence e o código casa com o id", () => {
    const r = origensPorNatureza(
      [
        { origem: "catalogo", naturezaId: "terceiros" },
        { origem: "pca", naturezaId: "consumo" },
        { origem: "empenho", naturezaCodigo: "3390.3900" },
        { origem: "ped", naturezaCodigo: "3.3.90.30.00" },
        { origem: "catalogo", naturezaId: "permanente" },
        { origem: "ped", naturezaCodigo: "3.3.90.14" },
      ],
      SISTEMA,
    );
    expect(Object.fromEntries(r)).toEqual({ terceiros: "empenho", consumo: "ped", permanente: "catalogo" });
  });
});

describe("origensPorNatureza com subelemento", () => {
  it("PED em subelemento casa com o elemento do QDD", () => {
    const r = origensPorNatureza([{ origem: "ped", naturezaCodigo: "3.3.90.39.16" }], SISTEMA);
    expect(Object.fromEntries(r)).toEqual({ terceiros: "ped" });
  });
});

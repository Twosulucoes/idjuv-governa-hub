import { describe, expect, it } from "vitest";
import { chaveSei, termoBuscavel } from "./numeroSei";

describe("chaveSei (espelha sei_normalizar do banco)", () => {
  it.each([
    ["17302.000885/2026.92", "000885/26-92"],
    ["17302.000885/2026-92", "000885/26-92"],
    ["000885/26-92", "000885/26-92"],
    [" 17302 . 000885 / 2026 . 92 ", "000885/26-92"],
    ["17302000885202692", "000885/26-92"],
    ["SEI nº 17302.000885/2026.92 (compra de água)", "000885/26-92"],
  ])("%s vira %s", (entrada, esperado) => {
    expect(chaveSei(entrada)).toBe(esperado);
  });

  it.each(["agência", "2026", "", "  "])("%s não é nº SEI", (entrada) => {
    expect(chaveSei(entrada)).toBeNull();
  });

  it("aceita nulo", () => {
    expect(chaveSei(null)).toBeNull();
    expect(chaveSei(undefined)).toBeNull();
  });
});

describe("termoBuscavel", () => {
  it("pede 3 caracteres sem contar espaço", () => {
    expect(termoBuscavel("ág")).toBe(false);
    expect(termoBuscavel("  ág  ")).toBe(false);
    expect(termoBuscavel("água")).toBe(true);
  });
});

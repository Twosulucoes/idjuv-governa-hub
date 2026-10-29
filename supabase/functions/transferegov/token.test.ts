import { describe, expect, it } from "vitest";
import { LIMITES, tokenConfere, validarCarga } from "./token.ts";

const SEGREDO = "a".repeat(40);

describe("tokenConfere", () => {
  it("aceita o token igual ao configurado", async () => {
    expect(await tokenConfere(SEGREDO, SEGREDO)).toBe(true);
  });

  it("recusa token diferente, ausente, ou segredo não configurado ou curto", async () => {
    expect(await tokenConfere("b".repeat(40), SEGREDO)).toBe(false);
    expect(await tokenConfere(null, SEGREDO)).toBe(false);
    expect(await tokenConfere(SEGREDO, undefined)).toBe(false);
    expect(await tokenConfere("curto", "curto")).toBe(false);
  });
});

describe("validarCarga", () => {
  const ok = { cnpj: "12345678000195", data_carga: "2026-10-29T06:31:32-03:00", dados: { propostas: [{ id_proposta: 1 }] } };

  it("aceita o pedido e completa as listas que faltam", () => {
    const r = validarCarga(ok);
    expect("pedido" in r && r.pedido.dados).toEqual({ propostas: [{ id_proposta: 1 }], emendas: [], convenios: [], movimentos: [] });
  });

  it("recusa CNPJ fora do formato, data ilegível, lista que não é lista, linha que não é objeto e excesso de linhas", () => {
    expect(validarCarga({ ...ok, cnpj: "12.345.678/0001-95" })).toEqual({ erro: "CNPJ inválido" });
    expect(validarCarga({ ...ok, data_carga: "ontem" })).toEqual({ erro: "Data da carga inválida" });
    expect(validarCarga({ ...ok, dados: { propostas: {} } })).toEqual({ erro: "propostas não é uma lista" });
    expect(validarCarga({ ...ok, dados: { emendas: ["x"] } })).toEqual({ erro: "emendas: linha inválida" });
    const muitas = Array.from({ length: LIMITES.convenios + 1 }, () => ({}));
    expect(validarCarga({ ...ok, dados: { convenios: muitas } })).toEqual({ erro: `convenios: mais de ${LIMITES.convenios} linhas` });
    expect(validarCarga(null)).toEqual({ erro: "Pedido inválido" });
  });
});

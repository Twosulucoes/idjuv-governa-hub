import { describe, expect, it } from "vitest";
import {
  agenciaValida,
  contaValida,
  documentoValido,
  formatarDocumento,
  mascararDocumento,
  normalizarAgenciaConta,
  tipoPessoaDoDocumento,
} from "./favorecido";

// Documentos fictícios (dígitos verificadores válidos, sem dono)
const CPF = "52998224725";
const CNPJ = "11222333000181";

describe("cadastro do favorecido", () => {
  it("reconhece CPF e CNPJ pelo tamanho", () => {
    expect(tipoPessoaDoDocumento("529.982.247-25")).toBe("PF");
    expect(tipoPessoaDoDocumento("11.222.333/0001-81")).toBe("PJ");
    expect(tipoPessoaDoDocumento("123")).toBeNull();
  });

  it("valida o dígito verificador", () => {
    expect(documentoValido(CPF)).toBe(true);
    expect(documentoValido(CNPJ)).toBe(true);
    expect(documentoValido("52998224726")).toBe(false);
    expect(documentoValido("11111111111")).toBe(false);
  });

  it("formata e mascara o documento", () => {
    expect(formatarDocumento(CPF)).toBe("529.982.247-25");
    expect(formatarDocumento(CNPJ)).toBe("11.222.333/0001-81");
    expect(mascararDocumento("5299822")).toBe("529.982.2");
    expect(mascararDocumento(CNPJ)).toBe("11.222.333/0001-81");
  });

  it("agência e conta seguem a regra da remessa OBN600", () => {
    expect(agenciaValida("3797-4")).toBe(true);
    expect(agenciaValida("0250-x")).toBe(true);
    expect(agenciaValida("12345")).toBe(false);
    expect(contaValida("10050-1")).toBe(true);
    expect(contaValida("208.685-9")).toBe(true);
    expect(contaValida("1234567890")).toBe(false);
    expect(contaValida("0000-0")).toBe(false);
    expect(normalizarAgenciaConta(" 0250-x ")).toBe("0250-X");
  });
});

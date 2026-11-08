import { describe, expect, it } from "vitest";
import { validarEmpenho, validarLiquidacao, validarPagamento } from "./validacaoLancamentos";

describe("validarEmpenho", () => {
  const vazio = { dotacao_id: "", fornecedor_id: "", valor_empenhado: "", objeto: "" };

  it("envio vazio dá uma mensagem por campo obrigatório", () => {
    expect(validarEmpenho(vazio)).toEqual({
      dotacao_id: "Escolha a dotação",
      fornecedor_id: "Escolha o fornecedor ou credor",
      valor_empenhado: "Informe o valor empenhado (maior que zero)",
      objeto: "Descreva o objeto (mínimo de 3 caracteres)",
    });
  });

  it("recusa valor acima do saldo da dotação e aceita o resto", () => {
    const ok = { dotacao_id: "d", fornecedor_id: "f", valor_empenhado: "100", objeto: "Material" };
    expect(validarEmpenho(ok, 100)).toEqual({});
    expect(validarEmpenho({ ...ok, valor_empenhado: "100.01" }, 100)).toEqual({
      valor_empenhado: "Valor acima do saldo disponível da dotação",
    });
    expect(validarEmpenho({ ...ok, valor_empenhado: "0" })).toHaveProperty("valor_empenhado");
  });
});

describe("validarLiquidacao", () => {
  const ok = {
    empenho_id: "e", numero_documento: "123", data_documento: "2026-11-06", valor_documento: "50", valor_liquidado: "50",
    retencao_inss: "", retencao_irrf: "", retencao_iss: "", outras_retencoes: "",
  };

  it("envio vazio aponta empenho, número e valores", () => {
    const erros = validarLiquidacao({ ...ok, empenho_id: "", numero_documento: " ", valor_documento: "", valor_liquidado: "" });
    expect(Object.keys(erros).sort()).toEqual(["empenho_id", "numero_documento", "valor_documento", "valor_liquidado"]);
  });

  it("recusa retenção negativa e valor acima do saldo a liquidar", () => {
    expect(validarLiquidacao(ok, 50)).toEqual({});
    expect(validarLiquidacao({ ...ok, retencao_iss: "-1" })).toEqual({ retencao_iss: "ISS não pode ser negativo" });
    expect(validarLiquidacao({ ...ok, valor_liquidado: "60" }, 50)).toEqual({
      valor_liquidado: "Valor acima do saldo a liquidar do empenho",
    });
  });
});

describe("validarPagamento", () => {
  it("envio vazio aponta liquidação, conta e valor", () => {
    expect(validarPagamento({ liquidacao_id: "", conta_bancaria_id: "", valor_bruto: "", valor_retencoes: "" })).toEqual({
      liquidacao_id: "Escolha a liquidação aprovada",
      conta_bancaria_id: "Escolha a conta de saída",
      valor_bruto: "Informe o valor bruto (maior que zero)",
    });
  });

  it("retenções não passam do bruto", () => {
    const ok = { liquidacao_id: "l", conta_bancaria_id: "c", valor_bruto: "100", valor_retencoes: "10" };
    expect(validarPagamento(ok)).toEqual({});
    expect(validarPagamento({ ...ok, valor_retencoes: "101" })).toEqual({ valor_retencoes: "Retenções maiores que o valor bruto" });
  });
});

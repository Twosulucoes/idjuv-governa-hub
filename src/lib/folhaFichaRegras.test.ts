import { describe, expect, it } from "vitest";
import {
  baseMargemConsignavel,
  consignacaoJaLancada,
  descricaoConsignacaoNaFicha,
  type ConsignacaoParaMargem,
  type ItemParaReferencia,
} from "./folhaFichaRegras";

const consignacao: ConsignacaoParaMargem = {
  id: "c1",
  numero_contrato: "CT-2026/0042",
  consignataria_nome: "Banco Exemplo S.A.",
  valor_parcela: 350,
  ativo: true,
  suspenso: false,
  quitado: false,
};

// Como o cálculo da folha (folha_montar_ficha) grava a parcela: descrição com a consignatária, referência "n/total".
const itemDoCalculo: ItemParaReferencia = {
  tipo: "desconto",
  referencia: "3/24",
  descricao: "Consignação — Banco Exemplo S.A.",
  valor: 350,
};

// Como o botão "Lançar na ficha" grava: referência = número do contrato.
const itemManual: ItemParaReferencia = {
  tipo: "desconto",
  referencia: "CT-2026/0042",
  descricao: "Empréstimo - Banco Exemplo S.A.",
  valor: 350,
};

describe("consignacaoJaLancada", () => {
  it("reconhece a parcela lançada pelo cálculo da folha", () => {
    expect(consignacaoJaLancada([itemDoCalculo], consignacao)).toBe(true);
  });

  it("reconhece a parcela lançada à mão pelo número do contrato", () => {
    expect(consignacaoJaLancada([itemManual], consignacao)).toBe(true);
  });

  it("não confunde com outra consignatária nem com provento", () => {
    const outra = { ...itemDoCalculo, descricao: descricaoConsignacaoNaFicha("Outro Banco") };
    const provento = { ...itemDoCalculo, tipo: "provento" };
    expect(consignacaoJaLancada([outra, provento], consignacao)).toBe(false);
  });

  it("sem contrato nem consignatária não acusa lançamento", () => {
    expect(consignacaoJaLancada([itemDoCalculo], { numero_contrato: null, consignataria_nome: null })).toBe(false);
  });
});

describe("baseMargemConsignavel", () => {
  it("devolve à base a parcela lançada pelo cálculo da folha", () => {
    expect(baseMargemConsignavel(4650, [itemDoCalculo], [consignacao])).toBe(5000);
  });

  it("não devolve desconto que não é de consignação", () => {
    const inss = { tipo: "desconto", referencia: null, descricao: "INSS", valor: 600 };
    expect(baseMargemConsignavel(4650, [itemDoCalculo, inss], [consignacao])).toBe(5000);
  });
});

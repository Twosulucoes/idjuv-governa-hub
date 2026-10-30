import { describe, expect, it } from "vitest";
import { interpretarDiariasFiplan, paraContratoDiaria } from "./diariasFiplanParser";

// Dados fictícios no formato do FIP 002 – Demonstrativo de Diárias do FIPLAN
const GRUPOS = ["CREDOR", "", "", "", "DOCUMENTO", "", "", "", "", "", "", "", "PERÍODO VIAGEM", "", "ORDEM SERVIÇO", ""];
const CABECALHO = [
  "CÓDIGO", "NOME", "QTD", "PROC", "TIPO", "DATA", "NÚMERO", "VALOR", "LIQ", "VALOR", "NOB", "DT NOB", "SAÍDA", "RETORNO",
  "Nº OS", "PC",
];

function diaria(over: Partial<Record<string, string>> = {}): string[] {
  const v: Record<string, string> = {
    cod: "2099000001", nome: "Servidora de Teste", qtd: "2.5", proc: "000764", data: "16/09/2099",
    emp: "99999000199001077", valor: "300,00", liq: "99999000199001618", vliq: "300,00", nob: "99999000199001807",
    dtnob: "08/10/2099", saida: "04/06/2099", retorno: "06/06/2099", os: "99999000199000791", pc: "Não", ...over,
  };
  return [v.cod, v.nome, v.qtd, v.proc, "EMP", v.data, v.emp, v.valor, v.liq, v.vliq, v.nob, v.dtnob, v.saida, v.retorno,
    v.os, v.pc];
}

const relatorio = (linhas: string[][], total = "") => [
  ["FIPLAN"], GRUPOS, CABECALHO, ...linhas, [""], ["TOTAL UO:99999 - R$", total, ""],
];

const erros = (r: ReturnType<typeof interpretarDiariasFiplan>) => r.problemas.filter((p) => p.gravidade === "erro").map((p) => p.mensagem);
const avisos = (r: ReturnType<typeof interpretarDiariasFiplan>) => r.problemas.filter((p) => p.gravidade === "aviso").map((p) => p.mensagem);

describe("interpretarDiariasFiplan", () => {
  it("lê cada diária com os documentos, o período e a prestação de contas", () => {
    const r = interpretarDiariasFiplan(relatorio([
      diaria(),
      diaria({ cod: "2099000002", nome: "Outro Servidor", qtd: "9", emp: "99999000199001581", valor: "1.080,00", vliq: "1.080,00", pc: "Sim" }),
    ], "1.380,00"));
    expect(r.problemas).toEqual([]);
    expect(r.parametros).toEqual({ exercicio: 2099 });
    expect(r.cabecalho).toMatchObject({ Exercício: "2099", Servidores: "2" });
    expect(r.cabecalho["Sem prestação de contas"]).toMatch(/^1 \(R\$\s300,00\)$/);
    expect(r.linhas).toHaveLength(2);
    expect(r.linhas[0]).toEqual({
      indice: 0,
      empenho_numero: "99999000199001077",
      credor_codigo: "2099000001",
      credor_nome: "Servidora de Teste",
      quantidade: 2.5,
      processo_fiplan: "000764",
      data_empenho: "2099-09-16",
      valor_empenhado: 300,
      liquidacao_numero: "99999000199001618",
      valor_liquidado: 300,
      nob_numero: "99999000199001807",
      data_pagamento: "2099-10-08",
      data_saida: "2099-06-04",
      data_retorno: "2099-06-06",
      ordem_servico: "99999000199000791",
      prestou_contas: false,
      linhaPlanilha: 4,
    });
    expect(r.linhas[1]).toMatchObject({ quantidade: 9, valor_empenhado: 1080, prestou_contas: true });
    expect(paraContratoDiaria(r.linhas[0])).not.toHaveProperty("linhaPlanilha");
  });

  it("recusa arquivo de outro relatório", () => {
    const r = interpretarDiariasFiplan([["Consultar Pedido de Empenho da Despesa (PED)"], ["Exercício", "Nº PED"]]);
    expect(erros(r)[0]).toMatch(/não é o FIP 002/);
    expect(r.linhas).toEqual([]);
  });

  it("avisa quando o total do rodapé não bate com as linhas", () => {
    const r = interpretarDiariasFiplan(relatorio([diaria()], "999,00"));
    expect(avisos(r)[0]).toMatch(/total do rodapé/);
  });

  it("recusa empenho de outro exercício e número fora do padrão", () => {
    const r = interpretarDiariasFiplan(relatorio([
      diaria(),
      diaria({ emp: "99999000198000001" }),
      diaria({ emp: "123" }),
    ]));
    expect(erros(r)).toHaveLength(2);
    expect(erros(r)[0]).toMatch(/é de 2098/);
    expect(erros(r)[1]).toMatch(/fora do padrão/);
    expect(r.linhas).toHaveLength(1);
  });

  it("recusa quantidade e valor inválidos e avisa PC desconhecida", () => {
    const r = interpretarDiariasFiplan(relatorio([
      diaria({ qtd: "dois" }),
      diaria({ emp: "99999000199000002", valor: "R$ 10" }),
      diaria({ emp: "99999000199000003", pc: "" }),
    ]));
    expect(erros(r)).toHaveLength(2);
    expect(avisos(r)[0]).toMatch(/lida como "Não"/);
    expect(r.linhas[0].prestou_contas).toBe(false);
  });

  it("diz quando o relatório não tem diárias", () => {
    expect(erros(interpretarDiariasFiplan(relatorio([])))[0]).toMatch(/nenhuma diária/);
  });
});

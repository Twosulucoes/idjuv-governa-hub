import { describe, expect, it } from "vitest";
import { interpretarClassificadoresFiplan, tipoPeloTitulo } from "./classificadoresFiplanParser";

/** Consulta como o FIPLAN exporta: linhas em branco, título, critérios, cabeçalho e dados. */
function consulta(titulo: string, cabecalho: string[], linhas: string[][], criterio = "*Exercício igual a 2026") {
  const branco = cabecalho.map(() => "");
  return [branco, branco, [titulo, ...branco.slice(1)], ["Crit˜rios utilizados na consulta:"], [criterio], branco, cabecalho, ...linhas];
}

const CAB_FONTE = ["Exercício", "Fonte", "Nome da Fonte de Recurso", "Nome Resumido", "Vinculada", "Situação"];
const CAB_SUB = ["Exercício", "Elemento", "Subelemento", "Nome Subelemento", "Nome Resumido", "Situação"];

describe("tipoPeloTitulo", () => {
  it("reconhece as seis consultas, com ou sem acento", () => {
    expect(tipoPeloTitulo("Consultar Fonte de Recurso")).toBe("fonte");
    expect(tipoPeloTitulo("Consultar Funcao de Governo")).toBe("funcao");
    expect(tipoPeloTitulo("Consultar Subelemento da Despesa")).toBe("subelemento");
    expect(tipoPeloTitulo("Consultar Finalidade de Pagamento")).toBe("finalidade_pagamento");
    expect(tipoPeloTitulo("Consultar Rubricas")).toBeUndefined();
    expect(tipoPeloTitulo("Fonte de Recurso")).toBeUndefined();
  });
});

describe("interpretarClassificadoresFiplan", () => {
  it("lê fontes com exercício, situação, nome resumido e as outras colunas", () => {
    const r = interpretarClassificadoresFiplan(
      consulta("Consultar Fonte de Recurso", CAB_FONTE, [
        ["2026", "1.500", "Recursos não Vinculados de Impostos", "RNVI", "Não", "Ativo"],
        ["2026", "0.102", "IRRF", "", "", "Inativo"],
      ]),
    );
    expect(r.problemas).toEqual([]);
    expect(r.parametros).toEqual({ tipo: "fonte", exercicio: 2026 });
    expect(r.cabecalho.Tabela).toBe("Fonte de Recurso");
    expect(r.linhas).toEqual([
      { codigo: "1.500", nome: "Recursos não Vinculados de Impostos", nome_resumido: "RNVI", ativo: true, atributos: { vinculada: "Não" } },
      { codigo: "0.102", nome: "IRRF", nome_resumido: null, ativo: false, atributos: {} },
    ]);
  });

  it("monta o código do subelemento e pula o cabeçalho repetido e o aviso de continuação", () => {
    const r = interpretarClassificadoresFiplan(
      consulta("Consultar Subelemento da Despesa", CAB_SUB, [
        ["2026", "14", "01", "DIÁRIAS DENTRO DO ESTADO", "", "Ativo"],
        ["", "Continua na pr˜xima planilha...", "", "", "", ""],
        ["Consultar Subelemento da Despesa", "", "", "", "", ""],
        ["*Exercício igual a 2026", "", "", "", "", ""],
        CAB_SUB,
        ["2026", "14", "02", "DIÁRIAS FORA DO ESTADO", "", "Ativo"],
      ]),
    );
    expect(r.problemas).toEqual([]);
    expect(r.linhas.map((l) => l.codigo)).toEqual(["14.01", "14.02"]);
  });

  it("não guarda nome do responsável nem CPF", () => {
    const r = interpretarClassificadoresFiplan(
      consulta("Consultar Programa de Governo", ["Exercício", "Programa", "Nome do Programa", "Nome do Responsável", "CPF", "Abrangência"], [
        ["2026", "030", "Desenvolvimento do Desporto e do Lazer", "Fulano de Tal", "000.000.000-00", "Setorial"],
      ]),
    );
    expect(r.linhas[0].atributos).toEqual({ abrangencia: "Setorial" });
  });

  it("célula numérica volta ao formato do FIPLAN", () => {
    const fonte = interpretarClassificadoresFiplan(
      consulta("Consultar Fonte de Recurso", CAB_FONTE, [["2026", 1.5 as unknown as string, "RNVI", "", "", "Ativo"]]),
    );
    expect(fonte.linhas.map((l) => l.codigo)).toEqual(["1.500"]);
    const sub = interpretarClassificadoresFiplan(
      consulta("Consultar Subelemento da Despesa", CAB_SUB, [["2026", 39 as unknown as string, 1 as unknown as string, "X", "", "Ativo"]]),
    );
    expect(sub.linhas.map((l) => l.codigo)).toEqual(["39.01"]);
  });

  it("aponta código fora do padrão e repetido", () => {
    const r = interpretarClassificadoresFiplan(
      consulta("Consultar Fonte de Recurso", CAB_FONTE, [
        ["2026", "1500", "Sem ponto", "", "", "Ativo"],
        ["2026", "1.500", "Certa", "", "", "Ativo"],
        ["2026", "1.500", "De novo", "", "", "Ativo"],
      ]),
    );
    expect(r.linhas).toHaveLength(1);
    expect(r.problemas.map((p) => p.mensagem)).toEqual([
      'Linha 8: código "1500" ou nome fora do padrão.',
      "Linha 10: código 1.500 repetido (já na linha 9).",
    ]);
  });

  it("recusa planilha com dois exercícios e tabela que não é das aceitas", () => {
    const misto = interpretarClassificadoresFiplan(
      consulta("Consultar Fonte de Recurso", CAB_FONTE, [["2025", "1.500", "Fonte", "", "", "Ativo"]]),
    );
    expect(misto.linhas).toEqual([]);
    expect(misto.problemas[0].mensagem).toMatch(/mistura exercícios/);

    const outra = interpretarClassificadoresFiplan(consulta("Consultar Rubricas", ["Exercício", "Rubrica"], [["2026", "0002"]]));
    expect(outra.problemas[0]).toMatchObject({ gravidade: "erro" });
    expect(outra.problemas[0].mensagem).toMatch(/não é uma das tabelas aceitas/);
  });

  it("finalidade sem exercício na planilha usa o ano corrente com aviso", () => {
    const r = interpretarClassificadoresFiplan(
      consulta(
        "Consultar Finalidade de Pagamento",
        ["Código da Finalidade de Pagamento", "Nome da Finalidade de Pagamento"],
        [["0", "Obrigações Patronais"]],
        "",
      ),
      2027,
    );
    expect(r.parametros).toEqual({ tipo: "finalidade_pagamento", exercicio: 2027 });
    expect(r.problemas).toEqual([{ gravidade: "aviso", mensagem: "A planilha não diz o exercício; será gravada como 2027." }]);
  });
});

import { describe, expect, it } from "vitest";
import {
  casarOcupantes,
  casarUnidade,
  interpretarOcupantes,
  lerOcupantes,
  normalizarNome,
  paraContratoOcupante,
  semelhanca,
} from "./cargosOcupantesParser";

// Dados fictícios (nomes inventados).
const cabecalho = ["CARGO", "CODIGO", "VALOR", "NOME DO OCUPANTE", "MUNIC.", "LOCAL"];
const planilha = {
  ativos: [
    cabecalho,
    ["CHEFE DE NUCLEO", "CDS-I", 3578.06985, "MARIA DE TESTE SILVA", "BV", "DIRAF/NUCLEO DE PESSOAL"],
    ["CHEFE DE DIVISAO", "CNES-III", 5742.8, "JOSE FICTICIO SOUSA", "BV", "DIESP/DIVISAO DEGESTAO INCLUSIVA"],
    ["CHEFE DE UNIDADE LOCAL", "CDS-II", 2871.43, "ANA  EXEMPLO", "CA", "PRESIDENCIA"],
    ["", "", "", "", "", ""],
  ],
  inativos: [["PORTARIA", "NOME"], ["001/2026", "OUTRA PESSOA"]],
};

const servidores = [
  { id: "s1", nome: "Maria de Teste Silva" },
  { id: "s2", nome: "José Fictício Souza" },
  { id: "s3", nome: "Ana Exemplo" },
  { id: "s4", nome: "Pedro Qualquer" },
];
const unidades = [
  { id: "u1", nome: "Núcleo de Pessoal", sigla: "NUPES" },
  { id: "u2", nome: "Divisão de Gestão Inclusiva", sigla: null },
  { id: "u3", nome: "Presidência", sigla: "PRES" },
  { id: "u4", nome: "Núcleo de Programação", sigla: null },
  { id: "u5", nome: "Núcleo de Programação Orçamentária", sigla: null },
];

describe("normalizarNome e semelhanca", () => {
  it("tira acento, pontuação e espaço repetido", () => {
    expect(normalizarNome("  José  de Souza-Lima ")).toBe("JOSE DE SOUZA LIMA");
  });
  it("mede de 0 a 1", () => {
    expect(semelhanca("SOUSA", "SOUSA")).toBe(1);
    expect(semelhanca("SOUSA", "SOUZA")).toBeCloseTo(0.8);
    expect(semelhanca("", "X")).toBe(0);
  });
});

describe("interpretarOcupantes", () => {
  it("lê a aba ativos e ignora linha vazia", () => {
    const r = interpretarOcupantes(planilha);
    expect(r.aba).toBe("ativos");
    expect(r.linhas).toHaveLength(3);
    expect(r.linhas[0]).toMatchObject({
      linhaPlanilha: 2, cargo: "CHEFE DE NUCLEO", simbolo: "CDS-I", nomePlanilha: "MARIA DE TESTE SILVA",
      municipio: "BV", local: "DIRAF/NUCLEO DE PESSOAL",
    });
    expect(r.linhas[2].nomePlanilha).toBe("ANA EXEMPLO");
  });
  it("recusa planilha sem as colunas", () => {
    expect(() => interpretarOcupantes({ Planilha1: [["A", "B"], ["1", "2"]] })).toThrow(/CARGO e NOME DO OCUPANTE/);
  });
  it("avisa linha sem nome", () => {
    const r = interpretarOcupantes({ ativos: [cabecalho, ["DIRETOR", "SUBSIDIO", 1, "", "BV", "PRESIDENCIA"],
      ["DIRETOR", "SUBSIDIO", 1, "ANA EXEMPLO", "BV", "PRESIDENCIA"]] });
    expect(r.linhas).toHaveLength(1);
    expect(r.problemas[0]).toMatchObject({ gravidade: "aviso" });
  });
});

describe("casarUnidade", () => {
  it("casa pela parte depois da barra, com palavra grudada", () => {
    expect(casarUnidade("DIRAF/NUCLEO DE PESSOAL", unidades)?.id).toBe("u1");
    expect(casarUnidade("DIESP/DIVISAO DEGESTAO INCLUSIVA", unidades)?.id).toBe("u2");
    expect(casarUnidade("PRESIDENCIA", unidades)?.id).toBe("u3");
    expect(casarUnidade("PRES", unidades)?.id).toBe("u3");
  });
  it("casa nome abreviado quando todas as palavras estão numa só unidade", () => {
    const comLongo = [...unidades, { id: "u6", nome: "Divisão Administrativa e Gestão Patrimonial", sigla: "DiAGP" }];
    expect(casarUnidade("DIRAF/DIVISAO ADMINISTRATIVA E PATRIMONIAL", comLongo)?.id).toBe("u6");
    expect(casarUnidade("DIRAF/NUCLEO DE PROGRAMAS", comLongo)).toBeNull();
  });
  it("não confunde nomes parecidos nem inventa unidade", () => {
    expect(casarUnidade("DIRAF/NUCLEO DE PROGRAMAÇAO", unidades)?.id).toBe("u4");
    expect(casarUnidade("DIRAF/NUCLEO DE PROGRAMAÇAO ORÇAMENTARIA", unidades)?.id).toBe("u5");
    expect(casarUnidade("UNIDADE LOCAL DE CARACARAI", unidades)).toBeNull();
  });
});

describe("casarOcupantes", () => {
  it("casa nome igual, nome parecido (com aviso) e a lotação", () => {
    const r = casarOcupantes(interpretarOcupantes(planilha).linhas, servidores, unidades);
    expect(r.linhas.map((l) => l.servidorId)).toEqual(["s1", "s2", "s3"]);
    expect(r.linhas[0].semelhanca).toBe(1);
    expect(r.linhas[1].semelhanca).toBeLessThan(1);
    expect(r.linhas.map((l) => l.unidadeId)).toEqual(["u1", "u2", "u3"]);
    expect(r.problemas).toHaveLength(1);
    expect(r.problemas[0]).toMatchObject({ gravidade: "aviso", linha: 1 });
  });
  it("nome sem parecido seguro vira erro", () => {
    const lidas = interpretarOcupantes({ ativos: [cabecalho, ["DIRETOR", "SUBSIDIO", 1, "FULANO DESCONHECIDO", "BV", ""]] }).linhas;
    const r = casarOcupantes(lidas, servidores, unidades);
    expect(r.linhas[0].servidorId).toBeNull();
    expect(r.problemas[0]).toMatchObject({ gravidade: "erro" });
  });
  it("mesma pessoa em duas linhas e nome duplicado no cadastro viram erro", () => {
    const lidas = interpretarOcupantes({ ativos: [cabecalho,
      ["DIRETOR", "SUBSIDIO", 1, "ANA EXEMPLO", "BV", ""], ["PREGOEIRO", "CNES-III", 1, "ANA EXEMPLO", "BV", ""]] }).linhas;
    expect(casarOcupantes(lidas, servidores, unidades).problemas.filter((p) => p.gravidade === "erro")).toHaveLength(1);
    const duplicados = [...servidores, { id: "s5", nome: "ANA EXEMPLO" }];
    expect(casarOcupantes(lidas.slice(0, 1), duplicados, unidades).problemas[0].mensagem).toMatch(/2 servidores/);
  });
  it("lotação fora da estrutura é aviso e o cargo entra", () => {
    const lidas = interpretarOcupantes({ ativos: [cabecalho, ["CHEFE", "CDS-II", 1, "ANA EXEMPLO", "BV", "UNIDADE LOCAL X"]] }).linhas;
    const r = casarOcupantes(lidas, servidores, unidades);
    expect(r.linhas[0]).toMatchObject({ servidorId: "s3", unidadeId: null });
    expect(r.problemas[0]).toMatchObject({ gravidade: "aviso" });
  });
});

describe("lerOcupantes e contrato", () => {
  it("resume no cabeçalho e não manda o nome ao banco", () => {
    const r = lerOcupantes(planilha, servidores, unidades);
    expect(r.cabecalho).toMatchObject({ Ocupantes: "3", "Nome casado por semelhança": "1", "Sem lotação na estrutura": "0" });
    const contrato = paraContratoOcupante(r.linhas[0], 0);
    expect(contrato).toEqual({ indice: 0, linha: 2, servidor_id: "s1", cargo: "CHEFE DE NUCLEO", simbolo: "CDS-I",
      unidade_id: "u1", municipio: "BV", local: "DIRAF/NUCLEO DE PESSOAL" });
  });
});

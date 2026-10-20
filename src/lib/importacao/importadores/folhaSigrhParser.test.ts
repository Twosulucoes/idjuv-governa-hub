import { describe, expect, it } from "vitest";
import type { LinhaPdf, TrechoPdf } from "../pdfTexto";
import {
  competenciaDoNomeArquivo,
  interpretarAnaliticaSigrh,
  interpretarConferenciaSigrh,
  interpretarFpag10,
  interpretarPdfSigrh,
  paraCentavos,
  paraContratoFolhaSigrh,
} from "./folhaSigrhParser";

// Dados fictícios. Cada trecho: [texto, x]; o xFim é estimado em 5 pt por caractere.
type T = [string, number];
let y = 0;
const linha = (...trechos: T[]): LinhaPdf => {
  y += 10;
  return {
    pagina: 1,
    y,
    trechos: trechos.map(([texto, x]): TrechoPdf => ({ texto, x, xFim: x + texto.length * 5, y, pagina: 1 })),
  };
};

const cabecalhoFpag10 = () => [
  linha(["INSTITUTO FICTICIO", 28]),
  linha(["Folha de Pagamento - Referencia : 06/2026", 28]),
  linha(["Folha de Analítica por Funcionário - FPAG10", 28]),
  // Qtde/Valor alinhados à direita: termina em 227 e 295 (proventos), 502 e 570 (descontos)
  linha(["Provento", 28], ["Qtde", 207], ["Valor", 270], ["Desconto", 302], ["Qtde", 482], ["Valor", 545]),
];

describe("paraCentavos", () => {
  it("lê número brasileiro, número da planilha e recusa texto", () => {
    expect(paraCentavos("3.578,08")).toBe(357808);
    expect(paraCentavos("1073,42")).toBe(107342);
    expect(paraCentavos(2010)).toBe(201000);
    expect(paraCentavos("R$ 471.243,00")).toBe(47124300);
    expect(paraCentavos("1234.56")).toBe(123456);
    expect(paraCentavos("1.234")).toBe(123400);
    expect(paraCentavos("INSS")).toBeNull();
    expect(paraCentavos("")).toBeNull();
  });
});

describe("competenciaDoNomeArquivo", () => {
  it("acha o mês por extenso e o ano no nome", () => {
    expect(competenciaDoNomeArquivo("IDJUV-FoPag04-SETEMBRO-26-FOLHA MENSAL.xlsx", 2025)).toEqual({ mes: 9, ano: 2026, anoDeduzido: false });
    expect(competenciaDoNomeArquivo("ESPELHO_MARÇO_2026.xlsx", 2025)).toEqual({ mes: 3, ano: 2026, anoDeduzido: false });
    expect(competenciaDoNomeArquivo("espelho 04-2026.xlsx", 2025)).toEqual({ mes: 4, ano: 2026, anoDeduzido: false });
  });
  it("sem ano usa o padrão e avisa; sem mês devolve null", () => {
    expect(competenciaDoNomeArquivo("FOLHA_ESPELHO DEFINITIVO_ABRIL.xlsx", 2026)).toEqual({ mes: 4, ano: 2026, anoDeduzido: true });
    expect(competenciaDoNomeArquivo("folha.xlsx", 2026)).toBeNull();
  });
});

describe("interpretarFpag10", () => {
  const servidor = (nomeacao: string, cpf: string, nome: string, funcao: string) =>
    linha([nomeacao, 28], [`${cpf} ${nome}`, 77], [funcao, 315], ["001/04263/12345X", 450], ["Dep IR 1", 531]);

  const espelho = () => [
    ...cabecalhoFpag10(),
    linha(["01.94", 28], ["INSTITUTO FICTICIO", 77]),
    servidor("026110001", "11111111111", "MARIA FICTICIA", "CHEFE DE NUCLEO"),
    linha(["VENCIMENTO COMISSIONADO", 28], ["30,00", 203], ["3.578,08", 257], ["INSS", 302], ["12,00", 477], ["317,95", 540]),
    linha(["DIF DE VENCIMENTO (202602)", 28], ["1,00", 208], ["79,99", 270], ["INSS (202602)", 302], ["7,50", 482], ["5,99", 545]),
    linha(["--------------", 230], ["--------------", 504]),
    linha(["Total Liquido =", 28], ["3.334,13", 136], ["3.658,07", 257], ["323,94", 540]),
    servidor("026110002", "22222222222", "JOAO FICTICIO", "DIRETOR"),
    // IRRF de quem fica isento: só a alíquota, na coluna Qtde, sem valor
    linha(["SUBSIDIO", 28], ["30,00", 203], ["24.829,00", 252], ["IRRF", 302], ["22,50", 477]),
    linha(["Total Liquido =", 28], ["24.829,00", 131], ["24.829,00", 252], ["0,00", 550]),
    linha(["Total INSTITUTO FICTICIO", 28]),
    linha(["Total Liquido =", 28], ["28.163,13", 131], ["28.487,07", 252], ["323,94", 540]),
    linha(["Resumo INSTITUTO FICTICIO", 28]),
    linha(["0002 VENCIMENTO COMISSIONADO", 28], ["1", 200], ["3.578,08", 257]),
  ];

  it("lê servidores, rubricas das duas colunas, retroativos e confere os totais", () => {
    const r = interpretarFpag10(espelho());
    expect(r.problemas.filter((p) => p.gravidade === "erro")).toEqual([]);
    expect(r.parametros).toEqual({ ano: 2026, mes: 6, formato: "fpag10" });
    expect(r.cabecalho.Conferência).toBe("bate com o total impresso");
    const joao = r.linhas.find((l) => l.nome === "JOAO FICTICIO")!;
    expect(joao.itens).toHaveLength(1);
    const maria = r.linhas.find((l) => l.nome === "MARIA FICTICIA")!;
    expect(maria).toMatchObject({
      cpf: "11111111111",
      matriculas: ["026110001"],
      funcao: "CHEFE DE NUCLEO",
      bancoCodigo: "001",
      bancoAgencia: "04263",
      bancoConta: "12345X",
      dependentesIr: 1,
      proventos: 365807,
      descontos: 32394,
    });
    expect(maria.itens[1]).toEqual({
      codigo: null, descricao: "INSS", tipo: "desconto", quantidade: "12,00", competencia: null, centavos: 31795,
    });
    expect(maria.itens[2]).toMatchObject({ descricao: "DIF DE VENCIMENTO", competencia: "2026-02", centavos: 7999 });
  });

  it("reprova quando a soma não bate com o total impresso do servidor", () => {
    const linhas = espelho();
    // some a linha da diferença de vencimento de Maria
    const r = interpretarFpag10(linhas.filter((l) => l.trechos[0].texto !== "DIF DE VENCIMENTO (202602)"));
    const erros = r.problemas.filter((p) => p.gravidade === "erro").map((p) => p.mensagem);
    expect(erros.some((m) => m.startsWith("MARIA FICTICIA"))).toBe(true);
    expect(erros.some((m) => m.includes("total do órgão"))).toBe(true);
  });

  it("detecta o formato pelo título", () => {
    expect(interpretarPdfSigrh(espelho()).parametros.formato).toBe("fpag10");
    expect(interpretarPdfSigrh([linha(["Outro relatório", 10])]).problemas[0].gravidade).toBe("erro");
  });
});

describe("interpretarConferenciaSigrh", () => {
  const servidor = (mat: string, nome: string, cpf: string) =>
    linha([mat, 2], [nome, 75], ["IDJUV", 341], ["CDS/01", 427], ["01/05/2026", 470], [cpf, 597], ["001", 673], ["4263-3", 705], ["Corrente", 749], ["79750-2", 800]);

  it("junta os vínculos do mesmo CPF numa ficha e ignora informativos", () => {
    const r = interpretarConferenciaSigrh([
      linha(["Relatório analítico de conferência de folha", 652]),
      linha(["Competência: 09/2026", 11], ["Tipo da folha: FOLHA NORMAL", 198]),
      servidor("0177165-5-01", "MARIA F. FICTICIA", "111.111.111-11"),
      linha(["Código", 170], ["Descrição da rubrica", 222], ["Parcela", 426], ["Índice", 500], ["Valor", 571]),
      linha(["01-0002-01", 170], ["VENCIMENTO COMISSIONADO", 222], ["3.578,07", 563]),
      linha(["05-0003-01", 170], ["INSS", 222], ["12", 465], ["317,95", 569]),
      linha(["Provento: 3.578,07", 170], ["Desconto: 317,95", 349], ["Líquido: 3.260,12", 527]),
      servidor("0177165-5-02", "MARIA F. FICTICIA", "111.111.111-11"),
      linha(["01-0123-01", 170], ["ADICIONAL SUBSTITUICAO", 222], ["1.000,00", 563]),
      linha(["09-0903-01", 170], ["SALARIO CONTR.INSS", 222], ["4.578,07", 563]),
      linha(["Provento: 1.000,00", 170], ["Desconto: 0,00", 349], ["Líquido: 1.000,00", 527]),
      linha(["Total de servidores geral: 2", 10]),
      linha(["Total de proventos geral: R$ 4.578,07", 10]),
      linha(["Total de descontos geral: R$ 317,95", 10]),
    ]);
    expect(r.problemas.filter((p) => p.gravidade === "erro")).toEqual([]);
    expect(r.linhas).toHaveLength(1);
    expect(r.linhas[0]).toMatchObject({
      cpf: "11111111111",
      matriculas: ["0177165-5-01", "0177165-5-02"],
      proventos: 457807,
      descontos: 31795,
      bancoAgencia: "4263-3",
      bancoConta: "79750-2",
    });
    expect(r.linhas[0].itens.map((i) => i.codigo)).toEqual(["01-0002", "05-0003", "01-0123"]);
    expect(r.problemas.map((p) => p.mensagem).join(" ")).toContain("informativas");
    expect(r.parametros).toEqual({ ano: 2026, mes: 9, formato: "conferencia" });
  });
});

describe("interpretarAnaliticaSigrh", () => {
  const linhaPlanilha = (evento: string, tp: string, valor: unknown, extra: Record<string, unknown> = {}) => ({
    CdNomeacao: 26110196, CPF: 1234567890, NmFuncionario: "ANA FICTICIA ", NmFuncao: "SECRETARIA",
    CdBanco: 1, CdAgencia: 4263, CdConta: 797502, CdEvento: 2, NmEvento: evento, TpEvento: tp,
    Qtde: 9, Valor: valor, DependenteIR: 0, AnoMesReferencia: "", ...extra,
  });

  it("monta a ficha por servidor, com CPF de 11 dígitos e retroativo", () => {
    const r = interpretarAnaliticaSigrh(
      [
        linhaPlanilha("VENCIMENTO COMISSIONADO", "P", "1073,42"),
        linhaPlanilha("DIAS TRABALHADOS INF", "P", 2010, { AnoMesReferencia: 202604 }),
        linhaPlanilha("INSS", "D", "80,5", { Qtde: "7,5" }),
      ],
      "ESPELHO_MAIO.xlsx",
      2026,
    );
    expect(r.parametros).toEqual({ ano: 2026, mes: 5, formato: "analitica" });
    expect(r.linhas[0]).toMatchObject({ cpf: "01234567890", matriculas: ["026110196"], nome: "ANA FICTICIA", proventos: 308342, descontos: 8050 });
    expect(r.linhas[0].itens[1].competencia).toBe("2026-04");
    expect(paraContratoFolhaSigrh(r.linhas[0], 0).itens[0].valor).toBe("1073.42");
  });

  it("sem mês no nome do arquivo é erro", () => {
    const r = interpretarAnaliticaSigrh([linhaPlanilha("INSS", "D", "1,00")], "folha.xlsx", 2026);
    expect(r.problemas.some((p) => p.gravidade === "erro" && p.mensagem.includes("competência"))).toBe(true);
  });
});

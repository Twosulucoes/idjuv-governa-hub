import { describe, expect, it } from "vitest";
import type { LinhaPdf } from "../pdfTexto";
import {
  centavosBR,
  interpretarArquivoBanco,
  interpretarCreditoBancario,
  paraContratoServidorSigrh,
} from "./servidoresSigrhParser";

// Dados fictícios (CPFs válidos gerados para teste, nomes inventados).
let y = 0;
const linha = (...textos: string[]): LinhaPdf => {
  y += 10;
  return { pagina: 1, y, trechos: textos.map((texto, i) => ({ texto, x: i * 50, xFim: i * 50 + 40, y, pagina: 1 })) };
};

const cabecalho = (tipo = "Servidores Ativos") => [
  linha("ESTADO FICTICIO", "Relação de Crédito Bancário"),
  linha("INSTITUTO FICTICIO", tipo),
  linha("Competência: Outubro / 2026", "Tipo da folha: FOLHA NORMAL"),
  linha("Matrícula", "Nome Pessoa", "CPF Pessoa", "Banco", "Agência", "Nº Conta", "Proventos", "Descontos", "Líquido"),
];

const servidor1 = linha("0154712-7-04", "MARIA DE TESTE SILVA", "111.444.777-35", "001", "05780-0", "000000038235-3",
  "2.871,43", "234,10", "R$ 2.637,33");
const servidor2 = linha("0113805-7-02", "JOSE FICTICIO", "529.982.247-25", "001", "00250-X", "000000078387-0",
  "24.829,00", "6.635,60", "R$ 18.193,40");

describe("centavosBR", () => {
  it("lê valores brasileiros", () => {
    expect(centavosBR("2.871,43")).toBe(287143);
    expect(centavosBR("R$ 18.193,40")).toBe(1819340);
    expect(centavosBR("0,00")).toBe(0);
    expect(centavosBR("abc")).toBeNull();
  });
});

describe("interpretarCreditoBancario", () => {
  it("lê matrícula, CPF, conta e confere com os totais do fim", () => {
    const r = interpretarCreditoBancario([
      ...cabecalho(),
      servidor1,
      servidor2,
      linha("Total de pessoas geral: 2"),
      linha("Total Líquido geral: R$ 20.830,73"),
    ]);
    expect(r.problemas).toEqual([]);
    expect(r.parametros).toEqual({ origem: "credito", ano: 2026, mes: 10 });
    expect(r.linhas).toHaveLength(2);
    expect(r.linhas[0]).toMatchObject({
      cpf: "11144477735",
      nome: "MARIA DE TESTE SILVA",
      matricula: "0154712-7",
      vinculo: "04",
      bancoCodigo: "001",
      bancoAgencia: "5780-0",
      bancoConta: "38235-3",
      proventos: 287143,
      descontos: 23410,
      liquido: 263733,
    });
    expect(r.linhas[1].bancoAgencia).toBe("0250-X");
    expect(r.cabecalho["Competência"]).toBe("10/2026");
  });

  it("acusa total que não bate e CPF inválido", () => {
    const invalido = linha("0100000-1-01", "FULANO", "123.456.789-00", "001", "00250-X", "000000000001-0",
      "100,00", "0,00", "R$ 100,00");
    const r = interpretarCreditoBancario([
      ...cabecalho(),
      servidor1,
      invalido,
      linha("Total de pessoas geral: 3"),
      linha("Total Líquido geral: R$ 1,00"),
    ]);
    const erros = r.problemas.filter((p) => p.gravidade === "erro").map((p) => p.mensagem);
    expect(erros.some((m) => m.includes("CPF inválido"))).toBe(true);
    expect(erros.some((m) => m.includes("diz 3 pessoas"))).toBe(true);
    expect(erros.some((m) => m.includes("não bate"))).toBe(true);
  });

  it("recusa o relatório de pensão alimentícia e PDF de outro tipo", () => {
    expect(interpretarCreditoBancario([...cabecalho("Pensão Alimentícia - Ativos"), servidor1]).linhas).toEqual([]);
    expect(interpretarCreditoBancario([linha("Outro relatório")]).problemas[0].mensagem).toMatch(/não reconhecido/);
  });
});

// Registro CNAB 240 de 240 posições montado por campos (posição inicial 1-based → texto)
const registro = (campos: Record<number, string>) => {
  const l = Array(240).fill(" ");
  for (const [pos, texto] of Object.entries(campos)) {
    for (let i = 0; i < texto.length; i++) l[Number(pos) - 1 + i] = texto[i];
  }
  return l.join("");
};

const txt = (cep = "69301160") =>
  [
    registro({ 1: "00100000", 143: "128102026" }),
    registro({ 1: "00100011C3001020" }),
    registro({
      1: "0010001300001A", 21: "001", 24: "05780", 29: "0", 30: "000000038235", 42: "3",
      44: "MARIA DE TESTE SILVA", 94: "30102026", 120: "000000000263733",
    }),
    registro({
      1: "0010001300002B", 18: "1", 19: "00011144477735", 33: "RUA DE TESTE", 63: "00691", 83: "CENTRO",
      98: "BOA VISTA", 118: cep, 126: "RR",
    }),
    registro({ 1: "00100015", 18: "000004", 24: "000000000000263733" }),
    registro({ 1: "00199999" }),
  ].join("\r\n");

describe("interpretarArquivoBanco", () => {
  it("lê CPF, conta e endereço do segmento B", () => {
    const r = interpretarArquivoBanco(txt(), "ORGAO BB - 202610_ArqUnico_Fun.txt");
    expect(r.problemas).toEqual([]);
    expect(r.parametros).toEqual({ origem: "banco", ano: 2026, mes: 10 });
    expect(r.linhas[0]).toMatchObject({
      cpf: "11144477735",
      bancoAgencia: "5780-0",
      bancoConta: "38235-3",
      liquido: 263733,
      endereco: { logradouro: "RUA DE TESTE", numero: "691", complemento: null, bairro: "CENTRO", cidade: "BOA VISTA",
        uf: "RR", cep: "69301-160" },
    });
  });

  it("recusa o arquivo de pensão e o que não é CNAB 240", () => {
    expect(interpretarArquivoBanco(txt(), "ORGAO BB - 202610_ArqUnico_Pen.txt").linhas).toEqual([]);
    expect(interpretarArquivoBanco("linha curta\r\noutra\r\nmais", "x_Fun.txt").problemas[0].mensagem).toMatch(/não reconhecido/);
  });
});

describe("paraContratoServidorSigrh", () => {
  it("manda proventos em reais com duas casas", () => {
    const r = interpretarCreditoBancario([
      ...cabecalho(), servidor1, linha("Total de pessoas geral: 1"), linha("Total Líquido geral: R$ 2.637,33"),
    ]);
    expect(paraContratoServidorSigrh(r.linhas[0], 0)).toMatchObject({ indice: 0, proventos: "2871.43", matricula: "0154712-7" });
  });
});

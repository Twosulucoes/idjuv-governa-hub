import { describe, expect, it } from "vitest";
import { interpretarCredoresFiplan, mascararCpf } from "./credoresFiplanParser";

const CABECALHO = ["Código do credor", "Nome do credor", "Nome Fantasia", "Tipo de cadastro", "Categoria", "CPF/CNPJ"];
const titulo = [["Consulta Credor"], ["Critérios utilizados na consulta:"], [], CABECALHO];
// CPFs de teste (dígito verificador válido), nenhum real
const credor = (codigo: string, nome: string, tipo: string, doc: string) => [codigo, nome, "", tipo, "Servidor Público", doc];

describe("interpretarCredoresFiplan", () => {
  it("lê as pessoas físicas com CPF de todas as abas e deixa o resto de fora", () => {
    const r = interpretarCredoresFiplan([
      ...titulo,
      credor("2001.00003-4", "EMPRESA LTDA", "Pessoa Jurídica", "00.447.548/0001-84"),
      credor("2026.01793-4", "Maria da Silva", "Pessoa Física", "111.444.777-35"),
      credor("2024.00608-0", "Inscrição", "Inscrição Genérica (IG)", ""),
      // segunda aba, com o cabeçalho de novo
      ...titulo,
      credor("2026.02204-0", "João Souza", "Pessoa Física", "529.982.247-25"),
      credor("2026.02205-9", "Sem CPF", "Pessoa Física", ""),
      credor("2026.02206-7", "CPF inválido", "Pessoa Física", "111.111.111-11"),
    ]);
    expect(r.problemas).toEqual([]);
    expect(r.linhas.map((l) => [l.credor_codigo, l.cpf, l.credor_nome])).toEqual([
      ["2026017934", "11144477735", "Maria da Silva"],
      ["2026022040", "52998224725", "João Souza"],
    ]);
    expect(r.cabecalho).toEqual({
      "Credores no arquivo": "6",
      "Pessoas físicas com CPF": "2",
      "Fora (empresas, inscrições genéricas ou sem CPF)": "4",
    });
  });

  it("avisa credor repetido e recusa arquivo que não é o Consultar Credor", () => {
    const r = interpretarCredoresFiplan([
      ...titulo,
      credor("2026.01793-4", "Maria", "Pessoa Física", "111.444.777-35"),
      credor("2026.01793-4", "Maria", "Pessoa Física", "111.444.777-35"),
    ]);
    expect(r.linhas).toHaveLength(1);
    expect(r.problemas.map((p) => p.gravidade)).toEqual(["aviso"]);
    expect(interpretarCredoresFiplan([["outra coisa"], ["a", "b"]]).problemas[0].gravidade).toBe("erro");
  });
});

describe("mascararCpf", () => {
  it("mostra só o meio do CPF", () => {
    expect(mascararCpf("11144477735")).toBe("***.444.777-**");
    expect(mascararCpf("123")).toBe("***");
  });
});

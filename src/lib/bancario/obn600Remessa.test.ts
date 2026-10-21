import { describe, expect, it } from "vitest";
import { lerObn600 } from "./obn600";
import {
  gerarObn600Remessa,
  nomeArquivoObn600,
  tipoOrdemObn600,
  validarRemessaObn600,
  type RemessaObn600,
} from "./obn600Remessa";

// Dados fictícios (CPF/CNPJ válidos só no formato). O gerador foi conferido byte a byte com remessas reais,
// que não entram no repositório por terem dados de credores.
const remessa = (): RemessaObn600 => ({
  pagador: {
    codigoCliente: "123456789",
    unidadeGestora: "000123",
    gestao: "00001",
    agencia: "1234",
    agenciaDigito: "5",
    conta: "67890",
    contaDigito: "1",
  },
  sequencial: 4321,
  dataGeracao: new Date(2026, 9, 21, 9, 5),
  ordens: [
    {
      relacao: "2026000010",
      numeroOb: "2026000101",
      data: "2026-10-22",
      nome: "Fulana de Tál Exemplo",
      documento: "111.222.333-44",
      banco: "341",
      agencia: "6953",
      agencia_dv: "",
      conta: "3600",
      conta_dv: "6",
      valor: 1200,
      endereco: "Rua das Flores, 10",
      municipio: "Boa Vista",
      cep: "69300-000",
      uf: "rr",
    },
    {
      relacao: "2026000011",
      numeroOb: "2026000102",
      data: "2026-10-22",
      nome: "Empresa Exemplo Ltda",
      documento: "12.345.678/0001-90",
      banco: "001",
      agencia: "250",
      agencia_dv: "x",
      conta: "208685",
      conta_dv: "9",
      valor: 420.5,
    },
  ],
});

const c = (l: string, a: number, b: number) => l.substring(a - 1, b);

describe("gerarObn600Remessa", () => {
  it("gera linhas de 350 posições separadas por CRLF, sem CRLF no fim", () => {
    const arq = gerarObn600Remessa(remessa());
    const linhas = arq.conteudo.split("\r\n");
    expect(linhas).toHaveLength(4);
    expect(linhas.every((l) => l.length === 350)).toBe(true);
    expect(arq.conteudo.endsWith("\r\n")).toBe(false);
    expect(arq.registros).toBe(4);
    expect(arq.quantidade).toBe(2);
    expect(arq.valorTotalCentavos).toBe(162050);
  });

  it("monta header, OB e trailer nas posições do leiaute", () => {
    const [h, ob1, ob2, t] = gerarObn600Remessa(remessa()).conteudo.split("\r\n");
    expect(c(h, 1, 35)).toBe("0".repeat(35));
    expect(c(h, 36, 67)).toBe("21102026" + "0905" + "04321" + "10B" + "001" + "123456789");
    expect(c(h, 344, 350)).toBe("0000001");

    expect(c(ob1, 1, 47)).toBe("2" + "12345" + "000123" + "00001" + "02026000010" + "02026000101" + "22102026");
    expect(c(ob1, 52, 53)).toBe("31");
    expect(c(ob1, 54, 80)).toBe("120000".padStart(27, "0"));
    expect(c(ob1, 81, 98)).toBe("341" + "6953" + " " + "000003600" + "6");
    expect(c(ob1, 99, 143).trimEnd()).toBe("Fulana de Tal Exemplo");
    expect(c(ob1, 144, 208).trimEnd()).toBe("Rua das Flores, 10");
    expect(c(ob1, 209, 236).trimEnd()).toBe("Boa Vista");
    expect(c(ob1, 254, 263)).toBe("69300000RR");
    expect(c(ob1, 304, 319)).toBe("02" + "11122233344   ");
    expect(c(ob1, 320, 334)).toBe("12345" + "0000678901");
    expect(c(ob1, 335, 350)).toBe(" ".repeat(9) + "0000002");

    expect(c(ob2, 52, 53)).toBe("32");
    expect(c(ob2, 81, 98)).toBe("001" + "0250" + "X" + "000208685" + "9");
    expect(c(ob2, 254, 263)).toBe(" ".repeat(10));
    expect(c(ob2, 304, 319)).toBe("01" + "12345678000190");

    expect(c(t, 1, 35)).toBe("9".repeat(35));
    expect(c(t, 36, 320).trim()).toBe("");
    expect(c(t, 321, 337)).toBe("162050".padStart(17, "0"));
    // Soma dos sequenciais 1 + 2 + 3
    expect(c(t, 338, 350)).toBe("6".padStart(13, "0"));
  });

  it("é lido de volta pelo leitor OBN600 com o trailer conferindo", () => {
    const lido = lerObn600(gerarObn600Remessa(remessa()).conteudo);
    expect(lido.problemas).toEqual([]);
    expect(lido.sentido).toBe("remessa");
    expect(lido.totais.confere).toBe(true);
    expect(lido.cabecalho.sequencial).toBe(4321);
    expect(lido.linhas.map((l) => [l.identificador, l.tipo_lancamento, l.valor, l.favorecido_documento])).toEqual([
      ["02026000101", "credito_outro_banco", 1200, "11122233344"],
      ["02026000102", "credito_bb", 420.5, "12345678000190"],
    ]);
    expect(lido.linhas[1].agencia).toBe("0250-X");
    expect(lido.linhas[1].conta).toBe("208685-9");
  });
});

describe("validarRemessaObn600", () => {
  it("aceita a remessa completa", () => {
    expect(validarRemessaObn600(remessa())).toEqual([]);
  });

  it("aponta o que falta sem expor CPF ou conta", () => {
    const r = remessa();
    r.pagador.unidadeGestora = "";
    r.sequencial = 100000;
    r.ordens[0].documento = "123";
    r.ordens[1].agencia = "12345";
    r.ordens[1].valor = 0;
    expect(validarRemessaObn600(r)).toEqual([
      "Unidade gestora (OBN)",
      "Nº da remessa (1 a 99999)",
      "OB 1: CPF/CNPJ do favorecido",
      "OB 2: agência (até 4 dígitos)",
      "OB 2: valor",
    ]);
  });

  it("recusa remessa sem pagamentos", () => {
    expect(validarRemessaObn600({ ...remessa(), ordens: [] })).toContain("Nenhum pagamento selecionado");
  });
});

describe("utilitários", () => {
  it("tipo 32 para o BB e 31 para outro banco", () => {
    expect(tipoOrdemObn600("1")).toBe("32");
    expect(tipoOrdemObn600("104")).toBe("31");
  });

  it("nome do arquivo com data e nº da remessa", () => {
    expect(nomeArquivoObn600(new Date(2026, 9, 21), 4321)).toBe("obn600_21102026_04321_bco001.txt");
  });
});

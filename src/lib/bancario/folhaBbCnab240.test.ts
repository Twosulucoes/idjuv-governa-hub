import { describe, expect, it } from "vitest";
import { gerarFolhaBbCnab240, pendenciasFolhaBb, textoFolhaBb } from "@/lib/bancario/folhaBbCnab240";
import { gerarCNAB240, type DadosEmpresa, type DadosFavorecido, type RemessaCNAB } from "@/lib/cnabGenerator";

// Dados fictícios. A estrutura de cada linha esperada (tudo fora dos campos de dados) é a das remessas que o BB aceitou
// da folha da instituição em 08/2026; o gerador reproduziu essas remessas byte a byte (só a data inexistente 31/09 foi
// trocada), conferência feita fora do repositório porque os arquivos têm dados pessoais.
const empresa: DadosEmpresa = {
  cnpj: "12.345.678/0001-95",
  razaoSocial: "Instituto de Exemplo, Juventude e Lazer",
  banco: "001",
  nomeBanco: "Banco do Brasil",
  agencia: "1234",
  agenciaDigito: "5",
  conta: "98765",
  contaDigito: "X",
  convenio: "123456",
  endereco: { logradouro: "Rua A", cidade: "Boa Vista", cep: "69300000", uf: "RR" },
};
const dataCredito = new Date(2026, 8, 30);
const favorecido = (f: Partial<DadosFavorecido>): DadosFavorecido => ({
  nome: "",
  cpf: "",
  banco: "001",
  agencia: "",
  conta: "",
  tipoConta: "CC",
  valor: 0,
  dataCredito,
  identificador: "",
  ...f,
});
const favorecidos = [
  favorecido({ nome: "Maria da Conceição Exemplo de Araújo Filha", cpf: "529.982.247-25", agencia: "250", agenciaDigito: "X", conta: "1203", contaDigito: "4", valor: 3260.12 }),
  favorecido({ nome: "João Teste", cpf: "111.444.777-35", agencia: "4263", agenciaDigito: "3", conta: "79750", contaDigito: "2", valor: 2637.33 }),
  favorecido({ nome: "Ana Pensionista", cpf: "390.533.447-05", banco: "237", agencia: "1", agenciaDigito: "9", conta: "140190", contaDigito: "8", valor: 486.3 }),
];
const remessa: RemessaCNAB = { empresa, favorecidos, numeroRemessa: 1200, dataGeracao: new Date(2026, 7, 26, 15, 8, 41) };

describe("gerarFolhaBbCnab240", () => {
  it("reproduz o leiaute aceito pelo BB, com CRLF depois de cada linha", () => {
    const esperado = [
    "00100000         21234567800019500000000000000123456012345000000098765X INSTITUTO DE EXEMPLO, JUVENTUDBANCO DO BRASIL SA                      12608202615084100120003000000                                                   CSP000            ",
    "00100011C3001020 21234567800019500000000000000123456012345000000098765X INSTITUTO DE EXEMPLO, JUVENTUD                                                                      00000                                   00000000                    ",
    "0010001300001A00000000100250X0000000012034 MARIA DA CONCEICAO EXEMPLO DE                     30092026BRL000000000000000000000000326012                            00000000032601206                                      0670        0          ",
    "0010001300001B   100052998224725                                                                                                                                                                                                                ",
    "0010001300002A0000000010426330000000797502 JOAO TESTE                                        30092026BRL000000000000000000000000263733                            00000000026373306                                      0670        0          ",
    "0010001300002B   100011144477735                                                                                                                                                                                                                ",
    "00100015         000004000000000000589745000000000000200000                                                                                                                                                                                     ",
    "00100021C9803020 21234567800019500000000000000123456012345000000098765X INSTITUTO DE EXEMPLO, JUVENTUD                                                                      00000                                   00000000                    ",
    "0010002300001A0000002370000190000001401908 ANA PENSIONISTA                                   30092026BRL000000000000000000000000048630                            00000000004863006                                      0170        0          ",
    "0010002300001B   100039053344705                                                                                                                                                                                                                ",
    "00100025         000003000000000000048630000000000000100000                                                                                                                                                                                     ",
    "00199999         000002000009                                                                                                                                                                                                                   ",
    ];
    expect(gerarFolhaBbCnab240(remessa)).toBe(esperado.map((l) => `${l}\r\n`).join(""));
  });

  it("numera o lote de outros bancos como 0002 mesmo quando ele está sozinho", () => {
    const linhas = gerarFolhaBbCnab240({ ...remessa, favorecidos: favorecidos.slice(2) }).split("\r\n");
    expect(linhas[1].slice(0, 16)).toBe("00100021C9803020");
    expect(linhas[linhas.length - 2]).toMatch(/^00199999 {9}000001000005/);
  });

  it("recusa conta poupança no BB, que o leiaute aceito não cobre", () => {
    const poupanca = [favorecido({ ...favorecidos[0], tipoConta: "CP" })];
    expect(pendenciasFolhaBb({ favorecidos: poupanca })).toHaveLength(1);
    expect(() => gerarFolhaBbCnab240({ ...remessa, favorecidos: poupanca })).toThrow(/poupança/);
    expect(pendenciasFolhaBb({ favorecidos: [favorecido({ banco: "237", tipoConta: "CP" })] })).toEqual([]);
  });

  it("leva o identificador do crédito no seu número", () => {
    const comId = gerarFolhaBbCnab240({ ...remessa, favorecidos: [favorecido({ ...favorecidos[0], identificador: "ficha-1" })] });
    expect(comId.split("\r\n")[2].slice(73, 93)).toBe("ficha-1".padEnd(20));
  });

  it("normaliza o texto: sem acento, maiúsculas, mantém a vírgula", () => {
    expect(textoFolhaBb("  Ação, Juventude  e Lazer! ")).toBe("ACAO, JUVENTUDE E LAZER");
  });
});

describe("gerarCNAB240", () => {
  it("usa o leiaute aceito pelo BB quando a conta pagadora é do BB", () => {
    expect(gerarCNAB240(remessa)).toBe(gerarFolhaBbCnab240(remessa));
  });

  it("mantém o FEBRABAN genérico para outros bancos", () => {
    const outro = gerarCNAB240({ ...remessa, empresa: { ...empresa, banco: "104", nomeBanco: "Caixa" } });
    expect(outro.slice(163, 166)).toBe("089");
  });
});

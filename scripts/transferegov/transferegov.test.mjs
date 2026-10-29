import { describe, expect, it } from "vitest";
import { criarLeitorCsv, lerCsvComCabecalho } from "./csv.mjs";
import { data, dataHora, mapearConvenio, mapearEmenda, mapearEmpenho, mapearProposta, numero, simNao } from "./mapear.mjs";
import { montarDados } from "./sincronizar.mjs";

function lerTudo(texto, pedaco = texto.length) {
  const registros = [];
  const leitor = criarLeitorCsv((c) => registros.push(c));
  for (let i = 0; i < texto.length; i += pedaco) leitor.escrever(texto.slice(i, i + pedaco));
  leitor.fim();
  return registros;
}

describe("criarLeitorCsv", () => {
  const amostra = '﻿A;B;C\r\n1;"texto; com ponto e vírgula";"aspa ""dupla"""\r\n2;"duas\r\nlinhas";\r\n';

  it("lê separador, aspas, aspa escapada, quebra de linha dentro do campo, BOM e CRLF", () => {
    expect(lerTudo(amostra)).toEqual([
      ["A", "B", "C"],
      ["1", "texto; com ponto e vírgula", 'aspa "dupla"'],
      ["2", "duas\r\nlinhas", ""],
    ]);
  });

  it("dá o mesmo resultado lendo de um caractere por vez (pedaço cortado no meio de aspas e do CRLF)", () => {
    expect(lerTudo(amostra, 1)).toEqual(lerTudo(amostra));
  });

  it("entrega o último registro sem quebra de linha no fim", () => {
    expect(lerTudo("A;B\n1;2")).toEqual([["A", "B"], ["1", "2"]]);
  });
});

describe("lerCsvComCabecalho", () => {
  it("devolve objetos com as chaves do cabeçalho, lendo bytes UTF-8 cortados no meio de um caractere", async () => {
    const bytes = new TextEncoder().encode("NOME;VALOR\nNÃO;1,5\n");
    const fluxo = [bytes.slice(0, 13), bytes.slice(13)]; // corta o "Ã" (2 bytes) ao meio
    const linhas = [];
    const cabecalho = await lerCsvComCabecalho(fluxo, (r) => linhas.push(r));
    expect(cabecalho).toEqual(["NOME", "VALOR"]);
    expect(linhas).toEqual([{ NOME: "NÃO", VALOR: "1,5" }]);
  });
});

describe("conversões", () => {
  it("lê valores com vírgula, ponto, milhar e vazio", () => {
    expect(numero("497053,11")).toBe(497053.11);
    expect(numero("653415.59")).toBe(653415.59);
    expect(numero("2450000")).toBe(2450000);
    expect(numero("1.234,56")).toBe(1234.56);
    expect(numero("")).toBeNull();
    expect(numero("abc")).toBeNull();
  });

  it("lê datas e recusa data inexistente", () => {
    expect(data("31/12/2026")).toBe("2026-12-31");
    expect(data("31/02/2026")).toBeNull();
    expect(data("")).toBeNull();
    expect(dataHora("29/10/2026 06:31:32")).toBe("2026-10-29T06:31:32-03:00");
  });

  it("lê SIM e NÃO", () => {
    expect(simNao("SIM")).toBe(true);
    expect(simNao("NÃO")).toBe(false);
    expect(simNao("")).toBeNull();
  });
});

// Linhas reais do Transferegov (carga de 29/10/2026, CNPJ trocado por um fictício), reduzidas às colunas usadas
const PROPOSTA = {
  ID_PROPOSTA: "2214543", NR_PROPOSTA: "24745/2026", ANO_PROP: "2026", DIA_PROPOSTA: "24/05/2026",
  IDENTIF_PROPONENTE: "12345678000195", DESC_ORGAO_SUP: "MINISTERIO DO ESPORTE", DESC_ORGAO: "MINISTERIO DO ESPORTE",
  MODALIDADE: "CONVENIO", OBJETO_PROPOSTA: "Projeto Arena Jovem", SIT_PROPOSTA: "Proposta Aprovada e Plano de Trabalho em Complementação",
  DIA_INIC_VIGENCIA_PROPOSTA: "01/09/2026", DIA_FIM_VIGENCIA_PROPOSTA: "31/12/2026",
  VL_GLOBAL_PROP: "2453000", VL_REPASSE_PROP: "2450000", VL_CONTRAPARTIDA_PROP: "3000",
};
const EMENDA = {
  ID_PROPOSTA: "2214543", QUALIF_PROPONENTE: "BENEFICIARIO_EMENDA_PARLAMENTAR", COD_PROGRAMA_EMENDA: "5100020260026",
  NR_EMENDA: "50060001", NOME_PARLAMENTAR: "COM. ESPORTE", BENEFICIARIO_EMENDA: "12345678000195", IND_IMPOSITIVO: "NÃO",
  TIPO_PARLAMENTAR: "COMISSAO", VALOR_REPASSE_PROPOSTA_EMENDA: "2450000", VALOR_REPASSE_EMENDA: "2450000",
};
const CONVENIO = {
  NR_CONVENIO: "7AADDI", ID_PROPOSTA: "2214543", SITUACAO_PUBLICACAO: "Publicado", INSTRUMENTO_ATIVO: "SIM",
  IND_ASSINADO: "NÃO", NR_PROCESSO: "71000046238202677", DIA_INIC_VIGENC_CONV: "01/09/2026", DIA_FIM_VIGENC_CONV: "31/12/2026",
  DIA_LIMITE_PREST_CONTAS: "31/12/2026", VL_GLOBAL_CONV: "2453000", VL_EMPENHADO_CONV: "2450000", VL_DESEMBOLSADO_CONV: "",
  VL_SALDO_CONTA: "", SIT_CONVENIO: "",
};
const EMPENHO = {
  ID_EMPENHO: "184668", NR_CONVENIO: "7AADDI", NR_EMPENHO: "2026NE001572", DATA_EMISSAO: "20/07/2026",
  DESC_SITUACAO_EMPENHO: "Enviado", VALOR_EMPENHO: "2450000", NATUREZA_DESPESA: "333041", UG_EMITENTE: "180073",
  DESCRICAO_EMENDA_SIAFI: "Atender a Indicação do Solicitante50060001-Com. Esporte", OBSERVACAO_EMPENHO: "Empenho do instrumento",
};

describe("mapeamento das linhas", () => {
  it("proposta, emenda, convênio e empenho viram as colunas de fin_tg_*", () => {
    expect(mapearProposta(PROPOSTA)).toMatchObject({
      id_proposta: 2214543, numero: "24745/2026", ano: 2026, data_proposta: "2026-05-24",
      cnpj_proponente: "12345678000195", valor_global: 2453000, inicio_vigencia: "2026-09-01",
    });
    expect(mapearEmenda(EMENDA)).toMatchObject({
      id_proposta: 2214543, numero_emenda: "50060001", parlamentar: "COM. ESPORTE", impositiva: false, valor_repasse_emenda: 2450000,
    });
    expect(mapearConvenio(CONVENIO)).toMatchObject({
      numero: "7AADDI", assinado: false, instrumento_ativo: true, valor_empenhado: 2450000, valor_desembolsado: null,
      data_limite_prestacao_contas: "2026-12-31", situacao: null,
    });
    expect(mapearEmpenho(EMPENHO)).toMatchObject({
      tipo: "empenho", id_origem: 184668, numero: "2026NE001572", data: "2026-07-20", valor: 2450000,
    });
  });

  it("linha sem chave é ignorada", () => {
    expect(mapearProposta({ ...PROPOSTA, ID_PROPOSTA: "" })).toBeNull();
    expect(mapearEmenda({ ...EMENDA, NR_EMENDA: "" })).toBeNull();
  });
});

describe("montarDados", () => {
  const arquivos = {
    data_carga_siconv: [{ data_carga: "29/10/2026 06:31:32" }],
    siconv_proposta: [PROPOSTA, { ...PROPOSTA, ID_PROPOSTA: "9", IDENTIF_PROPONENTE: "11111111000191" }],
    siconv_emenda: [EMENDA, { ...EMENDA, ID_PROPOSTA: "9" }],
    siconv_convenio: [CONVENIO, { ...CONVENIO, NR_CONVENIO: "OUTRO", ID_PROPOSTA: "9" }],
    siconv_empenho: [EMPENHO, EMPENHO, { ...EMPENHO, ID_EMPENHO: "2", NR_CONVENIO: "OUTRO" }],
    siconv_desembolso: [{ ID_DESEMBOLSO: "7", NR_CONVENIO: "7AADDI", DATA_DESEMBOLSO: "05/11/2026", VL_DESEMBOLSADO: "1000,50", NR_SIAFI: "2026OB1" }],
  };
  const lerFalso = async (arquivo, aoRegistro) => {
    const linhas = arquivos[arquivo];
    linhas.forEach(aoRegistro);
    return Object.keys(Object.assign({}, ...linhas, { ID_EMPENHO: 0, NR_EMPENHO: 0, VALOR_EMPENHO: 0, ID_DESEMBOLSO: 0, NR_CONVENIO: 0, VL_DESEMBOLSADO: 0 }));
  };

  it("guarda só o que é do CNPJ, segue as chaves (proposta → convênio → movimentos) e tira repetidos", async () => {
    const { data_carga, dados } = await montarDados("12345678000195", "/tmp", lerFalso);
    expect(data_carga).toBe("2026-10-29T06:31:32-03:00");
    expect(dados.propostas.map((p) => p.id_proposta)).toEqual([2214543]);
    expect(dados.emendas).toHaveLength(1);
    expect(dados.convenios.map((c) => c.numero)).toEqual(["7AADDI"]);
    expect(dados.movimentos.map((m) => `${m.tipo}:${m.id_origem}:${m.valor}`)).toEqual(["empenho:184668:2450000", "desembolso:7:1000.5"]);
  });

  it("para quando o leiaute do arquivo muda", async () => {
    const semColuna = async (arquivo, aoRegistro) => (arquivo === "siconv_proposta" ? ["ID_PROPOSTA"] : lerFalso(arquivo, aoRegistro));
    await expect(montarDados("12345678000195", "/tmp", semColuna)).rejects.toThrow(/siconv_proposta: o leiaute mudou/);
  });
});

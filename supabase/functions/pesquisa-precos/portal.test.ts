import { describe, expect, it } from "vitest";
import {
  compraDoIdCompra,
  linkEditalPncp,
  mapearCompraPncp,
  mapearItemPncp,
  mapearPrecoCompras,
  mapearResultadoPncp,
  referenciaValida,
  urlCompraPncp,
  urlItensPncp,
  urlPrecosCompras,
  urlResultadosPncp,
} from "./portal.ts";

// Linhas no formato dos clientes públicos dessas APIs em uso em out/2026 (valores fictícios).
const MATERIAL = {
  idCompra: "92500105900122026", idItemCompra: 123456, numeroItemCompra: 3, descricaoItem: "Bola de futebol de campo, oficial",
  codigoItemCatalogo: 447001, siglaUnidadeFornecimento: "UN", nomeUnidadeFornecimento: "UNIDADE", capacidadeUnidadeFornecimento: 1,
  quantidade: 50, precoUnitario: 89.9, niFornecedor: "12.345.678/0001-90", nomeFornecedor: "Esportes Exemplo Ltda",
  marca: "Marca X", codigoUasg: "925001", nomeUasg: "UASG DE EXEMPLO", municipio: "Boa Vista", estado: "rr",
  nomeOrgao: "Órgão de Exemplo", dataCompra: "2026-03-10", dataResultado: "2026-04-02T10:00:00",
};
const SERVICO = {
  idCompra: "15800106900052026", idItemCompra: 99, descricaoItem: "Manutenção de gramado", codigoItemCatalogo: 2771,
  siglaUnidadeMedida: "M2", quantidade: 1000, precoUnitario: "2,35", niFornecedor: "98765432000110", nomeFornecedor: "Gramados SA",
  nomeUasg: "Universidade de Exemplo", estado: "AM", dataCompra: "2026-05-20",
};

describe("Compras.gov.br — pesquisa de preços", () => {
  it("monta a URL de material com tipo + codigo e o período", () => {
    const url = urlPrecosCompras({ tipo: "material", campo: "codigoItemCatalogo", codigo: 447001, pagina: 2, dataInicio: "2025-10-29", dataFim: "2026-10-29" });
    expect(url).toBe(
      "https://dadosabertos.compras.gov.br/modulo-pesquisa-preco/1_consultarMaterial?pagina=2&tamanhoPagina=500"
      + "&tipo=codigoItemCatalogo&codigo=447001&dataCompraInicio=2025-10-29&dataCompraFim=2026-10-29",
    );
    expect(urlPrecosCompras({ tipo: "material", campo: "codigoPdm", codigo: 281, pagina: 1, dataInicio: "a", dataFim: "b" }))
      .toContain("tipo=codigoPdm&codigo=281");
  });

  it("monta a URL de serviço com codigoItemCatalogo", () => {
    const url = urlPrecosCompras({ tipo: "servico", campo: "codigoItemCatalogo", codigo: 2771, pagina: 1, dataInicio: "2025-10-29", dataFim: "2026-10-29" });
    expect(url).toContain("/modulo-pesquisa-preco/3_consultarServico?pagina=1&tamanhoPagina=500&codigoItemCatalogo=2771");
  });

  it("lê a linha de material com a fonte completa", () => {
    expect(mapearPrecoCompras(MATERIAL, "material")).toEqual({
      idExterno: "cg:92500105900122026:123456:12345678000190",
      parametro: 1,
      origem: "compras_gov",
      descricao: "Bola de futebol de campo, oficial",
      orgao: "Órgão de Exemplo",
      uasg: "925001",
      uf: "RR",
      municipio: "Boa Vista",
      numeroCompra: "Pregão nº 90012/2026, UASG 925001",
      idCompra: "92500105900122026",
      modalidade: "Pregão",
      dataReferencia: "2026-04-02",
      fornecedorNome: "Esportes Exemplo Ltda",
      fornecedorNi: "12345678000190",
      marca: "Marca X",
      unidade: "UN",
      quantidade: 50,
      precoUnitario: 89.9,
      link: "https://cnetmobile.estaleiro.serpro.gov.br/comprasnet-web/public/landing?destino=acompanhamento-compra&compra=92500105900122026",
    });
  });

  it("lê a linha de serviço: unidade de medida, preço em texto, órgão pela UASG e data da compra", () => {
    const p = mapearPrecoCompras(SERVICO, "servico")!;
    expect(p).toMatchObject({ unidade: "M2", precoUnitario: 2.35, orgao: "Universidade de Exemplo", uf: "AM", dataReferencia: "2026-05-20",
      numeroCompra: "Dispensa nº 90005/2026, UASG 158001" });
  });

  it("embalagem com capacidade aparece na unidade; linha sem preço ou sem compra é descartada", () => {
    expect(mapearPrecoCompras({ ...MATERIAL, capacidadeUnidadeFornecimento: 12, siglaUnidadeFornecimento: "CX" }, "material")!.unidade).toBe("CX (12)");
    expect(mapearPrecoCompras({ ...MATERIAL, precoUnitario: 0 }, "material")).toBeNull();
    expect(mapearPrecoCompras({ ...MATERIAL, precoUnitario: null }, "material")).toBeNull();
    expect(mapearPrecoCompras({ ...MATERIAL, idCompra: undefined }, "material")).toBeNull();
    const semNada = mapearPrecoCompras({ idCompra: "x1", precoUnitario: 1 }, "material")!;
    expect(semNada.numeroCompra).toBe("x1");
    expect(Object.values(semNada)).not.toContain(undefined);
  });

  it("descreve o idCompra", () => {
    expect(compraDoIdCompra("92500107000012026")).toEqual({ texto: "Inexigibilidade nº 00001/2026, UASG 925001", modalidade: "Inexigibilidade" });
    expect(compraDoIdCompra("123")).toBeNull();
  });
});

describe("PNCP — compra, itens e resultados", () => {
  const ref = { cnpj: "12345678000190", ano: 2026, sequencial: 15 };

  it("valida a referência e monta as URLs no host fixo", () => {
    expect(referenciaValida({ cnpj: "12345678000190", ano: 2026, sequencial: 15 })).toEqual(ref);
    expect(referenciaValida({ cnpj: "123", ano: 2026, sequencial: 15 })).toBeNull();
    expect(referenciaValida({ cnpj: "12345678000190", ano: 2019, sequencial: 15 })).toBeNull();
    expect(referenciaValida({ cnpj: "12345678000190", ano: 2026, sequencial: "15" })).toBeNull();
    expect(urlCompraPncp(ref)).toBe("https://pncp.gov.br/api/consulta/v1/orgaos/12345678000190/compras/2026/15");
    expect(urlItensPncp(ref)).toBe("https://pncp.gov.br/api/pncp/v1/orgaos/12345678000190/compras/2026/15/itens?pagina=1&tamanhoPagina=500");
    expect(urlResultadosPncp(ref, 3)).toBe("https://pncp.gov.br/api/pncp/v1/orgaos/12345678000190/compras/2026/15/itens/3/resultados");
    expect(linkEditalPncp(ref)).toBe("https://pncp.gov.br/app/editais/12345678000190/2026/15");
  });

  const compra = mapearCompraPncp({
    orgaoEntidade: { cnpj: "12345678000190", razaoSocial: "Secretaria de Exemplo" },
    unidadeOrgao: { nomeUnidade: "Departamento de Compras", ufSigla: "PA", municipioNome: "Belém" },
    modalidadeNome: "Pregão - Eletrônico", numeroCompra: "15", anoCompra: 2026, processo: "2026/123",
    objetoCompra: "Material esportivo", numeroControlePNCP: "12345678000190-1-000015/2026", dataPublicacaoPncp: "2026-02-01T08:00:00",
  }, ref);

  it("lê o cabeçalho da compra", () => {
    expect(compra).toEqual({
      orgao: "Secretaria de Exemplo", unidade: "Departamento de Compras", uf: "PA", municipio: "Belém", modalidade: "Pregão - Eletrônico",
      numeroCompra: "15/2026", processo: "2026/123", objeto: "Material esportivo", numeroControle: "12345678000190-1-000015/2026",
      dataPublicacao: "2026-02-01", link: "https://pncp.gov.br/app/editais/12345678000190/2026/15",
    });
    expect(mapearCompraPncp({}, ref)).toMatchObject({ orgao: null, numeroCompra: null, link: linkEditalPncp(ref) });
  });

  const item = mapearItemPncp({ numeroItem: 3, descricao: "Bola de futsal", unidadeMedida: "Unidade", quantidade: 40, valorUnitarioEstimado: 120, temResultado: true })!;

  it("lê o item; sem número, descarta", () => {
    expect(item).toEqual({ numeroItem: 3, descricao: "Bola de futsal", unidade: "Unidade", quantidade: 40, valorUnitarioEstimado: 120, temResultado: true, situacao: null });
    expect(mapearItemPncp({ descricao: "x" })).toBeNull();
  });

  it("resultado homologado vira amostra do inciso II com a fonte; cancelado fica fora", () => {
    const r = mapearResultadoPncp({
      valorUnitarioHomologado: 98.5, quantidadeHomologada: 40, niFornecedor: "11222333000144", nomeRazaoSocialFornecedor: "Fornecedor B",
      situacaoCompraItemResultadoNome: "Informado", dataResultado: "2026-03-05T12:00:00", sequencialResultado: 1,
    }, ref, compra, item)!;
    expect(r).toMatchObject({
      idExterno: "pncp:12345678000190:2026:15:3:1", parametro: 2, origem: "pncp", orgao: "Secretaria de Exemplo", uf: "PA",
      numeroCompra: "Pregão - Eletrônico nº 15/2026, item 3, processo 2026/123", idCompra: "12345678000190-1-000015/2026",
      dataReferencia: "2026-03-05", fornecedorNi: "11222333000144", quantidade: 40, precoUnitario: 98.5, unidade: "Unidade",
      link: "https://pncp.gov.br/app/editais/12345678000190/2026/15",
    });
    expect(mapearResultadoPncp({ valorUnitarioHomologado: 98.5, situacaoCompraItemResultadoNome: "Cancelado" }, ref, compra, item)).toBeNull();
    expect(mapearResultadoPncp({ valorUnitarioHomologado: 0 }, ref, compra, item)).toBeNull();
    const semData = mapearResultadoPncp({ valorUnitarioHomologado: 1 }, ref, compra, item)!;
    expect(semData.dataReferencia).toBe("2026-02-01");
  });
});

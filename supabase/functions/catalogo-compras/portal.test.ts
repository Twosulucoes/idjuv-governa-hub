import { describe, expect, it } from "vitest";
import { HOST_PORTAL, mapearItemMaterial, mapearPdm, mapearServico, urlPortal } from "./portal.ts";

// Formatos conferidos no portal de dados abertos do Compras.gov.br em 2026-10-23.
const PDM_REAL = {
  codigoGrupo: 75, nomeGrupo: "UTENSÍLIOS DE ESCRITÓRIO E MATERIAL DE EXPEDIENTE", codigoClasse: 7520,
  nomeClasse: "ACESSÓRIOS E DISPOSITIVOS PARA ESCRITÓRIO", codigoPdm: 281, nomePdm: "CARTUCHO CANETA TINTEIRO",
  statusPdm: true, dataHoraAtualizacao: "2021-10-16T09:21:41.961529",
};
const SERVICO_REAL = {
  codigoSecao: 9, nomeSecao: "SERVIÇOS DA COMUNIDADE, PESSOAIS E SOCIAIS E OUTROS SERVIÇOS", codigoDivisao: 93,
  nomeDivisao: "SERVIÇO SOCIAL E DE SAÚDE", codigoGrupo: 931, nomeGrupo: "SERVIÇOS DE SAÚDE HUMANA", codigoClasse: 9311,
  nomeClasse: "SERVIÇOS HOSPITALARES", codigoSubclasse: null, nomeSubclasse: null, codigoServico: 7250,
  nomeServico: "ENDOSCOPIA DIGESTIVA CIRURGICA", statusServico: true,
};
const ITEM_REAL = {
  codigoItem: 200470, codigoGrupo: 75, codigoClasse: 7510, codigoPdm: 11, nomePdm: "CLIPE",
  descricaoItem: "CLIPE, TRATAMENTO SUPERFICIAL: COLORIDO , TAMANHO: 00 ", statusItem: true, itemSustentavel: false,
};

describe("urlPortal", () => {
  it("monta a página de PDMs com 500 por página", () => {
    expect(urlPortal("pdm", { pagina: 2 })).toBe(
      "https://dadosabertos.compras.gov.br/modulo-material/3_consultarPdmMaterial?pagina=2&tamanhoPagina=500",
    );
  });
  it("monta a página de serviços", () => {
    expect(urlPortal("servico", { pagina: 1 })).toBe(
      "https://dadosabertos.compras.gov.br/modulo-servico/6_consultarItemServico?pagina=1&tamanhoPagina=500",
    );
  });
  it("busca só itens ativos do PDM", () => {
    const url = urlPortal("itens_pdm", { codigoPdm: 11 });
    expect(url).toContain("/modulo-material/4_consultarItemMaterial?");
    expect(url).toContain("codigoPdm=11&statusItem=true");
  });
  it("busca um item pelo código", () => {
    expect(urlPortal("item", { codigoItem: 200470 })).toContain("codigoItem=200470");
  });
  it("nunca sai do host do portal, nem com número estranho", () => {
    for (const u of [urlPortal("pdm", { pagina: -1 }), urlPortal("itens_pdm", { codigoPdm: Number.NaN })]) {
      expect(new URL(u).host).toBe(HOST_PORTAL);
    }
    expect(() => urlPortal("itens_pdm", { codigoPdm: Number.NaN })).not.toThrow();
    expect(urlPortal("pdm", { pagina: -1 })).toContain("pagina=1&");
  });
});

describe("mapeamento", () => {
  it("PDM real", () => {
    expect(mapearPdm(PDM_REAL)).toEqual({
      codigo_pdm: 281, nome_pdm: "CARTUCHO CANETA TINTEIRO", codigo_classe: 7520,
      nome_classe: "ACESSÓRIOS E DISPOSITIVOS PARA ESCRITÓRIO", codigo_grupo: 75,
      nome_grupo: "UTENSÍLIOS DE ESCRITÓRIO E MATERIAL DE EXPEDIENTE", ativo: true,
    });
  });
  it("serviço real preenche seção, divisão, grupo e classe", () => {
    expect(mapearServico(SERVICO_REAL)).toMatchObject({
      codigo_servico: 7250, codigo_secao: 9, codigo_divisao: 93, codigo_grupo: 931, codigo_classe: 9311, ativo: true,
    });
  });
  it("item de material tira espaço sobrando", () => {
    expect(mapearItemMaterial(ITEM_REAL)).toEqual({
      codigo_item: 200470, codigo_pdm: 11, descricao: "CLIPE, TRATAMENTO SUPERFICIAL: COLORIDO , TAMANHO: 00",
      sustentavel: false, ativo: true,
    });
  });
  it("linha sem código vira null (não grava lixo)", () => {
    expect(mapearPdm({ nomePdm: "X" })).toBeNull();
    expect(mapearServico({ codigoServico: "abc" })).toBeNull();
    expect(mapearItemMaterial({ codigoItem: 1 })).toBeNull();
  });
});

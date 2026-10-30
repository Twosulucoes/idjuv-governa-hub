import { describe, expect, it } from "vitest";
import { montarFichaContrato } from "./ficha";
import type { ContratoAlteracao, ContratoFicha, ContratoResponsavel, ItemContrato } from "@/types/contratos";

const contrato = {
  id: "c1",
  numero_contrato: "01",
  ano: 2026,
  status: "vigente",
  objeto: "Limpeza e conservação",
  objeto_resumido: null,
  tipo_contrato: "servico_continuo",
  fundamento_legal: " Pregão 05/2025 ",
  processo_sei: "17302.000123/2025.11",
  numero_pncp: null,
  natureza_despesa: "3.3.90.37",
  dotacao_orcamentaria: "12.345",
  fonte_recurso: "500",
  valor_inicial: 120000,
  valor_atual: 132500.5,
  data_assinatura: "2026-01-02",
  data_inicio: "2026-01-02",
  data_fim: "2027-01-01",
  data_fim_atual: "2028-01-01",
  prorrogavel: true,
  prazo_maximo_meses: 120,
  data_publicacao_doe: "2026-01-10",
  numero_doe: "1234",
  garantia_tipo: "Seguro-garantia",
  garantia_valor: 6000,
  garantia_vencimento: "2027-04-01",
  observacoes: null,
  fornecedor: { id: "f", razao_social: "Empresa Ltda", nome_fantasia: "Limpa", cpf_cnpj: "11.222.333/0001-81" },
  unidade: { id: "u", sigla: "DIRAF", nome: "Diretoria" },
} as unknown as ContratoFicha;

const resp = (r: Partial<ContratoResponsavel>) => ({
  id: "r", contrato_id: "c1", servidor_id: "s", nome: "Ana", papel: "gestor", data_inicio: "2026-01-05", data_fim: null,
  motivo_saida: null, portaria_numero: "Portaria 10/2026", portaria_data: null, portaria_documento_sei: null, observacoes: null,
  ...r,
}) as ContratoResponsavel;

describe("montarFichaContrato", () => {
  it("monta os textos da ficha", () => {
    const f = montarFichaContrato(
      contrato,
      [{ numero_item: 1, descricao: "Posto", unidade_medida: "mês", quantidade: 12, valor_unitario: 1000, valor_total: 12000 } as ItemContrato],
      [resp({}), resp({ nome: "Bia", papel: "fiscal_tecnico", data_fim: "2026-06-30", motivo_saida: "exonerada", portaria_numero: null })],
      [
        {
          id: "a1", especie: "aditivo", numero: 1, altera_prazo: true, altera_valor: true, altera_objeto: false, nova_data_fim: "2028-01-01",
          valor_acrescimo: 12500.5, valor_supressao: 0, valor_variacao: 0, motivo: null, percentual: null, indice: null, data_inicio: null,
          data_retomada: null, data_assinatura: "2026-12-20", processo_sei: "17302.000123/2025.11", documento_sei: "12345678",
          data_publicacao_doe: "2026-12-28", numero_doe: "1300", descricao: "Prorroga e acrescenta", created_at: "2026-12-20T10:00:00Z",
        } as ContratoAlteracao,
      ],
      "PE 05/2025",
      "2026-10-27",
    );
    expect(f).toMatchObject({
      numero: "01/2026",
      situacao: "Vigente",
      vigenciaSituacao: "Vigente",
      contratado: "Empresa Ltda",
      tipo: "Serviço contínuo",
      fundamento: "Pregão 05/2025",
      processoContratacao: "PE 05/2025",
      numeroPncp: undefined,
      setor: "DIRAF · Diretoria",
      dotacao: "12.345 · fonte 500",
      vigencia: "02/01/2026 a 01/01/2027, prorrogada até 01/01/2028",
      prorrogacao: "Prorrogável, até 120 meses",
      publicacaoDoe: "10/01/2026 (DOE nº 1234)",
      responsaveis: [{ nome: "Ana", papel: "Gestor", portaria: "Portaria 10/2026", periodo: "desde 05/01/2026" }],
      responsaveisAnteriores: [{ nome: "Bia", papel: "Fiscal técnico", portaria: undefined, periodo: "05/01/2026 a 30/06/2026 · exonerada" }],
      itens: [{ numero: 1, descricao: "Posto", unidade: "mês", quantidade: 12, valorUnitario: 1000, valorTotal: 12000 }],
    });
    expect(f.garantia).toMatch(/^Seguro-garantia · R\$\s6\.000,00 · vence em 01\/04\/2027$/);
    expect(f.alteracoes).toHaveLength(1);
    expect(f.alteracoes[0]).toMatchObject({ data: "20/12/2026", alteracao: "1º termo aditivo", documento: "Processo 17302.000123/2025.11 · documento 12345678 · DOE 28/12/2026 nº 1300" });
    expect(f.alteracoes[0].efeito.replace(/\s/g, " ")).toBe("prorroga até 01/01/2028; acrescenta R$ 12.500,50");
    expect(f.avisosAlteracoes).toEqual([]);
    expect(f.documentoContratado).toBe("11.222.333/0001-81");
  });

  it("CPF de contratado pessoa física sai mascarado", () => {
    const pf = { ...contrato, fornecedor: { ...contrato.fornecedor, cpf_cnpj: "529.982.247-25" } } as ContratoFicha;
    expect(montarFichaContrato(pf, [], [], [], undefined, "2026-10-27").documentoContratado).toBe("***.982.247-**");
  });
});

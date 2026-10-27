import { describe, expect, it } from "vitest";
import { ehFiltroPrazo, linhasPlanilhaContratos, passaNoFiltroPrazo, resumoPainel } from "./lista";
import type { ContratoLista } from "@/types/contratos";

const HOJE = "2026-10-27";
const gestor = { papel: "gestor", nome: "Ana", servidor_id: "s1", data_fim: null };
const fiscal = { papel: "fiscal_tecnico", nome: "Bia", servidor_id: "s2", data_fim: null };

const contrato = (c: Partial<ContratoLista>): ContratoLista => ({
  id: "1",
  numero_contrato: "01",
  ano: 2026,
  processo_sei: null,
  objeto: "Limpeza e conservação",
  objeto_resumido: null,
  tipo_contrato: null,
  status: "vigente",
  valor_inicial: 100,
  valor_atual: 100,
  data_inicio: "2026-01-01",
  data_fim: "2026-12-31",
  data_fim_atual: null,
  controla_passagens: false,
  unidade_demandante_id: null,
  fornecedor: { id: "f", razao_social: "Empresa Ltda", nome_fantasia: null, cpf_cnpj: "11.222.333/0001-81" },
  unidade: { sigla: "DIRAF", nome: "Diretoria" },
  responsaveis: [gestor, fiscal],
  ...c,
});

describe("passaNoFiltroPrazo", () => {
  const em65 = contrato({ data_fim: "2026-12-31" });
  const em20 = contrato({ data_fim: "2026-11-16" });
  const vencido = contrato({ data_fim: "2026-10-01" });
  const encerrado = contrato({ status: "encerrado", data_fim: "2026-10-01" });
  const rascunho = contrato({ status: "rascunho" });
  const prorrogado = contrato({ data_fim: "2026-11-01", data_fim_atual: "2027-11-01" });

  it("vence em até N dias usa o fim atual e deixa de fora vencidos, encerrados e rascunhos", () => {
    const lista = [em65, em20, vencido, encerrado, rascunho, prorrogado];
    expect(lista.filter((c) => passaNoFiltroPrazo(c, "30", HOJE))).toEqual([em20]);
    expect(lista.filter((c) => passaNoFiltroPrazo(c, "90", HOJE))).toEqual([em65, em20]);
    expect(lista.filter((c) => passaNoFiltroPrazo(c, "vencidos", HOJE))).toEqual([vencido]);
    expect(lista.filter((c) => passaNoFiltroPrazo(c, "em_vigor", HOJE))).toEqual([em65, em20, prorrogado]);
    expect(lista.filter((c) => passaNoFiltroPrazo(c, "todos", HOJE))).toHaveLength(6);
  });

  it("sem gestor ou fiscal: só em vigor e só designação ativa conta", () => {
    const semFiscal = contrato({ responsaveis: [gestor] });
    const fiscalSaiu = contrato({ responsaveis: [gestor, { ...fiscal, data_fim: "2026-06-30" }] });
    const encerradoSem = contrato({ status: "encerrado", responsaveis: [] });
    expect([em65, semFiscal, fiscalSaiu, encerradoSem].filter((c) => passaNoFiltroPrazo(c, "sem_responsavel", HOJE)))
      .toEqual([semFiscal, fiscalSaiu]);
  });

  it("reconhece os valores do filtro vindos da URL", () => {
    expect(ehFiltroPrazo("90")).toBe(true);
    expect(ehFiltroPrazo("45")).toBe(false);
    expect(ehFiltroPrazo(null)).toBe(false);
  });
});

describe("resumoPainel", () => {
  it("conta em vigor, vencendo em 90 dias, vencidos, sem responsável e soma o valor em vigor", () => {
    const r = resumoPainel([
      contrato({ valor_atual: 1000.1 }),
      contrato({ data_fim: "2027-06-30", valor_atual: 500, responsaveis: [] }),
      contrato({ data_fim: "2026-10-01", valor_atual: 999 }),
      contrato({ status: "rascunho", valor_atual: 7 }),
    ], HOJE);
    expect(r).toEqual({ emVigor: 2, vencem90: 1, vencidos: 1, semResponsavel: 1, valorEmVigor: 1500.1 });
  });
});

describe("linhasPlanilhaContratos", () => {
  it("uma linha por contrato com gestor, fiscais e prazo", () => {
    const [l] = linhasPlanilhaContratos([contrato({ tipo_contrato: "servico_continuo" })], HOJE);
    expect(l).toMatchObject({
      Contrato: "01/2026",
      Contratado: "Empresa Ltda",
      Tipo: "Serviço contínuo",
      Setor: "DIRAF",
      Situação: "Vigente",
      "Fim (atual)": "31/12/2026",
      Prazo: "Vence em 65 dias",
      Gestor: "Ana",
      Fiscais: "Bia",
    });
  });
});

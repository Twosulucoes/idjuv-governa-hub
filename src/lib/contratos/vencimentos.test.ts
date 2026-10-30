import { describe, expect, it } from "vitest";
import {
  acaoEsperada,
  garantiaVencendo,
  linhasPlanilhaVencimentos,
  montarVencimentos,
  passaNoFiltroVencimento,
  resumoVencimentos,
  textoLimite,
  textoProvidencia,
  type ContratoVencimento,
} from "./vencimentos";

const HOJE = "2026-10-30";
let seq = 0;
const ct = (o: Partial<ContratoVencimento> = {}): ContratoVencimento => ({
  id: `c${++seq}`,
  numero_contrato: String(seq).padStart(3, "0"),
  ano: 2026,
  objeto: "Limpeza e conservação",
  objeto_resumido: null,
  status: "vigente",
  data_inicio: "2026-01-01",
  data_fim: "2026-12-31",
  data_fim_atual: "2026-12-31",
  prorrogavel: true,
  prazo_maximo_meses: 60,
  garantia_tipo: null,
  garantia_vencimento: null,
  renovacao_providencia: null,
  renovacao_processo_sei: null,
  renovacao_observacao: null,
  renovacao_atualizada_em: null,
  fornecedor: { id: "f", razao_social: "Empresa Fictícia Ltda", nome_fantasia: null },
  responsaveis: [{ papel: "gestor", nome: "Gestora Exemplo", servidor_id: "s", data_fim: null }],
  ...o,
});

describe("acaoEsperada", () => {
  it("prorrogar quando pode e cabe no prazo máximo; senão nova contratação", () => {
    expect(acaoEsperada(ct(), HOJE)).toBe("prorrogar");
    expect(acaoEsperada(ct({ prazo_maximo_meses: null }), HOJE)).toBe("prorrogar");
    expect(acaoEsperada(ct({ prorrogavel: false }), HOJE)).toBe("nova_contratacao");
    // 12 meses de prazo máximo: o fim atual já é o último dia possível
    expect(acaoEsperada(ct({ prazo_maximo_meses: 12 }), HOJE)).toBe("nova_contratacao");
  });
  it("vencido pede regularização; suspenso, a prorrogação pelo tempo parado", () => {
    expect(acaoEsperada(ct({ data_fim_atual: "2026-10-29" }), HOJE)).toBe("regularizar");
    expect(acaoEsperada(ct({ status: "suspenso" }), HOJE)).toBe("suspenso");
  });
});

describe("garantiaVencendo", () => {
  it("só a garantia que acaba antes do contrato e vence em até 120 dias", () => {
    expect(garantiaVencendo(ct({ garantia_vencimento: "2026-11-30", data_fim_atual: "2027-12-31" }), HOJE)).toBe(true);
    expect(garantiaVencendo(ct({ garantia_vencimento: "2026-10-01", data_fim_atual: "2027-12-31" }), HOJE)).toBe(true);
    expect(garantiaVencendo(ct({ garantia_vencimento: "2027-06-30", data_fim_atual: "2027-12-31" }), HOJE)).toBe(false);
    expect(garantiaVencendo(ct({ garantia_vencimento: "2027-01-31", data_fim_atual: "2026-12-31" }), HOJE)).toBe(false);
    expect(garantiaVencendo(ct(), HOJE)).toBe(false);
  });
});

describe("montarVencimentos, filtro e cartões", () => {
  const lista = [
    ct({ data_fim_atual: "2027-12-31" }), // fora: vence depois de 120 dias
    ct({ data_fim_atual: "2027-12-31", garantia_vencimento: "2026-12-01" }), // só pela garantia
    ct({ data_fim_atual: "2026-11-15", renovacao_providencia: "prorrogar", renovacao_processo_sei: "00000.000001/2026.00" }),
    ct({ data_fim_atual: "2027-01-10" }), // 72 dias
    ct({ data_fim_atual: "2026-10-01" }), // vencido
    ct({ status: "rascunho", data_fim_atual: "2026-11-01" }),
    ct({ status: "rescindido", data_fim_atual: "2026-11-01" }),
  ];
  const linhas = montarVencimentos(lista, HOJE);

  it("deixa de fora o que vence depois de 120 dias, o rascunho e o rescindido; ordena pelo mais urgente", () => {
    expect(linhas.map((l) => l.situacao.faixa)).toEqual(["vencido", "ate30", "ate90", "vigente"]);
    expect(linhas[3].garantia).toBe(true);
    expect(linhas[3].noPrazo).toBe(false);
  });

  it("filtra por faixa, garantia e só sem providência", () => {
    const quantos = (f: Parameters<typeof passaNoFiltroVencimento>[1], sem = false) =>
      linhas.filter((l) => passaNoFiltroVencimento(l, f, sem)).length;
    expect(quantos("todos")).toBe(4);
    expect(quantos("ate30")).toBe(1);
    expect(quantos("garantia")).toBe(1);
    expect(quantos("todos", true)).toBe(2); // vencido e o de 72 dias; o da garantia não está no prazo
    expect(quantos("ate30", true)).toBe(0);
  });

  it("conta os cartões", () => {
    expect(resumoVencimentos(linhas)).toEqual({ vencido: 1, ate30: 1, ate60: 0, ate90: 1, ate120: 0, garantia: 1, semProvidencia: 2 });
  });

  it("planilha com a ação esperada, a providência e o limite da prorrogação", () => {
    const [, l] = linhasPlanilhaVencimentos(linhas);
    expect(l).toMatchObject({
      "Contrato": "003/2026",
      "Contratado": "Empresa Fictícia Ltda",
      "Gestor": "Gestora Exemplo",
      "Fim (atual)": "15/11/2026",
      "Prazo": "Vence em 16 dias",
      "Pode prorrogar": "até 31/12/2030",
      "Ação esperada": "Abrir a prorrogação no SEI",
      "Providência": "Prorrogação em andamento · 00000.000001/2026.00",
    });
  });
});

describe("textos", () => {
  it("providência e limite", () => {
    expect(textoProvidencia(ct())).toBe("");
    expect(textoProvidencia(ct({ renovacao_providencia: "encerrar" }))).toBe("Encerrar no fim da vigência");
    const linha = (o: Partial<ContratoVencimento>) => ({ contrato: ct(o), limite: o.prazo_maximo_meses === null ? null : "2030-12-31" });
    expect(textoLimite(linha({}))).toBe("até 31/12/2030");
    expect(textoLimite(linha({ prorrogavel: false }))).toBe("Não prorrogável");
    expect(textoLimite(linha({ prazo_maximo_meses: null }))).toBe("Sem prazo máximo cadastrado");
  });
});

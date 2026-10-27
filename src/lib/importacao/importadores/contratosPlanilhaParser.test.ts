import { describe, expect, it } from "vitest";
import {
  CABECALHOS_MODELO,
  interpretarContratosPlanilha,
  paraContrato,
  paraSimNao,
  separarNumeroAno,
  type CampoPlanilha,
} from "./contratosPlanilhaParser";

const C = CABECALHOS_MODELO;
const planilha = (linhas: Partial<Record<CampoPlanilha, unknown>>[], extras: string[] = []) => {
  const cabecalhos = [...Object.values(C), ...extras];
  return {
    aba: "Contratos",
    cabecalhos,
    linhas: linhas.map((l, i) => ({
      numeroLinha: i + 2,
      valores: Object.fromEntries(cabecalhos.map((h) => {
        const campo = (Object.keys(C) as CampoPlanilha[]).find((k) => C[k] === h);
        return [h, campo ? (l[campo] ?? "") : "x"];
      })),
    })),
  };
};

const valida: Partial<Record<CampoPlanilha, unknown>> = {
  numero: "01",
  ano: "2026",
  documento: "11.222.333/0001-81",
  razao_social: "Empresa Limpa Ltda",
  objeto: "Limpeza e conservação",
  tipo_contrato: "Serviço contínuo",
  valor_inicial: "R$ 120.000,50",
  data_assinatura: "02/01/2026",
  data_inicio: "02/01/2026",
  data_fim: "01/01/2027",
  situacao: "Vigente",
  prorrogavel: "Sim",
  prazo_maximo_meses: "60",
  gestor_matricula: " 12345 ",
};

describe("separarNumeroAno e paraSimNao", () => {
  it("separa 01/2026 quando o ano está vazio", () => {
    expect(separarNumeroAno("01/2026", "")).toEqual({ numero: "01", ano: 2026 });
    expect(separarNumeroAno("01/2026", "2025")).toEqual({ numero: "01/2026", ano: 2025 });
    expect(separarNumeroAno("07", "abc")).toEqual({ numero: "07", ano: null });
  });
  it("sim/não", () => {
    expect(paraSimNao("Sim")).toBe(true);
    expect(paraSimNao("NÃO")).toBe(false);
    expect(paraSimNao("")).toBeNull();
    expect(paraSimNao("talvez")).toBeUndefined();
  });
});

describe("interpretarContratosPlanilha", () => {
  it("lê a linha do modelo no formato da RPC", () => {
    const r = interpretarContratosPlanilha(planilha([valida]));
    expect(r.problemas.filter((p) => p.gravidade === "erro")).toEqual([]);
    expect(paraContrato(r.linhas[0])).toMatchObject({
      indice: 0,
      numero: "01",
      ano: 2026,
      tipo_contrato: "servico_continuo",
      situacao: "vigente",
      valor_inicial: 120000.5,
      valor_atual: null,
      data_inicio: "2026-01-02",
      data_fim: "2027-01-01",
      prorrogavel: true,
      prazo_maximo_meses: 60,
      gestor_matricula: "12345",
    });
    expect(paraContrato(r.linhas[0])).not.toHaveProperty("linhaPlanilha");
  });

  it("erros por linha: repetido, data, valor, tipo, situação, fim antes do início, documento", () => {
    const r = interpretarContratosPlanilha(planilha([
      valida,
      valida,
      { ...valida, numero: "02", data_fim: "31/02/2026", valor_inicial: "muito", tipo_contrato: "Consultoria" },
      { ...valida, numero: "03", situacao: "Ativo", data_fim: "01/01/2025", documento: "123", prorrogavel: "talvez" },
    ]));
    const msgs = r.problemas.filter((p) => p.gravidade === "erro").map((p) => p.mensagem);
    expect(msgs).toEqual([
      "Linha 3: o contrato 01/2026 aparece duas vezes.",
      'Linha 4: tipo "Consultoria" desconhecido.',
      'Linha 4: fim da vigência "31/02/2026" não é uma data.',
      'Linha 4: valor inicial "muito" não é um valor.',
      'Linha 5: CNPJ ou CPF "123" inválido.',
      'Linha 5: situação "Ativo" desconhecida.',
      'Linha 5: "Prorrogável" deve ser sim ou não (veio "talvez").',
      "Linha 5: o fim da vigência vem antes do início.",
    ]);
  });

  it("sem documento só avisa; colunas desconhecidas são avisadas", () => {
    const r = interpretarContratosPlanilha(planilha([{ ...valida, documento: "" }], ["Coluna extra"]));
    expect(r.problemas).toEqual([
      { gravidade: "aviso", mensagem: "Colunas ignoradas: Coluna extra." },
      { gravidade: "aviso", mensagem: "Linha 2: sem CNPJ ou CPF: só completa contrato que já está cadastrado.", linha: 0 },
    ]);
  });

  it("sem a coluna do número a planilha é recusada", () => {
    const r = interpretarContratosPlanilha({ aba: "X", cabecalhos: ["Objeto"], linhas: [] });
    expect(r.problemas[0].mensagem).toMatch(/Nº do contrato/);
    expect(r.linhas).toEqual([]);
  });

  it("aceita o código no lugar do rótulo e ignora linha em branco", () => {
    const r = interpretarContratosPlanilha(planilha([{ ...valida, tipo_contrato: "locacao", situacao: "encerrado" }, {}]));
    expect(r.linhas).toHaveLength(1);
    expect(r.linhas[0]).toMatchObject({ tipo_contrato: "locacao", situacao: "encerrado" });
  });
});

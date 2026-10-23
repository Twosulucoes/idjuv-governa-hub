import { describe, expect, it } from "vitest";
import {
  etapaDoRotulo,
  interpretarProcessosPlanilha,
  modalidadeDoRotulo,
  paraContrato,
  paraValor,
} from "./processosPlanilhaParser";

// Dados fictícios no formato da planilha organizada (título, subtítulo, linha em branco e o cabeçalho na linha 4)
const CABECALHO = [
  "Nº", "Nº do processo SEI", "Ano", "Objeto (resumo)", "Forma de contratação", "Fase atual", "Setor atual",
  "Situação atual (detalhe)", "Data da última atualização", "Dias sem atualização", "Valor estimado (R$)",
  "Observação do valor", "Empenhado?", "Valor empenhado (R$)", "O que falta ou conferir", "Objeto completo (texto original)",
];
const SERIE_2099_05_18 = 72823; // número de série do Excel para 18/05/2099

function processo(over: Partial<Record<string, unknown>> = {}): unknown[] {
  const v: Record<string, unknown> = {
    n: 1, numero: "99999.000001/2099.01", ano: 2099, resumo: "Água e esgoto", forma: "Inexigibilidade",
    fase: "ETP", setor: "IDJUV/PRESI/DIRAF/EPC", situacao: "Processo em instrução", data: SERIE_2099_05_18,
    dias: "", valor: 562114.42, obs: "", empenhado: "NÃO", vemp: "", falta: "", objeto: "Fornecimento de água e esgoto",
    ...over,
  };
  return [v.n, v.numero, v.ano, v.resumo, v.forma, v.fase, v.setor, v.situacao, v.data, v.dias, v.valor, v.obs,
    v.empenhado, v.vemp, v.falta, v.objeto];
}

function abas(linhas: unknown[][], andamento?: unknown[][]) {
  const r: Record<string, unknown[][]> = {
    Processos: [["Relação de processos"], ["Organizada"], CABECALHO, ...linhas],
  };
  if (andamento) {
    r.Andamento = [["Andamento"], ["Uma linha por movimentação"], ["Nº do processo SEI", "Data", "Fase", "Setor", "Situação (texto livre)"], ...andamento];
  }
  return r;
}

const erros = (r: ReturnType<typeof interpretarProcessosPlanilha>) => r.problemas.filter((p) => p.gravidade === "erro").map((p) => p.mensagem);

describe("rótulos da planilha", () => {
  it("traduz as fases usadas pelo Instituto", () => {
    expect(etapaDoRotulo("Abertura (aguardando EPC)")).toBe("abertura");
    expect(etapaDoRotulo("DFD")).toBe("dfd");
    expect(etapaDoRotulo("ETP")).toBe("etp");
    expect(etapaDoRotulo("Cotação de preços")).toBe("cotacao");
    expect(etapaDoRotulo("Levantamento técnico (fora do IDJuv)")).toBe("levantamento_tecnico");
    expect(etapaDoRotulo("Instrução da adesão (aguardando documentos)")).toBe("instrucao_adesao");
    expect(etapaDoRotulo("Análise jurídica")).toBe("analise_juridica");
    expect(etapaDoRotulo("Execução: liquidação e pagamento")).toBe("execucao");
    expect(etapaDoRotulo("Em tramitação")).toBeUndefined();
  });

  it("traduz a forma de contratação; a definir e contratado ficam vazios", () => {
    expect(modalidadeDoRotulo("Adesão à ata de registro de preços")).toBe("adesao_ata");
    expect(modalidadeDoRotulo("Contratação direta (fornecedor exclusivo)")).toBe("inexigibilidade");
    expect(modalidadeDoRotulo("Inexigibilidade")).toBe("inexigibilidade");
    expect(modalidadeDoRotulo("A definir (compra ou aluguel)")).toBeNull();
    expect(modalidadeDoRotulo("Contratado (contrato 01/2026)")).toBeNull();
    expect(modalidadeDoRotulo("")).toBeNull();
    expect(modalidadeDoRotulo("Credenciamento")).toBeUndefined();
  });

  it("lê valor em número ou em texto e devolve null quando não há número", () => {
    expect(paraValor(34000000)).toBe(34000000);
    expect(paraValor("R$ 1.481.909,45")).toBe(1481909.45);
    expect(paraValor("R$")).toBeNull();
    expect(paraValor("Não informado no processo")).toBeNull();
    expect(paraValor("- - - - - - -")).toBeNull();
  });
});

describe("interpretarProcessosPlanilha", () => {
  it("lê o processo, tira o espaço do nº SEI e ignora a linha de total", () => {
    const r = interpretarProcessosPlanilha(abas([
      processo({ numero: " 99999.000001/2099.01" }),
      ["", "", "", "Total", "", "", "", "", "", "", 562114.42],
    ]));
    expect(erros(r)).toEqual([]);
    expect(r.linhas).toHaveLength(1);
    const c = paraContrato(r.linhas[0]);
    expect(c).toMatchObject({
      indice: 0, numero_processo: "99999.000001/2099.01", ano: 2099, objeto: "Fornecimento de água e esgoto",
      objeto_resumido: "Água e esgoto", modalidade: "inexigibilidade", etapa: "etp", atualizado_em: "2099-05-18",
      valor_estimado: 562114.42,
    });
    expect(c).not.toHaveProperty("linhaPlanilha");
    // sem aba Andamento, a situação atual vira a movimentação
    expect(c.andamentos).toEqual([{ data: "2099-05-18", etapa: "etp", setor: "IDJUV/PRESI/DIRAF/EPC", situacao: "Processo em instrução" }]);
  });

  it("sem data e sem valor: avisa, guarda a observação e aceita processo de outro ano", () => {
    const r = interpretarProcessosPlanilha(abas([
      processo({ numero: "99998.011845/2098.51", ano: 2098, data: "", valor: "", obs: "Posterior estimativa de preços" }),
    ]));
    expect(erros(r)).toEqual([]);
    expect(r.linhas[0]).toMatchObject({ ano: 2098, atualizado_em: null, valor_estimado: null, valor_estimado_obs: "Posterior estimativa de preços" });
    expect(r.problemas.some((p) => p.gravidade === "aviso" && p.mensagem.includes("sem data"))).toBe(true);
  });

  it("valor em texto sem número e sem observação vira a observação", () => {
    const r = interpretarProcessosPlanilha(abas([processo({ valor: "Não informado no processo" })]));
    expect(r.linhas[0]).toMatchObject({ valor_estimado: null, valor_estimado_obs: "Não informado no processo" });
  });

  it("fase ou forma desconhecida, nº SEI fora do formato e repetido são erros", () => {
    const r = interpretarProcessosPlanilha(abas([
      processo({ fase: "Em tramitação" }),
      processo({ numero: "17302.107/2099", forma: "Credenciamento" }),
      processo(),
    ]));
    const e = erros(r);
    expect(e.some((m) => m.includes('fase "Em tramitação"'))).toBe(true);
    expect(e.some((m) => m.includes("fora do formato"))).toBe(true);
    expect(e.some((m) => m.includes('"Credenciamento"'))).toBe(true);
    expect(e.some((m) => m.includes("repetido"))).toBe(true);
  });

  it("junta as movimentações da aba Andamento ao processo certo", () => {
    const r = interpretarProcessosPlanilha(abas(
      [processo(), processo({ numero: "99999.000002/2099.02", fase: "DFD", situacao: "DFD em elaboração" })],
      [
        ["99999.000001/2099.01", SERIE_2099_05_18, "ETP", "IDJUV/PRESI/DIRAF/EPC", "Processo em instrução"],
        [" 99999.000002/2099.02", "", "DFD", "", "DFD em elaboração"],
        ["99999.000009/2099.09", "", "ETP", "", "De outro processo"],
      ],
    ));
    expect(erros(r)).toEqual([]);
    expect(r.linhas[0].andamentos).toHaveLength(1);
    expect(r.linhas[1].andamentos).toEqual([{ data: null, etapa: "dfd", setor: null, situacao: "DFD em elaboração" }]);
    expect(r.problemas.some((p) => p.mensagem.includes("99999.000009/2099.09") && p.gravidade === "aviso")).toBe(true);
    expect(r.cabecalho).toEqual({ Processos: "2", Movimentações: "2" });
  });

  it("sem a coluna do nº SEI, explica o que falta", () => {
    const r = interpretarProcessosPlanilha({ Planilha1: [["NUMERO", "OBJETO"], ["1", "x"]] });
    expect(erros(r)[0]).toContain("Nº do processo SEI");
  });
});

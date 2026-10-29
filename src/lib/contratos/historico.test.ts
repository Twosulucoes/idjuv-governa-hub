import { describe, expect, it } from "vitest";
import { descreverHistorico, mudancas } from "./historico";
import type { RegistroHistorico } from "@/types/contratos";

const reg = (r: Partial<RegistroHistorico>): RegistroHistorico => ({
  id: "1",
  tabela_origem: "contratos",
  registro_id: "c1",
  acao: "UPDATE",
  campos_alterados: null,
  dados_anteriores: null,
  dados_novos: null,
  usuario_nome: null,
  created_at: "2026-10-27T10:00:00Z",
  ...r,
});

describe("mudancas", () => {
  it("formata valor, data, situação, sim/não e esconde campos técnicos", () => {
    const m = mudancas(reg({
      campos_alterados: ["valor_atual", "data_fim_atual", "status", "prorrogavel", "updated_at", "fornecedor_id", "processo_sei"],
      dados_anteriores: { valor_atual: 100, data_fim_atual: "2026-12-31", status: "vigente", prorrogavel: false, fornecedor_id: "a", processo_sei: null },
      dados_novos: { valor_atual: 120.5, data_fim_atual: "2027-12-31", status: "suspenso", prorrogavel: true, fornecedor_id: "b", processo_sei: "17302.1/2026" },
    }));
    expect(m.map((t) => t.replace(/\s/g, " "))).toEqual([
      "Valor atual: R$ 100,00 → R$ 120,50",
      "Fim atual: 31/12/2026 → 31/12/2027",
      "Situação: Vigente → Suspenso",
      "Pode ser prorrogado: não → sim",
      "Contratado: alterado",
      "Processo SEI: vazio → 17302.1/2026",
    ]);
  });
});

describe("descreverHistorico", () => {
  it("contrato cadastrado e apagado", () => {
    expect(descreverHistorico(reg({ acao: "INSERT", dados_novos: { numero_contrato: "01", ano: 2026, status: "rascunho" } })))
      .toEqual({ titulo: "Contrato 01/2026 cadastrado", detalhes: ["situação rascunho"] });
    expect(descreverHistorico(reg({ acao: "DELETE", dados_anteriores: { numero_contrato: "01", ano: 2026 } })).titulo)
      .toBe("Contrato 01/2026 apagado");
  });

  it("itens", () => {
    const novo = descreverHistorico(reg({ tabela_origem: "itens_contrato", acao: "INSERT", dados_novos: { numero_item: 2, descricao: "Limpeza", valor_total: 1000 } }));
    expect(novo.titulo).toBe("Item 2 incluído");
    expect(novo.detalhes[0]).toMatch(/^Limpeza · R\$\s1\.000,00$/);
  });

  it("designação: entrada, encerramento e alteração com rótulos próprios", () => {
    const base = { nome: "Maria", papel: "fiscal_tecnico", data_inicio: "2026-01-05" };
    expect(descreverHistorico(reg({ tabela_origem: "contrato_responsaveis", acao: "INSERT", dados_novos: { ...base, portaria_numero: "Portaria 10/2026" } })))
      .toEqual({ titulo: "Maria (Fiscal técnico) designado", detalhes: ["desde 05/01/2026 · Portaria 10/2026"] });
    expect(descreverHistorico(reg({
      tabela_origem: "contrato_responsaveis",
      campos_alterados: ["data_fim", "motivo_saida"],
      dados_anteriores: { ...base, data_fim: null },
      dados_novos: { ...base, data_fim: "2026-06-30", motivo_saida: "substituída" },
    }))).toEqual({ titulo: "Designação de Maria (Fiscal técnico) encerrada", detalhes: ["último dia 30/06/2026 · substituída"] });
    expect(descreverHistorico(reg({
      tabela_origem: "contrato_responsaveis",
      campos_alterados: ["data_inicio"],
      dados_anteriores: { ...base },
      dados_novos: { ...base, data_inicio: "2026-01-10" },
    })).detalhes).toEqual(["Início: 05/01/2026 → 10/01/2026"]);
  });
});

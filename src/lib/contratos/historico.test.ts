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
    expect(descreverHistorico(reg({ acao: "DELETE", dados_anteriores: { numero_contrato: "01", ano: 2026 } }))?.titulo)
      .toBe("Contrato 01/2026 apagado");
  });

  it("itens", () => {
    const novo = descreverHistorico(reg({ tabela_origem: "itens_contrato", acao: "INSERT", dados_novos: { numero_item: 2, descricao: "Limpeza", valor_total: 1000 } }));
    expect(novo?.titulo).toBe("Item 2 incluído");
    expect(novo?.detalhes[0]).toMatch(/^Limpeza · R\$\s1\.000,00$/);
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
    }))?.detalhes).toEqual(["Início: 05/01/2026 → 10/01/2026"]);
  });

  it("alterações do contrato: registro, retomada, correção e exclusão", () => {
    const aditivo = { especie: "aditivo", numero: 2, altera_prazo: true, nova_data_fim: "2027-12-31", valor_acrescimo: 0, valor_supressao: 0, valor_variacao: 0 };
    expect(descreverHistorico(reg({ tabela_origem: "contrato_alteracoes", acao: "INSERT", dados_novos: aditivo })))
      .toEqual({ titulo: "2º termo aditivo registrado", detalhes: ["prorroga até 31/12/2027"] });
    const suspensao = { especie: "suspensao", numero: null, data_inicio: "2026-03-10", data_retomada: null, valor_acrescimo: 0, valor_supressao: 0, valor_variacao: 0 };
    expect(descreverHistorico(reg({ tabela_origem: "contrato_alteracoes", acao: "DELETE", dados_anteriores: suspensao }))?.titulo)
      .toBe("Suspensão apagada");
    expect(descreverHistorico(reg({
      tabela_origem: "contrato_alteracoes",
      campos_alterados: ["data_retomada", "updated_at"],
      dados_anteriores: suspensao,
      dados_novos: { ...suspensao, data_retomada: "2026-04-20" },
    }))).toEqual({ titulo: "Retomada da suspensão registrada", detalhes: ["em 20/04/2026"] });
    const rescisao = { especie: "rescisao", numero: null, motivo: "unilateral", data_inicio: "2026-02-15", valor_acrescimo: 0, valor_supressao: 0, valor_variacao: 0 };
    expect(descreverHistorico(reg({
      tabela_origem: "contrato_alteracoes",
      campos_alterados: ["motivo", "data_inicio"],
      dados_anteriores: rescisao,
      dados_novos: { ...rescisao, motivo: "consensual", data_inicio: "2026-02-16" },
    }))).toEqual({
      titulo: "Rescisão corrigida",
      detalhes: ["Motivo: Unilateral (pela Administração) → Consensual (acordo entre as partes)", "Data: 15/02/2026 → 16/02/2026"],
    });
  });

  it("contrato só tocado pelo recálculo (nada visível mudou) não aparece; a providência aparece com rótulo", () => {
    expect(descreverHistorico(reg({ campos_alterados: ["updated_at", "updated_by"], dados_anteriores: {}, dados_novos: {} }))).toBeNull();
    expect(descreverHistorico(reg({
      campos_alterados: ["renovacao_providencia", "renovacao_atualizada_em"],
      dados_anteriores: { renovacao_providencia: null },
      dados_novos: { renovacao_providencia: "nova_contratacao" },
    }))?.detalhes).toEqual(["Providência do vencimento: vazio → Nova contratação em andamento"]);
  });
});

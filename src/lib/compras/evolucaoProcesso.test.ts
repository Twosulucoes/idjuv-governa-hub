import { describe, expect, it } from "vitest";
import { DIAS_PARA_PARADO, evolucaoDoProcesso, faseDaEtapa, linhaDoTempoFases } from "./evolucaoProcesso";

const andamento = (etapa: string, data: string | null) => ({
  etapa,
  data: data ?? "2026-10-25",
  data_informada: data !== null,
});

describe("faseDaEtapa", () => {
  it("agrupa as etapas do banco nas seis fases", () => {
    expect(faseDaEtapa("dfd")?.codigo).toBe("planejamento");
    expect(faseDaEtapa("levantamento_tecnico")?.codigo).toBe("planejamento");
    expect(faseDaEtapa("instrucao_adesao")?.codigo).toBe("analise_juridica");
    expect(faseDaEtapa("selecao")?.codigo).toBe("selecao");
    expect(faseDaEtapa("encerrado")?.codigo).toBe("encerrado");
  });
  it("cancelado e etapa desconhecida não têm fase", () => {
    expect(faseDaEtapa("cancelado")).toBeNull();
    expect(faseDaEtapa("qualquer")).toBeNull();
    expect(faseDaEtapa(null)).toBeNull();
  });
});

describe("evolucaoDoProcesso", () => {
  const hoje = "2026-10-25";
  it("percentual pela fase: seleção é a 3ª de 6", () => {
    const e = evolucaoDoProcesso({ etapa: "selecao", atualizado_em: "2026-10-20" }, hoje);
    expect(e.percentual).toBe(50);
    expect(e.indiceAtual).toBe(2);
    expect(e.cancelado).toBe(false);
    expect(e.parado).toBe(false);
  });
  it("encerrado é 100% e nunca fica parado", () => {
    const e = evolucaoDoProcesso({ etapa: "encerrado", atualizado_em: "2026-01-01" }, hoje);
    expect(e.percentual).toBe(100);
    expect(e.parado).toBe(false);
  });
  it(`fica parado depois de ${DIAS_PARA_PARADO} dias sem andamento`, () => {
    expect(evolucaoDoProcesso({ etapa: "tr", atualizado_em: "2026-10-10" }, hoje).parado).toBe(false); // 15 dias
    expect(evolucaoDoProcesso({ etapa: "tr", atualizado_em: "2026-10-09" }, hoje).parado).toBe(true); // 16 dias
    expect(evolucaoDoProcesso({ etapa: "tr", atualizado_em: null }, hoje).parado).toBe(false);
  });
  it("cancelado guarda a última fase alcançada pelo andamento", () => {
    const e = evolucaoDoProcesso({ etapa: "cancelado", atualizado_em: "2026-10-01" }, hoje, [
      andamento("dfd", "2026-03-01"),
      andamento("analise_juridica", "2026-05-01"),
      andamento("cancelado", "2026-06-01"),
    ]);
    expect(e.cancelado).toBe(true);
    expect(e.parado).toBe(false);
    expect(e.indiceAtual).toBe(1);
  });
});

describe("linhaDoTempoFases", () => {
  const hoje = "2026-10-25";
  it("data de início e dias em cada fase; a fase atual conta até hoje", () => {
    const fases = linhaDoTempoFases({ etapa: "selecao", atualizado_em: "2026-10-20" }, [
      andamento("dfd", "2026-03-02"),
      andamento("etp", "2026-03-20"),
      andamento("analise_juridica", "2026-04-01"),
      andamento("selecao", "2026-10-15"),
    ], hoje);
    expect(fases.map((f) => f.situacao)).toEqual(["concluida", "concluida", "atual", "pendente", "pendente", "pendente"]);
    expect(fases[0]).toMatchObject({ inicio: "2026-03-02", dias: 30 });
    expect(fases[1]).toMatchObject({ inicio: "2026-04-01", dias: 197 });
    expect(fases[2]).toMatchObject({ inicio: "2026-10-15", dias: 10 });
    expect(fases[3]).toMatchObject({ inicio: null, dias: null });
  });
  it("fase concluída sem andamento datado (pulada ou sem data) fica sem início", () => {
    const fases = linhaDoTempoFases({ etapa: "contrato", atualizado_em: null }, [
      andamento("tr", "2026-02-01"),
      andamento("selecao", null),
      andamento("contrato", "2026-08-01"),
    ], hoje);
    expect(fases[0]).toMatchObject({ situacao: "concluida", inicio: "2026-02-01", dias: 181 });
    expect(fases[1]).toMatchObject({ situacao: "concluida", inicio: null, dias: null });
    expect(fases[2]).toMatchObject({ situacao: "concluida", inicio: null, dias: null });
    expect(fases[3]).toMatchObject({ situacao: "atual", inicio: "2026-08-01", dias: 85 });
  });
  it("devolução: a fase conta da primeira entrada", () => {
    const fases = linhaDoTempoFases({ etapa: "analise_juridica", atualizado_em: "2026-06-01" }, [
      andamento("tr", "2026-02-01"),
      andamento("analise_juridica", "2026-03-01"),
      andamento("tr", "2026-04-01"),
      andamento("analise_juridica", "2026-06-01"),
    ], hoje);
    expect(fases[0]).toMatchObject({ inicio: "2026-02-01", dias: 28 });
    expect(fases[1]).toMatchObject({ situacao: "atual", inicio: "2026-03-01" });
  });
  it("cancelado: fases depois da última alcançada ficam canceladas", () => {
    const fases = linhaDoTempoFases({ etapa: "cancelado", atualizado_em: "2026-06-01" }, [
      andamento("dfd", "2026-03-01"),
      andamento("cancelado", "2026-06-01"),
    ], hoje);
    expect(fases[0]).toMatchObject({ situacao: "cancelada", inicio: "2026-03-01", dias: 92 });
    expect(fases.slice(1).every((f) => f.situacao === "pendente")).toBe(true);
  });
});

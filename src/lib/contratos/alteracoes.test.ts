import { describe, expect, it } from "vitest";
import {
  avisosLimites,
  efeitosAlteracao,
  fimCalculado,
  limiteProrrogacao,
  ordenarAlteracoes,
  proximoNumero,
  resumoAlteracoes,
  simularAlteracao,
  textoDocumentoSei,
  tituloAlteracao,
  valorCalculado,
} from "./alteracoes";
import type { ContratoAlteracao } from "@/types/contratos";

const sp = (t: string) => t.replace(/\s/g, " ");

let seq = 0;
const alt = (o: Partial<ContratoAlteracao>): ContratoAlteracao => ({
  id: `a${++seq}`,
  contrato_id: "c1",
  especie: "aditivo",
  numero: 1,
  altera_prazo: false,
  altera_valor: false,
  altera_objeto: false,
  motivo: null,
  valor_acrescimo: 0,
  valor_supressao: 0,
  valor_variacao: 0,
  percentual: null,
  indice: null,
  nova_data_fim: null,
  data_inicio: null,
  data_retomada: null,
  descricao: "x",
  justificativa: null,
  fundamento_legal: null,
  processo_sei: null,
  documento_sei: null,
  documento_retomada_sei: null,
  data_assinatura: "2026-06-01",
  data_publicacao_doe: null,
  numero_doe: null,
  created_at: "2026-06-01T10:00:00Z",
  created_by: null,
  updated_at: "2026-06-01T10:00:00Z",
  updated_by: null,
  ...o,
});

const contrato = {
  valor_inicial: 100_000,
  data_inicio: "2026-01-01",
  data_fim: "2026-12-31",
  prorrogavel: true,
  prazo_maximo_meses: 60,
  reforma: false,
};

describe("valorCalculado e fimCalculado (mesma regra do banco, contratos_preparar)", () => {
  it("soma acréscimos, tira supressões e aplica as variações com sinal", () => {
    const lista = [
      alt({ altera_valor: true, valor_acrescimo: 20_000 }),
      alt({ numero: 2, altera_valor: true, valor_supressao: 5_000 }),
      alt({ especie: "apostilamento", motivo: "reajuste", valor_variacao: -1_000 }),
      alt({ especie: "partida", numero: null, data_assinatura: null, valor_variacao: 500 }),
    ];
    expect(valorCalculado(100_000, lista)).toBe(114_500);
    expect(valorCalculado(100_000, [])).toBe(100_000);
  });

  it("fim: rescisão vence tudo; senão a última por assinatura; a partida conta como a mais antiga", () => {
    const prazo = alt({ altera_prazo: true, nova_data_fim: "2027-12-31", data_assinatura: "2026-12-01" });
    const partida = alt({ especie: "partida", numero: null, data_assinatura: null, nova_data_fim: "2028-06-30" });
    expect(fimCalculado(contrato, [])).toBe("2026-12-31");
    expect(fimCalculado(contrato, [partida])).toBe("2028-06-30");
    expect(fimCalculado(contrato, [partida, prazo])).toBe("2027-12-31");
    const antigo = alt({ numero: 2, altera_prazo: true, nova_data_fim: "2029-01-01", data_assinatura: "2026-02-01" });
    expect(fimCalculado(contrato, [prazo, antigo])).toBe("2027-12-31");
    const rescisao = alt({ especie: "rescisao", numero: null, motivo: "consensual", data_inicio: "2026-08-15" });
    expect(fimCalculado(contrato, [prazo, rescisao])).toBe("2026-08-15");
  });
});

describe("resumoAlteracoes", () => {
  it("separa acréscimos, supressões, reajustes e a situação anterior; % sobre o inicial atualizado", () => {
    const r = resumoAlteracoes(contrato, [
      alt({ altera_valor: true, valor_acrescimo: 26_000 }),
      alt({ especie: "apostilamento", motivo: "reajuste", valor_variacao: 4_000 }),
      alt({ especie: "apostilamento", numero: 2, motivo: "outro", valor_variacao: 2_000 }),
      alt({ especie: "partida", numero: null, data_assinatura: null, valor_variacao: 1_000 }),
    ]);
    expect(r).toMatchObject({
      valorInicial: 100_000,
      acrescimos: 26_000,
      supressoes: 0,
      reajustes: 4_000,
      outrosApostilamentos: 2_000,
      anterior: 1_000,
      valorAtual: 133_000,
      valorInicialAtualizado: 104_000,
      percentualAcrescimo: 25,
      limitePercentual: 25,
      passouLimiteAcrescimo: false,
      fimOriginal: "2026-12-31",
      fimAtual: "2026-12-31",
      limiteProrrogacao: "2030-12-31",
      passouPrazoMaximo: false,
    });
  });

  it("reforma sobe o limite de acréscimo para 50%; supressão tem o seu próprio limite de 25%", () => {
    const lista = [alt({ altera_valor: true, valor_acrescimo: 30_000, valor_supressao: 26_000 })];
    expect(resumoAlteracoes(contrato, lista)).toMatchObject({ passouLimiteAcrescimo: true, passouLimiteSupressao: true });
    expect(resumoAlteracoes({ ...contrato, reforma: true }, lista)).toMatchObject({
      limitePercentual: 50,
      passouLimiteAcrescimo: false,
      passouLimiteSupressao: true,
    });
  });

  it("aponta a rescisão, a suspensão em aberto e o prazo máximo vencido", () => {
    const suspensa = alt({ especie: "suspensao", numero: null, data_inicio: "2026-05-01" });
    const longa = alt({ altera_prazo: true, nova_data_fim: "2031-01-15" });
    const r = resumoAlteracoes(contrato, [suspensa, longa]);
    expect(r.suspensaoAberta?.id).toBe(suspensa.id);
    expect(r.rescisao).toBeNull();
    expect(r.passouPrazoMaximo).toBe(true);
    expect(resumoAlteracoes(contrato, [{ ...suspensa, data_retomada: "2026-06-01" }]).suspensaoAberta).toBeNull();
  });
});

describe("limiteProrrogacao", () => {
  it("início + prazo máximo − 1 dia; nada sem prazo ou sem prorrogação", () => {
    expect(limiteProrrogacao(contrato)).toBe("2030-12-31");
    expect(limiteProrrogacao({ ...contrato, data_inicio: "2026-03-15", prazo_maximo_meses: 12 })).toBe("2027-03-14");
    expect(limiteProrrogacao({ ...contrato, data_inicio: "2026-01-31", prazo_maximo_meses: 1 })).toBe("2026-02-27");
    expect(limiteProrrogacao({ ...contrato, prazo_maximo_meses: null })).toBeNull();
    expect(limiteProrrogacao({ ...contrato, prorrogavel: false })).toBeNull();
  });
});

describe("avisosLimites", () => {
  it("avisa acréscimo, supressão, prazo máximo e aditivo de prazo em contrato não prorrogável", () => {
    const lista = [alt({ altera_prazo: true, altera_valor: true, nova_data_fim: "2031-06-30", valor_acrescimo: 27_500, valor_supressao: 30_000 })];
    expect(avisosLimites({ ...contrato, prorrogavel: false }, lista).map(sp)).toEqual([
      "Os acréscimos somam 27,5% do valor inicial atualizado; o limite é 25% (art. 125 da Lei 14.133).",
      "As supressões somam 30% do valor inicial atualizado; o limite é 25% (art. 125 da Lei 14.133).",
      "O contrato está cadastrado como não prorrogável, mas tem aditivo de prazo: confira o cadastro.",
    ]);
    expect(avisosLimites(contrato, lista).map(sp)).toContain(
      "A vigência vai até 30/06/2031, depois do prazo máximo de 60 meses (até 31/12/2030).",
    );
    expect(avisosLimites(contrato, [])).toEqual([]);
  });
});

describe("textos de cada alteração", () => {
  it("aditivo e apostilamento com número, efeito e valores", () => {
    const aditivo = alt({ numero: 2, altera_prazo: true, altera_valor: true, altera_objeto: true, nova_data_fim: "2027-12-31", valor_acrescimo: 12_000 });
    expect(tituloAlteracao(aditivo)).toBe("2º termo aditivo");
    expect(efeitosAlteracao(aditivo).map(sp)).toEqual(["prorroga até 31/12/2027", "acrescenta R$ 12.000,00", "altera o objeto"]);
    const reajuste = alt({ especie: "apostilamento", motivo: "reajuste", percentual: 4.5, indice: "IPCA", valor_variacao: 3_200 });
    expect(efeitosAlteracao(reajuste).map(sp)).toEqual(["reajuste de 4,5% (IPCA)", "soma R$ 3.200,00"]);
    const baixa = alt({ especie: "apostilamento", motivo: "repactuacao", valor_variacao: -800 });
    expect(efeitosAlteracao(baixa).map(sp)).toEqual(["repactuação", "reduz R$ 800,00"]);
    expect(efeitosAlteracao(alt({ especie: "apostilamento", motivo: "dotacao" }))).toEqual(["dotação orçamentária"]);
    const prorroga = alt({ especie: "apostilamento", numero: 3, motivo: "prorrogacao_suspensao", nova_data_fim: "2027-02-10" });
    expect(tituloAlteracao(prorroga)).toBe("3º apostilamento");
    expect(efeitosAlteracao(prorroga).map(sp)).toEqual(["prorroga até 10/02/2027 pelo tempo suspenso"]);
    expect(efeitosAlteracao(alt({ especie: "apostilamento", motivo: "outro", descricao: "Troca do preposto" }))).toEqual([]);
  });

  it("suspensão, rescisão e situação anterior", () => {
    const aberta = alt({ especie: "suspensao", numero: null, data_inicio: "2026-03-10" });
    expect(tituloAlteracao(aberta)).toBe("Suspensão");
    expect(efeitosAlteracao(aberta)).toEqual(["desde 10/03/2026, em aberto"]);
    expect(efeitosAlteracao(alt({ especie: "suspensao", numero: null, data_inicio: "2026-03-10", data_retomada: "2026-04-20" })))
      .toEqual(["de 10/03/2026 a 20/04/2026 (41 dias)"]);
    expect(efeitosAlteracao(alt({ especie: "rescisao", numero: null, motivo: "consensual", data_inicio: "2026-02-15" })))
      .toEqual(["consensual (acordo entre as partes), em 15/02/2026"]);
    const partida = alt({ especie: "partida", numero: null, data_assinatura: null, valor_variacao: 1_000, nova_data_fim: "2027-12-31" });
    expect(tituloAlteracao(partida)).toBe("Situação anterior ao sistema");
    expect(efeitosAlteracao(partida).map(sp)).toEqual(["soma R$ 1.000,00", "fim em 31/12/2027"]);
  });

  it("documento no SEI numa linha", () => {
    expect(textoDocumentoSei(alt({ processo_sei: "17302.000123/2025.11", documento_sei: "23456789", data_publicacao_doe: "2026-07-22", numero_doe: "4890" })))
      .toBe("Processo 17302.000123/2025.11 · documento 23456789 · DOE 22/07/2026 nº 4890");
    expect(textoDocumentoSei(alt({ documento_sei: "1" }))).toBe("documento 1");
    expect(textoDocumentoSei(alt({}))).toBe("");
  });
});

describe("proximoNumero e ordenarAlteracoes", () => {
  it("próximo número por espécie", () => {
    const lista = [alt({ numero: 1 }), alt({ numero: 3 }), alt({ especie: "apostilamento", numero: 1 })];
    expect(proximoNumero(lista, "aditivo")).toBe(4);
    expect(proximoNumero(lista, "apostilamento")).toBe(2);
    expect(proximoNumero([], "aditivo")).toBe(1);
  });

  it("linha do tempo: situação anterior primeiro, depois pela data do ato", () => {
    const a = alt({ data_assinatura: "2026-09-01" });
    const b = alt({ especie: "suspensao", numero: null, data_assinatura: null, data_inicio: "2026-03-10" });
    const p = alt({ especie: "partida", numero: null, data_assinatura: null, valor_variacao: 1 });
    expect(ordenarAlteracoes([a, b, p]).map((x) => x.id)).toEqual([p.id, b.id, a.id]);
  });
});

describe("simularAlteracao", () => {
  it("mostra como ficam o valor e o fim com a alteração nova ou corrigida", () => {
    const existente = alt({ altera_valor: true, valor_acrescimo: 10_000 });
    const nova = alt({ id: "", numero: 2, altera_prazo: true, nova_data_fim: "2027-06-30", data_assinatura: "2026-12-01" });
    expect(simularAlteracao(contrato, [existente], nova)).toMatchObject({ valorAtual: 110_000, fimAtual: "2027-06-30" });
    const corrigida = { ...existente, valor_acrescimo: 15_000 };
    expect(simularAlteracao(contrato, [existente], corrigida)).toMatchObject({ valorAtual: 115_000, fimAtual: "2026-12-31" });
  });
});

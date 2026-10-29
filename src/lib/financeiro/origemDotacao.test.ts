import { describe, expect, it } from "vitest";
import {
  agruparPorNatureza,
  ehEmenda,
  empenhadoPorEmenda,
  resumirPorOrigem,
  rotuloOrigem,
  saldoEmenda,
  semEmendaCadastrada,
} from "./origemDotacao";

function dotacao(id: string, natureza: string, idu: string | null, atual: number, reserva: number, empenhado: number) {
  return {
    id,
    idu,
    natureza_despesa: { codigo: natureza },
    fonte_recurso: { codigo: "1.500" },
    valor_atual: atual,
    valor_bloqueado: 0,
    valor_reserva: reserva,
    valor_empenhado: empenhado,
    saldo_disponivel: atual - reserva - empenhado,
  };
}

const dotacoes = [
  dotacao("a", "33903900", "EII", 800, 100, 250),
  dotacao("b", "33903900", "Não", 1000, 0, 600),
  dotacao("c", "33903900", "ECI", 500, 0, 0),
  dotacao("d", "33903000", "Não", 300, 50, 0),
];

describe("origem da dotação", () => {
  it("trata 'Não' e IDU vazio como dotação comum", () => {
    expect(ehEmenda("Não")).toBe(false);
    expect(ehEmenda(null)).toBe(false);
    expect(ehEmenda("")).toBe(false);
    expect(ehEmenda("ECI")).toBe(true);
  });

  it("escreve a sigla por extenso", () => {
    expect(rotuloOrigem("Não")).toBe("Dotação comum");
    expect(rotuloOrigem("EII")).toBe("Emenda individual impositiva (EII)");
    expect(rotuloOrigem("XYZ")).toBe("Emenda XYZ");
  });

  it("separa o disponível comum do de emendas", () => {
    const r = resumirPorOrigem(dotacoes);
    expect(r.comum.disponivel).toBe(400 + 250);
    expect(r.emendas.disponivel).toBe(450 + 500);
    expect(r.porTipo.map((t) => t.idu)).toEqual(["ECI", "EII"]);
    expect(r.porTipo[1].totais).toMatchObject({ atual: 800, reserva: 100, empenhado: 250, disponivel: 450 });
  });

  it("agrupa por natureza com a dotação comum primeiro e subtotal só quando há mais de uma origem", () => {
    const grupos = agruparPorNatureza(dotacoes);
    expect(grupos.map((g) => g.natureza)).toEqual(["33903000", "33903900"]);
    expect(grupos[0].subtotal).toBeNull();
    expect(grupos[1].dotacoes.map((d) => d.idu)).toEqual(["Não", "ECI", "EII"]);
    expect(grupos[1].subtotal?.disponivel).toBe(400 + 500 + 450);
    expect(grupos[1].disponivelComum).toBe(400);
  });
});

describe("emendas cadastradas", () => {
  const emendas = [
    { id: "e1", dotacao_id: "a", valor: 500, valor_reservado: 100 },
    { id: "e2", dotacao_id: "a", valor: 200, valor_reservado: 0 },
  ];

  it("soma o empenhado líquido dos empenhos ligados a cada emenda", () => {
    const mapa = empenhadoPorEmenda([
      { emenda_id: "e1", valor_empenhado: 150, valor_anulado: 50 },
      { emenda_id: "e1", valor_empenhado: 100, valor_anulado: null },
      { emenda_id: null, valor_empenhado: 999 },
    ]);
    expect(mapa.get("e1")).toBe(200);
    expect(mapa.has("e2")).toBe(false);
    expect(saldoEmenda(emendas[0], mapa.get("e1") ?? 0)).toEqual({ valor: 500, reservado: 100, empenhado: 200, livre: 200 });
  });

  it("mostra quanto da dotação ainda não tem emenda cadastrada", () => {
    expect(semEmendaCadastrada({ id: "a", valor_atual: 800 }, emendas)).toBe(100);
    expect(semEmendaCadastrada({ id: "a", valor_atual: 600 }, emendas)).toBe(-100);
  });
});

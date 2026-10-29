import { describe, expect, it } from "vitest";
import {
  alertasDeSaldo,
  execucaoPorGrupo,
  filaDePagamento,
  formatarNatureza,
  maioresDespesas,
  resumirExecucao,
  type DotacaoPainel,
  type EmpenhoPainel,
} from "./painelExecucao";

const dot = (natureza: string | null, v: Partial<DotacaoPainel> = {}): DotacaoPainel => ({
  natureza,
  natureza_nome: null,
  fonte: "1.500",
  paoe: "1000 - Ação fictícia",
  valor_atual: 0,
  valor_empenhado: 0,
  valor_liquidado: 0,
  valor_pago: 0,
  valor_bloqueado: 0,
  valor_reserva: 0,
  valor_ped: 0,
  ...v,
});

// Fictícia, mas com os totais conferidos no FIPLAN em 23/10/2026 (FIP 613 + FIP 608). Como no QDD, o PED é
// acumulado: empenhado + Cont./Reserva.
const fixture: DotacaoPainel[] = [
  dot("31901100", {
    valor_atual: 4251000,
    valor_empenhado: 4230670.92,
    valor_liquidado: 4041458.46,
    valor_pago: 4041458.46,
    valor_ped: 4230670.92,
  }),
  dot("33504100", {
    valor_atual: 28321670,
    valor_empenhado: 16653365.63,
    valor_liquidado: 14886115.63,
    valor_pago: 14886115.63,
    valor_reserva: 3899946.56,
    valor_ped: 20553312.19,
  }),
  dot("33903000", { valor_atual: 361000, valor_bloqueado: 70000, valor_reserva: 64290, valor_ped: 64290 }),
  dot("33903300", {
    valor_atual: 10898080.82,
    valor_empenhado: 5786797.87,
    valor_liquidado: 3465794.28,
    valor_pago: 1262346.77,
    valor_reserva: 1712182.44,
    valor_ped: 7498980.31,
  }),
];

describe("resumirExecucao", () => {
  it("reproduz os totais conferidos no FIPLAN", () => {
    const r = resumirExecucao(fixture);
    expect(r.autorizado).toBeCloseTo(43831750.82, 2);
    expect(r.empenhado).toBeCloseTo(26670834.42, 2);
    expect(r.pago).toBeCloseTo(20189920.86, 2);
    expect(r.bloqueado).toBeCloseTo(70000, 2);
    expect(r.reservado).toBeCloseTo(5676419, 2);
    expect(r.saldoEmpenhar).toBeCloseTo(11414497.4, 2);
    expect(r.pctPago).toBeCloseTo(46.06, 2);
  });

  it("não desconta o empenhado nem a reserva duas vezes (o PED do QDD já soma os dois)", () => {
    const r = resumirExecucao(fixture);
    expect(r.saldoEmpenhar).toBeGreaterThan(0);
    expect(r.autorizado - r.bloqueado - r.empenhado - r.reservado).toBeCloseTo(r.saldoEmpenhar, 2);
  });

  it("PED zerado ou menor que o empenhado: vale empenhado + reserva", () => {
    const r = resumirExecucao([
      dot("33903900", { valor_atual: 1000, valor_empenhado: 300, valor_reserva: 100, valor_ped: 0 }),
      dot("33903000", { valor_atual: 1000, valor_empenhado: 300, valor_reserva: 0, valor_ped: 250 }),
    ]);
    expect(r.saldoEmpenhar).toBe(600 + 700);
    expect(r.reservado).toBe(100);
  });

  it("lista vazia dá zeros, sem NaN", () => {
    const r = resumirExecucao([]);
    expect(Object.values(r).every((v) => v === 0)).toBe(true);
  });

  it("valores nulos contam como zero", () => {
    const r = resumirExecucao([
      dot("33903900", { valor_atual: 100, valor_ped: null, valor_reserva: null, valor_bloqueado: null, valor_empenhado: null }),
    ]);
    expect(r.saldoEmpenhar).toBe(100);
    expect(r.reservado).toBe(0);
  });
});

describe("execucaoPorGrupo", () => {
  it("agrupa pelo 2º dígito da natureza, com ou sem pontos, e põe 'Sem natureza' por último", () => {
    const g = execucaoPorGrupo([
      dot(null, { valor_atual: 5 }),
      dot("3.3.90.39", { valor_atual: 30 }),
      dot("3.1.90.11", { valor_atual: 10, valor_empenhado: 4 }),
      dot("31901300", { valor_atual: 20 }),
      dot("44905200", { valor_atual: 7 }),
    ]);
    expect(g.map((x) => x.grupo)).toEqual(["1", "3", "4", "sem"]);
    expect(g.map((x) => x.rotulo)).toEqual(["Pessoal", "Custeio", "Investimento", "Sem natureza"]);
    expect(g[0].autorizado).toBe(30);
    expect(g[0].saldoEmpenhar).toBe(26);
  });
});

describe("alertasDeSaldo", () => {
  const vencimentos = dot("31901100", {
    valor_atual: 4251000,
    valor_empenhado: 4230670.92,
    valor_liquidado: 4041458.46,
  });

  it("alerta os vencimentos de outubro, contando o 13º", () => {
    const [a, ...resto] = alertasDeSaldo([vencimentos], 10);
    expect(resto).toHaveLength(0);
    expect(a.natureza).toBe("31901100");
    expect(a.ritmoMensal).toBeCloseTo(404145.85, 1);
    expect(a.mesesRestantes).toBe(3);
    expect(a.cobertura).toBeCloseTo(209541.54, 2);
    expect(a.necessidade).toBeCloseTo(1212437.54, 1);
    expect(a.falta).toBeCloseTo(1002896.0, 1);
  });

  it("não alerta sem nada liquidado nem com saldo de sobra", () => {
    expect(alertasDeSaldo([dot("33903900", { valor_atual: 1000 })], 10)).toEqual([]);
    expect(
      alertasDeSaldo([dot("33903900", { valor_atual: 1000, valor_empenhado: 100, valor_liquidado: 100 })], 10),
    ).toEqual([]);
  });

  it("13º só nas obrigações de pessoal (elementos 11 e 13)", () => {
    const patronal = dot("31901300", { valor_atual: 100, valor_empenhado: 100, valor_liquidado: 100 });
    const servicos = dot("33903900", { valor_atual: 100, valor_empenhado: 100, valor_liquidado: 100 });
    const [p] = alertasDeSaldo([patronal], 10);
    const [s] = alertasDeSaldo([servicos], 10);
    expect(p.mesesRestantes).toBe(3);
    expect(s.mesesRestantes).toBe(2);
  });

  it("dezembro e janeiro não quebram", () => {
    const servicos = dot("33903900", { valor_atual: 100, valor_empenhado: 100, valor_liquidado: 100 });
    expect(alertasDeSaldo([servicos], 12)).toEqual([]);
    const [j] = alertasDeSaldo([servicos], 1);
    expect(j.ritmoMensal).toBe(100);
    expect(j.mesesRestantes).toBe(11);
  });

  it("exercício encerrado não gera alerta, nem o do 13º", () => {
    expect(alertasDeSaldo([vencimentos], 12, { encerrado: true })).toEqual([]);
    expect(alertasDeSaldo([vencimentos], 12)).toHaveLength(1);
  });

  it("ignora natureza nula e ordena por quanto falta", () => {
    const pequena = dot("33903900", { valor_atual: 10, valor_empenhado: 10, valor_liquidado: 10 });
    const grande = dot("33903000", { valor_atual: 100, valor_empenhado: 100, valor_liquidado: 100 });
    const lista = alertasDeSaldo([dot(null, { valor_liquidado: 5 }), pequena, grande], 6);
    expect(lista.map((a) => a.natureza)).toEqual(["33903000", "33903900"]);
  });
});

describe("filaDePagamento", () => {
  const hoje = new Date("2026-10-23T12:00:00");
  const emp = (v: Partial<EmpenhoPainel>): EmpenhoPainel => ({
    credor: "Empresa Fictícia A",
    data_empenho: "2026-10-13",
    saldo_liquidar: 0,
    saldo_pagar: 0,
    status: "emitido",
    ...v,
  });

  it("soma por credor, conta dias do mais antigo e ordena pelo liquidado a pagar", () => {
    const fila = filaDePagamento(
      [
        emp({ saldo_liquidar: 100, data_empenho: "2026-10-20" }),
        emp({ saldo_pagar: 50 }),
        emp({ credor: "Empresa Fictícia B", saldo_pagar: 500 }),
        emp({ credor: "Empresa Fictícia C", saldo_pagar: 900, status: "anulado" }),
        emp({ credor: "Empresa Fictícia D" }),
        emp({ credor: null, saldo_liquidar: 1 }),
      ],
      hoje,
    );
    expect(fila.map((c) => c.credor)).toEqual(["Empresa Fictícia B", "Empresa Fictícia A", "Credor não informado"]);
    expect(fila[1]).toEqual({ credor: "Empresa Fictícia A", aLiquidar: 100, aPagar: 50, empenhos: 2, diasMaisAntigo: 10 });
  });
});

describe("maioresDespesas", () => {
  it("agrupa pelo elemento, limita a 5 e calcula a % do liquidado", () => {
    const d = [
      dot("33903901", { valor_liquidado: 30, natureza_nome: "Serviços PJ" }),
      dot("339039", { valor_liquidado: 30 }),
      dot("31901100", { valor_liquidado: 40 }),
      dot("33903000", { valor_liquidado: 0 }),
    ];
    const m = maioresDespesas(d);
    expect(m.map((x) => x.elemento)).toEqual(["339039", "319011"]);
    expect(m[0]).toMatchObject({ liquidado: 60, pct: 60, nome: "Serviços PJ" });
    const muitas = Array.from({ length: 8 }, (_, i) => dot(`3390${10 + i}00`, { valor_liquidado: i + 1 }));
    expect(maioresDespesas(muitas)).toHaveLength(5);
  });
});

describe("formatarNatureza", () => {
  it("põe os pontos do FIPLAN e tira o subelemento 00", () => {
    expect(formatarNatureza("31901100")).toBe("3.1.90.11");
    expect(formatarNatureza("33903901")).toBe("3.3.90.39.01");
    expect(formatarNatureza("3.3.90.39")).toBe("3.3.90.39");
    expect(formatarNatureza("339039")).toBe("3.3.90.39");
    expect(formatarNatureza(null)).toBe("—");
  });
});

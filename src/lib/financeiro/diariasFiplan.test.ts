import { describe, expect, it } from "vitest";
import { diasDesdeRetorno, resumirDiarias, situacaoPrestacao, type DiariaParaRegra } from "./diariasFiplan";

// 30/10/2026, meio-dia, para não depender do fuso
const hoje = new Date(2026, 9, 30, 12);

const diaria = (over: Partial<DiariaParaRegra> = {}): DiariaParaRegra => ({
  valor_empenhado: "300.00", prestou_contas: false, data_retorno: "2026-10-20", servidor_id: "s1", ...over,
});

describe("diasDesdeRetorno", () => {
  it("conta os dias inteiros desde o retorno", () => {
    expect(diasDesdeRetorno("2026-10-20", hoje)).toBe(10);
    expect(diasDesdeRetorno("2026-10-30", hoje)).toBe(0);
    expect(diasDesdeRetorno("2026-11-02", hoje)).toBe(-3);
    expect(diasDesdeRetorno(null, hoje)).toBeNull();
  });
});

describe("situacaoPrestacao", () => {
  it("até 10 dias do retorno está no prazo; com 11 está atrasada", () => {
    expect(situacaoPrestacao(diaria({ data_retorno: "2026-10-20" }), hoje)).toBe("no_prazo");
    expect(situacaoPrestacao(diaria({ data_retorno: "2026-10-19" }), hoje)).toBe("atrasada");
  });

  it("quem prestou contas não conta prazo; sem retorno não dá para medir", () => {
    expect(situacaoPrestacao(diaria({ prestou_contas: true, data_retorno: "2026-01-01" }), hoje)).toBe("prestou");
    expect(situacaoPrestacao(diaria({ data_retorno: null }), hoje)).toBe("sem_retorno");
  });
});

describe("resumirDiarias", () => {
  it("soma o total, as pendentes e as atrasadas", () => {
    const r = resumirDiarias([
      diaria(),
      diaria({ valor_empenhado: 1080, data_retorno: "2026-06-09" }),
      diaria({ valor_empenhado: 540, prestou_contas: true, servidor_id: "s2" }),
    ], hoje);
    expect(r).toEqual({ quantidade: 3, valor: 1920, servidores: 2, pendentes: 2, valorPendente: 1380, atrasadas: 1 });
  });

  it("sem servidor ligado, conta pelo código do credor", () => {
    const r = resumirDiarias([
      diaria({ servidor_id: null, credor_codigo: "1" }),
      diaria({ servidor_id: null, credor_codigo: "2" }),
    ], hoje);
    expect(r.servidores).toBe(2);
  });
});

import { describe, expect, it } from "vitest";
import { faltaNoSaldo, faseFinanceira } from "./faseFinanceira";

const base = { reservado: 0, pendente: 0, ped_autorizado: 0, empenhado: 0, liquidado: 0, pago: 0 };

describe("faseFinanceira", () => {
  it("sem nada é sem movimento; só a reserva do sistema é Reservado", () => {
    expect(faseFinanceira(base).codigo).toBe("sem_movimento");
    expect(faseFinanceira(null).codigo).toBe("sem_movimento");
    expect(faseFinanceira({ ...base, reservado: 300, pendente: 300 }).codigo).toBe("reservado");
  });

  it("segue PED autorizado → empenhado → liquidado", () => {
    expect(faseFinanceira({ ...base, reservado: 300, ped_autorizado: 109566.67 }).rotulo).toBe("PED autorizado");
    expect(faseFinanceira({ ...base, ped_autorizado: 10, empenhado: 252800 }).codigo).toBe("empenhado");
    expect(faseFinanceira({ ...base, empenhado: 100, liquidado: 40 }).codigo).toBe("liquidado");
  });

  it("pago só quando cobre o empenhado e não há PED aberto", () => {
    expect(faseFinanceira({ ...base, empenhado: 100, liquidado: 100, pago: 100 }).codigo).toBe("pago");
    expect(faseFinanceira({ ...base, empenhado: 100, liquidado: 100, pago: 99.999 }).codigo).toBe("pago");
    expect(faseFinanceira({ ...base, empenhado: 100, liquidado: 60, pago: 10 }).codigo).toBe("pago_parcial");
    expect(faseFinanceira({ ...base, ped_autorizado: 50, empenhado: 100, liquidado: 100, pago: 100 }).codigo).toBe("pago_parcial");
  });
});

describe("faltaNoSaldo", () => {
  it("diz quanto falta, zero quando cabe e nulo sem QDD", () => {
    expect(faltaNoSaldo(700, 600)).toBe(100);
    expect(faltaNoSaldo(300, 850)).toBe(0);
    expect(faltaNoSaldo(0.3, 0.1)).toBe(0.2);
    expect(faltaNoSaldo(10, null)).toBeNull();
  });
});

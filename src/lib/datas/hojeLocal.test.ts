import { describe, expect, it } from "vitest";
import { diasEntreDatas, hojeISO } from "./hojeLocal";

describe("hojeISO", () => {
  it("usa o dia do fuso da sede, não o de UTC", () => {
    // 07/11 às 00:30 UTC = 06/11 às 20:30 em Boa Vista (UTC−4)
    const agora = new Date(Date.UTC(2026, 10, 7, 0, 30));
    expect(hojeISO(agora, "America/Boa_Vista")).toBe("2026-11-06");
    expect(hojeISO(agora, "UTC")).toBe("2026-11-07");
  });
});

describe("diasEntreDatas", () => {
  it("conta dias de calendário e fica negativo no passado", () => {
    expect(diasEntreDatas("2026-11-06", "2026-12-31")).toBe(55);
    expect(diasEntreDatas("2026-11-06", "2026-11-05")).toBe(-1);
    // virada do horário de verão de outro fuso não muda a conta (UTC puro)
    expect(diasEntreDatas("2026-02-28", "2026-03-01")).toBe(1);
    expect(diasEntreDatas("lixo", "2026-03-01")).toBeNull();
  });
});

import { describe, expect, it, vi } from "vitest";

// As fontes só chamam o banco em `carregar`; o catálogo é conferido sem cliente de verdade.
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

import { FONTES_RELATORIO, MODELOS_PRONTOS, fontePorId } from "./index";
import { partesDotacaoFiplan, mesDe } from "./carregar";
import { sanearConfig } from "@/lib/relatoriosDinamicos/montar";
import { estadoDosFiltros, filtrosDaFonte } from "@/lib/relatoriosDinamicos/filtros";

describe("catálogo do Gerador de relatórios", () => {
  it("ids de fonte únicos, no formato da tabela relatorios_modelos, e de colunas únicos em cada fonte", () => {
    const ids = FONTES_RELATORIO.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const f of FONTES_RELATORIO) {
      expect(f.id).toMatch(/^[a-z0-9_]{2,60}$/);
      expect(f.modulo).toMatch(/^[a-z_]{2,40}$/);
      const colunas = f.colunas.map((c) => c.id);
      expect(new Set(colunas).size, f.id).toBe(colunas.length);
      expect(f.colunas.some((c) => c.padrao), f.id).toBe(true);
      // período só em coluna de data; faixa só em número
      for (const c of f.colunas) {
        if (c.filtro === "faixa") expect(["moeda", "numero"], `${f.id}.${c.id}`).toContain(c.tipo);
        if (c.filtro === "periodo") expect(c.tipo, `${f.id}.${c.id}`).toBe("data");
      }
    }
  });

  it("modelos prontos só usam colunas, agrupamentos e filtros que existem", () => {
    for (const m of MODELOS_PRONTOS) {
      const fonte = fontePorId(m.config.fonte);
      expect(fonte, m.id).toBeDefined();
      const { config, ignoradas } = sanearConfig(fonte!, m.config);
      expect(ignoradas, m.id).toEqual([]);
      expect(config.colunas, m.id).toEqual(m.config.colunas);
      expect(config.agrupamentos, m.id).toEqual(m.config.agrupamentos);
      expect(config.totais, m.id).toEqual(m.config.totais);
      expect(estadoDosFiltros(filtrosDaFonte(fonte!), m.config.filtros), m.id).toEqual(m.config.filtros);
    }
  });

  it("partes da dotação do FIPLAN e mês", () => {
    expect(partesDotacaoFiplan("17302.0001.08.244.030.2544.9900.33903300.1500.0000.1.1")).toEqual({
      natureza: "33903300",
      fonte: "1.500",
      paoe: "2544",
    });
    expect(partesDotacaoFiplan("qualquer")).toEqual({ natureza: null, fonte: null, paoe: null });
    expect(mesDe("2026-03-05")).toBe("2026-03");
    expect(mesDe(null)).toBeNull();
  });
});

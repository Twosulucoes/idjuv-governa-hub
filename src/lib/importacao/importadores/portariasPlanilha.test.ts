import { describe, expect, it, vi } from "vitest";
import * as XLSX from "xlsx";

// O cliente gerado precisa de navegador (localStorage); aqui só se testa o modelo e as chaves.
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

const { abasModeloPortarias, importadorPortariasPlanilha } = await import("./portariasPlanilha");
const { lerPrimeiraAba, montarModeloPlanilha } = await import("../planilha");
const { interpretarPortariasPlanilha } = await import("./portariasPlanilhaParser");

/** Gera o modelo como o botão "Baixar modelo" e relê o arquivo, como o Excel o abriria. */
function modeloRelido() {
  const binario = XLSX.write(montarModeloPlanilha(abasModeloPortarias()), { type: "array", bookType: "xlsx" });
  return { binario: binario as ArrayBuffer, pasta: XLSX.read(binario, { type: "array", cellNF: true }) };
}

describe("modelo de portarias", () => {
  it("a aba importada sai só com o cabeçalho; os exemplos ficam em Como preencher", async () => {
    const { binario, pasta } = modeloRelido();
    expect(pasta.SheetNames).toEqual(["Portarias", "Como preencher"]);

    const linhas = XLSX.utils.sheet_to_json<unknown[]>(pasta.Sheets.Portarias, { header: 1, blankrows: false, defval: "" });
    expect(linhas.filter((l) => l.some((v) => v !== ""))).toHaveLength(1);

    const comoPreencher = XLSX.utils.sheet_to_json<unknown[]>(pasta.Sheets["Como preencher"], { header: 1 });
    expect(comoPreencher.flat()).toContain("001/2026");
    expect(comoPreencher.flat()).toContain("1002;1003");

    // O modelo em branco não importa nada (e não passa exemplo fictício como portaria)
    const lida = await lerPrimeiraAba(new Blob([binario]));
    const r = interpretarPortariasPlanilha(lida.cabecalhos, lida.linhas, { hoje: "2026-10-15" });
    expect(r.linhas).toEqual([]);
    expect(r.problemas.map((p) => p.mensagem)).toEqual([expect.stringMatching(/nenhuma linha preenchida/)]);
  });

  it("Número e Matrículas saem formatadas como texto até a linha 501", () => {
    const folha = modeloRelido().pasta.Sheets.Portarias;
    const cabecalho = XLSX.utils.sheet_to_json<string[]>(folha, { header: 1 })[0];
    const colNumero = cabecalho.indexOf("Número");
    const colMatriculas = cabecalho.indexOf("Matrículas");
    const colData = cabecalho.indexOf("Data da portaria");
    for (const c of [colNumero, colMatriculas]) {
      for (const r of [1, 250, 500]) {
        expect(folha[XLSX.utils.encode_cell({ r, c })]?.z).toBe("@");
      }
    }
    expect(folha[XLSX.utils.encode_cell({ r: 1, c: colData })]).toBeUndefined();
  });
});

describe("importadorPortariasPlanilha.invalidar", () => {
  it("cobre a lista, a ficha do servidor e a lista para vincular ao ato", () => {
    expect(importadorPortariasPlanilha.invalidar).toEqual(
      expect.arrayContaining([["portarias"], ["portaria"], ["portarias-servidor"], ["portarias-para-ato"]]),
    );
  });
});

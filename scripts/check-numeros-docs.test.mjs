import { describe, expect, it } from "vitest";
import { DOCS, procurarNumeros } from "./check-numeros-docs.mjs";

const trechos = (t) => procurarNumeros(t).map((a) => `${a.linha}:${a.trecho}`);

describe("check-numeros-docs", () => {
  it("acusa contagem com e sem til, em qualquer caixa", () => {
    expect(trechos("São ~241 páginas e 65 hooks.\n257 Tabelas, 9 Edge Functions e 17 módulos")).toEqual([
      "1:~241 páginas",
      "1:65 hooks",
      "2:257 Tabelas",
      "2:17 módulos",
    ]);
  });

  it("não acusa número de um dígito, nem palavra que só começa igual", () => {
    expect(trechos("9 Edge Functions, 3 rotas\n12 rotasX e 40 tabelasfoo")).toEqual([]);
  });

  it("linha marcada com numero-datado passa", () => {
    expect(trechos("79 tabelas do RH na entrega X <!-- numero-datado -->")).toEqual([]);
  });

  it("bloco numero-datado passa e o que vem depois volta a ser cobrado", () => {
    const t = ["<!-- numero-datado:inicio -->", "79 tabelas do RH", "12 views", "<!-- numero-datado:fim -->", "30 policies"].join("\n");
    expect(trechos(t)).toEqual(["5:30 policies"]);
  });

  it("escopo inclui as docs de entrada e exclui o estado gerado", () => {
    expect(DOCS).toEqual(expect.arrayContaining(["CLAUDE.md", "AGENTS.md", "README.md", "CONTRIBUTING.md", "docs/ARQUITETURA.md"]));
    expect(DOCS).not.toContain("docs/ESTADO_DO_SISTEMA.md");
    expect(new Set(DOCS).size).toBe(DOCS.length);
  });
});

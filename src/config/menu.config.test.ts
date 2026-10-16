import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Lê os arquivos como texto (sem importar) para não carregar ícones nem o cliente do Supabase.
const ler = (relativo: string) => readFileSync(resolve(__dirname, relativo), "utf8");

const MENUS = ["./menu.config.ts", "./module-menus.config.ts"];

/** Paths de `<Route path="...">` do App.tsx. */
function rotasDoApp(): string[] {
  return [...ler("../App.tsx").matchAll(/<Route\b[^>]*?\bpath="([^"]+)"/g)].map((m) => m[1]);
}

/** "/rh/servidores/:id" casa com "/rh/servidores/123"; "*" não conta como tela. */
function existe(caminho: string, rotas: string[]): boolean {
  return rotas.some((r) => {
    if (r === "*") return false;
    const re = new RegExp("^" + r.replace(/:[^/]+/g, "[^/]+").replace(/\/\*$/, "(/.*)?") + "$", "i");
    return re.test(caminho);
  });
}

describe("itens de menu", () => {
  it("todo item dos dois menus aponta para uma rota registrada no App.tsx", () => {
    const rotas = rotasDoApp();
    expect(rotas.length).toBeGreaterThan(150);
    const semTela: string[] = [];
    for (const arquivo of MENUS) {
      const itens = [...ler(arquivo).matchAll(/\broute:\s*["'](\/[^"'?#]*)/g)].map((m) => m[1]);
      expect(itens.length).toBeGreaterThan(20);
      for (const caminho of itens) if (!existe(caminho, rotas)) semTela.push(`${arquivo}: ${caminho}`);
    }
    expect(semTela).toEqual([]);
  });
});

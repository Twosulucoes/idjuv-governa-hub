import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MENU_PUBLICO, CHAVES_MENU_PUBLICO } from "./menu-publico.config";

// Rotas públicas do App.tsx: as que abrem com <PublicPageGuard rota="...">.
function rotasPublicas(): Set<string> {
  const app = readFileSync(resolve(__dirname, "../App.tsx"), "utf8");
  const re = /<Route path="([^"]+)" element=\{\s*(?:<ModuloHabilitado[^>]*>\s*)?<PublicPageGuard\b/g;
  return new Set([...app.matchAll(re)].map((m) => m[1]));
}

describe("menu do portal público", () => {
  const publicas = rotasPublicas();
  const destinos = MENU_PUBLICO.flatMap((item) => [item.href, ...(item.items ?? []).map((s) => s.href)]);

  it("lê as rotas públicas do App.tsx", () => {
    expect(publicas.size).toBeGreaterThan(20);
  });

  it("só aponta para rota pública (tela do sistema vai no menu do sistema)", () => {
    expect(destinos.filter((href) => !publicas.has(href))).toEqual([]);
  });

  it("não repete chave de config_menu_publico", () => {
    expect(new Set(CHAVES_MENU_PUBLICO).size).toBe(CHAVES_MENU_PUBLICO.length);
  });
});

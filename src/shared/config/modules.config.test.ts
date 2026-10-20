import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

// O cliente gerado precisa de navegador (localStorage); o tenant o importa, o teste não o usa.
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

const { findModuleByRoute, moduloDaRota } = await import("./modules.config");

// Rotas protegidas que não pertencem a módulo nenhum (área do próprio usuário ou de uso geral).
// O ProtectedRoute só barra módulo não contratado quando a URL cai num módulo; rota nova fora
// desta lista e fora de `MODULES_CONFIG.rotas` reprova o teste, para não escapar sem querer.
const TRANSVERSAIS = [
  "/sistema",
  "/sistema/legado",
  "/apresentacao",
  "/avisos",
  "/noticias",
  "/meu-perfil",
  "/trocar-senha-obrigatoria",
  "/processos",
  "/formularios/termo-demanda",
  "/formularios/requisicao-material",
  "/formularios/termo-responsabilidade",
  "/manuais",
  "/manuais/compras",
  "/manuais/diarias",
  "/manuais/patrimonio",
  "/manuais/convenios",
];

// Limitação: só enxerga `<Route path="..." element={<ProtectedRoute`; rota com `path={...}` ou outro
// componente antes do ProtectedRoute escapa desta checagem.
function rotasProtegidas(): string[] {
  const app = readFileSync(resolve(__dirname, "../../App.tsx"), "utf8");
  const rotas: string[] = [];
  const re = /<Route path="([^"]+)" element=\{\s*<ProtectedRoute\b/g;
  for (let m = re.exec(app); m; m = re.exec(app)) rotas.push(m[1]);
  return rotas;
}

describe("módulo de cada rota", () => {
  it("vence o prefixo mais longo", () => {
    expect(moduloDaRota("/admin/federacoes")).toBe("organizacoes");
    expect(moduloDaRota("/admin/instituicoes")).toBe("organizacoes");
    expect(moduloDaRota("/admin/usuarios")).toBe("admin");
    expect(findModuleByRoute("/admin/federacoes/123")?.codigo).toBe("organizacoes");
  });

  it("cobre os painéis que antes ficavam sem módulo", () => {
    expect(moduloDaRota("/patrimonio")).toBe("patrimonio");
    expect(moduloDaRota("/comunicacao/aniversariantes")).toBe("comunicacao");
    expect(moduloDaRota("/acesso")).toBe("admin");
  });

  it("casa como o react-router: sem diferenciar maiúsculas e com a URL decodificada", () => {
    expect(moduloDaRota("/Programas/bolsa-atleta")).toBe("programas");
    expect(moduloDaRota("/%70rogramas/bolsa-atleta")).toBe("programas");
    expect(moduloDaRota("/%E0%A4%A")).toBeNull();
  });

  it("não confunde prefixo parcial", () => {
    expect(moduloDaRota("/rhx")).toBeNull();
    expect(moduloDaRota("/sistema")).toBeNull();
  });

  it("toda rota protegida do App.tsx pertence a um módulo ou é transversal declarada", () => {
    const rotas = rotasProtegidas();
    expect(rotas.length).toBeGreaterThan(150);
    const semModulo = rotas.filter((r) => !moduloDaRota(r) && !TRANSVERSAIS.includes(r));
    expect(semModulo).toEqual([]);
  });
});

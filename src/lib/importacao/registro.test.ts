import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

// O cliente gerado precisa de navegador (localStorage); aqui só importa a lista de importadores.
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

const { PERMISSOES_IMPORTACAO } = await import("./registro");
const { menuConfig } = await import("@/config/menu.config");

describe("permissões da Central de Importações", () => {
  it("rota e menu aceitam exatamente as permissões dos importadores", () => {
    const esperado = [...PERMISSOES_IMPORTACAO].sort();
    // A rota usa a própria lista do registro (App.tsx), então só o menu pode divergir.
    const app = readFileSync(resolve(__dirname, "../../App.tsx"), "utf8");
    expect(app).toMatch(/path="\/admin\/importacoes" element=\{\s*<ProtectedRoute requiredPermissions=\{PERMISSOES_IMPORTACAO\}>/);
    const item = menuConfig.flatMap((s) => s.items).find((i) => i.route === "/admin/importacoes");
    expect([...(item?.permissions ?? [])].sort()).toEqual(esperado);
  });
});

import { describe, expect, it, vi } from "vitest";

// O cliente gerado precisa de navegador (localStorage); aqui só importa a lista de importadores.
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

const { PERMISSOES_IMPORTACAO } = await import("./registro");
const { ROUTE_PERMISSIONS } = await import("@/types/auth");
const { menuConfig } = await import("@/config/menu.config");

describe("permissões da Central de Importações", () => {
  it("rota e menu aceitam exatamente as permissões dos importadores", () => {
    const esperado = [...PERMISSOES_IMPORTACAO].sort();
    expect([ROUTE_PERMISSIONS["/admin/importacoes"]].flat().sort()).toEqual(esperado);
    const item = menuConfig.flatMap((s) => s.items).find((i) => i.route === "/admin/importacoes");
    expect([...(item?.permissions ?? [])].sort()).toEqual(esperado);
  });
});

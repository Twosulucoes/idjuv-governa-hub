import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

// O cliente gerado precisa de navegador (localStorage); aqui só importa a lista de importadores.
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

const { IMPORTADORES } = await import("./registro");
const { menuConfig } = await import("@/config/menu.config");

const ler = (relativo: string) => readFileSync(resolve(__dirname, relativo), "utf8");
const app = ler("../../App.tsx");
const rotas = [...app.matchAll(/<Route\b[^>]*?\bpath="([^"]+)"/g)].map((m) => m[1]);

describe("importadores por setor", () => {
  it("cada importador abre numa tela do seu setor, pelo próprio id", () => {
    for (const imp of IMPORTADORES) {
      const [caminho, busca] = imp.local.rota.split("?");
      expect(rotas, imp.id).toContain(caminho);
      expect(new URLSearchParams(busca).get("importador"), imp.id).toBe(imp.id);
      // A tela do setor liga o assistente ao id (useImportadorDaUrl) — senão o atalho não abre nada
      expect(imp.local.caminho.length, imp.id).toBeGreaterThan(0);
    }
  });

  it("ids e permissões estão preenchidos e os ids não se repetem", () => {
    const ids = IMPORTADORES.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const imp of IMPORTADORES) expect(imp.permissao, imp.id).toMatch(/^[a-z_]+(\.[a-z_]+)+$/);
  });

  it("empenhos e PEDs têm permissão própria, separada da do orçamento (QDD e tabelas)", () => {
    const permissao = (id: string) => IMPORTADORES.find((i) => i.id === id)?.permissao;
    expect(permissao("qdd_fiplan")).toBe("orcamento.importar");
    expect(permissao("classificadores_fiplan")).toBe("orcamento.importar");
    expect(permissao("empenhos_fip614")).toBe("financeiro.execucao.importar");
    expect(permissao("peds_fiplan")).toBe("financeiro.execucao.importar");
  });
});

describe("histórico de importações da Administração", () => {
  it("rota e menu exigem admin.auditoria", () => {
    expect(app).toMatch(/path="\/admin\/importacoes" element=\{\s*<ProtectedRoute requiredPermissions="admin\.auditoria">/);
    const item = menuConfig.flatMap((s) => s.items).find((i) => i.route === "/admin/importacoes");
    expect(item?.permission).toBe("admin.auditoria");
  });
});

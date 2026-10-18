import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  contarBaseline,
  contarLinhas,
  contarPolicies,
  contarRotas,
  diferenca,
  lerModulos,
  linhasCsv,
  listarRotas,
  moduloDaRota,
  paginasPorPasta,
  rotasPorModulo,
} from "./estado-do-sistema.mjs";

// O cliente gerado precisa de navegador (localStorage); o tenant o importa, o teste não o usa.
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

const RAIZ = resolve(import.meta.dirname, "..");

describe("estado-do-sistema: rotas", () => {
  const app = `
    <Routes>
      {/* <Route path="/comentada" element={<X />} /> */}
      <Route path="/" element={<PublicPageGuard rota="/"><Home /></PublicPageGuard>} />
      <Route path="/rh/servidores" element={
        <ProtectedRoute requiredModule="rh">
          <ServidoresPage />
        </ProtectedRoute>
      } />
      <Route path="/financeiro/orcamento" element={
        <ProtectedRoute><Navigate to="/financeiro/qdd" replace /></ProtectedRoute>
      } />
      <Route path="/selecoes" element={<Navigate to="/programas/selecoes" replace />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>`;

  it("classifica protegida, pública, redirecionamento e curinga; ignora comentário", () => {
    expect(listarRotas(app).map((r) => r.tipo)).toEqual([
      "publica",
      "protegida",
      "protegida",
      "redirecionamento",
      "publica",
      "curinga",
    ]);
    expect(contarRotas(app)).toEqual({ total: 6, protegida: 2, publica: 2, redirecionamento: 1, curinga: 1 });
  });

  it("raiz com Navigate condicional dentro de PublicPageGuard é pública", () => {
    const t = `<Route path="/" element={ cond ? <Navigate to="/sistema" /> : (<PublicPageGuard rota="/"><H /></PublicPageGuard>) } />`;
    expect(contarRotas(t).publica).toBe(1);
  });
});

describe("estado-do-sistema: baseline e banco", () => {
  it("conta tabelas, views, funções (gatilho à parte) e enums do schema public", () => {
    const sql = [
      "CREATE TABLE public.a (",
      "CREATE TABLE public.b (",
      "CREATE TABLE auth.c (",
      "CREATE VIEW public.v WITH (security_invoker='on') AS",
      "CREATE FUNCTION public.f() RETURNS boolean",
      "CREATE FUNCTION public.g() RETURNS trigger",
      "CREATE TYPE public.e AS ENUM (",
      "CREATE TYPE public.composto AS (",
    ].join("\n");
    expect(contarBaseline(sql)).toEqual({ tabelas: 2, views: 1, funcoes: 2, funcoesGatilho: 1, funcoesOutras: 1, enums: 1 });
  });

  it("conta CREATE POLICY só em início de linha, somando arquivos", () => {
    expect(contarPolicies(["CREATE POLICY a ON t;\n  create policy b ON t;", "-- CREATE POLICY comentada\nCREATE POLICY c ON t;"])).toBe(3);
  });

  it("linhas de CSV sem cabeçalho e linhas de arquivo", () => {
    expect(linhasCsv("tabela,modulos\na,rh\nb,admin\n")).toBe(2);
    expect(contarLinhas("a\nb\n")).toBe(2);
    expect(contarLinhas("a\nb")).toBe(2);
    expect(contarLinhas("")).toBe(0);
  });

  it("agrupa páginas por pasta com a raiz primeiro", () => {
    expect(paginasPorPasta(["XPage.tsx", "rh/APage.tsx", "rh/sub/BPage.tsx", "admin/CPage.tsx"])).toEqual([
      ["(raiz)", 1],
      ["admin", 1],
      ["rh", 2],
    ]);
  });

  it("diferença mostra o que saiu e o que entrou", () => {
    expect(diferenca("a\nb", "a\nc")).toEqual(["- b", "+ c"]);
  });
});

describe("estado-do-sistema: módulos", () => {
  const ts = `
export const MODULOS = [
  'admin',
  'organizacoes', // comentário
] as const;
export const MODULES_CONFIG: ModuleConfig[] = [
  { codigo: 'admin', nome: 'Administração', rotas: ['/admin', '/acesso'], menuSectionIds: [] },
  { codigo: 'organizacoes', nome: 'Organizações', rotas: ['/admin/federacoes'], menuSectionIds: [] },
];
`;

  it("lê MODULOS e aplica o prefixo mais longo", () => {
    const mods = lerModulos(ts);
    expect(mods.map((m) => [m.codigo, m.nome])).toEqual([
      ["admin", "Administração"],
      ["organizacoes", "Organizações"],
    ]);
    expect(moduloDaRota(mods, "/admin/usuarios")).toBe("admin");
    expect(moduloDaRota(mods, "/Admin/Federacoes/:id")).toBe("organizacoes");
    expect(moduloDaRota(mods, "/administracao")).toBeNull();
    const c = rotasPorModulo(mods, [
      { path: "/admin", tipo: "protegida" },
      { path: "/x", tipo: "publica" },
      { path: "/admin/velho", tipo: "redirecionamento" },
    ]);
    expect(c.get("admin")).toEqual({ protegida: 1, publica: 0 });
    expect(c.get(null)).toEqual({ protegida: 0, publica: 1 });
  });

  it("a réplica bate com o moduloDaRota real para todas as rotas do App.tsx", async () => {
    const real = await import("@/shared/config/modules.config");
    const mods = lerModulos(readFileSync(resolve(RAIZ, "src/shared/config/modules.config.ts"), "utf8"));
    expect(mods.map((m) => m.codigo)).toEqual([...real.MODULOS]);
    const rotas = listarRotas(readFileSync(resolve(RAIZ, "src/App.tsx"), "utf8")).filter((r) => r.path);
    expect(rotas.length).toBeGreaterThan(0);
    for (const { path } of rotas) expect([path, moduloDaRota(mods, path)]).toEqual([path, real.moduloDaRota(path)]);
  });
});

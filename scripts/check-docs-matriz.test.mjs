import { describe, expect, it } from "vitest";
import { avaliar, lerLinhas, temEscape } from "./check-docs-matriz.mjs";

const arq = (caminho, status = "modified") => ({ status, caminho });
const nomes = (r) => r.pendentes.map((p) => p.nome);

describe("check-docs-matriz", () => {
  it("PR só de documentação passa", () => {
    expect(avaliar([arq("docs/ARQUITETURA.md")]).ok).toBe(true);
  });

  it("migração sem BANCO_DE_DADOS.md falha, mesmo tocando outro .md", () => {
    const r = avaliar([arq("supabase/migrations/20261014000000_x.sql", "added"), arq("README.md"), arq("docs/planejamento/ROADMAP.md")]);
    expect(r.ok).toBe(false);
    expect(nomes(r)).toEqual(["Migração, tabela, RPC, RLS"]);
  });

  it("migração com BANCO_DE_DADOS.md e ROADMAP passa", () => {
    const r = avaliar([
      arq("supabase/migrations/20261014000000_x.sql", "added"),
      arq("docs/BANCO_DE_DADOS.md"),
      arq("docs/planejamento/ROADMAP.md"),
    ]);
    expect(r.ok).toBe(true);
  });

  it("toda mudança em src/ cobra o ROADMAP", () => {
    const r = avaliar([arq("src/components/rh/Tabela.tsx")]);
    expect(nomes(r)).toEqual(["Andamento (toda mudança de código)"]);
  });

  it("rota em App.tsx exige ARQUITETURA (MODULOS sozinho não basta)", () => {
    const base = [arq("src/App.tsx"), arq("docs/planejamento/ROADMAP.md")];
    expect(avaliar([...base, arq("docs/ARQUITETURA.md")]).ok).toBe(true);
    expect(nomes(avaliar([...base, arq("docs/MODULOS.md")]))).toEqual(["Rota, página nova ou menu"]);
  });

  it("baseline exige os dois documentos da matriz", () => {
    const r = avaliar([arq("supabase/baseline/overlay/10_x.sql"), arq("docs/NOVO_BANCO.md"), arq("docs/planejamento/ROADMAP.md")]);
    expect(r.pendentes).toEqual([
      { nome: "Baseline do banco e scripts/db", docs: ["supabase/baseline/README.md"], gatilhos: ["supabase/baseline/overlay/10_x.sql"] },
    ]);
  });

  it("página nova cobra ARQUITETURA; página editada não", () => {
    const roadmap = arq("docs/planejamento/ROADMAP.md");
    expect(nomes(avaliar([arq("src/pages/rh/NovaPage.tsx", "added"), roadmap]))).toEqual(["Rota, página nova ou menu"]);
    expect(avaliar([arq("src/pages/rh/VelhaPage.tsx"), roadmap]).ok).toBe(true);
  });

  it("Edge Function, RBAC e tenant cobram o dono do assunto", () => {
    const r = avaliar([
      arq("supabase/functions/bb-api/index.ts"),
      arq("src/types/auth.ts"),
      arq("tenants/idjuv/tenant.config.ts"),
      arq("docs/planejamento/ROADMAP.md"),
    ]);
    expect(nomes(r)).toEqual(["Edge Function", "Permissão, papel, RBAC", "White Label / tenant"]);
  });

  it("e-mails do tenant cobram EMAILS_AUTH, não WHITE_LABEL", () => {
    const r = avaliar([arq("tenants/idjuv/emails/convite.html")]);
    expect(nomes(r)).toEqual(["E-mails do Supabase Auth"]);
  });

  it("arquivo de teste não cobra doc", () => {
    expect(avaliar([arq("src/lib/workflow/semaforoPrazo.test.ts")]).ok).toBe(true);
    expect(avaliar([arq("src/lib/documentos/__testes__/tabela.test.ts")]).ok).toBe(true);
  });

  it("workflow do CI cobra DESENVOLVIMENTO; gate cobra CONTRIBUTING", () => {
    expect(nomes(avaliar([arq(".github/workflows/quality.yml")]))).toEqual(["Deploy, CI, build"]);
    expect(avaliar([arq(".github/workflows/quality.yml"), arq("docs/DESENVOLVIMENTO.md")]).ok).toBe(true);
    expect(nomes(avaliar([arq("vitest.config.ts"), arq("scripts/check-cor-crua.mjs")]))).toEqual(["Gate de qualidade"]);
  });

  it("assets do tenant não cobram WHITE_LABEL", () => {
    expect(avaliar([arq("tenants/idjuv/assets/documentos/ficha.pdf", "added")]).ok).toBe(true);
  });

  it("doc removida não conta como atualizada", () => {
    const r = avaliar([arq("supabase/functions/x/index.ts"), arq("docs/EDGE_FUNCTIONS.md", "removed"), arq("docs/planejamento/ROADMAP.md")]);
    expect(r.ok).toBe(false);
  });

  it("escape com motivo libera; placeholder e linha indentada não", () => {
    const pr = [arq("src/lib/utils.ts")];
    expect(avaliar(pr, "Resumo\n\ndocs: não se aplica — refactor sem mudança de comportamento").ok).toBe(true);
    expect(avaliar(pr, "docs: nao se aplica - renomeia variável interna").ok).toBe(true);
    expect(avaliar(pr, "docs: não se aplica — <motivo real e específico>").ok).toBe(false);
    expect(avaliar(pr, "       docs: não se aplica — motivo").ok).toBe(false);
    expect(temEscape("")).toBe(false);
    expect(temEscape("<!--\ndocs: não se aplica — escondido\n-->")).toBe(false);
  });

  it("lê a saída do CI e do git diff --name-status", () => {
    expect(lerLinhas("added src/pages/X.tsx\nmodified docs/A.md\n")).toEqual([
      { status: "added", caminho: "src/pages/X.tsx" },
      { status: "modified", caminho: "docs/A.md" },
    ]);
    expect(lerLinhas("A\tsrc/hooks/useX.ts\nR100\tsrc/a.ts\tsrc/b.ts\nD\tdocs/velho.md")).toEqual([
      { status: "added", caminho: "src/hooks/useX.ts" },
      { status: "renamed", caminho: "src/b.ts" },
      { status: "removed", caminho: "docs/velho.md" },
    ]);
  });

  it("caminho com espaço é lido inteiro e cobra doc", () => {
    const linhas = lerLinhas("modified src/assets/QDD 2544 9h50.xlsx\nM\tsrc/assets/FICHA - NOVO (2).pdf");
    expect(linhas.map((l) => l.caminho)).toEqual(["src/assets/QDD 2544 9h50.xlsx", "src/assets/FICHA - NOVO (2).pdf"]);
    expect(avaliar(linhas).ok).toBe(false);
  });
});

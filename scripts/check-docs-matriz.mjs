#!/usr/bin/env node
/**
 * Guard da matriz de documentação: código que muda exige a doc certa na mesma PR.
 *
 * Por que existe: o guard antigo aceitava QUALQUER `.md` alterado, então uma PR de
 * migração passava tocando só o README. Aqui cada tipo de mudança cobra o documento
 * dono do assunto (docs/GOVERNANCA_DOCUMENTACAO.md §3), e toda mudança de código
 * (src/**, supabase/**) cobra também o ROADMAP, para o andamento não se perder.
 *
 * Escape auditável (§5): uma linha no corpo da PR, sem indentação,
 *     docs: não se aplica — <motivo real>
 * libera a PR inteira; o motivo fica no histórico.
 *
 * Uso:
 *   node scripts/check-docs-matriz.mjs --arquivos <arquivo>   (CI: linhas "<status> <caminho>",
 *                                                             status do GitHub: added, modified, removed, renamed…)
 *   node scripts/check-docs-matriz.mjs --base origin/main     (local: compara a branch com a base)
 *   Corpo da PR: variável de ambiente PR_BODY (opcional).
 * Sai com 1 quando falta doc e não há escape.
 */

import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const ROADMAP = "docs/planejamento/ROADMAP.md";

// Arquivos de teste não mudam comportamento documentável.
const EH_TESTE = /\.test\.(ts|tsx|mjs)$|(^|\/)__tests__\/|(^|\/)__testes__\//;

/**
 * Cada regra: quando algum arquivo casa `casa(caminho, status)`, TODOS os `docs` da
 * regra precisam estar entre os arquivos alterados (é a coluna "Obrigatória" da
 * matriz, §3; "Conferir também" fica para a revisão). A ordem é a da matriz.
 */
export const REGRAS = [
  {
    nome: "Rota, página nova ou menu",
    docs: ["docs/ARQUITETURA.md"],
    casa: (p, s) =>
      /^src\/(App|AppSite)\.tsx$/.test(p) ||
      p === "src/core/modo-app.ts" ||
      /^src\/config\/(menu|module-menus)\.config\.ts$/.test(p) ||
      (s === "added" && /^src\/pages\/.+\.tsx$/.test(p)),
  },
  {
    nome: "Módulo (modules.config)",
    docs: ["docs/MODULOS.md"],
    casa: (p) => p === "src/shared/config/modules.config.ts",
  },
  {
    nome: "Migração, tabela, RPC, RLS",
    docs: ["docs/BANCO_DE_DADOS.md"],
    casa: (p) => p.startsWith("supabase/migrations/"),
  },
  {
    nome: "Baseline do banco e scripts/db",
    docs: ["docs/NOVO_BANCO.md", "supabase/baseline/README.md"],
    casa: (p) => p.startsWith("supabase/baseline/") || p.startsWith("scripts/db/"),
  },
  {
    nome: "Edge Function",
    docs: ["docs/EDGE_FUNCTIONS.md"],
    casa: (p) => p.startsWith("supabase/functions/"),
  },
  {
    nome: "Permissão, papel, RBAC",
    docs: ["docs/RBAC_PERMISSOES.md"],
    casa: (p) =>
      p === "src/types/auth.ts" ||
      p === "src/contexts/AuthContext.tsx" ||
      p.startsWith("src/components/auth/"),
  },
  {
    nome: "E-mails do Supabase Auth",
    docs: ["docs/EMAILS_AUTH.md"],
    casa: (p) => p.startsWith("scripts/emails/") || /^tenants\/[^/]+\/emails\//.test(p),
  },
  {
    nome: "White Label / tenant",
    docs: ["docs/WHITE_LABEL.md"],
    casa: (p) =>
      p.startsWith("src/core/tenant/") ||
      (p.startsWith("tenants/") &&
        !/^tenants\/[^/]+\/(emails|assets)\//.test(p) &&
        !p.endsWith(".md")),
  },
  {
    nome: "Backup da VPS",
    docs: ["docs/BACKUP.md"],
    casa: (p) => p.startsWith("scripts/backup/") || p === ".github/workflows/backup-restore-test.yml",
  },
  {
    nome: "Deploy, CI, build",
    docs: ["docs/DESENVOLVIMENTO.md"],
    casa: (p) =>
      (p.startsWith(".github/workflows/") && p !== ".github/workflows/backup-restore-test.yml") ||
      p === "vite.config.ts",
  },
  {
    nome: "Gate de qualidade",
    docs: ["CONTRIBUTING.md"],
    casa: (p) =>
      p === "scripts/gate.sh" ||
      p === "scripts/gate-baseline.json" ||
      p === "vitest.config.ts" ||
      p.startsWith(".githooks/") ||
      /^scripts\/check-[^/]+\.(mjs|sh)$/.test(p),
  },
  {
    nome: "Hook de dados novo",
    docs: ["docs/GUIA_FRONTEND.md"],
    casa: (p, s) => s === "added" && /^src\/hooks\/.+\.tsx?$/.test(p),
  },
  {
    nome: "Documento/PDF",
    docs: ["docs/PADRAO_DOCUMENTOS.md"],
    casa: (p) => p.startsWith("src/lib/documentos/") || /^src\/lib\/pdf[^/]*\.ts$/.test(p),
  },
  {
    nome: "Agentes e skills do projeto",
    docs: ["AGENTS.md"],
    casa: (p) => p.startsWith(".claude/agents/") || p.startsWith(".agents/"),
  },
  {
    nome: "Gerador de prompts",
    docs: ["prompts/README.md"],
    casa: (p) =>
      p.startsWith(".claude/commands/") || p === "scripts/prompt.mjs" || p.startsWith("prompts/templates/"),
  },
  {
    nome: "Andamento (toda mudança de código)",
    docs: [ROADMAP],
    casa: (p) => p.startsWith("src/") || p.startsWith("supabase/"),
  },
];

/**
 * Escape do §5: linha própria, sem indentação, com motivo que não seja placeholder.
 * Comentário HTML é removido antes: escape invisível na PR renderizada não é auditável.
 */
export function temEscape(corpo) {
  const visivel = (corpo ?? "").replace(/\r/g, "").replace(/<!--[\s\S]*?(-->|$)/g, "");
  return /^docs: ?n(ã|a)o se aplica ?(—|–|-|:) ?[^<\s]/im.test(visivel);
}

/**
 * @param {{status: string, caminho: string}[]} arquivos alterados na PR
 * @param {string} corpo corpo da PR
 * @returns {{ok: boolean, escape: boolean, pendentes: {nome: string, docs: string[], gatilhos: string[]}[]}}
 */
export function avaliar(arquivos, corpo = "") {
  const alterados = new Set(arquivos.filter((a) => a.status !== "removed").map((a) => a.caminho));
  const pendentes = [];
  for (const regra of REGRAS) {
    const gatilhos = arquivos
      .filter((a) => !EH_TESTE.test(a.caminho) && regra.casa(a.caminho, a.status))
      .map((a) => a.caminho);
    if (gatilhos.length === 0) continue;
    const faltam = regra.docs.filter((d) => !alterados.has(d));
    if (faltam.length === 0) continue;
    pendentes.push({ nome: regra.nome, docs: faltam, gatilhos });
  }
  const escape = pendentes.length > 0 && temEscape(corpo);
  return { ok: pendentes.length === 0 || escape, escape, pendentes };
}

/**
 * "modified src/App.tsx" (CI: status, um espaço, caminho — o caminho pode ter espaços)
 * ou "M\tsrc/App.tsx" / "R100\tvelho\tnovo" (git diff --name-status, separado por tab).
 */
export function lerLinhas(texto) {
  const status = { A: "added", M: "modified", D: "removed", R: "renamed", C: "copied", T: "modified" };
  return texto
    .split("\n")
    .map((l) => l.replace(/\r$/, ""))
    .filter((l) => l.trim())
    .map((l) => {
      if (l.includes("\t")) {
        const campos = l.split("\t");
        const s = campos[0].trim();
        return { status: status[s[0]] ?? s, caminho: campos[campos.length - 1] };
      }
      const m = l.match(/^(\S+) (.+)$/);
      return m ? { status: m[1], caminho: m[2] } : { status: "modified", caminho: l.trim() };
    });
}

function main() {
  const args = process.argv.slice(2);
  let texto;
  const iArq = args.indexOf("--arquivos");
  const iBase = args.indexOf("--base");
  if (iArq >= 0) {
    texto = readFileSync(args[iArq + 1], "utf8");
  } else if (iBase >= 0) {
    // Merge-base contra a árvore de trabalho: conta também o que ainda não foi commitado.
    const base = execFileSync("git", ["merge-base", args[iBase + 1], "HEAD"], { encoding: "utf8" }).trim();
    texto = execFileSync("git", ["diff", "--name-status", base], { encoding: "utf8" });
  } else {
    console.error("Uso: node scripts/check-docs-matriz.mjs --arquivos <arquivo> | --base <ref>");
    process.exit(2);
  }

  const { ok, escape, pendentes } = avaliar(lerLinhas(texto), process.env.PR_BODY ?? "");
  if (pendentes.length === 0) {
    console.log("OK: a documentação exigida pela matriz foi atualizada (ou nenhuma regra se aplica).");
    return;
  }
  for (const p of pendentes) {
    console.log(`- ${p.nome}: atualize ${p.docs.join(" e ")}`);
    console.log(`    por causa de: ${p.gatilhos.slice(0, 5).join(", ")}${p.gatilhos.length > 5 ? ", …" : ""}`);
  }
  if (escape) {
    console.log("OK: escape declarado no corpo da PR (\"docs: não se aplica — …\"), auditável no histórico.");
    return;
  }
  console.log("");
  console.log("Falta documentação (docs/GOVERNANCA_DOCUMENTACAO.md §3). Atualize os documentos acima na mesma PR,");
  console.log("ou, se de fato nenhum se aplica, escreva no corpo da PR uma linha própria, sem indentação:");
  console.log("  docs: não se aplica — <motivo real e específico>");
  if (!ok) process.exit(1);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();

#!/usr/bin/env node
/**
 * Estado do sistema: números do repositório contados do código, não escritos à mão.
 *
 * Por que existe: contagem escrita em doc ("~241 páginas", "257 tabelas") fica velha na
 * primeira PR seguinte. Aqui os números saem dos arquivos (rotas, páginas, hooks, tabelas
 * do baseline, policies, Edge Functions, módulos) e vão para docs/ESTADO_DO_SISTEMA.md,
 * que é gerado — e o gate cobra que esteja em dia (`--checar`).
 *
 * Sem banco, sem dependência, sem data/hora no conteúdo (o diff só muda quando o código muda).
 *
 * Uso:
 *   node scripts/estado-do-sistema.mjs           -> grava docs/ESTADO_DO_SISTEMA.md  (npm run estado)
 *   node scripts/estado-do-sistema.mjs --checar  -> compara com o arquivo; sai 1 se diferente (npm run estado:checar)
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const RAIZ = resolve(import.meta.dirname, "..");
export const SAIDA = "docs/ESTADO_DO_SISTEMA.md";

// ---------------------------------------------------------------------------
// Funções de contagem (puras: recebem texto/listas, devolvem números)
// ---------------------------------------------------------------------------

/** Remove comentários JSX `{/* ... *\/}` e de bloco, para `<Route` citado em comentário não contar. */
function semComentarios(tsx) {
  return tsx.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
}

/**
 * Separa as `<Route>` de um arquivo de rotas (App.tsx / AppSite.tsx). Cada rota é o trecho do
 * `<Route` até o próximo `<Route` (ou `</Routes>`), o que cobre `element={...}` em várias linhas.
 * Classificação, nesta ordem:
 *   curinga           -> path="*"
 *   protegida         -> o trecho usa <ProtectedRoute (inclusive redirecionamento protegido)
 *   redirecionamento  -> usa <Navigate e não usa PublicPageGuard (atalho/URL antiga)
 *   pública           -> o resto (PublicPageGuard, /auth, PWA...)
 */
export function listarRotas(tsx) {
  const texto = semComentarios(tsx);
  const inicios = [...texto.matchAll(/<Route\b(?!s)/g)].map((m) => m.index);
  return inicios.map((ini, i) => {
    const fimProx = i + 1 < inicios.length ? inicios[i + 1] : texto.length;
    const fimRoutes = texto.indexOf("</Routes>", ini);
    const fim = fimRoutes !== -1 && fimRoutes < fimProx ? fimRoutes : fimProx;
    const trecho = texto.slice(ini, fim);
    const path = trecho.match(/\bpath\s*=\s*["']([^"']+)["']/)?.[1] ?? null;
    let tipo;
    if (path === "*") tipo = "curinga";
    else if (/<ProtectedRoute\b/.test(trecho)) tipo = "protegida";
    else if (/<Navigate\b/.test(trecho) && !/<PublicPageGuard\b/.test(trecho)) tipo = "redirecionamento";
    else tipo = "publica";
    return { path, tipo };
  });
}

export function contarRotas(tsx) {
  const r = { total: 0, protegida: 0, publica: 0, redirecionamento: 0, curinga: 0 };
  for (const { tipo } of listarRotas(tsx)) {
    r.total++;
    r[tipo]++;
  }
  return r;
}

/** Conta objetos do schema public no dump do baseline (pg_dump: um comando por linha de cabeçalho). */
export function contarBaseline(sql) {
  const linhas = sql.split("\n");
  const c = (re) => linhas.filter((l) => re.test(l)).length;
  const funcoes = linhas.filter((l) => /^CREATE (OR REPLACE )?FUNCTION public\./.test(l));
  const gatilho = funcoes.filter((l) => /\bRETURNS trigger\b/i.test(l)).length;
  return {
    tabelas: c(/^CREATE (UNLOGGED )?TABLE public\./),
    views: c(/^CREATE (OR REPLACE )?(MATERIALIZED )?VIEW public\./),
    funcoes: funcoes.length,
    funcoesGatilho: gatilho,
    funcoesOutras: funcoes.length - gatilho,
    enums: c(/^CREATE TYPE public\.\S+ AS ENUM\b/),
  };
}

/** Conta `CREATE POLICY` (início de linha, ignorando comentários) em vários textos SQL. */
export function contarPolicies(textos) {
  return textos.reduce((s, t) => s + (t.match(/^\s*CREATE POLICY\b/gim)?.length ?? 0), 0);
}

/** Linhas de dados de um CSV (sem cabeçalho e sem linhas vazias). */
export function linhasCsv(csv) {
  return csv.split("\n").slice(1).filter((l) => l.trim() !== "").length;
}

/** Quantidade de linhas de um texto (como `wc -l` em arquivo terminado em \n). */
export function contarLinhas(texto) {
  if (texto === "") return 0;
  const n = texto.split("\n").length;
  return texto.endsWith("\n") ? n - 1 : n;
}

/**
 * Lê `MODULOS` e `MODULES_CONFIG` (codigo, nome, rotas) do texto de modules.config.ts.
 * O arquivo é TypeScript com ícones do lucide e alias `@/`: não dá para importar em Node puro,
 * então o texto é lido. O teste confere que o resultado bate com o `moduloDaRota` real.
 */
export function lerModulos(ts) {
  const lista = ts.match(/export const MODULOS\s*=\s*\[([\s\S]*?)\]\s*as const/)?.[1] ?? "";
  const codigos = [...lista.replace(/\/\/.*$/gm, "").matchAll(/'([^']+)'|"([^"]+)"/g)].map((m) => m[1] ?? m[2]);
  const bloco = ts.match(/export const MODULES_CONFIG[^=]*=\s*\[([\s\S]*?)\n\];/)?.[1] ?? "";
  const config = bloco
    .split(/\bcodigo:\s*/)
    .slice(1)
    .map((parte) => ({
      codigo: parte.match(/^['"]([^'"]+)['"]/)?.[1],
      nome: parte.match(/\bnome:\s*['"]([^'"]+)['"]/)?.[1] ?? "",
      rotas: [...(parte.match(/\brotas:\s*\[([^\]]*)\]/)?.[1] ?? "").matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1]),
    }));
  return codigos.map((codigo) => {
    const cfg = config.find((m) => m.codigo === codigo);
    return { codigo, nome: cfg?.nome ?? "", rotas: cfg?.rotas ?? [] };
  });
}

/** Mesmo critério de `findModuleByRoute`: vence o prefixo mais longo (case-insensitive, URL decodificada). */
export function moduloDaRota(modulos, pathname) {
  let caminho;
  try {
    caminho = decodeURI(pathname).toLowerCase();
  } catch {
    return null;
  }
  let achado = null;
  let tamanho = -1;
  for (const m of modulos) {
    for (const r of m.rotas) {
      if ((caminho === r || caminho.startsWith(r + "/")) && r.length > tamanho) {
        achado = m.codigo;
        tamanho = r.length;
      }
    }
  }
  return achado;
}

/** Rotas do sistema (protegidas e públicas; sem redirecionamento e curinga) por módulo. */
export function rotasPorModulo(modulos, rotas) {
  const conta = new Map(modulos.map((m) => [m.codigo, { protegida: 0, publica: 0 }]));
  conta.set(null, { protegida: 0, publica: 0 });
  for (const { path, tipo } of rotas) {
    if (!path || (tipo !== "protegida" && tipo !== "publica")) continue;
    conta.get(moduloDaRota(modulos, path))[tipo]++;
  }
  return conta;
}

/** Agrupa caminhos de página (relativos a src/pages) pela primeira pasta; arquivo solto vira "(raiz)". */
export function paginasPorPasta(caminhos) {
  const m = new Map();
  for (const c of caminhos) {
    const partes = c.split("/");
    const pasta = partes.length > 1 ? partes[0] : "(raiz)";
    m.set(pasta, (m.get(pasta) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => (a[0] === "(raiz)" ? -1 : b[0] === "(raiz)" ? 1 : a[0].localeCompare(b[0])));
}

// ---------------------------------------------------------------------------
// Coleta (lê o repositório)
// ---------------------------------------------------------------------------

/** Arquivos (caminho relativo a `dir`, com "/") de uma pasta, recursivo, sem node_modules. */
function arquivos(raiz, dir) {
  const abs = join(raiz, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs, { recursive: true, withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => relative(abs, join(d.parentPath ?? d.path, d.name)).split(sep).join("/"))
    .filter((f) => !f.split("/").includes("node_modules"))
    .sort();
}

const ler = (raiz, f) => (existsSync(join(raiz, f)) ? readFileSync(join(raiz, f), "utf8") : "");

export function coletar(raiz = RAIZ) {
  const app = ler(raiz, "src/App.tsx");
  const rotasApp = listarRotas(app);
  const modulos = lerModulos(ler(raiz, "src/shared/config/modules.config.ts"));

  const paginas = arquivos(raiz, "src/pages").filter((f) => /Page\.tsx$/.test(f));
  const componentes = arquivos(raiz, "src/components").filter((f) => f.endsWith(".tsx") && !/\.test\.tsx$/.test(f));
  const hooks = arquivos(raiz, "src/hooks").filter((f) => /(^|\/)use[^/]*\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f));
  const testeRe = /\.test\.(ts|tsx|mjs|js)$/;
  const testes = [...arquivos(raiz, "src").map((f) => "src/" + f), ...arquivos(raiz, "scripts").map((f) => "scripts/" + f)].filter((f) =>
    testeRe.test(f),
  );
  const migracoes = arquivos(raiz, "supabase/migrations").filter((f) => !f.includes("/") && f.endsWith(".sql"));
  const sqlBaseline = arquivos(raiz, "supabase/baseline").filter((f) => f.endsWith(".sql"));
  const fnDir = join(raiz, "supabase/functions");
  const edge = existsSync(fnDir)
    ? readdirSync(fnDir, { withFileTypes: true })
        .filter((d) => d.isDirectory() && !["_shared", "main"].includes(d.name))
        .map((d) => d.name)
    : [];

  return {
    rotasSistema: contarRotas(app),
    rotasSite: contarRotas(ler(raiz, "src/AppSite.tsx")),
    paginas: { total: paginas.length, porPasta: paginasPorPasta(paginas) },
    componentes: { total: componentes.length, ui: componentes.filter((f) => f.startsWith("ui/")).length },
    hooks: hooks.length,
    testes: testes.length,
    linhasApp: contarLinhas(app),
    linhasTypes: contarLinhas(ler(raiz, "src/integrations/supabase/types.ts")),
    migracoes: { total: migracoes.length, recente: migracoes.at(-1) ?? "—" },
    baseline: contarBaseline(ler(raiz, "supabase/baseline/schema/01_pre_data.sql")),
    policies: contarPolicies(sqlBaseline.map((f) => ler(raiz, "supabase/baseline/" + f))),
    mapaRls: linhasCsv(ler(raiz, "supabase/baseline/rls/mapa.csv")),
    edgeFunctions: edge.length,
    modulos,
    rotasPorModulo: rotasPorModulo(modulos, rotasApp),
  };
}

// ---------------------------------------------------------------------------
// Markdown
// ---------------------------------------------------------------------------

export function gerarMarkdown(d) {
  const L = [];
  const rotas = (nome, r) =>
    `| ${nome} | ${r.total} | ${r.protegida} | ${r.publica} | ${r.redirecionamento} | ${r.curinga} |`;
  L.push(
    "# Estado do sistema",
    "",
    "> **Arquivo gerado — não edite à mão.** Sai de `scripts/estado-do-sistema.mjs`, que conta direto do",
    "> código (sem banco). Para atualizar: `npm run estado`. O gate (`bash scripts/gate.sh`) reprova se este",
    "> arquivo estiver desatualizado. Os outros documentos não repetem estes números: apontam para cá.",
    "",
    "## Rotas",
    "",
    "Cada `<Route>` conta uma vez. Protegida: usa `ProtectedRoute` (inclusive redirecionamento protegido).",
    "Redirecionamento: só `Navigate`, sem `PublicPageGuard`. Curinga: `path=\"*\"`. Pública: o resto.",
    "",
    "| Arquivo | Total | Protegidas | Públicas | Redirecionamentos | Curinga |",
    "|---|---:|---:|---:|---:|---:|",
    rotas("`src/App.tsx` (sistema)", d.rotasSistema),
    rotas("`src/AppSite.tsx` (site)", d.rotasSite),
    "",
    "## Código do front",
    "",
    "| Item | Quantidade |",
    "|---|---:|",
    `| Páginas (\`*Page.tsx\` em \`src/pages\`) | ${d.paginas.total} |`,
    `| Componentes (\`.tsx\` em \`src/components\`) | ${d.componentes.total} |`,
    `| — dos quais shadcn/ui (\`src/components/ui\`) | ${d.componentes.ui} |`,
    `| — fora de \`ui/\` | ${d.componentes.total - d.componentes.ui} |`,
    `| Hooks (\`src/hooks/use*.ts(x)\`, sem testes) | ${d.hooks} |`,
    `| Arquivos de teste vitest (\`*.test.*\` em \`src\` e \`scripts\`) | ${d.testes} |`,
    `| Linhas de \`src/App.tsx\` | ${d.linhasApp} |`,
    `| Linhas de \`src/integrations/supabase/types.ts\` (gerado) | ${d.linhasTypes} |`,
    "",
    "### Páginas por pasta de `src/pages`",
    "",
    "| Pasta | Páginas |",
    "|---|---:|",
    ...d.paginas.porPasta.map(([p, n]) => `| ${p === "(raiz)" ? "(raiz)" : "`" + p + "/`"} | ${n} |`),
    "",
    "## Banco",
    "",
    "| Item | Quantidade |",
    "|---|---:|",
    `| Migrações (\`supabase/migrations/*.sql\`) | ${d.migracoes.total} |`,
    `| Migração mais recente | \`${d.migracoes.recente}\` |`,
    `| Tabelas do schema public (baseline) | ${d.baseline.tabelas} |`,
    `| Views (baseline) | ${d.baseline.views} |`,
    `| Funções (baseline) | ${d.baseline.funcoes} |`,
    `| — de gatilho (\`RETURNS trigger\`) | ${d.baseline.funcoesGatilho} |`,
    `| — demais | ${d.baseline.funcoesOutras} |`,
    `| Enums (baseline) | ${d.baseline.enums} |`,
    `| Policies (\`CREATE POLICY\` em \`supabase/baseline/**/*.sql\`) | ${d.policies} |`,
    `| Linhas de \`supabase/baseline/rls/mapa.csv\` | ${d.mapaRls} |`,
    `| Edge Functions (\`supabase/functions\`, sem \`_shared\`/\`main\`) | ${d.edgeFunctions} |`,
    "",
    "Tabelas, views, funções e enums vêm de `supabase/baseline/schema/01_pre_data.sql`.",
  );
  if (d.mapaRls !== d.baseline.tabelas) {
    L.push(
      "",
      `> **Atenção:** o mapa de RLS tem ${d.mapaRls} linha(s) e o baseline tem ${d.baseline.tabelas} tabela(s).` +
        " Toda tabela do baseline deveria ter uma linha no mapa (`node scripts/db/gerar-rls.mjs --check`).",
    );
  }
  L.push(
    "",
    "## Módulos",
    "",
    `${d.modulos.length} módulos em \`MODULOS\` (\`src/shared/config/modules.config.ts\`). Rotas do sistema`,
    "(`src/App.tsx`, sem redirecionamentos e curinga) contadas pelo mesmo critério de `moduloDaRota`",
    "(prefixo mais longo).",
    "",
    "| Código | Nome | Rotas protegidas | Rotas públicas |",
    "|---|---|---:|---:|",
    ...d.modulos.map((m) => {
      const c = d.rotasPorModulo.get(m.codigo);
      return `| \`${m.codigo}\` | ${m.nome} | ${c.protegida} | ${c.publica} |`;
    }),
  );
  const sem = d.rotasPorModulo.get(null);
  L.push(`| — | sem módulo (transversais e públicas gerais) | ${sem.protegida} | ${sem.publica} |`, "");
  return L.join("\n");
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

/** Diferença simples linha a linha (o arquivo é pequeno): o que saiu (-) e o que entrou (+). */
export function diferenca(antigo, novo) {
  const a = antigo.split("\n");
  const n = novo.split("\n");
  const emA = new Set(a);
  const emN = new Set(n);
  return [...a.filter((l) => !emN.has(l)).map((l) => "- " + l), ...n.filter((l) => !emA.has(l)).map((l) => "+ " + l)];
}

function main() {
  const conteudo = gerarMarkdown(coletar(RAIZ));
  const destino = join(RAIZ, SAIDA);
  if (process.argv.includes("--checar")) {
    const atual = existsSync(destino) ? readFileSync(destino, "utf8") : "";
    if (atual === conteudo) {
      console.log(`✅ ${SAIDA} em dia.`);
      return;
    }
    console.error(`::error::${SAIDA} desatualizado (ou ausente). Diferença:`);
    const dif = diferenca(atual, conteudo);
    (dif.length ? dif : ["(só ordem/espaços em branco mudaram)"]).forEach((l) => console.error("  " + l));
    console.error("\nRode: npm run estado  (e inclua o arquivo no commit)");
    process.exit(1);
  }
  writeFileSync(destino, conteudo);
  console.log(`Gravado ${SAIDA}.`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();

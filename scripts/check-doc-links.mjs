#!/usr/bin/env node
/**
 * Guard de integridade das referências de arquivo na documentação.
 *
 * Por que existe: documentação que aponta para arquivo inexistente (ou vazio)
 * apodrece em silêncio. Sem um cobrador automático, uma doc que cita
 * `docs/ALGO.md` depois de o arquivo ser renomeado/removido continua parecendo
 * correta até alguém clicar no link.
 *
 * ESCOPO — só valida documentação VIVA (LIVING_DOCS abaixo).
 *
 * Isso é deliberado, não preguiça. Documento que afirma algo sobre o presente
 * ("o sistema faz X") apodrece; registro datado do passado (uma auditoria com
 * data, um plano histórico em `.lovable/`) continua verdadeiro para sempre,
 * mesmo depois de o arquivo citado ser deletado. Validar registros históricos
 * contra o estado atual do repo forçaria a reescrever a história para o CI
 * passar — o oposto do que se quer. Ao adicionar uma doc normativa nova,
 * inclua-a em LIVING_DOCS.
 *
 * O que conta como referência de arquivo (conservador de propósito, para não
 * gerar falso positivo): texto entre crases ou destino de link markdown que
 * pareça caminho relativo do repo e tenha extensão conhecida. Ficam de fora
 * rotas da aplicação (`/rh/servidores/:id`), globs, placeholders `<nome>`,
 * URLs e tokens CSS.
 *
 * Uso: node scripts/check-doc-links.mjs [--all]
 *   sem flag  -> valida LIVING_DOCS (modo do CI/gate local)
 *   --all     -> relatório de TODAS as .md, sem falhar (diagnóstico)
 */

import { readFileSync, statSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, resolve, relative } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

// Documentação normativa: descreve como o sistema É e deve ser hoje.
// docs/AUDITORIA_USUARIOS.md e docs/INVENTARIO_HARDCODE.md ficam de FORA de
// propósito — são registros datados de auditorias pontuais, não docs vivas
// (ver docs/GOVERNANCA-DOCUMENTACAO.md §7).
const LIVING_DOCS = [
  "CLAUDE.md",
  "AGENTS.md",
  "docs/README.md",
  "docs/GOVERNANCA-DOCUMENTACAO.md",
  "docs/ARQUITETURA.md",
  "docs/MODULOS.md",
  "docs/BANCO_DE_DADOS.md",
  "docs/RBAC_PERMISSOES.md",
  "docs/GUIA_FRONTEND.md",
  "docs/EDGE_FUNCTIONS.md",
  "docs/DESENVOLVIMENTO.md",
  "docs/VISAO_GERAL.md",
  "docs/WHITE_LABEL.md",
];

const EXT = /\.(tsx?|jsx?|mjs|cjs|css|scss|json|sql|sh|ya?ml|html|md|png|svg|jpe?g|webp|ico|txt|toml)$/i;

/** Decide se um trecho de texto é uma referência a arquivo do repositório. */
function looksLikeRepoPath(raw) {
  const s = raw.trim();
  if (!s || s.length > 200) return null;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) return null; // URL
  if (s.startsWith("#") || s.startsWith("mailto:")) return null;
  if (s.startsWith("/")) return null; // rota da app ou asset público servido na raiz
  if (/[*?<>|$\s]/.test(s)) return null; // glob, placeholder, variável, frase
  if (s.includes("://") || s.includes("@")) return null;
  if (s.startsWith("--") || s.startsWith("~")) return null; // token CSS / home
  // Descarta sufixo :123 (referência a linha) antes de testar a extensão.
  const path = s.replace(/:\d+(-\d+)?$/, "");
  if (path.includes(":")) return null; // param de rota (`/rh/:id`) ou outro
  if (/^\.[a-z0-9]+$/i.test(path)) return null; // só a extensão (`.tsx`, `.txt`)
  if (!EXT.test(path)) return null;
  if (path.startsWith("node_modules/")) return null;
  return path;
}

/**
 * Índice de basename -> caminhos rastreados. A doc frequentemente cita o arquivo
 * pelo nome curto ("ver `ProtectedRoute.tsx`"), sem caminho. Isso continua sendo
 * uma referência que apodrece se o arquivo for renomeado, então vale verificar
 * — mas só quando o nome é inequívoco no repo.
 */
const byBasename = (() => {
  const idx = new Map();
  const files = execSync("git ls-files", { cwd: ROOT, encoding: "utf8" }).split("\n");
  for (const f of files) {
    if (!f || f.startsWith("node_modules/")) continue;
    const base = f.slice(f.lastIndexOf("/") + 1);
    if (!idx.has(base)) idx.set(base, []);
    idx.get(base).push(f);
  }
  return idx;
})();

/** Extrai candidatos de um markdown: conteúdo em crases + destino de link. */
function extractCandidates(text) {
  const out = new Map(); // path -> primeira linha onde aparece
  const lines = text.split("\n");
  let inFence = false;
  lines.forEach((line, i) => {
    if (/^\s*```/.test(line)) { inFence = !inFence; return; }
    if (inFence) return; // bloco de código: pode conter caminhos ilustrativos
    const add = (raw) => {
      const p = looksLikeRepoPath(raw);
      if (p && !out.has(p)) out.set(p, i + 1);
    };
    for (const m of line.matchAll(/`([^`]+)`/g)) add(m[1]);
    for (const m of line.matchAll(/\]\(([^)]+)\)/g)) add(m[1]);
  });
  return out;
}

/**
 * Resolve o candidato: relativo à doc, senão relativo à raiz, senão pelo nome
 * curto. Basename com MAIS DE UM match no repo é ambíguo — trata como OK, para
 * não transformar ambiguidade em erro.
 */
const AMBIGUOUS = Symbol("ambíguo");

function resolveCandidate(docPath, candidate) {
  const fromDoc = resolve(ROOT, dirname(docPath), candidate);
  if (existsSync(fromDoc)) return fromDoc;
  const fromRoot = resolve(ROOT, candidate);
  if (existsSync(fromRoot)) return fromRoot;
  if (!candidate.includes("/")) {
    const hits = byBasename.get(candidate);
    if (hits?.length === 1) return resolve(ROOT, hits[0]);
    if (hits?.length > 1) return AMBIGUOUS;
    return null;
  }
  // Caminho parcial: a doc escreve `auth/ProtectedRoute.tsx` para o que mora em
  // src/components/auth/. Casa por sufixo, exigindo limite de diretório para
  // não aceitar `2auth/ProtectedRoute.tsx`.
  const suffix = "/" + candidate;
  const hits = [...byBasename.values()].flat().filter((f) => f.endsWith(suffix));
  if (hits.length === 1) return resolve(ROOT, hits[0]);
  if (hits.length > 1) return AMBIGUOUS;
  return null;
}

/**
 * Duas diretivas, com significados deliberadamente distintos:
 *
 *   <!-- doc-links-absent: caminho/que/nao/deve/existir.ts -->
 *     "este arquivo NÃO deve existir". Para dizer "foi removido, não recriar"
 *     — o guard passa a DEFENDER isso: se o arquivo voltar, falha. É
 *     afirmação verificada, não cegueira.
 *
 *   <!-- doc-links-ignore: NomeQueNaoPertenceAoRepo.sql -->
 *     "não verifique". Para arquivo que o LEITOR fornece (instrução de setup,
 *     dump externo) ou que não pertence ao repo. Escape de último recurso —
 *     prefira -absent quando a intenção for de fato "não existe".
 */
function directives(text) {
  const read = (name) => {
    const set = new Set();
    const re = new RegExp(`<!--\\s*doc-links-${name}:\\s*([^>]+?)\\s*-->`, "g");
    for (const m of text.matchAll(re)) m[1].split(",").forEach((p) => set.add(p.trim()));
    return set;
  };
  return { absent: read("absent"), ignore: read("ignore") };
}

const all = process.argv.includes("--all");
const docs = all
  ? execSync("git ls-files '*.md'", { cwd: ROOT, encoding: "utf8" })
      .split("\n").filter((f) => f && !f.startsWith("node_modules/"))
  : LIVING_DOCS;

let missing = 0;
let empty = 0;
let checked = 0;

for (const doc of docs) {
  const abs = resolve(ROOT, doc);
  if (!existsSync(abs)) {
    console.error(`::error::Doc listada em LIVING_DOCS não existe: ${doc}`);
    missing++;
    continue;
  }
  const text = readFileSync(abs, "utf8");
  const { absent, ignore } = directives(text);
  const problems = [];
  for (const [cand, line] of extractCandidates(text)) {
    if (ignore.has(cand)) continue;
    if (absent.has(cand)) {
      // Cobra o inverso: se o arquivo VOLTAR, a doc passou a mentir.
      checked++;
      if (resolveCandidate(doc, cand)) {
        problems.push(`  ${doc}:${line}  →  ${cand}  (declarado ausente, mas existe)`);
        missing++;
      }
      continue;
    }
    checked++;
    const found = resolveCandidate(doc, cand);
    if (found === AMBIGUOUS) continue;
    if (!found) {
      problems.push(`  ${doc}:${line}  →  ${cand}  (não existe)`);
      missing++;
    } else if (statSync(found).isFile() && statSync(found).size <= 1) {
      problems.push(`  ${doc}:${line}  →  ${relative(ROOT, found)}  (arquivo vazio)`);
      empty++;
    }
  }
  if (problems.length) {
    console.error(`::error::Referências quebradas em ${doc}:`);
    problems.forEach((p) => console.error(p));
  }
}

const total = missing + empty;
if (total === 0) {
  console.log(`✅ Docs OK: ${docs.length} arquivos, ${checked} referências verificadas.`);
} else {
  console.error(
    `\n${total} referência(s) com problema (${missing} inexistente(s), ${empty} vazia(s)) ` +
      `em ${checked} verificadas.`
  );
  console.error(
    "Conserte o caminho, remova a referência, ou — se a doc for registro histórico —" +
      " tire-a de LIVING_DOCS em scripts/check-doc-links.mjs."
  );
}

// `--all` é diagnóstico: relata mas nunca falha.
process.exit(all ? 0 : total === 0 ? 0 : 1);

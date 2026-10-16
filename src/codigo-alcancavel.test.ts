import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Código morto (P10): todo arquivo de src/ precisa ser alcançado, seguindo os imports, a partir das
// entradas do app. Arquivo que nada importa não entra no build e só confunde quem lê.
const SRC = __dirname;
const ENTRADAS = ["main.tsx", "main-site.tsx"];

// Fora da regra de propósito: o padrão novo de PDF ainda não tem tela usando (os geradores antigos
// migram para ele aos poucos; ver docs/PADRAO_DOCUMENTOS.md).
const EXCECOES = [/^lib\/documentos\//];

const EXTENSOES = [".tsx", ".ts", ".jsx", ".js", ".mjs", ".json", ".css"];
const RE_IMPORT =
  /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|import\s+['"]([^'"]+)['"]/g;

function resolver(especificador: string, de: string): string | null {
  let base: string;
  if (especificador.startsWith("@/")) base = join(SRC, especificador.slice(2));
  else if (especificador.startsWith(".")) base = resolve(dirname(de), especificador);
  else return null;
  base = base.replace(/\?.*$/, "");
  const candidatos = [base, ...EXTENSOES.map((e) => base + e), ...EXTENSOES.map((e) => join(base, "index" + e))];
  return candidatos.find((c) => existsSync(c) && statSync(c).isFile()) ?? null;
}

function alcancaveis(): Set<string> {
  const vistos = new Set<string>();
  const fila = ENTRADAS.map((e) => join(SRC, e));
  while (fila.length) {
    const arquivo = fila.pop()!;
    if (vistos.has(arquivo)) continue;
    vistos.add(arquivo);
    if (!/\.(tsx?|jsx?|mjs)$/.test(arquivo)) continue;
    for (const m of readFileSync(arquivo, "utf8").matchAll(RE_IMPORT)) {
      const alvo = resolver(m[1] ?? m[2] ?? m[3], arquivo);
      if (alvo && !vistos.has(alvo)) fila.push(alvo);
    }
  }
  return vistos;
}

function codigoDeSrc(dir = SRC, acc: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) codigoDeSrc(p, acc);
    else if (/\.(tsx?|jsx?)$/.test(e.name) && !/\.test\./.test(e.name) && !e.name.endsWith(".d.ts")) acc.push(p);
  }
  return acc;
}

describe("código alcançável", () => {
  it("todo arquivo de src/ é importado, direta ou indiretamente, por uma entrada do app", () => {
    const vistos = alcancaveis();
    expect(vistos.size).toBeGreaterThan(500);
    const mortos = codigoDeSrc()
      .filter((f) => !vistos.has(f))
      .map((f) => relative(SRC, f).split("\\").join("/"))
      .filter((f) => !EXCECOES.some((re) => re.test(f)));
    expect(mortos).toEqual([]);
  });
});

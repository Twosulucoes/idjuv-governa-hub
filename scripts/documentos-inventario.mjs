#!/usr/bin/env node
// F0 do padrão de impressão: lista cada gerador de PDF de src/lib (arquivo, linhas,
// funções exportadas) e quem o chama (telas fora de src/lib e outros módulos de src/lib).
// Uso: node scripts/documentos-inventario.mjs   → tabela markdown no stdout
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(RAIZ, 'src');

function* arquivos(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* arquivos(p);
    else if (/\.(ts|tsx)$/.test(e.name)) yield p;
  }
}

const todos = [...arquivos(SRC)].filter((p) => !p.includes(`${join('lib', 'documentos')}`));
const geradores = todos.filter((p) => {
  const rel = relative(SRC, p);
  return /^lib\/(pdf[A-Za-z]*|portariaPdf)\.ts$/.test(rel) || /^lib\/pdf\//.test(rel);
});

const modulo = (p) => relative(SRC, p).replace(/\.(ts|tsx)$/, '').replace(/\/index$/, '');
const exportadas = (fonte) =>
  [...fonte.matchAll(/^export\s+(?:async\s+)?(?:function|const)\s+([A-Za-z0-9_]+)/gm)].map((m) => m[1]);

const linhas = [];
for (const g of geradores.sort()) {
  const mod = modulo(g); // ex.: lib/pdfPortarias
  const alvo = new RegExp(`from\\s+['"](?:@/${mod}|\\./${basename(mod)}|\\.\\./${basename(mod)})['"]`);
  const telas = new Set();
  const libs = new Set();
  for (const o of todos) {
    if (o === g) continue;
    if (alvo.test(readFileSync(o, 'utf8'))) {
      (relative(SRC, o).startsWith('lib/') ? libs : telas).add(relative(SRC, o));
    }
  }
  const fonte = readFileSync(g, 'utf8');
  linhas.push(
    `| \`${relative(RAIZ, g)}\` | ${fonte.split('\n').length} | ${exportadas(fonte).map((e) => `\`${e}\``).join(', ') || '—'} | ${telas.size} | ${libs.size} |`,
  );
}
console.log('| arquivo | linhas | exports | telas que chamam | libs que chamam |');
console.log('|---|---|---|---|---|');
console.log(linhas.join('\n'));

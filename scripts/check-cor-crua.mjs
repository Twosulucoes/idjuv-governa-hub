#!/usr/bin/env node
// Conta "cor crua" em componentes: classes da paleta fixa do Tailwind
// (`bg-blue-500`, `text-green-700`, `border-slate-200`…) e hex literal
// (`#1e40af`) em `src/**/*.tsx`. Cor crua ignora o tema do tenant e o dark mode;
// o certo é token semântico (`bg-primary`, `text-muted-foreground`…).
//
// O gate compara a contagem com `corCrua` em scripts/gate-baseline.json e falha
// se ela SUBIR (ratchet). Ao migrar telas, rode `bash scripts/gate.sh --update-baseline`.
//
// Uso: node scripts/check-cor-crua.mjs            → imprime a contagem
//      node scripts/check-cor-crua.mjs --arquivos → contagem por arquivo
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const PALETA =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const CLASSE = new RegExp(
  `\\b(?:bg|text|border|from|via|to|ring|fill|stroke|outline|divide|placeholder|decoration|shadow|accent|caret)(?:-[trblxy])?-(?:${PALETA})-(?:50|[1-9]00|950)\\b`,
  'g',
);
const HEX = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![0-9a-fA-F])/g;

function* arquivos(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* arquivos(p);
    else if (e.name.endsWith('.tsx')) yield p;
  }
}

const porArquivo = [];
let total = 0;
for (const arq of arquivos(join(RAIZ, 'src'))) {
  const fonte = readFileSync(arq, 'utf8');
  const n = (fonte.match(CLASSE)?.length ?? 0) + (fonte.match(HEX)?.length ?? 0);
  if (n) porArquivo.push([n, relative(RAIZ, arq)]);
  total += n;
}

if (process.argv.includes('--arquivos')) {
  for (const [n, arq] of porArquivo.sort((a, b) => b[0] - a[0])) console.log(`${String(n).padStart(5)}  ${arq}`);
}
console.log(total);

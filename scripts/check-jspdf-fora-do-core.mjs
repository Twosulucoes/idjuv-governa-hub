#!/usr/bin/env node
// Conta arquivos de src/ que importam `jspdf` (valor, não tipo) fora de src/lib/documentos/core/ (e de __testes__/).
// Padrão de impressão: PDF novo nasce como modelo em src/lib/documentos/, nunca com `new jsPDF` solto.
// O gate compara com `jspdfForaDoCore` em scripts/gate-baseline.json e falha se SUBIR (ratchet);
// ao migrar geradores (F2–F5) rode `bash scripts/gate.sh --update-baseline` e a dívida cai até zero.
// Uso: node scripts/check-jspdf-fora-do-core.mjs [--arquivos]
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
// core/ é o único lugar do código de produção que instancia o jsPDF; os testes da camada também podem.
const LIBERADOS = ['core', '__testes__'].map((d) => join(RAIZ, 'src', 'lib', 'documentos', d) + '/');
// `import jsPDF from 'jspdf'`, `import { jsPDF } from "jspdf"`, `import('jspdf')`, `require('jspdf')`; `import type` não conta.
const IMPORTA = /import\s+(?!type\b)[^;]*?from\s+['"]jspdf['"]|import\(\s*['"]jspdf['"]\s*\)|require\(\s*['"]jspdf['"]\s*\)/;

function* arquivos(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* arquivos(p);
    else if (/\.(ts|tsx)$/.test(e.name)) yield p;
  }
}

const achados = [...arquivos(join(RAIZ, 'src'))]
  .filter((p) => !LIBERADOS.some((l) => p.startsWith(l)) && IMPORTA.test(readFileSync(p, 'utf8')))
  .map((p) => relative(RAIZ, p))
  .sort();

if (process.argv.includes('--arquivos')) achados.forEach((a) => console.log(a));
else console.log(achados.length);

#!/usr/bin/env node
// Reprova a volta da base antiga de PDF (pdfTemplate, pdfInstitucional, pdfLogos), apagada na onda 5 da P23.
// Todo PDF nasce como modelo em src/lib/documentos/ (docs/PADRAO_DOCUMENTOS.md). Falha se algum desses arquivos
// existir em src/ ou se algum arquivo de src/ importar um módulo com esse nome.
// Uso: node scripts/check-base-pdf-antiga.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const NOMES = ['pdfTemplate', 'pdfInstitucional', 'pdfLogos'];
const IMPORTA = new RegExp(`(from\\s+|import\\(\\s*|require\\(\\s*)['"][^'"]*/(${NOMES.join('|')})['"]`);

function* arquivos(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* arquivos(p);
    else if (/\.(ts|tsx)$/.test(e.name)) yield p;
  }
}

const problemas = [];
for (const p of arquivos(join(RAIZ, 'src'))) {
  const rel = relative(RAIZ, p);
  if (NOMES.includes(basename(p).replace(/\.(ts|tsx)$/, ''))) problemas.push(`${rel}: arquivo da base antiga de PDF`);
  else if (IMPORTA.test(readFileSync(p, 'utf8'))) problemas.push(`${rel}: importa a base antiga de PDF`);
}

if (problemas.length) {
  console.error('A base antiga de PDF foi apagada na onda 5; use um modelo em src/lib/documentos/:');
  problemas.forEach((x) => console.error(`  ${x}`));
  process.exit(1);
}

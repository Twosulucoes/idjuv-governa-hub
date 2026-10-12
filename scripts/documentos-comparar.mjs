#!/usr/bin/env node
// Compara dois PDFs (gerador antigo × camada nova): páginas, diferença de texto e PNGs para olhar.
// Uso: node scripts/documentos-comparar.mjs antes.pdf depois.pdf [--saida pasta] [--dpi 70]
// Requer poppler (pdftoppm, pdftotext, pdfinfo). Uso local; não roda no CI.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);
const opcao = (nome, padrao) => { const i = args.indexOf(nome); return i >= 0 ? args.splice(i, 2)[1] : padrao; };
const dpi = opcao('--dpi', '70');
const saida = resolve(opcao('--saida', mkdtempSync(join(tmpdir(), 'comparar-pdf-'))));
const [antes, depois] = args;
if (!antes || !depois) { console.error('uso: documentos-comparar.mjs antes.pdf depois.pdf [--saida pasta] [--dpi 70]'); process.exit(2); }
mkdirSync(saida, { recursive: true });

const sh = (cmd, a) => execFileSync(cmd, a, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const paginas = (pdf) => Number(/Pages:\s+(\d+)/.exec(sh('pdfinfo', [pdf]))[1]);
const linhas = (pdf) => new Set(sh('pdftotext', ['-layout', pdf, '-']).split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean));

const [pa, pd] = [paginas(antes), paginas(depois)];
console.log(`páginas: antes ${pa} · depois ${pd}${pa === pd ? '' : '  ← DIFERENTE'}`);

const [la, ld] = [linhas(antes), linhas(depois)];
const sumiram = [...la].filter((l) => !ld.has(l));
const apareceram = [...ld].filter((l) => !la.has(l));
console.log(`\ntexto que SUMIU (${sumiram.length}):`); sumiram.slice(0, 40).forEach((l) => console.log(`  - ${l}`));
console.log(`\ntexto NOVO (${apareceram.length}):`); apareceram.slice(0, 40).forEach((l) => console.log(`  + ${l}`));

execFileSync('pdftoppm', ['-r', dpi, '-png', antes, join(saida, 'antes')]);
execFileSync('pdftoppm', ['-r', dpi, '-png', depois, join(saida, 'depois')]);
console.log(`\nPNGs em ${saida} (antes-N.png / depois-N.png)`);

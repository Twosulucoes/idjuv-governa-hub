#!/usr/bin/env node
// Conta arquivos de src/ que imprimem por conta própria, fora de src/lib/documentos/: `window.print()` (ou
// `janela.print()` numa janela aberta à mão), classe `print:` do Tailwind, `@media print`/`@page` e biblioteca de
// PDF ou de impressão que não seja o jsPDF do core (pdf-lib, html2canvas, react-to-print, pdfmake, @react-pdf).
// O jsPDF tem guard próprio (check-jspdf-fora-do-core.mjs); este fecha as outras portas: uma tela que chama o
// diálogo do navegador sai sem o cabeçalho, as logos e o rodapé do motor, e ninguém percebe no review.
// O gate compara com `impressaoForaDoCore` em scripts/gate-baseline.json e falha se SUBIR (ratchet); ao migrar
// uma tela para um modelo de src/lib/documentos/, rode `bash scripts/gate.sh --update-baseline`.
// Uso: node scripts/check-impressao-fora-do-core.mjs [--arquivos]
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
// O motor inteiro: core/, modelos, blocos e testes.
const LIBERADO = join(RAIZ, 'src', 'lib', 'documentos') + '/';

const LIBS = 'pdf-lib|html2canvas|html2pdf\\.js|react-to-print|pdfmake|@react-pdf/[^\'"]+';
export const PADROES = [
  /\.print\s*\(\s*\)/, // window.print(), janela.print()
  /(^|[^\w-])print:[a-z-]/m, // print:hidden, print:block…
  /@media[^{]*\bprint\b/, // @media print
  /@page\b/,
  new RegExp(`(?:from|import\\(|require\\()\\s*['"](?:${LIBS})['"]`), // import de valor ou dinâmico
];

/** O texto imprime fora do motor? `import type` de uma lib não conta. */
export function imprime(texto) {
  const semTipos = texto.replace(/import\s+type\b[^;]*;/g, '');
  return PADROES.some((p) => p.test(semTipos));
}

function* arquivos(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* arquivos(p);
    else if (/\.(ts|tsx|css)$/.test(e.name)) yield p;
  }
}

function main() {
  const achados = [...arquivos(join(RAIZ, 'src'))]
    .filter((p) => !p.startsWith(LIBERADO) && imprime(readFileSync(p, 'utf8')))
    .map((p) => relative(RAIZ, p))
    .sort();

  if (process.argv.includes('--arquivos')) achados.forEach((a) => console.log(a));
  else console.log(achados.length);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();

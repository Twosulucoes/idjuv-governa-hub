#!/usr/bin/env node
/**
 * Guard do build `site` (vite build --mode site → dist-site/): o site institucional não pode conter código
 * do sistema interno, nem restos de PWA, e precisa trazer o sw.js autodestrutivo.
 *
 * As sentinelas são textos que existem no bundle do sistema (dist/) e NÃO no do site. Foram medidas em
 * 12/10/2026 (cada uma: presente em dist/, ausente em dist-site/). Se o site passar a precisar legitimamente
 * de uma delas (ex.: exportar PDF com jspdf), tire-a da lista COM o motivo no commit.
 *
 * Uso: node scripts/check-bundle-site.mjs [pasta=dist-site]
 */
import fs from 'node:fs';
import path from 'node:path';

export const SENTINELAS = [
  '/admin/usuarios', '/rh/gestao-lotacao', '/gabinete/portarias', '/patrimonio-mobile',
  '/folha', '/financeiro', 'requiredModule', 'jspdf', 'reactflow',
];
export const PROIBIDOS_NA_RAIZ = [/^manifest\.webmanifest$/, /^registerSW\.js$/, /^workbox-.*\.js$/];

function jsDe(pasta) {
  const dir = path.join(pasta, 'assets');
  if (!fs.existsSync(dir)) throw new Error(`sem ${dir} — rode "npm run build:site" antes`);
  return fs.readdirSync(dir).filter((f) => f.endsWith('.js')).map((f) => path.join(dir, f));
}

export function verificar(pasta) {
  const erros = [];
  const arquivos = jsDe(pasta);
  let bytes = 0;
  for (const f of arquivos) {
    const txt = fs.readFileSync(f, 'utf8');
    bytes += Buffer.byteLength(txt);
    for (const s of SENTINELAS) if (txt.includes(s)) erros.push(`vazamento: "${s}" em ${path.relative(pasta, f)}`);
  }
  for (const f of fs.readdirSync(pasta)) {
    if (PROIBIDOS_NA_RAIZ.some((r) => r.test(f))) erros.push(`resto de PWA na raiz: ${f}`);
  }
  const sw = path.join(pasta, 'sw.js');
  if (!fs.existsSync(sw)) erros.push('falta sw.js autodestrutivo');
  else {
    const t = fs.readFileSync(sw, 'utf8');
    if (!t.includes('unregister') || !t.includes('caches.delete')) erros.push('sw.js não é o autodestrutivo (faltam unregister/caches.delete)');
  }
  return { erros, arquivos: arquivos.length, bytes };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const pasta = process.argv[2] ?? 'dist-site';
  try {
    const { erros, arquivos, bytes } = verificar(pasta);
    console.log(`site: ${arquivos} arquivos JS, ${(bytes / 1048576).toFixed(2)} MB`);
    if (erros.length) { console.error(erros.map((e) => `  ✘ ${e}`).join('\n')); process.exit(1); }
    console.log('  ✔ nenhum código do sistema interno no build site');
  } catch (e) { console.error(`  ✘ ${e.message}`); process.exit(2); }
}

#!/usr/bin/env node
// Guard de contraste do design system (WCAG 2.x, nível AA).
//
// Lê os tokens HSL de `src/index.css` (blocos `:root` e `.dark` da primeira
// `@layer base`) e sobrepõe a paleta de cada perfil em `tenants/*/tenant.config.ts`
// — é o mesmo efeito do `aplicarTema()` em runtime. Para cada tenant e modo,
// confere os pares texto/fundo (≥ 4,5:1) e os componentes não textuais
// (borda de campo e anel de foco, ≥ 3:1).
//
// Uso: node scripts/check-contraste.mjs [--verbose]
// Sai com 1 se algum par ficar abaixo do mínimo.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const verbose = process.argv.includes('--verbose');

// [texto, fundo, mínimo, descrição]
const PARES = [
  ['foreground', 'background', 4.5, 'texto base'],
  ['card-foreground', 'card', 4.5, 'texto no card'],
  ['popover-foreground', 'popover', 4.5, 'texto no popover'],
  ['muted-foreground', 'background', 4.5, 'texto secundário'],
  ['muted-foreground', 'card', 4.5, 'texto secundário no card'],
  ['muted-foreground', 'muted', 4.5, 'texto secundário sobre muted'],
  ['primary-foreground', 'primary', 4.5, 'botão primário'],
  ['secondary-foreground', 'secondary', 4.5, 'botão secundário'],
  ['accent-foreground', 'accent', 4.5, 'accent preenchido'],
  ['highlight-foreground', 'highlight', 4.5, 'destaque preenchido'],
  ['destructive-foreground', 'destructive', 4.5, 'botão destrutivo'],
  ['success-foreground', 'success', 4.5, 'sucesso preenchido'],
  ['warning-foreground', 'warning', 4.5, 'alerta preenchido'],
  ['info-foreground', 'info', 4.5, 'info preenchido'],
  ['primary', 'background', 4.5, 'text-primary / link'],
  ['destructive', 'background', 4.5, 'text-destructive'],
  ['success-text', 'background', 4.5, 'text-success'],
  ['warning-text', 'background', 4.5, 'text-warning'],
  ['info-text', 'background', 4.5, 'text-info'],
  ['accent-text', 'background', 4.5, 'text-accent'],
  ['secondary-text', 'background', 4.5, 'text-secondary'],
  ['sidebar-foreground', 'sidebar-background', 4.5, 'texto da sidebar'],
  ['sidebar-primary-foreground', 'sidebar-primary', 4.5, 'item ativo da sidebar'],
  ['sidebar-accent-foreground', 'sidebar-accent', 4.5, 'item em foco da sidebar'],
  ['input', 'background', 3, 'borda de campo (1.4.11)'],
  ['ring', 'background', 3, 'anel de foco (1.4.11)'],
];

// --- leitura de tokens -------------------------------------------------------

function blocoCss(css, seletor) {
  const i = css.indexOf(`${seletor} {`);
  if (i < 0) throw new Error(`bloco ${seletor} não encontrado em src/index.css`);
  const fim = css.indexOf('}', i);
  return css.slice(i, fim);
}

function tokensCss(bloco) {
  const tokens = {};
  for (const m of bloco.matchAll(/--([\w-]+):\s*(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%\s*;/g)) {
    tokens[m[1]] = [Number(m[2]), Number(m[3]), Number(m[4])];
  }
  return tokens;
}

const kebab = (s) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

function paletaTenant(arquivo) {
  const fonte = readFileSync(arquivo, 'utf8');
  const i = fonte.indexOf('paleta: {');
  // Falha alto: um perfil que o script não sabe ler daria falso verde.
  if (i < 0) throw new Error(`${arquivo}: \`paleta: {\` literal não encontrado`);
  const modos = {};
  for (const modo of ['light', 'dark']) {
    const ini = fonte.indexOf(`${modo}: {`, i);
    if (ini < 0) throw new Error(`${arquivo}: bloco \`${modo}: {\` não encontrado na paleta`);
    const fim = fonte.indexOf('}', ini);
    const tokens = {};
    for (const m of fonte.slice(ini, fim).matchAll(/(\w+):\s*(['"])(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%\2/g)) {
      tokens[kebab(m[1])] = [Number(m[3]), Number(m[4]), Number(m[5])];
    }
    if (!tokens.primary) throw new Error(`${arquivo}: modo ${modo} sem \`primary\` legível`);
    modos[modo] = tokens;
  }
  return modos;
}

// Tenant que muda o matiz de um estado precisa trazer a cor de TEXTO dele;
// senão `text-<estado>` herda o matiz de src/index.css (outra instituição).
const COM_TEXTO = ['success', 'warning', 'info', 'accent', 'secondary'];

// --- contraste WCAG ------------------------------------------------------------

function rgb([h, s, l]) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)];
}

function luminancia(hsl) {
  const [r, g, b] = rgb(hsl).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a, b) {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

// --- execução -------------------------------------------------------------------

const css = readFileSync(join(RAIZ, 'src/index.css'), 'utf8');
const base = { light: tokensCss(blocoCss(css, ':root')), dark: tokensCss(blocoCss(css, '.dark')) };

const dirTenants = join(RAIZ, 'tenants');
const tenants = readdirSync(dirTenants, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(dirTenants, d.name, 'tenant.config.ts')))
  .map((d) => d.name);

let falhas = 0;
let conferidos = 0;
for (const tenant of ['(index.css)', ...tenants]) {
  const paleta = tenant === '(index.css)' ? null : paletaTenant(join(dirTenants, tenant, 'tenant.config.ts'));
  for (const modo of ['light', 'dark']) {
    const tokens = { ...base[modo], ...(paleta?.[modo] ?? {}) };
    for (const estado of COM_TEXTO) {
      if (paleta?.[modo]?.[estado] && !paleta[modo][`${estado}-text`]) {
        console.error(`✘ ${tenant} ${modo}: define --${estado} mas não ${estado}Text (o texto herdaria o matiz de src/index.css)`);
        falhas++;
      }
    }
    for (const [texto, fundo, minimo, descricao] of PARES) {
      if (!tokens[texto] || !tokens[fundo]) {
        console.error(`✘ ${tenant} ${modo}: token ausente --${tokens[texto] ? fundo : texto} (${descricao})`);
        falhas++;
        continue;
      }
      const valor = contraste(tokens[texto], tokens[fundo]);
      conferidos++;
      const ok = valor >= minimo;
      if (!ok) falhas++;
      if (!ok || verbose) {
        console[ok ? 'log' : 'error'](
          `${ok ? '✔' : '✘'} ${tenant} ${modo}: --${texto} sobre --${fundo} = ${valor.toFixed(2)} (mín. ${minimo}) — ${descricao}`,
        );
      }
    }
  }
}

if (falhas) {
  console.error(`\n${falhas} par(es) abaixo do contraste AA. Ajuste src/index.css ou a paleta do tenant.`);
  process.exit(1);
}
console.log(`✅ Contraste OK: ${conferidos} pares em ${tenants.length + 1} paletas (claro e escuro).`);

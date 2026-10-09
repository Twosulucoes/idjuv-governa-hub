#!/usr/bin/env node
/**
 * GERADOR DE PROMPTS — IDJUV Governa Hub
 *
 * Transforma um pedido curto ("tela de afastamentos no RH") num prompt
 * completo para o Claude: template do tipo de tarefa (prompts/templates/)
 * + contexto real do módulo lido do código (rotas, páginas, hooks, docs)
 * + pendências detectadas automaticamente.
 *
 * Uso:
 *   npm run prompt                                   # lista tipos e módulos
 *   npm run prompt -- <tipo> [--modulo <cod>] "<descrição>"
 *   npm run prompt -- pendencias [--modulo <cod>]    # só o relatório de pendências
 *   npm run prompt -- <tipo> ... --out arquivo.md    # grava em vez de imprimir
 *
 * Sem dependências: lê os arquivos-fonte por regex (não importa o TS).
 */
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname, basename, relative, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATES_DIR = join(ROOT, 'prompts', 'templates');
const ler = (p) => readFileSync(join(ROOT, p), 'utf8');

// ================================
// TEMPLATES
// ================================

/** Frontmatter simples (chave: valor) + corpo. */
function lerTemplate(arquivo) {
  const bruto = readFileSync(join(TEMPLATES_DIR, arquivo), 'utf8');
  const m = bruto.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const meta = {};
  if (m) {
    for (const linha of m[1].split('\n')) {
      const i = linha.indexOf(':');
      if (i > 0) meta[linha.slice(0, i).trim()] = linha.slice(i + 1).trim();
    }
  }
  return { tipo: basename(arquivo, '.md'), meta, corpo: m ? m[2] : bruto };
}

function listarTemplates() {
  return readdirSync(TEMPLATES_DIR)
    .filter((f) => f.endsWith('.md'))
    .map(lerTemplate)
    .sort((a, b) => a.tipo.localeCompare(b.tipo));
}

// ================================
// CONTEXTO DO CÓDIGO
// ================================

/** Módulos de src/shared/config/modules.config.ts (codigo, nome, descricao, rotas). */
function lerModulos() {
  const src = ler('src/shared/config/modules.config.ts');
  const inicio = src.indexOf('MODULES_CONFIG');
  const blocos = src.slice(inicio).split(/\n\s*\{\s*\n/).slice(1);
  const modulos = [];
  for (const b of blocos) {
    const codigo = b.match(/codigo:\s*'([^']+)'/)?.[1];
    if (!codigo) continue;
    modulos.push({
      codigo,
      nome: b.match(/nome:\s*'([^']+)'/)?.[1] ?? codigo,
      descricao: b.match(/descricao:\s*'([^']+)'/)?.[1] ?? '',
      rotas: [...(b.match(/rotas:\s*\[([^\]]*)\]/)?.[1] ?? '').matchAll(/'([^']+)'/g)].map((x) => x[1]),
    });
  }
  return modulos;
}

/** "./pages/financeiro" + "EmpenhosPage" → "./pages/financeiro/EmpenhosPage" (via index.ts). */
function resolverBarrel(dir, nome) {
  const base = dir.replace(/^\.\//, 'src/');
  const index = ['index.ts', 'index.tsx'].map((f) => join(base, f)).find((f) => existsSync(join(ROOT, f)));
  if (!index) return dir;
  const m = ler(index).match(new RegExp(`default\\s+as\\s+${nome}\\s*\\}\\s*from\\s*["']([^"']+)["']`));
  return m ? `${dir}/${m[1].replace(/^\.\//, '')}` : dir;
}

/** Rotas de src/App.tsx: { path, page, arquivo, guard }. */
function lerRotas() {
  const app = ler('src/App.tsx');
  const imports = new Map();
  for (const m of app.matchAll(/import\s+(\w+)\s+from\s+["']([^"']+)["']/g)) imports.set(m[1], m[2]);
  for (const m of app.matchAll(/const\s+(\w+)\s*=\s*lazy\(\s*\(\)\s*=>\s*import\(\s*["']([^"']+)["']/g)) imports.set(m[1], m[2]);
  // import { A, B as C } from "./pages/financeiro" — resolve pelo barrel (index.ts)
  for (const m of app.matchAll(/import\s*\{([^}]+)\}\s*from\s*["'](\.\/pages\/[^"']+)["']/g)) {
    for (const nome of m[1].split(',').map((x) => x.trim().split(/\s+as\s+/).pop()).filter(Boolean)) {
      imports.set(nome, resolverBarrel(m[2], nome));
    }
  }

  const rotas = [];
  const re = /<Route\s+path="([^"]+)"\s+element=\{([\s\S]*?)\}\s*\/>/g;
  for (const m of app.matchAll(re)) {
    const elemento = m[2];
    const comps = [...elemento.matchAll(/<([A-Z]\w*)/g)].map((x) => x[1]);
    const page = comps.filter((c) => !/Guard|Route|Navigate|Suspense|Layout/.test(c)).pop() ?? comps.pop();
    const imp = imports.get(page);
    const arquivo = imp ? posix.normalize(imp.replace(/^\.\//, 'src/').replace(/^@\//, 'src/')) : null;
    const guard = /ProtectedRoute/.test(elemento) ? 'protegida' : /PublicPageGuard/.test(elemento) ? 'pública' : /^\s*<Navigate/.test(elemento) ? 'redireciona' : 'livre';
    const modulo = elemento.match(/requiredModule="([^"]+)"/)?.[1] ?? null;
    rotas.push({ path: m[1], page, arquivo, guard, modulo });
  }
  return rotas;
}

/** Rotas citadas no menu lateral (src/config/menu.config.ts), sem query string. */
function lerRotasMenu() {
  const menu = ler('src/config/menu.config.ts');
  return [...new Set([...menu.matchAll(/route:\s*["']([^"'?#]+)/g)].map((m) => m[1]))];
}

/** "src/pages/X" → arquivo real (.tsx/.ts/index), ou null. */
function resolverArquivo(a) {
  if (!a) return null;
  return [`${a}.tsx`, `${a}.ts`, `${a}/index.tsx`, `${a}/index.ts`, a].find((f) => /\.tsx?$/.test(f) && existsSync(join(ROOT, f))) ?? null;
}

const pertence = (path, rotasModulo) => rotasModulo.some((r) => path === r || path.startsWith(r + '/'));

/** "/rh/servidores/:id" casa com "/rh/servidores/123". */
function rotaExiste(path, rotas) {
  return rotas.some((r) => {
    if (r.path === path || r.path === '*') return r.path === path;
    const re = new RegExp('^' + r.path.replace(/:[^/]+/g, '[^/]+').replace(/\*$/, '.*') + '$');
    return re.test(path);
  });
}

/** Arquivos .ts/.tsx com TODO/FIXME/"em breve"/mock, contados por arquivo. */
function marcadores(arquivos) {
  const achados = [];
  for (const a of arquivos) {
    if (!a) continue;
    const texto = ler(a);
    const n = (texto.match(/TODO|FIXME|XXX|[Ee]m breve|[Pp]laceholder[A-Z]\w*Page|não implementad|mock(ad)?o?s?\b/g) ?? []).length + (/Placeholder/.test(basename(a)) ? 1 : 0);
    if (n) achados.push(`${a} (${n})`);
  }
  return achados;
}

/** Hooks importados pelas páginas do módulo. */
function hooksRelacionados(paginas) {
  const usados = new Set();
  for (const p of paginas) {
    for (const m of ler(p).matchAll(/from\s+["']@\/hooks\/([^"']+)["']/g)) usados.add(`src/hooks/${m[1]}`);
  }
  return [...usados].sort();
}

function pendencias(modulos, rotas, rotasMenu, filtro) {
  const linhas = [];
  for (const mod of modulos) {
    if (filtro && mod.codigo !== filtro) continue;
    const doModulo = rotas.filter((r) => pertence(r.path, mod.rotas));
    const menuSemRota = rotasMenu.filter((p) => pertence(p, mod.rotas) && !rotaExiste(p, rotas));
    const paginas = [...new Set(doModulo.map((r) => resolverArquivo(r.arquivo)).filter(Boolean))];
    const comMarcador = marcadores(paginas);
    const semGuard = doModulo.filter((r) => r.guard === 'livre' && !/^\/(auth|acesso-negado|instalar)/.test(r.path));
    linhas.push(`### ${mod.nome} (\`${mod.codigo}\`) — ${doModulo.length} rotas, ${paginas.length} páginas`);
    linhas.push(menuSemRota.length ? `- Itens de menu sem rota: ${menuSemRota.map((p) => `\`${p}\``).join(', ')}` : '- Itens de menu sem rota: nenhum');
    linhas.push(semGuard.length ? `- Rotas sem guard: ${semGuard.map((r) => `\`${r.path}\``).join(', ')}` : '- Rotas sem guard: nenhuma');
    linhas.push(comMarcador.length ? `- Páginas com TODO/FIXME/"em breve"/mock: ${comMarcador.map((a) => `\`${a}\``).join(', ')}` : '- Páginas com TODO/FIXME/"em breve"/mock: nenhuma');
    linhas.push('');
  }
  linhas.push('> Heurística automática (`scripts/prompt.mjs`): confirme no código antes de agir.');
  return linhas.join('\n');
}

function contextoModulo(mod, rotas) {
  if (!mod) return '_(nenhum módulo informado — descubra pelo pedido e por `src/shared/config/modules.config.ts`)_';
  const doModulo = rotas.filter((r) => pertence(r.path, mod.rotas));
  const paginas = [...new Set(doModulo.map((r) => resolverArquivo(r.arquivo)).filter(Boolean))];
  const hooks = hooksRelacionados(paginas);
  const tabelaRotas = doModulo
    .slice(0, 40)
    .map((r) => `| \`${r.path}\` | ${r.page ?? '?'} | ${r.guard}${r.modulo ? ` (${r.modulo})` : ''} |`)
    .join('\n');
  return [
    `**${mod.nome}** (\`${mod.codigo}\`) — ${mod.descricao}`,
    `Prefixos de rota: ${mod.rotas.map((r) => `\`${r}\``).join(', ')}`,
    '',
    '| Rota | Página | Guard |',
    '|---|---|---|',
    tabelaRotas || '| _(nenhuma)_ | | |',
    doModulo.length > 40 ? `\n_(+${doModulo.length - 40} rotas — ver \`src/App.tsx\`)_` : '',
    '',
    `Hooks usados pelas páginas: ${hooks.length ? hooks.map((h) => `\`${h}\``).join(', ') : '_(nenhum detectado)_'}`,
    `Doc funcional: \`docs/MODULOS.md\` (seção ${mod.nome}).`,
  ].join('\n');
}

// ================================
// CLI
// ================================

function parseArgs(argv) {
  const out = { pos: [], modulo: null, saida: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--modulo' || argv[i] === '-m') out.modulo = argv[++i];
    else if (argv[i] === '--out' || argv[i] === '-o') out.saida = argv[++i];
    else out.pos.push(argv[i]);
  }
  return out;
}

function ajuda(templates, modulos) {
  console.log('Gerador de prompts — IDJUV Governa Hub\n');
  console.log('Uso: npm run prompt -- <tipo> [--modulo <codigo>] "<descrição curta>"\n');
  console.log('Tipos:');
  for (const t of templates) console.log(`  ${t.tipo.padEnd(18)} ${t.meta.descricao ?? ''}`);
  console.log(`  ${'pendencias'.padEnd(18)} Só o relatório automático de pendências (sem template)`);
  console.log('\nMódulos:');
  for (const m of modulos) console.log(`  ${m.codigo.padEnd(18)} ${m.nome}`);
  console.log('\nExemplo: npm run prompt -- tela --modulo rh "tela de afastamentos com filtro por período"');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const templates = listarTemplates();
  const modulos = lerModulos();
  const [tipo, ...resto] = args.pos;

  if (!tipo || tipo === 'ajuda' || tipo === '--help' || tipo === '-h') return ajuda(templates, modulos);

  const mod = args.modulo ? modulos.find((m) => m.codigo === args.modulo) : null;
  if (args.modulo && !mod) {
    console.error(`Módulo desconhecido: ${args.modulo}. Válidos: ${modulos.map((m) => m.codigo).join(', ')}`);
    process.exit(1);
  }
  const rotas = lerRotas();
  const relatorio = pendencias(modulos, rotas, lerRotasMenu(), mod?.codigo);

  let saida;
  if (tipo === 'pendencias') {
    saida = `## Pendências detectadas${mod ? ` — ${mod.nome}` : ''}\n\n${relatorio}\n`;
  } else {
    const t = templates.find((x) => x.tipo === tipo);
    if (!t) {
      console.error(`Tipo desconhecido: ${tipo}. Rode "npm run prompt" para ver a lista.`);
      process.exit(1);
    }
    const descricao =
      resto.join(' ').trim() || t.meta.descricao_padrao || '_(sem descrição — pergunte ao usuário o objetivo antes de começar)_';
    const valores = {
      descricao,
      modulo: mod ? `${mod.nome} (\`${mod.codigo}\`)` : '_(não informado)_',
      contexto_modulo: contextoModulo(mod, rotas),
      pendencias: relatorio,
      data: new Date().toISOString().slice(0, 10),
    };
    saida = t.corpo.replace(/\{\{(\w+)\}\}/g, (_, k) => valores[k] ?? `{{${k}}}`).trim() + '\n';
  }

  if (args.saida) {
    writeFileSync(args.saida, saida);
    console.error(`Prompt gravado em ${relative(process.cwd(), args.saida) || args.saida}`);
  } else {
    process.stdout.write(saida);
  }
}

main();

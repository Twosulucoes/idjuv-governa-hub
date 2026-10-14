#!/usr/bin/env node
/**
 * Compara fotografias de estrutura (scripts/db/fotografia-schema.sql) e escreve um relatório em markdown.
 *
 * Uso:
 *   node scripts/db/comparar-fotografias.mjs --replay r.tsv --baseline b.tsv [--producao p.tsv]
 *        [--historico h.txt] [--max 40] [--contagens c.md] [--aviso texto] > relatorio.md
 *
 * --contagens: grava à parte só números (por categoria e por comparação), sem nenhum nome de objeto,
 * para o resumo público do job no GitHub (o relatório completo vai cifrado).
 *
 * Com --producao: produção × replay das migrações (a pergunta "produção = migrações?") e, para cada
 * diferença, se produção bate com o baseline (correção que está só no baseline e não virou migração,
 * ou ajuste feito à mão no banco). Sem --producao: replay × baseline.
 * --historico: versões de supabase_migrations.schema_migrations da produção, uma por linha.
 */

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

/** tsv -> Map("categoria\tchave" -> valor) */
export function lerFotografia(texto) {
  const mapa = new Map();
  for (const linha of texto.split("\n")) {
    if (!linha.trim()) continue;
    const [categoria, chave, ...resto] = linha.split("\t");
    const k = `${categoria}\t${chave}`;
    // Chave repetida esconderia uma diferença (o último valor venceria): melhor falhar.
    if (mapa.has(k)) throw new Error(`chave repetida na fotografia: ${categoria} ${chave}`);
    mapa.set(k, resto.join("\t"));
  }
  return mapa;
}

/**
 * Forma comparável de um valor. O pg_dump reescreve expressões ao restaurar (ex.: `ARRAY['a'::varchar]::text[]`
 * vira `ARRAY[('a'::character varying)::text]`), então em constraint, policy e índice o nome de tipo depois de
 * `::` e o parêntese em volta de um literal, identificador ou ARRAY[...] simples são ignorados. Parêntese de precedência,
 * operadores e chamadas ficam: `a AND (b OR c)` continua diferente de `(a AND b) OR c`.
 * O relatório mostra o texto original.
 */
const CAST = /::(character varying|timestamp with time zone|timestamp without time zone|time with time zone|time without time zone|double precision|bit varying|"?[a-z_][a-z0-9_]*"?(\.[a-z_][a-z0-9_]*)?)(\[\])?/g;
const PARENTESE_SIMPLES = /\(('(?:[^']|'')*'|[a-z_][a-z0-9_.]*(?:\(\))?|-?\d+(?:\.\d+)?|ARRAY\[[^[\]()]*\])\)/g;
export function normalizar(chaveCompleta, valor) {
  if (valor === undefined) return valor;
  if (!/^(constraint|policy|indice)\t/.test(chaveCompleta)) return valor;
  let v = valor.replace(CAST, "");
  for (let antes = ""; antes !== v; ) {
    antes = v;
    v = v.replace(PARENTESE_SIMPLES, "$1");
  }
  return v.replace(/\s+/g, " ").trim();
}

export const iguais = (k, va, vb) => normalizar(k, va) === normalizar(k, vb);

/** Diferenças entre A e B: { soA, soB, diferentes } de chaves "categoria\tchave". */
export function diferencas(a, b) {
  const soA = [], soB = [], diferentes = [];
  for (const [k, v] of a) {
    if (!b.has(k)) soA.push(k);
    else if (!iguais(k, v, b.get(k))) diferentes.push(k);
  }
  for (const k of b.keys()) if (!a.has(k)) soB.push(k);
  return { soA: soA.sort(), soB: soB.sort(), diferentes: diferentes.sort() };
}

const categoria = (k) => k.split("\t")[0];
const chave = (k) => k.split("\t")[1];
const corta = (s, n = 160) => (s.length > n ? `${s.slice(0, n)}…` : s);
const codigo = (s) => "`" + corta(s).replace(/`/g, "'") + "`";

function porCategoria(chaves) {
  const g = new Map();
  for (const k of chaves) {
    const c = categoria(k);
    if (!g.has(c)) g.set(c, []);
    g.get(c).push(k);
  }
  return g;
}

function contagens(fotos) {
  const cats = new Set();
  for (const { mapa } of fotos) for (const k of mapa.keys()) cats.add(categoria(k));
  const linhas = [`| Categoria | ${fotos.map((f) => f.nome).join(" | ")} |`, `|---|${fotos.map(() => "---:").join("|")}|`];
  for (const c of [...cats].sort()) {
    linhas.push(`| ${c} | ${fotos.map((f) => [...f.mapa.keys()].filter((k) => categoria(k) === c).length).join(" | ")} |`);
  }
  return linhas.join("\n");
}

/**
 * Seção "A × B". `terceiro` (opcional): para cada diferença, diz se A bate com o terceiro banco.
 */
export function secao({ a, b, nomeA, nomeB, terceiro, nomeTerceiro, max = 40 }) {
  const d = diferencas(a, b);
  const out = [];
  const total = d.soA.length + d.soB.length + d.diferentes.length;
  out.push(`## ${nomeA} × ${nomeB}`, "");
  if (total === 0) {
    out.push(`Nenhuma diferença: ${nomeA} e ${nomeB} têm a mesma estrutura.`, "");
    return { texto: out.join("\n"), total };
  }
  out.push(
    `| | Quantidade |`,
    `|---|---:|`,
    `| Só em ${nomeA} | ${d.soA.length} |`,
    `| Só em ${nomeB} | ${d.soB.length} |`,
    `| Existem nos dois, mas diferentes | ${d.diferentes.length} |`,
    "",
  );
  const bateTerceiro = (k) => {
    if (!terceiro) return "";
    return terceiro.has(k) && iguais(k, a.get(k), terceiro.get(k)) ? ` (igual ao ${nomeTerceiro})` : "";
  };
  const bloco = (titulo, chaves, fmt) => {
    if (chaves.length === 0) return;
    out.push(`### ${titulo}`, "");
    for (const [c, ks] of porCategoria(chaves)) {
      out.push(`**${c}** (${ks.length})`, "");
      for (const k of ks.slice(0, max)) out.push(fmt(k));
      if (ks.length > max) out.push(`- … mais ${ks.length - max}`);
      out.push("");
    }
  };
  bloco(`Só em ${nomeA}`, d.soA, (k) => `- ${codigo(chave(k))}${bateTerceiro(k)}`);
  bloco(`Só em ${nomeB}`, d.soB, (k) => `- ${codigo(chave(k))}${terceiro && !terceiro.has(k) ? ` (também ausente do ${nomeTerceiro})` : ""}`);
  bloco("Diferentes", d.diferentes, (k) =>
    `- ${codigo(chave(k))}${bateTerceiro(k)}\n  - ${nomeA}: ${codigo(a.get(k))}\n  - ${nomeB}: ${codigo(b.get(k))}`,
  );
  if (terceiro) {
    const todas = [...d.soA, ...d.diferentes];
    const batem = todas.filter((k) => terceiro.has(k) && iguais(k, a.get(k), terceiro.get(k))).length;
    out.push(`De ${todas.length} objetos de ${nomeA} que não batem com ${nomeB}, ${batem} batem com o ${nomeTerceiro}.`, "");
  }
  return { texto: out.join("\n"), total };
}

/** Histórico: versões aplicadas na produção × arquivos de supabase/migrations. */
export function secaoHistorico(versoesProducao, arquivos) {
  const doRepo = new Set(arquivos.map((f) => f.slice(0, 14)));
  const daProd = new Set(versoesProducao.map((v) => v.trim()).filter(Boolean));
  const faltamNaProd = [...doRepo].filter((v) => !daProd.has(v)).sort();
  const soNaProd = [...daProd].filter((v) => !doRepo.has(v)).sort();
  const out = ["## Histórico de migrações", ""];
  out.push(`Arquivos no repositório: ${doRepo.size}. Versões registradas na produção: ${daProd.size}.`, "");
  out.push(`- No repositório e não registradas na produção: ${faltamNaProd.length}${faltamNaProd.length ? ` (${faltamNaProd.slice(0, 20).join(", ")}${faltamNaProd.length > 20 ? ", …" : ""})` : ""}`);
  out.push(`- Registradas na produção e sem arquivo no repositório: ${soNaProd.length}${soNaProd.length ? ` (${soNaProd.slice(0, 20).join(", ")}${soNaProd.length > 20 ? ", …" : ""})` : ""}`);
  out.push("");
  return out.join("\n");
}

function main() {
  const args = process.argv.slice(2);
  const arg = (n) => {
    const i = args.indexOf(n);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const max = Number(arg("--max") ?? 40);
  const replay = lerFotografia(readFileSync(arg("--replay"), "utf8"));
  const baseline = lerFotografia(readFileSync(arg("--baseline"), "utf8"));
  const caminhoProd = arg("--producao");
  const producao = caminhoProd ? lerFotografia(readFileSync(caminhoProd, "utf8")) : undefined;

  const out = ["# Fotografia da estrutura do banco", ""];
  const resumo = ["## Fotografia da estrutura do banco", ""];
  out.push(`Gerado em ${new Date().toISOString()}. Só estrutura (catálogo), nenhum dado de tabela.`, "");
  const aviso = arg("--aviso");
  if (aviso) {
    out.push(`> **Atenção:** ${aviso}`, "");
    resumo.push(`> **Atenção:** ${aviso}`, "");
  }
  const fotos = [{ nome: "migrações", mapa: replay }, { nome: "baseline", mapa: baseline }];
  if (producao) fotos.unshift({ nome: "produção", mapa: producao });
  out.push(contagens(fotos), "");
  resumo.push(contagens(fotos), "");
  const total = (nome, d) =>
    resumo.push(`- ${nome}: ${d.soA.length} só no primeiro, ${d.soB.length} só no segundo, ${d.diferentes.length} diferentes`);

  if (producao) {
    out.push(secao({ a: producao, b: replay, nomeA: "produção", nomeB: "migrações", terceiro: baseline, nomeTerceiro: "baseline", max }).texto);
    total("produção × migrações", diferencas(producao, replay));
    const historico = arg("--historico");
    if (historico) {
      const arquivos = readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql"));
      out.push(secaoHistorico(readFileSync(historico, "utf8").split("\n"), arquivos));
    }
  }
  out.push(secao({ a: baseline, b: replay, nomeA: "baseline", nomeB: "migrações", max }).texto);
  total("baseline × migrações", diferencas(baseline, replay));
  process.stdout.write(out.join("\n"));
  const caminhoContagens = arg("--contagens");
  if (caminhoContagens) writeFileSync(caminhoContagens, resumo.join("\n") + "\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

#!/usr/bin/env node
/**
 * Guard da onda E1 do RH: toda tabela do RH tem autoria gravada pelo banco e trilha de auditoria.
 *
 * Por que existe: a onda E1 (migração 20261011000000_rh_autoria_trilha.sql, spec
 * docs/superpowers/specs/2026-10-10-rh-trilha-auditoria-design.md) ligou, em cada tabela do RH, o trigger
 * `zz_fixar_autoria` (quem lançou e quem alterou, com o servidor responsável, gravados pelo banco) e o
 * `audit_<tabela>` (fn_audit_trigger: antes/depois na trilha). Tabela nova do RH que nasce sem os dois
 * volta a ter lançamento sem responsável — este guard reprova antes do merge.
 *
 * Regra, lida de supabase/baseline/rls/mapa.csv (linhas com `rh` em modulos) contra o schema do baseline
 * (supabase/baseline/schema/03_post_data.sql, gerado do replay das migrações):
 *   - classe `trilha` (históricos gravados por trigger): exige o trigger `trilha_imutavel` (UPDATE/DELETE recusados);
 *   - demais classes: exigem um trigger com `public.fixar_autoria(` E um com `public.fn_audit_trigger(`.
 * Exceções: scripts/autoria-rh-excecoes.txt, uma por linha no formato `tabela | motivo` (motivo obrigatório).
 * Exceção de tabela que não é do RH no mapa, repetida ou que já cumpre a regra também reprova (exceção obsoleta).
 *
 * Uso: node scripts/check-autoria-rh.mjs [caminho do 03_post_data.sql]
 *   (o argumento serve para provar que o guard reprova num schema antigo)
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const MAPA = resolve(ROOT, "supabase/baseline/rls/mapa.csv");
const SCHEMA = resolve(ROOT, process.argv[2] ?? "supabase/baseline/schema/03_post_data.sql");
const EXCECOES = resolve(ROOT, "scripts/autoria-rh-excecoes.txt");

/** CSV simples com aspas duplas (mesmo formato de scripts/db/gerar-rls.mjs). */
function linhaCsv(linha) {
  const campos = [];
  let atual = "";
  let aspas = false;
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];
    if (aspas) {
      if (c === '"' && linha[i + 1] === '"') { atual += '"'; i++; }
      else if (c === '"') aspas = false;
      else atual += c;
    } else if (c === '"') aspas = true;
    else if (c === ",") { campos.push(atual); atual = ""; }
    else atual += c;
  }
  campos.push(atual);
  return campos;
}

const linhas = readFileSync(MAPA, "utf8").split(/\r?\n/).filter((l) => l.trim() !== "");
const cab = linhaCsv(linhas[0]);
const iTabela = cab.indexOf("tabela");
const iModulos = cab.indexOf("modulos");
const iClasse = cab.indexOf("classe");
if (iTabela < 0 || iModulos < 0 || iClasse < 0) {
  console.error(`check-autoria-rh: cabeçalho inesperado em ${MAPA}`);
  process.exit(2);
}
const rh = new Map(); // tabela -> classe
for (const l of linhas.slice(1)) {
  const c = linhaCsv(l);
  if (c[iModulos].split("|").includes("rh")) rh.set(c[iTabela], c[iClasse]);
}

// CREATE TRIGGER <nome> <quando> ON public.<tabela> ... EXECUTE FUNCTION public.<função>(
const triggers = new Map(); // tabela -> Set(função)
const schema = readFileSync(SCHEMA, "utf8");
const re = /^CREATE TRIGGER \S+ .*? ON public\.([a-z0-9_]+) .*?EXECUTE FUNCTION public\.([a-z0-9_]+)\(/gm;
for (const m of schema.matchAll(re)) {
  if (!triggers.has(m[1])) triggers.set(m[1], new Set());
  triggers.get(m[1]).add(m[2]);
}

const falhas = [];
const excecoes = new Map();
for (const [n, bruta] of readFileSync(EXCECOES, "utf8").split(/\r?\n/).entries()) {
  const l = bruta.trim();
  if (l === "" || l.startsWith("#")) continue;
  const [tabela, ...resto] = l.split("|");
  const t = tabela.trim();
  const motivo = resto.join("|").trim();
  if (!motivo) falhas.push(`exceção sem motivo (${EXCECOES}:${n + 1}): ${t}`);
  else if (!rh.has(t)) falhas.push(`exceção de tabela que não é do RH no mapa.csv: ${t}`);
  else if (excecoes.has(t)) falhas.push(`exceção repetida: ${t}`);
  else excecoes.set(t, motivo);
}

function faltando(tabela, classe) {
  const f = triggers.get(tabela) ?? new Set();
  if (classe === "trilha") return f.has("trilha_imutavel") ? [] : ["trilha_imutavel"];
  return ["fixar_autoria", "fn_audit_trigger"].filter((fn) => !f.has(fn));
}

let ok = 0;
for (const [tabela, classe] of [...rh].sort()) {
  const falta = faltando(tabela, classe);
  if (excecoes.has(tabela)) {
    if (falta.length === 0) falhas.push(`exceção obsoleta: ${tabela} já tem os triggers (remova de scripts/autoria-rh-excecoes.txt)`);
    continue;
  }
  if (falta.length > 0) {
    falhas.push(`${tabela} [${classe}] sem trigger de ${falta.join(" e ")} no schema do baseline`);
  } else ok++;
}

if (falhas.length > 0) {
  console.error(`check-autoria-rh: ${falhas.length} problema(s) em ${rh.size} tabela(s) do RH:`);
  for (const f of falhas) console.error(`  - ${f}`);
  console.error(
    "Tabela nova do RH: ligue zz_fixar_autoria e audit_<tabela> na migração (ver 20261011000000_rh_autoria_trilha.sql),\n" +
      "regenere o baseline (scripts/db/gerar-baseline.sh) ou registre a exceção com motivo em scripts/autoria-rh-excecoes.txt.",
  );
  process.exit(1);
}
console.log(`OK: ${ok} tabela(s) do RH com autoria e trilha, ${excecoes.size} exceção(ões) com motivo.`);

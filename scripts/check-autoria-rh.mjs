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
 *   - demais classes: `zz_fixar_autoria` BEFORE INSERT OR UPDATE, FOR EACH ROW, sem WHEN, com public.fixar_autoria(...)
 *     E `audit_<tabela>` AFTER INSERT OR DELETE OR UPDATE (todas as colunas), FOR EACH ROW, sem WHEN, com
 *     public.fn_audit_trigger('rh'); E `zz_exigir_setor` BEFORE INSERT OR UPDATE OR DELETE, FOR EACH ROW, sem WHEN, com
 *     public.exigir_setor() (regra "só lança servidor do setor", migração 20261011020000_lancamento_por_setor.sql:
 *     anota ou recusa conforme regra_lancamento; a tabela também precisa estar em public.lancamento_modulos_tabela);
 *   - classe `trilha` (históricos gravados por trigger): `trilha_imutavel` BEFORE DELETE OR UPDATE por linha E
 *     `trilha_imutavel_truncate` BEFORE TRUNCATE por comando, ambos com public.trilha_imutavel e ENABLE ALWAYS;
 *   - em qualquer classe: nenhum desses triggers desligado (ALTER TABLE ... DISABLE TRIGGER, inclusive ALL/USER, ou
 *     ENABLE REPLICA TRIGGER, que só dispara em modo réplica).
 * Arquivos do RH no Storage (onda E2, migração 20261011000200_rh_trilha_consulta.sql): supabase/baseline/overlay/50_storage.sql
 * cria trilha_rh_storage_{insert,update,delete} (AFTER, por linha, WHEN nos buckets frequencias e documentos-requerimento,
 * public.trilha_storage('rh')), sem desligar, e 01_pre_data.sql define public.trilha_storage() (só sem argumento).
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

// CREATE TRIGGER <nome> <BEFORE|AFTER> <eventos> ON public.<tabela> FOR EACH <ROW|STATEMENT> [WHEN (...)]
//   EXECUTE FUNCTION public.<função>(<argumentos>);   (uma linha por trigger no pg_dump)
const triggers = new Map(); // tabela -> Map(nome -> {momento, eventos, nivel, quando, funcao, args})
const schema = readFileSync(SCHEMA, "utf8");
const re =
  /^CREATE TRIGGER (\S+) (BEFORE|AFTER|INSTEAD OF) (.+?) ON public\.([a-z0-9_]+) (?:.*? )?FOR EACH (ROW|STATEMENT) (?:WHEN \((.*)\) )?EXECUTE FUNCTION public\.([a-z0-9_]+)\((.*)\);$/gm;
for (const m of schema.matchAll(re)) {
  const [, nome, momento, eventos, tabela, nivel, quando, funcao, args] = m;
  if (!triggers.has(tabela)) triggers.set(tabela, new Map());
  triggers.get(tabela).set(nome, {
    momento,
    eventos: eventos.split(" OR ").sort().join(" OR "), // "UPDATE OF col" fica diferente de "UPDATE" (restrito)
    nivel,
    quando: quando ?? null,
    funcao,
    args,
  });
}
// ALTER TABLE [ONLY] public.<tabela> DISABLE TRIGGER <nome|ALL|USER> / ENABLE REPLICA TRIGGER <nome>
const desligados = new Map(); // tabela -> Set(nome)
const reDes = /^ALTER TABLE (?:ONLY )?public\.([a-z0-9_]+) (?:DISABLE|ENABLE REPLICA) TRIGGER (\S+);$/gm;
for (const m of schema.matchAll(reDes)) {
  if (!desligados.has(m[1])) desligados.set(m[1], new Set());
  desligados.get(m[1]).add(m[2]);
}
const sempre = new Set(); // "tabela.trigger" com ENABLE ALWAYS
for (const m of schema.matchAll(/^ALTER TABLE (?:ONLY )?public\.([a-z0-9_]+) ENABLE ALWAYS TRIGGER (\S+);$/gm)) {
  sempre.add(`${m[1]}.${m[2]}`);
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

/** Exigências por classe: nome do trigger, momento, eventos, nível, função, argumentos (null = qualquer), ALWAYS. */
function exigidos(tabela, classe) {
  if (classe === "trilha") {
    return [
      { nome: "trilha_imutavel", momento: "BEFORE", eventos: "DELETE OR UPDATE", nivel: "ROW", funcao: "trilha_imutavel", args: null, sempre: true },
      { nome: "trilha_imutavel_truncate", momento: "BEFORE", eventos: "TRUNCATE", nivel: "STATEMENT", funcao: "trilha_imutavel", args: "", sempre: true },
    ];
  }
  return [
    { nome: "zz_fixar_autoria", momento: "BEFORE", eventos: "INSERT OR UPDATE", nivel: "ROW", funcao: "fixar_autoria", args: null, sempre: false },
    { nome: `audit_${tabela}`, momento: "AFTER", eventos: "DELETE OR INSERT OR UPDATE", nivel: "ROW", funcao: "fn_audit_trigger", args: "'rh'", sempre: false },
    { nome: "zz_exigir_setor", momento: "BEFORE", eventos: "DELETE OR INSERT OR UPDATE", nivel: "ROW", funcao: "exigir_setor", args: "", sempre: false },
  ];
}

function faltando(tabela, classe) {
  const t = triggers.get(tabela) ?? new Map();
  const des = desligados.get(tabela) ?? new Set();
  const problemas = [];
  for (const e of exigidos(tabela, classe)) {
    const g = t.get(e.nome);
    const desc = `${e.nome} (${e.momento} ${e.eventos} FOR EACH ${e.nivel}, ${e.funcao}${e.args === null ? "(...)" : `(${e.args})`})`;
    if (!g) problemas.push(`${desc} ausente`);
    else if (g.momento !== e.momento || g.eventos !== e.eventos || g.nivel !== e.nivel || g.funcao !== e.funcao
             || (e.args !== null && g.args !== e.args) || g.quando !== null) {
      problemas.push(`${desc} diferente no schema: ${g.momento} ${g.eventos} FOR EACH ${g.nivel}${g.quando ? ` WHEN (${g.quando})` : ""} ${g.funcao}(${g.args})`);
    }
    if (des.has(e.nome) || des.has("ALL") || des.has("USER")) problemas.push(`${e.nome} desligado (DISABLE/ENABLE REPLICA TRIGGER)`);
    if (e.sempre && !sempre.has(`${tabela}.${e.nome}`)) problemas.push(`${e.nome} sem ENABLE ALWAYS`);
  }
  return problemas;
}

let ok = 0;
for (const [tabela, classe] of [...rh].sort()) {
  const falta = faltando(tabela, classe);
  if (excecoes.has(tabela)) {
    if (falta.length === 0) falhas.push(`exceção obsoleta: ${tabela} já tem os triggers (remova de scripts/autoria-rh-excecoes.txt)`);
    continue;
  }
  if (falta.length > 0) {
    falhas.push(`${tabela} [${classe}]: ${falta.join("; ")}`);
  } else ok++;
}

// Trilha dos arquivos do RH no Storage (onda E2, migração 20261011000200_rh_trilha_consulta.sql): o dump do baseline só
// leva o schema public, então os triggers de storage.objects vivem no overlay/50 e a função no 01_pre_data. Só vale para
// o baseline padrão (com outro 03_post_data no argumento, a prova é das tabelas).
if (!process.argv[2]) {
  const overlay = readFileSync(resolve(ROOT, "supabase/baseline/overlay/50_storage.sql"), "utf8");
  const pre = readFileSync(resolve(ROOT, "supabase/baseline/schema/01_pre_data.sql"), "utf8");
  if (!/^CREATE FUNCTION public\.trilha_storage\(\) RETURNS trigger$/m.test(pre)) {
    falhas.push("storage: public.trilha_storage() ausente em supabase/baseline/schema/01_pre_data.sql");
  }
  for (const [evento, quando] of [["insert", "NEW"], ["update", "OLD"], ["delete", "OLD"]]) {
    const re = new RegExp(
      `CREATE OR REPLACE TRIGGER trilha_rh_storage_${evento} AFTER ${evento.toUpperCase()} ON storage\\.objects\\s+` +
        `FOR EACH ROW WHEN \\(${quando}\\.bucket_id IN \\('frequencias', 'documentos-requerimento'\\)[^;]*?` +
        `EXECUTE FUNCTION public\\.trilha_storage\\('rh'\\);`,
    );
    if (!re.test(overlay)) {
      falhas.push(`storage: trilha_rh_storage_${evento} (AFTER ${evento.toUpperCase()} em storage.objects, frequencias e documentos-requerimento, trilha_storage('rh')) ausente ou diferente em supabase/baseline/overlay/50_storage.sql`);
    }
  }
  if (/(DISABLE|ENABLE REPLICA) TRIGGER (trilha_rh_storage_|ALL|USER)/.test(overlay)) {
    falhas.push("storage: trigger da trilha dos arquivos do RH desligado em supabase/baseline/overlay/50_storage.sql");
  }
}

if (falhas.length > 0) {
  console.error(`check-autoria-rh: ${falhas.length} problema(s) em ${rh.size} tabela(s) do RH:`);
  for (const f of falhas) console.error(`  - ${f}`);
  console.error(
    "Tabela nova do RH: ligue zz_fixar_autoria, audit_<tabela> e zz_exigir_setor na migração (ver 20261011000000_rh_autoria_trilha.sql\n" +
      "e 20261011020000_lancamento_por_setor.sql; inclua a tabela em public.lancamento_modulos_tabela),\n" +
      "regenere o baseline (scripts/db/gerar-baseline.sh) ou registre a exceção com motivo em scripts/autoria-rh-excecoes.txt.",
  );
  process.exit(1);
}
console.log(
  `OK: ${ok} tabela(s) do RH com autoria, trilha e regra de setor, ${excecoes.size} exceção(ões) com motivo` +
    (process.argv[2] ? "." : "; trilha dos arquivos do RH no Storage ligada no overlay/50."),
);

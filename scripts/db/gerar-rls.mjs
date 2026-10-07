#!/usr/bin/env node
/**
 * Gera as policies de RLS do baseline a partir do mapa tabela -> módulo.
 *
 *   entrada : supabase/baseline/rls/mapa.csv   (fonte da verdade, revisada por pessoas)
 *   saída   : supabase/baseline/rls/35_policies_geradas.sql   (NÃO edite à mão)
 *
 * Uso:  node scripts/db/gerar-rls.mjs            -> reescreve o SQL
 *       node scripts/db/gerar-rls.mjs --check    -> falha (exit 1) se o SQL estiver defasado
 *
 * Classes (todas as policies valem para `authenticated`; `anon` nunca recebe policy aqui):
 *   modulo           SELECT/INSERT/UPDATE/DELETE exigem can_access_module(auth.uid(), <módulo>)
 *                    (vários módulos separados por | = OU). can_access_module já exige perfil
 *                    ativo e dá passagem ao papel admin.
 *   catalogo         SELECT para qualquer usuário ativo (is_active_user()); escrita por módulo.
 *   proprio_leitura  módulo OU o próprio servidor (servidor_id = meu_servidor_id()) lê; escrita por módulo.
 *   proprio          idem, e o próprio servidor também pode INSERIR (pedidos/requerimentos).
 *   proprio_filho    como proprio_leitura, mas a posse vem da tabela pai: extra=pai=<tabela>.<fk>;
 *                    com `;insere` o servidor também pode INSERIR registros ligados a pai seu.
 *   admin            só o papel admin (is_admin_user(auth.uid())).
 *   preservar        nada é gerado (as policies existentes são o desenho); só remover_policies.
 *   fechada          nada é gerado: RLS ligado e sem policy = negado a todos (exceto service_role).
 *
 * remover_policies (qualquer classe): nomes separados por | que recebem DROP POLICY IF EXISTS.
 * anon (select|insert|vazio): acesso ANÔNIMO intencional já existente (formulários/portal). Não gera policy;
 *   é a declaração que overlay/40_privilegios.sql e scripts/db/testar-rls.sql conferem entre si.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const ENTRADA = resolve(raiz, "supabase/baseline/rls/mapa.csv");
const SAIDA = resolve(raiz, "supabase/baseline/rls/35_policies_geradas.sql");
const CLASSES = new Set([
  "modulo", "catalogo", "proprio_leitura", "proprio", "proprio_filho", "admin", "preservar", "fechada",
]);
const MODULOS = new Set([
  "rh", "financeiro", "compras", "patrimonio", "contratos", "workflow", "governanca", "transparencia",
  "comunicacao", "programas", "gestores_escolares", "integridade", "admin", "federacoes", "organizacoes",
  "gabinete", "patrimonio_mobile", "arbitros",
]); // enum app_module

// CSV mínimo com aspas (RFC 4180 simplificado: "" escapa aspas).
function lerCsv(texto) {
  const linhas = [];
  let campo = "", linha = [], aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === ",") { linha.push(campo); campo = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      linha.push(campo); campo = "";
      if (linha.length > 1 || linha[0] !== "") linhas.push(linha);
      linha = [];
    } else campo += c;
  }
  if (campo !== "" || linha.length) { linha.push(campo); linhas.push(linha); }
  return linhas;
}

const [cab, ...dados] = lerCsv(readFileSync(ENTRADA, "utf8"));
const idx = Object.fromEntries(cab.map((n, i) => [n, i]));
for (const col of ["tabela", "modulos", "classe", "confianca", "nota", "extra", "remover_policies", "anon"]) {
  if (!(col in idx)) { console.error(`mapa.csv sem a coluna ${col}`); process.exit(2); }
}

const q = (s) => `'${s.replace(/'/g, "''")}'`;
const id = (s) => `"${s.replace(/"/g, '""')}"`;
const erros = [];
const blocos = [];

for (const r of dados) {
  const t = r[idx.tabela].trim();
  const classe = r[idx.classe].trim();
  const mods = r[idx.modulos].split("|").map((m) => m.trim()).filter(Boolean);
  const extra = r[idx.extra].trim();
  const remover = r[idx.remover_policies].split("|").map((m) => m.trim()).filter(Boolean);
  const anon = r[idx.anon].trim();
  if (!['', 'select', 'insert'].includes(anon)) erros.push(`${t}: anon deve ser vazio, select ou insert`);

  if (!/^[a-z_][a-z0-9_]*$/.test(t)) { erros.push(`${t}: nome de tabela inválido`); continue; }
  if (!CLASSES.has(classe)) { erros.push(`${t}: classe desconhecida "${classe}"`); continue; }
  for (const m of mods) if (!MODULOS.has(m)) erros.push(`${t}: módulo "${m}" não existe em app_module`);
  if (["modulo", "catalogo", "proprio_leitura", "proprio", "proprio_filho"].includes(classe) && mods.length === 0)
    erros.push(`${t}: classe ${classe} exige ao menos um módulo`);

  const L = [`-- ${t}  [${classe}${mods.length ? ": " + mods.join(" | ") : ""}]`];
  for (const p of remover) L.push(`DROP POLICY IF EXISTS ${id(p)} ON public.${t};`);

  const M = mods.length
    ? "(" + mods.map((m) => `public.can_access_module(auth.uid(), ${q(m)})`).join(" OR ") + ")"
    : "";
  const politica = (nome, cmd, using, check) => {
    L.push(`DROP POLICY IF EXISTS ${id(nome)} ON public.${t};`);
    const partes = [`CREATE POLICY ${id(nome)} ON public.${t} FOR ${cmd} TO authenticated`];
    if (using) partes.push(`  USING (${using})`);
    if (check) partes.push(`  WITH CHECK (${check})`);
    L.push(partes.join("\n") + ";");
  };
  const escritaPorModulo = () => {
    politica("rls_insert", "INSERT", null, M);
    politica("rls_update", "UPDATE", M, M);
    politica("rls_delete", "DELETE", M, null);
  };

  switch (classe) {
    case "modulo":
      politica("rls_select", "SELECT", M, null);
      escritaPorModulo();
      break;
    case "catalogo":
      politica("rls_select", "SELECT", "public.is_active_user()", null);
      escritaPorModulo();
      break;
    case "proprio_leitura":
      politica("rls_select", "SELECT", `${M} OR servidor_id = public.meu_servidor_id()`, null);
      escritaPorModulo();
      break;
    case "proprio":
      politica("rls_select", "SELECT", `${M} OR servidor_id = public.meu_servidor_id()`, null);
      politica("rls_insert", "INSERT", null, `${M} OR servidor_id = public.meu_servidor_id()`);
      politica("rls_update", "UPDATE", M, M);
      politica("rls_delete", "DELETE", M, null);
      break;
    case "proprio_filho": {
      const m = /^pai=([a-z_][a-z0-9_]*)\.([a-z_][a-z0-9_]*)(;insere)?$/.exec(extra);
      if (!m) { erros.push(`${t}: extra deve ser pai=<tabela_pai>.<coluna_fk>[;insere]`); break; }
      const [, pai, fk, insere] = m;
      // A tabela pai precisa ter servidor_id; p.id é a chave referenciada por <coluna_fk>.
      const doServidor = (ref) =>
        `EXISTS (SELECT 1 FROM public.${pai} p WHERE p.id = ${ref} AND p.servidor_id = public.meu_servidor_id())`;
      politica("rls_select", "SELECT", `${M} OR ${doServidor(`${t}.${fk}`)}`, null);
      if (insere) politica("rls_insert", "INSERT", null, `${M} OR ${doServidor(fk)}`);
      else politica("rls_insert", "INSERT", null, M);
      politica("rls_update", "UPDATE", M, M);
      politica("rls_delete", "DELETE", M, null);
      break;
    }
    case "admin": {
      const A = "public.is_admin_user(auth.uid())";
      politica("rls_select", "SELECT", A, null);
      politica("rls_insert", "INSERT", null, A);
      politica("rls_update", "UPDATE", A, A);
      politica("rls_delete", "DELETE", A, null);
      break;
    }
    default: // preservar, fechada
      if (remover.length === 0) L.push(`-- (nenhuma policy gerada)`);
  }
  blocos.push(L.join("\n"));
}

if (erros.length) {
  console.error("Erros no mapa:\n" + erros.map((e) => "  - " + e).join("\n"));
  process.exit(2);
}

const cabecalho = `-- GERADO por scripts/db/gerar-rls.mjs a partir de supabase/baseline/rls/mapa.csv.
-- NÃO edite à mão: altere o mapa e rode \`node scripts/db/gerar-rls.mjs\`.
--
-- Depende de: overlay/10_funcoes_acesso.sql (can_access_module, is_active_user,
-- is_admin_user, meu_servidor_id corrigidos) e de overlay/30_remover_acesso_total.sql
-- (remove as policies acesso_total_* antes de estas entrarem).
-- Todas as policies são TO authenticated; nenhuma concede acesso a anon.
`;
const sql = cabecalho + "\n" + blocos.join("\n\n") + "\n";

if (process.argv.includes("--check")) {
  let atual = "";
  try { atual = readFileSync(SAIDA, "utf8"); } catch { /* ausente */ }
  if (atual !== sql) {
    console.error("35_policies_geradas.sql está defasado: rode `node scripts/db/gerar-rls.mjs`");
    process.exit(1);
  }
  console.log(`OK: ${blocos.length} tabelas, SQL em dia com o mapa.`);
} else {
  writeFileSync(SAIDA, sql);
  console.log(`gerado: ${SAIDA.replace(raiz + "/", "")} (${blocos.length} tabelas, ${sql.split("\n").length} linhas)`);
}

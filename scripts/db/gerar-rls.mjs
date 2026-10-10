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
 *                    extra opcional (sufixos separados por ;, em qualquer ordem, cada um no máximo uma vez):
 *                    `coluna=<col>` = coluna de posse quando não é servidor_id (em servidores é `id`);
 *                    `excluir=<código>|admin` = DELETE só com o módulo E o código (ou só o papel admin).
 *   proprio          idem, e o próprio servidor também pode INSERIR (pedidos/requerimentos).
 *   proprio_filho    como proprio_leitura, mas a posse vem da tabela pai: extra=pai=<tabela>.<fk>;
 *                    com `;insere` o servidor também pode INSERIR registros ligados a pai seu.
 *   permissao        leitura por módulo (como modulo); ESCRITA exige o módulo E a permissão granular:
 *                    extra=escrita=<código>[;proprio|;pai=<tabela>.<fk>|;filho=<tabela>.<fk>]. INSERT/UPDATE/
 *                    DELETE exigem can_access_module(<módulos>) AND has_permission_code(auth.uid(), '<código>')
 *                    (a permissão avulsa em user_permissions não basta sem o módulo; o papel admin passa pelos
 *                    dois). O sufixo muda só o SELECT: `;proprio` = o próprio servidor também lê (servidor_id =
 *                    meu_servidor_id(), como proprio_leitura); `;pai=` = posse pela tabela pai (como
 *                    proprio_filho); `;filho=` = posse derivada de uma tabela filha com servidor_id
 *                    (ex.: o servidor lê a folha em que tem ficha). Ex.: folha (financeiro.folha.processar|configurar).
 *                    Formato completo: extra=escrita=<c1>[|<c2>...][;<sufixo>]... — `escrita=` vem SEMPRE primeiro; os
 *                    sufixos vêm em qualquer ordem, cada um no máximo uma vez (a saída não depende da ordem):
 *                      escrita=a|b|c       lista de códigos, qualquer um basta: (<módulos>) AND (has_permission_code(a)
 *                                          OR ...); com um só código a saída é a de sempre (... AND has_permission_code(a))
 *                      ;proprio | ;pai=<tabela>.<fk> | ;filho=<tabela>.<fk>   posse (no máximo uma; ver acima)
 *                      ;coluna=<col>       coluna de posse de ;proprio quando não é servidor_id
 *                      ;excluir=<código>   DELETE com (<módulos>) AND has_permission_code(<código>) em vez da escrita
 *                      ;excluir=admin      DELETE só do papel admin (is_admin_user(auth.uid()))
 *                      ;insere_proprio     INSERT também quando a linha é do servidor logado (<col> = meu_servidor_id(),
 *                                          ou o pai é dele com ;pai=), como a classe proprio — exige ;proprio ou ;pai=
 *                      ;sem_autoaprovacao  INSERT/UPDATE/DELETE pelo caminho da permissão (e o DELETE de ;excluir=<código>)
 *                                          exigem ainda que a linha NÃO seja do usuário logado:
 *                                          (is_admin_user(auth.uid()) OR NOT eh_meu_servidor(<posse>)); eh_meu_servidor é
 *                                          verdadeira quando <posse> = meu_servidor_id() ou, se o perfil não tem vínculo,
 *                                          quando o CPF do perfil é o do servidor (aprovador sem vínculo não aprova o
 *                                          próprio pedido). A posse vem do pai com ;pai=; o papel admin passa. O pedido
 *                                          próprio (;insere_proprio) continua entrando pelo caminho da posse (os campos de
 *                                          decisão são zerados pelo trigger forcar_campos_iniciais). Exige ;proprio ou ;pai=.
 *                      ;posse=usuario      a coluna de posse (ou o servidor_id do pai, com ;pai=) guarda o id do USUÁRIO
 *                                          (FK para profiles(id), ex.: banco_horas, solicitacoes_ajuste_ponto), não o do
 *                                          servidor: a leitura e a inserção próprias usam (<col> = auth.uid() AND
 *                                          is_active_user()) e ;sem_autoaprovacao usa (is_admin_user(auth.uid()) OR <posse>
 *                                          IS DISTINCT FROM auth.uid()). Exige ;proprio ou ;pai=. Declare-o sempre que a FK
 *                                          da coluna de posse apontar para profiles: scripts/db/testar-rls.sql confere.
 *   catalogo_admin   SELECT para qualquer usuário ativo; escrita só do papel admin (catálogos de permissão,
 *                    configuração de módulos, dados oficiais: o app os lê no login/rodapé, mas só admin altera).
 *   proprio_user     dado de configuração por usuário: extra=coluna=<col_do_usuario>; o próprio usuário (ativo)
 *                    lê as suas linhas, admin lê todas; escrita só do papel admin.
 *   trilha           trilha de auditoria/histórico: SELECT por módulo; NINGUÉM escreve por API (os registros
 *                    nascem em triggers SECURITY DEFINER e na service role).
 *   admin            só o papel admin (is_admin_user(auth.uid())).
 *   admin_leitura    SELECT só do papel admin; ninguém escreve por API (ex.: audit_logs).
 *   publico_admin    SELECT para anon e authenticated (configuração do portal público); escrita só do papel admin.
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
  "modulo", "catalogo", "catalogo_admin", "proprio_leitura", "proprio", "proprio_filho", "proprio_user",
  "permissao", "trilha", "admin", "admin_leitura", "publico_admin", "preservar", "fechada",
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
const COLUNAS = ["tabela", "modulos", "classe", "confianca", "nota", "extra", "remover_policies", "anon"];
// scripts/db/testar-rls.sql lê o CSV por POSIÇÃO (\copy): a ordem das colunas é contrato.
if (cab.join(",") !== COLUNAS.join(",")) { console.error(`mapa.csv: cabeçalho deve ser exatamente ${COLUNAS.join(",")}`); process.exit(2); }
const idx = Object.fromEntries(cab.map((n, i) => [n, i]));
for (const col of ["tabela", "modulos", "classe", "confianca", "nota", "extra", "remover_policies", "anon"]) {
  if (!(col in idx)) { console.error(`mapa.csv sem a coluna ${col}`); process.exit(2); }
}

const q = (s) => `'${s.replace(/'/g, "''")}'`;
const id = (s) => `"${s.replace(/"/g, '""')}"`;
const erros = [];

// Código de permissão: segmentos minúsculos separados por ponto (ex.: financeiro.folha.processar).
const RE_CODIGO = /^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/;
const RE_REF = /^([a-z_][a-z0-9_]*)\.([a-z_][a-z0-9_]*)$/;   // <tabela>.<coluna>
const RE_COL = /^[a-z_][a-z0-9_]*$/;

// Lê os sufixos `;chave[=valor]` (ordem livre, sem repetição). `aceitos` = chaves permitidas na classe.
// Devolve o objeto de opções ou null (com o erro registrado). As mensagens citam o sufixo sem o ";": em
// proprio_leitura o primeiro item do extra não tem ";" na frente.
function lerSufixos(t, partes, aceitos) {
  const op = {};
  for (const p of partes) {
    const [chave, ...resto] = p.split("=");
    const valor = resto.join("=");
    if (!aceitos.includes(chave)) { erros.push(`${t}: sufixo desconhecido "${p}" (aceitos: ${aceitos.join(", ")})`); return null; }
    if (chave in op) { erros.push(`${t}: sufixo "${chave}" repetido`); return null; }
    const semValor = ["proprio", "insere_proprio", "sem_autoaprovacao"].includes(chave);
    if (semValor && resto.length) { erros.push(`${t}: "${chave}" não leva valor`); return null; }
    if (semValor) { op[chave] = true; continue; }
    if ((chave === "pai" || chave === "filho") && !RE_REF.test(valor)) { erros.push(`${t}: "${chave}=" deve ser <tabela>.<coluna_fk>`); return null; }
    if (chave === "coluna" && !RE_COL.test(valor)) { erros.push(`${t}: "coluna=" deve ser o nome de uma coluna`); return null; }
    if (chave === "excluir" && valor !== "admin" && !RE_CODIGO.test(valor)) { erros.push(`${t}: "excluir=" deve ser um código de permissão ou admin`); return null; }
    if (chave === "posse" && valor !== "usuario") { erros.push(`${t}: "posse=" só aceita usuario`); return null; }
    op[chave] = valor;
  }
  return op;
}
const blocos = [];
const vistas = new Set();

for (const r of dados) {
  const t = r[idx.tabela].trim();
  const classe = r[idx.classe].trim();
  const mods = r[idx.modulos].split("|").map((m) => m.trim()).filter(Boolean);
  const extra = r[idx.extra].trim();
  const remover = r[idx.remover_policies].split("|").map((m) => m.trim()).filter(Boolean);
  const anon = r[idx.anon].trim();
  if (!['', 'select', 'insert'].includes(anon)) erros.push(`${t}: anon deve ser vazio, select ou insert`);

  if (!/^[a-z_][a-z0-9_]*$/.test(t)) { erros.push(`${t}: nome de tabela inválido`); continue; }
  if (vistas.has(t)) { erros.push(`${t}: tabela repetida no mapa`); continue; }
  vistas.add(t);
  if (!CLASSES.has(classe)) { erros.push(`${t}: classe desconhecida "${classe}"`); continue; }
  for (const m of mods) if (!MODULOS.has(m)) erros.push(`${t}: módulo "${m}" não existe em app_module`);
  if (["modulo", "catalogo", "proprio_leitura", "proprio", "proprio_filho", "permissao", "trilha"].includes(classe) && mods.length === 0)
    erros.push(`${t}: classe ${classe} exige ao menos um módulo`);

  const L = [`-- ${t}  [${classe}${mods.length ? ": " + mods.join(" | ") : ""}]`];
  for (const p of remover) L.push(`DROP POLICY IF EXISTS ${id(p)} ON public.${t};`);

  const M = mods.length
    ? "(" + mods.map((m) => `public.can_access_module(auth.uid(), ${q(m)})`).join(" OR ") + ")"
    : "";
  // Posse pelo servidor logado via outra tabela (que precisa ter servidor_id):
  //   doServidor(pai, ref)   -> a linha referencia (ref = <tabela>.<fk>) um pai do próprio servidor
  //   filhoDoServidor(filha, fk) -> existe uma filha do próprio servidor apontando (filha.fk) para <tabela>.id
  const doServidor = (pai, ref) =>
    `EXISTS (SELECT 1 FROM public.${pai} p WHERE p.id = ${ref} AND p.servidor_id = public.meu_servidor_id())`;
  const filhoDoServidor = (filha, fk) =>
    `EXISTS (SELECT 1 FROM public.${filha} f WHERE f.${fk} = ${t}.id AND f.servidor_id = public.meu_servidor_id())`;
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
    case "proprio_leitura": {
      // extra vazio = forma de sempre (servidor_id; DELETE por módulo)
      const op = extra === "" ? {} : lerSufixos(t, extra.split(";"), ["coluna", "excluir"]);
      if (!op) break;
      const col = op.coluna || "servidor_id";
      politica("rls_select", "SELECT", `${M} OR ${col} = public.meu_servidor_id()`, null);
      politica("rls_insert", "INSERT", null, M);
      politica("rls_update", "UPDATE", M, M);
      if (op.excluir === "admin") politica("rls_delete", "DELETE", "public.is_admin_user(auth.uid())", null);
      else if (op.excluir) politica("rls_delete", "DELETE", `${M} AND public.has_permission_code(auth.uid(), ${q(op.excluir)})`, null);
      else politica("rls_delete", "DELETE", M, null);
      break;
    }
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
      politica("rls_select", "SELECT", `${M} OR ${doServidor(pai, `${t}.${fk}`)}`, null);
      if (insere) politica("rls_insert", "INSERT", null, `${M} OR ${doServidor(pai, `${t}.${fk}`)}`);
      else politica("rls_insert", "INSERT", null, M);
      politica("rls_update", "UPDATE", M, M);
      politica("rls_delete", "DELETE", M, null);
      break;
    }
    case "permissao": {
      const [primeiro, ...sufixos] = extra.split(";");
      const me = /^escrita=(.+)$/.exec(primeiro);
      const codigos = me ? me[1].split("|") : [];
      if (!me || codigos.some((c) => !RE_CODIGO.test(c))) {
        erros.push(`${t}: extra deve começar por escrita=<código>[|<código>...] (ex.: escrita=rh.aprovar|rh.frequencia.lancar;proprio)`);
        break;
      }
      if (new Set(codigos).size !== codigos.length) { erros.push(`${t}: código repetido em escrita=`); break; }
      const op = lerSufixos(t, sufixos, ["proprio", "pai", "filho", "coluna", "excluir", "insere_proprio", "sem_autoaprovacao", "posse"]);
      if (!op) break;
      if (["proprio", "pai", "filho"].filter((k) => k in op).length > 1) { erros.push(`${t}: use só uma posse (;proprio, ;pai= ou ;filho=)`); break; }
      if (op.coluna && !op.proprio) { erros.push(`${t}: ;coluna= só vale com ;proprio`); break; }
      if ((op.insere_proprio || op.sem_autoaprovacao || op.posse) && !op.proprio && !op.pai) {
        erros.push(`${t}: ;insere_proprio, ;sem_autoaprovacao e ;posse= exigem a posse ;proprio ou ;pai=`);
        break;
      }
      const [, pai, fk] = op.pai ? RE_REF.exec(op.pai) : [];
      const [, filha, fkFilha] = op.filho ? RE_REF.exec(op.filho) : [];
      const col = op.coluna || "servidor_id";
      const hp = (c) => `public.has_permission_code(auth.uid(), ${q(c)})`;
      // Escrita: módulo E permissão (a permissão sozinha, avulsa em user_permissions, não escreve sem o módulo).
      const P = codigos.length === 1 ? `${M} AND ${hp(codigos[0])}` : `${M} AND (${codigos.map(hp).join(" OR ")})`;
      // Posse da linha: a coluna (;proprio) ou o servidor do pai (;pai=). Com ;posse=usuario a coluna guarda o
      // id do USUÁRIO (FK para profiles(id)), não o do servidor: compara com auth.uid() (perfil ativo exigido, como
      // meu_servidor_id() faz).
      const porUsuario = op.posse === "usuario";
      const ehMeu = (expr) => porUsuario ? `(${expr} = auth.uid() AND public.is_active_user())` : `${expr} = public.meu_servidor_id()`;
      const deMim = op.proprio ? ehMeu(col)
        : pai ? `EXISTS (SELECT 1 FROM public.${pai} p WHERE p.id = ${t}.${fk} AND ${ehMeu("p.servidor_id")})` : null;
      const posse = op.proprio ? col : pai ? `(SELECT p.servidor_id FROM public.${pai} p WHERE p.id = ${t}.${fk})` : null;
      // ;sem_autoaprovacao: quem decide pela permissão não decide sobre a própria linha (o admin passa). Posse por
      // servidor: eh_meu_servidor() (o vínculo do perfil ou, sem vínculo, o CPF do perfil igual ao do servidor).
      const naoEMinha = porUsuario
        ? `(public.is_admin_user(auth.uid()) OR ${posse} IS DISTINCT FROM auth.uid())`
        : `(public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(${posse}))`;
      const PE = op.sem_autoaprovacao ? `${P} AND ${naoEMinha}` : P;
      let leitura = M;
      if (deMim) leitura = `${M} OR ${deMim}`;
      else if (filha) leitura = `${M} OR ${filhoDoServidor(filha, fkFilha)}`;
      let exclusao = PE;
      if (op.excluir === "admin") exclusao = "public.is_admin_user(auth.uid())";
      else if (op.excluir) exclusao = `${M} AND ${hp(op.excluir)}` + (op.sem_autoaprovacao ? ` AND ${naoEMinha}` : "");
      politica("rls_select", "SELECT", leitura, null);
      politica("rls_insert", "INSERT", null, op.insere_proprio ? `(${PE}) OR ${deMim}` : PE);
      politica("rls_update", "UPDATE", PE, PE);
      politica("rls_delete", "DELETE", exclusao, null);
      break;
    }
    case "catalogo_admin": {
      const A = "public.is_admin_user(auth.uid())";
      politica("rls_select", "SELECT", "public.is_active_user()", null);
      politica("rls_insert", "INSERT", null, A);
      politica("rls_update", "UPDATE", A, A);
      politica("rls_delete", "DELETE", A, null);
      break;
    }
    case "proprio_user": {
      const m = /^coluna=([a-z_][a-z0-9_]*)$/.exec(extra);
      if (!m) { erros.push(`${t}: extra deve ser coluna=<coluna_do_usuario>`); break; }
      const A = "public.is_admin_user(auth.uid())";
      politica("rls_select", "SELECT", `${A} OR (${m[1]} = auth.uid() AND public.is_active_user())`, null);
      politica("rls_insert", "INSERT", null, A);
      politica("rls_update", "UPDATE", A, A);
      politica("rls_delete", "DELETE", A, null);
      break;
    }
    case "trilha":
      politica("rls_select", "SELECT", M, null);
      break;
    case "admin_leitura":
      politica("rls_select", "SELECT", "public.is_admin_user(auth.uid())", null);
      break;
    case "publico_admin": {
      const A = "public.is_admin_user(auth.uid())";
      L.push(`DROP POLICY IF EXISTS "rls_select" ON public.${t};`);
      L.push(`CREATE POLICY "rls_select" ON public.${t} FOR SELECT TO anon, authenticated\n  USING (true);`);
      politica("rls_insert", "INSERT", null, A);
      politica("rls_update", "UPDATE", A, A);
      politica("rls_delete", "DELETE", A, null);
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
-- Depende de: overlay/10_funcoes_acesso.sql (is_active_user, is_admin_user, meu_servidor_id
-- reescritos para exigir perfil ativo; can_access_module já era correta) e de
-- overlay/30_remover_acesso_total.sql (remove as policies acesso_total_* antes de estas entrarem).
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

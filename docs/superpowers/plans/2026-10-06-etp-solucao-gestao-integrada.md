# ETP — Solução de gestão integrada: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Registro datado (2026-10-06), não canônico.** Estado: **aguardando aprovação**. Nada abaixo foi executado.

**Goal:** Criar a estrutura de documentação, agentes, skills, hooks, MCP e APIs que o ETP do IDJuv exige, começando por fechar os achados de segurança que afetam LGPD e transparência.

**Architecture:** Fase 0 corrige segurança (S1–S4, S7). Fase 1 entrega os documentos e guardas do Marco 1 (plano de implantação). Fases 2 a 4 acompanham os Marcos 2 a 4 do ETP como épicos, cada um com spec e plano próprios ao começar (`/superpowers`). Skills de domínio nascem na tarefa do marco que as usa.

**Tech Stack:** Markdown, Node 22 (scripts `.mjs`), Bash, Supabase (migrações SQL, Edge Functions Deno, MCP), Vite/React (apenas o ajuste da consulta pública de árbitros).

**Spec:** [`../specs/2026-10-06-etp-solucao-gestao-integrada-design.md`](../specs/2026-10-06-etp-solucao-gestao-integrada-design.md); matriz: [`../specs/2026-10-06-etp-matriz-rastreabilidade.md`](../specs/2026-10-06-etp-matriz-rastreabilidade.md).

## Global Constraints

- Nenhum nome de cliente em `src/`; textos específicos do IDJuv ficam em `docs/` e `tenants/idjuv/` (AGENTS.md invariante 4).
- Não editar `src/integrations/supabase/client.ts` nem `types.ts` (invariante 3).
- Toda tabela/função nova nasce com RLS e `SET search_path` fixo na mesma migração (skill `migracao-segura-idjuv`).
- Mudança em RLS existente, `ProtectedRoute` ou `AuthContext` só com "sim" explícito do usuário; **nenhuma migração em projeto remoto sem pedido** (invariantes 2 e 8).
- Segredos só em `supabase secrets`/variáveis de ambiente; `.mcp.json` e docs não levam ref de projeto, token nem chave (invariante 5).
- Doc canônica nova = entrada em `LIVING_DOCS` (`scripts/check-doc-links.mjs`) + linha em `docs/README.md` + linha na matriz de `docs/GOVERNANCA_DOCUMENTACAO.md` §3.
- Cada doc nova abre com `Estado: Vigente | Parcial | Rascunho normativo`; não descreve como existente o que não existe (`GOVERNANCA_DOCUMENTACAO.md` §7).
- Contagens em doc canônica levam data de apuração.
- Conteúdo legal marcado "validar com jurídico/encarregado" até a revisão (P6 da spec).
- Verificação final de cada tarefa: `bash scripts/gate.sh` lido, não presumido. O ambiente **não tem Deno, Supabase CLI nem Playwright**: Edge Functions só são verificadas por revisão estática até haver deploy autorizado.
- Commits em português, descritivos; branch `claude/jolly-keller-6if902`.

## Review Focus

1. **`localExport` legítimo** (Tarefa 2): quem tem papel `ti_admin`/`admin`/`presidencia` continua exportando pela `BackupOffsitePage`; quem não tem recebe 403.
2. **Auditoria silenciosa** (Tarefa 3): `audit_logs` tem `FORCE ROW LEVEL SECURITY`; revogar o `INSERT` direto só é seguro se o dono das funções `SECURITY DEFINER` contornar o RLS. Se não contornar, os triggers de RH, financeiro e licitações param de gravar **sem erro visível**.
3. **Consulta pública de árbitros** (Tarefa 3): a página de consulta por protocolo continua funcionando e **não** devolve CPF, RG nem e-mail.
4. **Tabelas fora de `types.ts`** (Tarefa 5): `denuncias` ainda não está no arquivo gerado; o dicionário não pode omitir isso em silêncio.
5. **Hook que bloqueia demais** (Tarefa 12): regenerar `types.ts` pelo MCP e ler `.env.example` continuam possíveis.

---

## Fase 0 — Segurança (antes da documentação)

### Task 1: Confirmar os achados no banco ao vivo (somente leitura)

**Agente:** sessão principal (executa SQL de leitura) + `revisor-seguranca-idjuv` (advisors e leitura de código).
**Depende de:** resposta do usuário sobre **qual projeto Supabase é o de produção** (`supabase/config.toml` e `docs/BACKUP_CONTINGENCIA.md` citam refs diferentes).

**Files:**
- Create: `docs/superpowers/specs/2026-10-06-etp-confirmacao-achados.md` (registro datado)

**Interfaces:**
- Produces: uma linha por S1–S10 com `CONFIRMADO | REFUTADO | NÃO CONFIRMÁVEL` e a evidência. A Tarefa 2 e a Tarefa 3 só tratam o que estiver `CONFIRMADO`.

- [ ] **Step 1:** Perguntar ao usuário o ref do projeto de produção e se leitura (`execute_sql` somente SELECT e `get_advisors`) é autorizada.
- [ ] **Step 2:** Rodar `SELECT tablename, policyname, roles, cmd, qual, with_check FROM pg_policies WHERE tablename IN ('audit_logs','cadastro_arbitros','demandas_ascom','cadastro_arbitros_modalidades');` e `SELECT rolname, rolbypassrls FROM pg_roles WHERE rolname IN ('postgres','authenticated','anon');`.
- [ ] **Step 3:** Rodar `get_advisors` de segurança e anexar só os itens ligados a S1–S10.
- [ ] **Step 4:** Confirmar por leitura de código S5, S6, S9, S10 (sem tocar em nada).
- [ ] **Step 5:** Escrever o registro. Verificar: `grep -c "^| S" docs/superpowers/specs/2026-10-06-etp-confirmacao-achados.md` imprime `10`.
- [ ] **Step 6:** Commit: `docs: registra confirmação dos achados de segurança S1-S10`.

### Task 2: Corrigir as Edge Functions (S1, S2, S7, S8, S9) e criar `_shared`

**Agente:** `dev-banco-supabase` → `revisor-seguranca-idjuv`.
**Depende de:** Tarefa 1.

**Files:**
- Create: `supabase/functions/_shared/cors.ts`, `supabase/functions/_shared/auth.ts`, `supabase/functions/_shared/audit.ts`
- Modify: `supabase/functions/backup-offsite/index.ts` (S1 `:265-290`, S2 `:371-393`, S7 `~:410-420`), `supabase/functions/admin-create-user/index.ts`, `supabase/functions/admin-reset-password/index.ts` (S9), `supabase/functions/download-frequencia/index.ts`, `supabase/functions/enviar-convite-reuniao/index.ts` (S8), `supabase/config.toml`
- Modify (doc): `docs/EDGE_FUNCTIONS.md` (remover `create-test-user`, documentar secrets reais e CORS)

**Interfaces:**
- Produces (em `_shared`, usados pela Tarefa 9 e pelas funções novas dos épicos):
  - `corsHeadersFor(req: Request): Record<string, string>`: lê `ALLOWED_ORIGINS`; origem fora da lista não recebe `Access-Control-Allow-Origin`; se a variável estiver vazia, mantém `*` e chama `console.warn` (compatibilidade, a doc registra a dívida).
  - `requireUser(req: Request): Promise<{ id: string; email?: string; token: string }>`: valida o JWT com `auth.getUser(token)`; lança `HttpError(401)`.
  - `requireAnyRole(admin: SupabaseClient, userId: string, roles: string[]): Promise<void>`: consulta `user_roles`; lança `HttpError(403)`.
  - `isServiceRoleToken(token: string): boolean`: compara em tempo constante com `SUPABASE_SERVICE_ROLE_KEY` (substitui o `atob(token.split('.')[1])` de S7).
  - `writeAudit(admin: SupabaseClient, e: { user_id: string | null; action: string; entity_type: string; entity_id?: string; module_name: string; metadata?: Record<string, unknown> }): Promise<void>`: insere em `audit_logs` com a service role, nas mesmas colunas que `delete-user/index.ts` já usa.

- [ ] **Step 1:** Criar os três módulos com as assinaturas acima. `HttpError` fica em `auth.ts` e é capturado por um `toResponse(err, req)` exportado de `cors.ts`.
- [ ] **Step 2:** Em `backup-offsite`, exigir `requireAnyRole(admin, user.id, ['ti_admin','presidencia','admin'])` também no ramo `external-export` com `localExport:true` (S1); mover `list-tables` para depois da autenticação (S2); trocar a decodificação do JWT por `isServiceRoleToken` (S7).
- [ ] **Step 3:** Em `admin-create-user` e `admin-reset-password`, chamar `writeAudit` com `action` distinto de `delete-user` (S9). Em `download-frequencia` e `enviar-convite-reuniao`, trocar `*` fixo por `corsHeadersFor` (S8).
- [ ] **Step 4:** Declarar `[functions.<nome>]` com `verify_jwt` explícito para as 8 funções em `supabase/config.toml` (`true`, exceto onde o código documenta chamada sem JWT; `download-frequencia` usa o link como segredo e valida o JWT no código, então registrar o motivo em comentário).
- [ ] **Step 5:** Verificação estática: `grep -n "localExport" supabase/functions/backup-offsite/index.ts` mostra `requireAnyRole` antes de qualquer leitura de dados; `grep -n "atob(" supabase/functions/backup-offsite/index.ts` não retorna nada; `grep -rn "'\*'" supabase/functions/*/index.ts` só retorna o fallback de `_shared/cors.ts`.
- [ ] **Step 6:** `revisor-seguranca-idjuv` revisa o diff. **Roteiro de aceite para quando houver deploy autorizado** (não executar antes): chamada sem token → 401; token `anon` → 401/403; usuário autenticado sem papel com `localExport:true` → 403; usuário com papel `ti_admin` → 200 (Review Focus 1).
- [ ] **Step 7:** Atualizar `docs/EDGE_FUNCTIONS.md`. Rodar `npm run check:docs`; esperado: sem erro.
- [ ] **Step 8:** Commit: `fix(edge): exige papel na exportação local, autentica list-tables e padroniza _shared`.

### Task 3: Migração — trilha de auditoria e consulta pública de árbitros (S3, S4)

**Agente:** `dev-banco-supabase` (migração) + `dev-frontend-idjuv` (consulta pública) → `revisor-seguranca-idjuv`.
**Depende de:** Tarefa 1. **Exige "sim" explícito** (altera RLS existente). Aplicar em remoto **só** com pedido separado.

**Files:**
- Create: `supabase/migrations/<AAAAMMDDHHMMSS>_endurece_audit_logs_e_consulta_arbitros.sql` (timestamp maior que `20260924120000`)
- Modify: página/hook da consulta por protocolo em `src/pages/cadastro-arbitros/` e o hook correspondente em `src/hooks/`
- Modify (doc): `docs/BANCO_DE_DADOS.md`, `docs/RBAC_PERMISSOES.md` se a mudança afetar permissões

**Interfaces:**
- Produces: RPC `public.consultar_protocolo_arbitro(p_protocolo text) RETURNS TABLE (protocolo text, nome text, status text)` `SECURITY DEFINER`, `SET search_path = public`, `GRANT EXECUTE` para `anon` e `authenticated`; **sem** CPF, RG nem e-mail no retorno.

- [ ] **Step 1:** Antes de escrever, provar o pré-requisito do Review Focus 2: no banco (leitura), `SELECT rolbypassrls FROM pg_roles WHERE rolname = (SELECT pg_get_userbyid(proowner) FROM pg_proc WHERE proname = 'fn_audit_trigger')`. Se for `false`, **parar** e propor `WITH CHECK (false)` com função de inserção própria; não prosseguir com o `REVOKE`.
- [ ] **Step 2:** Escrever a migração: `DROP POLICY "audit_logs_insert"`, `REVOKE INSERT ON public.audit_logs FROM authenticated`; `DROP POLICY "Consulta pública por protocolo" ON public.cadastro_arbitros`; criar `consultar_protocolo_arbitro`. Idempotente (`IF EXISTS`).
- [ ] **Step 3:** Trocar a consulta pública para `supabase.rpc('consultar_protocolo_arbitro', { p_protocolo })`. Confirmar com `grep -rn "cadastro_arbitros" src/pages/cadastro-arbitros src/hooks` que nenhum `select` direto por protocolo sobrou na parte pública.
- [ ] **Step 4:** `npm run check:migrations`; esperado: sem erro. `bash scripts/gate.sh`; esperado: typecheck e lint sem piora vs. baseline, build ok.
- [ ] **Step 5 (só após aplicar, com pedido do usuário):** testes de Review Focus 2 e 3 em transação com `ROLLBACK`: (a) como `authenticated`, `INSERT INTO audit_logs ...` → erro de permissão; (b) `UPDATE` de um servidor e `SELECT count(*) FROM audit_logs` aumentou em 1 (o trigger ainda grava); (c) como `anon`, `SELECT cpf FROM cadastro_arbitros` → erro; `SELECT * FROM consultar_protocolo_arbitro('<protocolo de teste>')` → uma linha sem CPF. Depois `get_advisors` de segurança.
- [ ] **Step 6:** Atualizar `docs/BANCO_DE_DADOS.md` (RPC nova, `audit_logs` só por `log_audit` e triggers). Commit: `fix(db): audit_logs só por funções e consulta de árbitros por RPC sem dado pessoal`.

---

## Fase 1 — Marco 1: documentos, guardas e agentes

### Task 4: Matriz viva de rastreabilidade e seu guard

**Agente:** `documentador-idjuv`.

**Files:**
- Create: `docs/contratacao/RASTREABILIDADE_ETP.md`, `scripts/check-etp-rastreabilidade.mjs`, `.claude/skills/rastreabilidade-etp-idjuv/SKILL.md`
- Modify: `package.json` (script `check:etp`), `scripts/gate.sh` (chamar o guard após `check:docs`), `scripts/check-doc-links.mjs` (`LIVING_DOCS`)

**Interfaces:**
- Produces: formato de linha `| <ID> | <capacidade> | <STATUS> | <evidência em crases> | <lacuna> | <marco> |` com `ID` casando `^(A\d+\.\d+|R\d+|RS\d+|PV\d+)$` e `STATUS ∈ {ATENDE, PARCIAL, AUSENTE, SÓ-DOC}`.
- Produces: `node scripts/check-etp-rastreabilidade.mjs` sai com 0 ou 1; mensagem `ID <x>: caminho inexistente <p>` por problema.

- [ ] **Step 1:** Copiar as tabelas da matriz datada para `RASTREABILIDADE_ETP.md` (cabeçalho `Estado: Parcial`, data de apuração). Atualizar o status das linhas que a Fase 0 já tiver mudado.
- [ ] **Step 2:** Escrever o guard: percorre linhas de tabela, valida ID e status, e para status `ATENDE`/`PARCIAL` exige que cada caminho em crases (com extensão conhecida; ignorar rotas, globs e `<placeholders>`, como `check-doc-links.mjs`) exista no repositório. `AUSENTE` e `SÓ-DOC` não exigem evidência.
- [ ] **Step 3:** Rodar `node scripts/check-etp-rastreabilidade.mjs`; esperado: exit 0. Corrigir os caminhos que o guard reprovar (a matriz usa nomes de arquivo curtos em algumas linhas; trocar pelo caminho completo).
- [ ] **Step 4:** Teste negativo: trocar temporariamente um status por `OK` e um caminho por `src/nao/existe.ts`; rodar de novo; esperado: exit 1 com as duas mensagens. Reverter.
- [ ] **Step 5:** Escrever o skill (como atualizar a matriz, regras de status, quando mudar uma linha) e ligar o guard em `package.json`/`gate.sh`/`LIVING_DOCS`, `docs/README.md` e na matriz de `GOVERNANCA_DOCUMENTACAO.md`.
- [ ] **Step 6:** `bash scripts/gate.sh`; esperado: verde. Commit: `docs: matriz viva de rastreabilidade do ETP com guard automático`.

### Task 5: Dicionário de dados gerado

**Agente:** `documentador-idjuv` (usa `Bash`, ver Tarefa 12).

**Files:**
- Create: `scripts/gerar-dicionario-dados.mjs`, `docs/dados/DICIONARIO_DADOS.md` (gerado), `.claude/skills/dicionario-dados-idjuv/SKILL.md`
- Modify: `package.json` (`gen:dicionario`, `check:dicionario`), `scripts/gate.sh`

**Interfaces:**
- Produces: `node scripts/gerar-dicionario-dados.mjs [--check]` lê `src/integrations/supabase/types.ts` (somente leitura) e escreve/compara `docs/dados/DICIONARIO_DADOS.md` com: tabela, coluna, tipo, nulável, FK. Saída determinística (ordem alfabética), com data de apuração fixa vinda do conteúdo de `types.ts`, não do relógio, para o `--check` não falhar por data.

- [ ] **Step 1:** Escrever o script e rodar sem `--check`; verificar `grep -c "^### " docs/dados/DICIONARIO_DADOS.md` > 0.
- [ ] **Step 2:** Rodar `--check`; esperado: exit 0. Alterar manualmente uma linha do doc e rodar de novo; esperado: exit 1. Reverter.
- [ ] **Step 3 (Review Focus 4):** O script lista, numa seção final "Tabelas existentes em migração mas ausentes de `types.ts`", as tabelas de `CREATE TABLE` em `supabase/migrations/` que não aparecem no tipo. `grep -n "denuncias" docs/dados/DICIONARIO_DADOS.md` deve mostrá-la nessa seção.
- [ ] **Step 4:** Documentar a convenção de `COMMENT ON` para descrições futuras (no skill; ainda sem migração).
- [ ] **Step 5:** Registrar o doc nas três listas de governança, `bash scripts/gate.sh` verde, commit `docs: dicionário de dados gerado a partir de types.ts`.

### Task 6: Docs operacionais — ambientes, continuidade e nível de serviço

**Agente:** `documentador-idjuv` com insumo de `dev-banco-supabase`.

**Files:**
- Create: `docs/operacao/AMBIENTES.md`, `docs/operacao/CONTINUIDADE_DR.md`, `docs/operacao/NIVEL_DE_SERVICO.md`
- Modify: `docs/BACKUP_CONTINGENCIA.md` (nota no topo apontando para `CONTINUIDADE_DR.md`; corrigir "plataforma Lovable" e o project ref fixo), `supabase/config.toml` (comentário sobre o `project_id`)

**Interfaces:**
- Produces: `AMBIENTES.md` define dev/homologação/produção, variáveis por ambiente (só nomes), regra de promoção e dados de teste; `CONTINUIDADE_DR.md` define **RTO e RPO como campos a preencher e aprovar pelo IDJuv** (não inventar valores) e o modelo de registro de teste de restauração; `NIVEL_DE_SERVICO.md` traz as severidades, indicadores e o modelo do relatório mensal, partindo do §6.2-6.3 de `PROPOSTA_CONTRATACAO_IDJUV.md`, **marcado como `Rascunho normativo`**.

- [ ] **Step 1:** Escrever as três docs com `Estado:` no topo. Onde o ETP exige e o sistema não tem (homologação, SLA medido, restauração testada), a doc diz `Estado: Rascunho normativo` e lista o que falta, em vez de descrever como existente.
- [ ] **Step 2:** Corrigir `BACKUP_CONTINGENCIA.md` sem reescrever o histórico técnico.
- [ ] **Step 3:** Registrar nas três listas de governança. `npm run check:docs`; esperado: sem erro.
- [ ] **Step 4:** Commit: `docs: ambientes, continuidade/DR e nível de serviço (rascunho normativo)`.

### Task 7: Agendar o backup de verdade

**Agente:** `dev-banco-supabase` → `revisor-seguranca-idjuv`. **Aplicar em remoto só com pedido do usuário.**

**Files:**
- Create: `supabase/migrations/<AAAAMMDDHHMMSS>_agenda_backup_offsite.sql`
- Modify: `docs/operacao/CONTINUIDADE_DR.md`, `docs/BANCO_DE_DADOS.md`

**Interfaces:**
- Consumes: a ação `execute-backup` de `backup-offsite` (aceita chamada com a service role).
- Produces: job `pg_cron` diário que chama a função por `pg_net`, com o segredo lido do **Vault**, nunca escrito na migração.

- [ ] **Step 1:** Escrever a migração com `cron.schedule` condicional (`IF NOT EXISTS` no `cron.job`) e leitura de `vault.decrypted_secrets`; sem nenhum token literal.
- [ ] **Step 2:** `grep -n "eyJ" supabase/migrations/<arquivo>` não pode retornar nada. `npm run check:migrations` sem erro.
- [ ] **Step 3:** Documentar em `CONTINUIDADE_DR.md` o que ainda **não** está coberto (restauração e teste: Fase 4). Commit: `feat(db): agenda backup offsite diário via pg_cron sem segredo na migração`.

### Task 8: LGPD — governança, agente revisor e skill

**Agente:** `documentador-idjuv`; revisão do encarregado/jurídico antes de virar `Vigente`.

**Files:**
- Create: `docs/lgpd/GOVERNANCA_LGPD.md`, `.claude/agents/revisor-lgpd-idjuv.md`, `.claude/skills/lgpd-lai-idjuv/SKILL.md`

**Interfaces:**
- Produces: `GOVERNANCA_LGPD.md` com papéis (IDJuv controlador, contratada operadora), tabela de operações de tratamento por módulo (ROPA inicial a partir de `docs/MODULOS.md`), bases legais **a confirmar pelo encarregado**, retenção, direitos do titular, incidentes. `Estado: Rascunho normativo`.
- Produces: agente `revisor-lgpd-idjuv` com `tools: Read, Grep, Glob, Bash, mcp__Supabase__get_advisors, mcp__Supabase__list_tables`; checklist: policy para `anon` com `USING (true)`, views de transparência, `public/`, logs com dado pessoal, retenção.

- [ ] **Step 1:** Escrever a doc, o agente e o skill (o skill traz o padrão "view mascarada + `security_invoker`" a partir de `docs/MIGRACAO_VIEWS_TRANSPARENCIA.sql`).
- [ ] **Step 2:** Rodar o agente sobre o repositório; esperado: ele reencontra S4 e S6 (se aparecerem como refutados na Tarefa 1, ajustar o checklist, não o teste).
- [ ] **Step 3:** Registrar nas listas de governança; atualizar `AGENTS.md` (tabela de agentes) e `CLAUDE.md` §10.1 se citar agentes. `bash scripts/gate.sh` verde. Commit: `docs(lgpd): governança LGPD (rascunho), agente revisor-lgpd e skill lgpd-lai`.

### Task 9: API — referência, OpenAPI e guard de completude

**Agente:** `dev-integracoes-idjuv` (criado na Tarefa 10; até lá, `dev-banco-supabase`).

**Files:**
- Create: `docs/api/API_REFERENCIA.md`, `docs/api/openapi.yaml`, `scripts/check-api-docs.mjs`
- Modify: `package.json` (`check:api`), `scripts/gate.sh`

**Interfaces:**
- Produces: `node scripts/check-api-docs.mjs` sai com 1 se alguma pasta de `supabase/functions/` (exceto `_shared`) não tiver `paths` correspondente em `openapi.yaml` (`/functions/v1/<nome>`).
- Decide e documenta em `API_REFERENCIA.md` o **mecanismo de limite de taxa** para endpoints públicos: tabela `api_rate_limit(chave text, janela timestamptz, contagem int)` + RPC `api_rate_limit_hit(p_chave text, p_limite int, p_janela_s int) RETURNS boolean`. Implementação só quando uma função/RPC anônima nova nascer (épicos E3/E4).

- [ ] **Step 1:** Escrever `openapi.yaml` para as 8 funções existentes, com autenticação, papel exigido (conforme a Tarefa 2) e erros 401/403/429.
- [ ] **Step 2:** Escrever o guard; rodar; esperado: exit 0. Teste negativo: criar uma pasta vazia `supabase/functions/zz-teste/`, rodar; esperado: exit 1; remover a pasta.
- [ ] **Step 3:** Registrar nas listas de governança; `bash scripts/gate.sh` verde. Commit: `docs(api): referência OpenAPI das Edge Functions com guard de completude`.

### Task 10: Interoperabilidade, conformidade normativa e agente de integrações

**Agente:** `dev-integracoes-idjuv` (novo) e `documentador-idjuv`.

**Files:**
- Create: `docs/contratacao/INTEROPERABILIDADE.md`, `docs/contratacao/CONFORMIDADE_NORMATIVA.md`, `.claude/agents/dev-integracoes-idjuv.md`, `.claude/skills/integracao-sei-fiplan-idjuv/SKILL.md`

**Interfaces:**
- Produces: `INTEROPERABILIDADE.md` com uma linha por integração (SEI, FIPLAN, eSocial, CNAB, e-mail, IA): direção, formato, **fonte do leiaute**, status, dono. SEI e FIPLAN ficam `AUSENTE` com `Bloqueio: PV4 (leiautes da SEPLAN/SEGAD)`.
- Produces: `CONFORMIDADE_NORMATIVA.md` com os campos CETIF e IN SGD/ME 94/2022 **em branco e marcados "obter a norma"**; nenhuma interpretação inventada.
- Produces: agente `dev-integracoes-idjuv` com `tools: Read, Grep, Glob, Edit, Write, Bash`.

- [ ] **Step 1:** Escrever as duas docs a partir da matriz (A1.5, A1.6, A4.5, A5.4, R8, R11) e do relatório de APIs; sem afirmar nada que não esteja na matriz.
- [ ] **Step 2:** Criar o agente e o skill (o skill documenta a estrutura e o que falta saber, sem leiaute inventado).
- [ ] **Step 3:** Atualizar `AGENTS.md`; registrar as docs nas listas de governança; `bash scripts/gate.sh` verde. Commit: `docs: interoperabilidade e conformidade normativa; agente dev-integracoes`.

### Task 11: Plano de implantação e de testes de homologação

**Agente:** `documentador-idjuv` + `qa-homologacao-idjuv` (novo).

**Files:**
- Create: `docs/implantacao/PLANO_IMPLANTACAO.md`, `docs/implantacao/PLANO_TESTES_HOMOLOGACAO.md`, `.claude/agents/qa-homologacao-idjuv.md`, `.claude/skills/homologacao-dr-idjuv/SKILL.md`

**Interfaces:**
- Produces: `PLANO_IMPLANTACAO.md` com os 4 marcos do ETP (20/25/30/25%, até 130 dias), entregas por marco ligadas aos IDs da matriz, pontos focais (PV2), migração das planilhas (PV3) e o quadro de dependências externas (PV1 a PV5).
- Produces: `PLANO_TESTES_HOMOLOGACAO.md` que **mapeia os 8 critérios de aceite de `PROPOSTA_CONTRATACAO_IDJUV.md` §6.4 aos 4 marcos** e traz o roteiro de aceite por marco (390px e desktop).
- Produces: agente `qa-homologacao-idjuv` com `tools: Read, Grep, Glob, Edit, Write, Bash`.

- [ ] **Step 1:** Escrever as duas docs. Datas absolutas só depois de o IDJuv fixar o início (ETP: 01/11 ou 01/12/2026); até lá, "D+N dias".
- [ ] **Step 2:** Criar o agente e o skill de homologação/DR (roteiro de drill de restauração e modelo de registro de evidência, ligados a `CONTINUIDADE_DR.md`).
- [ ] **Step 3:** `grep -c "Marco [1-4]" docs/implantacao/PLANO_IMPLANTACAO.md` ≥ 4; os 8 critérios aparecem em `PLANO_TESTES_HOMOLOGACAO.md` (`grep -c "^| C[1-8]"` = 8).
- [ ] **Step 4:** Atualizar `AGENTS.md`; registrar docs; `bash scripts/gate.sh` verde. Commit: `docs: plano de implantação e de testes de homologação por marco; agente qa-homologacao`.

### Task 12: Agentes existentes, hooks, permissões e MCP

**Agente:** sessão principal com o skill `update-config`; `revisor-seguranca-idjuv` revisa.

**Files:**
- Modify: `.claude/agents/arquiteto-idjuv.md` (remover a instrução de gravar specs), `.claude/agents/documentador-idjuv.md` (acrescentar `Bash`), `.claude/settings.json`, `AGENTS.md`, `.claude/skills/superpowers/SKILL.md` (tabela do Passo 4 com os agentes novos)
- Create: `.claude/hooks/guard-arquivos-gerados.sh`, `.mcp.json`, `.claude/agents/redator-manuais-idjuv.md`

**Interfaces:**
- Produces: hook `PreToolUse` (matcher `Edit|Write`) que sai com código 2 e mensagem se o caminho for `src/integrations/supabase/client.ts`, `src/integrations/supabase/types.ts`, `public/**/*.sql` ou `.env*`, **exceto** quando `PERMITIR_ARQUIVO_GERADO=1` (Review Focus 5).
- Produces: `permissions.deny` com `Bash(git push --force*)`, `Bash(supabase db push*)`, `Read(.env)`, `Read(.env.*)` **mantendo `.env.example` legível**.
- Produces: `.mcp.json` com Supabase somente leitura (`project_ref` por `${SUPABASE_PROJECT_REF}`) e Playwright; sem valores literais.

- [ ] **Step 1:** Escrever o hook como script que lê o JSON do evento em stdin. Teste de aceite: `echo '{"tool_input":{"file_path":"src/integrations/supabase/types.ts"}}' | bash .claude/hooks/guard-arquivos-gerados.sh; echo $?` → `2`; com `PERMITIR_ARQUIVO_GERADO=1` → `0`; com `.env.example` → `0`.
- [ ] **Step 2:** Registrar o hook e as permissões em `settings.json` pelo skill `update-config` e **testar de verdade** numa sessão: tentar editar `types.ts` e ver o bloqueio.
- [ ] **Step 3:** Criar `.mcp.json`; `grep -nE "eyJ|sbp_|[a-z]{20}\.supabase\.co" .mcp.json` não pode retornar nada.
- [ ] **Step 4:** Criar `redator-manuais-idjuv`; ajustar `arquiteto-idjuv` e `documentador-idjuv`; atualizar a tabela de agentes em `AGENTS.md` e o Passo 4 do `superpowers`.
- [ ] **Step 5:** Verificar com `claude-code-guide` (ou na documentação oficial) que os campos usados no frontmatter dos agentes e nas permissões existem na versão em uso, antes de confiar neles.
- [ ] **Step 6:** `bash scripts/gate.sh` verde. Commit: `chore(claude): hook de arquivos gerados, permissões, .mcp.json e agentes novos`.

### Task 13: Registro final das docs, correção de defasadas e fechamento do Marco 1

**Agente:** `documentador-idjuv` → `revisor-codigo-idjuv`.

**Files:**
- Modify: `scripts/check-doc-links.mjs` (`LIVING_DOCS`), `docs/README.md`, `docs/GOVERNANCA_DOCUMENTACAO.md` (§2 e §3), `docs/planejamento/ROADMAP.md`, `README.md` (substituir o boilerplate do Lovable por descrição real e links), `docs/EXPORTAR_DADOS.md` e `docs/MIGRACAO_SUPABASE_PROPRIO.md` (nota de "histórico, ver `docs/dados/EXPORTACAO_E_TRANSICAO.md` quando existir")

- [ ] **Step 1:** Garantir que cada doc criada nas Tarefas 4 a 11 esteja nas **três** listas de governança. `npm run check:docs`; esperado: sem erro.
- [ ] **Step 2:** Atualizar `ROADMAP.md`: mover "Estrutura ETP" para "Em andamento" com link para esta spec e plano; registrar S1–S10 e as Fases 2 a 4 em Backlog.
- [ ] **Step 3:** Reescrever `README.md` raiz (produto, stack, onde está a doc), sem nome de cliente em `src/`.
- [ ] **Step 4:** `revisor-codigo-idjuv` confere o diff inteiro contra a regra "nada não implementado documentado como existente".
- [ ] **Step 5:** `bash scripts/gate.sh` verde; commit; decidir com o usuário se ativa o `docs-guard` (D5).

---

## Fases 2 a 4 — épicos (um spec e um plano próprios ao iniciar)

Tamanho relativo: **P** < **M** < **G**. Cada épico atualiza sua linha na matriz viva no mesmo PR (Tarefa 4).

| Marco | Épico | IDs da matriz | Agentes | Tam. | Depende de |
|---|---|---|---|---|---|
| 2 | E2.1 Parâmetros legais de folha fora do código; processo de atualização legal | A1.4, R7 | `dev-banco-supabase`, `dev-frontend-idjuv` | M | skill `folha-esocial-cnab-idjuv` |
| 2 | E2.2 eSocial: eventos de tabela, assinatura, validação XSD e transmissão | A1.6, RS1 | `dev-integracoes-idjuv` | G | **certificado digital do órgão** |
| 2 | E2.3 CNAB: retorno, multibanco, header por banco | A1.5 | `dev-integracoes-idjuv` | M | E2.1 |
| 2 | E2.4 RPPS e rescisão/13º confirmados em tela | A1.4 | `dev-banco-supabase` | M | levantar regra com o IDJuv |
| 2 | E2.5 Migração dos servidores a partir das planilhas | PV3 | `dev-frontend-idjuv`, `qa-homologacao-idjuv` | M | PV3 |
| 3 | E3.1 Contratos, aditivos, garantias, fiscais e atas: **telas e rotas** (e remover rotas mortas do menu) | A2.4, A2.5, A2.7 | `dev-frontend-idjuv` | G | skill `contratacoes-lei-14133-idjuv` |
| 3 | E3.2 PCA, DFD, ETP, TR e pesquisa de preços **persistentes** | A2.1 a A2.3 | `dev-banco-supabase`, `dev-frontend-idjuv` | G | E3.1 |
| 3 | E3.3 `alertas-vigencia` (cron, notificação, e-mail) | A2.6, RS3 | `dev-integracoes-idjuv` | P | E3.1, Tarefa 9 |
| 3 | E3.4 Patrimônio: origem "IDR" e incorporação em lote; fila offline em IndexedDB; balancete | A3.4, A3.6, A3.7, RS2 | `dev-frontend-idjuv` | G | skill `patrimonio-offline-idjuv` |
| 3 | E3.5 Almoxarifado: estoque e movimentações em tela | A3.5 | `dev-frontend-idjuv` | M | — |
| 3 | E3.6 Conciliação bancária e importação FIPLAN | A5.3, A5.4, R8 | `dev-integracoes-idjuv` | G | **PV4** |
| 3 | E3.7 Gestão documental: temporalidade, modelos editáveis, numeração para outros atos; interface SEI | A4.2 a A4.5 | `dev-banco-supabase`, `dev-frontend-idjuv` | M | **PV4** (SEI) |
| 3 | E3.8 Substituir telas-mock (convênios, relatórios sem ação, detalhes `Placeholder`) | A2.7, A3.2, A5.1, A5.5 | `dev-frontend-idjuv` | M | — |
| 4 | E4.1 Transparência: views `v_transparencia_*`, e-SIC no front, itens do art. 8º | A8.1 a A8.4, RS4 | `dev-banco-supabase`, `dev-frontend-idjuv`, `revisor-lgpd-idjuv` | G | Tarefa 3, S6, S10 |
| 4 | E4.2 Ouvidoria e conflito de interesses | A7.2, A7.3 | `dev-banco-supabase`, `dev-frontend-idjuv` | M | — |
| 4 | E4.3 Governança: riscos, controles e indicadores com dado real | A6.2, A6.3 | `dev-frontend-idjuv` | M | — |
| 4 | E4.4 Programas: beneficiários, atletas, PROESPORTE e indicadores | A10.1 a A10.4, RS5 | `dev-banco-supabase`, `dev-frontend-idjuv` | G | levantar regra do PROESPORTE |
| 4 | E4.5 Manuais e capacitação (`/manuais/:slug` com conteúdo real) | R9 | `redator-manuais-idjuv` | M | skill `manual-usuario-idjuv` |
| 4 | E4.6 `exportar-dados`, `saude-sistema`/SLA, `teste-restauração` e relatório mensal | R1, R2, R5, R6 | `dev-integracoes-idjuv`, `qa-homologacao-idjuv` | G | Tarefas 5, 6, 7 |
| 4 | E4.7 Ambiente de homologação separado | R10 | `dev-banco-supabase` | M | decisão de infraestrutura |

## Self-review

- **Cobertura da spec:** §3 (S1–S10) → Tarefas 1 a 3 (S5, S6, S9 e S10 entram na confirmação da Tarefa 1; S10 é tratada em E4.1); §5.1 (14 docs) → Tarefas 4, 5, 6, 8, 9, 10, 11, mais `EXPORTACAO_E_TRANSICAO` em E4.6 e `docs/usuario/` em E4.5; §5.2 (agentes) → Tarefas 8, 10, 11, 12; §5.3 (11 skills) → Tarefas 4, 5, 8, 10, 11 e os épicos que as usam; §5.4 → Tarefa 12; §5.5 (plugin) adiado por D4; §5.6 → Tarefas 2, 3, 7, 9 e E2.2, E3.3, E3.6, E4.1, E4.6; §5.7 → Tarefas 4, 5, 9.
- **Lacuna conhecida:** a spec cita o skill `documentos-pdf-idjuv` (§5.3); ele não tem tarefa própria e nasce em E3.2 (geração de DFD/ETP/TR), que é o primeiro épico a mexer em `pdf*.ts`.
- **Consistência:** `requireAnyRole`, `writeAudit`, `isServiceRoleToken` e `corsHeadersFor` têm a mesma assinatura em todas as tarefas que os citam; `consultar_protocolo_arbitro(p_protocolo text)` idem.
- **Proporção:** as Fases 0 e 1 são tarefas executáveis; as Fases 2 a 4 deliberadamente não são, porque dependem de PV3, PV4, certificado digital e de regras que o IDJuv ainda precisa informar.

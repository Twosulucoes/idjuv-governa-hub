# Onda B do RH — entrega B1: segurança da folha no banco (RLS por permissão, RPC e triggers)

Spec da primeira entrega da **Onda B** (`docs/planejamento/FINALIZACAO.md`, itens 7–9) e da migração
**13b** que a PR #56 deixou registrada (`docs/superpowers/specs/2026-10-09-folha-detalhe-edicao-design.md`,
seção "Fora de escopo (13b)", na branch da #56). Levantamento pelo `arquiteto-idjuv` em 2026-10-10 sobre
`supabase/baseline/`, `supabase/migrations/` e o front em `main` (`1d1ed17`). Sessão autônoma: as
premissas abaixo valem até o usuário dizer o contrário; as decisões que mudam quem acessa o quê vão em card.

## Premissas (sessão autônoma)

1. **O estado do banco de produção é desconhecido** e a migração precisa valer nos dois estados possíveis:
   - *banco construído do baseline* (`docs/NOVO_BANCO.md`): policies `rls_*` por módulo, funções de acesso
     corrigidas (`overlay/10`), `processar_folha_pagamento` **sem EXECUTE** para `authenticated`;
   - *banco produzido só pelas migrações* (replay): policies `acesso_total_*` (`auth.uid() IS NOT NULL`),
     `has_role`/`has_module(app_module)`/`can_access_module(app_module)` são *stubs* que devolvem `true` para
     qualquer logado, `usuario_eh_admin` não existe (os triggers de folha fechada quebram) e
     `registrar_transicao_folha` lê `profiles.nome` (coluna inexistente: todo UPDATE em `folhas_pagamento`
     falha).
   Por isso tudo é **idempotente** (`CREATE OR REPLACE`, `DROP ... IF EXISTS`, `DO` com checagem) e a
   migração **recria as funções-base** com o conteúdo já revisado dos overlays do baseline (não inventa
   corpo novo): no banco do baseline é no-op; no replay, corrige.
2. **Escopo B1 = folha.** Tabelas: `folhas_pagamento`, `fichas_financeiras`, `itens_ficha_financeira`,
   `consignacoes`, `dependentes_irrf`, `lancamentos_folha`, `parametros_folha`, `rubricas`, `tabela_inss`,
   `tabela_irrf`. Férias, licenças, viagens e frequência (permissões `rh.<x>.criar|editar|gerenciar|lancar`),
   leitura própria em `servidores` (autoatendimento), storage (`frequencias`, `documentos-requerimento`,
   `documentos`) e a Edge Function `download-frequencia` ficam para **B2/B3**, cada uma com spec e card
   próprios — são mudanças que podem tirar escrita do papel `user` e precisam da distribuição real de
   papéis para serem dimensionadas.
3. **A folha pertence ao módulo RH.** Rotas `/folha*` estão no módulo `rh` (`src/shared/config/modules.config.ts:83`),
   as tabelas são `modulo rh` no `mapa.csv` e a RLS de leitura exige o módulo `rh`. Mas os códigos
   `financeiro.folha.visualizar|processar|configurar` estão no catálogo sob `module_code = 'financeiro'`
   (`supabase/baseline/schema/02_dados_catalogo.sql:309-392`), e `get_user_permission_codes` só concede a
   permissão de papel a quem tem o módulo dela (`01_pre_data.sql:4870-4884`; o front replica em
   `AuthContext.tsx:125-133`). Resultado: um `manager` só com o módulo `rh` **não** tem
   `financeiro.folha.processar`. Decisão em card (abaixo); **padrão desta entrega: mover os três códigos para
   `module_code = 'rh'`** sem renomeá-los (os códigos continuam `financeiro.folha.*`, então `role_permissions`,
   `user_permissions`, gates do front e docs não mudam; só o agrupamento por módulo).
4. **Quem já pode clicar continua podendo.** As policies de escrita passam a exigir exatamente a permissão
   que o front já usa como gate (`financeiro.folha.processar` para operar, `financeiro.folha.configurar` para
   rubricas/parâmetros/tabelas). Leitura não muda (módulo `rh`; ficha e itens também pelo próprio servidor).
   Quem perde é só quem hoje escreve **sem** a permissão, direto na API — exatamente o que a Onda B quer
   fechar. O papel `user` (só `visualizar`) perde escrita em folha; `manager` e `admin` não.
5. **Fechar/reabrir folha não muda de dono.** `usuario_pode_fechar_folha` exige `rh.admin`, código que não
   existe no catálogo, logo só o papel admin fecha e envia para conferência hoje. Fica assim (registrado);
   alinhar a `financeiro.folha.processar` é decisão de negócio para outra entrega.
6. **Sem CPF nem dado bancário na auditoria.** `fn_audit_trigger` copia a linha inteira para `audit_logs`. Entra em
   `folhas_pagamento`, `itens_ficha_financeira` e `consignacoes` (sem CPF/banco; itens e consignações ainda são
   dado financeiro de pessoa identificável, lido só pelo papel admin). `fichas_financeiras`
   (dados bancários, PIS) e `dependentes_irrf` (CPF do dependente) **não** recebem o trigger genérico;
   auditoria com mascaramento fica registrada como pendência.
7. **O gerador de RLS continua sendo a fonte da verdade.** Em vez de policies "à mão" fora do modelo, o
   `scripts/db/gerar-rls.mjs` ganha a classe `permissao` e o `mapa.csv` passa essas tabelas para ela; a
   migração carrega **o mesmo SQL** que o gerador produz, e `scripts/db/testar-rls.sql` ganha o teste da
   classe. Assim o guard do gate (`gerar-rls.mjs --check`) e o teste de RLS cobrem a mudança.
8. **Nada é aplicado em banco remoto por esta sessão.** A migração vai em PR rascunho e só chega à
   produção pelo CI, no merge (`AGENTS.md`, invariante 8).

## O que muda

### 1. Funções-base (porte idempotente dos overlays `10_funcoes_acesso.sql` e `18_funcoes_rpc.sql`)

Copiadas **textualmente** dos overlays (não reescrever): `is_active_user`, `is_admin_user(uuid)`,
`is_admin_atual`, `usuario_eh_admin(uuid)`, `usuario_eh_super_admin`, `has_permission_code(uuid, text)`
(exige perfil ativo), `usuario_tem_permissao(uuid, text)`, `meu_servidor_id()`, `has_role(app_role)`,
`has_module(app_module)`, `can_access_module(app_module)`; `registrar_transicao_folha()` (versão que lê
`profiles.full_name`), `folhas_proteger_fechamento()` + trigger BEFORE UPDATE em `folhas_pagamento`,
`fechar_folha`, `reabrir_folha`. Todas `SECURITY DEFINER SET search_path = public`.

### 2. Classe `permissao` no gerador de RLS

`mapa.csv`: `classe = permissao`, `extra = escrita=<código>[;proprio|;pai=<tabela>.<fk>]`.

| Policy | Regra |
|---|---|
| SELECT | `can_access_module(auth.uid(), <módulos>)` [OR `servidor_id = meu_servidor_id()` com `proprio`; OR EXISTS pai do próprio servidor com `pai=`] |
| INSERT | `WITH CHECK has_permission_code(auth.uid(), <código>)` |
| UPDATE | `USING` e `WITH CHECK` idem |
| DELETE | `USING` idem |

`has_permission_code` já dá passagem ao papel admin e exige perfil ativo. Tabelas e códigos:

| Tabela | módulos | extra |
|---|---|---|
| `folhas_pagamento`, `lancamentos_folha`, `consignacoes`, `dependentes_irrf` | rh | `escrita=financeiro.folha.processar` |
| `fichas_financeiras` | rh | `escrita=financeiro.folha.processar;proprio` |
| `itens_ficha_financeira` | rh | `escrita=financeiro.folha.processar;pai=fichas_financeiras.ficha_id` |
| `parametros_folha`, `rubricas`, `tabela_inss`, `tabela_irrf` | rh | `escrita=financeiro.folha.configurar` |

`testar-rls.sql`: para a classe, persona *com módulo e com a permissão* insere/atualiza/apaga; persona *com
módulo e sem a permissão* lê mas não escreve; sem módulo não lê; admin tudo; anon nada. Precisa de uma persona
nova ("módulo rh + permissão X" via `user_modules.permissions`).

A migração faz `DROP POLICY IF EXISTS` dos nomes dos dois estados (`rls_select|insert|update|delete` e
`acesso_total_select|insert|update|delete`) em cada tabela e cria as policies geradas. `ENABLE ROW LEVEL
SECURITY` idempotente.

### 3. `processar_folha_pagamento`: guarda, status e EXECUTE (M1)

`CREATE OR REPLACE` com o corpo atual (`01_pre_data.sql:5452-5674`) mais, no início:
`IF NOT public.has_permission_code(auth.uid(), 'financeiro.folha.processar') THEN RAISE EXCEPTION ...
USING ERRCODE = '42501'`. Mantém a checagem de status (`aberta|processando|reaberta|previa`). `REVOKE EXECUTE
... FROM PUBLIC, anon; GRANT EXECUTE ... TO authenticated, service_role`. Em `testar-rls.sql`, a asserção
"`processar_folha_pagamento` executável por authenticated é falha" vira "executável **e** com guarda" (a
função passa a casar o regex `has_permission_code`, então sai da lista de DEFINER sem checagem).
O `DELETE FROM fichas_financeiras` no reprocessamento continua (M3, preservar itens manuais, fica fora).

### 4. Folha fechada também barra INSERT (M2a)

Triggers BEFORE INSERT em `itens_ficha_financeira` e `fichas_financeiras`: se
`folha_esta_bloqueada(folha_id)` e `NOT usuario_eh_admin(auth.uid())` → `42501`, espelhando os triggers de
UPDATE/DELETE existentes (`01_pre_data.sql:1827-1889`). A RPC `recalcular_ficha_financeira` atômica (M2b)
fica para depois da #56 mesclada (o front dela recalcula em quatro comandos).

### 5. Índice único parcial para "Lançar na ficha"

`CREATE UNIQUE INDEX IF NOT EXISTS ... ON itens_ficha_financeira (ficha_id, lower(referencia)) WHERE tipo =
'desconto' AND referencia IS NOT NULL`, **só se não houver duplicata** (DO block: com duplicatas, `RAISE
WARNING` e segue — a migração não pode falhar no merge).

### 6. Auditoria (M5, parcial)

`fn_audit_trigger('rh')` AFTER INSERT/UPDATE/DELETE em `folhas_pagamento`, `itens_ficha_financeira`,
`consignacoes` (`DROP TRIGGER IF EXISTS` + `CREATE`). Premissa 6.

### 7. Catálogo: folha no módulo RH (decisão em card; padrão = sim)

`UPDATE module_permissions_catalog SET module_code = 'rh' WHERE permission_code LIKE 'financeiro.folha.%'`.
Front: os três códigos saem de `MODULE_PERMISSIONS.financeiro` e entram em `.rh` (`src/types/auth.ts`),
sem renomear. Se o usuário escolher "manter em financeiro", o UPDATE e a mudança em `auth.ts` saem da PR.

### 8. Front: guard das rotas `/folha*` (decisão em card; padrão = sim)

`src/App.tsx:921-926`: `/folha`, `/folha/fichas`, `/folha/gestao`, `/folha/:id` →
`requiredModule="rh" requiredPermissions="financeiro.folha.visualizar"`; `/folha/rubricas`,
`/folha/configuracao` → `requiredPermissions="financeiro.folha.configurar"`. É a contraparte de UX da RLS
(sem ela, quem não tem a permissão vê a tela e recebe `42501`). `ProtectedRoute`/`AuthContext` não mudam.
`ConfiguracaoFolhaPage` não tem gate de botão; a rota passa a ter.

### 9. Baseline

`mapa.csv` e `35_policies_geradas.sql` regenerados (classe nova). Os demais objetos da migração (guarda da
RPC, triggers, índice, catálogo) entram no baseline na próxima regeneração do schema
(`scripts/db/gerar-baseline.sh`), como já acontece com as migrações de 2026-10-09 (`avisos`, `config_envio`,
`importacoes`, que hoje fazem o passo 4 do `validar-baseline.sh` reprovar por estarem no mapa e não no
schema). Se a regeneração couber nesta PR sem conflito com outras frentes, entra; senão fica registrada.

## Verificação

1. `bash scripts/db/validar-migracoes.sh` (replay de todas as migrações + esta) num Postgres local —
   prova que a migração roda sobre o estado "só migrações".
2. Aplicar a migração também sobre uma cópia do banco do baseline (`idjuv_baseline`) — prova a idempotência
   no estado "baseline" (nenhum erro; policies finais iguais).
3. `scripts/db/testar-rls.sh` sobre as duas cópias: classe `permissao` aprovada; `processar_folha_pagamento`
   com guarda; triggers de INSERT em folha fechada.
4. `node scripts/db/gerar-rls.mjs --check`, `bash scripts/gate.sh`.
5. Revisão `revisor-seguranca-idjuv` + `revisor-codigo-idjuv`.

## Fora de escopo (registrar em RBAC_PERMISSOES.md)

Férias/licenças/viagens/frequência por permissão (B2); leitura própria em `servidores`, `/rh/meus-dados`
e assinatura de frequência pelo servidor (B2); storage e `download-frequencia` (B3); auditoria de
`fichas_financeiras`/`dependentes_irrf` com mascaramento; RPC `recalcular_ficha_financeira` e preservação de
itens manuais no reprocessamento (M2b/M3; depende da #56); quem fecha folha (`rh.admin` inexistente);
`useMotorFolha.ts` (motor no cliente, sem uso por página — remover em higiene); `TIPO_FOLHA_LABELS`.

## Riscos e implantação

- Policies novas só restringem depois do `DROP` das `acesso_total_*`: a migração faz os dois na mesma transação.
- Usuário com módulo `rh` e sem `financeiro.folha.processar` que hoje escreve direto na API perde a escrita
  (intencional). Com o catálogo movido para `rh`, todo `manager` com o módulo `rh` passa a ter
  `processar` e `configurar` por papel; `user` não.
- Front e migração vão na mesma PR: o `deploy-front.yml` espera as migrações do mesmo commit.
- Se a produção tiver duplicatas em `(ficha_id, lower(referencia))`, o índice não é criado (WARNING no log do
  CI) e precisa de limpeza manual.
- Só o banco real responde: contagem de `acesso_total_*`, `schema_migrations`, distribuição de papéis.
  Consulta de conferência pós-merge no fim da seção de folha em `docs/RBAC_PERMISSOES.md`.

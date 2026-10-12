# IA de compras, fase 1 (base de IA da instituição): plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** cada instituição liga a IA quando quiser, escolhe o provedor (OpenAI, Anthropic, Gemini ou compatível com OpenAI), cadastra a própria chave no Vault, e toda chamada de IA passa por uma Edge Function única (`ia-gateway`) com permissão, cota, teto mensal e registro de uso. A tela CPSI passa a usar esse caminho.

**Architecture:** configuração numa tabela de uma linha (`ia_config`) no mesmo desenho de `config_envio` (privilégio por coluna, chave só no Vault, trigger que apaga a chave quando o destino muda). O gateway lê config + chave por uma função só de `service_role`, chama o provedor por adaptadores em `supabase/functions/_shared/ia/` e grava cada chamada em `ia_uso` (sem conteúdo). O front ganha `/admin/ia` (configuração e uso do mês) e um hook `useIADisponivel` que esconde os botões de IA quando ela está desligada ou a pessoa não tem permissão.

**Tech Stack:** Postgres/Supabase (RLS, Vault), Edge Functions Deno, React 18 + React Query + react-hook-form/zod + shadcn/ui.

**Spec:** `docs/superpowers/specs/2026-10-11-ia-compras-design.md` (versão 2, aprovada pelo Fabiano em 2026-10-11; plano aprovado em 2026-10-12).

**Pré-requisito:** a PR #79 (Onda 2) mergeada, porque o gateway usa `consumir_cota_uso` e substitui a `cpsi-ai-assistant` endurecida lá. A branch `claude/revisao-permissoes-ve9zl5` é recriada a partir do `origin/main` atualizado.

## Global Constraints

- Português em nomes, comentários e textos de UI.
- Toda tabela nova nasce com RLS e policies na mesma migração; função nova com `SET search_path = public` e `EXECUTE` só para quem precisa (skill `migracao-segura-idjuv`).
- A chave de API nunca vai para `src/`, `.env` do front, resposta de API, log ou auditoria. O front só sabe **se**, **quando** e os **4 últimos caracteres**.
- Nenhum conteúdo de prompt ou resposta é gravado em `ia_uso` ou `audit_logs`.
- IA desligada por padrão (`ia_config.ativo = false`).
- `enviar_dados_pessoais` padrão `false` (usado pelo mascaramento das fases 2 e 3; na fase 1 só é gravado e exibido).
- Sem nome de cliente em `src/`; sem nome de modelo fixo no código (o administrador digita o modelo; a tela pode mostrar exemplo em placeholder).
- Não editar `src/integrations/supabase/types.ts` (tipos novos em `src/types/ia.ts`, chamadas com cast como em `useConfigEnvio.ts`).
- Migração só pelo CI; agente não aplica em banco remoto. Edge Functions são deployadas pelo Fabiano depois do merge.
- Verificação final: `bash scripts/gate.sh` verde, `scripts/db/validar-migracoes.sh`, `validar-baseline.sh` (APROVADO) e `testar-rls.sql` sem falhas.

## Review Focus

1. **Admin troca provedor ou URL base depois de cadastrar a chave:** a chave é apagada e a IA desligada; sem isso, quem edita a config mandaria a chave para um servidor próprio. Teste na Task 1 (`ia_config` trigger) e na Task 4 (aviso na tela).
2. **Provedor responde 401/429/5xx, HTML ou JSON inesperado:** a pessoa vê uma mensagem clara com o status HTTP ("confira a chave" no 401), o uso é registrado com `status='erro'`, e nem a chave nem o corpo da resposta do provedor vazam. Teste na Task 2 (`ErroProvedor`) e na Task 3.
3. **Provedor compatível que não devolve contagem de tokens:** o teto mensal não pode ficar cego; estima `ceil(caracteres/4)` quando o provedor não informa. Teste na Task 2.
4. **Stream interrompido (pessoa fecha a aba ou o provedor corta):** o uso é registrado mesmo assim, com o que foi contado até ali. Teste na Task 2 (`aoTerminar` chamado no `cancel`).
5. **URL base apontando para rede interna ou com redirecionamento:** `http://`, `localhost`, IP privado, IPv6 literal, `*.local`/`*.internal`, credencial na URL e resposta 3xx são recusados. Teste na Task 2 (`validarUrlBase` e `redirect: "manual"`) e CHECK na Task 1.

---

### Task 1: Banco (permissões, `ia_config`, `ia_uso`, funções) + baseline

**Agente:** `dev-banco-supabase` · **Revisão:** `revisor-seguranca-idjuv`

**Files:**
- Create: `supabase/migrations/20261012200000_ia_config_gateway.sql`
- Modify: `supabase/baseline/schema/*` (regenerado), `supabase/baseline/rls/mapa.csv`, `supabase/baseline/overlay/40_privilegios.sql`, `scripts/db/testar-rls.sql`
- Copy: spec para `docs/superpowers/specs/2026-10-11-ia-compras-design.md` e este plano para `docs/superpowers/plans/2026-10-11-ia-compras-fase1.md`

**Interfaces (Produces):**
- Permissões em `module_permissions_catalog`: `('compras','ia.usar','Usar assistente de IA','IA','usar',<próximo sort_order de compras>)` e `('admin','ia.configurar','Configurar IA da instituição','IA','configurar',514)`.
- `public.ia_config` (linha única, `id boolean PRIMARY KEY DEFAULT true CHECK (id)`):
  `ativo boolean NOT NULL DEFAULT false`, `provedor text CHECK (provedor IN ('openai','anthropic','gemini','compativel_openai'))`,
  `url_base text` (CHECK `^https://[A-Za-z0-9.-]+(:[0-9]{2,5})?(/[A-Za-z0-9._~/-]*)?$`, até 300 caracteres; obrigatória se e só se `provedor='compativel_openai'`),
  `modelo text CHECK (modelo ~ '^[A-Za-z0-9._:/@-]{1,120}$')`, `limite_chamadas_hora int NOT NULL DEFAULT 30 CHECK (1..1000)`,
  `teto_tokens_mes bigint CHECK (> 0)` (nulo = sem teto), `enviar_dados_pessoais boolean NOT NULL DEFAULT false`,
  `segredo_id uuid`, `segredo_final text CHECK (char_length = 4)`, `segredo_atualizado_em timestamptz`, `updated_by`, `created_at`, `updated_at`;
  CHECK `NOT ativo OR (provedor IS NOT NULL AND modelo IS NOT NULL AND segredo_id IS NOT NULL)`.
- Privilégios de coluna como `config_envio`: `segredo_id` nunca legível; `segredo_*` não graváveis pela API; sem DELETE.
- Trigger `fixar_autoria_ia_config()`: fixa `updated_by/updated_at/created_at`; se `provedor` ou `url_base` mudar, zera `segredo_id`, `segredo_final`, `segredo_atualizado_em` **e** `ativo`.
- `public.ia_uso` (`id uuid`, `user_id uuid`, `recurso text CHECK ~ '^[a-z0-9_]{2,40}$'`, `provedor text`, `modelo text`, `tokens_entrada int`, `tokens_saida int`, `tokens_estimados boolean`, `status text CHECK IN ('ok','erro','cortado')`, `created_at timestamptz DEFAULT now()`), índice em `created_at`. SELECT só `pode_configurar_ia()`; nenhuma escrita pela API (grava o `service_role`).
- Funções (todas `SECURITY DEFINER`, `search_path = public`):
  - `pode_configurar_ia() → boolean`: `perfil_ativo_atual() AND has_permission_code(auth.uid(),'ia.configurar')`. EXECUTE `authenticated`.
  - `pode_usar_ia() → boolean`: `perfil_ativo_atual() AND can_access_module(auth.uid(),'compras') AND has_permission_code(auth.uid(),'ia.usar')`. EXECUTE `authenticated`.
  - `ia_disponivel() → boolean`: `pode_usar_ia()` e `ia_config.ativo`. EXECUTE `authenticated`.
  - `salvar_chave_ia(p_chave text) → timestamptz`: exige `pode_configurar_ia()`, config salva com provedor, chave de 8 a 4096 caracteres sem espaço nas pontas; Vault com nome `ia_chave_api` (cria ou atualiza, mesmo padrão de `salvar_segredo_envio`); grava `segredo_final = right(p_chave,4)`. EXECUTE `authenticated`.
  - `resumo_uso_ia_mes() → jsonb` `{chamadas, tokens_entrada, tokens_saida, teto_tokens_mes}` do mês corrente, contado por `date_trunc('month', now())` em UTC (documentar na função). Exige `pode_configurar_ia()`. EXECUTE `authenticated`.
  - `ia_config_servidor() → jsonb`: config sem `segredo_id` + `chave` decifrada + `tokens_mes` (soma do mês). EXECUTE só `service_role`.
- Incluir `pode_configurar_ia|pode_usar_ia` na regex de funções revisadas do `testar-rls.sql:1078`.

- [ ] **Step 1: Testes de RLS primeiro** em `scripts/db/testar-rls.sql`, no estilo das seções existentes:
  - `authenticated` sem `ia.configurar` lê 0 linhas de `ia_config` e `ia_uso` e recebe erro em `salvar_chave_ia`;
  - com `ia.configurar`: lê a config, não lê `segredo_id` (erro de privilégio), não consegue `UPDATE ... SET segredo_id`;
  - `UPDATE ia_config SET provedor = <outro>` após `salvar_chave_ia` deixa `segredo_id`, `segredo_final` nulos e `ativo = false`;
  - `ia_config_servidor()` e `INSERT INTO ia_uso` negados a `authenticated`;
  - `ia_disponivel()` é false sem `ia.usar`, false com IA desligada, true com os dois.
- [ ] **Step 2:** `bash scripts/db/validar-migracoes.sh` sem a migração e confirmar que os testes novos falham (tabela inexistente).
- [ ] **Step 3:** escrever a migração com o conteúdo das Interfaces.
- [ ] **Step 4:** replay + baseline: `bash scripts/db/validar-migracoes.sh` (0 falhas), `PG_DB=idjuv_validacao bash scripts/db/gerar-baseline.sh`, linhas `ia_config`/`ia_uso` no `mapa.csv` com classe `preservar` (como `config_envio`), REVOKE/GRANT no overlay 40, depois `PG_REPLAY=idjuv_validacao bash scripts/db/validar-baseline.sh` → `APROVADO` com schema/storage/ACL iguais, e `testar-rls.sql` sem falhas nos dois bancos.
- [ ] **Step 5:** commit `Banco: configuração de IA por instituição (chave no Vault) e registro de uso`.

### Task 2: Adaptadores de provedor (`_shared/ia`)

**Agente:** `dev-banco-supabase` · **Revisão:** `revisor-seguranca-idjuv`

**Files:**
- Create: `supabase/functions/_shared/ia/provedores.ts`, `supabase/functions/_shared/ia/url.ts`, `supabase/functions/_shared/ia/provedores.test.ts`, `supabase/functions/_shared/ia/url.test.ts`

**Interfaces (Produces):**
```ts
export type ProvedorIA = "openai" | "anthropic" | "gemini" | "compativel_openai";
export interface ConfigProvedor { provedor: ProvedorIA; url_base: string | null; modelo: string; chave: string }
export interface PedidoIA { sistema: string; prompt: string; maxTokens: number }
export interface UsoIA { tokensEntrada: number; tokensSaida: number; estimado: boolean; cortado: boolean }
export interface RespostaIA extends UsoIA { texto: string }
export class ErroProvedor extends Error { constructor(public status: number, mensagem: string) }
export function gerarTexto(cfg: ConfigProvedor, p: PedidoIA, f?: typeof fetch): Promise<RespostaIA>;
// SSE no formato que o front já lê: `data: {"choices":[{"delta":{"content":"..."}}]}` e `data: [DONE]`
export function gerarStream(cfg: ConfigProvedor, p: PedidoIA, aoTerminar: (u: UsoIA) => void, f?: typeof fetch): Promise<ReadableStream<Uint8Array>>;
export function validarUrlBase(url: string): string | null; // mensagem de erro ou null
```
Detalhes que o implementador não deduz:
- OpenAI: `https://api.openai.com/v1/chat/completions`; compatível: `${url_base sem / final}/chat/completions`. `Authorization: Bearer`. `max_tokens` = `maxTokens`; stream com `stream_options: {include_usage: true}`. Cortado = `finish_reason === "length"`.
- Anthropic: `https://api.anthropic.com/v1/messages`, headers `x-api-key` e `anthropic-version: 2023-06-01`, `system` separado. Uso em `message_start.message.usage.input_tokens` e `message_delta.usage.output_tokens`. Cortado = `stop_reason === "max_tokens"`.
- Gemini: `.../v1beta/models/{modelo}:generateContent` e `:streamGenerateContent?alt=sse`, chave no header `x-goog-api-key` (nunca na URL, ao contrário do código atual). Uso em `usageMetadata`. Cortado = `finishReason === "MAX_TOKENS"`. Reaproveitar a tradução SSE de `cpsi-ai-assistant/index.ts:41`.
- Todo `fetch` com `redirect: "manual"`; status 3xx vira `ErroProvedor(502, ...)`. Timeout de 120 s (`AbortSignal.timeout`).
- Erro do provedor: `ErroProvedor(status, "O provedor de IA recusou o pedido (HTTP <status>)")`, com sufixo "confira a chave" em 401/403 e "limite do provedor" em 429. Nunca inclui o corpo da resposta.
- Sem contagem do provedor: `ceil((sistema+prompt).length/4)` e `ceil(texto.length/4)` com `estimado: true`.
- `aoTerminar` é chamado uma única vez: no fim do stream, no erro ou no `cancel()`.
- `validarUrlBase` recusa: esquema diferente de `https:`, usuário/senha, query ou fragmento, `localhost`, `*.localhost`, `*.local`, `*.internal`, IPv6 literal, IPv4 em 0/8, 10/8, 100.64/10, 127/8, 169.254/16, 172.16/12, 192.168/16.

- [ ] **Step 1: testes** com `fetch` falso (função que registra o `Request` e devolve fixture):
  - por provedor: URL chamada, header de chave correto e chave ausente da URL; texto e tokens lidos; `cortado` mapeado;
  - stream de cada provedor convertido para o SSE do front, terminando em `data: [DONE]`, com `aoTerminar` recebendo os tokens;
  - `cancel()` do stream chama `aoTerminar` uma vez;
  - 401 → `ErroProvedor` com status 401 e mensagem sem o corpo; 302 → `ErroProvedor(502)`;
  - provedor compatível sem `usage` → `estimado: true` e contagem por caracteres;
  - `validarUrlBase`: aceita `https://openrouter.ai/api/v1`; recusa cada caso da lista acima.
- [ ] **Step 2:** `npx -y deno@2.1.4 test supabase/functions/_shared/ia/` → falha (módulos inexistentes).
- [ ] **Step 3:** implementar `provedores.ts` e `url.ts`.
- [ ] **Step 4:** `npx -y deno@2.1.4 test supabase/functions/_shared/ia/` → todos passam; `rm -f deno.lock`.
- [ ] **Step 5:** commit `Edge Functions: adaptadores de IA multi-provedor (OpenAI, Anthropic, Gemini e compatíveis)`.

### Task 3: Edge Function `ia-gateway` (substitui `cpsi-ai-assistant`)

**Agente:** `dev-banco-supabase` · **Revisão:** `revisor-seguranca-idjuv`

**Files:**
- Create: `supabase/functions/ia-gateway/index.ts`, `supabase/functions/_shared/ia/recursos/cpsi.ts`
- Delete: `supabase/functions/cpsi-ai-assistant/` (e a entrada em `supabase/config.toml`, se houver)

**Interfaces:**
- Consumes: Task 1 (`pode_usar_ia`, `pode_configurar_ia`, `ia_config_servidor`, `ia_uso`, `consumir_cota_uso`), Task 2 (todo o `_shared/ia`).
- Produces, `POST /functions/v1/ia-gateway`:
  - `{ recurso: "cpsi", action, documentType, context?, fieldName?, fieldLabel?, currentValue?, formData? }`: mesmas entradas, validações (`LIMITE_CAMPO` 10000, `LIMITE_TOTAL` 60000, 60 entradas) e respostas da `cpsi-ai-assistant` atual (`{fields}`, `{value}`, stream no `review`), para o front só trocar o nome da função;
  - `{ recurso: "testar" }`: exige `pode_configurar_ia()`; chamada mínima (`maxTokens` 16) e resposta `{ ok: true, provedor, modelo }`. Funciona com a IA desligada (para testar antes de ligar).
  - Erros (JSON `{ error, codigo }`): 401 sem sessão; 403 `sem_permissao`; 409 `ia_desligada` ("A IA não está habilitada nesta instituição"); 429 `cota_hora` ou `teto_mes`; 422 `cortado`; 502 `provedor` (mensagem do `ErroProvedor`); 500 genérico.
- `export function prepararCpsi(body): { erro: string } | { pedido: PedidoIA; stream: boolean; tratar: (texto: string) => unknown }` em `recursos/cpsi.ts`: os prompts, a lista de campos e o parse de JSON que hoje estão em `cpsi-ai-assistant/index.ts`, movidos sem mudar o texto.

Ordem fixa no handler: CORS allowlist (`ALLOWED_ORIGINS`) → sessão → permissão (`pode_usar_ia` pelo cliente da pessoa; `pode_configurar_ia` no `testar`) → validação do corpo → `ia_config_servidor()` → desligada? 409 → `tokens_mes >= teto_tokens_mes`? 429 → `consumir_cota_uso(uid, 'ia', 1, limite_chamadas_hora, 'compras', 'IA: '||recurso)` → provedor → `INSERT ia_uso` (inclusive em erro e cortado; no stream, pelo `aoTerminar`, sem `await` bloqueando a resposta).

- [ ] **Step 1:** mover a lógica da CPSI para `recursos/cpsi.ts` e escrever `ia-gateway/index.ts`.
- [ ] **Step 2:** `npx -y deno@2.1.4 check supabase/functions/ia-gateway/index.ts` e `npx -y deno@2.1.4 test supabase/functions/_shared/ia/` sem erros; `rm -f deno.lock`.
- [ ] **Step 3:** conferir com `rg -n "chave|segredo" supabase/functions/ia-gateway supabase/functions/_shared/ia` que nenhum `console.*` ou corpo de resposta inclui a chave ou o texto do pedido.
- [ ] **Step 4:** commit `Edge Functions: ia-gateway com permissão, cota, teto mensal e registro de uso; CPSI migrada`.

### Task 4: Tela `/admin/ia`

**Agente:** `dev-frontend-idjuv` (com skill `ui-ux-pro-max`) · **Revisão:** `revisor-codigo-idjuv`

**Files:**
- Create: `src/types/ia.ts`, `src/hooks/useConfigIA.ts`, `src/pages/admin/ConfigIAPage.tsx`
- Modify: `src/App.tsx` (rota ao lado de `/admin/envios`, `App.tsx:557`), `src/types/auth.ts` (`'/admin/ia': 'ia.configurar'` junto de `/admin/envios`, `auth.ts:111`), `src/config/menu.config.ts` (perto de `:1245`), `src/config/module-menus.config.ts` (perto de `:325`)

**Interfaces (Produces):**
- `src/types/ia.ts`: `ProvedorIA`, `ConfigIA` (colunas legíveis de `ia_config`), `ResumoUsoIA`.
- `src/hooks/useConfigIA.ts`: `useConfigIA()`, `useSalvarConfigIA()` (upsert `id: true`), `useSalvarChaveIA()` (RPC `salvar_chave_ia`), `useTestarIA()` (`functions.invoke("ia-gateway", {body:{recurso:"testar"}})`, lendo o corpo do erro como em `useAICPSI.ts`), `useResumoUsoIA()` (RPC `resumo_uso_ia_mes`), `useIADisponivel()` (RPC `ia_disponivel`, `staleTime` 5 min). Mesmo estilo de `useConfigEnvio.ts`.
- Rota: `<ProtectedRoute requiredPermissions="ia.configurar"><ConfigIAPage /></ProtectedRoute>`.

Conteúdo da tela, no padrão de `ConfigEnviosPage.tsx`:
- formulário zod: ligar/desligar, provedor, URL base (só para "Compatível com OpenAI", com a mesma regra do CHECK), modelo (placeholder de exemplo), limite por pessoa por hora, teto mensal de tokens (vazio = sem teto), "Permitir envio de dados pessoais ao provedor" (desligado);
- cartão da chave: "Chave cadastrada em dd/mm/aaaa, final ••••1234" ou "Nenhuma chave cadastrada"; campo de senha + "Salvar chave"; aviso fixo "Trocar o provedor ou a URL apaga a chave e desliga a IA";
- "Testar conexão" com o resultado (provedor e modelo, ou a mensagem de erro);
- uso do mês: chamadas, tokens de entrada e saída e o teto;
- o interruptor "ligar" fica desabilitado enquanto não houver chave, com o motivo ao lado.

- [ ] **Step 1:** implementar tipos, hook, página, rota, `ROUTE_PERMISSIONS` e menus.
- [ ] **Step 2:** `bash scripts/gate.sh` verde.
- [ ] **Step 3:** `bun run dev` + Playwright (Chromium do ambiente): a página renderiza em 390 px e em desktop sem rolagem horizontal; trocar o provedor para "Compatível com OpenAI" mostra a URL base; URL `http://...` mostra erro de validação. Sem Supabase no ambiente, conferir com os estados de carregamento/erro e registrar isso na PR.
- [ ] **Step 4:** commit `Admin: tela de configuração de IA (provedor, chave, limites e uso do mês)`.

### Task 5: CPSI no gateway e botões condicionados

**Agente:** `dev-frontend-idjuv` · **Revisão:** `revisor-codigo-idjuv`

**Files:**
- Modify: `src/hooks/useAICPSI.ts:33` e `:114` (`cpsi-ai-assistant` → `ia-gateway`, corpo com `recurso: "cpsi"`), `src/pages/formularios/CPSIPage.tsx` (botões de `:82` e `:93` e os de preencher campo)

**Interfaces:** Consumes `useIADisponivel()` (Task 4) e o contrato do `ia-gateway` (Task 3).

- [ ] **Step 1:** trocar as duas chamadas e esconder todos os botões de IA quando `useIADisponivel().data !== true` (o formulário continua funcionando sem IA). Mensagem do 409 e do 429 mostrada no toast como já é feito com o corpo do erro.
- [ ] **Step 2:** `rg -n "cpsi-ai-assistant" src supabase docs` só encontra a nota histórica da documentação.
- [ ] **Step 3:** `bash scripts/gate.sh` verde.
- [ ] **Step 4:** commit `CPSI: IA pelo ia-gateway e botões só quando a IA está disponível`.

### Task 6: Documentação, revisão final e PR

**Agentes:** `documentador-idjuv`, depois `revisor-codigo-idjuv` e `revisor-seguranca-idjuv` no diff inteiro.

**Files:**
- Modify: `docs/EDGE_FUNCTIONS.md` (seção de IA: `ia-gateway`, contrato, erros, adaptadores; `cpsi-ai-assistant` removida; `GEMINI_API_KEY`/`GEMINI_MODEL` deixam de ser usados), `docs/RBAC_PERMISSOES.md` (`ia.usar`, `ia.configurar`), `docs/BANCO_DE_DADOS.md` (`ia_config`, `ia_uso`, funções), `docs/planejamento/ROADMAP.md` (fase 1 feita, fases 2 a 4 previstas), outros que a matriz de `docs/GOVERNANCA_DOCUMENTACAO.md` §3 cobrar.

- [ ] **Step 1:** docs atualizadas.
- [ ] **Step 2:** revisões; corrigir bloqueantes.
- [ ] **Step 3:** `bash scripts/gate.sh` verde, replay e baseline de novo (APROVADO), `deno test` verde.
- [ ] **Step 4:** push na branch e PR **rascunho** com o template do repositório, incluindo os passos pós-merge abaixo.

**Passos pós-merge (Fabiano, fora do código):**
1. Deploy de `ia-gateway` e remoção da `cpsi-ai-assistant` no Supabase (`supabase functions delete cpsi-ai-assistant`).
2. Em `/admin/ia`: escolher o provedor, cadastrar a chave (pode ser a mesma do Gemini de hoje), testar e ligar.
3. Dar a permissão `ia.usar` a quem é de compras.
4. Depois de confirmar que funciona, apagar os secrets `GEMINI_API_KEY` e `GEMINI_MODEL`.

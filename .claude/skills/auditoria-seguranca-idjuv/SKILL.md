---
name: auditoria-seguranca-idjuv
description: Checklist de segurança específico do IDJUV Governa Hub (RLS, RBAC, Edge Functions, XSS, secrets) baseado nos achados já mapeados do projeto. Use antes de um release, ao revisar um PR grande, periodicamente, ou quando o usuário pedir "auditoria de segurança", "revisão de segurança" ou "checagem antes de vender/publicar". Para revisão genérica de diff, prefira o skill `security-review`; este skill complementa com os riscos específicos já conhecidos deste repositório.
---

# Auditoria de segurança — IDJUV Governa Hub

Este projeto tem um histórico de achados documentado em
`docs/AUDITORIA_USUARIOS.md`. Este skill converte esses achados (e os da
última análise de código) num checklist recorrente, para pegar regressões —
não para redescobrir os mesmos problemas do zero toda vez.

## Checklist

### 1. `ProtectedRoute` não regrediu para "acesso total"
Leia `src/components/auth/ProtectedRoute.tsx`. Deve validar
`requiredModule`/`requiredPermissions` via `hasPermission`/`hasAnyPermission`
do `AuthContext`, com bypass só para super admin. Se alguém "simplificou"
isso de volta para liberar todo autenticado, é uma regressão crítica — pare e
avise o usuário antes de qualquer outra coisa.

### 2. RLS em todas as tabelas
Via MCP do Supabase: rode `get_advisors` (categoria segurança) e trate
qualquer tabela com RLS desabilitado ou sem policy de escrita restritiva como
bloqueante. Compare contra `docs/RLS_USUARIOS_PROPOSTA.sql` — se ainda não foi
aplicado, é pendência conhecida (item C2 da auditoria), reporte o status.

### 3. Edge Functions com ação privilegiada checam identidade
Para cada arquivo em `supabase/functions/*/index.ts` que usa
`SUPABASE_SERVICE_ROLE_KEY`: confirme que há checagem de
`authHeader`/`auth.getUser()` **antes** de usar o client com service role, e
que há verificação de role/permissão (não só "está autenticado") quando a
ação é sensível (criar/deletar usuário, expor schema, chamar API paga).
Últimas funções sinalizadas como faltando essa checagem:
`database-schema` (expõe schema completo do banco) e `cpsi-ai-assistant`
(chama IA paga sem checar usuário/limite) — confirme se ainda está pendente
antes de reportar como resolvido.

### 4. HTML de conteúdo editorial é sanitizado
Grep por `dangerouslySetInnerHTML` em `src/`. Cada ocorrência (notícias, CMS,
`RichTextEditor`) deve passar o HTML por um sanitizador (ex. DOMPurify) antes
de renderizar. Se o conteúdo vier de `conteudo`/campos de notícia/CMS
editados por usuários com menor privilégio que admin, trate como
prioridade alta.

### 5. Sem segredo hardcoded
Grep por padrões de chave/token/senha em `src/` e `supabase/functions/`
(strings longas em atribuições a `_KEY`, `_SECRET`, `_TOKEN`, `password =`).
Segredos devem vir de `Deno.env.get(...)` (edge functions) ou `VITE_*` em
`.env` (client) — nunca literal no código.

### 6. Dependências de produção com CVE conhecido
Rode `npm audit --production`. Preste atenção especial em `jspdf` e `xlsx`
(usados para gerar documentos oficiais e exportações — dado sensível passa
por eles) — confirme se já foram atualizados/mitigados desde a última
checagem.

### 7. Multi-cliente: isolamento entre instâncias
Quando o onboarding de novos clientes (`onboarding-cliente-idjuv`) estiver
ativo: confirme que nenhuma credencial/URL de um cliente vaza para outro
(env vars, logs, Storage buckets) e que `protected-users.config.ts` e
qualquer lista hardcoded do IDJUV não foi copiada literalmente para outra
instância.

## Como reportar

Liste os achados por severidade (crítico → baixo), cada um com arquivo:linha
quando aplicável, e diga explicitamente **o que já estava resolvido** desde a
última auditoria vs. **o que é regressão nova** vs. **o que é pendência
antiga ainda não endereçada** — isso é mais útil para o time do que uma lista
plana.

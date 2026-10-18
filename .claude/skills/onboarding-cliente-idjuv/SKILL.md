---
name: onboarding-cliente-idjuv
description: Gera o pacote de provisionamento de uma nova instância do Governa Hub para outra instituição cliente (checklist de novo projeto Supabase, aplicação do schema base, perfil de configuração — branding, módulos habilitados, variáveis de ambiente). Use quando o usuário falar em "vender para outra instituição/prefeitura/secretaria", "nova instância", "onboarding de cliente", "white-label" ou "instalar o sistema para outro órgão".
---

# Onboarding de novo cliente (nova instância) — Governa Hub

Modelo adotado: **uma instância isolada por instituição** (projeto Supabase
próprio + deploy próprio), não banco compartilhado multi-tenant. Cada cliente
novo é, na prática, um "deploy" deste mesmo repositório com: banco vazio
provisionado a partir do baseline (`supabase/baseline/`), e um perfil de
configuração próprio (nome, marca, módulos contratados). Este skill produz esse
pacote — ele não inventa arquitetura nova, apenas segue o que já está
documentado em `docs/NOVO_BANCO.md` (banco novo e vazio pelo baseline, com RLS
por módulo), `docs/WHITE_LABEL.md` e `tenants/README.md`, formalizando como um
processo repetível. O antigo guia de Supabase próprio e o dump parcial do schema
estão em `docs/historico/` e **não** reconstroem o sistema atual: não os use.

## O que ainda falta no código para isso ser "produto" (avise o usuário se
faltar, não assuma que já existe)

Antes de gerar o pacote, verifique rapidamente se estes pontos de
hardcode-por-cliente do IDJUV já foram generalizados. Se não, isso é
pré-requisito, não algo o onboarding resolve sozinho:

- `src/shared/config/protected-users.config.ts` — usuários protegidos
  hardcoded do IDJUV; precisa virar dado de configuração por instância, não
  código.
- Nome/marca "IDJUV" hardcoded em textos de UI, PDFs (`src/lib/pdf*.ts`,
  `pdfLogos.ts`), e-mails/templates, título da aba (`index.html`), favicon,
  manifest do PWA (`vite-plugin-pwa`).
- Módulos contratados: `MODULOS` em `modules.config.ts` é o catálogo; o que a
  instância contratou vem de `modulos` no perfil do tenant
  (`tenants/<slug>/tenant.config.ts`), lido por `moduloHabilitado`. O
  `ProtectedRoute` devolve 404 para rota de módulo não contratado e
  `<ModuloHabilitado>` faz o mesmo nos formulários públicos. Confira se o menu
  e os painéis também respeitam a lista antes de prometer isso ao cliente.
- Textos institucionais específicos do IDJUV em páginas públicas
  (transparência, cadastro de gestores/árbitros) que fariam sentido só para
  esse cliente.

Se o usuário quiser seguir mesmo assim (ex. para o primeiro cliente-piloto
novo, aceitando customização manual pontual), gere o pacote e liste essas
pendências como itens de acompanhamento — não bloqueie.

## Pacote de provisionamento a gerar

### 1. Checklist de infraestrutura (documento, não código)
- Subir uma instância Supabase própria do cliente (self-hosted, como o IDJUV, ou
  projeto na nuvem), trocando todos os segredos de exemplo
  (`docs/NOVO_BANCO.md` §3).
- Validar o baseline num Postgres local (`bash scripts/db/validar-baseline.sh`)
  e aplicá-lo no banco vazio com `supabase/baseline/aplicar.sh`
  (`docs/NOVO_BANCO.md` §2 e §4). O baseline cria tabelas, funções, RLS por
  módulo e os buckets do Storage numa única transação.
- Criar e promover o primeiro administrador com
  `supabase/baseline/bootstrap-admin.sql` (`docs/NOVO_BANCO.md` §5).
- Rodar as conferências de `docs/NOVO_BANCO.md` §7 (RLS ligado em toda tabela,
  sem policy "acesso total", `anon` só com as RPCs públicas) antes de abrir para
  usuários.
- Edge Functions e seus segredos: `docs/NOVO_BANCO.md` §6 e
  `docs/EDGE_FUNCTIONS.md` (inclui `ALLOWED_ORIGINS` com os endereços do front
  do cliente).
- Deploy separado do front, publicado pelo workflow `deploy-front.yml` (fork ou
  ambiente próprio): pelo Coolify com o `Dockerfile` da raiz (dois apps,
  `MODO=sistema` e `MODO=site`) ou por `rsync` para o nginx, com as variáveis
  `VITE_*` do cliente (ver `docs/DESENVOLVIMENTO.md`, "Deploy do front").
- Backup fora do servidor desde o primeiro dia (`docs/BACKUP.md`).

### 2. Variáveis de ambiente do cliente (`.env` do novo deploy)
```env
VITE_SUPABASE_URL=https://<url-da-instancia-do-cliente>
VITE_SUPABASE_PUBLISHABLE_KEY=<anon_key_cliente>
VITE_SUPABASE_PROJECT_ID=<vazio no self-hosted>
VITE_TENANT_SLUG=<slug-cliente>
```

### 3. Perfil de configuração do cliente
Crie `tenants/<slug-cliente>/` a partir de `tenants/_template/` (ver
`tenants/README.md`) com:
- Nome da instituição, sigla, cores de marca, logo.
- Lista de módulos contratados (subconjunto de `MODULOS`).
- Domínio/URL de acesso.
- Responsável técnico do lado do cliente.
A identidade oficial (nome do sistema, CNPJ, endereço, dirigente, contato) é
cadastrada depois pelo próprio cliente em `/admin/configuracao-cliente`
(`docs/CONFIGURACAO_CLIENTE.md`).

### 4. Dados de exemplo/seed (opcional)
Se o cliente quiser dados de exemplo para treinamento, gere INSERTs mínimos
(estrutura organizacional básica, um usuário de teste por perfil) — nunca
copie dados reais do IDJUV para outra instância.

## Não faça

- Não aponte dois clientes para o mesmo projeto Supabase "temporariamente".
- Não copie dados de servidores/folha de pagamento reais do IDJUV para uma
  instância de outro cliente, nem para ambiente de teste.
- Não gere credenciais e as imprima em texto puro em um arquivo que possa ser
  commitado — entregue como checklist para o usuário preencher, não gere
  segredo nenhum você mesmo.

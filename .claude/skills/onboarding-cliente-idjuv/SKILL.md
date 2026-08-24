---
name: onboarding-cliente-idjuv
description: Gera o pacote de provisionamento de uma nova instância do Governa Hub para outra instituição cliente (checklist de novo projeto Supabase, aplicação do schema base, perfil de configuração — branding, módulos habilitados, variáveis de ambiente). Use quando o usuário falar em "vender para outra instituição/prefeitura/secretaria", "nova instância", "onboarding de cliente", "white-label" ou "instalar o sistema para outro órgão".
---

# Onboarding de novo cliente (nova instância) — Governa Hub

Modelo adotado: **uma instância isolada por instituição** (projeto Supabase
próprio + deploy próprio), não banco compartilhado multi-tenant. Cada cliente
novo é, na prática, um "deploy" deste mesmo repositório com: banco vazio
provisionado a partir do schema base, e um perfil de configuração próprio
(nome, marca, módulos contratados). Este skill produz esse pacote — ele não
inventa arquitetura nova, apenas segue o que já está documentado em
`docs/MIGRACAO_SUPABASE_PROPRIO.md` e `docs/SCHEMA_SUPABASE_PROPRIO.sql`,
formalizando como um processo repetível.

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
- `MODULOS` em `modules.config.ts` é uma lista fixa de 17 módulos — para
  "módulos contratados por cliente" funcionar de verdade, precisa de uma
  camada de config (ex. tabela `instancia_config` ou variável de ambiente)
  que decide quais módulos aparecem no menu/rotas para aquele deploy,
  em vez de todos sempre habilitados.
- Textos institucionais específicos do IDJUV em páginas públicas
  (transparência, cadastro de gestores/árbitros) que fariam sentido só para
  esse cliente.

Se o usuário quiser seguir mesmo assim (ex. para o primeiro cliente-piloto
novo, aceitando customização manual pontual), gere o pacote e liste essas
pendências como itens de acompanhamento — não bloqueie.

## Pacote de provisionamento a gerar

### 1. Checklist de infraestrutura (documento, não código)
- Criar projeto novo no Supabase (nome sugerido: `<slug-cliente>-governa-hub`).
- Aplicar `docs/SCHEMA_SUPABASE_PROPRIO.sql` no SQL Editor do projeto novo (ou
  via MCP `apply_migration`/`execute_sql` se a sessão tiver acesso ao projeto
  do cliente).
- Rodar `get_advisors` no projeto novo antes de ir para produção — confirma
  que todo o RLS do schema base está ativo lá também.
- Criar o primeiro usuário super_admin do cliente (via
  `supabase/functions/admin-create-user` ou painel do Supabase).
- Configurar Storage buckets equivalentes aos usados no projeto original
  (ver `supabase/config.toml` e usos de `supabase.storage` no código).
- Deploy separado (Vercel — novo projeto Vercel apontando para o mesmo repo
  ou um fork, com env vars próprias).

### 2. Variáveis de ambiente do cliente (`.env` do novo deploy)
```env
VITE_SUPABASE_URL=https://<PROJECT_ID_CLIENTE>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon_key_cliente>
VITE_SUPABASE_PROJECT_ID=<PROJECT_ID_CLIENTE>
```

### 3. Perfil de configuração do cliente
Gere um resumo (a formalizar futuramente como arquivo de config real, ver
lacuna acima) com:
- Nome da instituição, sigla, cores de marca, logo.
- Lista de módulos contratados (subconjunto de `MODULOS`).
- Domínio/URL de acesso.
- Responsável técnico do lado do cliente.

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

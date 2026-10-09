# E-mails do Supabase Auth

Os e-mails que o Supabase Auth (GoTrue) envia — confirmação de cadastro, convite, link mágico,
redefinição de senha, troca de e-mail e código de reautenticação — seguem o design system
([spec](./superpowers/specs/2026-10-09-design-system-design.md)): neutros e estados do
`src/index.css`, marca e identidade do perfil do tenant, contraste WCAG AA no claro e no escuro.
A fonte pedida é a IBM Plex Sans, mas o e-mail não baixa fonte (a maioria dos clientes bloqueia):
ela só aparece se estiver instalada; senão cai na fonte de sistema (Segoe UI, Roboto, Helvetica).

## Onde ficam

| Arquivo | O que é |
|---|---|
| `scripts/emails/gerar-templates-email.ts` | Gerador (fonte da verdade do layout e dos textos) |
| `tenants/<slug>/emails/*.html` | Templates gerados por tenant — **não edite à mão** |
| `tenants/<slug>/emails/docker-compose.emails.yml` | Assuntos + URL de cada template para o serviço `auth` |

| Template | Variável do GoTrue | Link do botão (`type`) | Placeholders usados |
|---|---|---|---|
| `confirmacao.html` | `CONFIRMATION` | `signup` | `.SiteURL`, `.TokenHash`, `.Email` |
| `convite.html` | `INVITE` | `invite` | `.SiteURL`, `.TokenHash`, `.Email` |
| `link-magico.html` | `MAGIC_LINK` | `magiclink` | `.SiteURL`, `.TokenHash` |
| `recuperacao-senha.html` | `RECOVERY` | `recovery` | `.SiteURL`, `.TokenHash`, `.Email` |
| `troca-email.html` | `EMAIL_CHANGE` | `email_change` | `.SiteURL`, `.TokenHash`, `.Email`, `.NewEmail` |
| `reautenticacao.html` | `REAUTHENTICATION` | — (só código) | `.Token` |

## Para onde os links levam

O botão de cada e-mail abre `{{ .SiteURL }}/auth?token_hash=…&type=…`, e a tela de acesso
(`src/pages/AuthPage.tsx`) valida o token com `supabase.auth.verifyOtp`. Não usamos o
`{{ .ConfirmationURL }}` do GoTrue porque ele gasta o token no primeiro acesso: filtros de e-mail
corporativos que "visitam" links queimavam o link antes da pessoa clicar. Na tela:

| `type` | O que a pessoa vê |
|---|---|
| `recovery` | "Redefinir senha" → nova senha → volta para o login |
| `invite` | "Crie sua senha" → primeira senha → volta para o login |
| `signup`, `magiclink`, `email_change` | Aviso de sucesso e entrada direta no sistema |
| Link inválido, usado ou expirado (inclusive `#error_code=otp_expired` do GoTrue) | Mensagem clara e o formulário para pedir um novo e-mail |

Links antigos (com `#access_token` ou `?code=`) continuam funcionando.

**Pré-requisito:** o `SITE_URL` do Supabase (vira `GOTRUE_SITE_URL` no serviço `auth`) tem que
ser o endereço do app, `https://idjuv.online`, sem barra no fim. Se apontar para outro lugar, os
botões dos e-mails levam para lá.

Todos usam `.Data.full_name` na saudação (`user_metadata.full_name`, gravado pelo `signUp` em
`src/contexts/AuthContext.tsx`); quando ausente, a saudação fica só "Olá.".

Hoje o app dispara de fato **recuperação de senha** (`resetPasswordForEmail`) e **confirmação**
(`signUp`, se a confirmação de e-mail estiver ligada no GoTrue). Convite, link mágico, troca de
e-mail e reautenticação ficam prontos para quando forem usados (o `admin-create-user` cria o
usuário já confirmado, sem convite).

O cabeçalho é tipográfico (sigla + "Sistema de gestão"), sem imagem: não depende de URL pública
de logo e não quebra em cliente que bloqueia imagens.

## Mudar layout ou texto

1. Edite `scripts/emails/gerar-templates-email.ts` (ou o perfil do tenant / os tokens do
   `src/index.css` — o gerador relê os dois).
2. Gere: `bun scripts/emails/gerar-templates-email.ts` (ou `npm run emails:gerar`, que usa bun).
   O gerador falha se algum par de cores ficar abaixo de 4,5:1.
3. Confira que nada ficou para trás: `bun scripts/emails/gerar-templates-email.ts --check`.
4. Commite os `.html` gerados junto com a mudança e reaplique na VPS (abaixo).

O `--check` **não roda no gate nem no CI** (depende de bun para importar o perfil do tenant):
regenerar após mudar tokens ou perfil é convenção, cobrada na matriz de
[`GOVERNANCA_DOCUMENTACAO.md`](./GOVERNANCA_DOCUMENTACAO.md).

## Aplicar na VPS (Supabase self-hosted)

O Studio self-hosted não tem editor de templates; o GoTrue lê cada template de uma **URL HTTP**
definida em `GOTRUE_MAILER_TEMPLATES_*`. O caminho sugerido usa o próprio Storage:

0. **Confira o `SITE_URL`** no `.env` do Supabase: `SITE_URL=https://idjuv.online`.
1. **Bucket público `emails`** — no Studio (`bd.idjuv.online`) → Storage → *New bucket* `emails`,
   marcado como público. Envie os seis `.html` de `tenants/idjuv/emails/`. Os templates não
   contêm dado pessoal: os dados do destinatário só entram na hora do envio.
2. **Override do compose** — copie `tenants/idjuv/emails/docker-compose.emails.yml` para a pasta
   do `docker-compose.yml` do Supabase na VPS e suba o `auth` com ele:

   ```bash
   docker compose -f docker-compose.yml -f docker-compose.emails.yml up -d auth
   ```

   As URLs usam `http://kong:8000/...`, a rede interna do Docker; se o gateway tiver outro nome
   no compose da VPS, ajuste antes de subir.
3. **Teste** — peça "Esqueci minha senha" em `idjuv.online/auth` com um e-mail seu. Se chegar o
   e-mail antigo, veja `docker compose logs auth` (erro ao buscar o template aparece ali; o GoTrue
   cai no template padrão quando a URL falha).

Para atualizar depois: reenvie os `.html` ao bucket (sobrescrevendo) e reinicie o `auth`
(`docker compose restart auth`). O GoTrue guarda o template em cache por algum tempo; o restart
garante que a versão nova vale na hora.

## Outro cliente (white label)

Cada instância tem seu próprio Supabase. Ao registrar um tenant novo em `tenants/index.ts`, rode o
gerador: ele cria `tenants/<slug>/emails/` com a marca e o rodapé do cliente. Siga os mesmos
passos de aplicação na VPS dele.

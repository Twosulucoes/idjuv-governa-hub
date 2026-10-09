# Envio de e-mail e WhatsApp configurado pelo próprio cliente — desenho

Data: 2026-10-09 · Classificação: **architectural** (tabelas novas, Edge Function nova, segredos) · Aprovado por Fabiano no thread do projeto.

Plano: [`../plans/2026-10-09-envio-email-whatsapp.md`](../plans/2026-10-09-envio-email-whatsapp.md). Migração: `supabase/migrations/20261009150000_config_envio_email_whatsapp.sql`.

## 1. Como está hoje

| Canal | O que existe | Problema |
|---|---|---|
| E-mail do sistema | Só a Edge Function `enviar-convite-reuniao` envia, via **Resend** (`RESEND_API_KEY`/`RESEND_FROM` nos secrets do servidor). | Remetente fixo no servidor (default `onboarding@resend.dev`); cabeçalho e rodapé do HTML com "IDJUV" escritos no código; nenhum log além do `convite_enviado` no participante. Nenhum outro módulo envia e-mail. |
| E-mail de autenticação | Recuperação de senha/convite de usuário saem pelo SMTP do **GoTrue** (Auth do Supabase), configurado no `.env` da VPS. | Fora do app; é config de infraestrutura por instância. |
| WhatsApp | Não há API. Convites e ficha de federação só geram link `wa.me/...` que abre o WhatsApp do próprio usuário. | Nada sai "do sistema"; sem rastreio. |

Modelo de tenancy (docs/WHITE_LABEL.md): **uma instância (Supabase + deploy) por cliente**. Logo, "por cliente" = configuração guardada no banco da instância e editada pelo admin daquele cliente, sem redeploy.

## 2. Proposta

### Banco (uma migração, RLS desde o início)
- `config_envio` (linha única por canal: `email` / `whatsapp`): provedor, remetente (nome, e-mail, responder-para), host/porta SMTP, usuário, `phone_number_id` e `waba_id` do WhatsApp, `ativo`, quem/quando alterou. **Sem senha/token.**
- Segredos (senha SMTP, API key Resend, token do WhatsApp) no **Supabase Vault** (`vault.secrets`, extensão já instalada). A tabela guarda só o id do segredo. Gravação por RPC `SECURITY DEFINER` (`salvar_segredo_envio`) que só aceita escrita; **o front nunca lê o valor de volta** (a tela mostra "configurado em dd/mm").
- `envios_log`: canal, destinatário mascarado na listagem, assunto/modelo, módulo de origem (`reunioes`, `avisos`…), referência, status (`enviado`/`falhou`), erro, id do provedor, quem disparou, quando. Sem corpo da mensagem (LGPD).
- Permissões novas no catálogo do módulo `admin`: `admin.envios` (ver a tela e o histórico) e `admin.envios.configurar` (editar, gravar credencial, testar). RLS amarrada a elas.

### Núcleo `supabase/functions/_shared/envio/` (interface reaproveitável) e Edge Function `enviar-notificacao`
- `enviarEmail`, `enviarWhatsAppTemplate`, `carregarConfigEnvio`, `carregarIdentidade`, `montarEmailInstitucional`: lê config + segredo do Vault com service role (RPC `config_envio_servidor`), envia e grava `envios_log`.
- Quem chama autentica, checa a permissão da SUA ação e monta o conteúdo no servidor. Por isso `enviar-notificacao` não aceita texto livre: hoje só tem a ação `teste` (exige `admin.envios.configurar`); avisos entram como nova ação (`aviso_id` → conteúdo lido do banco, checando `avisos.gerenciar`).
- E-mail: provedor **SMTP genérico** (denomailer) (Gmail/Workspace, Microsoft 365, SMTP do governo) ou **Resend**. HTML com a marca da instância (nome, logo, cor de `config_institucional`), sem nada escrito no código.
- WhatsApp: **Meta Cloud API oficial** (`graph.facebook.com/v.../{phone_number_id}/messages`). Regra da Meta: mensagem iniciada pela empresa só com **template aprovado** no Business Manager; o cliente cadastra o nome do template por uso. Convite de reunião: `{{1}}` nome, `{{2}}` título, `{{3}}` data, `{{4}}` horário, `{{5}}` local ou link. O teste usa `hello_world` (vem aprovado em toda conta).
- Sem config ativa: e-mail cai nos secrets antigos (`RESEND_*`) e WhatsApp continua no link `wa.me` — nada quebra na instância atual.
- `enviar-convite-reuniao` passa a usar o mesmo núcleo (`_shared/envio/`). Avisos (PR das datas importantes) chamam a mesma função.

### Tela
`/admin/envios` (menu Administração › E-mail e WhatsApp): abas E-mail / WhatsApp / Histórico, botão **"Enviar teste"**, campo de segredo só de escrita.

## 3. Fora deste PR
- SMTP do Auth (senha esquecida) continua no `.env` da VPS; documentado no onboarding.
- Recebimento de respostas do WhatsApp (webhook) e status de entrega/leitura.
- Fila/reenvio automático e limite de taxa por usuário (teste e convites).
- Reaproveitar a conexão SMTP num lote de convites (hoje é uma conexão por destinatário).
- Convite de reunião pode ser disparado pelo criador da reunião com mensagem livre (regra anterior a este trabalho); avaliar exigir permissão própria e limite de destinatários.

## 4. Premissas e decisões
- Credencial só de escrita: nem o gestor lê o segredo de volta; `segredo_id` não tem GRANT de SELECT para `authenticated`.
- `config_envio_servidor` só para `service_role`; Edge Functions são o único leitor do segredo.
- Destinatário completo fica no log (auditoria); a tela mostra mascarado.
- Identidade do e-mail: campos `marca_*` da própria config; o que faltar vem de `config_institucional`; a tela pré-preenche com o perfil do tenant.
- Trocar provedor ou dados do servidor SMTP apaga o vínculo com a credencial (trigger), para que quem edita não aponte o SMTP para um servidor próprio e capture a senha gravada; a credencial só pode ser gravada depois de salvar a configuração.
- SMTP só em portas 25/465/587/2525 e nunca para IP interno (checagem do nome e do DNS no núcleo). Risco aceito: janela de DNS rebinding entre a checagem e a conexão.
- O teste usa a configuração salva mesmo com o canal desligado.
- Sem config ativa nada muda: e-mail usa `RESEND_API_KEY`/`RESEND_FROM`; WhatsApp gera link `wa.me`.

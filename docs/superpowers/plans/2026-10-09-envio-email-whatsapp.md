# Plano — envio de e-mail e WhatsApp configurado pelo cliente

Spec: [`../specs/2026-10-09-envio-email-whatsapp-design.md`](../specs/2026-10-09-envio-email-whatsapp-design.md).
Execução em linha (uma sessão), com revisão por `revisor-codigo-idjuv` e `revisor-seguranca-idjuv` no fim.

| # | Tarefa | Arquivos | Verificação |
|---|---|---|---|
| 1 | Migração: `config_envio`, `envios_log`, permissões, RPCs do Vault, RLS e grants por coluna | `supabase/migrations/20261009150000_config_envio_email_whatsapp.sql` | `scripts/db/validar-migracoes.sh` (252/252) + roteiro de personas com stub do Vault |
| 2 | Baseline: declarar tabelas no mapa de RLS | `supabase/baseline/rls/mapa.csv` (`preservar`) | `node scripts/db/gerar-rls.mjs --check` |
| 3 | Núcleo de envio (SMTP, Resend, Meta Cloud API, HTML com marca, log) | `supabase/functions/_shared/envio/` | `deno check` |
| 4 | Edge Function de teste | `supabase/functions/enviar-notificacao/index.ts` | `deno check` |
| 5 | Convites de reunião usam o núcleo (sem marca no código; WhatsApp oficial quando há template) | `supabase/functions/enviar-convite-reuniao/index.ts`, `src/components/reunioes/EnviarConvitesDialog.tsx` | `deno check`, typecheck |
| 6 | Tipos, hook, página, rota e menu | `src/types/envios.ts`, `src/hooks/useConfigEnvio.ts`, `src/pages/admin/ConfigEnviosPage.tsx`, `src/App.tsx`, `src/types/auth.ts`, `src/config/*menu*.ts` | gate + tela rodando (390px e desktop) |
| 7 | Docs da matriz | `docs/EDGE_FUNCTIONS.md`, `docs/BANCO_DE_DADOS.md`, `docs/RBAC_PERMISSOES.md`, `docs/MODULOS.md`, `docs/NOVO_BANCO.md`, `docs/WHITE_LABEL.md`, `docs/INVENTARIO_HARDCODE.md`, `docs/planejamento/ROADMAP.md` | guard de links |
| 8 | Gate e PR rascunho | — | `bash scripts/gate.sh` verde |

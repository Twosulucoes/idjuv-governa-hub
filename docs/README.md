# Documentação do Sistema — IDJUV Governa Hub

Índice central da documentação técnica e funcional do sistema.

> **Comece por [`VISAO_GERAL.md`](./VISAO_GERAL.md)** (o que é o sistema) e
> [`ARQUITETURA.md`](./ARQUITETURA.md) (como é montado). Os números do sistema
> (rotas, páginas, tabelas, migrações, módulos) estão só em
> [`ESTADO_DO_SISTEMA.md`](./ESTADO_DO_SISTEMA.md), gerado do código por `npm run estado`.
>
> Para o guia rápido de contexto orientado ao Claude Code / onboarding de
> desenvolvedores, veja o [`CLAUDE.md`](../CLAUDE.md) na raiz do repositório.

## Sumário

| Documento | Conteúdo |
|---|---|
| [VISAO_GERAL.md](./VISAO_GERAL.md) | O que é o sistema, público, objetivos e mapa de módulos |
| [ESTADO_DO_SISTEMA.md](./ESTADO_DO_SISTEMA.md) | Contagens do sistema geradas do código (rotas, páginas, componentes, hooks, migrações, tabelas, funções, Edge Functions, módulos). Não editar à mão |
| [ARQUITETURA.md](./ARQUITETURA.md) | Stack, camadas, fluxo de dados, autenticação, deploy |
| [MODULOS.md](./MODULOS.md) | Detalhamento funcional de cada módulo e suas páginas |
| [BANCO_DE_DADOS.md](./BANCO_DE_DADOS.md) | Tabelas, views e funções (RPC) do Postgres/Supabase |
| [NOVO_BANCO.md](./NOVO_BANCO.md) | **Criar um banco novo e vazio** (Supabase self-hosted/validação em Postgres) a partir do baseline com RLS por módulo |
| [BACKUP.md](./BACKUP.md) | **Backup da VPS**: dump diário criptografado fora da VPS, retenção, teste mensal de restauração e como restaurar |
| [RBAC_PERMISSOES.md](./RBAC_PERMISSOES.md) | Modelo de permissões, perfis, rotas protegidas |
| [GUIA_FRONTEND.md](./GUIA_FRONTEND.md) | Estrutura do front, hooks, libs, padrões de código |
| [EDGE_FUNCTIONS.md](./EDGE_FUNCTIONS.md) | Funções serverless (Deno) do Supabase |
| [INTEGRACOES_EXTERNAS.md](./INTEGRACOES_EXTERNAS.md) | APIs e bases públicas de fora do sistema (Compras.gov.br, BrasilAPI, Banco do Brasil, Gemini, Resend, WhatsApp, Transferegov, PNCP): onde são chamadas, chave, situação e o que falta |
| [EMAILS_AUTH.md](./EMAILS_AUTH.md) | E-mails do Supabase Auth com o design system: gerador, templates por tenant e como aplicar na VPS |
| [PADRAO_DOCUMENTOS.md](./PADRAO_DOCUMENTOS.md) | Padrão único de impressão (PDF): famílias, tokens, como criar documento novo |
| [CONFIGURACAO_CLIENTE.md](./CONFIGURACAO_CLIENTE.md) | Identidade da instituição cadastrada em `/admin/configuracao-cliente` |
| [DESENVOLVIMENTO.md](./DESENVOLVIMENTO.md) | Setup, comandos, fluxo Git, deploy, como adicionar features |
| [AUDITORIA_USUARIOS.md](./AUDITORIA_USUARIOS.md) | Auditoria de segurança do sistema de usuários (achados e hardening) — registro datado |
| [INVENTARIO_HARDCODE.md](./INVENTARIO_HARDCODE.md) | Mapa do hardcode do cliente (IDJUV) no código — base do White Label (registro datado, usado no P24) |
| [WHITE_LABEL.md](./WHITE_LABEL.md) | Arquitetura-alvo, roadmap e critérios de aceite para o modelo White Label |
| [GOVERNANCA_DOCUMENTACAO.md](./GOVERNANCA_DOCUMENTACAO.md) | Processo documental: matriz mudança→doc, definição de trabalho completo, escape hatch, estado real do enforcement (gate e CI) |
| [planejamento/ROADMAP.md](./planejamento/ROADMAP.md) | Plano de finalização, pendências, decisões e andamento (vivo) |
| [planejamento/FINALIZACAO.md](./planejamento/FINALIZACAO.md) | Estado de cada módulo rumo à finalização (vivo, alimentado por `/finalizar`) |
| [../prompts/README.md](../prompts/README.md) | Gerador de prompts: `/prompt`, `/pendencias`, `/finalizar`, tipos de tarefa e como estender |
| [../AGENTS.md](../AGENTS.md) | Instruções persistentes para agentes de IA: invariantes de arquitetura/segurança, fluxo de trabalho (skill `superpowers`), documentação obrigatória |
| [../CONTRIBUTING.md](../CONTRIBUTING.md) | Gate local de qualidade (`npm run gate`, pre-push) e checklist de PR |
| [../.claude/skills/superpowers/SKILL.md](../.claude/skills/superpowers/SKILL.md) | Orquestrador `/superpowers`: prompt curto → brainstorming → aprovação → (plano) → execução por subagentes → verificação → docs → PR em rascunho |

## Histórico

A pasta [`historico/`](./historico/) guarda documentos aposentados — só contexto, não
documentação canônica:

- [`historico/planos-2026/`](./historico/planos-2026/): relatórios e planos antigos (auditorias,
  refatorações, fases de implementação);
- o antigo documento-mestre [`historico/DOCUMENTACAO_TECNICA.md`](./historico/DOCUMENTACAO_TECNICA.md);
- os guias e scripts do banco antigo, já superados pelo baseline ([NOVO_BANCO.md](./NOVO_BANCO.md)) e
  pelo backup da VPS ([BACKUP.md](./BACKUP.md)): `MIGRACAO_SUPABASE_PROPRIO.md`,
  `SCHEMA_SUPABASE_PROPRIO.sql`, `CORRECOES_BANCO.sql`, `MIGRACAO_VIEWS_TRANSPARENCIA.sql`,
  `RLS_USUARIOS_PROPOSTA.sql` (proposta já aplicada pela migração
  `20260824010000_rls_user_modules_user_roles_profiles.sql`), `BACKUP_CONTINGENCIA.md`,
  `EXPORTAR_DADOS.md` e `ANALISE_COMPARATIVA_UNIFICACAO.md`;
- [`historico/disaster-recovery/`](./historico/disaster-recovery/): dumps antigos e parciais do schema
  (início de 2026). Não servem para restaurar o banco de hoje.

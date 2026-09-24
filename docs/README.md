# Documentação do Sistema — IDJUV Governa Hub

Índice central da documentação técnica e funcional do sistema.

> **Comece por [`DOCUMENTACAO_TECNICA.md`](../DOCUMENTACAO_TECNICA.md)** na raiz —
> documento-mestre que consolida arquitetura, mapa do acoplamento à marca do
> cliente e as diretrizes de White Label. Os arquivos abaixo são os aprofundamentos.
>
> Para o guia rápido de contexto orientado ao Claude Code / onboarding de
> desenvolvedores, veja o [`CLAUDE.md`](../CLAUDE.md) na raiz do repositório.

## Sumário

| Documento | Conteúdo |
|---|---|
| [VISAO_GERAL.md](./VISAO_GERAL.md) | O que é o sistema, público, objetivos e mapa de módulos |
| [ARQUITETURA.md](./ARQUITETURA.md) | Stack, camadas, fluxo de dados, autenticação, deploy |
| [MODULOS.md](./MODULOS.md) | Detalhamento funcional de cada módulo e suas páginas |
| [BANCO_DE_DADOS.md](./BANCO_DE_DADOS.md) | Tabelas, views e funções (RPC) do Postgres/Supabase |
| [RBAC_PERMISSOES.md](./RBAC_PERMISSOES.md) | Modelo de permissões, perfis, rotas protegidas |
| [GUIA_FRONTEND.md](./GUIA_FRONTEND.md) | Estrutura do front, hooks, libs, padrões de código |
| [EDGE_FUNCTIONS.md](./EDGE_FUNCTIONS.md) | Funções serverless (Deno) do Supabase |
| [DESENVOLVIMENTO.md](./DESENVOLVIMENTO.md) | Setup, comandos, fluxo Git, deploy, como adicionar features |
| [AUDITORIA_USUARIOS.md](./AUDITORIA_USUARIOS.md) | Auditoria de segurança do sistema de usuários (achados e hardening) |
| [INVENTARIO_HARDCODE.md](./INVENTARIO_HARDCODE.md) | Mapa do hardcode do cliente (IDJUV) no código — base do White Label |
| [WHITE_LABEL.md](./WHITE_LABEL.md) | Arquitetura-alvo, roadmap e critérios de aceite para o modelo White Label |
| [GOVERNANCA-DOCUMENTACAO.md](./GOVERNANCA-DOCUMENTACAO.md) | Processo documental: matriz mudança→doc, definição de trabalho completo, escape hatch, estado real do enforcement (CI) |
| [../AGENTS.md](../AGENTS.md) | Instruções persistentes para agentes de IA: invariantes de arquitetura/segurança, fluxo de trabalho (skill `superpowers`), documentação obrigatória |
| [../.claude/skills/superpowers/SKILL.md](../.claude/skills/superpowers/SKILL.md) | Orquestrador `/superpowers`: prompt curto → brainstorming → aprovação → (plano) → execução por subagentes → verificação → docs → PR em rascunho |

## Documentos operacionais (já existentes)

| Documento | Conteúdo |
|---|---|
| [EXPORTAR_DADOS.md](./EXPORTAR_DADOS.md) | Como exportar dados do sistema |
| [MIGRACAO_SUPABASE_PROPRIO.md](./MIGRACAO_SUPABASE_PROPRIO.md) | Migrar para uma instância Supabase própria |
| [BACKUP_CONTINGENCIA.md](./BACKUP_CONTINGENCIA.md) | Estratégia de backup e contingência |
| [SCHEMA_SUPABASE_PROPRIO.sql](./SCHEMA_SUPABASE_PROPRIO.sql) | Dump do schema para instância própria |
| [CORRECOES_BANCO.sql](./CORRECOES_BANCO.sql) | Scripts de correção de banco |
| [MIGRACAO_VIEWS_TRANSPARENCIA.sql](./MIGRACAO_VIEWS_TRANSPARENCIA.sql) | Views públicas da transparência |
| [RLS_USUARIOS_PROPOSTA.sql](./RLS_USUARIOS_PROPOSTA.sql) | Proposta de RLS p/ tabelas de usuário (item C2 da auditoria) — revisar antes de aplicar |

## Números do sistema (snapshot)

> Medido em 2026-09-16.

- **736** arquivos `.ts`/`.tsx` em `src/`
- **241** páginas em `src/pages/` (organizadas por domínio)
- **265** componentes `.tsx` em `src/components/`
- **61** hooks de dados em `src/hooks/`
- **38** geradores de PDF em `src/lib/`
- **239** rotas declaradas em `src/App.tsx` (1.281 linhas)
- **231** tabelas, **15** views e **47** funções (RPC) no Postgres
- **8** Edge Functions (Deno) no Supabase
- **246** migrações SQL versionadas
- **17** módulos funcionais
- **~1.070** ocorrências de "IDJUV" em **224** arquivos (ver [INVENTARIO_HARDCODE.md](./INVENTARIO_HARDCODE.md))

> A pasta [`.lovable/`](../.lovable/) contém relatórios e planos históricos
> gerados pelo Lovable (auditorias, refatorações, fases de implementação) — útil
> como contexto histórico, mas não é documentação canônica.

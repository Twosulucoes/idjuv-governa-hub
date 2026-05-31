# Documentação do Sistema — IDJUV Governa Hub

Índice central da documentação técnica e funcional do sistema. Comece por aqui.

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

## Documentos operacionais (já existentes)

| Documento | Conteúdo |
|---|---|
| [EXPORTAR_DADOS.md](./EXPORTAR_DADOS.md) | Como exportar dados do sistema |
| [MIGRACAO_SUPABASE_PROPRIO.md](./MIGRACAO_SUPABASE_PROPRIO.md) | Migrar para uma instância Supabase própria |
| [BACKUP_CONTINGENCIA.md](./BACKUP_CONTINGENCIA.md) | Estratégia de backup e contingência |
| [SCHEMA_SUPABASE_PROPRIO.sql](./SCHEMA_SUPABASE_PROPRIO.sql) | Dump do schema para instância própria |
| [CORRECOES_BANCO.sql](./CORRECOES_BANCO.sql) | Scripts de correção de banco |
| [MIGRACAO_VIEWS_TRANSPARENCIA.sql](./MIGRACAO_VIEWS_TRANSPARENCIA.sql) | Views públicas da transparência |

## Números do sistema (snapshot)

- **~241** páginas em `src/pages/` (organizadas por domínio)
- **~282** componentes em `src/components/`
- **~80** hooks de dados em `src/hooks/`
- **231** tabelas, **15** views e **47** funções (RPC) no Postgres
- **9** Edge Functions (Deno) no Supabase
- **~240** migrações SQL versionadas
- **17** módulos funcionais

> A pasta [`.lovable/`](../.lovable/) contém relatórios e planos históricos
> gerados pelo Lovable (auditorias, refatorações, fases de implementação) — útil
> como contexto histórico, mas não é documentação canônica.
</content>

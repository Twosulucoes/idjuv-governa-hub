# Roadmap do IDJUV Governa Hub

Documento vivo, mantido pelo agente `documentador-idjuv`. Fluxo de trabalho: ver `AGENTS.md`.

## Como usar

1. Registre a ideia na seção **Backlog** (uma linha, com módulo de `src/shared/config/modules.config.ts`).
2. Ao priorizar, rode o skill `brainstorming` e mova o item para **Em planejamento** com link para a spec em `docs/superpowers/specs/`.
3. Com plano aprovado (`docs/superpowers/plans/`), mova para **Em andamento**; ao mergear, para **Concluído**.

## Em andamento
- [ ] **Envio de e-mail e WhatsApp pelo cliente:** tela `/admin/envios` (SMTP próprio ou Resend, WhatsApp oficial da Meta, credencial no Vault, histórico), convites de reunião já usam — [spec](../superpowers/specs/2026-10-09-envio-email-whatsapp-design.md), [plano](../superpowers/plans/2026-10-09-envio-email-whatsapp.md). Falta aplicar a migração, publicar `enviar-notificacao` e ligar os avisos.
- [ ] **Comunicação — avisos e datas importantes:** mural `/avisos`, sino e destaque nos módulos, calendário com feriados e aniversariantes — [spec](../superpowers/specs/2026-10-09-avisos-e-datas-importantes-design.md), [plano](../superpowers/plans/2026-10-09-avisos-e-datas-importantes.md). Falta aplicar a migração no banco e regenerar os tipos.
- [ ] **Importação de dados + QDD do FIPLAN:** Central de Importações (`/admin/importacoes`) com assistente ler → simular → confirmar e histórico; primeiro importador lê o PDF do QDD do FIPLAN e atualiza `fin_dotacoes` — [spec](../superpowers/specs/2026-10-09-importacao-dados-qdd-fiplan-design.md). Falta aplicar a migração, regenerar os tipos e conceder `orcamento.importar` a quem vai importar.
- [ ] **Patrimônio / patrimonio_mobile — Inventário de campo, fase 1** (vistoria de unidades, fotos de evidência com fila offline, painel com mapa, importação de KML): em PR — spec [2026-10-09-inventario-campo-fase1](../superpowers/specs/2026-10-09-inventario-campo-fase1.md), plano [2026-10-09-inventario-campo-fase1](../superpowers/plans/2026-10-09-inventario-campo-fase1.md). Pendências:
  - a migração `supabase/migrations/20261009160000_inventario_campo_fase1.sql` já está aplicada no banco de produção (foi aplicada à mão em 09/10, e por isso o arquivo foi renomeado de `20261009120000` para `20261009160000`, a versão registrada em `supabase_migrations.schema_migrations`); falta regenerar `src/integrations/supabase/types.ts` (o front usa `supabase as any` nas tabelas novas até lá);
  - decidir a correção das policies `acesso_total_*` em `campanhas_inventario` e `coletas_inventario` no banco ao vivo (o baseline já as remove);
  - confirmar os termos de uso da Esri World Imagery para uso institucional.

## Em planejamento
- [ ] **RH — finalização em ondas A–E** — Onda A mesclada em 2026-10-09 (PRs #36, #37, #38, #40, #42, #43); Onda C: itens 10 e 11 mesclados (PRs #49, #51), item 12 na PR #52, itens 13–15 a fazer (A: 6 correções sem banco; B: segurança; C: completar fluxos; D: ferramentas; E: domínios novos) — ver [FINALIZACAO.md](./FINALIZACAO.md#recursos-humanos-rh--2026-10-09)
- [ ] **Reformulação do design / Design System** (transversal) — spec [2026-10-09-design-system-design.md](../superpowers/specs/2026-10-09-design-system-design.md), plano [2026-10-09-design-system.md](../superpowers/plans/2026-10-09-design-system.md). Fases 0 (skill `ui-ux-pro-max` + spec) e 1 (tokens, contraste AA, IBM Plex Sans, guards no gate, vitrine `/admin/design-system`) e 2 (componentes `@/components/design-system`: PageHeader, DataTable, StatusBadge, EmptyState, KpiCard, ChartCard, FormSection, ErrorSummary) feitas; Fase 3 em andamento com o RH como piloto: shell acessível e painel/lista/ficha do servidor migrados; o formulário de servidor entra depois da Onda C do RH.

## Backlog
- [ ] **Finalização por módulo:** rodar `/finalizar <codigo>` (começar por `rh`, `financeiro`, `patrimonio`, `governanca`) — ver [FINALIZACAO.md](./FINALIZACAO.md)
- [ ] Menu aponta para rotas que não existem (404): `/admin/configuracoes`, `/rh/meus-dados`, `/governanca/riscos|controles|decisoes|checklists`, `/gabinete/workflow-rh` — ver [FINALIZACAO.md](./FINALIZACAO.md)
- [ ] **RH — Fase 0/1 (P0):** verificar RLS real e estancar acesso aberto em folha/dados sensíveis — ver [ANALISE_RH.md](./ANALISE_RH.md) §6
- [ ] RH — Fases 2–7 (higiene, fundação de dados, autoatendimento, carreira, eSocial, seguridade) — ver [ANALISE_RH.md](./ANALISE_RH.md)
- [ ] Higiene: dívida de typecheck (10) e lint (679, dos quais 667 são `no-explicit-any`) — reduzir e rodar `bash scripts/gate.sh --update-baseline`
- [ ] Higiene: `package-lock.json` fora de sincronia (`npm ci` falha)
- [ ] Hardening de RLS pendente (ver `docs/AUDITORIA_USUARIOS.md`, `docs/RLS_USUARIOS_PROPOSTA.sql`)
- [ ] Inventário de hardcode de cliente (ver `docs/INVENTARIO_HARDCODE.md`)
- [ ] Patrimônio — Inventário de campo, fases 2–3: edificações e instalações, relatórios automáticos (vistoria, diário, semanal), conciliação com a relação da SEED, importação de planilha (fora da fase 1 na spec de 2026-10-09)

## Concluído
- [x] Gerador de prompts (`/prompt`, `/pendencias`, `/finalizar`) e hook de sessão em nuvem que gera o `.env` — ver [`prompts/README.md`](../../prompts/README.md)
- [x] Estrutura de skills, agentes, AGENTS.md, Superpowers vendorizado, orquestrador `superpowers` e gate local

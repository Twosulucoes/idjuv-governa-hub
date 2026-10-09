# Roadmap do IDJUV Governa Hub

Documento vivo, mantido pelo agente `documentador-idjuv`. Fluxo de trabalho: ver `AGENTS.md`.

## Como usar

1. Registre a ideia na seção **Backlog** (uma linha, com módulo de `src/shared/config/modules.config.ts`).
2. Ao priorizar, rode o skill `brainstorming` e mova o item para **Em planejamento** com link para a spec em `docs/superpowers/specs/`.
3. Com plano aprovado (`docs/superpowers/plans/`), mova para **Em andamento**; ao mergear, para **Concluído**.

## Em andamento
- [ ] **Patrimônio / patrimonio_mobile — Inventário de campo, fase 1** (vistoria de unidades, fotos de evidência com fila offline, painel com mapa, importação de KML): em PR rascunho — spec [2026-10-09-inventario-campo-fase1](../superpowers/specs/2026-10-09-inventario-campo-fase1.md), plano [2026-10-09-inventario-campo-fase1](../superpowers/plans/2026-10-09-inventario-campo-fase1.md). Pendências:
  - aplicar a migração `supabase/migrations/20261009120000_inventario_campo_fase1.sql` no projeto remoto e regenerar `src/integrations/supabase/types.ts` (o front usa `supabase as any` nas tabelas novas até lá);
  - decidir a correção das policies `acesso_total_*` em `campanhas_inventario` e `coletas_inventario` no banco ao vivo (o baseline já as remove);
  - confirmar os termos de uso da Esri World Imagery para uso institucional.

## Em planejamento
- _(vazio)_

## Backlog
- [ ] **RH — Fase 0/1 (P0):** verificar RLS real e estancar acesso aberto em folha/dados sensíveis — ver [ANALISE_RH.md](./ANALISE_RH.md) §6
- [ ] RH — Fases 2–7 (higiene, fundação de dados, autoatendimento, carreira, eSocial, seguridade) — ver [ANALISE_RH.md](./ANALISE_RH.md)
- [ ] Higiene: dívida de typecheck (10) e lint (679, dos quais 667 são `no-explicit-any`) — reduzir e rodar `bash scripts/gate.sh --update-baseline`
- [ ] Higiene: `package-lock.json` fora de sincronia (`npm ci` falha)
- [ ] Hardening de RLS pendente (ver `docs/AUDITORIA_USUARIOS.md`, `docs/RLS_USUARIOS_PROPOSTA.sql`)
- [ ] Inventário de hardcode de cliente (ver `docs/INVENTARIO_HARDCODE.md`)
- [ ] Patrimônio — Inventário de campo, fases 2–3: edificações e instalações, relatórios automáticos (vistoria, diário, semanal), conciliação com a relação da SEED, importação de planilha (fora da fase 1 na spec de 2026-10-09)

## Concluído
- [x] Estrutura de skills, agentes, AGENTS.md, Superpowers vendorizado, orquestrador `superpowers` e gate local

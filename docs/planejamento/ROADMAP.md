# Roadmap do IDJUV Governa Hub

Documento vivo, mantido pelo agente `documentador-idjuv`. Fluxo de trabalho: ver `AGENTS.md`.

## Como usar

1. Registre a ideia na seção **Backlog** (uma linha, com módulo de `src/shared/config/modules.config.ts`).
2. Ao priorizar, rode o skill `brainstorming` e mova o item para **Em planejamento** com link para a spec em `docs/superpowers/specs/`.
3. Com plano aprovado (`docs/superpowers/plans/`), mova para **Em andamento**; ao mergear, para **Concluído**.

## Em andamento
- _(vazio)_

## Em planejamento
- _(vazio)_

## Backlog
- [ ] **RH — Fase 0/1 (P0):** verificar RLS real e estancar acesso aberto em folha/dados sensíveis — ver [ANALISE_RH.md](./ANALISE_RH.md) §6
- [ ] RH — Fases 2–7 (higiene, fundação de dados, autoatendimento, carreira, eSocial, seguridade) — ver [ANALISE_RH.md](./ANALISE_RH.md)
- [ ] Higiene: dívida de typecheck (10) e lint (701) — reduzir e rodar `bash scripts/gate.sh --update-baseline`
- [ ] Higiene: `package-lock.json` fora de sincronia (`npm ci` falha)
- [ ] Hardening de RLS pendente (ver `docs/AUDITORIA_USUARIOS.md`, `docs/RLS_USUARIOS_PROPOSTA.sql`)
- [ ] Inventário de hardcode de cliente (ver `docs/INVENTARIO_HARDCODE.md`)

## Concluído
- [x] Estrutura de skills, agentes, AGENTS.md, Superpowers vendorizado, orquestrador `superpowers` e gate local

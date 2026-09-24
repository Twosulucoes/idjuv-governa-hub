# Guia de Contribuição — IDJUV Governa Hub

Este documento define o processo local de qualidade e o checklist de Pull
Request para este repositório. Para as instruções completas de arquitetura e
segurança, veja [`AGENTS.md`](./AGENTS.md) e [`CLAUDE.md`](./CLAUDE.md).

---

## Gate de qualidade local (pre-push)

Este repositório não tinha CI até agora. Junto com este guia entram os
primeiros workflows em `.github/workflows/` — mas o gate local continua
sendo a rede de segurança mais rápida, porque roda antes mesmo do push.

```bash
npm install     # o `prepare` aponta core.hooksPath para .githooks/
npm run gate    # ou simplesmente: git push
```

(Com `bun`, o `gate.sh` detecta `bun.lockb`/`bun.lock` e usa `bun run`
automaticamente nos passos internos.)

O gate roda, nesta ordem (o que falha em segundos primeiro):
`check:migrations` → `check:docs` → `lint` → `build`. Não há suíte de testes
automatizados configurada neste projeto — a checagem de tipos roda dentro do
`build` (Vite chama `tsc`), não como passo isolado.

Para pular conscientemente: `git push --no-verify`. **Isso é desaconselhado**
— o hook existe justamente para pegar erro de tipo, lint ou build antes de
virar um problema em CI ou em produção. Pule só quando souber exatamente por
quê (ex.: push de um WIP para uma branch que ninguém mais usa).

⚠️ O hook local é rede de segurança, **não substituto** do CI: ele se pula, e
não roda no ambiente limpo de um runner.

## O que o `docs-guard` faz (e quando será ativado)

`.github/workflows/docs-guard.yml` existe no repositório, mas o gatilho
automático (`pull_request`) está **comentado de propósito** — hoje ele só
roda via `workflow_dispatch` manual. A lógica, quando ativada: se a PR muda
`src/**` ou `supabase/**` (exceto arquivos de teste) sem tocar em nenhuma doc
(`docs/**` ou qualquer `*.md`) e sem declarar o escape no corpo da PR, o
check falha. Ver [`docs/GOVERNANCA-DOCUMENTACAO.md`](./docs/GOVERNANCA-DOCUMENTACAO.md)
§6 para o estado exato de cada mecanismo e o motivo de a ativação ainda não
ter acontecido — é uma decisão do time (rodar o processo manualmente por um
tempo antes de virar bloqueio automático), não uma limitação técnica.

`.github/workflows/quality.yml` (lint + build, e os guards de docs/migrações)
esse sim já roda automaticamente em toda Pull Request.

## Checklist antes de abrir PR

- [ ] `npm run lint` e `npm run build` passam
- [ ] `npm run check:docs` e `npm run check:migrations` passam (se a mudança
      toca uma doc viva ou `supabase/migrations/`)
- [ ] Consultei a matriz de [`docs/GOVERNANCA-DOCUMENTACAO.md`](./docs/GOVERNANCA-DOCUMENTACAO.md)
      §3 e atualizei as docs exigidas — ou declarei o escape:
      `docs: não se aplica — <motivo real>` no corpo da PR
      (linha própria, sem indentação)
- [ ] RBAC/RLS respeitados quando a mudança toca dado protegido (ver
      `AGENTS.md`)
- [ ] Nenhuma funcionalidade não implementada foi documentada como existente
- [ ] Commit(s) com mensagem descritiva (Conventional Commits é bem-vindo,
      mas **não é obrigatório** neste repositório — não há versionamento
      automático/SemVer configurado; se o time quiser adotar isso no futuro,
      é uma decisão própria, registrada em doc própria quando acontecer)

## Segurança

- Nunca commite `.env`, `.env.local` ou qualquer arquivo com credenciais.
- Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` (ou qualquer secret de
  integração) no código do front — segredos vivem só em
  `supabase secrets` / `Deno.env.get` dentro de Edge Functions.
- Toda tabela/coluna/RPC nova precisa de RLS pensada desde a migração — use o
  skill `migracao-segura-idjuv` (`.claude/skills/migracao-segura-idjuv/SKILL.md`).
- Reporte vulnerabilidades em privado antes de abrir issues públicas.

## Dúvidas

Consulte o índice-mestre da documentação em [`docs/README.md`](./docs/README.md),
o documento-mestre [`DOCUMENTACAO_TECNICA.md`](./DOCUMENTACAO_TECNICA.md) e as
instruções para agentes em [`AGENTS.md`](./AGENTS.md).

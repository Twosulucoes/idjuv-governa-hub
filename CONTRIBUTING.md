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

O gate (`scripts/gate.sh`) roda, nesta ordem (o que falha em segundos primeiro):
`check:migrations` → `check:docs` → `check:rls` → `check:contraste` → `check:autoria-rh` → `typecheck` → `lint` →
cor crua → `build`. Não há suíte
de testes automatizados configurada neste projeto. O `vite build` **não** checa
tipos, por isso o typecheck (`tsc -p tsconfig.app.json`) é passo próprio.

O repositório carrega dívida histórica de tipos e lint, então `typecheck` e
`lint` comparam com `scripts/gate-baseline.json` e falham **só se o número de
erros aumentar**. O mesmo vale para a **cor crua** (`bg-blue-500`, `#1e40af`… em
`src/**/*.tsx`, contada por `scripts/check-cor-crua.mjs`): pode cair, nunca subir —
use token semântico (ver `docs/GUIA_FRONTEND.md`, Design System). Os cinco guards
(migrações, docs, RLS, contraste AA dos tokens de cor de `src/index.css` e de cada
`tenants/*`, e autoria e trilha em toda tabela do RH — `scripts/check-autoria-rh.mjs`, com
exceções só com motivo em `scripts/autoria-rh-excecoes.txt`) e o build falham em qualquer ocorrência. Ao
reduzir a dívida: `bash scripts/gate.sh --update-baseline` e commite a baseline.

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
check falha. Ver [`docs/GOVERNANCA_DOCUMENTACAO.md`](./docs/GOVERNANCA_DOCUMENTACAO.md)
§6 para o estado exato de cada mecanismo e o motivo de a ativação ainda não
ter acontecido — é uma decisão do time (rodar o processo manualmente por um
tempo antes de virar bloqueio automático), não uma limitação técnica.

`.github/workflows/quality.yml` (guard de `.env` rastreado + o mesmo
`scripts/gate.sh`) esse sim já roda automaticamente em toda Pull Request.

## Checklist antes de abrir PR

- [ ] `bash scripts/gate.sh` (`npm run gate`) verde — inclui `check:docs`,
      `check:migrations`, typecheck/lint sem piora vs. baseline e build
- [ ] Consultei a matriz de [`docs/GOVERNANCA_DOCUMENTACAO.md`](./docs/GOVERNANCA_DOCUMENTACAO.md)
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

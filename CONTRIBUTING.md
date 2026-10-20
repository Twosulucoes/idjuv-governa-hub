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
`check:migrations` → `check:docs` → `check:rls` → `check:contraste` → `check:autoria-rh` → `estado:checar` →
`check:numeros` → `typecheck` → `lint` → cor crua → jsPDF fora de `src/lib/documentos/core/` → testes (vitest em
`src/` e `scripts/`) → `build` → build do site (`npm run build:site` e
`scripts/check-bundle-site.mjs`, que reprova código do sistema interno no `dist-site/`; o jsPDF é permitido
desde 17/10/2026 porque o `/curriculo` gera PDF, carregado sob demanda). O `vite build` **não** checa
tipos, por isso o typecheck (`tsc -p tsconfig.app.json`) é passo próprio.

O repositório carrega dívida histórica de tipos e lint, então `typecheck` e
`lint` comparam com `scripts/gate-baseline.json` e falham **só se o número de
erros aumentar**. O mesmo vale para a **cor crua** (`bg-blue-500`, `#1e40af`… em
`src/**/*.tsx`, contada por `scripts/check-cor-crua.mjs`): pode cair, nunca subir —
use token semântico (ver `docs/GUIA_FRONTEND.md`, Design System). Os sete guards
(migrações, docs, RLS, contraste AA dos tokens de cor de `src/index.css` e de cada
`tenants/*`, autoria e trilha em toda tabela do RH — `scripts/check-autoria-rh.mjs`, com
exceções só com motivo em `scripts/autoria-rh-excecoes.txt` —, estado do sistema em dia e doc viva sem
contagem escrita à mão) e o build falham em qualquer ocorrência. Ao
reduzir a dívida: `bash scripts/gate.sh --update-baseline` e commite a baseline.

**Estado do sistema e números nas docs.** As contagens do sistema (rotas, páginas, componentes, hooks,
migrações, tabelas, views, funções, Edge Functions, módulos) moram só em
[`docs/ESTADO_DO_SISTEMA.md`](./docs/ESTADO_DO_SISTEMA.md), gerado por `scripts/estado-do-sistema.mjs` a partir
do código. Mudou algo que muda a contagem? Rode `npm run estado` e commite o arquivo; o guard
(`npm run estado:checar`) reprova se ele estiver defasado. O `scripts/check-numeros-docs.mjs`
(`npm run check:numeros`) reprova contagem escrita à mão nas docs vivas (as de `LIVING_DOCS` em
`scripts/check-doc-links.mjs`, mais `CLAUDE.md`, `AGENTS.md`, `README.md` e este arquivo): aponte para o
estado do sistema. Fato datado de uma entrega pode ficar, marcado com `<!-- numero-datado -->` na linha ou
entre `<!-- numero-datado:inicio -->` e `<!-- numero-datado:fim -->`.
Desde o P03 (tipos do banco gerados das migrações) a baseline do typecheck é 4.
A baseline `jspdfForaDoCore` cai a cada onda da padronização de PDFs (`docs/PADRAO_DOCUMENTOS.md`): o gerador migrado
para `src/lib/documentos/` deixa de importar `jspdf`, e a baseline é baixada na mesma PR. Limpeza (onda 5: relatório de portarias), demais relatórios (onda 4), comprovantes (onda 3), fichas (onda 2) e
relatórios do RH (onda 1) já passaram por esse ajuste.

Migração nova exige o `src/integrations/supabase/types.ts` regenerado no mesmo PR:
`bash scripts/db/gerar-tipos.sh` (Postgres local, ver `docs/BANCO_DE_DADOS.md`). O CI **Tipos do banco**
(`.github/workflows/tipos-banco.yml`) reprova o PR se o arquivo estiver defasado. O CI **Banco do zero e RLS**
(`.github/workflows/banco-rls.yml`) refaz o banco do zero, testa a RLS e reprova migração sem o schema do baseline
regenerado ou com tabela nova fora de `supabase/baseline/rls/mapa.csv` (ver `docs/DESENVOLVIMENTO.md`).

Para pular conscientemente: `git push --no-verify`. **Isso é desaconselhado**
— o hook existe justamente para pegar erro de tipo, lint ou build antes de
virar um problema em CI ou em produção. Pule só quando souber exatamente por
quê (ex.: push de um WIP para uma branch que ninguém mais usa).

⚠️ O hook local é rede de segurança, **não substituto** do CI: ele se pula, e
não roda no ambiente limpo de um runner.

## O que o `docs-guard` faz

`.github/workflows/docs-guard.yml` roda em **toda Pull Request** desde 14/10/2026.
Ele cobra, para cada tipo de mudança, o documento dono do assunto (matriz em
[`docs/GOVERNANCA_DOCUMENTACAO.md`](./docs/GOVERNANCA_DOCUMENTACAO.md) §3): migração
cobra `docs/BANCO_DE_DADOS.md`, Edge Function cobra `docs/EDGE_FUNCTIONS.md`, rota ou
menu cobra `docs/ARQUITETURA.md`, mudança no gate cobra este `CONTRIBUTING.md`, e assim por diante. Toda
mudança em `src/**` ou `supabase/**` cobra também `docs/planejamento/ROADMAP.md`.
Arquivos de teste não contam. A regra mora em `scripts/check-docs-matriz.mjs`
(testada no gate); confira antes de abrir a PR (conta também o que ainda não foi commitado):

```bash
node scripts/check-docs-matriz.mjs --base origin/main
```

Se de fato nenhuma doc se aplica, declare no corpo da PR, em linha própria e sem
indentação: `docs: não se aplica — <motivo real>`. Editar a descrição redispara o check.

`.github/workflows/quality.yml` (guard de `.env` rastreado + o mesmo
`scripts/gate.sh`) esse sim já roda automaticamente em toda Pull Request.

## Checklist antes de abrir PR

- [ ] `bash scripts/gate.sh` (`npm run gate`) verde — inclui `check:docs`,
      `check:migrations`, testes, typecheck/lint sem piora vs. baseline e build
- [ ] `node scripts/check-docs-matriz.mjs --base origin/main` sem pendência
      (é o que o `docs-guard` cobra na PR)
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

Consulte o índice-mestre da documentação em [`docs/README.md`](./docs/README.md)
e as instruções para agentes em [`AGENTS.md`](./AGENTS.md).

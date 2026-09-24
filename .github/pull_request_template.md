## O que muda

<!-- Resumo objetivo da mudança e do porquê. -->

## Documentação

Matriz completa: [docs/GOVERNANCA-DOCUMENTACAO.md](../docs/GOVERNANCA-DOCUMENTACAO.md) §3
(o guard `docs-guard` existe mas está desativado por padrão — ver §6 — então
isto ainda é conferido em review, não bloqueado automaticamente)

- [ ] Rota/página/item de menu → `docs/ARQUITETURA.md` (+ `docs/MODULOS.md` se for de um módulo)
- [ ] Módulo novo → `docs/MODULOS.md` + `src/shared/config/modules.config.ts`
- [ ] Migração/tabela/coluna/RPC/RLS → `docs/BANCO_DE_DADOS.md`
- [ ] Edge Function nova/alterada → `docs/EDGE_FUNCTIONS.md`
- [ ] Permissão/papel/RBAC → `docs/RBAC_PERMISSOES.md`
- [ ] Hook/lib/padrão de front → `docs/GUIA_FRONTEND.md`
- [ ] White Label/tenant/branding → `docs/WHITE_LABEL.md`
- [ ] Nada disso se aplica → declarei abaixo a linha de escape com motivo real

<!-- Escape (apenas se NENHUMA doc se aplica): escreva numa linha própria,
     SEM indentação, no corpo desta PR, substituindo o motivo:

       docs: não se aplica — <motivo real e específico>

     O exemplo acima (indentado, dentro deste comentário) NÃO satisfaz o
     guard quando ele estiver ativo — a linha real precisa começar a linha. -->

## Qualidade

- [ ] `npm run check:docs && npm run check:migrations && npm run lint && npm run build` verdes (ou `npm run gate`)
- [ ] RBAC/RLS respeitados quando a mudança toca dado protegido
- [ ] Nenhum hardcode de nome/marca de cliente introduzido em `src/` fora de `@/core/tenant`
- [ ] Nenhuma funcionalidade não implementada foi documentada

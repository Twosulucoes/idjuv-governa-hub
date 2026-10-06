## O que muda

<!-- Resumo objetivo da mudança e do porquê. -->

## Premissas e fora de escopo

<!-- Premissas adotadas (sessão autônoma) e o que ficou de fora, com motivo. -->

## Documentação (matriz em docs/GOVERNANCA_DOCUMENTACAO.md)

- [ ] Doc(s) da matriz atualizada(s) na mesma PR
- [ ] Nada se aplica — declarei a linha de escape com motivo real

<!-- Escape (apenas se NENHUMA doc se aplica): escreva numa linha própria, SEM
     indentação e fora de checkbox, no corpo desta PR, trocando o motivo:

       docs: não se aplica — <motivo real e específico>

     O exemplo acima (indentado, dentro deste comentário) NÃO satisfaz o guard
     `docs-guard` quando ele estiver ativo (hoje só `workflow_dispatch`; ver
     docs/GOVERNANCA_DOCUMENTACAO.md §6) — a linha real precisa começar a linha. -->

## Qualidade e segurança

- [ ] `bash scripts/gate.sh` verde (typecheck/lint sem piora vs. baseline, build ok) — colar o resultado
- [ ] Tabela/coluna nova com RLS e políticas na própria migração
- [ ] RBAC verificado no banco e na rota (não só no front)
- [ ] Sem nome de cliente em `src/`, sem dados de cliente em `public/`, arquivos gerados do Supabase intocados

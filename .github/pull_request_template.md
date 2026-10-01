## O que muda

<!-- Resumo objetivo da mudança e do porquê. -->

## Premissas e fora de escopo

<!-- Premissas adotadas (sessão autônoma) e o que ficou de fora, com motivo. -->

## Documentação (matriz em docs/GOVERNANCA_DOCUMENTACAO.md)

- [ ] Doc(s) da matriz atualizada(s) na mesma PR
- [ ] Nada se aplica — `docs: não se aplica — <motivo real>`

## Qualidade e segurança

- [ ] `bash scripts/gate.sh` verde (typecheck/lint sem piora vs. baseline, build ok) — colar o resultado
- [ ] Tabela/coluna nova com RLS e políticas na própria migração
- [ ] RBAC verificado no banco e na rota (não só no front)
- [ ] Sem nome de cliente em `src/`, sem dados de cliente em `public/`, arquivos gerados do Supabase intocados

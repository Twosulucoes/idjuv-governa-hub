# Plano — Onda B / B2: férias, licenças, viagens e frequência por permissão, e autoatendimento

Spec: [`2026-10-10-onda-b-rh-permissoes-design.md`](../specs/2026-10-10-onda-b-rh-permissoes-design.md).
Migração: `supabase/migrations/20261010090000_onda_b_rh_permissoes.sql` (depois da B1 e da S0).

| # | Tarefa | Agente | Verificação |
|---|---|---|---|
| 1 | Gerador: `escrita=` com lista, `;excluir=`, `;insere_proprio`, `;sem_autoaprovacao`, `;coluna=`; `proprio_leitura` com `coluna=`/`excluir=`; `mapa.csv` das tabelas da spec §2; regenerar `35_policies_geradas.sql` | dev-banco-supabase | `gerar-rls.mjs --check` verde; diff do SQL só nas tabelas da lista |
| 2 | `testar-rls.sql`: personas por código da lista, "não decide sobre o próprio", inserção própria com campos forçados, DELETE por outro código, trigger de etapa | dev-banco-supabase | teste reprova na cópia do baseline sem a migração e aprova com ela |
| 3 | Migração: policies geradas + drop `acesso_total_*`/`rh_module_*`; privilégios; trigger de etapa; `forcar_campos_iniciais` por permissão (função + triggers do RH) e overlay 20 | dev-banco-supabase | duas aplicações sem erro em cópia do baseline e do só-migrações |
| 4 | Front: gates em licenças e lançamento de frequência; `.select()` no DELETE de licença; hooks do autoatendimento por `user.servidorId`; atalhos em `/meu-perfil`; menu da configuração da frequência; `MODULE_PERMISSIONS.rh` | dev-frontend-idjuv | `tsc -p tsconfig.app.json` e lint sem piora; telas abertas no navegador |
| 5 | Merge da branch da S0 na B2; replay e regeneração do baseline | — | `validar-migracoes.sh` 0 falhas; `validar-baseline.sh` APROVADO |
| 6 | Revisão: `revisor-seguranca-idjuv` e `revisor-codigo-idjuv` | — | sem bloqueantes |
| 7 | Docs: `RBAC_PERMISSOES.md` (subseção B2 e consulta de dimensionamento), `BANCO_DE_DADOS.md`, README do baseline, `FINALIZACAO.md`, `ROADMAP.md` | documentador-idjuv | `check-doc-links.mjs` |
| 8 | `bash scripts/gate.sh`; commit; push; PR rascunho empilhada na B1 | — | gate verde lido; CI verde |

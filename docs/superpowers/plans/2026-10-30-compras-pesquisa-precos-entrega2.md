# Plano: pesquisa de preços, entrega 2

Spec: `docs/superpowers/specs/2026-10-30-compras-pesquisa-precos-entrega2-design.md`. Execução na própria sessão
(executing-plans), uma tarefa por vez, com teste antes do código nas partes puras.

1. **Banco**: migração `20261110090000_compras_pesquisa_precos_pca_ata.sql` (2 colunas, índice, comentários);
   schema do baseline (`01_pre_data.sql`, `03_post_data.sql`); `types.ts` no formato do gerador; casos no
   `testar-rls.sql`. Verificar: `validar-migracoes.sh` + `validar-baseline.sh` com `PG_REPLAY`.
2. **Lógica pura** com testes: `mesmaUnidade`, `palavrasDaBusca`, `descricaoCombina`, `preMarcar`,
   `termosDoCatalogo`, `compararComAta` (`pesquisaPrecos.ts`); `lerItensColados` (`itensColados.ts`); comparação e
   pendência no `montarItemRelatorio`; seção 6 no `textoNotaTecnica`.
3. **Edge Function**: `pncp_busca` com `urlBuscaPncp`, `referenciaDaBusca` e `itemCombina` testados em
   `portal.test.ts`.
4. **Hook**: `buscarPrecosPncp`, `useSugestaoCatalogo`, `useSalvarItensPesquisa` (lote), `useItensPcaDoSei`,
   `usePcaDosItens`, `useLevarAoPca`.
5. **Telas**: `BuscarPrecosDialog` (apaga `BuscaComprasGovDialog`), `ColarItensDialog`, `ImportarPcaDialog`,
   `ItemCard` (botão único, menu, PCA, ata), página (botões "Colar itens do TR" e "Trazer do PCA").
6. **Saídas**: PDF (preço da ata e diferença no item e no resumo), planilha (colunas novas no resumo), teste do PDF.
7. **Docs**: spec, ROADMAP, BANCO_DE_DADOS, NOVO_BANCO/baseline README, EDGE_FUNCTIONS, GUIA_FRONTEND, ESTADO.
8. **Verificação**: testes puros, typecheck contra a main, guards locais, banco; PR em rascunho.

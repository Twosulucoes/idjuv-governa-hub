# Compras: pesquisa de preços (entrega 2) — busca simples, PCA e comparação com a ata

**Data:** 2026-10-30 · **Módulo:** Compras · **Classificação:** bounded (2 colunas novas numa tabela que já tem RLS,
ação nova na Edge Function só de leitura, telas) · **Migração:** `20261110090000_compras_pesquisa_precos_pca_ata.sql`
· **Entrega 1:** `2026-10-29-compras-pesquisa-precos-design.md`

## 1. Problema

Na entrega 1, cada item tem três botões (Compras.gov.br, PNCP, À mão). A busca no Compras.gov.br exige o código do
CATMAT ou do CATSER no item, e o PNCP só aceita o link de um edital. Quem usou achou a busca complicada (30/10/2026).
Faltavam ainda três pontos que apareceram na conversa sobre a rotina da EPC:

1. o valor do DFD (estimativa preliminar do PCA) pode sair de uma pesquisa no sistema, mas a pesquisa não conversa com o
   item do PCA;
2. numa adesão, a pesquisa existe para comparar o preço registrado na ata com o de mercado (Lei 14.133/2021, art. 86,
   § 2º, II), e a tela não guarda nem compara o preço da ata;
3. os itens do TR são digitados um a um.

## 2. Base normativa

- Lei 14.133/2021, art. 23 (pesquisa de preços), art. 86, § 2º, II (adesão: valores registrados compatíveis com os de
  mercado, na forma do art. 23) e art. 107 (prorrogação: preços e condições mais vantajosos).
- Decreto estadual 37.424-E, art. 32 (vantajosidade da adesão a cargo do aderente).
- Decreto estadual 39.050-E/2025, art. 5º, § 1º (DFD com estimativa preliminar do valor e a fonte) e arts. 17 e 18
  (parâmetros, prazos e saneamento), sem mudança no cálculo da entrega 1.

## 3. Escopo

1. **Um botão "Buscar preços"** no item. A pessoa digita (ou aceita) o nome do produto, já preenchido com o começo da
   descrição do item. O sistema:
   - sugere o código do catálogo pelo nome (cópia local do CATMAT/CATSER, a mesma busca do PCA), já escolhendo o
     primeiro resultado, com "trocar". O código escolhido fica gravado no item;
   - busca, ao mesmo tempo, os preços do Compras.gov.br (inciso I) por esse código e os resultados homologados do PNCP
     (inciso II) pelo nome, nos 12 meses antes da data de referência;
   - mostra tudo numa lista só, com a fonte de cada linha, e já marca os 10 preços mais recentes **da mesma unidade
     do item** cuja descrição tem as palavras buscadas. A pessoa desmarca o que não for o mesmo produto e clica em
     "Usar estes preços".
   - Se uma das fontes falhar, a outra aparece e a tela avisa qual não respondeu.
2. **"Adicionar outro preço"**: menu menor com "Edital do PNCP pelo link" (o diálogo da entrega 1) e "Orçamento, site
   ou nota fiscal" (lançamento à mão, incisos I a V).
3. **Colar os itens do TR**: a pessoa copia a tabela de itens do TR (Word ou Excel) e cola. O sistema reconhece as
   colunas pelo cabeçalho (item, descrição, unidade, quantidade, código CATMAT/CATSER) ou, sem cabeçalho, pela ordem
   nº, descrição, unidade, quantidade. Mostra a prévia e cria os itens de uma vez.
4. **PCA**:
   - "Trazer itens do PCA" lista os itens ativos do PCA com o mesmo nº SEI da pesquisa (ou outro nº digitado) e cria
     os itens da pesquisa com o catálogo, a unidade e a quantidade do PCA, ligados a ele (`pca_item_id`);
   - o item ligado mostra o valor do PCA (estimativa preliminar do DFD) ao lado do estimado na pesquisa, com a
     diferença;
   - "Levar ao PCA" grava o valor unitário estimado no item do PCA. Só para quem tem `compras.pca.editar` (a RLS do PCA
     decide), e o histórico do PCA registra a mudança.
5. **Comparação com a ata ou o contrato** (finalidade "Adesão a ata" ou "Prorrogação de contrato"):
   - campo "Preço registrado na ata" (ou "Preço do contrato vigente") no item;
   - diferença em relação ao valor estimado, "abaixo", "igual" ou "acima";
   - pendência quando o preço fica acima do estimado: demonstrar a compatibilidade ou negociar (art. 86, § 2º, II, ou
     art. 107);
   - entra no PDF, na planilha e numa seção 6 do texto de apoio da nota técnica.

Fora desta entrega: levar o valor ao DFD do SEI (o DFD é ato do SEI; o sistema só mostra o valor e a fonte para
copiar) e outras fontes de preço.

## 4. Desenho

- **Banco:** `pesquisas_precos_itens` ganha `pca_item_id uuid REFERENCES pca_itens(id)` e
  `preco_comparado numeric(15,4) CHECK (> 0)`. Mesma RLS (classe `permissao`), mesmo gatilho (trava a pesquisa
  concluída). Índice parcial em `pca_item_id`. A coluna `pesquisas_precos.pca_item_id` da entrega 1 continua sem uso.
- **Edge Function `pesquisa-precos`:** ação nova `pncp_busca` (termo de 3 a 80 caracteres e período). Usa a busca
  pública do PNCP (`/api/search/`, editais), lê até 8 compras, os itens cuja descrição contém as palavras do termo e
  com resultado, até 3 por compra, e devolve os resultados homologados dentro do período. Mesmo host, sem
  redirecionamento, 25 s por chamada; compra que falha é pulada.
- **Lógica pura** (`src/lib/compras/`): `mesmaUnidade`, `palavrasDaBusca`, `descricaoCombina`, `preMarcar`,
  `termosDoCatalogo` e `compararComAta` em `pesquisaPrecos.ts`; `lerItensColados` em `itensColados.ts`; comparação
  no `montarItemRelatorio` e seção 6 em `textoNotaTecnica`.
- **Front:** `BuscarPrecosDialog` (substitui `BuscaComprasGovDialog`), `ColarItensDialog`, `ImportarPcaDialog`; o
  `ItemCard` com um botão principal e o menu "Adicionar outro preço"; bloco do PCA e da ata no item.

## 5. Riscos e limites

- A busca pública do PNCP (`/api/search/`) não tem manual oficial; os campos (`orgao_cnpj`, `ano`,
  `numero_sequencial`, `numero_controle_pncp`) foram tirados de clientes públicos. Como na entrega 1, o primeiro teste
  real é depois do merge. Erro aparece como aviso na lista, sem impedir os preços do Compras.gov.br.
- A busca pelo nome no PNCP depende das palavras: nomes muito genéricos trazem itens de outro produto. Por isso só os
  que têm as palavras buscadas vêm marcados, e a pessoa confere antes de usar.

## 6. Verificação

- Vitest: `pesquisaPrecos.test.ts`, `itensColados.test.ts`, `relatorioPesquisaPrecos.test.ts`,
  `supabase/functions/pesquisa-precos/portal.test.ts` e o teste do PDF.
- Banco: `validar-migracoes.sh` + `validar-baseline.sh` com casos novos no bloco "Compras: pesquisa de preços" de
  `scripts/db/testar-rls.sql`.

# Compras: pesquisa de preços (entrega 1)

**Data:** 2026-10-29 · **Módulo:** Compras · **Classificação:** bounded (tabelas novas com RLS, Edge Function nova,
telas e documento novos) · **Migração:** `20261106090000_compras_pesquisa_precos.sql`

## 1. Problema

A pesquisa de preços dos processos é feita hoje fora do sistema, em ferramenta paga (Banco de Preços) ou em planilha,
e o resultado é copiado para o SEI. O sistema já tem o catálogo CATMAT/CATSER (PCA) e os processos, mas não guarda os
preços pesquisados, de onde vieram, nem o cálculo. Pedido: fazer a pesquisa no próprio sistema, com as fontes oficiais
(Compras.gov.br e PNCP), fonte rastreável em cada preço, saneamento e coeficiente de variação conforme o Decreto
estadual 39.050-E/2025 (arts. 17 e 18) e um relatório pronto para anexar ao SEI.

## 2. Base normativa usada

- Lei 14.133/2021, art. 23, § 1º (parâmetros da pesquisa de preços).
- Decreto estadual 39.050-E/2025: art. 2º, IX e X (preço excessivamente elevado e inexequível: 30% acima ou abaixo
  da média); art. 17, I a V (parâmetros e prazos: I e II até 12 meses; III e IV até 6 meses; V até 12 meses),
  § 1º (justificar quando não usar I e II), § 3º (requisitos do orçamento de fornecedor); art. 18, § 1º, VII (média
  saneada quando o CV ficar em até 30%, mediana quando passar) e §§ 2º, 3º, 6º e 8º (menos de 3 preços, justificativa).
- O texto integral do decreto não está na base do projeto: a implementação seguiu o resumo usado pela EPC na nota
  técnica de vantajosidade (planilha 04-02), e o teste unitário reproduz aquele cálculo.

## 3. Escopo

1. **Pesquisa** por processo SEI: objeto, finalidade, data de referência (de onde contam os prazos), responsáveis,
   situação `em_andamento`/`concluida`. Concluída fica travada no banco até reabrir.
2. **Itens**: material (item do CATMAT ou tipo de material inteiro) ou serviço do CATSER, descrição, unidade,
   quantidade, método escolhido e justificativa.
3. **Amostras** (preços) com o inciso do art. 17, a origem e a fonte completa (órgão, UASG, UF, município, compra ou
   ata, data, fornecedor, marca, unidade, quantidade, preço, link e data e hora da consulta). Desconsiderar exige
   motivo e o preço continua no relatório.
4. **Coleta**:
   - inciso I: busca no Compras.gov.br (módulo Pesquisa de Preço da API de dados abertos) pelo código do catálogo, no
     período dos 12 meses antes da data de referência, com filtro de UF e unidade;
   - inciso II: contratação similar no PNCP, colando o link do edital ou o número de controle (resultado homologado
     por item);
   - incisos I a V: lançamento à mão com os campos que cada inciso pede (site com endereço e hora de acesso,
     orçamento com CNPJ/CPF, nota fiscal com emitente).
5. **Cálculo** na tela (`src/lib/compras/pesquisaPrecos.ts`): média, desvio padrão amostral, limites de ±30%, válidos,
   média saneada, CV, mediana, menor; método sugerido pelo CV; avisos de prazo por inciso; pendências (menos de
   3 preços, método diferente sem justificativa, preço fora do prazo).
6. **Saídas**: relatório PDF `compras-pesquisa-precos` (camada `src/lib/documentos/`), planilha Excel e texto de apoio
   das seções 2 a 5 da nota técnica, com `[JUSTIFICAR]` onde quem assina completa. A nota técnica é redigida e
   assinada no SEI.

Fora desta entrega: outras fontes (painéis estaduais, Banco de Preços, Licitar Digital), pesquisa automática por
palavra-chave, ligação com o processo de contratação e com o item do PCA na tela (a coluna `pca_item_id` já existe).

## 4. Desenho

- **Banco:** `pesquisas_precos`, `pesquisas_precos_itens`, `pesquisas_precos_amostras`; gatilho
  `pesquisa_precos_conferir` (autoria, nº SEI aparado, trava de pesquisa concluída, `55000`). Permissões
  `compras.pesquisa_precos.visualizar` e `compras.pesquisa_precos.editar`, concedidas a quem tem `compras.criar`. RLS
  classe `permissao` gerada do `rls/mapa.csv`; a pesquisa não se apaga pela API. A mesma linha da fonte não entra duas
  vezes no item (`UNIQUE (item_id, id_externo)`). CHECKs exigem a fonte mínima por inciso (III: link ou órgão; IV e V:
  CNPJ/CPF e nome).
- **Edge Function `pesquisa-precos`** (só leitura, sem service role): `precos_compras`, `pncp_compra` e
  `pncp_resultados`. Exige sessão, módulo `compras` e uma das duas permissões, conferidos com o token do usuário.
  Hosts fixos (`dadosabertos.compras.gov.br`, `pncp.gov.br`), sem redirecionamento, 25 s por chamada. O navegador não
  chama os portais (CORS e CSP). A `catalogo-compras` passa a aceitar `itens_pdm` também com
  `compras.pesquisa_precos.editar`, para escolher o item do CATMAT no item da pesquisa.
- **Front:** `usePesquisaPrecos`, telas `/compras/pesquisa-precos` e `/compras/pesquisa-precos/:id`, componentes em
  `src/components/compras/pesquisa-precos/`, menu Compras → "Pesquisa de preços".
- **LGPD:** CPF de fornecedor pessoa física sai mascarado no PDF e na planilha (`documentoNoRelatorio`).

## 5. Riscos e limites

- A API do Compras.gov.br e a do PNCP não puderam ser chamadas do ambiente de desenvolvimento (rede bloqueada); os
  nomes dos campos foram conferidos em clientes públicos dessas APIs. O primeiro teste real é depois do merge, com a
  função publicada; erro de formato aparece como `502` com mensagem em português, sem gravar nada.
- A busca do Compras.gov.br traz até 6 páginas de 500 preços; acima disso a tela avisa para reduzir o período ou usar
  o item exato do CATMAT.

## 6. Verificação

- Vitest: `src/lib/compras/pesquisaPrecos.test.ts`, `relatorioPesquisaPrecos.test.ts`,
  `supabase/functions/pesquisa-precos/portal.test.ts`, `src/lib/documentos/__testes__/compras-pesquisa-precos.test.ts`.
- Banco: `scripts/db/validar-baseline.sh` com o bloco "Compras: pesquisa de preços" de `scripts/db/testar-rls.sql`.

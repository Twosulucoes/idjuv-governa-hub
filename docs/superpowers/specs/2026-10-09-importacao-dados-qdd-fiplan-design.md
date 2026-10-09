# Importação de dados + QDD do FIPLAN — desenho

- **Data:** 2026-10-09 · **Classificação:** architectural (tabela nova, RPC nova, permissão nova, tela nova)
- **Pedido (Fabiano):** "criar uma estrutura de importação de dados; uma delas é atualizar o QDD a partir
  da importação do PDF do próprio FIPLAN" (exemplo anexado: QDD 2027, UO 17.302, PAOE 2544, 12 dotações).

## Premissas (sessão autônoma, registradas em vez de perguntadas)

1. A estrutura é **genérica no front** (contrato `Importador` + assistente único + histórico) e **específica no
   banco** (cada importador tem a sua RPC, que confere a própria permissão). O log é uma tabela só: `importacoes`.
2. A leitura do PDF acontece **no navegador** (pdf.js, carregado sob demanda). O PDF não é guardado: o log grava
   nome, tamanho e SHA-256.
3. O QDD do FIPLAN é a **fonte da verdade** dos valores que traz: dotações existentes são sobrescritas,
   as novas são criadas. **Nada é apagado**: dotações do mesmo PAOE que não vieram no arquivo só aparecem
   como aviso.
4. Programa, ação (PAOE), natureza e fonte que não existirem são **criados** junto (natureza e fonte com nome
   provisório "revisar descrição", porque o relatório só traz o código).
5. Permissão nova `orcamento.importar` (módulo financeiro). Quem só tem `orcamento.visualizar` vê o QDD mas
   não importa.
6. Migração vai no repositório e é aplicada pelo fluxo vigente (#45: CI aplica no merge). Nada foi aplicado em
   banco remoto por esta entrega.

## Fluxo

```
arquivo ─► ler (navegador) ─► problemas de leitura? ─sim─► mostra e bloqueia
                               │não
                               ▼
                 RPC com p_simular = true ─► pré-visualização (nova / atualiza / sem mudança,
                                             cadastros a criar, ausentes, arquivo já importado)
                               │ confirmar
                               ▼
                 RPC com p_simular = false ─► transação: grava + linha em `importacoes`
```

## Leitura do QDD (PDF)

- Texto posicionado por página (`src/lib/importacao/pdfTexto.ts`), agrupado em linhas.
- Cabeçalho "Rótulo: valor" define o contexto do bloco (exercício, função, subfunção, programa, PAOE, regional).
  Vários blocos/páginas no mesmo PDF são suportados.
- Valores vão para a coluna pela posição (números alinhados à direita × borda direita do título da coluna),
  porque colunas vazias somem no texto corrido.
- Conferências: soma das linhas = "Total Geral" de cada bloco (erro), Inicial + Suplementado − Anulado =
  Atual (aviso), exercício único, classificação no padrão.

## Banco

- `importacoes`: log; RLS `SELECT` por `can_access_module(modulo)`; sem policy de escrita (só as RPCs gravam).
- `importar_qdd_fiplan(p_exercicio, p_linhas, p_arquivo, p_simular)`: `SECURITY DEFINER`, exige perfil ativo,
  módulo financeiro e `orcamento.importar`; lock por exercício; valida cada linha; devolve o diff.
- Chave da dotação (`codigo_dotacao`, única por exercício):
  `função.subfunção.programa.PAOE.regional.natureza.fonte.cod_acomp.IDU`. Dotações do importador antigo de
  planilha (`natureza.fonte.IDU`) são reconhecidas e migradas para a chave nova.
- `valor_atual` e `saldo_disponivel` continuam calculados pela tabela (o "Disponível" do FIPLAN não é gravado).

## Pontos em aberto (registrados na revisão)

- **Execução (empenhado, liquidado, pago):** o importador grava os valores do FIPLAN, mas os triggers de
  empenho/liquidação/pagamento do módulo financeiro também somam nessas colunas. Se o fluxo interno de
  empenhos passar a ser usado junto com a importação, os valores contam em dobro. Decisão pedida ao
  Fabiano; até lá vale "o FIPLAN manda".
- **`orcamento.importar` não é fronteira de escrita:** a RLS atual de `fin_dotacoes` e dos catálogos libera
  escrita a quem acessa o módulo financeiro. A permissão controla a tela e a RPC (e garante o log).
  Endurecer é mudança de RLS existente e fica para uma decisão separada.
- Só os totais de Inicial e Atual são conferidos: nas linhas de total o FIPLAN desalinha o terceiro valor.
- Leitura testada com o PDF de exemplo (um PAOE) e com variações sintéticas (dois PAOEs, total do
  relatório, bloco sem total, IDU faltando). Vale conferir com um QDD real de vários PAOEs.

## Fora de escopo

- Outros importadores (a estrutura está pronta para eles).
- Guardar o PDF no Storage.
- Desfazer uma importação (o log guarda o antes/depois de cada campo para conferência manual).

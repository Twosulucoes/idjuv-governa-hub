# Compras: gerador do PCA (Plano de Contratações Anual)

- **Data:** 2026-10-23
- **Classificação:** architectural (tabelas novas, catálogo externo, telas novas no módulo `compras`, IA)
- **Pedido:** thread "Gerador de PCA". O usuário pediu um gerador de PCA (Lei 14.133/2021, art. 12, VII) e decidiu,
  em conversa: só Compras lança, a partir dos DFDs que chegam pelo SEI; o sistema faz as planilhas e os relatórios,
  usando IA; uma base geral de necessidades ("de uma agulha a um foguete") para não esquecer nada; cruzamento com as
  fontes de recurso pelo teto da PLOA; publicação no PNCP começa pela planilha (o Instituto nunca publicou PCA).
  Aprovou o desenho em quatro entregas ("pode").

## 1. O que já existe

| Já existe | Uso no PCA |
|---|---|
| Módulo `compras` (`/compras` só com painel), permissões `compras.visualizar`, `compras.criar` | Rotas e RBAC do PCA |
| `estrutura_organizacional` | Setor requisitante de cada demanda |
| `fin_acoes_orcamentarias`, `fin_fontes_recurso`, `fin_naturezas_despesa`, `fin_dotacoes` (QDD do FIPLAN) | Teto por ação × fonte; troca da PLOA pelo QDD quando ele chega |
| `fin_empenhos` (inclusive os importados do FIP 614) | Gasto dos anos anteriores, por natureza de despesa |
| `contratos` (`data_fim_atual`), `atas_registro_preco` (`data_vigencia_fim`) | Contratos e atas que vencem no ano do PCA |
| `estoque`, `movimentacoes_estoque`, `bens_patrimoniais` | Consumo do almoxarifado e bens em fim de vida |
| Motor de documentos `src/lib/documentos/` e exportação xlsx (`src/export/`) | PDF e planilhas do PCA |
| Edge Function `conciliacao-ia-sugestoes` (Gemini, chave `GEMINI_API_KEY` no servidor) | Mesmo padrão para a IA do PCA |

**Não existe:** tabela de DFD, de PCA nem de catálogo de materiais e serviços.

## 2. Premissas

1. O DFD oficial é do SEI. O sistema guarda só os dados que o PCA precisa de cada DFD (número SEI, setor, item,
   quantidade, valor, mês, prioridade), sem redigir o DFD.
2. Só quem tem a permissão de PCA lança e edita (Compras). Os setores não acessam a tela.
3. O PCA é de um exercício (o ano seguinte). Há no máximo um PCA por exercício; revisões ao longo do ano mudam o
   mesmo PCA e ficam no histórico.
4. A aprovação é ato da presidência no SEI. O sistema registra o número do processo SEI, a data de aprovação e a data
   de publicação no PNCP, sem gerar o ato.
5. A IA sugere; quem decide é Compras. Nada entra no PCA sem a pessoa aceitar a sugestão.

## 3. Catálogo de materiais e serviços (CATMAT/CATSER)

Fonte: portal de dados abertos do Compras.gov.br (`dadosabertos.compras.gov.br`, módulos `modulo-material` e
`modulo-servico`), público e sem chave. Medido em 2026-10-23: 250.149 itens de material ativos, 20.444 PDMs
(padrões descritivos, ex.: "CLIPE") e 3.022 serviços.

- **Cópia local da hierarquia:** materiais (grupo → classe → PDM) e serviços (seção → divisão → grupo → classe →
  serviço) ficam no banco (tabelas `cat_*`, só leitura para quem usa o PCA). É o que serve de checklist e de busca.
- **Itens de material sob demanda:** os 250 mil itens não são copiados. Ao lançar uma demanda, Compras escolhe o PDM
  na cópia local e o sistema busca os itens daquele PDM no portal por uma Edge Function (`catalogo-compras`); o item
  escolhido é gravado no banco. Assim a base fica pequena e o item usado fica sempre disponível.
- **Atualização:** a Edge Function também sincroniza a hierarquia (botão "Atualizar catálogo", só para quem tem a
  permissão de PCA; guarda a data da última atualização). A função só chama o domínio fixo do portal.
- Se o portal estiver fora do ar, a busca local por PDM continua funcionando e a tela avisa que os itens não puderam
  ser carregados; dá para lançar só com o PDM e completar o item depois.

## 4. Dados (entrega 1)

Tabelas novas, todas com RLS na mesma migração (skill `migracao-segura-idjuv`), leitura com `compras.pca.visualizar`
e escrita com `compras.pca.editar`, admin incluso:

- `pca_planos`: exercício (único), situação (`rascunho`, `enviado_sei`, `aprovado`, `publicado`), processo SEI,
  data de aprovação, data de publicação no PNCP, observações, quem criou/alterou.
- `pca_tetos`: plano, ação orçamentária, fonte de recurso, valor previsto na PLOA, origem (`ploa` ou `qdd`).
  Fonte que não está no QDD (convênio, emenda) entra como fonte de recurso cadastrada.
- `pca_itens`: plano, número do DFD/processo SEI, setor requisitante, tipo (material/serviço), PDM ou serviço do
  catálogo, item de material (opcional), descrição, unidade de fornecimento, quantidade, valor unitário estimado,
  valor total (calculado), mês desejado, prioridade (alta/média/baixa), ação e fonte, natureza de despesa, justificativa
  curta, origem (`dfd` ou `sugestao_aceita`), situação (`ativo`, `excluido`).
- `pca_historico`: trilha das mudanças de situação e das revisões depois de aprovado (gravada por gatilho).
- `cat_*`: hierarquia do catálogo e itens de material já usados.
- `pca_sugestoes` (entrega 3): sugestão do cruzamento, explicação da IA, decisão (aceita/descartada), motivo e quem decidiu.

Permissões novas no catálogo de permissões do módulo `compras`: `compras.pca.visualizar`, `compras.pca.editar`.
Depois de `aprovado`, editar exige registrar o motivo (vira revisão no histórico).

## 5. Telas

Rota `/compras/pca` (lista de PCAs por exercício) e `/compras/pca/:exercicio` com abas:

1. **Itens:** tabela com filtros (setor, fonte, mês, prioridade, grupo do catálogo); botão "Lançar DFD" abre o
   formulário com busca no catálogo.
2. **Orçamento:** teto PLOA por ação × fonte (editável), total do PCA e diferença (sobra ou falta), destacando as
   fontes estouradas. Quando houver QDD do exercício em `fin_dotacoes`, botão para trocar o teto pelo QDD.
3. **Sugestões** (entrega 3).
4. **Documentos:** PDF e planilhas (entrega 2).
5. **Situação:** avançar a situação, número SEI e datas (entrega 4).

## 6. Relatórios e planilhas (entrega 2)

- **PDF do PCA** pelo motor (`src/lib/documentos/`): identificação, resumo por fonte e por setor, cronograma por mês,
  lista de itens. É relatório, não ato: a aprovação continua no SEI.
- **Planilhas xlsx:** geral, por setor, por fonte, por mês e por grupo do catálogo.
- **Planilha do PNCP:** colunas no formato de carga do PCA no portal do PNCP. Os nomes e a ordem das colunas são
  conferidos com o modelo de planilha do PNCP na implementação (o modelo entra como teste com dados fictícios).

## 7. Caça ao esquecido (entrega 3)

Primeiro o sistema cruza, sem IA, e monta a lista de possíveis faltas:

| Fonte | Regra |
|---|---|
| Contratos e atas | vigência termina no exercício do PCA ou até 3 meses depois, sem item do PCA no mesmo PDM/serviço ou natureza |
| Empenhos dos 2 anos anteriores | natureza de despesa com gasto e sem nenhum item no PCA |
| Almoxarifado | item com saída nos últimos 12 meses e sem item do PCA no mesmo grupo |
| Patrimônio | bem com vida útil esgotada no exercício, agrupado por classe |
| PCA anterior | item que estava no PCA do ano anterior e não está no atual |
| Catálogo | grupos/seções sem nenhum item, para a pessoa confirmar que não precisa |

Depois a IA (Edge Function `pca-ia-sugestoes`, mesmo padrão da conciliação: confere sessão e permissão, chave só no
servidor, sem dado pessoal no texto enviado) recebe essa lista resumida e devolve, para cada sugestão, uma explicação
curta e um item de catálogo provável. Cada sugestão pode ser **aceita** (vira item do PCA com origem
`sugestao_aceita`, a completar) ou **descartada** com motivo; as duas ficam registradas para não voltar na próxima
rodada. Sem chave de IA configurada, a lista do cruzamento aparece sem as explicações.

## 8. Situação e publicação (entrega 4)

`rascunho` → `enviado_sei` (pede o número do processo SEI) → `aprovado` (data da aprovação) → `publicado` (data no
PNCP). Voltar de situação só com motivo. A integração direta com a API do PNCP fica fora deste desenho; exige o
cadastro do órgão como usuário de integração e entra em outra spec.

## 9. Fora do escopo

- Setores lançando as próprias demandas.
- Redação do DFD, ETP ou TR (é do SEI; o assistente de instrução está em outra proposta).
- Pesquisa de preços (valor estimado é digitado).
- Envio automático ao PNCP.

## 10. Testes e verificação

- Vitest: cálculo de totais e diferença por ação × fonte; regras do cruzamento (com dados fictícios); montagem das
  planilhas (inclusive a do PNCP) e do modelo do PDF.
- Banco: RLS das tabelas novas no teste do baseline (`scripts/db/validar-baseline.sh`).
- `bash scripts/gate.sh` verde em cada PR; docs da matriz e `ROADMAP.md` na mesma PR.

## 11. Entregas

| # | Entrega | Migração |
|---|---|---|
| 1 | Catálogo (cópia local + Edge Function), PCA, tetos e itens, telas Itens e Orçamento | sim (pede o "sim") |
| 2 | PDF e planilhas, inclusive a do PNCP | não |
| 3 | Cruzamento + IA de sugestões | pequena (registro de sugestões) |
| 4 | Situação, SEI e datas | não (colunas já na 1) |

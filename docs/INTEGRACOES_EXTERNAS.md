# Integrações e fontes de dados externas

Dono do assunto: **toda API ou base pública de fora do sistema** que ele usa hoje ou que foi registrada como
fonte para uso futuro. Diz onde cada uma é chamada, se precisa de chave, como está e o que falta.
Detalhe de cada Edge Function: [`EDGE_FUNCTIONS.md`](./EDGE_FUNCTIONS.md). Segredos: só em `supabase secrets`
(nunca no front nem nesta doc).

Última revisão: 27/10/2026 (testes feitos de fora, com chamadas reais às APIs públicas e leitura do log das
Edge Functions da VPS). Em 29/10/2026 o Transferegov passou a ser lido todo dia (§4.5).

## 1. Regras para qualquer integração

1. **Chamada com chave passa por Edge Function.** O front só chama direto API pública sem chave.
2. **A CSP do front bloqueia endereço novo.** O `connect-src` de `deploy/nginx/cabecalhos-seguranca.conf`
   libera só o Supabase e `https://brasilapi.com.br`. API nova chamada pelo navegador precisa entrar ali; o
   caminho preferido é a Edge Function (o servidor chama, o navegador não).
3. **Host fixo e tempo limite.** A função monta a URL com host fixo (não aceita URL vinda do usuário) e usa
   tempo limite (`fetchComTempoLimite` de `supabase/functions/_shared/tempoLimite.ts`, ou `AbortSignal.timeout`). Sem tempo limite, a função fica presa até o runtime matar a requisição (ver §3).
4. **Copiar para o banco o que for consultado muito.** Catálogos e tabelas grandes viram cópia local
   sincronizada (padrão do `catalogo-compras`); consulta na hora só para detalhe.

## 2. Integrações em uso

| Integração | Onde é chamada | Para quê | Chave | Situação em 27/10/2026 |
|---|---|---|---|---|
| Compras.gov.br dados abertos (CATMAT/CATSER) — `dadosabertos.compras.gov.br` | Edge Function `catalogo-compras` (`supabase/functions/catalogo-compras/portal.ts`) | Cópia local do catálogo (PDM de material e serviços), item exato de material e natureza de despesa sugerida, no PCA | Não | **Funciona.** Os endpoints usados responderam 200; a sincronização de 23/10 gravou todas as páginas de PDM e de serviços sem erro |
| BrasilAPI feriados — `brasilapi.com.br/api/feriados/v1/<ano>` | Front, `src/hooks/useDatasImportantes.ts` | Feriados nacionais no calendário de datas importantes | Não | **Funciona** (200). Tem tempo limite de 4 s e, se falhar, o calendário segue só com os feriados cadastrados |
| API do Banco do Brasil (OAuth, extratos v2 com mTLS, validação de contas) | Edge Function `bb-api` | Extrato bancário e validação de conta na conciliação | Sim (`BB_CLIENT_ID`, `BB_CLIENT_SECRET`, `BB_APP_KEY`, certificado `BB_CERT_PEM`/`BB_KEY_PEM`, `BB_AMBIENTE`) | **Código pronto, credencial não conferível daqui.** O painel "API do Banco do Brasil" da conciliação mostra quais segredos estão presentes. Padrão é homologação até `BB_AMBIENTE=producao`. Tem tempo limite de 20 s |
| Google Gemini — `generativelanguage.googleapis.com` | Edge Functions `cpsi-ai-assistant` e `conciliacao-ia-sugestoes` | Sugestões da conciliação mensal; assistente do antigo CPSI (publicado, sem chamador no front desde a onda 5 do P23) | Sim (`GEMINI_API_KEY`; modelo em `GEMINI_MODEL`, padrão `gemini-flash-latest`) | **Corrigido em 27/10/2026.** Tempo limite de 40 s (`supabase/functions/_shared/tempoLimite.ts`); passou disso, a tela recebe "A IA não respondeu a tempo". Antes, em 23/10, uma sugestão de conciliação ficou presa até o runtime cancelar |
| Resend (e-mail) — `api.resend.com` | `supabase/functions/_shared/envio/` (usado por `enviar-notificacao` e `enviar-convite-reuniao`) | Envio de e-mail das notificações e convites | Sim (`RESEND_API_KEY`, `RESEND_FROM`) | Alternativa ao SMTP (`denomailer`); qual canal vale sai da configuração de envio no banco |
| WhatsApp Cloud API (Meta Graph `v21.0`) — `graph.facebook.com` | `supabase/functions/_shared/envio/` | Mensagem por modelo aprovado no WhatsApp | Sim (token na configuração de envio; `wa_phone_number_id` e modelos por uso) | Depende de conta Business e modelos aprovados. Sem isso, o convite de reunião cai no link `wa.me` (o usuário envia na mão) |
| Transferegov.br, arquivos CSV diários — `api-publica.transferegov.gestao.gov.br/downloads/dadosgov/` | GitHub Actions `.github/workflows/transferegov.yml` (`scripts/transferegov/sincronizar.mjs`), que grava pela Edge Function `transferegov` | Convênios federais no Financeiro (`/financeiro/convenios`): propostas, emendas, convênio, empenhos e desembolsos da União com o CNPJ da instituição | Não para ler; a gravação no banco usa o segredo próprio `TRANSFEREGOV_TOKEN` | **Integrado em 29/10/2026** (§4.5). Lê em fluxo, filtra pelo CNPJ e para se o leiaute do arquivo mudar; teste com os arquivos reais: 31 s |
| Mapas (OpenStreetMap e imagem de satélite ArcGIS) | Front, `src/components/inventario/MapaUnidadesCampanha.tsx` | Mapa das unidades na campanha de inventário | Não | Só imagens (`img-src https:` da CSP); nada a fazer |

Links de saída (compartilhar em redes sociais, certidões do TJRR/TRF1/TSE, lei no Planalto) são só links que o
usuário abre; não são integração.

## 3. Achados da revisão de 27/10/2026

1. **Gemini sem tempo limite** (`cpsi-ai-assistant`, `conciliacao-ia-sugestoes`). **Corrigido em 27/10/2026:**
   `fetchComTempoLimite` em `supabase/functions/_shared/tempoLimite.ts` (40 s até os cabeçalhos; depois `504` com
   mensagem clara). Use o mesmo helper em qualquer chamada externa nova.
2. **Versão solta do `supabase-js`** (`https://esm.sh/@supabase/supabase-js@2`, sem a versão exata), que mudava a
   função no deploy seguinte a uma versão nova no esm.sh. **Corrigido em 27/10/2026:** todas usam `@2.89.0`, menos
   `download-frequencia`, que segue fixada em `@2.49.4`.
3. **Erros "missing sub claim" no log** logo depois de cada deploy das funções: é o teste de fumaça do deploy
   chamando com a chave anônima, que as funções corretamente recusam. Não é falha.
4. **PNCP não é chamado pelo sistema.** O IDJUV está cadastrado e validado no PNCP (CNPJ ativo), mas a consulta
   pública não traz contratações, contratos nem PCA publicados por ele em 2026. A "planilha do PNCP" do PCA
   (entregas 2–4 do gerador de PCA) é arquivo para subir no portal, não API.

## 4. Transferegov.br (convênios e emendas federais)

### 4.1 Transferegov.br — APIs de dados abertos

Endereço: <https://api-publica.transferegov.gestao.gov.br> (o `http://` redireciona para `https://`). Pública,
sem chave, atrás de Cloudflare. Cada módulo tem a documentação interativa em `/<módulo>/docs` e o contrato
OpenAPI em `/<módulo>/openapi.json`:

| Módulo | Caminho | Conteúdo |
|---|---|---|
| Transferências Especiais | `/especiais` | Emendas individuais de transferência especial ("emenda Pix"): planos de ação (com parlamentar e número da emenda), beneficiários, empenhos, ordens bancárias, executores, relatórios de gestão |
| Gestão de Parcerias | `/parcerias` | Programas, propostas, parcerias, cronograma, empenhos, documentos hábeis, ordens de pagamento, extrato bancário, beneficiários e indicação de emenda parlamentar |
| Fundo a Fundo | `/fundoafundo` | Programas, planos de ação, termos de adesão, empenhos, lançamentos financeiros |
| Termo de Execução Descentralizada | `/ted` | Programas, planos de ação, termos, notas de crédito, programação financeira |

Como consultar (testado em 27/10/2026):

- Filtro vai na query string com o nome do campo, por exemplo
  `/parcerias/proposta?cnpj_ente_recebedor=<CNPJ só com dígitos>` ou `/especiais/beneficiarios-especiais?uf_beneficiario=RR`.
- **CNPJ só com os 14 dígitos**; com pontos e barra a API devolve 422.
- Paginação: `pagina` e `tamanho_da_pagina`. A resposta traz `data`, `total_items`, `total_pages`,
  `page_number` e `page_size`.
- `/<módulo>/data-atualizacao` diz a data da última carga (era 23/10/2026 nos módulos testados).

### 4.2 Transferegov.br — arquivos CSV (convênios e contratos de repasse, antigo Siconv)

Convênios, contratos de repasse e emendas das **transferências discricionárias e legais** não estão nas APIs
acima: saem só em arquivos CSV compactados, atualizados todo dia, listados em
`https://api-publica.transferegov.gestao.gov.br/downloads/dadosgov/?restype=container&comp=list`
(baixar com `.../downloads/dadosgov/<arquivo>.zip`). Os que interessam ao IDJUV:

| Arquivo | Conteúdo | Ligação |
|---|---|---|
| `siconv_proponentes` | Cadastro de quem pede recurso | `IDENTIF_PROPONENTE` = CNPJ |
| `siconv_proposta` | Propostas (órgão concedente, objeto, valores, situação, vigência) | `ID_PROPOSTA`; filtrar por `IDENTIF_PROPONENTE` |
| `siconv_emenda` | Emenda de cada proposta: número, parlamentar, tipo, valor | `ID_PROPOSTA` |
| `siconv_convenio` | Instrumento assinado: número, vigência, valores empenhado e desembolsado, saldo em conta | `ID_PROPOSTA` |
| `siconv_empenho`, `siconv_desembolso`, `siconv_pagamento`, `siconv_cronograma_desembolso` | Execução financeira do convênio | `NR_CONVENIO`/`ID_PROPOSTA` |

O `siconv_proposta` é grande (centenas de MB compactado); a leitura tem de ser em fluxo, filtrando pelo CNPJ,
sem guardar o arquivo inteiro.

### 4.3 O que já existe do IDJUV no Transferegov (27 e 29/10/2026)

- **Gestão de Parcerias, Transferências Especiais, Fundo a Fundo:** nada com o CNPJ do IDJUV como recebedor,
  executor ou beneficiário. Nas Transferências Especiais o beneficiário é o Estado de Roraima, não o IDJUV.
- **CSV (Siconv):** o IDJUV é proponente e tem **uma proposta**: nº 24745/2026, Ministério do Esporte,
  convênio, "Implementação e Desenvolvimento do Projeto Arena Jovem no Estado de Roraima", valor global
  R$ 2.453.000,00 (repasse R$ 2.450.000,00 e contrapartida R$ 3.000,00), vigência proposta de 01/09 a
  31/12/2026, situação "Proposta Aprovada e Plano de Trabalho em Complementação". O recurso é **emenda de
  comissão** (Comissão do Esporte, emenda 50060001, não impositiva).
- **Carga de 29/10/2026:** a proposta já tem registro de convênio (`7AADDI`), publicado e ainda **não assinado**,
  prestação de contas até 31/12/2026, e a União já emitiu o empenho 2026NE001572 de 20/07/2026 (R$ 2.450.000,00).
  Nada desembolsado ainda.

### 4.4 Para que serve no sistema

- **Convênios federais recebidos:** acompanhar proposta → convênio → empenho → desembolso → saldo em conta,
  sem digitar o que já está no Transferegov.
- **Emendas parlamentares:** o FIPLAN só diz o tipo de emenda (pelo IDU do empenho); o nome do parlamentar e o
  número da emenda federal vêm do Transferegov (`siconv_emenda` e, nas transferências especiais, os planos de
  ação). Emenda estadual (ALE-RR) não está no Transferegov.

A primeira parte (T1: convênios federais no Financeiro) está no ar desde 29/10/2026 (§4.5). O resto do plano (ligar
ao FIPLAN e às emendas do painel) está no `docs/planejamento/ROADMAP.md`, item "Convênios e emendas federais pelo
Transferegov".

### 4.5 Convênios federais: como a leitura diária funciona e como configurar

Caminho dos dados: **GitHub Actions** (`.github/workflows/transferegov.yml`, todo dia às 09:00 de Boa Vista ou à mão
em Actions → "Convênios federais (Transferegov)" → Run workflow) → `scripts/transferegov/sincronizar.mjs` baixa os
zips da §4.2, lê em fluxo e guarda só o que é do CNPJ (proposta → emendas → convênio → empenhos e desembolsos) →
**Edge Function `transferegov`** (segredo no cabeçalho) → RPC **`fin_tg_carregar`**, que troca o espelho `fin_tg_*`
numa transação → tela Financeiro → **Convênios federais**. O CNPJ vem da Configuração do cliente (`dados_oficiais`),
nunca do código. Por que no Actions e não numa Edge Function: o `siconv_proposta` tem centenas de MB e a função tem
limite de tempo. Detalhes do banco em [BANCO_DE_DADOS.md](./BANCO_DE_DADOS.md); da função em
[EDGE_FUNCTIONS.md](./EDGE_FUNCTIONS.md).

Configurar (uma vez, por quem administra a VPS e o GitHub; nenhum valor vai para o chat, o repositório ou esta doc):

1. **Segredo.** Gere um valor aleatório de 32 caracteres ou mais (por exemplo `openssl rand -hex 32` na VPS).
2. **VPS.** No `.env` do docker compose do Supabase, acrescente `TRANSFEREGOV_TOKEN=<o valor>`. Se o
   arquivo do docker compose lista as variáveis do serviço `functions` uma a uma (como `GEMINI_API_KEY`), acrescente lá
   `TRANSFEREGOV_TOKEN: ${TRANSFEREGOV_TOKEN}`. Depois `docker compose up -d functions` (um `docker restart` não relê
   o `.env`).
3. **GitHub.** Settings → Environments → New environment `transferegov` → Add environment secret
   `TRANSFEREGOV_TOKEN` com o mesmo valor. As variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` do
   repositório (as do front) já servem.
4. **CNPJ.** Confira em `/admin/configuracao-cliente` que o CNPJ da instituição está preenchido.
5. **Primeira carga.** Actions → "Convênios federais (Transferegov)" → Run workflow (branch `main`). O resumo do job
   mostra as contagens; a tela passa a mostrar a data da carga.

Erros comuns: o job falha logo em "Conferir configuração" (falta o segredo do ambiente ou as variáveis); `401` (o
segredo do GitHub não é igual ao da VPS, ou a VPS não recarregou o `.env`); `409` (CNPJ não cadastrado); `422` (a
RPC recusou: CNPJ diferente do da Configuração do cliente ou carga vazia com espelho cheio); "o leiaute mudou" (o
Transferegov mudou as colunas do CSV: ajustar `scripts/transferegov/mapear.mjs`). A tela avisa quando a última
leitura tem mais de 3 dias.

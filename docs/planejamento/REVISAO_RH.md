# Revisão completa do RH: o que existe, o que falta, auditoria e obrigações nacionais

Levantamento de 2026-10-10 sobre a `main` em `560955d` (depois da B3, PR #75), pedido pelo dono do produto:
"RH ultra completo, extremamente auditado, todo lançamento com o servidor responsável, inclusive sistemas
nacionais com consolidação, estrutura e envio". Só leitura de código, do baseline
(`supabase/baseline/schema/*.sql`) e das migrações: **o banco de produção não foi consultado**. Onde a regra
vem de leiaute externo (eSocial, CNAB, TCE-RR), está marcado "conferir".

Plano de execução por ondas na seção 6. Decisões que só o órgão toma, na seção 7.

## 1. Resumo

| Frente | Situação | O que mais pesa |
|---|---|---|
| Cadastro, vínculos, lotação, férias, licenças, viagens, frequência (abono e fechamento) | funcionam | Ponto, banco de horas, justificativa e ajuste têm tabela e RLS, mas **nenhuma tela** |
| Folha | **núcleo raso** | A RPC paga só vencimento do cargo − INSS (tabela RGPS para todos) − IRRF. Rubricas cadastradas, adicionais, faltas, consignações, pensão, 13º, 1/3 de férias, rescisão, RPPS e encargos patronais **não entram no cálculo** |
| Responsável por lançamento | **não atende** | Das 79 tabelas do RH e da folha, 15 têm trilha (antes/depois). A trilha grava o usuário, nunca o servidor. `created_by` fica vazio em férias, licenças, viagens, servidores, consignações, eSocial e CNAB, e é mandado pelo navegador (forjável) nas demais |
| Trilha de auditoria | **parcial e alterável** | Copia CPF, PIS, conta e endereço sem máscara; só admin lê; tela mostra os últimos 500 sem filtro; não há bloqueio de UPDATE/DELETE/TRUNCATE no log nem retenção |
| eSocial | **rascunho não conforme** | Só S-1200, S-1210 e S-1299, gerados no navegador para baixar. Sem tabela de eventos (S-1000/1005/1010/1020), sem S-2200/2300/2299, sem S-1202 (RPPS), sem assinatura, lote, transmissão, recibo ou XSD |
| CNAB | **gera arquivo com risco** | Só remessa 240, tipo de serviço "Fornecedores", nome do banco fixo, dígitos vazios, UF/cidade/CEP fixos; o arquivo não é guardado; retorno não existe |
| Demais obrigações (Reinf/DCTFWeb, FGTS Digital, RPPS, TCE-RR, transparência da folha) | **não existem** | Dependem de respostas do órgão (seção 7) |
| Exposição de dados | **2 vazamentos ativos** | `public/data/cargos.json` publica `indicacao` (8 registros) e nome dos ocupantes; `/rh/contracheques` mostra salário de todos a quem tem só `rh.servidores.visualizar` |

## 2. Inventário: telas e fluxos

| Área | Rota / tela | Estado | Falta |
|---|---|---|---|
| Servidores | `/rh/servidores`, `/rh/servidores/:id`, `/rh/servidores/novo` | funcional | edição sem permissão na rota (`src/App.tsx:821`); dependentes (jsonb) sem edição; ficha sem abas de licenças, frequência, contracheques e "quem alterou" |
| Lotação e designações | `/rh/gestao-lotacao`, `/rh/lotacoes`, `/rh/designacoes` | funcional | mesma página em duas rotas; remoção e requisição só como enum; `memorandos_lotacao` sem tela |
| Provimento e vacância | dentro da ficha | parcial | exoneração gera portaria; aposentadoria e falecimento sem fluxo; sem prazo legal de posse |
| Férias | `/rh/ferias` | funcional | período aquisitivo não é entidade; 1/3 não vai à folha |
| Licenças | `/rh/licencas` | funcional | faltam tipos legais (acidente em serviço, doença em pessoa da família, serviço militar, atividade política); sem perícia/junta e CAT; CID sem máscara |
| Viagens | `/rh/viagens` | funcional | prestação de contas não grava; ordem de missão desligada de `viagens_diarias`; tabela de diárias vazia |
| Frequência | `/rh/frequencia`, `/validacao`, `/pacotes`, `/configuracao`, `/rh/minha-frequencia` | parcial | sem batida de ponto, banco de horas, justificativa e ajuste (tabelas prontas); ZIP do pacote nunca gravado |
| Folha | `/folha`, `/folha/:id`, `/folha/rubricas`, `/folha/configuracao` | parcial | motor (seção 1); `FolhaBloqueadaPage` importada sem rota |
| Autoatendimento | `/rh/meus-dados`, `/rh/meu-contracheque`, `/rh/minha-frequencia` | parcial | sem requerimentos (férias, atualização cadastral, declarações) nem informe de rendimentos |
| Relatórios | `/rh/relatorios` | bom | sem relatório nominal de folha e comparação entre competências |
| Exportação | `/rh/exportar` | funcional | **sem permissão** (`src/App.tsx:871`) e **sem registro**, exporta CPF, PIS e conta |

**Tabelas sem nenhuma tela:** `banco_horas`, `lancamentos_banco_horas`, `justificativas_ponto`,
`solicitacoes_ajuste_ponto`, `pensoes_alimenticias`, `lancamentos_folha`, `retornos_bancarios`,
`itens_retorno_bancario`, `ocorrencias_servidor`, `memorandos_lotacao`, `adicionais_tempo_servico`,
`exportacoes_folha`, `config_fechamento_folha`, `feriados`, `configuracao_jornada`, `horarios_jornada`,
`cargo_unidade_compatibilidade`.

**Não existem:** período aquisitivo, estágio probatório, avaliação de desempenho, progressão e tabela salarial
com vigência, quadro de vagas ocupado × previsto, certidão de tempo de serviço, PAD/sindicância,
perícia/junta médica, CAT, capacitação, averbação de tempo, requerimentos do servidor, lotes e recibos do eSocial.

**Código morto:** `useMotorFolha.ts`, `useConfigVidaFuncional.ts`, `useRHIntegracoes.ts`,
`AtribuicaoPortariasPage.tsx`, `NovaPortariaUnificada`, `src/modules/rh/pages/formularios/*`, RPCs
`fn_gerar_esocial_s2200`/`s1200`. `ROUTE_PERMISSIONS` aponta para rotas inexistentes (`src/types/auth.ts:121,132`)
e não cobre `/rh/exportar`, `/rh/contracheques`, `/rh/gestao-lotacao` e as rotas de pacotes e configuração.

## 3. Auditoria: quem fez cada lançamento

### 3.1 O que existe

- `audit_logs` + `fn_audit_trigger('rh')` em 15 tabelas: `servidores`, `lotacoes`, `provimentos`,
  `designacoes`, `historico_funcional`, `nomeacoes_chefe_unidade`, `ferias_servidor`, `licencas_afastamentos`,
  `viagens_diarias`, `registros_ponto`, `frequencia_mensal`, `banco_horas`, `folhas_pagamento`,
  `itens_ficha_financeira`, `consignacoes` (`supabase/baseline/schema/03_post_data.sql:6178-6472`).
  Grava usuário (`auth.uid()`), ação, tabela, id e a linha inteira antes e depois.
- Ninguém grava no log pela API (REVOKE desde `20261006230500`), e só o papel admin lê.
- `folha_historico_status` registra cada mudança de status da folha pelo banco.
- Abono, fechamento, justificativa e ajuste de ponto (B2) gravam quem decidiu cada etapa pelo banco. É o
  único lugar onde a autoria já é confiável, e mesmo ali o admin passa direto.
- Contracheque: ver e imprimir chamam `log_audit` pelo navegador (`src/hooks/useContracheque.ts:194`); o
  download do pacote de frequência registra no servidor (`supabase/functions/download-frequencia`).

### 3.2 O que falta

1. **Servidor responsável:** nenhuma coluna de autoria aponta para `servidores`; a trilha guarda só o
   usuário. Usuário sem vínculo (admin, técnico, Edge Function) lança sem servidor; trocar o vínculo do
   perfil depois muda a resposta, e essa troca não é auditada.
2. **Autoria forjável ou vazia:**
   - vazia: `servidores`, `ferias_servidor`, `licencas_afastamentos`, `viagens_diarias`, `consignacoes`,
     `dependentes_irrf`, `pensoes_alimenticias`, `rubricas`, `parametros_folha`, tabelas de INSS/IRRF,
     `eventos_esocial.gerado_por`, `remessas_bancarias.gerado_por`, `folhas_pagamento.processado_por`;
   - mandada pelo navegador: `useDesignacoes.ts:92`, `useServidorCompleto.ts:98`, `useVinculosServidor.ts:193`,
     `useGestaoLotacao.ts:469`, `usePortarias.ts:147`, `useFrequenciaPacotes.ts:231`,
     `useParametrizacoesFrequencia.ts:983`, `DocumentosServidorTab.tsx:129`;
   - `folhas_pagamento.fechado_por/reaberto_por/conferido_por` usam `COALESCE(valor enviado, auth.uid())`;
   - sem coluna: `lotacoes`, `registros_ponto`, `frequencia_mensal`, `banco_horas`, `fichas_financeiras`,
     `itens_ficha_financeira`, `lancamentos_folha`, `cargos`;
   - nenhuma tabela impede trocar `created_by` depois.
3. **Cobertura da trilha:** cerca de 60 tabelas do RH e da folha não têm trilha, entre elas `vinculos_servidor`,
   `cessoes`, `documentos` (portarias), `fichas_financeiras`, `dependentes_irrf`, `pensoes_alimenticias`,
   `rubricas`, `parametros_folha`, `cargos`, `eventos_esocial`, `remessas_bancarias`, `contas_autarquia`,
   abono e fechamento de frequência. `profiles.servidor_id`, `user_permissions` e `user_org_units` também não.
4. **LGPD:** a trilha de `servidores` copia CPF, RG, PIS, conta, endereço e telefone sem máscara; a de
   licenças copia CID.
5. **Imutabilidade:** `postgres` e `service_role` podem alterar ou apagar a trilha; TRUNCATE (que não dispara
   trigger) ainda é permitido em várias tabelas do RH no banco só de migrações; não há retenção nem partição.
6. **Ações sem registro:** PDFs (portaria, frequência, relatórios), planilhas e `/rh/exportar`, XML do
   eSocial, arquivo CNAB, CSV da própria auditoria, login e falha de login, leitura da ficha com CPF e banco.
   `processar_folha_pagamento` apaga e recria as fichas sem registrar quem processou.
7. **Consulta:** `/admin/auditoria` busca os últimos 500 e filtra no navegador; a rota pede a permissão
   `admin.auditoria`, mas a RLS pede o papel admin. Não há histórico por servidor nem por registro.

## 4. Obrigações nacionais e estaduais

| Obrigação | Estado | Transmite? | Observação |
|---|---|---|---|
| eSocial, eventos de tabela (S-1000, 1005, 1010, 1020, 1070) | não existe | não | `config_autarquia` não tem `classTrib`, ente/RPPS, estabelecimentos nem lotações tributárias |
| eSocial, não periódicos (S-2200, 2205, 2206, 2230, 2299, 2300, 2306, 2399, 2400+) | não existe | não | cadastro sem categoria, regime trabalhista/previdenciário codificado, grau de instrução, município IBGE; dependentes sem `tpDep` |
| eSocial, S-1200, S-1210, S-1299 | parcial, não conforme | não | `src/lib/esocialXmlGenerator.ts`: categoria fixa 101 (conferir: estatutário e comissionado são 3xx); `codRubr` é UUID cortado; lotação "001"; ambiente sempre 2 (`GerarESocialDialog.tsx:113` × `ConfigAutarquiaTab.tsx:532`); `dtPgto` fixo dia 05; estrutura do S-1200 a conferir; gera com folha aberta; duplica ao gerar de novo; grava sem checar erro |
| eSocial, S-1202 (RPPS), S-1207, S-3000, totalizadores S-5001/5002/5003/5011/5013 | não existe | não | `eventos_esocial` tem `recibo`, `protocolo_envio` e `lote_id`, nunca preenchidos |
| Assinatura XMLDSig, lote, XSD, produção restrita | não existe | não | nenhuma Edge Function de eSocial |
| EFD-Reinf e DCTFWeb | não existe | não | a folha não calcula INSS patronal, RAT e terceiros (`fichas_financeiras.inss_patronal` nunca preenchido) |
| FGTS Digital, SEFIP/GFIP, RAIS, DIRF, CAGED | não existe | — | substituídos pelo eSocial/DCTFWeb/FGTS Digital (conferir); FGTS só se houver celetista |
| CNAB remessa | parcial | não (download) | `src/lib/cnabGenerator.ts`: tipo de serviço "20" Fornecedores (conferir: salário é "30"), nome do banco fixo, forma e câmara fixas, dígitos de agência e conta vazios, UF/cidade/CEP fixos, numeração `MAX+1` sem trava, arquivo e hash não guardados, gera com folha aberta |
| CNAB retorno e conciliação | só tabela | — | sem parser, tela nem baixa |
| RPPS estadual (contribuição, S-1202, CNIS-RPPS) | não existe | não | todos pagam INSS; `regime_juridico` é texto livre |
| TCE-RR (remessa de pessoal, atos para registro) | não existe | não | `v_relatorio_tce_pessoal` usa o cadastro, não a folha fechada, e expõe CPF; leiaute a pedir ao Tribunal |
| Transparência da folha | não existe com dado do banco | — | `/transparencia/cargos` lê `public/data/cargos.json` fixo, com `indicacao` e nome do ocupante |
| Consignatárias, Qualificação Cadastral, gov.br | não existe | — | margem calculada só na tela |

## 5. Riscos que já estão no ar

1. **`public/data/cargos.json` e `.csv`** publicam o campo `indicacao` (8 de 98 registros) e o nome dos
   ocupantes, sem autenticação. No banco a mesma informação é "acesso restrito a administradores". Fere a
   LGPD e o invariante 6 do `AGENTS.md`. Continua no histórico do git mesmo depois de apagado.
2. **Salários dentro do RH:** `/rh/contracheques` abre com `rh.servidores.visualizar` (`src/App.tsx:912`) e a
   RLS de `fichas_financeiras` libera quem tem o módulo `rh`. Quem cadastra servidor vê o salário de todos.
3. **`/rh/exportar`** exporta CPF, PIS e conta bancária sem permissão própria e sem registro.
4. **CNAB e eSocial** geram arquivo errado (seção 4) e qualquer um com o módulo `rh` apaga remessas e eventos.
5. **Trilha com dado pessoal em claro** (seção 3.2, item 4).

## 6. Plano por ondas

Cada onda vira spec, plano e PR rascunho próprios, com a migração validada nos dois estados do banco e
`bash scripts/gate.sh` verde. Nada é aplicado em banco remoto: o CI aplica no merge.

| Onda | Conteúdo | Depende de |
|---|---|---|
| **E1. Trilha e servidor responsável (banco)** | colunas padrão de autoria com o **servidor** (snapshot do vínculo) em toda tabela de lançamento do RH e da folha; trigger genérico que grava autoria pelo banco e impede trocá-la, sem isenção para admin; `fn_audit_trigger` v2 com servidor, campos alterados, papel, IP e user agent, e **máscara** de CPF, RG, PIS, conta e CID; trilha em todas as tabelas do RH e da folha e em `profiles`/`user_permissions`/`user_org_units`; log imutável (UPDATE, DELETE e TRUNCATE recusados) e REVOKE TRUNCATE nas tabelas do RH; `processado_por`, `gerado_por` e `COALESCE` da folha corrigidos; RPC `registrar_evento` com lista fechada de ações; guard no gate que reprova tabela do RH sem autoria e trilha | decisões 1 e 2 (com padrão) |
| **E2. Trilha na tela** | `/admin/auditoria` paginada e filtrada no servidor (período, tabela, registro, usuário, servidor, ação) com o diff; aba "Histórico de alterações" na ficha do servidor e na folha; `registrar_evento` em todo PDF, planilha, XML, CNAB e CSV do RH; login e falha de login | E1 |
| **E3. Vazamentos e arquivos errados** | tirar `indicacao` e ocupantes de `public/` e ler a transparência de uma view pública; `/rh/contracheques` e RLS das fichas por `financeiro.folha.visualizar`; `/rh/exportar` com permissão e registro; eSocial e CNAB só com folha fechada, sem DELETE, com índice único; CNAB corrigido e arquivo guardado em bucket privado com hash; eSocial marcado "rascunho" até haver transmissão | decisão 3 (muda RLS existente) e manual do banco |
| **F. Motor da folha** | rubricas e incidências no cálculo, adicionais, faltas da frequência, consignações, pensão, 13º, férias com 1/3, rescisão, retroativos, RPPS ou RGPS por vínculo, encargos patronais; testes com Vitest | decisões 4 e 5 |
| **G. eSocial de verdade** | modelo de dados (empregador, lotações tributárias, rubricas com `natRubr`/`codInc*`, categoria e regimes no vínculo, dependentes com `tpDep`); fila de lotes e eventos com recibo, retificação, S-3000 e totalizadores; geração no servidor com XSD; Edge Function de assinatura e envio (certificado A1 no Vault) começando em produção restrita; painel de obrigações | F e decisões 6 e 7 |
| **H. Telas com tabela pronta** | ponto, banco de horas, justificativa, ajuste de ponto, pensão alimentícia, retorno CNAB, ocorrências; histórico funcional automático e certidão de tempo de serviço | E1 |
| **I. Domínios novos** | período aquisitivo, estágio probatório, avaliação e progressão (PCCS), perícia/junta e CAT, requerimentos do servidor e informe de rendimentos, PAD/sindicância, consignatárias, Qualificação Cadastral, remessa ao TCE-RR, transparência nominal da folha | decisões 8 e 9 |
| **Higiene** | código morto, rotas duplicadas, `ROUTE_PERMISSIONS`, triggers duplicados de situação em férias, licenças e provimentos, unificar `provimentos` × `vinculos_servidor` (a folha só enxerga `provimentos`), texto do cliente em `src/` e no DDL | — |

## 7. Decisões e informações que dependem do órgão

| # | Pergunta | Padrão adotado até a resposta |
|---|---|---|
| 1 | Usuário sem vínculo de servidor (admin, técnico) pode lançar no RH? | pode, e o lançamento fica marcado "sem servidor vinculado" na trilha |
| 2 | Quem lê a trilha do RH? | admin e quem tiver a permissão nova `rh.auditoria.visualizar` |
| 3 | Restringir contracheques de todos e a exportação a quem tem permissão de folha? | sim, na onda E3 (muda RLS existente: só entra com o "sim") |
| 4 | O IDJUV tem efetivos no RPPS estadual ou só comissionados e cedidos no RGPS? Qual a lei de alíquota? | nenhum; a folha segue como está até a resposta |
| 5 | A folha do IDJUV é processada e transmitida por outro sistema do Estado hoje? Quem transmite eSocial e DCTFWeb do CNPJ? | não sabemos; nada é transmitido por este sistema |
| 6 | API paga de eSocial ou Edge Function própria? | Edge Function própria (sem custo recorrente) |
| 7 | Certificado e-CNPJ A1 do órgão: existe e quem é o responsável? | — |
| 8 | Leiaute, sistema e prazos de remessa de pessoal ao TCE-RR | pedir ao Tribunal |
| 9 | PCCS em lei (carreiras, tabela salarial, progressão)? | sem progressão até a lei |
| 10 | Banco pagador e manual CNAB do convênio | CNAB 240 FEBRABAN genérico |
| 11 | Prazo de retenção da trilha | guardar tudo, sem expurgo |

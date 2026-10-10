# Finalização do sistema — estado por módulo

Documento vivo. Cada módulo ganha uma seção quando passa pelo `/finalizar <codigo>`
(template `prompts/templates/finalizar-modulo.md`): tabela página → estado
(*pronta* / *incompleta* / *quebrada*) → o que falta → esforço (P/M/G), e a ordem
de ataque. Itens aprovados vão para o [ROADMAP](./ROADMAP.md).

## Ponto de partida — pendências detectadas automaticamente (2026-10-09)

Saída de `npm run prompt -- pendencias`, só os módulos com algo a ver. É
heurística (regex sobre menu, rotas e páginas): confirmar no código antes de agir.


### Administração (`admin`) — 31 rotas, 31 páginas
- Itens de menu sem rota: `/admin/configuracoes`
- Páginas com TODO/FIXME/"em breve"/mock: `src/pages/admin/CentralRelatoriosPage.tsx (1)`, `src/pages/admin/GerenciadorPaginasPage.tsx (1)`

### Recursos Humanos (`rh`) — 33 rotas, 25 páginas
- Itens de menu sem rota: `/rh/meus-dados`

### Financeiro (`financeiro`) — 18 rotas, 16 páginas
- Páginas com TODO/FIXME/"em breve"/mock: `src/pages/financeiro/PlaceholderDetalheFinanceiroPage.tsx (3)`

### Patrimônio (`patrimonio`) — 28 rotas, 21 páginas
- Páginas com TODO/FIXME/"em breve"/mock: `src/pages/unidades/RelatoriosCentralPage.tsx (4)`, `src/pages/patrimonio/CadastroBemSimplificadoPage.tsx (3)`, `src/pages/inventario/PlaceholderDetalhePage.tsx (3)`

### Governança (`governanca`) — 12 rotas, 11 páginas
- Itens de menu sem rota: `/governanca/riscos`, `/governanca/controles`, `/governanca/decisoes`, `/governanca/checklists`

### Transparência (`transparencia`) — 10 rotas, 8 páginas
- Páginas com TODO/FIXME/"em breve"/mock: `src/pages/transparencia/ExecucaoOrcamentariaPage.tsx (1)`

### Programas (`programas`) — 13 rotas, 10 páginas
- Páginas com TODO/FIXME/"em breve"/mock: `src/pages/eventos/NoticiaDetalhePage.tsx (1)`, `src/pages/programas/selecoes/RelatoriosSelecaoPage.tsx (1)`

### Gabinete (`gabinete`) — 7 rotas, 6 páginas
- Itens de menu sem rota: `/gabinete/workflow-rh`

### Patrimônio Mobile (`patrimonio_mobile`) — 2 rotas, 2 páginas
- Páginas com TODO/FIXME/"em breve"/mock: `src/pages/mobile/PatrimonioMobileUnificadoPage.tsx (1)`

## Módulos analisados

### Recursos Humanos (`rh`) — 2026-10-09

Base: [`ANALISE_RH.md`](./ANALISE_RH.md) (01/10, segurança, modelo de dados e
mercado) + levantamento página a página do código em `main` (`eea71e7`). Banco
real **não verificado**: o projeto Supabase do IDJUV não está acessível nesta
sessão. Correção à análise de 01/10: `periodos_aquisitivos` e
`programacao_ferias` **não existem** (nem em `types.ts` nem nas migrações); o
período aquisitivo é texto livre em `ferias_servidor`.

**Placar:** 15 prontas (com ressalvas pequenas), 7 incompletas, 3 quebradas,
1 item de menu sem rota.

| Rota | Página | Estado | O que falta (evidência) | Esforço |
|---|---|---|---|---|
| `/rh` | `pages/modulos/RHDashboardPage.tsx` | **quebrada** | KPI "Em Férias" conta `status: "fruindo"` (`hooks/dashboard/useRHDashboardStats.ts:21`), valor que o CHECK de `ferias_servidor` não aceita, então mostra sempre 0; "Viagens Pendentes" conta `processos_administrativos` (`:22`), mas as viagens ficam em `viagens_diarias` | P |
| `/rh/servidores/:id` | `rh/ServidorDetalhePage.tsx` | **quebrada** | Botão "Ato Formal" navega para `/documentos/:id` (`:729`), rota inexistente (404); status de férias/viagens exibidos crus (`:600`, `:636`); faltam abas de licenças, frequência, contracheques, dependentes | P–M |
| `/folha/:id` | `folha/FolhaDetalhePage.tsx` | **quebrada** | "Fechar"/"Reabrir" usam `useUpdateFolhaStatus` (update direto, `hooks/useFolhaPagamento.ts:282`), pulando as RPCs `fechar_folha`/`reabrir_folha` (máquina de estados + hash) que a lista usa; não edita itens da ficha, consignações nem dependentes IRRF (hooks existem sem tela) | M |
| `/rh/meus-dados` | — | **sem rota** | Item de menu (`config/menu.config.ts:445`) sem `<Route>`: 404 | P–M |
| `/rh/servidores/novo`, `/:id/editar` | `rh/ServidorFormPage.tsx` | incompleta | Sem zod nem validação de CPF (`:573-576`); erro do insert em `vinculos_servidor` é engolido (`:536-547`); edição grava `cargo_atual_id`/`unidade_atual_id` direto, sem lotação/histórico (`:507-508`); rota de edição sem `requiredPermissions` (`App.tsx:800`) | M |
| `/rh/ferias` | `rh/GestaoFeriasPage.tsx` | incompleta | Só cria e muda status (`:125`, `:154`); sem editar/excluir, saldo de 30 dias, sobreposição, parcelas, 1/3, portaria | M–G |
| `/rh/frequencia` | `rh/GestaoFrequenciaPage.tsx` | incompleta | Só lança falta e imprime; o fluxo abono → chefia → RH → fechamento existe só em hooks sem tela (`hooks/useParametrizacoesFrequencia.ts:522+`); sem banco de horas, justificativa, ajuste de ponto | G |
| `/rh/viagens` | `rh/GestaoViagensPage.tsx` | ~~incompleta~~ → item 14 entregue (editar, cancelar, excluir, diária por tabela) | Restam prestação de contas e ordem de missão preenchida a partir da viagem | P |
| `/rh/relatorios` | `rh/RelatoriosRHPage.tsx` | ~~incompleta~~ → item 15 entregue (15a + 15b) | 7 PDFs de cadastro/portarias + relatórios de férias, licenças, frequência, viagens (15a) e folha em agregados: resumo do ano, por unidade e por rubrica (15b, `components/rh/relatorios/`, PDF/XLSX). Restam relatório nominal de folha (decisão pendente), frequência só de servidores ativos, 16 queries na página | P |
| `/rh/portarias/pendencias` | `rh/PendenciasPortariasPage.tsx` | incompleta | Link `/gabinete/portarias?id=` (`:287`) ignora o `id` e exige o módulo `gabinete` | P |
| `/rh/meu-contracheque` | `rh/MeuContrachequePage.tsx` | incompleta | `useMeusContracheques` não filtra status da folha (`hooks/useContracheque.ts:69-91`): servidor vê folha em rascunho | P |
| Demais 15 | lotação, servidores, licenças, designações, pendências, modelos, exportar, config. frequência, aniversariantes, pacotes, contracheques, folha (lista e configuração), currículo | pronta | Ressalvas menores: rotas duplicadas (`/lotacoes` × `/rh/gestao-lotacao`), queries em página, `/rh/exportar` sem permissão, modelos de documento em branco e fixos no código | P |

**Tabelas que existem sem tela nenhuma:** `banco_horas`, `lancamentos_banco_horas`,
`justificativas_ponto`, `solicitacoes_ajuste_ponto`, `solicitacoes_abono`,
`frequencia_fechamento`, `consignacoes`, `pensoes_alimenticias`, `dependentes_irrf`,
`lancamentos_folha`, `retornos_bancarios` (retorno do CNAB), `adicionais_tempo_servico`,
`config_motivos_desligamento`, `ocorrencias_servidor`, `memorandos_lotacao`.
**Sem tabela:** períodos aquisitivos, avaliação de desempenho, estágio probatório,
progressão, capacitação.

#### Ordem de ataque

Cada item já no formato do gerador. Ondas A e C não mexem em banco; B e D
dependem de acesso ao Supabase do IDJUV.

**Onda A — consertar o que está quebrado (P, sem banco)** — entregue e mesclada em 2026-10-09 (PRs #36, #37, #38, #40, #42, #43)
1. ~~`/prompt bug --modulo rh KPIs do dashboard do RH …`~~ → PR #36
2. ~~`/prompt bug --modulo rh Fechar/Reabrir em /folha/:id …`~~ → PR #37
3. ~~`/prompt bug --modulo rh ServidorDetalhe: Ato Formal e status …`~~ → PR #38
4. ~~`/prompt bug --modulo rh Meu contracheque …`~~ → PR #40
5. ~~`/prompt tela --modulo rh Meus dados (/rh/meus-dados) …`~~ → PR #43
6. ~~`/prompt ajuste --modulo rh Pendências de portarias …`~~ → PR #42

**Onda B — segurança (P0 da ANALISE_RH §6, precisa do banco real)**
> O site publicado usa um Supabase **self-hosted na VPS do cliente** (conferido em
> 2026-10-09), não o projeto da Lovable. O conector Supabase do Claude não alcança
> instância própria: a verificação exige uma connection string Postgres somente
> leitura de um banco de **desenvolvimento**, guardada como segredo do ambiente de
> nuvem (`IDJUV_DB_URL`), e migrações são aplicadas com `supabase db push --db-url`
> ou `psql`, nunca direto em produção.
7. `/prompt revisao --modulo rh Verificar no banco real as policies e funções S1–S7 da ANALISE_RH`
8. `/prompt migracao --modulo rh RLS granular em folha, fichas, consignações, licenças e storage; search_path e permissão em processar_folha_pagamento` — **parcial (B1 mesclada na PR #63; identidade S0 na PR #67; B2 mesclada na PR #69 e contornos na PR #71, em 2026-10-10; B3 mesclada na PR #75)**: a parte da folha está na migração `supabase/migrations/20261010070000_onda_b_folha_rls_permissao.sql` ([spec](../superpowers/specs/2026-10-10-onda-b-folha-seguranca-design.md), [plano](../superpowers/plans/2026-10-10-onda-b-folha-seguranca.md)): escrita nas 10 tabelas da folha só com `financeiro.folha.processar|configurar`, guarda e EXECUTE em `processar_folha_pagamento`, INSERT em folha fechada barrado, catálogo da folha no módulo `rh`, rotas `/folha*` por permissão. **B2 mesclada (PR #69)**: migração `supabase/migrations/20261010090000_onda_b_rh_permissoes.sql` ([spec](../superpowers/specs/2026-10-10-onda-b-rh-permissoes-design.md), [plano](../superpowers/plans/2026-10-10-onda-b-rh-permissoes.md)): gravar em férias, licenças, viagens, ponto, frequência, abono, ajuste, fechamento e banco de horas exige o módulo `rh` e o código do catálogo; ninguém grava a própria linha nem decide o próprio pedido (RH ou gestor que também é servidor não lança o próprio ponto, frequência, férias, licença, viagem ou banco de horas); trigger `validar_etapa_frequencia` separa chefia (`rh.aprovar`) e RH (`rh.frequencia.lancar`), trava o pedido fora de pendente e grava a autoria pelo banco; o servidor lê a própria linha em `servidores`, vínculos e lotações; autoatendimento busca pelo `servidorId` do perfil; atalhos "Meu RH" em `/meu-perfil`. **Correção dos contornos mesclada (PR #71)**: migração `supabase/migrations/20261010100000_onda_b_rh_contornos.sql` (achados da segunda revisão de segurança): `tipos_abono` só com `rh.frequencia.configurar`; ninguém edita a própria ficha em `servidores`; autoria gravada pela etapa e não apagável; `created_by` do abono imutável e a chefia não edita o pedido nem em pendente; trigger de etapa também em justificativa e ajuste de ponto; CPF comparado com zeros à esquerda. Pendentes: confirmar com o usuário quem perde escrita (consulta em [RBAC_PERMISSOES.md](../RBAC_PERMISSOES.md#dimensionamento-de-quem-perde-acesso)); quem tem o módulo muda `servidores.situacao` e bloqueia o perfil vinculado (anterior à B2); o servidor ainda não assina o próprio fechamento. **B3 mesclada na PR #75**: migração `supabase/migrations/20261010210000_onda_b_rh_storage.sql` ([spec](../superpowers/specs/2026-10-10-onda-b-rh-storage-design.md)): buckets `frequencias` e `documentos-requerimento` privados, lidos pelo módulo `rh` ou pelo servidor dono do arquivo e gravados só com o módulo e `rh.frequencia.lancar|criar|editar` ou `rh.servidores.editar`; `documentos` por módulo `workflow` ou `rh` também no só-migrações; `frequencia_pacotes`, `frequencia_arquivos` e `documentos_requerimento_servidor` por permissão, com CHECK de caminho seguro; `download-frequencia` exige o módulo `rh` e `rh.frequencia.visualizar` e não loga e-mail; `DocumentosServidorTab` grava o caminho e abre por URL assinada (`src/lib/storageArquivos.ts`). Quem perde acesso e a consulta pós-deploy em [RBAC_PERMISSOES.md](../RBAC_PERMISSOES.md#arquivos-do-rh-e-download-de-frequência-onda-b--b3). **Próximo**: dono e permissões do bucket `documentos` e troca dos links públicos de portarias, atos e cedência; gravar o ZIP do pacote de frequência (hoje nunca gravado); tirar o nome do servidor do caminho do PDF; buckets de outros módulos; CORS das Edge Functions por origem
9. `/prompt migracao --modulo rh Trilha de auditoria (trigger genérico em audit_logs ou supa_audit) nas tabelas sensíveis do RH` — **E1 em PR rascunho** (antes: parcial na B1, com `fn_audit_trigger('rh')` só em `folhas_pagamento`, `itens_ficha_financeira` e `consignacoes`): migração `supabase/migrations/20261011000000_rh_autoria_trilha.sql` ([spec](../superpowers/specs/2026-10-10-rh-trilha-auditoria-design.md), [revisão](./REVISAO_RH.md)). As 77 tabelas de lançamento do RH ganham `created_by`/`updated_by` com o servidor responsável gravados pelo banco (trigger `zz_fixar_autoria`, o valor mandado pelo cliente é ignorado), colunas de decisão (`fechado_por`, `processado_por`, `aprovado_por`, `convertido_por`…) gravadas pelo banco também para o admin, e trilha `audit_<tabela>` com campos alterados, servidor, origem, IP e máscara LGPD (catálogo `audit_colunas_sensiveis`); `audit_logs`, `folha_historico_status` e `rubricas_historico` imutáveis; trilha `admin` em `profiles`, `user_permissions` e `user_org_units`; RPC `registrar_evento` (visualização, exportação, download); leitura da trilha do RH com o módulo `rh` e `rh.auditoria.visualizar`; guard `scripts/check-autoria-rh.mjs` no gate. Detalhes em [BANCO_DE_DADOS.md](../BANCO_DE_DADOS.md#trilha-de-auditoria-e-servidor-responsável-do-rh--onda-e1) e [RBAC_PERMISSOES.md](../RBAC_PERMISSOES.md#trilha-de-auditoria-do-rh-onda-e1). **Próximo (E2)**: tela da trilha, aba de histórico na ficha e na folha e chamadas a `registrar_evento` pelo front; login e falha de login na trilha. Fora das duas ondas: partição e retenção de `audit_logs`, encadeamento por hash e `delete-user` desativar em vez de excluir

**Onda C — completar os fluxos que já existem**
10. ~~`/prompt ajuste --modulo rh ServidorForm com zod, validação de CPF/PIS e erro do vínculo tratado`~~ — entregue na PR #49 (mesclada em 2026-10-09)
11. ~~`/prompt crud --modulo rh Férias completas: editar/excluir, saldo de 30 dias, sobreposição, parcelas, 1/3`~~ — entregue na PR #51 (mesclada em 2026-10-09); 1/3 na folha ficou de fora
12. ~~`/prompt tela --modulo rh Fluxo de frequência: abono, validação da chefia, consolidação do RH e fechamento, usando os hooks já existentes`~~ — entregue na PR #52 (mesclada em 2026-10-09); policies da chefia e assinatura do servidor ficaram para a Onda B
13. ~~`/prompt tela --modulo rh Detalhe da folha: editar itens da ficha, consignações e dependentes IRRF`~~ — entregue na PR #56 (13a, mesclada em 2026-10-10); a parte de banco (13b: RLS por permissão, guarda da RPC, INSERT em folha fechada, índice único de desconto por referência) entrou em B1 (item 8). Ficam para depois: RPC de recálculo atômico da ficha e preservar itens manuais no reprocessamento
14. ~~`/prompt ajuste --modulo rh Viagens: editar/excluir e diária calculada por tabela`~~ — entregue na PR #58 (mesclada em 2026-10-10) (editar, cancelar com motivo, excluir restrito, diária contada pelas datas e valor pela tabela do tenant `rh.diarias`, vazia até os valores do ato normativo serem informados); as policies por permissão entraram na B2 (PR #69); CHECKs e tabela de diárias no banco ficaram para depois
15. ~~`/prompt relatorio --modulo rh Relatórios de férias, licenças, frequência, viagens e folha`~~ — **15a** (férias, licenças, frequência, viagens) entregue na PR #59 (branch `claude/project-thread-9af5aq-c6-relatorios-rh`); **15b** (folha em agregados: resumo do ano, por unidade e por rubrica, gate `financeiro.folha.visualizar`) entregue na PR #61, já incorporada à #59 (spec `docs/superpowers/specs/2026-10-10-rh-relatorios-gerenciais-design.md`). Ficaram de fora: relatório nominal de folha (decisão do usuário pendente), saldo de férias, 1/3 de férias e comparação entre competências

**Onda D — profissionalizar (ferramentas do mercado, pesquisa de 2026-10-09)**
16. Testes de folha, frequência e CNAB com Vitest (open source) e monitoramento de erros com Sentry (plano grátis).
17. BrasilAPI (CEP, bancos/ISPB, feriados; grátis) e validação de CPF/NIS; Qualificação Cadastral do eSocial em lote (grátis, arquivo via Dataprev) antes do S-2200.
18. Assinatura gov.br nas portarias (ITI, gratuita para órgãos estaduais; exige norma do órgão e integração com Login gov.br).
19. Transmissão do eSocial (leiaute S-1.3; certificado e-CNPJ A1 no Supabase Vault): API paga (TecnoSpeed) ou Edge Function própria com assinatura XMLDSig.
20. Remessa de pessoal ao TCE-RR e transparência da folha (sem CPF completo): pedir o layout ao TCE-RR.

**Onda E — domínios novos (dependem das decisões da ANALISE_RH §7):**
banco de horas, adicional por tempo de serviço, desligamento padronizado,
ocorrências funcionais, retorno bancário do CNAB, carreira/estágio probatório/avaliação.

#### Fontes da Onda D
- eSocial, documentação técnica: https://www.gov.br/esocial/pt-br/documentacao-tecnica
- Assinatura gov.br para órgãos: https://www.gov.br/governodigital/pt-br/identidade/assinatura-eletronica/assinatura-eletronica-para-orgaos
- BrasilAPI: https://brasilapi.com.br/docs · Sentry: https://sentry.io/pricing · Vitest: https://vitest.dev
- TecnoSpeed eSocial: https://blog.tecnospeed.com.br/usar-a-solucao-de-esocial-via-componente-ou-api/

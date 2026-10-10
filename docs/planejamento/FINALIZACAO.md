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
| `/rh/relatorios` | `rh/RelatoriosRHPage.tsx` | incompleta | 7 PDFs de cadastro/portarias + relatórios de férias, licenças, frequência e viagens com filtros e PDF/XLSX (item 15a, `components/rh/relatorios/`); falta folha (15b); frequência só de servidores ativos; 16 queries na página | M |
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
8. `/prompt migracao --modulo rh RLS granular em folha, fichas, consignações, licenças e storage; search_path e permissão em processar_folha_pagamento`
9. `/prompt migracao --modulo rh Trilha de auditoria (trigger genérico em audit_logs ou supa_audit) nas tabelas sensíveis do RH`

**Onda C — completar os fluxos que já existem**
10. ~~`/prompt ajuste --modulo rh ServidorForm com zod, validação de CPF/PIS e erro do vínculo tratado`~~ — entregue na PR #49 (mesclada em 2026-10-09)
11. ~~`/prompt crud --modulo rh Férias completas: editar/excluir, saldo de 30 dias, sobreposição, parcelas, 1/3`~~ — entregue na PR #51 (mesclada em 2026-10-09); 1/3 na folha ficou de fora
12. ~~`/prompt tela --modulo rh Fluxo de frequência: abono, validação da chefia, consolidação do RH e fechamento, usando os hooks já existentes`~~ — entregue na PR #52 (mesclada em 2026-10-09); policies da chefia e assinatura do servidor ficaram para a Onda B
13. `/prompt tela --modulo rh Detalhe da folha: editar itens da ficha, consignações e dependentes IRRF` — em revisão na PR #56 (13a, só front); 13b (migração) na Onda B
14. ~~`/prompt ajuste --modulo rh Viagens: editar/excluir e diária calculada por tabela`~~ — entregue nesta branch (editar, cancelar com motivo, excluir restrito, diária contada pelas datas e valor pela tabela do tenant `rh.diarias`, vazia até os valores do ato normativo serem informados); policies por permissão, CHECKs e tabela de diárias no banco ficaram para a Onda B
15. `/prompt relatorio --modulo rh Relatórios de férias, licenças, frequência, viagens e folha` — **15a** (férias, licenças, frequência, viagens) entregue na branch `claude/project-thread-9af5aq-c6-relatorios-rh` (spec `docs/superpowers/specs/2026-10-10-rh-relatorios-gerenciais-design.md`); **15b** (folha: por competência, unidade e rubrica) a fazer

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

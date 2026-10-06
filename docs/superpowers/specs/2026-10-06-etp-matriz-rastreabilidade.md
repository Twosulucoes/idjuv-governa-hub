# Matriz de rastreabilidade — ETP × repositório

> **Registro datado (2026-10-06), não canônico.** Anexo da spec
> [`2026-10-06-etp-solucao-gestao-integrada-design.md`](./2026-10-06-etp-solucao-gestao-integrada-design.md).
> A versão viva desta matriz passa a existir em `docs/contratacao/RASTREABILIDADE_ETP.md`
> (Tarefa 4 do plano); este arquivo é o ponto de partida e não é atualizado depois.

**Fonte das promessas:** ETP "Solução de gestão administrativa integrada do IDJuv"
(IDJuv-RR, DIRAF; processo SEI e DFD ainda em branco no documento).
**Método:** levantamento estático do código, das migrações e dos docs em 2026-10-06
(cinco agentes de leitura em paralelo). Quatro achados foram reverificados à mão
(§ "Achados críticos" da spec); uma divergência entre levantamentos (trilha de auditoria de
RH) foi resolvida por grep. **Não** se executou o app nem se consultou o banco ao vivo:
`ATENDE` significa "há código e modelo de dados coerentes no repositório", não "validado em produção".

**Legenda:** `ATENDE` · `PARCIAL` · `AUSENTE` (nada no repositório) · `SÓ-DOC` (existe apenas
como promessa em `PROPOSTA_*.md`, sem implementação).
**Marcos de pagamento do ETP (§7):** Marco 1 = plano de implantação (20%); Marco 2 = pessoas e folha (25%);
Marco 3 = compras, patrimônio e finanças (30%); Marco 4 = entrada em produção com capacitação (25%).
Implantação total em até 130 dias.

## 1. Áreas funcionais (ETP §3)

Resumo por área: **1 ATENDE** (A9) · **9 PARCIAL** (A1–A8, A10). Nenhuma área está `AUSENTE` por inteiro,
mas A10 é predominantemente ausente.

| ID | Capacidade exigida | Status | Evidência (caminho) | Lacuna principal | Marco |
|---|---|---|---|---|---|
| A1.1 | Cadastro e vida funcional | ATENDE | `src/pages/rh/GestaoServidoresPage.tsx`, `src/components/rh/VidaFuncionalTimeline.tsx` | — | 2 |
| A1.2 | Frequência | ATENDE | `src/pages/rh/GestaoFrequenciaPage.tsx`, `src/hooks/useFrequencia.ts` | — | 2 |
| A1.3 | Férias e licenças | ATENDE | `src/pages/rh/GestaoFeriasPage.tsx`, `src/pages/rh/GestaoLicencasPage.tsx` | — | 2 |
| A1.4 | Folha com retenções | PARCIAL | `src/lib/folhaCalculos.ts`, `src/hooks/useMotorFolha.ts` | Parâmetros legais fixos no código (`src/lib/folhaCalculoService.ts`); sem modelo de RPPS | 2 |
| A1.5 | Arquivo bancário | PARCIAL | `src/lib/cnabGenerator.ts`, `src/components/folha/GerarRemessaDialog.tsx` | Só CNAB 240 remessa; nome do banco fixo no header; sem retorno (tabela `retornos_bancarios` sem uso) | 2 |
| A1.6 | eSocial | PARCIAL | `src/lib/esocialXmlGenerator.ts`, `src/components/folha/GerarESocialDialog.tsx` | XML S-1200/S-1210/S-1299 sem assinatura, sem validação XSD, sem transmissão; S-2200 só JSON; sem eventos de tabela | 2 |
| A1.7 | Contracheque | ATENDE | `src/lib/pdfContracheque.ts`, `src/pages/rh/MeuContrachequePage.tsx` | — | 2 |
| A2.1 | DFD / ETP / TR | PARCIAL | `src/pages/formularios/CPSIPage.tsx`, `src/lib/pdfCPSI.ts` | Só gera PDF, sem persistência nem tabela; texto de CPSI, que o ETP descarta | 3 |
| A2.2 | PCA (Plano de Contratações Anual) | AUSENTE | — | Sem tabela, tela ou relatório | 3 |
| A2.3 | Etapas da contratação / pesquisa de preços | PARCIAL | `src/pages/processos/ComprasProcessoPage.tsx` | Checklist estático; `documentos_preparatorios_licitacao` sem uso no front | 3 |
| A2.4 | Contratos, aditivos, garantias, fiscalização | PARCIAL | migrações `20260201224705`, `20260202000133`; `src/pages/modulos/ContratosDashboardPage.tsx` | Modelo existe; só há dashboard de contagem. Um único `fiscal_id` por contrato | 3 |
| A2.5 | Atas de registro de preços | PARCIAL | tabelas `atas_registro_preco`, `itens_ata_registro_preco` | Sem tela nem hook | 3 |
| A2.6 | Alertas de vencimento | PARCIAL | `src/hooks/dashboard/useComprasDashboardStats.ts`, `src/hooks/dashboard/useContratosDashboardStats.ts` | Só contador "a vencer 90 dias"; sem notificação, cron ou função | 3 |
| A2.7 | Navegação de Compras/Contratos | PARCIAL | `src/config/module-menus.config.ts`; `src/App.tsx:456-457` | Verificado: só `/compras` e `/contratos` têm rota; `/contratos/lista`, `/contratos/aditivos`, `/contratos/vencimentos`, `/compras/atas`, `/compras/fornecedores` caem em NotFound | 3 |
| A3.1 | Tombamento e cadastro de bens | ATENDE | `src/pages/inventario/BensPatrimoniaisPage.tsx`, `gerar_numero_tombo_patrimonio` | — | 3 |
| A3.2 | Movimentação e baixa | ATENDE | `src/pages/inventario/MovimentacoesPatrimonioPage.tsx`, `src/pages/inventario/BaixasPatrimonioPage.tsx` | Telas de detalhe `/:id` usam `PlaceholderDetalhePage` | 3 |
| A3.3 | Inventário com coleta móvel | ATENDE | `src/pages/mobile/ColetaMobilePage.tsx`, `src/pages/inventario/CampanhasInventarioPage.tsx` | `conciliacoes_inventario` sem uso | 3 |
| A3.4 | Coleta **sem conexão** | PARCIAL | `src/hooks/useColetaOffline.ts`, `vite.config.ts:114-170` | Fila em `localStorage`, não IndexedDB; só a coleta é enfileirada (cadastro, movimentação e foto exigem rede) | 3 |
| A3.5 | Estoque e requisições de almoxarifado | PARCIAL | `src/pages/inventario/AlmoxarifadoEstoquePage.tsx`, `src/pages/inventario/RequisicoesMaterialPage.tsx` | Tabelas `estoque` e `movimentacoes_estoque` sem uso no front | 3 |
| A3.6 | Balancetes e relatórios patrimoniais | PARCIAL | `src/pages/inventario/RelatoriosPatrimonioPage.tsx` | Catálogo com botões sem ação; sem balancete nem depreciação | 3 |
| A3.7 | Bens herdados do IDR | AUSENTE | — | Sem campo de origem nem fluxo de incorporação em lote | 3 |
| A4.1 | Processos e documentos internos | ATENDE | `src/pages/workflow/GestaoProcessosPage.tsx`, `src/hooks/useWorkflow.ts` | — | 3 |
| A4.2 | Numeração de atos | PARCIAL | `gerar_numero_portaria`; `src/pages/admin/GestaoDocumentosPage.tsx` | Numeração automática só para portaria | 3 |
| A4.3 | Modelos de documento | PARCIAL | `src/pages/rh/ModelosDocumentosPage.tsx`, `src/lib/pdfModelos.ts` | Modelos fixos no código, não editáveis | 3 |
| A4.4 | Tabela de temporalidade | AUSENTE | — | Nenhuma ocorrência em código, migração ou doc | 3 |
| A4.5 | Complemento ao SEI | PARCIAL | campo "Nº do Processo SEI" em vários fluxos | Apenas campo de texto; ver R8 | 3 |
| A5.1 | Dotação, empenho, liquidação, pagamento | ATENDE | `src/pages/financeiro/EmpenhosPage.tsx`, `src/pages/financeiro/LiquidacoesPage.tsx`, `src/pages/financeiro/PagamentosPage.tsx` | Detalhes `/:id` com placeholder | 3 |
| A5.2 | Adiantamentos e restos a pagar | ATENDE | `src/pages/financeiro/AdiantamentosPage.tsx`, `src/pages/financeiro/RestosAPagarPage.tsx` | — | 3 |
| A5.3 | Conciliação bancária | PARCIAL | `fin_extratos_bancarios`, `fin_extrato_transacoes` | Modelo sem nenhum código nem importação de extrato | 3 |
| A5.4 | Conciliação com o FIPLAN | AUSENTE | — | Zero ocorrências de "FIPLAN" no repositório; ver R8 | 3 |
| A5.5 | Relatórios de contratos e convênios | PARCIAL | `src/pages/financeiro/RelatoriosFinanceiroPage.tsx`, `src/pages/processos/ConveniosProcessoPage.tsx` | Catálogo sem handler; convênios é mock com array fixo | 3 |
| A6.1 | Estrutura organizacional | ATENDE | `estrutura_organizacional`, `src/pages/organograma/` | — | 4 |
| A6.2 | Riscos e controles internos | PARCIAL | tabelas `riscos_institucionais`, `controles_internos` | Só contagem no dashboard; sem CRUD | 4 |
| A6.3 | Indicadores | PARCIAL | `src/pages/governanca/RelatorioGovernancaPage.tsx` | Valores literais no código ("Conformidade 87") | 4 |
| A6.4 | Trilha de auditoria | PARCIAL | `audit_logs`, `log_audit`, migração `20260214235823` (triggers em `servidores`, férias, licenças, ponto e dezenas de outras) | INSERT livre em `audit_logs` (S3); cobertura das tabelas de folha a confirmar; sem retenção nem exportação | 1 e 4 |
| A7.1 | Denúncias | ATENDE | migração `20260924120000`, `src/pages/integridade/` | Tabela `denuncias` fora de `src/integrations/supabase/types.ts` (uso de `as any`) | 4 |
| A7.2 | Ouvidoria (manifestações) | AUSENTE | — | Sem tabela nem página | 4 |
| A7.3 | Conflito de interesses | AUSENTE | `src/App.tsx` (~1085-1087) | Rota aponta para dashboard placeholder | 4 |
| A8.1 | Portal de transparência ativa | PARCIAL | `src/pages/transparencia/*`, `publicacoes_lai` | Páginas leem tabelas-base, não as views do doc `docs/MIGRACAO_VIEWS_TRANSPARENCIA.sql` | 4 |
| A8.2 | Sem dado pessoal exposto | PARCIAL | ver achados S4 e S6 da spec | `cadastro_arbitros` legível por `anon`; `public/data/cargos.json` com nome e valor | 1 e 4 |
| A8.3 | Pedidos de acesso (e-SIC) | PARCIAL | `solicitacoes_sic`, `consultar_protocolo_sic`; `src/pages/transparencia/PortalLAIPage.tsx` | Backend existe; front é stub ("em implementação"), sem insert | 4 |
| A8.4 | Itens do art. 8º da Lei 12.527 | PARCIAL | `src/pages/transparencia/` | Faltam FAQ, repasses, programas/metas, despesas por favorecido, estatística de pedidos | 4 |
| A9.1 | Notícias, galerias, banners, páginas | ATENDE | `cms_conteudos`, `cms_galerias`, `src/pages/comunicacao/` | Policies públicas das galerias não revisadas | 4 |
| A10.1 | Beneficiários e atletas | AUSENTE | `src/pages/programas/selecoes/GestaoInscricoesPage.tsx` | Nenhuma tabela; tela usa `inscricoesMock` | 4 |
| A10.2 | Entidades e eventos | PARCIAL | `federacoes_esportivas`, `cadastro_arbitros`, `escolas_jer` | Eventos sem inscrição nem resultado persistidos | 4 |
| A10.3 | PROESPORTE | AUSENTE | — | Só texto em páginas do portal | 4 |
| A10.4 | Programas, ações e indicadores | PARCIAL | `programas`, `acoes`, `src/hooks/dashboard/useProgramasDashboardStats.ts` | Sem CRUD; indicador "atletasBolsa" conta instituições (proxy errado) | 4 |

## 2. Requisitos mínimos (ETP §3)

Resumo: **1 ATENDE** (R3, por desenho) · **6 PARCIAL** (R1, R2, R4, R5, R7, R9) · **4 AUSENTE/SÓ-DOC** (R6, R8, R10, R11).

| ID | Requisito | Status | Evidência | Lacuna | Marco |
|---|---|---|---|---|---|
| R1 | Dados exportáveis em formato aberto, com dicionário | PARCIAL | `src/export/exportCSV.ts`, `backup-offsite` (JSON/CSV/SQL), `database-schema` | Sem dicionário de dados; exportação "a qualquer tempo" só para perfil admin/TI; o "CSV" do backup é JSON com strings CSV | 1 e 4 |
| R2 | Transição assistida e entrega da base | SÓ-DOC | `PROPOSTA_CONTRATACAO_IDJUV.md` §6.6; `docs/MIGRACAO_SUPABASE_PROPRIO.md` | Sem runbook de transição nem script de entrega única | 4 |
| R3 | Dados separados de outros clientes | ATENDE | `docs/WHITE_LABEL.md` §1 (instância dedicada por instituição) | Não há `tenant_id`: o isolamento é por instância. Falta a comprovação documental e há `project_id` divergente entre `supabase/config.toml` e `docs/BACKUP_CONTINGENCIA.md` | 1 |
| R4 | LGPD (controlador/operador, perfil, registro de operações) | PARCIAL | RBAC/RLS, `audit_logs` | Sem ROPA, RIPD, encarregado, retenção, canal do titular, log de leitura de dado pessoal; controlador/operador só em `PROPOSTA` | 1 e 4 |
| R5 | Backup independente, teste de restauração, DR | PARCIAL | `supabase/functions/backup-offsite/index.ts`, `src/pages/admin/BackupOffsitePage.tsx` | Nenhum `cron.schedule` nas migrações; restauração manual; sem registro de teste; sem RTO/RPO; destino é outro projeto do mesmo provedor | 1 e 4 |
| R6 | SLA com indicadores mensais e glosa | SÓ-DOC | `PROPOSTA_CONTRATACAO_IDJUV.md` §6.2-6.3 | Sem painel de disponibilidade, chamados ou relatório mensal; sem monitoramento | 1 e 4 |
| R7 | Atualização legal incluída | PARCIAL | `tabela_inss`, `tabela_irrf` (com vigência), `src/pages/folha/ConfiguracaoFolhaPage.tsx` | Valores fixos em `src/lib/folhaCalculoService.ts` e `src/hooks/useMotorFolha.ts`; sem processo de atualização documentado | 2 |
| R8 | Interoperabilidade com SEI e FIPLAN | AUSENTE | — | Zero integração; leiautes dependem da SEPLAN/SEGAD (ETP §10) | 1, 3 e 4 |
| R9 | Capacitação e manuais com aceite | PARCIAL | `src/pages/admin/AdminHelpPage.tsx`, `src/pages/ManuaisPage.tsx` | `/manuais/*` renderizam todas a mesma página sem conteúdo; ajuda só no módulo admin; sem trilhas de treinamento | 4 |
| R10 | Homologação separada da produção | AUSENTE | `.env.example`, `supabase/config.toml` | Um só conjunto de variáveis e um só projeto; sem doc de ambientes | 1 |
| R11 | Normas do CETIF e, como referência, IN SGD/ME 94/2022 | AUSENTE | — | Nenhuma ocorrência de "CETIF"; é preciso obter a norma junto ao órgão | 1 |

## 3. Resultados pretendidos (ETP §9)

| ID | Meta | Status | Lacuna |
|---|---|---|---|
| RS1 | 100% das folhas geradas **e enviadas ao eSocial** pelo sistema | PARCIAL | Gera XML, não assina nem transmite (A1.6) |
| RS2 | 100% dos bens tombados e localizados, incluindo os herdados do IDR | PARCIAL | Sem origem "IDR" nem incorporação em lote (A3.7) |
| RS3 | 100% dos contratos com fiscal, vigência e alertas | PARCIAL | Dados sem tela e sem alertas (A2.4, A2.6) |
| RS4 | 100% dos itens do art. 8º da Lei 12.527 publicados | PARCIAL | A8.4 |
| RS5 | 100% dos novos cadastros do PROESPORTE com indicadores | AUSENTE | A10.1 e A10.3 |

## 4. Providências prévias ao contrato (ETP §10)

São dependências **externas** ao código. Entram no plano como riscos com dono, não como tarefas de engenharia.

| ID | Providência | Dono provável | Impacto se atrasar |
|---|---|---|---|
| PV1 | Designar gestor e fiscais do contrato | IDJuv/DIRAF | Sem aceite formal dos marcos |
| PV2 | Pontos focais por área usuária | IDJuv | Parametrização e testes sem interlocutor |
| PV3 | Levantar e organizar planilhas e cadastros a migrar | IDJuv (com apoio) | Bloqueia a migração e o Marco 2 |
| PV4 | Obter da SEPLAN e da SEGAD os leiautes de FIPLAN e SEI | IDJuv | **Bloqueia R8 inteiro** (A5.4, A4.5) |
| PV5 | Ouvir DiCOF e PGE sobre o art. 42 da LRF | IDJuv | Risco jurídico/orçamentário da contratação |

## 5. Outros achados do levantamento (fora do ETP, mas que afetam o aceite)

- **Telas-mock expostas na navegação** (`src/pages/processos/ConveniosProcessoPage.tsx`, `src/pages/governanca/RelatorioGovernancaPage.tsx`,
  `src/pages/programas/selecoes/GestaoInscricoesPage.tsx`, relatórios com botões sem ação). Em homologação, parecem funcionais e não são.
- **Hook sem consumidor:** `src/hooks/useRHIntegracoes.ts` (RPCs eSocial S-2200 e relatório TCE) não é usado por nenhum componente.
- **Docs defasadas:** `docs/EDGE_FUNCTIONS.md` lista `create-test-user`, que não existe em `supabase/functions/`;
  `docs/BACKUP_CONTINGENCIA.md` cita "plataforma Lovable" e um project ref fixo; `docs/EXPORTAR_DADOS.md` e
  `docs/MIGRACAO_SUPABASE_PROPRIO.md` trazem contagens de tabelas de março; `README.md` é boilerplate do Lovable.
- **Dessincronia entre `PROPOSTA_*` e o ETP:** ver spec §3.

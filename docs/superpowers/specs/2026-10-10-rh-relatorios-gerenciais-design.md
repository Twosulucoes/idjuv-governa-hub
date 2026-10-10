# Relatórios gerenciais de RH: férias, licenças, frequência, viagens e folha (Onda C, item 15)

Data: 2026-10-10 · Módulo: `rh` · Classificação: **bounded** (só front, sem migração; cards novos sobre
tabelas, hooks e geradores que já existem). Entrega em duas PRs: **15a** férias, licenças, frequência e
viagens (esta spec); **15b** folha (resumo por competência, por unidade e por rubrica), com os mesmos
componentes de filtro e exportação.

Pedido (docs/planejamento/FINALIZACAO.md, item 15): `/prompt relatorio --modulo rh Relatórios de férias,
licenças, frequência, viagens e folha`.

## Premissas (sessão autônoma)

1. **Sem migração, sem RPC.** Tudo lido pelas tabelas existentes (`ferias_servidor`, `licencas_afastamentos`,
   `frequencia_mensal`, `viagens_diarias`) com filtros no banco e agregação no cliente. A RLS de SELECT dessas
   tabelas libera quem tem o módulo `rh` (`rls/35_policies_geradas.sql:1622,2135,2444,3541`), então o
   relatório não mostra nada além do que as telas de gestão já mostram.
2. **LGPD: sem CPF, sem saúde, sem banco.** Os novos relatórios identificam o servidor por nome e matrícula.
   Licenças não trazem `cid`, `crm`, `medico_nome`, `documento_comprobatorio_url` nem `observacoes`. Nenhum
   select usa `*`: colunas explícitas.
3. **Filtros comuns**: período (data inicial/final), unidade (`estrutura_organizacional`, via
   `useUnidadesParaFiltro` de `src/hooks/useRelatorios.ts`), status. Frequência usa competência (ano/mês).
   Sem filtro por servidor individual (histórico funcional, contracheque e frequência individual já cobrem).
4. **Semântica do período = sobreposição**: entra no relatório o registro cujo intervalo (`data_inicio..data_fim`
   para férias e licenças; `data_saida..data_retorno` para viagens) cruza o período filtrado. É o que um gestor
   espera de "quem está de férias/licença/viagem neste mês". Registros com `data_fim` nula entram se
   `data_inicio <= fim do período`.
5. **Relatórios desta PR (15a)**
   - **Férias**: lista por unidade com subtotal de dias; colunas servidor, matrícula, unidade, período
     aquisitivo, início, fim, dias, parcela, status, portaria. Saldo por período aquisitivo fica para depois
     (fora de escopo).
   - **Licenças e afastamentos**: agrupado por `tipo_afastamento` (labels `AFASTAMENTO_LABELS`/`LICENCA_LABELS`
     de `src/types/rh.ts`) com subtotal de dias; colunas servidor, matrícula, unidade, tipo, início, fim, dias,
     status, portaria. Licença em aberto (sem `data_fim`) aparece como "Em aberto" e conta dias até o fim do
     período filtrado, para não entrar como zero no subtotal.
   - **Frequência**: consolidado da competência, reaproveitando `generateRelatorioFrequenciaGeral` de
     `src/lib/pdfRelatorioFrequencia.ts` com novo parâmetro opcional `agruparPorUnidade` (subtotais por
     unidade); dados de `useFrequenciaResumo(ano, mes)`. Só servidores ativos (limitação do hook atual,
     registrada).
   - **Viagens**: período + unidade/status/ônus; colunas servidor, matrícula, unidade, destino, saída, retorno,
     ônus, diárias, valor, status, relatório apresentado; totais de diárias e valor por unidade e geral.
     `valor_total` nulo (legado) é recalculado com `calcularTotalDiarias` de `src/lib/diariasRegras.ts`.
   - Cada card: filtros → pré-visualização "N registros" (`EmptyState` quando 0) → exportar **PDF** e **XLSX**
     (`exportarParaExcel` de `src/export/exportExcel.ts`, importado com alias para não colidir com
     `src/lib/exportarPlanilha.ts`).
6. **PDF** com os helpers de `src/lib/pdfTemplate.ts` (`generateInstitutionalHeader`/`Footer`, `addSectionTitle`,
   `addTableHeader`/`addTableRow`, `checkPageBreak`, `addPageNumbers`, `formatDate`, `formatCurrency`,
   `CORES`); identidade via `getTenantSnapshot()` (`@/core/tenant`), nunca literal do cliente nem cor crua.
   Viagens em paisagem (mais colunas).
7. **Hooks compartilhados não mudam**: `useFerias`, `useViagens`, `useFrequencia` ficam como estão (usados por
   telas em andamento). Os relatórios ganham `src/hooks/useRelatoriosRH.ts` com queries próprias
   (`enabled` só com filtros válidos, paginação por `.range()` avançando pelo que o servidor devolveu, ordenação com desempate por `id`). Servidores sem unidade ficam por último na ordenação.
8. **Página aditiva**: `src/pages/rh/RelatoriosRHPage.tsx` só recebe uma seção nova ("Afastamentos, frequência
   e viagens") com os cards, abaixo do grid atual; os handlers antigos não são reformatados. Rota mantém
   `rh.relatorios.visualizar`; o item de menu passa de `rh.visualizar` para `rh.relatorios.visualizar`
   (alinhar ao `ROUTE_PERMISSIONS`).
9. **Não tocar** em dashboard de RH, lista de servidores e `ServidorDetalhePage` (frente do design system).

## Desenho

| Arquivo | Mudança |
|---|---|
| `src/hooks/useRelatoriosRH.ts` (novo) | `useFeriasRelatorio(f)`, `useLicencasRelatorio(f)`, `useViagensRelatorio(f)` com embed `servidor:servidores!<fk>(id, nome_completo, matricula, unidade:estrutura_organizacional!servidores_unidade_atual_id_fkey(id, nome, sigla), cargo:cargos!servidores_cargo_atual_id_fkey(nome))`; filtros `FiltroPeriodoUnidade { inicio, fim, unidadeId?, status? }`; tipos de linha exportados |
| `src/lib/relatoriosRHRegras.ts` (novo) | funções puras: `agruparPor(linhas, chave)`, `somar`, `periodoValido`, `linhaFeriasParaPlanilha`, `linhaLicencaParaPlanilha`, `linhaViagemParaPlanilha` (testáveis sem DOM) |
| `src/lib/pdfRelatoriosAfastamentos.ts` (novo) | `gerarRelatorioFerias`, `gerarRelatorioLicencas`, `gerarRelatorioViagens` |
| `src/lib/pdfRelatorioFrequencia.ts` | parâmetro opcional `agruparPorUnidade` em `generateRelatorioFrequenciaGeral`; exportar `FrequenciaServidor` (retrocompatível) |
| `src/components/rh/relatorios/` (novo) | `FiltroPeriodo.tsx`, `FiltroCompetencia.tsx`, `BotoesExportar.tsx` (PDF + XLSX, `aria-busy`), `RelatorioFeriasCard.tsx`, `RelatorioLicencasCard.tsx`, `RelatorioFrequenciaCard.tsx`, `RelatorioViagensCard.tsx` |
| `src/pages/rh/RelatoriosRHPage.tsx` | seção nova com os 4 cards; subtítulo atualizado |
| `src/config/menu.config.ts` | item Relatórios: `rh.relatorios.visualizar` |
| Docs | `docs/MODULOS.md`, `docs/RBAC_PERMISSOES.md` (entrada nova para `/rh/relatorios`), `docs/GUIA_FRONTEND.md` (matriz hook/lib), `docs/planejamento/FINALIZACAO.md`, `docs/planejamento/ROADMAP.md` |

## Fora de escopo (registrar)

- **Folha** (resumo por competência, por unidade, por rubrica) → PR 15b. Relatório **nominal** de folha (por
  servidor com líquido) só com decisão do usuário: exigiria gate próprio e `log_audit` como no contracheque.
- Saldo de férias por período aquisitivo (regras em `feriasRegras.ts`), 1/3 constitucional.
- Permissões novas no catálogo (`rh.folha.*`, `rh.relatorios.folha`) e RBAC das rotas `/folha*`
  (`App.tsx:921-926` sem `requiredPermissions`; só registrado). RLS granular de folha/licenças: Onda B, item 8.
- CPF nos PDFs antigos de `pdfRelatoriosRH.ts:299` (dívida existente; não mexer nesta PR).
- Migrar `RelatoriosRHPage` ao design system; `useFrequenciaResumo` incluir afastados.

## Verificação

`bash scripts/gate.sh` verde; script de asserções para `relatoriosRHRegras.ts` (agrupamento, somas, período,
linhas de planilha, rejeição de data fora do ISO no filtro) e PDF gerado com dados de exemplo (script Node com
jsPDF, sem DOM) e conferido — os dois scripts ficam no rascunho da sessão, fora do repositório (o repo não tem
suíte de testes); revisão `revisor-codigo-idjuv` + `revisor-seguranca-idjuv` (LGPD).

## Entrega 15b — folha (PR empilhada sobre a 15a)

Premissas adicionais:

1. **Só agregados, sem nome de servidor.** Relatório nominal de folha (por servidor, com líquido) fica fora
   até decisão do usuário (exigiria gate próprio e `log_audit` como no contracheque). Contracheque individual
   e em lote já existem (`pdfContracheque.ts`).
2. **Três relatórios**, no mesmo card "Folha de pagamento" (`RelatorioFolhaCard.tsx`), com filtro de ano e
   seleção da folha (competência + tipo) vinda de `useFolhasPagamento(ano)` (`src/hooks/useFolhaPagamento.ts`):
   - **Resumo do ano**: uma linha por folha (`folhas_pagamento`: competência, tipo, status, quantidade de
     servidores, bruto, descontos, líquido, INSS servidor/patronal, IRRF, encargos) com total do ano.
   - **Por unidade** (de uma folha): `fichas_financeiras` agregadas por `unidade_nome` (servidores, proventos,
     descontos, líquido, INSS, IRRF) com total.
   - **Por rubrica** (de uma folha): `itens_ficha_financeira` agregados por `tipo` e `descricao` (quantidade de
     fichas, valor) — proventos e descontos em blocos, com subtotal e total; itens lidos com
     `ficha:fichas_financeiras!inner(folha_id)` e `.eq("ficha.folha_id", id)`, paginados.
   Cada relatório sai em PDF e XLSX.
3. **Gate no front**: o card só aparece com `hasAnyPermission(["financeiro.folha.visualizar"])` ou super admin
   (o catálogo dá `rh.relatorios.visualizar` ao papel `user`; a RLS de `folhas_pagamento` exige o módulo
   `rh`, e a de `fichas`/`itens` o módulo `rh` ou a própria ficha). Sem permissão nova no catálogo.
4. **LGPD**: selects com colunas explícitas; nada de `cpf`, `banco_*`, `pis_pasep`, `servidor_nome` nos
   agregados. Folhas em `rascunho` entram no resumo do ano com o status visível (o gestor precisa vê-las);
   por unidade/rubrica só de folhas `aberta`, `fechada` ou `reaberta` (o enum `status_folha` é
   `aberta | previa | processando | fechada | reaberta`, e `processar_folha` deixa a folha em `aberta`); a lista
   do `Select` filtra.
5. Hooks compartilhados de folha não mudam; o card reaproveita `FiltroSelect`, `BotoesExportar` e
   `PreviaRegistros` da 15a; regras puras novas vão para `relatoriosRHRegras.ts` (ou `relatoriosFolhaRegras.ts`
   se passar de ~150 linhas); PDFs em `src/lib/pdfRelatoriosFolha.ts` com os mesmos helpers.

Fora de escopo da 15b: relatório nominal; 1/3 de férias; comparação entre competências; RBAC das rotas
`/folha*`.

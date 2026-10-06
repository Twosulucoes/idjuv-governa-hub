# Estrutura de documentação, agentes, skills, plugins e APIs a partir do ETP — Design

> **Registro datado (2026-10-06), não canônico.** Estado: **proposta aguardando aprovação**.
> Nada aqui existe ainda além deste arquivo, da matriz anexa e do plano
> [`../plans/2026-10-06-etp-solucao-gestao-integrada.md`](../plans/2026-10-06-etp-solucao-gestao-integrada.md).
> Classificação do fluxo `/superpowers`: **architectural**.

## 1. Pedido e premissas

**Pedido:** "Baseado nesse ETP, quero fazer toda a estrutura de documentação, dos agentes, skills, plugins,
APIs, tudo que precisa pra contemplar o projeto. Faça um planejamento a partir do que o ETP promete e o que já tem."

**Premissas** (a sessão não permitiu confirmar; contestar qualquer uma muda o plano):

| # | Premissa |
|---|---|
| P1 | O ETP é documento do **contratante** (IDJuv-RR). Este repositório é a **solução candidata** do fornecedor (Two Soluções). O plano trata o ETP como termo de referência a atender, e `PROPOSTA_*.md` como documento comercial do fornecedor. |
| P2 | O ETP ainda não é edital: processo SEI, DFD, equipe e pesquisa direta com 3 fornecedores estão em branco/pendentes. Valores e prazos podem mudar no TR, então a rastreabilidade tem que ser **viva** e barata de atualizar. |
| P3 | O produto continua **white-label**: nenhuma doc nova nem código leva nome de cliente em `src/` (invariante 4). Documentos contratuais específicos do IDJuv ficam em `docs/` e `tenants/idjuv/`. |
| P4 | Esta entrega só **planeja**. Não cria agentes, skills, hooks, APIs nem docs canônicas; isso é a execução do plano, depois do "sim". |
| P5 | Nenhuma migração em projeto remoto, nenhuma mudança em RLS existente, `ProtectedRoute` ou `AuthContext` sem confirmação explícita (invariantes 2 e 8). |
| P6 | Os dispositivos legais citados (Lei 14.133, LGPD, LAI, CETIF, IN SGD 94) vêm do ETP. Qualquer skill ou doc que os interprete precisa de revisão do jurídico/encarregado antes de valer como norma. |

## 2. Onde estamos

Detalhe e evidências em [`2026-10-06-etp-matriz-rastreabilidade.md`](./2026-10-06-etp-matriz-rastreabilidade.md).

- **Áreas funcionais (10):** 1 `ATENDE` (Comunicação), 9 `PARCIAL`. Pessoas e folha é a mais madura. Compras e contratos
  tem **modelo de dados sem telas** (e links de menu para rotas inexistentes). Programas finalísticos
  (beneficiários, atletas, PROESPORTE) está praticamente ausente.
- **Requisitos mínimos (11):** 1 `ATENDE` por desenho (R3), 6 `PARCIAL`, 4 `AUSENTE`/`SÓ-DOC` (SLA, interoperabilidade
  SEI/FIPLAN, homologação, CETIF).
- **Resultados pretendidos (5):** nenhum atingível hoje; RS5 (PROESPORTE) é inexistente.
- **Documentação:** 22 docs técnicos bons para desenvolvedor, mas **faltam** os documentos que o ETP e o aceite exigem:
  dicionário de dados, manual do usuário, plano de implantação/capacitação/testes, plano de DR com RTO/RPO, SLA e relatório
  mensal, política LGPD/ROPA/RIPD, matriz de interoperabilidade, matriz de rastreabilidade, referência de API.
- **Agentes e skills:** 6 agentes genéricos de engenharia e skills só de processo. Nenhum skill de domínio (folha/eSocial,
  Lei 14.133, patrimônio, LGPD/LAI, SEI/FIPLAN). Nenhum hook de proteção, `permissions`, `.mcp.json` ou plugin próprio.
- **APIs:** 8 Edge Functions, sem OpenAPI, sem `verify_jwt` declarado, sem rate limit, sem integração real com SEI,
  FIPLAN, PNCP nem transmissão eSocial.

## 3. Achados críticos (tratar antes de documentar)

Estes itens afetam diretamente R4 (LGPD) e A8.2 (transparência sem dado pessoal). Os marcados "sim" foram
reverificados à mão no código; os demais vêm do levantamento e precisam de confirmação.

| ID | Achado | Evidência | Verificado | Gravidade sugerida |
|---|---|---|---|---|
| S1 | `backup-offsite`, ação `external-export` com `localExport:true`: basta estar autenticado (sem checar papel) para exportar **todas** as tabelas com a service role | `supabase/functions/backup-offsite/index.ts:265-290` | sim | Alta |
| S2 | `list-tables` responde antes de qualquer autenticação e expõe o nome das tabelas | `index.ts:371-393` | sim | Média |
| S3 | `audit_logs` aceita `INSERT` de qualquer `authenticated` (`WITH CHECK (true)`), então a trilha pode ser forjada, inclusive `user_id` | `supabase/migrations/20260131033148_5b710fa3-050c-40aa-8997-40fcc40630eb.sql:167-170` | sim | Alta |
| S4 | `cadastro_arbitros` (CPF, RG, e-mail) tem `SELECT` para `anon` com `USING (true)`; nenhuma migração posterior do repositório a remove | `supabase/migrations/20260306220715*.sql:66-70` | sim no repo; **banco ao vivo não verificado** | Alta (LGPD) |
| S5 | `demandas_ascom`: leitura `anon` ampla | migração `20260122165157*` | não | Média |
| S6 | `public/data/cargos.json|csv` serve nome do ocupante + remuneração como estático (invariante 6). Remuneração nominal pode ser publicável pela LAI; decidir com encarregado/jurídico e servir por view com data de apuração | `public/data/` | não | Média |
| S7 | `backup-offsite` decodifica o JWT sem checar a assinatura para reconhecer `service_role`. Só é explorável se `verify_jwt` estiver desligado, o que o repositório não permite saber (`supabase/config.toml` só tem `project_id`) | `index.ts` (~410-420) | código lido; exploração não confirmada | Média |
| S8 | CORS `*` fixo em `backup-offsite`, `download-frequencia`, `enviar-convite-reuniao`; nenhuma função tem rate limit | `supabase/functions/*` | não | Baixa |
| S9 | `admin-create-user` e `admin-reset-password` não gravam em `audit_logs` | `supabase/functions/*` | não | Média |
| S10 | Páginas públicas de transparência consultam tabelas-base; as views `v_transparencia_*` (mascaradas) só existem em `docs/MIGRACAO_VIEWS_TRANSPARENCIA.sql` | `src/pages/transparencia/*` | não | Média |

**Recomendação:** abrir uma **Fase 0** que trata S1–S4 e S7 (e confirma S5, S6, S9 e S10) antes da documentação. Cada correção
de RLS exige o seu "sim" (invariante 2) e `get_advisors` depois de aplicada.

## 4. ETP × PROPOSTA do repositório

`PROPOSTA_CONTRATACAO_IDJUV.md` e `PROPOSTA_DFD_IDJUV.md` foram escritas pelo fornecedor, antes do ETP.
Divergem do ETP nos pontos abaixo. **Esta entrega não altera as propostas**: o realinhamento é decisão comercial sua (D3).

| Tema | ETP | PROPOSTA | Observação |
|---|---|---|---|
| Valor | R$ 82.000 de implantação + R$ 14.476/mês (mediana de mercado) = R$ 255.712 em 12 meses | R$ 118.500 + R$ 14.990/mês (franquia de 86 h) = R$ 298.380 no 1º ano | Decisão comercial |
| Modalidade | Pregão eletrônico, menor preço global, solução neutra de marca e de provedor | Posiciona a solução do fornecedor como alternativa escolhida; fundamenta o lote único em "indissociável" | O ETP é do órgão; o conteúdo do fornecedor não deve se misturar a ele. Consultar o jurídico |
| Neutralidade técnica | "Sem indicar marca, linguagem ou provedor de nuvem" | §3.4 cita Vercel, Supabase, Resend e Lovable | Vale para a descrição do órgão, não para a oferta; mas a matriz e as docs de contratação devem falar em capacidades |
| Código-fonte | Exige dados exportáveis e transição (R1, R2) | §6.6 prevê licença de uso do código do núcleo | O ETP não pede código |
| SEI / FIPLAN / CETIF | Exige (R8, R11) | Não cita | Lacuna a cobrir (A5.4, A4.5, R8, R11) |
| Licenciamento | 120 usuários em 41 locais; prefere modelo sem limite de usuários | Franquia por horas de serviço | Verificar se o produto não limita usuários |
| Implantação | Até 130 dias, 4 marcos (20/25/30/25%) com aceite | 8 critérios de aceite | Mapear os critérios de aceite aos 4 marcos (Tarefa 11 do plano) |

## 5. Estrutura-alvo

Princípio: **doc descreve o que existe; o que é promessa fica marcado.** Cada doc nova declara no topo
`Estado: Vigente | Parcial | Rascunho normativo`, conforme `docs/GOVERNANCA_DOCUMENTACAO.md` §4 e §7.
Criar doc canônica exige `LIVING_DOCS` em `scripts/check-doc-links.mjs` + linha em `docs/README.md` + linha na matriz do §3.

### 5.1 Documentação

| Doc | Responde por | Requisito | Origem | Marco |
|---|---|---|---|---|
| `docs/contratacao/RASTREABILIDADE_ETP.md` | Matriz viva ETP → módulo → arquivo → status (IDs A/R/RS/PV) | todos | manual, **validada por script** | 1 |
| `docs/contratacao/INTEROPERABILIDADE.md` | SEI, FIPLAN, eSocial, CNAB, e-mail e IA: direção, formato, leiaute (fonte), status, dono | R8 | manual | 1 (esqueleto), 3 |
| `docs/contratacao/CONFORMIDADE_NORMATIVA.md` | Mapeamento CETIF e IN SGD/ME 94/2022 | R11 | manual (depende de obter a norma) | 1 |
| `docs/dados/DICIONARIO_DADOS.md` | Tabelas, colunas, tipos, FKs, descrição | R1 | **gerado** por script a partir de `types.ts` | 1 |
| `docs/dados/EXPORTACAO_E_TRANSICAO.md` | Exportação aberta e entrega da base no fim do contrato | R1, R2 | manual; `EXPORTAR_DADOS.md` vira histórico | 4 |
| `docs/operacao/CONTINUIDADE_DR.md` | RTO/RPO, agendamento, drill de restauração, modelo de registro | R5 | manual; aponta `BACKUP_CONTINGENCIA.md` | 1 (doc), 4 (drill) |
| `docs/operacao/NIVEL_DE_SERVICO.md` | Severidades, indicadores, glosa, modelo do relatório mensal | R6 | manual | 1 |
| `docs/operacao/AMBIENTES.md` | Produção × homologação × desenvolvimento, variáveis, promoção | R10 | manual | 1 |
| `docs/lgpd/GOVERNANCA_LGPD.md` | Papéis, ROPA, bases legais, retenção, direitos do titular, incidentes | R4 | manual, revisão do encarregado | 1, 4 |
| `docs/api/API_REFERENCIA.md` + `docs/api/openapi.yaml` | Edge Functions e RPCs públicas | R8 | manual, **guard de completude** | 1 |
| `docs/implantacao/PLANO_IMPLANTACAO.md` | 4 marcos, 130 dias, pontos focais, migração de planilhas | ETP §7, §10 | manual | 1 |
| `docs/implantacao/PLANO_TESTES_HOMOLOGACAO.md` | Critérios e roteiros de aceite por marco | R10 | manual | 1 |
| `docs/implantacao/PLANO_CAPACITACAO.md` | Trilhas por perfil, turmas, aceite | R9 | manual | 4 |
| `docs/usuario/` (índice + manual por módulo) | Manual do usuário final; renderizado também em `/manuais/:slug` | R9 | manual, textos sem nome de cliente | 2 a 4 |

Também entram: correção das docs defasadas apontadas na matriz §5 e o `README.md` raiz (hoje boilerplate do Lovable).

### 5.2 Agentes

Regra: **agente = papel + ferramentas; skill = conhecimento de domínio.** Por isso não se criam agentes por módulo.

| Agente | Situação | Papel | Escreve? |
|---|---|---|---|
| `arquiteto-idjuv` | corrigir | Hoje manda gravar specs sem ter `Write`. Remover a instrução (devolve o texto; quem chama grava) | não |
| `documentador-idjuv` | ajustar | Acrescentar `Bash` para rodar `npm run check:docs` | só docs |
| `dev-integracoes-idjuv` | **novo** | Geradores/parsers CNAB, eSocial, FIPLAN, SEI; Edge Functions de integração; OpenAPI | sim |
| `revisor-lgpd-idjuv` | **novo** | PII, RLS para `anon`, views de transparência, retenção, ROPA; usa `get_advisors` e `list_tables` | não |
| `qa-homologacao-idjuv` | **novo** | Roteiros de aceite, Playwright em 390px e desktop, drill de restauração, evidências | testes e docs |
| `redator-manuais-idjuv` | **novo** | Manuais e plano de capacitação em linguagem simples; sem nome de cliente | só docs |

Os demais (`dev-banco-supabase`, `dev-frontend-idjuv`, `revisor-codigo-idjuv`, `revisor-seguranca-idjuv`) ficam como estão.
Atualizar `AGENTS.md` (tabela de agentes) e o Passo 4 do skill `superpowers` ao criar os novos.

### 5.3 Skills de domínio

Criadas **sob demanda**, na tarefa do marco que precisa delas, não todas de uma vez. Conteúdo legal marcado "validar com jurídico" (P6).

| Skill | Cobre | Usado por | Marco |
|---|---|---|---|
| `rastreabilidade-etp-idjuv` | Como atualizar a matriz: IDs, status permitidos, evidência | `documentador-idjuv` | 1 |
| `lgpd-lai-idjuv` | RLS para `anon`, views de transparência, ROPA, retenção, log de acesso | `revisor-lgpd-idjuv`, `dev-banco-supabase` | 1 |
| `dicionario-dados-idjuv` | Gerador, convenção de `COMMENT ON`, modo `--check` | `documentador-idjuv` | 1 |
| `integracao-sei-fiplan-idjuv` | Esqueleto agora; completar quando PV4 trouxer os leiautes | `dev-integracoes-idjuv` | 1 e 3 |
| `homologacao-dr-idjuv` | Drill de restauração, registro de evidência, ambientes | `qa-homologacao-idjuv` | 1 e 4 |
| `folha-esocial-cnab-idjuv` | Motor de folha, parâmetros legais, eventos eSocial, CNAB | `dev-integracoes-idjuv`, `dev-frontend-idjuv` | 2 |
| `contratacoes-lei-14133-idjuv` | DFD, PCA, ETP, TR, contratos, atas, aditivos, fiscalização, alertas | `dev-frontend-idjuv`, `dev-banco-supabase` | 3 |
| `patrimonio-offline-idjuv` | Tombamento, inventário, fila offline em IndexedDB, bens do IDR | `dev-frontend-idjuv` | 3 |
| `orcamento-financeiro-idjuv` | Empenho, liquidação, pagamento, conciliação, FIPLAN | `dev-banco-supabase`, `dev-frontend-idjuv` | 3 |
| `documentos-pdf-idjuv` | Padrão dos ~40 `pdf*.ts`, tokens do tenant | `dev-frontend-idjuv` | 3 |
| `manual-usuario-idjuv` | Estrutura do manual, captura de telas, linguagem | `redator-manuais-idjuv` | 4 |

### 5.4 Hooks, permissões e MCP

Hoje existe só o hook `SessionStart`. Os invariantes vivem apenas em texto.

- **Hook `PreToolUse` (Edit/Write):** bloqueia `src/integrations/supabase/client.ts` e `types.ts` (invariante 3),
  `public/**/*.sql` (invariante 6) e arquivos `.env*`, com saída de emergência por variável de ambiente.
  Regenerar `types.ts` pelo MCP continua possível com a variável.
- **`permissions.deny` em `.claude/settings.json`:** `git push --force*`, `supabase db push*`, leitura de `.env*`.
  Montar com o skill `update-config` e testar o bloqueio de verdade.
- **`.mcp.json`:** Supabase em modo somente leitura, com o `project_ref` vindo de variável de ambiente (nada de ref, token ou
  chave no arquivo; invariante 5), e Playwright. O GitHub já vem do ambiente.

### 5.5 Plugin

Recomendação: **adiar**. Um plugin só se paga quando houver uma segunda instância (skill `onboarding-cliente-idjuv`).
Quando chegar a hora, `.claude/` continua sendo a fonte e um script (`scripts/build-plugin.sh`) gera
`.claude-plugin/plugin.json` e `marketplace.json`, sem duplicar arquivos à mão. Ver D4.

### 5.6 APIs (Edge Functions, RPC e views)

**Padrão para toda função** (nova ou corrigida): módulo `supabase/functions/_shared/` com `cors.ts` (allowlist),
`auth.ts` (JWT + papel) e `audit.ts` (grava em `audit_logs` via `log_audit`); `[functions.<nome>] verify_jwt` explícito em
`supabase/config.toml`; entrada em `docs/api/openapi.yaml`; limite de taxa (mecanismo a decidir na Tarefa 9).

| Item | Requisito | Marco |
|---|---|---|
| Correções S1, S2, S7, S8, S9 nas funções existentes | R4 | 0 |
| Migração: `audit_logs` só por `log_audit`/triggers (S3) | R4 | 0 |
| Migração: RPC `consultar_protocolo_arbitro` no lugar do `SELECT` anon (S4) | R4 | 0 |
| Migração: views `v_transparencia_*` e troca das páginas públicas (S10) | A8.1, A8.2 | 4 |
| `exportar-dados`: ZIP com CSV + JSON + dicionário, perfil `admin.exportar`, URL assinada, auditoria | R1 | 4 |
| `alertas-vigencia`: cron diário de vigência e garantias, grava notificação e envia e-mail | A2.6, RS3 | 3 |
| `esocial-transmitir`: assinatura e envio. **Depende de certificado digital do órgão** (dependência nova, ver §7) | A1.6, RS1 | 2 |
| `fiplan-conciliacao` e `sei-interface`: formato definido pelos leiautes da SEPLAN/SEGAD | R8 | 3 (**bloqueado por PV4**) |
| `saude-sistema` + job de medição em `sla_medicoes` | R6 | 4 |
| `teste-restauracao`: restaura em homologação e grava evidência | R5 | 4 |
| Agendamento real dos backups (`cron.schedule` em migração) | R5 | 1 |

### 5.7 Guards automáticos

- `scripts/check-etp-rastreabilidade.mjs`: toda linha da matriz viva tem ID, status válido, e cada caminho de evidência existe
  (exceto `AUSENTE` e `SÓ-DOC`). Entra em `scripts/gate.sh` e `package.json` (`check:etp`).
- `scripts/gerar-dicionario-dados.mjs` com `--check`: falha se `DICIONARIO_DADOS.md` não bate com `types.ts`.
- Guard de completude da API: toda pasta de `supabase/functions/` aparece em `docs/api/openapi.yaml`.
- `LIVING_DOCS` ampliado com as docs novas; ativar `docs-guard` no CI (D5).

## 6. Decisões para você

| # | Decisão | Recomendação |
|---|---|---|
| D1 | Tratar S1–S4 e S7 numa Fase 0 **antes** da documentação? Cada mudança de RLS pede seu "sim" | **Sim.** É requisito R4 e é risco presente |
| D2 | Confirmar P1: você é o fornecedor e o ETP é do órgão? | Se não for, a Seção 4 e o foco do plano mudam |
| D3 | Realinhar `PROPOSTA_*.md` ao ETP agora ou depois do TR? | **Depois do TR.** Esta entrega só registra as divergências |
| D4 | Plugin agora ou quando houver 2ª instância? | **Quando houver 2ª instância** |
| D5 | Ativar o `docs-guard` no CI após a Fase 1? (hoje só `workflow_dispatch`) | **Sim**, porque passam a existir docs vivas obrigatórias |
| D6 | Fazer a revisão do jurídico/encarregado (P6) antes do Marco 1? | **Sim** para `GOVERNANCA_LGPD.md` e `CONFORMIDADE_NORMATIVA.md` |

## 7. Riscos e fora de escopo

- **Prazo:** o ETP dá 130 dias para tudo. Compras e contratos (30% do valor) parte de modelo sem telas; é o maior risco.
  O plano detalha as Fases 0 e 1 e deixa as Fases 2 a 4 como épicos, cada um com spec e plano próprios ao começar.
- **Dependências externas:** PV4 (leiautes FIPLAN e SEI) bloqueia R8. O eSocial real exige **certificado digital do órgão**,
  que o ETP não menciona. A norma do CETIF precisa ser obtida (R11).
- **Sem suíte de testes:** correções em folha, RLS e backup não têm rede de segurança automática. O plano usa
  verificação por advisors, grep e roteiro manual, e propõe `qa-homologacao-idjuv`.
- **Sincronia com o Lovable:** `src/App.tsx` receberá muitas rotas (Marcos 3 e 4). Manter diffs pequenos e por marco.
- **Fora de escopo:** reescrever as propostas comerciais, estimar horas ou preço, implementar as funcionalidades dos
  Marcos 2 a 4 (viram épicos), tornar o produto multi-tenant em banco (WHITE_LABEL §1 fixa uma instância por instituição).
- **Limite do levantamento:** estático, em 2026-10-06. Não executou o app nem consultou o banco ao vivo.

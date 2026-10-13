# Workflow: acompanhamento de processos do SEI por etapas (2026-10-13)

**Classificação:** architectural (tabelas novas, RPCs, troca da RLS do workflow, telas de `/processos/*` e `/workflow`).
**Pedido:** Fabiano, no projeto "Processo Governa HuB": desenvolver a tramitação. Decisões dele em 13/10/2026:
o sistema **acompanha** processos do SEI (não é um SEI interno) e o desenho abaixo foi aprovado em conversa.
Levantamento do estado atual: `03_TRAMITACAO_WORKFLOW.md` e `02_PROCESSOS_ADMINISTRATIVOS.md` na pasta do projeto
(resumo na seção "Hoje").

## Objetivo

Quem trabalha num processo administrativo do IDJUV abre o sistema e vê, para cada processo do SEI que acompanha:
em que etapa está, em qual unidade, desde quando, se o prazo da etapa venceu e o que falta do checklist para
avançar. A Presidência e as diretorias veem o mesmo por tipo de processo e por unidade. Despacho, documento,
assinatura e publicação continuam no SEI (decisão de 12/10/2026).

**Critérios de sucesso**

1. "Iniciar processo" nas telas de `/processos/*` cria um processo real, ligado ao modelo do tipo.
2. Avançar de etapa só é possível com os itens obrigatórios daquela etapa marcados, e grava quem, quando, de onde
   para onde.
3. "Na minha unidade" lista os processos cuja etapa atual pertence à unidade de lotação do usuário, com prazo em
   semáforo (em dia, vence em até 2 dias úteis, vencido).
4. Processo restrito ou sigiloso não é lido, alterado nem apagado por quem não tem credencial — no banco.
5. O painel `/workflow` mostra números que batem com a lista.
6. Nenhuma tela de `/processos/*` mostra dado fictício nem botão sem ação.

## Hoje (o que muda e por quê)

- `/processos/*` são guias estáticos: etapas e checklist em constantes no `.tsx`, nada gravado, "Iniciar processo"
  sem `onClick`, dados fictícios em Convênios, Veículos e Pagamentos.
- `/workflow` tem processo, movimentação, despacho, documento e prazo, mas "Tramitar" não pede destino, nada marca
  recebimento, o sigilo não vale no banco (RLS só por módulo, inclusive DELETE), o painel consulta a tabela errada
  (`encaminhamentos.destinatario_id`, coluna inexistente) e há triggers duplicados (auditoria, `updated_at`,
  validação de arquivamento) e dois geradores de número (5 e 4 dígitos).

## Premissas

1. **Reaproveitar as tabelas do workflow.** `processos_administrativos` vira o "processo acompanhado";
   `movimentacoes_processo` vira o registro de cada passagem de etapa. Elas já estão no mapa de RLS, na auditoria
   e nas telas. Tabela nova só para o que não existe: modelo de fluxo, etapas, checklist e respostas.
2. **Número SEI.** Coluna nova `numero_sei` (texto, único quando preenchido, normalizado sem espaços). É opcional
   na abertura, porque o processo pode nascer antes de existir no SEI (ex.: Termo de Demanda), e **obrigatório para
   sair da etapa 1**. O número interno (`00001/2026`) continua como identificador do sistema. Sem validação de
   formato além de "tem dígitos" até o órgão confirmar o padrão do SEI-RR.
3. **Etapa aponta para a unidade pela sigla.** O modelo guarda `unidade_sigla` (ex.: `DIRAF`, `CI`, `PRES`, `CPL`,
   `NuPat`; `PRES` é a sigla da Presidência no cadastro de unidades do banco, e `PRESI` só aparece na numeração das
   portarias, D13) e o banco resolve para `estrutura_organizacional.id` na hora de avançar. Duas siglas especiais:
   `@ORIGEM` (unidade de quem abriu: "Servidor", "Unidade Demandante", "Unidade Solicitante") e `@CHEFIA`
   (unidade superior à de origem: "Chefia Imediata"). Se a sigla não existir no cadastro, a etapa avança assim mesmo,
   com `unidade_atual_id` nulo e a sigla visível; a caixa "na minha unidade" depende do cadastro de unidades e de
   lotações (ver Dependências).
4. **Prazo em dias úteis**, contando a partir da entrada na etapa, pulando sábado, domingo e `feriados`. Etapa sem
   prazo no modelo não tem semáforo.
5. **Checklist por etapa.** Cada item pertence a uma etapa e bloqueia a saída dela se for obrigatório. Os textos
   vêm das páginas atuais; a etapa de cada item está na tabela de carga abaixo (marcada como proposta onde o código
   não dizia).
6. **Despacho e documentos ficam no SEI.** Some o botão "Despachar" e as abas Despachos/Documentos passam a só
   leitura (mostram o que já existe). As tabelas não são apagadas.
7. **Encerrar é ato do sistema, não do despacho.** "Concluir" e "Arquivar" viram RPCs com permissão própria; o
   trigger que exige despacho conclusivo para arquivar sai (era a regra do SEI interno).
8. **Veículos fica fora**: é cadastro e controle de frota, não processo com etapas. A página só perde os dados
   fictícios e passa a mostrar "sem dados" até ganhar módulo próprio. Distribuição e Inventário de patrimônio também
   ficam fora (não têm fluxo nem checklist próprio no código).
9. **Mudar a RLS existente do workflow** (invariante 2 do `AGENTS.md`) está coberto por esta spec; a aprovação dela
   é a confirmação do dono.

## Desenho

### Banco

| Peça | O quê |
|---|---|
| `processo_modelos` | `codigo` (único: `compras`, `diarias`, `convenios`, `almoxarifado`, `pagamentos`, `patrimonio_tombamento`, `patrimonio_baixa`), `nome`, `tipo_processo` (enum existente), `base_legal`, `ativo`. RLS: leitura para quem tem `workflow`; escrita só `workflow.admin` |
| `processo_modelo_etapas` | `modelo_id`, `ordem` (1..n, único por modelo), `nome`, `unidade_sigla`, `responsavel_rotulo` (texto da página: "Fiscal de Contrato", "Servidor"…), `prazo_dias_uteis` (nulo = sem prazo). Mesma RLS |
| `processo_modelo_checklist` | `modelo_id`, `etapa_ordem`, `codigo` (único por modelo), `descricao`, `obrigatorio`. Mesma RLS |
| `processos_administrativos` + colunas | `numero_sei`, `modelo_id`, `etapa_atual_ordem`, `unidade_atual_id`, `etapa_iniciada_em`, `etapa_prazo_limite`. Índice único parcial em `numero_sei`. `unidade_origem_id` passa a ser gravada na abertura (lotação ativa de quem abre) |
| `processo_checklist_respostas` | `processo_id`, `item_id`, `marcado`, `marcado_por`, `marcado_em`, `observacao`; único (processo, item). Escrita só por RPC |
| `movimentacoes_processo` + colunas | `etapa_origem_ordem`, `etapa_destino_ordem`. Cada avanço/devolução grava uma linha `encaminhamento`/`devolucao` com unidades de origem e destino, situação `recebido` |
| `fn_somar_dias_uteis(data, n)` | STABLE, pula fim de semana e `feriados` |
| `wf_abrir_processo(modelo, assunto, interessado…, sigilo, numero_sei?)` | exige `workflow.criar`; grava processo na etapa 1, unidade de origem, prazo |
| `wf_marcar_item(processo, item, marcado, observacao?)` | exige `workflow.tramitar` e acesso ao processo; só itens da etapa atual ou anteriores |
| `wf_avancar_etapa(processo, observacao?)` | exige `workflow.tramitar`; recusa se faltar item obrigatório da etapa atual ou `numero_sei` ao sair da etapa 1; grava movimentação, nova etapa, unidade, prazo; na última etapa recusa e orienta a concluir |
| `wf_devolver_etapa(processo, para_ordem, motivo)` | exige `workflow.tramitar`; volta para etapa anterior com motivo obrigatório (ex.: Controle Interno devolve) |
| `wf_suspender` / `wf_reativar(processo, motivo)` | exige `workflow.concluir`; suspensão para o relógio do prazo |
| `wf_concluir` / `wf_arquivar(processo, motivo?)` | exigem `workflow.concluir` / `workflow.arquivar`; concluir só na última etapa com checklist completo |
| `v_processos_acompanhamento` | security_invoker: processo + modelo + etapa atual + unidade + prazo + `situacao_prazo` (`em_dia`, `vence_logo`, `vencido`, `sem_prazo`) + pendências do checklist |

Todas as RPCs: `SECURITY DEFINER`, `search_path` fixo, `EXECUTE` só para `authenticated`, checagem de permissão
com `has_permission_code(auth.uid(), …)` e de acesso ao processo pela função de sigilo abaixo.

### Sigilo e RLS

- `wf_pode_ver_processo(processo_id)` (DEFINER): público → `workflow.visualizar`; restrito/sigiloso → criador,
  credencial em `acesso_processo_sigiloso` ou `workflow.admin`.
- Políticas de `processos_administrativos`, `movimentacoes_processo`, `despachos`, `documentos_processo`,
  `prazos_processo` e `processo_checklist_respostas`: SELECT por `wf_pode_ver_processo`; INSERT/UPDATE só pelas RPCs
  (sem política de escrita direta para `authenticated`); DELETE só `workflow.admin`.
- Remove as políticas antigas da FASE 6 e as `proc_*`; atualiza `supabase/baseline/rls/mapa.csv` e regenera
  `35_policies_geradas.sql`.
- Tela mínima para conceder/retirar credencial de sigilo na ficha do processo (`workflow.admin`).

### Limpeza

Remove o trigger de auditoria duplicado, o `updated_at` duplicado, `tr_verificar_arquivamento` e
`tr_validar_arquivamento`, e `fn_proximo_numero_processo` (4 dígitos, sem uso). O número interno passa a ser
gerado com trava (`pg_advisory_xact_lock` por ano) para não colidir em aberturas simultâneas.

### Telas

| Tela | Mudança |
|---|---|
| `/processos/compras`, `diarias`, `convenios`, `almoxarifado`, `pagamentos`, `patrimonio` | Guia lido do modelo no banco (etapas e checklist), "Iniciar processo" abre o diálogo de abertura já com o modelo, e uma aba "Processos" com os processos reais daquele tipo. Saem constantes duplicadas e dados fictícios. Botões "Baixar modelos"/"Gerar" sem ação saem |
| `/processos/veiculos` | Remove dados fictícios; estado vazio "Controle de frota ainda não implantado" |
| `/workflow` | Painel por `v_processos_acompanhamento`: na minha unidade, vencidos, por tipo, por etapa; links que funcionam |
| `/workflow/processos` | Abas "Na minha unidade" e "Todos"; colunas Nº SEI, tipo, etapa, unidade, prazo (semáforo); filtros por tipo, etapa, unidade, situação de prazo; lê `?meus=` e `?acao=novo` |
| `/workflow/processos/:id` | Trilha das etapas (feito, atual, a fazer) com unidade e prazo; checklist da etapa atual com marcação; botões Avançar, Devolver, Suspender/Reativar, Concluir, Arquivar conforme permissão; campo Nº SEI editável até sair da etapa 1; linha do tempo das passagens; aba Credenciais de sigilo (admin) |

Permissões na rota e no botão: `workflow.visualizar`, `.criar`, `.tramitar`, `.concluir`, `.arquivar`, `.admin`
(já existem em `funcoes_sistema`). As rotas `/processos/*` mantêm `processos.<tipo>.visualizar`; abrir processo
nelas exige também `workflow.criar`.

### Carga inicial dos modelos (migração de dados)

Etapas e checklist vêm das páginas atuais. "(proposta)" = o código não dizia; confirmar com o órgão.
Prazos em dias úteis são proposta para todos, ajustáveis depois pela tabela.

| Modelo | Etapas (unidade) | Checklist → etapa |
|---|---|---|
| Compras e Contratos | 1 Termo de Demanda (@ORIGEM) · 2 Análise Orçamentária (DIRAF) · 3 Parecer Controle Interno (CI) · 4 Autorização (PRES) · 5 Processo Licitatório (CPL) · 6 Contratação (DIRAF) · 7 Fiscalização (@ORIGEM, "Fiscal de Contrato") · 8 Pagamento (DIRAF) | demanda, justificativa, tr, pesquisa → 1; orcamento → 2; ci, parecer (opcional) → 3; autorizacao → 4 |
| Diárias e Viagens | 1 Solicitação (@ORIGEM) · 2 Aprovação Chefia (@CHEFIA) · 3 Ordem de Missão (DIRAF) · 4 Autorização (PRES) · 5 Empenho/Pagamento (DIRAF) · 6 Viagem (@ORIGEM) · 7 Relatório (@ORIGEM, 5 dias úteis) · 8 Prestação de Contas (DIRAF) | solicitacao, justificativa, programacao → 1; aprovacao → 2; ordem → 3; autorizacao → 4 |
| Convênios e Parcerias | 1 Proposta/Plano de Trabalho (@ORIGEM) · 2 Análise Jurídica (ASJUR) · 3 Aprovação Técnica (@ORIGEM) · 4 Celebração (PRES) · 5 Execução (@ORIGEM) · 6 Prestação de Contas (DIRAF) | (proposta) plano de trabalho → 1; parecer jurídico → 2; publicação no DOE → 4 |
| Almoxarifado | 1 Requisição (@ORIGEM) · 2 Aprovação Chefia (@CHEFIA) · 3 Verificação Estoque · 4 Separação · 5 Entrega · 6 Baixa no Sistema (NuAlm, proposta de sigla) | requisicao, justificativa → 1; aprovacao → 2; verificacao → 3 |
| Pagamentos | 1 Recebimento da Demanda (DIRAF) · 2 Conferência Documental (DIRAF) · 3 Empenho (DIRAF) · 4 Liquidação (DIRAF) · 5 Ordenação (PRES) · 6 Pagamento (DIRAF) | (proposta) nota fiscal e atesto → 2; nota de empenho → 3 |
| Patrimônio — Tombamento | (proposta) 1 Recebimento (@ORIGEM) · 2 Tombamento (NuPat) · 3 Termo de Responsabilidade (@ORIGEM) | nota, termo → 1; plaqueta, foto (opcional) → 2; responsavel → 3 |
| Patrimônio — Baixa | (proposta) 1 Laudo (NuPat) · 2 Parecer Controle Interno (CI) · 3 Autorização (PRES) · 4 Destinação (NuPat) | laudo → 1; parecer → 2; autorizacao → 3; destino → 4 |

As siglas finais seguem a Lei 2.301/2025 (ver `01_ESTRUTURA_INSTITUCIONAL.md`); onde a página usa sigla diferente
da Lei, vale a da Lei e a divergência fica registrada na migração.

## Erros e casos de borda

- Avançar sem item obrigatório: RPC recusa com a lista dos itens faltantes; a tela mostra a mesma lista.
- Dois usuários avançam ao mesmo tempo: a RPC trava a linha do processo (`FOR UPDATE`) e confere a etapa esperada
  (parâmetro `etapa_atual_esperada`); o segundo recebe "o processo mudou, recarregue".
- Número SEI repetido: recusa com o número interno do processo que já usa aquele SEI (se o usuário puder vê-lo).
- Processo suspenso, concluído ou arquivado: nenhuma RPC de etapa ou checklist aceita.
- Modelo alterado depois de abertos processos: processos guardam a ordem da etapa; mudança de etapas vale para os
  novos. Remover etapa de modelo com processo nela é recusado.
- Processos antigos sem modelo (criados no workflow atual): continuam visíveis, sem trilha nem checklist;
  podem ser concluídos/arquivados pelas RPCs.

## Testes

- `scripts/db/testar-rls.sql`: casos novos para sigilo (sem credencial não lê; credencial lê; admin lê), DELETE só
  admin, escrita direta negada, cada RPC sem permissão negada.
- Testes SQL das RPCs no mesmo roteiro: avançar com/sem checklist, sem SEI na etapa 1, corrida de avanço,
  devolução, suspensão parando prazo, concluir fora da última etapa, `fn_somar_dias_uteis` com feriado.
- Vitest para a função pura de semáforo de prazo no front.
- Gate completo (`bash scripts/gate.sh`) e `validar-baseline.sh`.

## Dependências

- **Unidades e lotações cadastradas.** A caixa "na minha unidade" e a resolução de sigla dependem de
  `estrutura_organizacional` e `lotacoes`. O levantamento indica que nenhuma migração cadastra as unidades da Lei.
  Sem elas, tudo funciona, mas a unidade aparece só como sigla e a caixa fica vazia. Cadastrar a estrutura da Lei é
  a próxima frente sugerida (fora desta entrega).
- Regenerar `src/integrations/supabase/types.ts` depois do merge (até lá, `supabase as any` nas tabelas novas,
  como nas entregas anteriores).

## Fora desta entrega

- Integração com o SEI (API ou leitura automática do andamento).
- Despacho, documento, assinatura e anexos no sistema.
- Notificação por e-mail/WhatsApp de prazo vencido (depende de `/admin/envios`).
- Ligar processos ao módulo de Compras/Contratos e ao Financeiro (ex.: empenho do processo de Pagamentos).
- Controle de frota (Veículos), Distribuição e Inventário de patrimônio como processos.
- Editor de modelos na tela (a carga é por migração; ajuste por SQL/RPC admin).
- Cadastro das unidades da Lei 2.301/2025.

## Decisões durante a implementação

- **PRES no lugar de PRESI.** A Presidência usa a sigla `PRES` no cadastro de unidades do banco; `PRESI` só aparece na
  numeração das portarias (D13). Seed e Premissa 3 usam `PRES`.
- **`suspenso_desde`.** Coluna nova (data) em `processos_administrativos`. A suspensão guarda a data; a reativação
  recalcula `etapa_prazo_limite` somando, a partir de hoje, os dias úteis que faltavam. Prazo já vencido ao suspender
  continua vencido pelos mesmos dias corridos.
- **Arquivar aceita processo concluído** (além de aberto, em tramitação e suspenso); só o já arquivado é recusado.
- **Conceder e revogar credencial** funcionam em processo de qualquer situação, e a concessão só vale para usuário
  ativo.
- **`wf_listar_credenciais`** (RPC, `workflow.admin`) lê as credenciais para a aba Credenciais, em vez de mudar a RLS
  existente de `acesso_processo_sigiloso` (que só deixa o papel admin ler).
- **Limite de 1000 linhas.** Lista, guia por tipo e agrupamentos do painel leem até 1000 linhas (padrão do PostgREST)
  e mostram aviso quando o limite é atingido; os contadores do painel usam `count` exato.
- **"Na minha unidade" usa `lotacoes.ativo`**, a lotação ativa mais recente do servidor ligado ao perfil. Não cobre
  cessão (`lotacao_vigente` não é executável por `authenticated`).

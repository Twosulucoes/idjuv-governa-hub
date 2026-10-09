# Fluxo de frequência: abono → chefia → RH → fechamento

Data: 2026-10-09 · Módulo: `rh` · Classificação: architectural (rotas e páginas novas) · Onda C, item 12 de
[`FINALIZACAO.md`](../../planejamento/FINALIZACAO.md).

## Premissas (sessão autônoma)

1. **Sem migração nesta entrega.** Tabelas, CHECKs e hooks do fluxo já existem; o que falta é tela, rota e menu.
2. **Validação da chefia funciona só para quem tem o módulo RH** até a decisão do usuário (card no thread):
   a RLS de `solicitacoes_abono` e `frequencia_fechamento` só permite UPDATE a `can_access_module('rh')`.
   A recomendação é a Onda B criar `is_chefia_de(servidor_id)` + policies restritas.
3. **Assinatura do servidor na própria frequência fica de fora**: a RLS de `frequencia_fechamento` não deixa o
   servidor inserir/atualizar; entra com a mesma migração da chefia.
4. Permissões finas (`rh.frequencia.validar/consolidar`) não existem no catálogo; a página de validação usa
   `rh.frequencia.lancar` por ora. Catálogo é seed no banco (fora da Onda C).
5. Fechamento da competência é feito no front em lote (N upserts); atomicidade só com RPC (Onda B/D).
6. **Separação por papel só no front** (revisão de segurança): rota aberta a `rh.aprovar` ou
   `rh.frequencia.lancar`; etapa da chefia com `rh.aprovar`, etapas do RH com `rh.frequencia.lancar`,
   fechar competência com `rh.frequencia.configurar`; ninguém age sobre a própria solicitação/fechamento.
   O banco não checa nada disso para quem tem o módulo `rh` — fica para a migração de RLS da Onda B:
   `is_chefia_de(servidor_id)`, `servidor_id <> meu_servidor_id()` nas policies de UPDATE de
   `solicitacoes_abono`/`frequencia_fechamento`, permissão `configurar` em `config_fechamento_frequencia`,
   e trigger em `registros_ponto` recusando lançamento em competência consolidada (hoje o guard-rail é só cliente).
7. **Autoatendimento depende da leitura de `servidores`**: a policy de SELECT só libera o módulo `rh`, então
   `useMeuServidor` devolve `null` para quem não tem o módulo e a página mostra "não vinculado". A policy de
   linha própria em `servidores` (e o alinhamento `profiles.servidor_id` ↔ `servidores.user_id`) entra na
   mesma migração.
8. **Reabrir recomeça o ciclo**: `useReabrirFrequencia` zera `validado_chefia` e `consolidado_rh` (a chefia
   revalida, o RH reconsolida e aí `reaberto` volta a `false`). `prazo_reabertura_dias` da config é
   respeitado no front (`podeReabrir`); `reabertura_exige_justificativa` é tratado como sempre obrigatório.

## O que já existe (evidência)

- Tabela `solicitacoes_abono` — status `pendente|aprovado_chefia|aprovado_rh|aprovado|rejeitado|cancelado`
  (`supabase/baseline/schema/01_pre_data.sql:13513`); RLS: SELECT/INSERT RH ou próprio, UPDATE só RH
  (`supabase/baseline/rls/35_policies_geradas.sql:3308`).
- Tabela `frequencia_fechamento` — flags `assinado_servidor`/`validado_chefia`/`consolidado_rh`, `reaberto*`,
  UNIQUE (servidor_id, ano, mes); RLS: servidor só lê, INSERT/UPDATE só RH (`35_policies_geradas.sql:2094`).
- `config_fechamento_frequencia.status` — `aberto|fechado_servidor|fechado_chefia|consolidado` (`01_pre_data.sql:8054`),
  editado em `src/components/frequencia/config/FechamentoTab.tsx`.
- Hooks sem tela em `src/hooks/useParametrizacoesFrequencia.ts`: `useSolicitacoesAbono` (:522),
  `useSalvarSolicitacaoAbono` (:546), `useAprovarSolicitacaoAbono({ nivel: 'chefia' | 'rh' })` (:583),
  `useRejeitarSolicitacaoAbono` (:624), `useFechamentoServidor` (:657), `useValidarFrequenciaChefia` (:719),
  `useConsolidarFrequenciaRH` (:764), `useTiposAbono` (:247), `useConfigFechamento` (:388).
- `useMeuServidor()` em `src/hooks/useMeusDados.ts` (vínculo usuário → servidor).
- Chefia: `estrutura_organizacional.servidor_responsavel_id` (`src/hooks/useOrganograma.ts:42`).

## Desenho

### Rotas, menu e permissões

| Rota | Página | Guard | Menu |
|---|---|---|---|
| `/rh/minha-frequencia` | `MinhaFrequenciaPage` | `<ProtectedRoute>` (autoatendimento, como `/rh/meus-dados`) | junto a "Meus Dados" (`rh.self`) |
| `/rh/frequencia/validacao` | `ValidacaoFrequenciaPage` | `requiredPermissions={["rh.aprovar", "rh.frequencia.lancar"]}` (qualquer uma) | submenu Frequência, "Validação e Fechamento" (`permissions` com as mesmas duas) |

`ROUTE_PERMISSIONS` (`src/types/auth.ts`) ganha `/rh/frequencia/validacao`.

### Dados (estender `useParametrizacoesFrequencia.ts`, sem duplicar)

- `useSolicitacoesAbono({ servidorId?, status?, unidadeId? })` — filtros opcionais (hoje lista tudo).
- `useFechamentosCompetencia(ano, mes)` — `frequencia_fechamento` + servidor (nome, matrícula, unidade).
- `useConsolidarFrequenciaLote(ids, ano, mes)` — upsert em lote (`consolidado_rh = true`).
- `useReabrirFrequencia({ servidorId, ano, mes, justificativa })` — `reaberto = true`, `reaberto_motivo`.
- `useMinhaEquipe()` — servidores das unidades em que `servidor_responsavel_id = auth.uid()`.

### Telas

**MinhaFrequenciaPage** (servidor): competência atual, resumo mensal (`useFrequenciaResumo`), lista das
próprias solicitações de abono com status e motivo de rejeição, botão "Solicitar abono" →
`SolicitarAbonoDialog` (tipo de abono, data(s), justificativa, anexo opcional se o hook já suportar).
Alerta quando o usuário não tem servidor vinculado (padrão de `MeusDadosPage`).

**ValidacaoFrequenciaPage** (chefia/RH): seletor de competência; abas:
1. *Abonos pendentes* — `FilaAbonosTable`: filtro por unidade/status; ações "Aprovar (chefia)",
   "Aprovar (RH)", "Rejeitar" (motivo obrigatório); encadeamento no front: RH só aprova após
   `aprovado_chefia` (ou direto, se a opção "só o RH valida" for escolhida).
2. *Fechamento da competência* — `GradeFechamentoTable`: servidor × assinado / validado / consolidado /
   reaberto; ações por linha (validar chefia, consolidar RH, reabrir com justificativa) e em lote
   (consolidar selecionados); `FecharCompetenciaDialog` muda `config_fechamento_frequencia.status`
   para `consolidado` depois de consolidar todos; bloqueia se houver abono pendente.

**Guard-rail**: `LancarFaltaDialog`/`useLancarFaltaEmLote` desabilitados quando a competência está
`consolidado` ou o fechamento do servidor tem `consolidado_rh` sem `reaberto`.

### Fora de escopo

Ajuste de ponto, justificativas de ponto, banco de horas (tabelas sem UI — item próprio); assinatura
digital; unificação `useConfigFrequencia` × `useParametrizacoesFrequencia`; RPC de fechamento; policies
da chefia (Onda B).

### Verificação

`bash scripts/gate.sh` verde; tsc no baseline; lint sem piora; regras de encadeamento exercitadas por
script quando puras. Docs: `docs/MODULOS.md` (RH → frequência) e `docs/RBAC_PERMISSOES.md` (rota nova).

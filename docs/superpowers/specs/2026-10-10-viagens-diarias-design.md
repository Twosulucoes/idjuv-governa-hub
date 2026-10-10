# Viagens e diárias: editar/excluir e diária calculada por tabela (Onda C, item 14)

Data: 2026-10-10 · Módulo: `rh` · Classificação: **architectural** (hook, regras puras e diálogo
novos; extensão do contrato do tenant; gates de permissão na tela) · Sem migração nesta entrega.

Pedido (docs/planejamento/FINALIZACAO.md, item 14): `/prompt ajuste --modulo rh Viagens: editar/excluir e
diária calculada por tabela`.

## Premissas (sessão autônoma)

1. **Sem migração.** `viagens_diarias` já tem tudo que a tela precisa (`01_pre_data.sql:14460-14494`):
   status com CHECK (`solicitada|autorizada|em_andamento|concluida|cancelada`), `tipo_onus`, `quantidade_diarias`,
   `valor_diaria`, `valor_total`, workflow DIRAF, `observacoes`. RLS vigente (`rls/35_policies_geradas.sql:3539-3552`)
   libera SELECT/INSERT/UPDATE/DELETE a quem tem o módulo `rh` **ou** `financeiro` — UPDATE e DELETE já são
   possíveis no banco; o que falta é tela, hook e regra.
2. **Tabela de valores de diária no perfil do tenant (Opção A)**, não no banco: não existe `tabela_diarias`
   no baseline e a base legal (IN de diárias, valores por cargo e destino) não está no repositório. O contrato
   do tenant ganha `rh?: { diarias?: TabelaDiariasConfig }` (`src/core/tenant/types.ts`), lido por
   `useTenant()`/`getTenantSnapshot()`. `_template` e `idjuv` nascem com a tabela **vazia**: enquanto o
   usuário não passar os valores, o formulário mantém quantidade/valor manuais (comportamento de hoje) e
   mostra "sem valor na tabela para este cargo/destino". Tabela no banco com tela de manutenção fica como
   item próprio (fora do escopo; ver §Fora de escopo). A decisão A × B foi posta ao usuário em card; o
   trabalho segue na A, que não fecha a porta para B (a regra recebe a tabela como parâmetro).
3. **Estrutura da tabela**: linhas `{ categorias: CategoriaCargo[]; nivelMinimo?; nivelMaximo?; valores:
   Record<FaixaDestino, number> }`, com `FaixaDestino = 'intermunicipal' | 'interestadual' | 'internacional'`.
   A faixa vem de `classificarDestino(uf, pais, ufSede)`: `pais` ≠ Brasil → internacional; `uf` ≠ UF da sede
   do tenant (`endereco.uf`) → interestadual; senão intermunicipal. O cargo vem de
   `servidores.cargo_atual_id → cargos(categoria, nivel_hierarquico)`. Primeira linha que casa vale.
4. **Contagem de diárias** (`calcularQuantidadeDiarias`): regra padrão da administração pública
   (Decreto federal 5.992/2006, replicado nos estados): uma diária por pernoite fora da sede e **meia diária
   no dia do retorno**; deslocamento sem pernoite = meia diária. `sem_onus` → 0. A tabela do tenant pode
   desligar a meia diária do retorno (`regras.meiaDiariaNoRetorno = false`). O usuário pode **ajustar
   manualmente** quantidade e valor (checkbox "ajuste manual"), com justificativa obrigatória gravada em
   `justificativa`.
5. **Máquina de status** (`statusPermitidos`): `solicitada → autorizada → em_andamento → concluida`;
   `cancelada` só a partir de `solicitada`/`autorizada`; `concluida` e `cancelada` são finais. Hoje o `Select`
   da linha aceita qualquer transição — passa a desabilitar as inválidas (como férias).
6. **Campos editáveis por status** (`camposEditaveisPorStatus`): `solicitada` → todos; `autorizada` → todos
   menos servidor; `em_andamento` → portaria, meio de transporte, relatório e observações; `concluida`/
   `cancelada` → nenhum. Com `workflow_diraf_status = 'concluido'` (processo SEI aberto) quantidade/valor
   ficam bloqueados em qualquer status.
7. **"Excluir" = cancelar.** Registro de diária é contábil (a migração 20260131041251 negava DELETE por isso).
   Cancelar exige motivo, gravado em `observacoes` com prefixo "Cancelada em dd/mm/aaaa: ..." (não há coluna
   própria). **Exclusão física** só para super admin, com status `solicitada`, sem `numero_sei_diarias` e sem
   `portaria_numero` (espelha `podeExcluir` de férias), com `AlertDialog`.
8. **Permissões no front**: `podeCriar = rh.viagens.criar | rh.viagens.gerenciar`, `podeEditar` (inclui
   mudar status e cancelar) `= rh.viagens.editar | rh.viagens.gerenciar`, workflow DIRAF `= rh.viagens.gerenciar
   | financeiro.diarias.gerenciar`; super admin passa por tudo (`hasAnyPermission` já trata). As quatro
   existem no catálogo (`02_dados_catalogo.sql:285-287,428`; `admin` e `manager` as têm, `user` só
   `visualizar`). `src/types/auth.ts:272-273` ganha `rh.viagens.criar/editar`; o item de menu passa de
   `rh.visualizar` para `rh.viagens.visualizar`. **Barreira só no front**: a RLS continua por módulo.
9. Rota `/rh/viagens` mantém `requiredPermissions="rh.viagens.visualizar"` (`App.tsx:822-824`); o
   `ProtectedRoute requiredModule="rh"` duplicado dentro da página sai (a rota já protege).
10. KPI do dashboard (`useRHDashboardStats.ts:24-26`) e aba "Histórico de Viagens" de `ServidorDetalhePage`
    (`:619-659`) continuam lendo os mesmos cinco status — nada muda para eles. `ServidorDetalhePage` está na
    frente do design system (outra thread): **não tocar**.

## O que existe (evidência)

- `src/pages/rh/GestaoViagensPage.tsx` (786 linhas): queries e mutations na própria página (sem hook), tipo
  local `Viagem` divergente de `ViagemDiaria` (`src/types/rh.ts:453-489`), formulário "Nova Viagem" em
  `useState` sem zod, valor = `quantidade × valor_diaria` digitados à mão (`:164`, `:648-665`), `Select` de
  status sem regra (`:481-495`), workflow DIRAF (`:226-259`, `:693-780`). Sem editar, excluir, cancelar ou
  `hasPermission`.
- Nenhum `useViagens*`, nenhum cálculo de diária em `src/lib/`, nenhuma tabela de valores no banco.
- Padrão a copiar (PR #51, férias): `src/lib/feriasRegras.ts` (`camposEditaveisPorStatus`, `podeExcluir`,
  `statusPermitidos`), `src/hooks/useFerias.ts` (`SELECT_COM_SERVIDOR`, `SemPermissaoError`,
  `exigirLinhaAfetada`, mutations), `src/components/rh/ferias/FeriasFormDialog.tsx`, `GestaoFeriasPage.tsx`
  (gates `hasAnyPermission`, `Select` com itens `disabled`, `AlertDialog`).

## Desenho

| Arquivo | Mudança |
|---|---|
| `src/core/tenant/types.ts` | `TenantRH { diarias?: TabelaDiariasConfig }`, `TabelaDiariasConfig { vigencia?: string; regras?: { meiaDiariaNoRetorno?: boolean }; linhas: LinhaTabelaDiarias[] }`, `LinhaTabelaDiarias`, `FaixaDestino`; `TenantConfig.rh?` |
| `tenants/_template/tenant.config.ts`, `tenants/idjuv/tenant.config.ts` | `rh: { diarias: { linhas: [] } }` com comentário de onde preencher (IN de diárias) |
| `src/types/rh.ts` | completar `ViagemDiaria` (`tipo_onus`, `numero_sei_diarias`, `workflow_diraf_*`, `justificativa`, `destino_pais`, `portaria_data`, `meio_transporte`, `observacoes`), `TipoOnus`, `WorkflowDirafStatus`, `ViagemDiariaInput`, `ViagemDiariaComServidor` |
| `src/lib/diariasRegras.ts` (novo) | regras puras: `classificarDestino`, `calcularQuantidadeDiarias`, `valorDiariaPorTabela`, `calcularTotalDiarias`, `statusPermitidos`, `camposEditaveisPorStatus`, `podeCancelar`, `podeExcluir`, `valoresBloqueados`, `validarPeriodo`, `textoCancelamento` |
| `src/hooks/useViagens.ts` (novo) | `useViagens(filtros)`, `useServidoresParaViagem` (com `cargo:cargos(categoria, nivel_hierarquico)`), `useCriarViagem`, `useAtualizarViagem`, `useAtualizarStatusViagem`, `useCancelarViagem`, `useExcluirViagem`, `useAtualizarWorkflowDiraf`; `exigirLinhaAfetada`/`SemPermissaoError` extraídos de `useFerias.ts` para `src/lib/supabaseErros.ts` e reutilizados pelos dois hooks |
| `src/components/rh/viagens/ViagemFormDialog.tsx` (novo) | zod + RHF; criar/editar; quantidade e valor sugeridos pela tabela e recalculados ao mudar datas/destino/servidor; checkbox "ajuste manual" + justificativa; campos bloqueados por status |
| `src/components/rh/viagens/CancelarViagemDialog.tsx` (novo) | motivo obrigatório |
| `src/pages/rh/GestaoViagensPage.tsx` | usar hook e diálogos; coluna de ações (editar / cancelar / excluir); `Select` de status limitado; gates de permissão; remover tipo local, `any` e `ProtectedRoute` interno; manter o diálogo DIRAF |
| `src/types/auth.ts`, `src/config/menu.config.ts` | `rh.viagens.criar/editar` na lista; menu com `rh.viagens.visualizar` (adicionar à união `PermissaoInstitucional`) |
| Docs | `docs/MODULOS.md` (Viagens), `docs/RBAC_PERMISSOES.md` (seção "Viagens: edição e cancelamento", só front), `docs/WHITE_LABEL.md` (tabela de diárias no perfil), `docs/planejamento/FINALIZACAO.md` (item 14), `docs/planejamento/ROADMAP.md` |

## Fora de escopo (registrar; exigem migração ou decisão do usuário)

- Tabela de diárias no banco (`tabela_diarias` com RLS, catálogo, `rls/mapa.csv`) e tela de manutenção
  pelo RH (Opção B) — depende da decisão no card e dos valores da IN.
- Policies de `viagens_diarias` por permissão granular e DELETE restrito (hoje por módulo `rh|financeiro`;
  `mapa.csv:242` já pede revisão); CHECKs em `tipo_onus`, `workflow_diraf_status`, `data_retorno >= data_saida`;
  coluna `motivo_cancelamento`/`cancelada_em`.
- Unificar `src/modules/rh/pages/formularios/OrdemMissaoPage.tsx` com `src/pages/formularios/` e tirar o
  literal "IN de Diárias do IDJUV" de `pdfGenerator.ts:331` (hardcode já inventariado).
- Relatório de viagens (item 15).

## Verificação

`bash scripts/gate.sh` verde; script de asserções das regras puras (contagem com e sem pernoite, faixas de
destino, tabela com e sem linha casando, máquina de status, campos por status, exclusão restrita);
revisão `revisor-codigo-idjuv` + `revisor-seguranca-idjuv`.

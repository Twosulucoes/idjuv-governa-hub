# Localizador de processos do SEI (E1)

- **Data:** 2026-10-25
- **Classificação:** architectural (tela nova, RPC nova, rota transversal)
- **Pedido:** thread "Plano de arquitetura para SEI, Compras e RH". O plano
  (`/mnt/project-files/arquitetura/plano-sei-compras-rh.html`) foi revisado com o dono: o SEI é o único lugar de
  tramitar; o problema é **achar** o processo. A integração com o SEI não é viável (a SEGOD administra; os serviços
  web exigiriam cadastro do sistema). O dono escolheu a E1 em 25/10.
- **Fora desta entrega:** a trilha encadeada por hash dos marcos (vira E1b), as permissões por marco (E2), a
  integração automática com o SEI.

## 1. O problema

O mesmo número SEI aparece em muitos lugares do sistema, cada um numa tela de um módulo, e cada tela escreve o
número de um jeito. Para saber "o que o sistema sabe deste processo" a pessoa precisa adivinhar o módulo.

| Onde o nº SEI já está | Coluna | Módulo | Tela do registro |
|---|---|---|---|
| Processo acompanhado (Workflow) | `processos_administrativos.numero_sei` | workflow | `/workflow/processos/:id` |
| Processo de contratação | `processos_licitatorios.numero_processo` | compras | `/compras/processos/:id` |
| Pedido de passagem | `passagem_pedidos.numero_sei` | contratos | `/contratos/passagens/:id` |
| Demanda do PCA (DFD) | `pca_itens.numero_sei` | compras | `/compras/pca/:planoId` |
| Empenho do FIP 614 | `fin_empenhos.processo_sei` | financeiro | lista de empenhos |
| Ato/portaria | `documentos.processo_sei` | gabinete/rh | gestão de documentos |
| Termo de cessão | `termos_cessao.processo_sei` | rh | termos de cessão |
| Diária | `viagens_diarias.numero_sei_diarias` | rh | viagens e diárias |

Formatos vistos: `17302.000885/2026.92` (SEI completo), `17302.000885/2026-92`, `000885/26-92` (abreviado do
FIPLAN) e números digitados com espaço.

## 2. O que a pessoa vê

Tela **Localizar processo** (rota proposta `/processos/localizar`; o lugar no menu é combinado com a thread
"Simplificar menus de Compras, Contratos e Processos").

1. **Uma caixa de busca**, com foco ao abrir. Aceita o número em qualquer formato acima, ou palavras do objeto,
   do assunto, do interessado ou do setor, sem se importar com acento e maiúscula.
2. **Resultado agrupado pelo processo SEI**: um cartão por número, com o objeto, onde está (setor/etapa), a última
   movimentação, o botão **Copiar número** (para colar na pesquisa do SEI) e a lista do que o sistema tem dele:
   "Processo de contratação · Seleção 50%", "2 empenhos · R$ 120.000,00", "Pedido de passagem · emitido"… Cada linha
   leva à tela do registro.
3. **Aba Parados**: processos sem movimentação há mais de 15 dias (`DIAS_PARA_PARADO`, o mesmo da barra de
   evolução), do mais parado para o menos: contratação (`atualizado_em`) e processo acompanhado do Workflow
   (`etapa_iniciada_em`, só em andamento). Filtro por setor.
4. Sem resultado: diz que nada foi achado **entre os módulos que a pessoa acessa** (não afirma que o processo não
   existe).

Ninguém registra nada nesta tela: ela só lê.

## 3. Banco (uma migração, só funções)

Nenhuma tabela, coluna, policy ou permissão nova. Nenhuma RLS existente muda.

- `sei_normalizar(text) → text` (IMMUTABLE, SQL): tira espaço, pontuação e zeros desnecessários e devolve a chave
  `NNNNNN/AA-DV` (sequencial, ano com 2 dígitos, dígito verificador) quando o texto parece um número SEI completo
  ou abreviado; senão `NULL`. Exemplos: `17302.000885/2026.92` → `000885/26-92`; `000885/26-92` → `000885/26-92`.
- `texto_busca(text) → text` (IMMUTABLE, SQL): minúsculas e sem acento por `translate()` (sem depender da extensão
  `unaccent`, que o baseline não instala).
- `localizar_processos_sei(p_termo text, p_limite int default 50)` → linhas `(chave, numero_sei, origem,
  registro_id, titulo, situacao, onde, atualizado_em, valor)`.
  - **SECURITY INVOKER**: cada fonte é lida com a RLS dela, então a pessoa só acha o que já poderia ver no módulo.
    Processo sigiloso do Workflow continua escondido por `wf_pode_ver_processo`. Não há como descobrir pela busca
    que um registro existe.
  - `search_path` fixo; `EXECUTE` só para `authenticated`.
  - Termo com número SEI → compara a chave normalizada; senão → `texto_busca(coluna) LIKE '%' || termo || '%'` nas
    colunas de texto, com o termo escapado (`%`, `_`, `\`). Termo com menos de 3 caracteres → recusa (22023).
  - Volume: as fontes somam poucos milhares de linhas; varredura sem índice novo. Se crescer, índice de expressão
    sobre `sei_normalizar(...)` numa migração própria.
- `processos_parados(p_dias int default 15)`: mesma regra (INVOKER), só contratação e Workflow em andamento.

Teste: `scripts/db/` ganha os casos de normalização e um teste de RLS (usuário só de compras não acha empenho nem
processo sigiloso).

## 4. Front

- `src/lib/processos/numeroSei.ts`: a mesma normalização em TypeScript (para agrupar e destacar), com testes vitest
  espelhando os do SQL.
- `src/hooks/useLocalizadorSei.ts`: `useLocalizarProcessos(termo)` (debounce de 300 ms, `enabled` com 3+
  caracteres) e `useProcessosParados()`, sobre as RPCs.
- `src/pages/processos/LocalizarProcessoPage.tsx` + componentes em `src/components/processos/localizador/`
  (shadcn: `Input`, `Card`, `Tabs`, botão copiar com `navigator.clipboard` e aviso de sucesso).
- Rota em `src/App.tsx` com `ProtectedRoute` (transversal: `/processos` já está na lista de
  `modules.config.test.ts`). Item de menu conforme a thread dos menus.

## 5. Docs

`docs/BANCO_DE_DADOS.md` (funções), `docs/MODULOS.md` (tela), `docs/planejamento/ROADMAP.md`.

## 6. Decisões para o dono

1. As oito fontes da tabela da seção 1 entram todas, ou só Workflow, Compras e Passagens na primeira versão?
   (Proposta: todas; as outras cinco são uma linha de SQL cada.)
2. A busca aparece também como atalho no topo do sistema (Ctrl+K) ou só na tela? (Proposta: só na tela agora.)

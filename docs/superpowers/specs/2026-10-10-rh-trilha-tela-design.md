# Onda E2 do RH — trilha na tela e registro de PDFs, planilhas e arquivos

Segunda onda do plano de [REVISAO_RH.md](../../planejamento/REVISAO_RH.md) (seção 6), em cima da E1
([spec](./2026-10-10-rh-trilha-auditoria-design.md), PR #82). A E1 grava no banco quem fez cada lançamento;
a E2 deixa isso **consultável** e registra o que não é gravação: ver, imprimir, exportar e baixar.

## Premissas

1. A branch sai da E1 (PR #82) e a PR desta onda aponta para ela até a E1 entrar na `main`.
2. **Quem vê a trilha:** `/admin/auditoria` continua do admin; a visão do RH (`/rh/auditoria`, abas de
   histórico) pede `rh.auditoria.visualizar`, que só existe com a migração `20261011000100` da E1 (aguarda o
   sim do dono). Sem ela, só o admin enxerga as abas, e a RLS é quem decide o que aparece.
3. **Registro de ação no navegador é de melhor esforço:** quem gera um PDF no próprio navegador pode
   evitar a chamada. A tela registra antes de entregar o arquivo e não entrega se o registro falhar
   (exportações e arquivos de folha); para leitura (ver ficha), registra sem bloquear.
4. `ServidorDetalhePage` é tela da thread do design system: só entra a aba nova, sem mudar layout.
5. Login e falha de login ficam fora (mexem no `AuthContext`, que exige confirmação do dono).
6. Nada é aplicado em banco remoto; o CI aplica no merge.

## O que muda

1. **Banco** (migração `20261011000200_rh_trilha_consulta.sql`, idempotente nos dois estados):
   - índices em `audit_logs` para as consultas da tela: `(entity_type, entity_id, sequencia)`,
     `(servidor_id, sequencia)`, `(module_name, timestamp)`, `(user_id, timestamp)`, se ainda não existirem;
   - trilha dos arquivos do RH no Storage: gravação, troca e exclusão de objetos nos buckets `frequencias` e
     `documentos-requerimento` entram em `audit_logs` (módulo `rh`, sem conteúdo do arquivo), se a migração
     tiver privilégio sobre `storage.objects` nos dois estados; se não tiver, registrar pelo front e
     documentar a limitação.
2. **Hook de dados** `src/hooks/useTrilhaAuditoria.ts`: lista paginada no servidor (sem `before_data` e
   `after_data`), filtros por período, módulo, tabela, registro, usuário, servidor e ação; detalhe de uma linha
   com o diff (campo a campo, valores mascarados como vieram); `useRegistrarEvento()` que chama a RPC
   `registrar_evento` da E1.
3. **`/admin/auditoria` refeita:** paginação e filtros no servidor, ordem pela `sequencia`, diff ao abrir a
   linha, nome do servidor responsável e origem (`usuario`, `usuario_sem_vinculo`, `sistema`), exportação CSV
   registrada. Texto livre (descrição, metadados) nunca vira HTML.
4. **Visão do RH:** página `/rh/auditoria` (mesmo componente, travado no módulo `rh`), rota com
   `rh.auditoria.visualizar`, item no menu do RH e em `ROUTE_PERMISSIONS`.
5. **Abas "Histórico de alterações"** (componente único `HistoricoAlteracoesTab`): na ficha do servidor
   (`servidores` e tabelas ligadas ao servidor: vínculos, lotações, férias, licenças, viagens, frequência,
   documentos) e no detalhe da folha (folha, fichas, itens, remessas, eventos do eSocial).
6. **`registrar_evento` nas ações sem gravação:** PDFs do RH (portarias, frequência, relatórios, ficha
   cadastral, declarações), planilhas (`/rh/exportar`, cards de relatórios, `src/export/*` quando chamados do
   RH), XML do eSocial, arquivo CNAB, contracheque (troca o `log_audit` pela RPC nova) e o CSV da trilha.
7. **Docs:** `docs/GUIA_FRONTEND.md`, `docs/BANCO_DE_DADOS.md`, `docs/RBAC_PERMISSOES.md` (rota nova),
   `docs/planejamento/FINALIZACAO.md` e `ROADMAP.md`.

## Fora

- Login e falha de login na trilha.
- Particionar e reter `audit_logs`; encadeamento por hash.
- Prova forte de leitura (geração do PDF no servidor).

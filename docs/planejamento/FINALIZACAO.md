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

_(nenhum ainda — rode `/finalizar <codigo>`)_

# Plano — Onda 4: demais relatórios no motor único

Spec: [`../specs/2026-10-19-padrao-relatorios-configuravel-design.md`](../specs/2026-10-19-padrao-relatorios-configuravel-design.md) §6
(onda 3 nas PRs #138 e #139). Mesma regra de migração da [onda 1](./2026-10-19-padrao-relatorios-onda1.md): modelo
da família `relatorio` em `src/lib/documentos/modelos/`, linha no `REGISTRO`, arquivo antigo reduzido às funções que
as telas chamam, teste com `lerPdf`, PNG de antes e depois. Um subagente `dev-frontend-idjuv` por grupo, cada um
numa worktree.

## Grupos

| Grupo | Geradores | Telas |
|---|---|---|
| A | `pdfRelatorioUnidades` (unidades locais), `pdfListagemUnidades` | `RelatoriosUnidadesLocaisPage`, `RelatoriosCentralPage` |
| B | `generateRelatorioCargos` e `generateRelatorioGovernancaPDF` de `pdfGenerator`, `pdfRelatorioCargos` (`gerarRelatorioCargos98PDF`) | `GestaoCargosPage`, `RelatorioGovernancaPage`, `OrganogramaPage` |
| C | `pdfRelatorioArbitros`, `pdfRelatorioFederacoes` | `AdminRelatorios` (árbitros), `CentralRelatoriosFederacoesDialog` |
| D | `pdfOrganograma`: lista (`gerarOrganogramaListaPDF`) e desenho (`gerarOrganogramaPDF`) | `OrganogramaPage` |

## Regras próprias desta onda

- Nenhuma coluna, total ou filtro impresso pelo antigo some; corte por número de caracteres vira quebra de linha.
- O organograma desenhado é diagrama, não tabela: o modelo usa um bloco próprio (desenha pelo `ctx.doc`, como os
  blocos do motor) com cabeçalho, rodapé e marca do motor. Se não couber legível em A4 paisagem, o grupo D para e
  devolve a decisão, sem forçar.
- `pdfGenerator` é dividido por documento: só os dois relatórios saem dele; os atos continuam onde estão (SEI).

Integração: registrar os modelos, baixar `jspdfForaDoCore`, `npm run estado`, inventário do
`docs/PADRAO_DOCUMENTOS.md` §2, P23 do `ROADMAP.md`, gate verde, amostras em `/mnt/project-files/impressao/onda4/`
junto do push.

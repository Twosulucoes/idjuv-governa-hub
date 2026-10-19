# Plano — Onda 2: fichas no motor único

Spec: [`../specs/2026-10-19-padrao-relatorios-configuravel-design.md`](../specs/2026-10-19-padrao-relatorios-configuravel-design.md) §6
(onda 1 na PR #133). Mesma regra de migração da [onda 1](./2026-10-19-padrao-relatorios-onda1.md): modelo da
família `ficha` em `src/lib/documentos/modelos/`, linha no `REGISTRO`, arquivo antigo reduzido à função que as
telas chamam, teste com `lerPdf`, PNG conferido. Um subagente `dev-frontend-idjuv` por grupo, cada um numa worktree.

## Grupos

| Grupo | Geradores | Telas |
|---|---|---|
| A | `pdfMiniCurriculo` (mini-currículo do candidato) | `pages/curriculo/MiniCurriculoPage.tsx` (site, carregada sob demanda), `GestaoPreCadastrosPage.tsx` |
| B | `pdfFichaUnidadeLocal` + `pdf/unidades/*` (blocos da ficha de unidade) | `pages/unidades/RelatoriosCentralPage.tsx` |
| C | Ficha cadastral do servidor: `generateFichaCadastral` e `generateFichaCadastralModelo` de `pdfGenerator`, `generateFichaCadastralModelo` e `generateFichaCadastralPreenchida` de `pdfModelos` (as três cópias viram um modelo; em branco = mesmo modelo sem dados) | `ServidorFormPage`, `ServidorDetalhePage`, `ModelosDocumentosPage`, `DocumentosServidorTab` |

## Fora desta onda

- `pdfFichaCadastroGeral.ts`: preenche o formulário oficial (PDF editável do governo, `pdf-lib`) e precisa manter o
  layout do órgão estadual. Não é gerador próprio, então fica como está.
- Os atos de `pdfGenerator`/`pdfModelos` (termos, declarações, requisições) continuam fora (SEI, decisão do dono).

Integração: registrar os modelos, baixar `jspdfForaDoCore`, `npm run estado`, inventário do
`docs/PADRAO_DOCUMENTOS.md` §2 e P23 do `ROADMAP.md`, gate verde (inclui `build:site` e `check-bundle-site`).

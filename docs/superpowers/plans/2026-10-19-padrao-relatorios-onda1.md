# Plano — Onda 1: relatórios do RH no motor único

Spec: [`../specs/2026-10-19-padrao-relatorios-configuravel-design.md`](../specs/2026-10-19-padrao-relatorios-configuravel-design.md) §6
(aprovada em 19/10/2026; onda 0 na PR #131). Execução: um subagente `dev-frontend-idjuv` por grupo, cada um numa
worktree; integração, registro e revisão nesta sessão.

## Regra de cada migração

1. Ler o gerador antigo e gerar o PDF "antes" com dados de fixture.
2. Modelo declarativo em `src/lib/documentos/modelos/rh/<nome>.ts` (família `relatorio`, só blocos de `../blocos`),
   com a interface de dados exportada. Nada de nome de órgão, cor fixa ou logo no modelo.
3. O arquivo antigo `src/lib/pdf*.ts` mantém as funções exportadas que as telas usam, agora de poucas linhas:
   montam os dados, chamam `emitirDocumento('<tipo>', dados)` e `baixarDocumento`. Some o `import jsPDF`.
   Helpers de jsPDF exportados sem uso fora do arquivo são apagados.
4. Teste em `src/lib/documentos/__testes__/rh-<grupo>.test.ts`: título, colunas e valores principais, totais,
   vazio sem `undefined`, muitas linhas atravessando páginas.
5. PDF "depois" rasterizado e conferido; `scripts/documentos-comparar.mjs antes depois` quando houver poppler.

## Grupos

| Grupo | Geradores | Telas |
|---|---|---|
| A | `pdfRelatoriosRH` (diretoria, vínculo, histórico funcional, vagas por cargo, servidores × portarias) | `pages/rh/RelatoriosRHPage.tsx` |
| B | `pdfRelatoriosAfastamentos` (férias, licenças, viagens), `pdfRelatoriosFolha` (resumo do ano, por unidade, por rubrica), `pdfRelatorioFrequencia` (geral e individual) | cards em `components/rh/relatorios/`, `GestaoFrequenciaPage` |
| C | `pdfRelatorioServidoresDiretoria`, `pdfRelatorioSegundoVinculo`, `pdfRelatorioSituacaoPortaria`, `pdfRelatorioAgrupadoPortaria`, `pdfRelatorioContatosEstrategicos` | cards em `components/rh/`, `RelatoriosRHPage` |
| D | `pdfRelatorioPendencias`, `pdfRelatorioPendenciasServidores`, `pdfRelatorioFolhaSimplificado`, `pdfRelatorioAvancado`, `pdfRelatorioEstrutura` | currículo, diagnóstico, central de relatórios |

Integração: registrar todos os modelos em `registro.ts`, baixar `jspdfForaDoCore` no `scripts/gate-baseline.json`,
atualizar o inventário de `docs/PADRAO_DOCUMENTOS.md` §2 e o P23 do `ROADMAP.md`, gate verde.

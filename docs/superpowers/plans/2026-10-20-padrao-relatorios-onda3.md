# Plano — Onda 3: comprovantes no motor único

Spec: [`../specs/2026-10-19-padrao-relatorios-configuravel-design.md`](../specs/2026-10-19-padrao-relatorios-configuravel-design.md) §6 e §8
(onda 2 na PR #136). Mesma regra de migração das ondas [1](./2026-10-19-padrao-relatorios-onda1.md) e
[2](./2026-10-19-padrao-relatorios-onda2.md). Família `comprovante`. **Risco da spec §8:** são documentos
conferidos por terceiros (servidor, chefia, banco), então a PR só entra depois de o dono aprovar as amostras.

Pré-requisito feito nesta sessão: bloco `quebraPagina` (um servidor por página nos lotes), com teste.

## Grupos

| Grupo | Geradores | Telas |
|---|---|---|
| A | `pdfContracheque` (`generateContracheque`, `generateContrachequeEmLote`) | `MeuContrachequePage`, `ConsultaContrachequesPage`, `FolhaDetalhePage`, `FolhaBloqueadaPage`, `FichaFinanceiraDialog` |
| B | `pdfFrequenciaMensalGenerator` (folha de frequência do servidor) e `pdfFrequenciaLote` | `ImprimirFrequenciaDialog`, `ImprimirLoteFrequenciaDialog`, `useGerarFrequenciaPDF` |
| C | `pdfRelatorioReunioes` (lista de convocados, lista de presença, relatório da reunião) | `RelatoriosReuniaoDialog` |

## Regras próprias desta onda

- Nenhum valor, campo ou assinatura que o comprovante antigo imprimia pode sumir (o terceiro confere).
- Folha de frequência e contracheque cabem numa página por servidor sempre que o antigo cabia.
- Amostras (antes e depois) vão para o dono antes do merge.

Integração: registrar os modelos, baixar `jspdfForaDoCore`, `npm run estado`, inventário do
`docs/PADRAO_DOCUMENTOS.md` §2 e P23 do `ROADMAP.md`, gate verde.

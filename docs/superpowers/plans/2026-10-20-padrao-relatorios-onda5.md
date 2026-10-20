# Plano — Onda 5: limpeza da base antiga de PDF

Spec: [`../specs/2026-10-19-padrao-relatorios-configuravel-design.md`](../specs/2026-10-19-padrao-relatorios-configuravel-design.md) §6
(onda 4 na PR #142). Decisão do dono em 20/10/2026: **atos saem, resto migra**. Os atos que já são do SEI deixam de
ser gerados pelo sistema; os formulários do servidor continuam no sistema, pelo motor único; depois a base antiga
(`pdfTemplate`, `pdfInstitucional`, `pdfLogos`) é apagada e o gate reprova qualquer import dela.

## Grupos

| Grupo | O que | Arquivos |
|---|---|---|
| — | Cartões do RH sem `formatCurrency` da base antiga; relatório de portarias no motor (`portarias-relatorio`) | feito nesta PR |
| A | Atos do SEI saem: DFD/ETP/TR (tela CPSI, rota e menu), termo de cessão (botão de PDF), memorando de designação (PDF ao registrar e reimpressão). O registro de dados continua | `pdfCPSI`, `pdfTermoCessao`, `pdf/rh/memorandoDesignacao`, `CPSIPage`, `TermosCessaoTab`, `DesignacoesUnidadeTab` |
| B | Formulários administrativos no motor (preenchidos e em branco): termo de demanda, ordem de missão, relatório de viagem, requisição de material, termo de responsabilidade | `pdfGenerator`, `pdfModelos`, páginas de `pages/formularios/` |
| C | Declarações do servidor no motor (preenchidas e em branco): acumulação de cargos, bens e valores, residência; relação de documentos | `pdfGenerator`, `pdfModelos`, `pdfDeclaracoes` |
| D | Apagar `pdfTemplate`, `pdfInstitucional`, `pdfLogos`; regra no gate; `jspdfForaDoCore` no que sobrar | `scripts/` |

## Regras próprias desta onda

- Formulário migra com o mesmo texto e os mesmos campos do antigo; o que era nome do órgão escrito no código passa a
  vir da identidade do tenant. Modelo em branco é o mesmo modelo com `dados` vazios (campos em branco para preencher à mão).
- Ato removido não deixa botão morto nem rota no menu; o dado já registrado continua visível.
- Amostras de antes e depois em `/mnt/project-files/impressao/onda5/<grupo>/`.

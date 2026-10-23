---
name: novo-documento-idjuv
description: Cria ou migra um documento imprimível (PDF) do IDJUV Governa Hub pelo padrão único de impressão em src/lib/documentos/. Use quando o usuário pedir "gerar PDF de X", "imprimir X", "novo relatório/ficha/comprovante", "criar modelo de documento" ou quando for migrar um gerador antigo de src/lib/pdf*.ts. Não gera ato formal (portaria, memorando, termo, requerimento, DFD/ETP/TR): isso é feito no SEI.
---

# Novo documento imprimível — IDJUV Governa Hub

Padrão canônico: `docs/PADRAO_DOCUMENTOS.md`. Spec: `docs/superpowers/specs/2026-10-12-padrao-impressao-documentos-design.md`.
**Nunca** crie `new jsPDF` fora de `src/lib/documentos/core/` — o gate falha.
Também não use `window.print()`, classe `print:`, `@media print`/`@page` nem outra biblioteca de PDF
(pdf-lib, html2canvas, react-to-print…) fora de `src/lib/documentos/`: o gate conta e não deixa subir.

**Ato formal do órgão não se gera** (portaria, memorando, termo, requerimento, DFD/ETP/TR): é feito no SEI. O sistema
só acompanha o ciclo — registre processo SEI, número do ato e publicação no DOE (decisão do dono, 12/10/2026). Se o
pedido for "gerar portaria/memorando/termo", não crie modelo: aponte para o registro do ciclo no SEI.

## Antes de começar
1. Descubra com o usuário (ou pelo pedido): **qual documento**, **quem emite** (unidade), **que dados entram**, **precisa de protocolo?**
   (a camada só imprime protocolo já numerado; numerar é decisão de banco — skill `migracao-segura-idjuv`).
2. Procure o que já existe: `src/lib/documentos/registro.ts` e o inventário em `docs/PADRAO_DOCUMENTOS.md` §2.
   Se já existe gerador antigo, é **migração**: leia-o e gere o PDF "antes" com dados de fixture antes de mexer.

## Passo a passo
1. **Família**: `relatorio` (tabela, pode ser paisagem) · `ficha` (rótulo/valor) · `comprovante` (conferência de valores, tem linha de autenticidade).
2. **Dados**: interface TS em `src/lib/documentos/modelos/<nome>.ts`. Nada de nome de órgão/cliente no modelo; unidade emissora, local e data vêm nos dados.
3. **Modelo**: `DocumentoModelo<Dados>` com `tipo`, `familia`, `titulo`, `nomeArquivo`, `blocos(dados)`; use só blocos de `../blocos`
   (`secao, paragrafo, camposChaveValor, tabela, assinaturas, localData, carimbo`). Copie a forma de `relatorioReferencia`/`fichaReferencia`
   em `src/lib/documentos/__testes__/modelosReferencia.ts`.
4. **Registre** em `src/lib/documentos/registro.ts`.
5. **Teste** em `src/lib/documentos/__testes__/<nome>.test.ts` (`renderizarDocumento` + `lerPdf`): campos principais, campo ausente
   sem `undefined`, texto longo em várias páginas, protocolo presente/ausente.
6. **Veja o PDF** (obrigatório): gere a amostra (`DOCUMENTOS_AMOSTRAS=<pasta> npx vitest run …/amostras.test.ts`), rasterize com
   `pdftoppm -r 70 -png` e abra o PNG com Read. Migração: `node scripts/documentos-comparar.mjs antes.pdf depois.pdf` e mostre ao usuário.
7. **Tela**: `emitirDocumento('<tipo>', dados, { emitidoPor })` + `baixarDocumento`. Em migração, mantenha a função exportada do gerador
   antigo como wrapper de uma linha até todas as telas migrarem.
8. **Gate**: `bash scripts/gate.sh` verde (leia o resultado). Atualize `docs/PADRAO_DOCUMENTOS.md` (inventário/fase) no mesmo PR.

## Não faça
- Desenhar direto no `doc` dentro de um modelo (crie um bloco).
- Texto fixo de órgão/cargo/sigla; cor fixa (`#004444`) — a cor vem da marca do tenant.
- Mergear: merge na `main` publica o front. Deixe o PR em rascunho para o usuário validar o PDF.
- Criar modelo de ato formal (portaria, memorando, termo, requerimento, DFD/ETP/TR) ou recriar a família `ato`: o ato é do SEI.

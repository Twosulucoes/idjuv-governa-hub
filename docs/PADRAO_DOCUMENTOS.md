# Padrão de impressão de documentos

> **Estado (2026-10-12):** F0 (inventário) e F1 (camada `src/lib/documentos/`) concluídas e mergeadas (PR #89).
> **F2 "Migrar Atos" cancelada em 12/10/2026** (decisão do dono): ato formal do órgão é feito no SEI, não no sistema.
> Até cada gerador ser migrado (F3–F5) ou removido ele continua valendo como está. Spec:
> [`superpowers/specs/2026-10-12-padrao-impressao-documentos-design.md`](./superpowers/specs/2026-10-12-padrao-impressao-documentos-design.md).
> Plano da F0+F1: [`superpowers/plans/2026-10-12-padrao-impressao-f0-f1.md`](./superpowers/plans/2026-10-12-padrao-impressao-f0-f1.md).

## 1. Famílias

Todo documento pertence a uma família; cada família tem um layout-base.

> **Ato formal está fora do escopo (12/10/2026).** Portaria, memorando, termo, requerimento e DFD/ETP/TR são
> redigidos, assinados e publicados **no SEI** (declarações do servidor e despachos do Workflow: decisão pendente, §2). O sistema não gera o texto: ele só
> acompanha o ciclo (processo SEI, número do ato, assinatura, publicação no DOE) e registra o resultado na ficha
> do servidor (ver `docs/BANCO_DE_DADOS.md`). A camada `src/lib/documentos/` não tem família Ato.

| Família | Exemplos | Estrutura |
|---|---|---|
| ~~Ato~~ | portaria, memorando, declaração, termo, requerimento | **fora do escopo:** o ato é feito no SEI; o sistema registra processo SEI, número e DOE |
| **Relatório** | relatórios de RH, folha, unidades, federações, árbitros, pendências | cabeçalho, filtros aplicados, tabela(s) com totais, retrato ou paisagem |
| **Ficha** | ficha cadastral, mini-currículo, ficha da unidade, ficha de federação | cabeçalho, seções de campos chave-valor, foto opcional |
| **Comprovante** | contracheque, folha de frequência, lista de presença, certificado | cabeçalho enxuto, bloco principal, carimbo de autenticidade |

## 2. Inventário dos geradores (F0, medido em 2026-10-12, `main` a3c3af4)

Gerado por `node scripts/documentos-inventario.mjs` (49 arquivos). "Telas" = arquivos fora de `src/lib` que
importam o módulo; "libs" = outros módulos de `src/lib` que o importam. Coluna família/fase é classificação
por leitura dos nomes e exports — a fase de cada família confirma ao migrar. Geradores de ato (antiga F2) têm
destino **remover / substituir por registro do SEI**; onde a coluna diz "decisão pendente", o dono ainda decide
se o documento é ato do SEI ou formulário/relatório do sistema (declarações do servidor, requisição de material,
relatório de viagem, termo de responsabilidade patrimonial, despachos do Workflow).

| arquivo | linhas | exports | telas | libs | família | fase |
|---|---|---|---|---|---|---|
| `src/lib/pdf/rh/memorandoDesignacao.ts` | 181 | `generateMemorandoDesignacao` | 1 | 0 | Ato (fora do escopo) | remover / substituir por registro do SEI |
| `src/lib/pdf/unidades/blocoCedencias.ts` | 108 | — | 0 | 1 | Ficha (blocos da ficha de unidade) | F3 |
| `src/lib/pdf/unidades/blocoEstrutura.ts` | 90 | — | 0 | 1 | Ficha (blocos da ficha de unidade) | F3 |
| `src/lib/pdf/unidades/blocoIdentificacao.ts` | 73 | — | 0 | 1 | Ficha (blocos da ficha de unidade) | F3 |
| `src/lib/pdf/unidades/blocoLocalizacao.ts` | 61 | — | 0 | 1 | Ficha (blocos da ficha de unidade) | F3 |
| `src/lib/pdf/unidades/blocoPatrimonio.ts` | 137 | — | 0 | 1 | Ficha (blocos da ficha de unidade) | F3 |
| `src/lib/pdf/unidades/blocoResponsavel.ts` | 79 | — | 0 | 1 | Ficha (blocos da ficha de unidade) | F3 |
| `src/lib/pdf/unidades/index.ts` | 13 | — | 0 | 0 | Ficha (blocos da ficha de unidade) | F3 |
| `src/lib/pdfCPSI.ts` | 359 | `generateDFD`, `generateETP`, `generateTR` | 1 | 0 | Ato (fora do escopo) | remover / substituir por registro do SEI |
| `src/lib/pdfContracheque.ts` | 447 | `generateContracheque`, `generateContrachequeEmLote` | 4 | 0 | Comprovante | F5 |
| `src/lib/pdfDeclaracoes.ts` | 219 | `gerarDeclaracaoNaoAcumulacao`, `gerarDeclaracaoBensValores` | 1 | 0 | Ato (fora do escopo) | remover / substituir por registro do SEI (decisão pendente do dono) |
| `src/lib/pdfFederacoesModular.ts` | 747 | `isMandatoExpirado`, `gerarFichaFederacaoPDF`, `gerarRelatorioListagemPDF` | 0 | 0 | Ficha + Relatório (dividir) | removido no P10 (código morto) |
| `src/lib/pdfFichaCadastroGeral.ts` | 380 | `listarCamposPdf`, `gerarFichaCadastroGeral`, `downloadFichaCadastroGeral` | 1 | 0 | Ficha | F3 |
| `src/lib/pdfFichaUnidadeLocal.ts` | 117 | — | 1 | 0 | Ficha | F3 |
| `src/lib/pdfFrequenciaLote.ts` | 354 | `generateFrequenciaLotePDFInternal`, `generateFrequenciaLotePDF`, `generateFrequenciaLoteBlob` | 1 | 0 | Comprovante | F5 |
| `src/lib/pdfFrequenciaMensalGenerator.ts` | 921 | `MESES`, `INSTITUICAO`, `BLOCO_ALTURAS`, `LOGO_PROPORCOES`, `LINHAS_TABELA`, `CORES`, `gerarRegistrosDiariosBranco`, `calcularResumoMensal`, `renderizarPaginaFrequencia`, `generateFrequenciaMensalPDF`, `generateFrequenciaMensalBlob` | 2 | 1 | Comprovante | F5 |
| `src/lib/pdfGenerator.ts` | 2289 | `generateTermoDemanda`, `generateOrdemMissao`, `generateRelatorioViagem`, `generateRequisicaoMaterial`, `generateTermoResponsabilidade`, `generateDocumentNumber`, `generateRelatorioCargos`, `generateRelatorioGovernancaPDF`, `generateFichaCadastral`, `generateDeclaracaoAcumulacao`, `generateDeclaracaoBens`, `generateDeclaracaoResidencia`, `generateFichaCadastralModelo`, `generateDeclaracaoAcumulacaoModelo`, `generateDeclaracaoBensModelo` | 14 | 1 | Misto (dividir por documento) | SEI (atos; decisão pendente p/ declarações, requisição de material, relatório de viagem, termo de responsabilidade) / F3 / F4 |
| `src/lib/pdfInstitucional.ts` | 656 | `CORES_INSTITUCIONAIS`, `MARGENS`, `TIPOGRAFIA`, `carregarLogos`, `getDimensoesPagina`, `gerarCabecalhoInstitucional`, `gerarRodapeInstitucional`, `adicionarSecao`, `adicionarTituloSecao`, `adicionarCampo`, `adicionarCampoInline`, `verificarQuebraPagina`, `criarDocumentoInstitucional`, `finalizarDocumentoInstitucional` | 0 | 4 | Base (a eliminar) | F5 |
| `src/lib/pdfListagemUnidades.ts` | 188 | — | 1 | 0 | Relatório | F4 |
| `src/lib/pdfLogos.ts` | 81 | `LOGO_ASPECTOS`, `calcularDimensoesLogos`, `LOGO_CONFIG_PADRAO`, `getLogosPDF` | 0 | 5 | Base (a eliminar) | F5 |
| `src/lib/pdfMemorandoLotacao.ts` | 203 | `generateMemorandoLotacao`, `downloadMemorandoLotacao` | 0 | 0 | Ato (fora do escopo) | removido no P10 (código morto) |
| `src/lib/pdfMiniCurriculo.ts` | 453 | `gerarPdfMiniCurriculo` | 2 | 0 | Ficha | F3 |
| `src/lib/pdfModelos.ts` | 1335 | `generateRelacaoDocumentosModelo`, `generateFichaCadastralModelo`, `generateFichaCadastralPreenchida`, `generateDeclaracaoAcumulacaoModelo`, `generateDeclaracaoAcumulacaoPreenchida`, `generateDeclaracaoBensModelo`, `generateDeclaracaoBensPreenchida`, `generateTermoDemandaModelo`, `generateOrdemMissaoModelo`, `generateRelatorioViagemModelo`, `generateRequisicaoMaterialModelo`, `generateTermoResponsabilidadeModelo` | 2 | 0 | Misto (dividir por documento) | SEI (termos, declarações; decisão pendente) / F3 / F4 |
| `src/lib/pdfOrganograma.ts` | 650 | `gerarOrganogramaPDF`, `gerarOrganogramaListaPDF` | 2 | 0 | Relatório | F4 |
| pdfPortarias.ts (removido em 12/10/2026) | 930 | `generatePortariaUnificadaPdf`, `generatePortariaColetivaComTabela`, `generatePortariaNomeacao`, `generatePortariaExoneracao`, `generatePortariaDesignacao` | 2 | 1 | Ato (fora do escopo) | remover / substituir por registro do SEI |
| `src/lib/pdfRelatorioAgrupadoPortaria.ts` | 298 | `generateRelatorioAgrupadoPortaria` | 1 | 0 | Relatório | F4 |
| `src/lib/pdfRelatorioArbitros.ts` | 258 | `gerarRelatorioArbitrosPDF` | 1 | 0 | Relatório | F4 |
| `src/lib/pdfRelatorioAvancado.ts` | 468 | `gerarRelatorioPDF` | 1 | 0 | Relatório | F4 |
| `src/lib/pdfRelatorioCargos.ts` | 260 | `gerarRelatorioCargos98PDF` | 1 | 0 | Relatório | F4 |
| `src/lib/pdfRelatorioContatosEstrategicos.ts` | 268 | `gerarRelatorioContatosEstrategicos` | 1 | 0 | Relatório | F4 |
| `src/lib/pdfRelatorioEstrutura.ts` | 251 | `generateRelatorioEstruturaPDF` | 1 | 0 | Relatório | F4 |
| `src/lib/pdfRelatorioFederacoes.ts` | 300 | `gerarRelatorioFederacoesPDF` | 1 | 0 | Relatório | F4 |
| `src/lib/pdfRelatorioFolhaSimplificado.ts` | 333 | `gerarRelatorioFolhaSimplificado` | 1 | 0 | Relatório | F4 |
| `src/lib/pdfRelatorioFrequencia.ts` | 386 | `generateRelatorioFrequenciaGeral`, `generateRelatorioFrequenciaIndividual` | 2 | 1 | Relatório | F4 |
| `src/lib/pdfRelatorioPendencias.ts` | 320 | `gerarPdfRelatorioPendencias` | 2 | 0 | Relatório | F4 |
| `src/lib/pdfRelatorioPendenciasServidores.ts` | 348 | `gerarPdfRelatorioPendenciasServidores` | 1 | 0 | Relatório | F4 |
| `src/lib/pdfRelatorioReunioes.ts` | 427 | `gerarPdfListaConvocados`, `gerarPdfListaPresenca`, `gerarPdfRelatorioReuniao` | 1 | 0 | Comprovante (lista de presença/convocados) + Relatório (ata) | F4/F5 |
| `src/lib/pdfRelatorioSegundoVinculo.ts` | 224 | `gerarRelatorioSegundoVinculo` | 1 | 0 | Relatório | F4 |
| `src/lib/pdfRelatorioServidoresDiretoria.ts` | 362 | `gerarRelatorioServidoresDiretoria` | 1 | 0 | Relatório | F4 |
| `src/lib/pdfRelatorioSituacaoPortaria.ts` | 297 | `generateRelatorioSituacaoPortaria` | 1 | 0 | Relatório | F4 |
| `src/lib/pdfRelatorioUnidades.ts` | 678 | `generateRelatorioUnidadesPDF`, `downloadRelatorioUnidadesPDF` | 1 | 0 | Relatório | F4 |
| `src/lib/pdfRelatoriosAfastamentos.ts` | 375 | `addCabecalhoTabela`, `addLinhaTabela`, `quebrarComCabecalho`, `addTituloGrupo`, `addLinhaTotal`, `finalizar`, `gerarRelatorioFerias`, `gerarRelatorioLicencas`, `gerarRelatorioViagens` | 3 | 1 | Relatório | F4 |
| `src/lib/pdfRelatoriosFolha.ts` | 231 | `gerarResumoFolhasAno`, `gerarFolhaPorUnidade`, `gerarFolhaPorRubrica` | 1 | 0 | Relatório | F4 |
| `src/lib/pdfRelatoriosRH.ts` | 918 | `generateRelatorioServidoresDiretoria`, `generateRelatorioServidoresVinculo`, `generateRelatorioHistoricoFuncional`, `generateRelatorioVagasCargo`, `generateRelatorioServidoresPortarias` | 1 | 0 | Relatório | F4 |
| `src/lib/pdfTemplate.ts` | 878 | `CORES`, `loadImageWithDimensions`, `calculateLogoDimensions`, `loadLogos`, `PAGINA`, `getPageDimensions`, `setColor`, `generateInstitutionalHeader`, `generateInstitutionalFooter`, `addPageNumbers`, `addSectionHeader`, `addSectionTitle`, `addField`, `addFieldWithLine`, `addTextArea`, `addCheckbox`, `addSignatureArea`, `addLocalData`, `addTableHeader`, `addTableRow`, `formatCPF`, `formatDate`, `formatCurrency`, `generateDocumentNumber`, `checkPageBreak`, `VINCULO_LABELS`, `SITUACAO_LABELS`, `CATEGORIA_LABELS`, `cabecalhoOficial`, `nomeOficialDocumentos`, `nomeEntidadeSuperiorDocumentos`, `rodapeOficial` | 2 | 34 | Base (a eliminar) | F5 |
| `src/lib/pdfTermoAutorizacao.ts` | 210 | `generateTermoAutorizacao` | 0 | 0 | Ato (fora do escopo) | removido no P10 (código morto) |
| `src/lib/pdfTermoCessao.ts` | 138 | `generateTermoCessao` | 1 | 0 | Ato (fora do escopo) | remover / substituir por registro do SEI |
| `src/lib/pdfTermoResponsabilidade.ts` | 181 | `generateTermoResponsabilidade` | 0 | 0 | Ato (fora do escopo) | removido no P10 (código morto) |
| portariaPdf.ts (removido em 12/10/2026) | 150 | `buildPortariaPdfDoc`, `savePortariaPdf` | 1 | 0 | Ato (fora do escopo) | remover / substituir por registro do SEI |

### Documentos dentro de arquivos multiuso

- `pdfGenerator.ts` (2.289 linhas, 14 telas): termo de demanda, ordem de missão, relatório de viagem,
  requisição de material, termo de responsabilidade, declarações (acumulação, bens, residência), ficha cadastral
  (+ versões "Modelo" em branco), relatório de cargos e relatório de governança. Mistura Ato (vai para o SEI),
  Ficha e Relatório;
  `generateTermoResponsabilidade` duplica `pdfTermoResponsabilidade.ts` e as `*Modelo` duplicam `pdfModelos.ts`.
- `pdfModelos.ts` (1.335 linhas, 2 telas): versões em branco (`*Modelo`) e preenchidas (`*Preenchida`) de ficha cadastral,
  declarações e termos, mais relação de documentos. Candidato a virar o mesmo modelo com `dados` opcionais.
- `pdfCPSI.ts`: DFD, ETP e TR (documentos de contratação) — atos, feitos no SEI; destino: remover / substituir por registro do SEI.
- `pdfFederacoesModular.ts` (747 linhas, **0 telas**): ficha de federação (Ficha) e listagem (Relatório); `isMandatoExpirado` é regra de negócio, não de PDF.
- `pdfRelatorioReunioes.ts`: lista de convocados e de presença (Comprovante) e relatório da reunião (Relatório).
- `pdfRelatoriosAfastamentos.ts`: exporta helpers de tabela (`addCabecalhoTabela`, `quebrarComCabecalho`…) além dos relatórios; os helpers serão substituídos pelo bloco `tabela`.
- `pdfInstitucional.ts` e `pdfTemplate.ts`: bases concorrentes (34 libs importam `pdfTemplate`, 4 `pdfInstitucional`, 5 `pdfLogos`); saem na F5.

### Achados do inventário

- **Sem chamador em `src/` (0 telas, 0 libs):** `pdfMemorandoLotacao.ts`, `pdfTermoAutorizacao.ts`, `pdfTermoResponsabilidade.ts`, `pdfFederacoesModular.ts`. Removidos no P10 (16/10/2026), com autorização do dono.
- **Despachos do Workflow** não aparecem na tabela (não são `src/lib/pdf*`), mas seguem a mesma regra: decisão pendente do dono.
- **Duplicações:** termo de responsabilidade (3 lugares), ficha cadastral (3), declarações (3).
- **Protocolo:** nenhum gerador imprime número de protocolo hoje (o único, `pdfMemorandoLotacao.ts`, era código morto e saiu no P10).

## 3. Como criar um documento novo

Regra: **nenhum PDF novo fora de `src/lib/documentos/`**. O gate conta `import` de `jspdf` (valor, não tipo)
fora de `core/` e de `__testes__/`, e não deixa a contagem subir (`scripts/check-jspdf-fora-do-core.mjs`,
chave `jspdfForaDoCore` em `scripts/gate-baseline.json`).

1. **Escolha a família** (§1): tabela = relatório; rótulo/valor de uma pessoa ou coisa = ficha; documento de
   conferência de valores = comprovante. **Ato formal do órgão** (portaria, memorando, termo, requerimento,
   DFD/ETP/TR) **não se gera**: é feito no SEI; registre processo SEI, número e DOE.
2. **Declare os dados** como interface TypeScript. Tudo que o documento imprime vem dela — inclusive
   a unidade emissora (`unidadeEmissora`), o local e a data. **Nunca** escreva nome de órgão, cargo de
   dirigente ou sigla no modelo (white label).
3. **Escreva o modelo** em `src/lib/documentos/modelos/<nome>.ts`: um `DocumentoModelo<Dados>` com
   `tipo`, `familia`, `titulo`, `nomeArquivo` e `blocos(dados)` (lista de blocos de `../blocos`).
   Exemplos vivos: `__testes__/modelosReferencia.ts` (relatório, ficha, comprovante).
4. **Registre** em `registro.ts` (uma linha em `REGISTRO`).
5. **Teste** em `__testes__/<nome>.test.ts` com `renderizarDocumento` + `lerPdf`: título, campos
   principais, campo ausente (sem `undefined`), texto longo atravessando página, protocolo.
6. **Veja o PDF**: `DOCUMENTOS_AMOSTRAS=<pasta> npx vitest run src/lib/documentos/__testes__/amostras.test.ts`
   (acrescente o novo modelo ao arquivo de amostras), `pdftoppm -r 70 -png`, e abra o PNG. Traço fino
   (régua) só se confere em 200 dpi. Para migração de gerador antigo, use
   `node scripts/documentos-comparar.mjs antes.pdf depois.pdf`.
7. **Use na tela** com `emitirDocumento('<tipo>', dados, { emitidoPor })` e `baixarDocumento(...)`.
8. **Gate**: `bash scripts/gate.sh` verde.

Se faltar um bloco (ex.: lista numerada, QR), crie em `blocos/`, exporte em `blocos/index.ts` e teste;
não desenhe direto no `doc` dentro de um modelo.

## 4. Anatomia

```
src/lib/documentos/
  tipos.ts            Familia, MarcaImpressao, ContextoDocumento, Bloco, DocumentoModelo
  core/               tokens, texto, pintura, familias, pagina (único `new jsPDF`), moldura, renderizar
  blocos/             titulo, secao, paragrafo, localData, camposChaveValor, tabela, assinaturas, carimbo
  modelos/            um arquivo declarativo por documento (nenhum por enquanto; o requerimento saiu em 12/10/2026)
  registro.ts         REGISTRO: única lista de documentos do sistema
  marca.ts            marcaDoTenant (puro) · logos.ts: carregarLogo (navegador)
  emitir.ts           emitirDocumento / baixarDocumento (casca do navegador)
  __testes__/         lerPdf, fixtures, modelosReferencia e os testes (vitest)
```

| Token | Valor |
|---|---|
| Página | A4; margens 20 mm (laterais), 18 mm (topo), 22 mm (rodapé, inclui a faixa do rodapé); escala de espaço 4 / 8 / 12 / 16 mm |
| Tipografia | relatório, ficha e comprovante em **Helvetica** (fonte nativa do PDF) |
| Escala | título 14 pt · seção 11 pt · corpo 10,5 pt · tabela 9 pt · rótulo 8 pt · rodapé 7,5 pt |
| Cor | primária = cor do tenant (se tiver < 4,5:1 sobre branco, cai para o texto neutro); neutros slate |
| Preto e branco | significado nunca só por cor: zebra leve, réguas, rótulos |

**Cabeçalho:** na 1ª página, logo da entidade superior à esquerda, logo do órgão à direita, nomes e até 2 linhas
de unidade emissora ao centro, título e protocolo; nas demais, cabeçalho compacto com protocolo.
**Rodapé (todas as páginas):** sistema, "emitido por … em …" e "Página X de Y"; comprovantes ganham a linha
"Documento emitido eletronicamente".

## 5. Protocolo

A camada **imprime** o protocolo que o modelo devolve em `protocolo(dados)`; ela não numera. Hoje só o
RH numera seus registros (`RH-AAAA-NNNNNN`, RPCs de `src/lib/rhRpc.ts`); o número do ato formal vem do SEI. Numerar documentos de outros módulos
exige tabela/RPC com RLS (decisão e spec próprias; fora de escopo desta fase).

## 6. Limitações conhecidas

- Fontes nativas do PDF (Times/Helvetica): caracteres fora do WinAnsi (emoji, `ł`, `ž`, `✓`…) saem como `?`.
- **Assinatura isolada em página:** os blocos `assinaturas` e `carimbo` são indivisíveis; se faltarem poucos
  milímetros, vão sozinhos para a página seguinte. Deixou de ser obrigatória (era da F2, cancelada); vale criar
  "manter junto" se uma ficha ou relatório vier a usar assinatura. Hoje `assinaturas` não é usado por nenhum
  modelo (fica disponível); `carimbo` é usado pelo comprovante de referência.
- Cabeçalho/rodapé: nome do órgão muito longo no cabeçalho compacto (páginas 2+) pode encostar no protocolo, e `emitidoPor` muito longo no rodapé pode encostar em "Página X de Y"; logo mais largo que 3,2:1 sai achatado (limite de 45 mm de largura com 14 mm de altura). Nenhum tenant atual passa desses limites.
- `tabela` não valida `colunas` vazio nem `peso <= 0` (erro de programação, lança); rótulo de campo maior que a coluna é cortado na 1ª linha.
- O logo entra no PDF em resolução total (peso do arquivo); reduzir no canvas é melhoria futura.
- Não há QR de verificação pública (fase opcional pós-F5).
- A comparação antes/depois (`scripts/documentos-comparar.mjs`) usa poppler: roda na VPS, não no CI.

<!-- doc-links-absent: src/lib/pdfFederacoesModular.ts, src/lib/pdfMemorandoLotacao.ts, src/lib/pdfTermoAutorizacao.ts, src/lib/pdfTermoResponsabilidade.ts, pdfTermoResponsabilidade.ts, pdfFederacoesModular.ts, pdfMemorandoLotacao.ts, pdfTermoAutorizacao.ts -->

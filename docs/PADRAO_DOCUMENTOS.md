# Padrão de impressão de documentos

> **Estado (2026-10-12):** F0 (inventário) e F1 (camada `src/lib/documentos/`) concluídas no branch `claude/padrao-impressao`,
> ainda não mergeadas. Até cada gerador ser migrado (F2–F5) ele continua valendo como está. Spec:
> [`superpowers/specs/2026-10-12-padrao-impressao-documentos-design.md`](./superpowers/specs/2026-10-12-padrao-impressao-documentos-design.md).
> Plano da F0+F1: [`superpowers/plans/2026-10-12-padrao-impressao-f0-f1.md`](./superpowers/plans/2026-10-12-padrao-impressao-f0-f1.md).

## 1. Famílias

Todo documento pertence a uma família; cada família tem um layout-base.

| Família | Exemplos | Estrutura |
|---|---|---|
| **Ato** | portaria, memorando, declaração, termo, requerimento | cabeçalho, título, número/protocolo, corpo em texto, local e data, assinaturas |
| **Relatório** | relatórios de RH, folha, unidades, federações, árbitros, pendências | cabeçalho, filtros aplicados, tabela(s) com totais, retrato ou paisagem |
| **Ficha** | ficha cadastral, mini-currículo, ficha da unidade, ficha de federação | cabeçalho, seções de campos chave-valor, foto opcional |
| **Comprovante** | contracheque, folha de frequência, lista de presença, certificado | cabeçalho enxuto, bloco principal, carimbo de autenticidade |

## 2. Inventário dos geradores (F0, medido em 2026-10-12, `main` a3c3af4)

Gerado por `node scripts/documentos-inventario.mjs` (49 arquivos). "Telas" = arquivos fora de `src/lib` que
importam o módulo; "libs" = outros módulos de `src/lib` que o importam. Coluna família/fase é classificação
por leitura dos nomes e exports — a fase de cada família confirma ao migrar.

| arquivo | linhas | exports | telas | libs | família | fase |
|---|---|---|---|---|---|---|
| `src/lib/pdf/rh/memorandoDesignacao.ts` | 181 | `generateMemorandoDesignacao` | 1 | 0 | Ato | F2 |
| `src/lib/pdf/unidades/blocoCedencias.ts` | 108 | — | 0 | 1 | Ficha (blocos da ficha de unidade) | F3 |
| `src/lib/pdf/unidades/blocoEstrutura.ts` | 90 | — | 0 | 1 | Ficha (blocos da ficha de unidade) | F3 |
| `src/lib/pdf/unidades/blocoIdentificacao.ts` | 73 | — | 0 | 1 | Ficha (blocos da ficha de unidade) | F3 |
| `src/lib/pdf/unidades/blocoLocalizacao.ts` | 61 | — | 0 | 1 | Ficha (blocos da ficha de unidade) | F3 |
| `src/lib/pdf/unidades/blocoPatrimonio.ts` | 137 | — | 0 | 1 | Ficha (blocos da ficha de unidade) | F3 |
| `src/lib/pdf/unidades/blocoResponsavel.ts` | 79 | — | 0 | 1 | Ficha (blocos da ficha de unidade) | F3 |
| `src/lib/pdf/unidades/index.ts` | 13 | — | 0 | 0 | Ficha (blocos da ficha de unidade) | F3 |
| `src/lib/pdfCPSI.ts` | 359 | `generateDFD`, `generateETP`, `generateTR` | 1 | 0 | Ato | F2 |
| `src/lib/pdfContracheque.ts` | 447 | `generateContracheque`, `generateContrachequeEmLote` | 4 | 0 | Comprovante | F5 |
| `src/lib/pdfDeclaracoes.ts` | 219 | `gerarDeclaracaoNaoAcumulacao`, `gerarDeclaracaoBensValores` | 1 | 0 | Ato | F2 |
| `src/lib/pdfFederacoesModular.ts` | 747 | `isMandatoExpirado`, `gerarFichaFederacaoPDF`, `gerarRelatorioListagemPDF` | 0 | 0 | Ficha + Relatório (dividir) | F3/F4 |
| `src/lib/pdfFichaCadastroGeral.ts` | 380 | `listarCamposPdf`, `gerarFichaCadastroGeral`, `downloadFichaCadastroGeral` | 1 | 0 | Ficha | F3 |
| `src/lib/pdfFichaUnidadeLocal.ts` | 117 | — | 1 | 0 | Ficha | F3 |
| `src/lib/pdfFrequenciaLote.ts` | 354 | `generateFrequenciaLotePDFInternal`, `generateFrequenciaLotePDF`, `generateFrequenciaLoteBlob` | 1 | 0 | Comprovante | F5 |
| `src/lib/pdfFrequenciaMensalGenerator.ts` | 921 | `MESES`, `INSTITUICAO`, `BLOCO_ALTURAS`, `LOGO_PROPORCOES`, `LINHAS_TABELA`, `CORES`, `gerarRegistrosDiariosBranco`, `calcularResumoMensal`, `renderizarPaginaFrequencia`, `generateFrequenciaMensalPDF`, `generateFrequenciaMensalBlob` | 2 | 1 | Comprovante | F5 |
| `src/lib/pdfGenerator.ts` | 2289 | `generateTermoDemanda`, `generateOrdemMissao`, `generateRelatorioViagem`, `generateRequisicaoMaterial`, `generateTermoResponsabilidade`, `generateDocumentNumber`, `generateRelatorioCargos`, `generateRelatorioGovernancaPDF`, `generateFichaCadastral`, `generateDeclaracaoAcumulacao`, `generateDeclaracaoBens`, `generateDeclaracaoResidencia`, `generateFichaCadastralModelo`, `generateDeclaracaoAcumulacaoModelo`, `generateDeclaracaoBensModelo` | 14 | 1 | Misto (dividir por documento) | F2/F3/F4 |
| `src/lib/pdfInstitucional.ts` | 656 | `CORES_INSTITUCIONAIS`, `MARGENS`, `TIPOGRAFIA`, `carregarLogos`, `getDimensoesPagina`, `gerarCabecalhoInstitucional`, `gerarRodapeInstitucional`, `adicionarSecao`, `adicionarTituloSecao`, `adicionarCampo`, `adicionarCampoInline`, `verificarQuebraPagina`, `criarDocumentoInstitucional`, `finalizarDocumentoInstitucional` | 0 | 4 | Base (a eliminar) | F5 |
| `src/lib/pdfListagemUnidades.ts` | 188 | — | 1 | 0 | Relatório | F4 |
| `src/lib/pdfLogos.ts` | 81 | `LOGO_ASPECTOS`, `calcularDimensoesLogos`, `LOGO_CONFIG_PADRAO`, `getLogosPDF` | 0 | 5 | Base (a eliminar) | F5 |
| `src/lib/pdfMemorandoLotacao.ts` | 203 | `generateMemorandoLotacao`, `downloadMemorandoLotacao` | 0 | 0 | Ato | F2 |
| `src/lib/pdfMiniCurriculo.ts` | 453 | `gerarPdfMiniCurriculo` | 2 | 0 | Ficha | F3 |
| `src/lib/pdfModelos.ts` | 1335 | `generateRelacaoDocumentosModelo`, `generateFichaCadastralModelo`, `generateFichaCadastralPreenchida`, `generateDeclaracaoAcumulacaoModelo`, `generateDeclaracaoAcumulacaoPreenchida`, `generateDeclaracaoBensModelo`, `generateDeclaracaoBensPreenchida`, `generateTermoDemandaModelo`, `generateOrdemMissaoModelo`, `generateRelatorioViagemModelo`, `generateRequisicaoMaterialModelo`, `generateTermoResponsabilidadeModelo` | 2 | 0 | Misto (dividir por documento) | F2/F3/F4 |
| `src/lib/pdfOrganograma.ts` | 650 | `gerarOrganogramaPDF`, `gerarOrganogramaListaPDF` | 2 | 0 | Relatório | F4 |
| `src/lib/pdfPortarias.ts` | 930 | `generatePortariaUnificadaPdf`, `generatePortariaColetivaComTabela`, `generatePortariaNomeacao`, `generatePortariaExoneracao`, `generatePortariaDesignacao` | 2 | 1 | Ato | F2 |
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
| `src/lib/pdfTermoAutorizacao.ts` | 210 | `generateTermoAutorizacao` | 0 | 0 | Ato | F2 |
| `src/lib/pdfTermoCessao.ts` | 138 | `generateTermoCessao` | 1 | 0 | Ato | F2 |
| `src/lib/pdfTermoResponsabilidade.ts` | 181 | `generateTermoResponsabilidade` | 0 | 0 | Ato | F2 |
| `src/lib/portariaPdf.ts` | 150 | `buildPortariaPdfDoc`, `savePortariaPdf` | 1 | 0 | Ato | F2 |

### Documentos dentro de arquivos multiuso

- `pdfGenerator.ts` (2.289 linhas, 14 telas): termo de demanda, ordem de missão, relatório de viagem,
  requisição de material, termo de responsabilidade, declarações (acumulação, bens, residência), ficha cadastral
  (+ versões "Modelo" em branco), relatório de cargos e relatório de governança. Mistura Ato, Ficha e Relatório;
  `generateTermoResponsabilidade` duplica `pdfTermoResponsabilidade.ts` e as `*Modelo` duplicam `pdfModelos.ts`.
- `pdfModelos.ts` (1.335 linhas, 2 telas): versões em branco (`*Modelo`) e preenchidas (`*Preenchida`) de ficha cadastral,
  declarações e termos, mais relação de documentos. Candidato a virar o mesmo modelo com `dados` opcionais.
- `pdfCPSI.ts`: DFD, ETP e TR (documentos de contratação) — textuais, família Ato.
- `pdfFederacoesModular.ts` (747 linhas, **0 telas**): ficha de federação (Ficha) e listagem (Relatório); `isMandatoExpirado` é regra de negócio, não de PDF.
- `pdfRelatorioReunioes.ts`: lista de convocados e de presença (Comprovante) e relatório da reunião (Relatório).
- `pdfRelatoriosAfastamentos.ts`: exporta helpers de tabela (`addCabecalhoTabela`, `quebrarComCabecalho`…) além dos relatórios; os helpers serão substituídos pelo bloco `tabela`.
- `pdfInstitucional.ts` e `pdfTemplate.ts`: bases concorrentes (34 libs importam `pdfTemplate`, 4 `pdfInstitucional`, 5 `pdfLogos`); saem na F5.

### Achados do inventário

- **Sem chamador em `src/` (0 telas, 0 libs):** `pdfMemorandoLotacao.ts`, `pdfTermoAutorizacao.ts`, `pdfTermoResponsabilidade.ts`, `pdfFederacoesModular.ts`. Antes de migrar,
  confirmar se são código morto (não apagar sem autorização do usuário).
- **Duplicações:** termo de responsabilidade (3 lugares), ficha cadastral (3), declarações (3).
- **Protocolo:** só `pdfMemorandoLotacao.ts` imprime número de protocolo hoje.

## 3. Como criar um documento novo

Regra: **nenhum PDF novo fora de `src/lib/documentos/`**. O gate conta `import` de `jspdf` (valor, não tipo)
fora de `core/` e de `__testes__/`, e não deixa a contagem subir (`scripts/check-jspdf-fora-do-core.mjs`,
chave `jspdfForaDoCore` em `scripts/gate-baseline.json`).

1. **Escolha a família** (§1). Na dúvida: texto corrido com assinatura = ato; tabela = relatório;
   rótulo/valor de uma pessoa ou coisa = ficha; documento de conferência de valores = comprovante.
2. **Declare os dados** como interface TypeScript. Tudo que o documento imprime vem dela — inclusive
   a unidade emissora (`unidadeEmissora`), o local e a data. **Nunca** escreva nome de órgão, cargo de
   dirigente ou sigla no modelo (white label).
3. **Escreva o modelo** em `src/lib/documentos/modelos/<nome>.ts`: um `DocumentoModelo<Dados>` com
   `tipo`, `familia`, `titulo`, `nomeArquivo` e `blocos(dados)` (lista de blocos de `../blocos`).
   Exemplos vivos: `modelos/requerimento.ts` (ato) e `__testes__/modelosReferencia.ts`
   (relatório, ficha, comprovante).
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
  modelos/            um arquivo declarativo por documento (hoje: requerimento)
  registro.ts         REGISTRO: única lista de documentos do sistema
  marca.ts            marcaDoTenant (puro) · logos.ts: carregarLogo (navegador)
  emitir.ts           emitirDocumento / baixarDocumento (casca do navegador)
  __testes__/         lerPdf, fixtures, modelosReferencia e os testes (vitest)
```

| Token | Valor |
|---|---|
| Página | A4; margens 20 mm (laterais), 18 mm (topo), 22 mm (rodapé, inclui a faixa do rodapé); escala de espaço 4 / 8 / 12 / 16 mm |
| Tipografia | Ato em **Times**; relatório, ficha e comprovante em **Helvetica** (fontes nativas do PDF) |
| Escala | título 14 pt · seção 11 pt · corpo 10,5 pt · tabela 9 pt · rótulo 8 pt · rodapé 7,5 pt |
| Cor | primária = cor do tenant (se tiver < 4,5:1 sobre branco, cai para o texto neutro); neutros slate |
| Preto e branco | significado nunca só por cor: zebra leve, réguas, rótulos |

**Cabeçalho:** na 1ª página, logo da entidade superior à esquerda, logo do órgão à direita, nomes e até 2 linhas
de unidade emissora ao centro, título e protocolo; nas demais, cabeçalho compacto com protocolo.
**Rodapé (todas as páginas):** sistema, "emitido por … em …" e "Página X de Y"; comprovantes ganham a linha
"Documento emitido eletronicamente".

## 5. Protocolo

A camada **imprime** o protocolo que o modelo devolve em `protocolo(dados)`; ela não numera. Hoje só o
RH numera atos (`RH-AAAA-NNNNNN`, RPCs de `src/lib/rhRpc.ts`). Numerar documentos de outros módulos
exige tabela/RPC com RLS (decisão e spec próprias; fora de escopo desta fase).

## 6. Limitações conhecidas

- Fontes nativas do PDF (Times/Helvetica): caracteres fora do WinAnsi (emoji, `ł`, `ž`, `✓`…) saem como `?`.
- **Assinatura isolada em página (pendência obrigatória da F2):** os blocos `assinaturas` e `carimbo` são
  indivisíveis; se faltarem poucos milímetros, vão sozinhos para a página seguinte (visto na amostra do
  requerimento). Antes de migrar os Atos, criar "manter junto" (medir local/data + assinatura antes de desenhar).
- Texto recuado quebra pela largura da 1ª linha em todas as linhas do parágrafo (ver `blocos/paragrafo.ts`).
- Não há QR de verificação pública (fase opcional pós-F5).
- A comparação antes/depois (`scripts/documentos-comparar.mjs`) usa poppler: roda na VPS, não no CI.

# Padrão de impressão de documentos

> **Estado (2026-10-12):** F0 (inventário) e F1 (camada `src/lib/documentos/`) concluídas e mergeadas (PR #89).
> **F2 "Migrar Atos" cancelada em 12/10/2026** (decisão do dono): ato formal do órgão é feito no SEI, não no sistema.
> Até cada gerador ser migrado (F3–F5) ou removido ele continua valendo como está. Spec:
> [`superpowers/specs/2026-10-12-padrao-impressao-documentos-design.md`](./superpowers/specs/2026-10-12-padrao-impressao-documentos-design.md).
> Plano da F0+F1: [`superpowers/plans/2026-10-12-padrao-impressao-f0-f1.md`](./superpowers/plans/2026-10-12-padrao-impressao-f0-f1.md).

> **Padronização configurável (19/10/2026, onda 0):** cor de destaque, logos, linha extra do cabeçalho, texto do
> rodapé, emissor, tamanho da letra, tabela listrada e orientação são escolhidos na tela Configuração do cliente
> ([CONFIGURACAO_CLIENTE.md](./CONFIGURACAO_CLIENTE.md), seção Impressão de documentos) e chegam ao núcleo como
> `EstiloImpressao` (`estiloDoTenant`). Ondas seguintes migram os geradores antigos por módulo:
> [spec](./superpowers/specs/2026-10-19-padrao-relatorios-configuravel-design.md).

> **Onda 1 (19/10/2026, relatórios do RH):** os geradores marcados "migrado na onda 1" na tabela do §2 viraram
> modelos em `src/lib/documentos/modelos/rh/` e `modelos/relatorios/`, registrados no `REGISTRO`. O arquivo
> antigo ficou só com a função que as telas chamam (`emitirDocumento` + `baixarDocumento`), sem `jspdf`.
> Ficou de fora do motor, de propósito: cor por célula (status, % de presença, esfera), recuo da hierarquia
> (vira caminho de siglas no título da seção), logos desenhados à mão e a opção `incluirLogos` das telas, que
> agora é ignorada (logos seguem a configuração de impressão). Corte por número de caracteres virou quebra de
> linha. Plano: [`superpowers/plans/2026-10-19-padrao-relatorios-onda1.md`](./superpowers/plans/2026-10-19-padrao-relatorios-onda1.md).

> **Onda 2 (19/10/2026, fichas):** mini-currículo (`curriculo-mini-curriculo`), ficha da unidade local
> (`unidades-ficha-unidade-local`, os blocos de `src/lib/pdf/unidades/` foram apagados) e ficha cadastral do servidor
> (`rh-ficha-cadastral`). As três cópias da ficha cadastral (`pdfGenerator` e `pdfModelos`, preenchida e em branco)
> viraram um modelo; a versão em branco é o mesmo modelo sem dados, com linhas para preencher à mão. A Ficha
> Cadastro Geral (`pdfFichaCadastroGeral.ts`) fica fora: preenche o formulário oficial do governo. LGPD: a ficha
> preenchida lista dependentes só com nome e parentesco; filiação e cor/raça (que só o antigo modelo em branco de
> `pdfModelos` pedia, sem nunca imprimir o valor) saíram da ficha. Plano:
> [`superpowers/plans/2026-10-19-padrao-relatorios-onda2.md`](./superpowers/plans/2026-10-19-padrao-relatorios-onda2.md).

> **Onda 3 (20/10/2026, comprovantes):** contracheque individual e em lote (`folha-contracheque`), folha de frequência
> individual e em lote por unidade (`rh-folha-frequencia`, um servidor por página com o bloco `quebraPagina`, os 31
> dias numa página) e os PDFs da reunião (`reunioes-lista-convocados`, `reunioes-lista-presenca`,
> `reunioes-relatorio`). O bloco `tabela` ganhou opções: `formulario` (letra menor, uma linha por registro, grade e
> célula vazia em branco, para folha de ponto), `alturaMinimaLinha` (espaço para assinar à mão) e
> `emBranco` por coluna (célula vazia sem "—"). O local da linha de data vem de `localDaSede()` ("Cidade/UF" do tenant). Cidade fixa no código e "GOVERNO DO ESTADO" escrito à mão saíram (vêm do tenant). No lote do
> contracheque o PIS continua fora. Plano:
> [`superpowers/plans/2026-10-20-padrao-relatorios-onda3.md`](./superpowers/plans/2026-10-20-padrao-relatorios-onda3.md).

> **Onda 4 (20/10/2026, demais relatórios):** unidades locais (`unidades-relatorio-unidades-locais`: lista, ficha por
> unidade e resumo) e listagem de unidades (`unidades-listagem`); cargos e vagas (`cargos-relatorio-cargos-vagas`),
> quadro de cargos (`cargos-quadro-cargos`) e relatório anual de governança (`governanca-relatorio-anual`, os
> gráficos viraram tabelas com os mesmos números); árbitros (`arbitros-relatorio-cadastro`) e federações
> (`federacoes-relatorio`, `federacoes-relatorio-paisagem`); organograma em lista (`organograma-lista`) e desenhado
> (`organograma-desenho`, A4 paisagem com bloco próprio de diagrama; o que não cabe vai para a página seguinte
> repetindo o topo). O bloco `secao` ganhou `reservaAbaixo` (mm livres exigidos abaixo do título, padrão 16).
> Cores por tipo/status e "(VAGO)" colorido viraram texto. Plano:
> [`superpowers/plans/2026-10-20-padrao-relatorios-onda4.md`](./superpowers/plans/2026-10-20-padrao-relatorios-onda4.md).

> **Onda 5 (20/10/2026, limpeza):** o relatório de portarias da Central de Portarias
> (`src/components/portarias/RelatorioPortariasDialog.tsx`, que desenhava o PDF com `jsPDF` dentro do componente)
> virou `portarias-relatorio` (retrato) e `portarias-relatorio-paisagem` (a tela escolhe paisagem acima de 6
> colunas). Filtro, ordenação, agrupamento e formatação ficam em `src/lib/relatorioPortarias.ts`; o diálogo mantém
> título, subtítulo, agrupamento (status, categoria, unidade, mês, nº de servidores), colunas, filtros, ordenação,
> resumo por status e subtotal/total geral. Texto que o antigo cortava (título, ementa, unidade, cargo) quebra
> linha; a categoria sai com o rótulo, não com o código; agrupamento, ordenação e filtros aplicados passam a ser
> impressos. O interruptor "Incluir logos" saiu: cabeçalho e logos vêm do motor (identidade do tenant), e o
> subtítulo padrão com o nome do órgão escrito à mão também.
>
> **Declarações do servidor (onda 5, 20/10/2026):** ficam no sistema (decisão do dono: são formulários do servidor, não
> atos do SEI). As três cópias de cada declaração (`pdfGenerator`, `pdfModelos`, `pdfDeclaracoes`, preenchidas e em
> branco) viraram um modelo cada em `src/lib/documentos/modelos/declaracoes/`: `declaracoes-acumulacao`,
> `declaracoes-bens`, `declaracoes-residencia` e a relação de documentos do cadastro (`declaracoes-relacao-documentos`,
> agora também na tela Modelos de Documentos). Sem `servidor`, sai a versão em branco (campos com linha para preencher
> à mão); as telas usam `src/lib/declaracoesServidor.ts`. Texto: o de `pdfModelos` (o mais completo), com o quadro
> descrição/valor e total de `pdfGenerator` e o compromisso de atualizar/comunicar mudanças das outras cópias. Nome do
> órgão vem de `identidade.nomeOficial` e o local de `localDaSede()`; saíram "Boa Vista/RR", "IDJUV", a UF padrão no
> endereço e a linha "Departamento de Recursos Humanos" do cabeçalho. Para caber numa página com a assinatura, o
> quadro de bens tem 5 linhas (antes 8 a 10) e a acumulação não pede mais carga horária/horário (só o modelo do portal
> pedia). `pdfDeclaracoes.ts` foi apagado.

## 1. Famílias

Todo documento pertence a uma família; cada família tem um layout-base.

> **Ato formal está fora do escopo (12/10/2026).** Portaria, memorando, termo, requerimento e DFD/ETP/TR são
> redigidos, assinados e publicados **no SEI** (despachos do Workflow: decisão pendente, §2; as declarações do servidor ficam no sistema, decidido em 20/10/2026). O sistema não gera o texto: ele só
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
se o documento é ato do SEI ou formulário/relatório do sistema (requisição de material,
relatório de viagem, termo de responsabilidade patrimonial, despachos do Workflow).

| arquivo | linhas | exports | telas | libs | família | fase |
|---|---|---|---|---|---|---|
| pdf/rh/memorandoDesignacao.ts (removido na onda 5 (ato do SEI)) | 181 | `generateMemorandoDesignacao` | 1 | 0 | Ato (fora do escopo) | removido na onda 5 (ato do SEI): a designação continua registrada na aba do servidor |
| blocoCedencias.ts (removido na onda 2) | 108 | — | 0 | 1 | Ficha (blocos da ficha de unidade) | migrado na onda 2: `unidades-ficha-unidade-local` |
| blocoEstrutura.ts (removido na onda 2) | 90 | — | 0 | 1 | Ficha (blocos da ficha de unidade) | migrado na onda 2: `unidades-ficha-unidade-local` |
| blocoIdentificacao.ts (removido na onda 2) | 73 | — | 0 | 1 | Ficha (blocos da ficha de unidade) | migrado na onda 2: `unidades-ficha-unidade-local` |
| blocoLocalizacao.ts (removido na onda 2) | 61 | — | 0 | 1 | Ficha (blocos da ficha de unidade) | migrado na onda 2: `unidades-ficha-unidade-local` |
| blocoPatrimonio.ts (removido na onda 2) | 137 | — | 0 | 1 | Ficha (blocos da ficha de unidade) | migrado na onda 2: `unidades-ficha-unidade-local` |
| blocoResponsavel.ts (removido na onda 2) | 79 | — | 0 | 1 | Ficha (blocos da ficha de unidade) | migrado na onda 2: `unidades-ficha-unidade-local` |
| unidades/index.ts (removido na onda 2) | 13 | — | 0 | 0 | Ficha (blocos da ficha de unidade) | migrado na onda 2: `unidades-ficha-unidade-local` |
| pdfCPSI.ts (removido na onda 5 (ato do SEI)) | 359 | `generateDFD`, `generateETP`, `generateTR` | 1 | 0 | Ato (fora do escopo) | removido na onda 5 (ato do SEI), com a tela CPSI e a rota `/formularios/cpsi` |
| `src/lib/pdfContracheque.ts` | 33 | `generateContracheque`, `generateContrachequeEmLote` | 4 | 0 | Comprovante | migrado na onda 3: `folha-contracheque` |
| pdfDeclaracoes.ts (removido na onda 5) | 219 | `gerarDeclaracaoNaoAcumulacao`, `gerarDeclaracaoBensValores` | 1 | 0 | Ficha (declaração do servidor; fica no sistema, decidido em 20/10/2026) | migrado na onda 5: `declaracoes-acumulacao`, `declaracoes-bens` |
| `src/lib/pdfFederacoesModular.ts` | 747 | `isMandatoExpirado`, `gerarFichaFederacaoPDF`, `gerarRelatorioListagemPDF` | 0 | 0 | Ficha + Relatório (dividir) | removido no P10 (código morto) |
| `src/lib/pdfFichaCadastroGeral.ts` | 380 | `listarCamposPdf`, `gerarFichaCadastroGeral`, `downloadFichaCadastroGeral` | 1 | 0 | Ficha | fica como está: preenche o formulário oficial do governo (pdf-lib) |
| `src/lib/pdfFichaUnidadeLocal.ts` | 117 | — | 1 | 0 | Ficha | migrado na onda 2: `unidades-ficha-unidade-local` |
| `src/lib/pdfFrequenciaLote.ts` | 141 | `generateFrequenciaLotePDFInternal`, `generateFrequenciaLotePDF`, `generateFrequenciaLoteBlob` | 1 | 0 | Comprovante | migrado na onda 3: `rh-folha-frequencia` |
| `src/lib/pdfFrequenciaMensalGenerator.ts` | 234 | `gerarRegistrosDiariosBranco`, `calcularResumoMensal`, `paraFolhaFrequencia`, `localDaSede`, `generateFrequenciaMensalPDF`, `generateFrequenciaMensalBlob` | 2 | 1 | Comprovante | migrado na onda 3: `rh-folha-frequencia` |
| `src/lib/pdfGenerator.ts` | 1075 | `generateTermoDemanda`, `generateOrdemMissao`, `generateRelatorioViagem`, `generateRequisicaoMaterial`, `generateTermoResponsabilidade`, `generateDocumentNumber`, `generateRelatorioCargos`, `generateRelatorioGovernancaPDF`, `generateFichaCadastral`, `generateDeclaracaoAcumulacao`, `generateDeclaracaoBens`, `generateDeclaracaoResidencia`, `generateFichaCadastralModelo`, `generateDeclaracaoAcumulacaoModelo`, `generateDeclaracaoBensModelo` | 14 | 1 | Misto (dividir por documento) | SEI (atos; decisão pendente p/ requisição de material, relatório de viagem, termo de responsabilidade) / F3 / F4; ficha cadastral migrada na onda 2 (`rh-ficha-cadastral`); relatórios de cargos e de governança migrados na onda 4; declarações migradas na onda 5: `declaracoes-acumulacao`, `declaracoes-bens`, `declaracoes-residencia` |
| `src/lib/pdfInstitucional.ts` | 656 | `CORES_INSTITUCIONAIS`, `MARGENS`, `TIPOGRAFIA`, `carregarLogos`, `getDimensoesPagina`, `gerarCabecalhoInstitucional`, `gerarRodapeInstitucional`, `adicionarSecao`, `adicionarTituloSecao`, `adicionarCampo`, `adicionarCampoInline`, `verificarQuebraPagina`, `criarDocumentoInstitucional`, `finalizarDocumentoInstitucional` | 0 | 4 | Base (a eliminar) | F5 |
| `src/lib/pdfListagemUnidades.ts` | 15 | `generateListagemUnidades` | 1 | 0 | Relatório | migrado na onda 4: `unidades-listagem` |
| `src/lib/pdfLogos.ts` | 81 | `LOGO_ASPECTOS`, `calcularDimensoesLogos`, `LOGO_CONFIG_PADRAO`, `getLogosPDF` | 0 | 5 | Base (a eliminar) | F5 |
| `src/lib/pdfMemorandoLotacao.ts` | 203 | `generateMemorandoLotacao`, `downloadMemorandoLotacao` | 0 | 0 | Ato (fora do escopo) | removido no P10 (código morto) |
| `src/lib/pdfMiniCurriculo.ts` | 453 | `gerarPdfMiniCurriculo` | 2 | 0 | Ficha | migrado na onda 2: `curriculo-mini-curriculo` |
| `src/lib/pdfModelos.ts` | 1335 | `generateRelacaoDocumentosModelo`, `generateFichaCadastralModelo`, `generateDeclaracaoAcumulacaoModelo`, `generateDeclaracaoAcumulacaoPreenchida`, `generateDeclaracaoBensModelo`, `generateDeclaracaoBensPreenchida`, `generateTermoDemandaModelo`, `generateOrdemMissaoModelo`, `generateRelatorioViagemModelo`, `generateRequisicaoMaterialModelo`, `generateTermoResponsabilidadeModelo` | 2 | 0 | Misto (dividir por documento) | SEI (termos; decisão pendente) / F3 / F4; ficha cadastral migrada na onda 2 (`rh-ficha-cadastral`); declarações e relação de documentos migradas na onda 5: `declaracoes-acumulacao`, `declaracoes-bens`, `declaracoes-relacao-documentos` |
| `src/lib/pdfOrganograma.ts` | 108 | `gerarOrganogramaPDF`, `gerarOrganogramaListaPDF` | 2 | 0 | Relatório | migrado na onda 4: `organograma-lista`, `organograma-desenho` |
| pdfPortarias.ts (removido em 12/10/2026) | 930 | `generatePortariaUnificadaPdf`, `generatePortariaColetivaComTabela`, `generatePortariaNomeacao`, `generatePortariaExoneracao`, `generatePortariaDesignacao` | 2 | 1 | Ato (fora do escopo) | remover / substituir por registro do SEI |
| `src/lib/pdfRelatorioAgrupadoPortaria.ts` | 298 | `generateRelatorioAgrupadoPortaria` | 1 | 0 | Relatório | migrado na onda 1: `rh-agrupado-portaria` |
| `src/lib/pdfRelatorioArbitros.ts` | 40 | `gerarRelatorioArbitrosPDF` | 1 | 0 | Relatório | migrado na onda 4: `arbitros-relatorio-cadastro` |
| `src/lib/pdfRelatorioAvancado.ts` | 468 | `gerarRelatorioPDF` | 1 | 0 | Relatório | migrado na onda 1: `relatorios-colunas-dinamicas` (+ `-paisagem`) |
| `src/lib/pdfRelatorioCargos.ts` | 31 | `gerarRelatorioCargos98PDF` | 1 | 0 | Relatório | migrado na onda 4: `cargos-quadro-cargos` |
| `src/lib/pdfRelatorioContatosEstrategicos.ts` | 268 | `gerarRelatorioContatosEstrategicos` | 1 | 0 | Relatório | migrado na onda 1: `rh-contatos-estrategicos` |
| `src/lib/pdfRelatorioEstrutura.ts` | 251 | `generateRelatorioEstruturaPDF` | 1 | 0 | Relatório | migrado na onda 1: `relatorios-estrutura-organizacional` |
| `src/lib/pdfRelatorioFederacoes.ts` | 82 | `gerarRelatorioFederacoesPDF` | 1 | 0 | Relatório | migrado na onda 4: `federacoes-relatorio`, `federacoes-relatorio-paisagem` |
| `src/lib/pdfRelatorioFolhaSimplificado.ts` | 333 | `gerarRelatorioFolhaSimplificado` | 1 | 0 | Relatório | migrado na onda 1: `relatorios-folha-simplificada` |
| `src/lib/pdfRelatorioFrequencia.ts` | 386 | `generateRelatorioFrequenciaGeral`, `generateRelatorioFrequenciaIndividual` | 2 | 1 | Relatório | migrado na onda 1: `rh-frequencia-geral`, `rh-frequencia-individual` |
| `src/lib/pdfRelatorioPendencias.ts` | 320 | `gerarPdfRelatorioPendencias` | 2 | 0 | Relatório | migrado na onda 1: `rh-pendencias-pre-cadastros` |
| `src/lib/pdfRelatorioPendenciasServidores.ts` | 348 | `gerarPdfRelatorioPendenciasServidores` | 1 | 0 | Relatório | migrado na onda 1: `rh-pendencias-servidores` |
| `src/lib/pdfRelatorioReunioes.ts` | 29 | `gerarPdfListaConvocados`, `gerarPdfListaPresenca`, `gerarPdfRelatorioReuniao` | 1 | 0 | Comprovante (lista de presença/convocados) + Relatório (ata) | migrado na onda 3: `reunioes-lista-convocados`, `reunioes-lista-presenca`, `reunioes-relatorio` |
| `src/lib/pdfRelatorioSegundoVinculo.ts` | 224 | `gerarRelatorioSegundoVinculo` | 1 | 0 | Relatório | migrado na onda 1: `rh-segundo-vinculo` |
| `src/lib/pdfRelatorioServidoresDiretoria.ts` | 362 | `gerarRelatorioServidoresDiretoria` | 1 | 0 | Relatório | migrado na onda 1: `rh-diretoria-hierarquia` |
| `src/lib/pdfRelatorioSituacaoPortaria.ts` | 297 | `generateRelatorioSituacaoPortaria` | 1 | 0 | Relatório | migrado na onda 1: `rh-situacao-portaria` |
| `src/lib/pdfRelatorioUnidades.ts` | 23 | `downloadRelatorioUnidadesPDF` | 1 | 0 | Relatório | migrado na onda 4: `unidades-relatorio-unidades-locais` |
| `src/lib/pdfRelatoriosAfastamentos.ts` | 375 | `addCabecalhoTabela`, `addLinhaTabela`, `quebrarComCabecalho`, `addTituloGrupo`, `addLinhaTotal`, `finalizar`, `gerarRelatorioFerias`, `gerarRelatorioLicencas`, `gerarRelatorioViagens` | 3 | 1 | Relatório | migrado na onda 1: `rh-ferias`, `rh-licencas`, `rh-viagens` |
| `src/lib/pdfRelatoriosFolha.ts` | 231 | `gerarResumoFolhasAno`, `gerarFolhaPorUnidade`, `gerarFolhaPorRubrica` | 1 | 0 | Relatório | migrado na onda 1: `rh-folha-resumo-ano`, `rh-folha-por-unidade`, `rh-folha-por-rubrica` |
| `src/lib/pdfRelatoriosRH.ts` | 918 | `generateRelatorioServidoresDiretoria`, `generateRelatorioServidoresVinculo`, `generateRelatorioHistoricoFuncional`, `generateRelatorioVagasCargo`, `generateRelatorioServidoresPortarias` | 1 | 0 | Relatório | migrado na onda 1: `rh-servidores-diretoria`, `rh-servidores-vinculo`, `rh-historico-funcional`, `rh-vagas-cargo`, `rh-servidores-portarias` |
| `src/lib/pdfTemplate.ts` | 878 | `CORES`, `loadImageWithDimensions`, `calculateLogoDimensions`, `loadLogos`, `PAGINA`, `getPageDimensions`, `setColor`, `generateInstitutionalHeader`, `generateInstitutionalFooter`, `addPageNumbers`, `addSectionHeader`, `addSectionTitle`, `addField`, `addFieldWithLine`, `addTextArea`, `addCheckbox`, `addSignatureArea`, `addLocalData`, `addTableHeader`, `addTableRow`, `formatCPF`, `formatDate`, `formatCurrency`, `generateDocumentNumber`, `checkPageBreak`, `VINCULO_LABELS`, `SITUACAO_LABELS`, `CATEGORIA_LABELS`, `cabecalhoOficial`, `nomeOficialDocumentos`, `nomeEntidadeSuperiorDocumentos`, `rodapeOficial` | 2 | 34 | Base (a eliminar) | F5 |
| `src/lib/pdfTermoAutorizacao.ts` | 210 | `generateTermoAutorizacao` | 0 | 0 | Ato (fora do escopo) | removido no P10 (código morto) |
| pdfTermoCessao.ts (removido na onda 5 (ato do SEI)) | 138 | `generateTermoCessao` | 1 | 0 | Ato (fora do escopo) | removido na onda 5 (ato do SEI): o termo continua registrado na aba da unidade |
| `src/lib/pdfTermoResponsabilidade.ts` | 181 | `generateTermoResponsabilidade` | 0 | 0 | Ato (fora do escopo) | removido no P10 (código morto) |
| portariaPdf.ts (removido em 12/10/2026) | 150 | `buildPortariaPdfDoc`, `savePortariaPdf` | 1 | 0 | Ato (fora do escopo) | remover / substituir por registro do SEI |

Fora de `src/lib` (não entrou na medição acima): `src/components/portarias/RelatorioPortariasDialog.tsx`, relatório
de portarias desenhado no próprio componente; migrado na onda 5: `portarias-relatorio`, `portarias-relatorio-paisagem`.

### Documentos dentro de arquivos multiuso

- `pdfGenerator.ts` (2.289 linhas, 14 telas): termo de demanda, ordem de missão, relatório de viagem,
  requisição de material, termo de responsabilidade, declarações (acumulação, bens, residência), ficha cadastral
  (+ versões "Modelo" em branco), relatório de cargos e relatório de governança. Mistura Ato (vai para o SEI),
  Ficha e Relatório;
  `generateTermoResponsabilidade` duplica `pdfTermoResponsabilidade.ts` e as `*Modelo` duplicam `pdfModelos.ts`.
- `pdfModelos.ts` (1.335 linhas, 2 telas): versões em branco (`*Modelo`) e preenchidas (`*Preenchida`) de ficha cadastral,
  declarações e termos, mais relação de documentos. Candidato a virar o mesmo modelo com `dados` opcionais.
- pdfCPSI.ts: DFD, ETP e TR (documentos de contratação) — atos, feitos no SEI; removido na onda 5 (ato do SEI), junto com a tela CPSI.
- `pdfFederacoesModular.ts` (747 linhas, **0 telas**): ficha de federação (Ficha) e listagem (Relatório); `isMandatoExpirado` é regra de negócio, não de PDF.
- `pdfRelatorioReunioes.ts`: lista de convocados e de presença (Comprovante) e relatório da reunião (Relatório); migrados na onda 3.
- `pdfRelatoriosAfastamentos.ts`: exportava helpers de tabela (`addCabecalhoTabela`, `quebrarComCabecalho`…) além dos relatórios; na onda 1 os helpers foram apagados e o bloco `tabela` os substituiu.
- `pdfInstitucional.ts` e `pdfTemplate.ts`: bases concorrentes (34 libs importam `pdfTemplate`, 4 `pdfInstitucional`, 5 `pdfLogos`); saem na F5.

### Achados do inventário

- **Sem chamador em `src/` (0 telas, 0 libs):** `pdfMemorandoLotacao.ts`, `pdfTermoAutorizacao.ts`, `pdfTermoResponsabilidade.ts`, `pdfFederacoesModular.ts`. Removidos no P10 (16/10/2026), com autorização do dono.
- **Despachos do Workflow** não aparecem na tabela (não são `src/lib/pdf*`), mas seguem a mesma regra: decisão pendente do dono.
- **Duplicações:** termo de responsabilidade (3 lugares); a ficha cadastral (3) virou um modelo na onda 2 e as declarações (3) viraram um modelo cada na onda 5.
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
7. **Use na tela** com `emitirDocumento('<tipo>', dados, { emitidoPor })` e `baixarDocumento(...)`. O estilo
   configurado na tela (letra, zebra, cabeçalho, rodapé, orientação) entra sozinho: o modelo não lê nem repete
   essas escolhas. Blocos usam `ctx.fonte` (a escala configurada), nunca `FONTE` direto.
8. **Gate**: `bash scripts/gate.sh` verde.

Se faltar um bloco (ex.: lista numerada, QR), crie em `blocos/`, exporte em `blocos/index.ts` e teste;
não desenhe direto no `doc` dentro de um modelo.

## 4. Anatomia

```
src/lib/documentos/
  tipos.ts            Familia, MarcaImpressao, EstiloImpressao, ContextoDocumento, Bloco, DocumentoModelo
  core/               tokens, texto, pintura, familias, pagina (único `new jsPDF`), moldura, renderizar
  blocos/             titulo, secao, paragrafo, localData, camposChaveValor, tabela, assinaturas, carimbo, quebraPagina
  modelos/            um arquivo declarativo por documento (hoje só `amostras.ts`, da pré-visualização da configuração)
  registro.ts         REGISTRO: única lista de documentos do sistema
  marca.ts            marcaDoTenant e estiloDoTenant (puros) · logos.ts: carregarLogo (navegador)
  emitir.ts           emitirDocumento / baixarDocumento (casca do navegador)
  __testes__/         lerPdf, fixtures, modelosReferencia e os testes (vitest)
```

| Token | Valor |
|---|---|
| Página | A4; margens 20 mm (laterais), 18 mm (topo), 22 mm (rodapé, inclui a faixa do rodapé); escala de espaço 4 / 8 / 12 / 16 mm |
| Tipografia | relatório, ficha e comprovante em **Helvetica** (fonte nativa do PDF) |
| Escala | normal: título 14 pt · seção 11 pt · corpo 10,5 pt · tabela 9 pt · rótulo 8 pt · rodapé 7,5 pt; compacto e grande: ±1 pt (`ESCALAS` em `core/tokens.ts`; rodapé fixo) |
| Cor | primária = cor do tenant (se tiver < 4,5:1 sobre branco, cai para o texto neutro); neutros slate |
| Preto e branco | significado nunca só por cor: zebra leve, réguas, rótulos |

**Cabeçalho:** na 1ª página, logo da entidade superior à esquerda, logo do órgão à direita, nomes e até 2 linhas
de unidade emissora ao centro, título e protocolo; nas demais, cabeçalho compacto com protocolo.
**Rodapé (todas as páginas):** sistema (+ texto do rodapé configurado, cortado numa linha), "emitido por … em …"
(ou só a data, se a configuração esconder o emissor) e "Página X de Y"; comprovantes ganham a linha
"Documento emitido eletronicamente".

## 5. Protocolo

A camada **imprime** o protocolo que o modelo devolve em `protocolo(dados)`; ela não numera. Hoje só o
RH numera seus registros (`RH-AAAA-NNNNNN`, RPCs de `src/lib/rhRpc.ts`); o número do ato formal vem do SEI. Numerar documentos de outros módulos
exige tabela/RPC com RLS (decisão e spec próprias; fora de escopo desta fase).

## 6. Limitações conhecidas

- Fontes nativas do PDF (Times/Helvetica): caracteres fora do WinAnsi (emoji, `ł`, `ž`, `✓`…) saem como `?`.
- **Assinatura isolada em página:** os blocos `assinaturas` e `carimbo` são indivisíveis; se faltarem poucos
  milímetros, vão sozinhos para a página seguinte. Deixou de ser obrigatória (era da F2, cancelada); vale criar
  "manter junto" se uma ficha ou relatório vier a usar assinatura. Hoje `assinaturas` é usado pela
  frequência individual (`rh-frequencia-individual`); `carimbo` é usado pelo comprovante de referência.
- **Lote com uma parte por página:** o bloco `quebraPagina()` começa a próxima parte (um servidor, uma lista)
  em página nova; use entre as partes, não antes da primeira. Se a página atual (2ª em diante) ainda está vazia,
  não faz nada, para não gerar página em branco. Criado na onda 3 (comprovantes em lote).
- Cabeçalho/rodapé: nome do órgão muito longo no cabeçalho compacto (páginas 2+) pode encostar no protocolo, e `emitidoPor` muito longo no rodapé pode encostar em "Página X de Y"; logo mais largo que 3,2:1 sai achatado (limite de 45 mm de largura com 14 mm de altura). Nenhum tenant atual passa desses limites.
- `tabela` não valida `colunas` vazio nem `peso <= 0` (erro de programação, lança); rótulo de campo maior que a coluna é cortado na 1ª linha.
- O logo entra no PDF em resolução total (peso do arquivo); reduzir no canvas é melhoria futura.
- Não há QR de verificação pública (fase opcional pós-F5).
- A comparação antes/depois (`scripts/documentos-comparar.mjs`) usa poppler: roda na VPS, não no CI.

<!-- doc-links-absent: blocoCedencias.ts, blocoEstrutura.ts, blocoIdentificacao.ts, blocoLocalizacao.ts, blocoPatrimonio.ts, blocoResponsavel.ts, src/lib/pdfFederacoesModular.ts, src/lib/pdfMemorandoLotacao.ts, src/lib/pdfTermoAutorizacao.ts, src/lib/pdfTermoResponsabilidade.ts, pdfTermoResponsabilidade.ts, pdfFederacoesModular.ts, pdfMemorandoLotacao.ts, pdfTermoAutorizacao.ts, pdfDeclaracoes.ts -->

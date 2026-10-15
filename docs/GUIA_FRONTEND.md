# Guia do Front-end

## Estrutura de `src/`

```
src/
├── App.tsx                # Providers + todas as rotas
├── main.tsx               # Bootstrap + registro do PWA
├── pages/                 # ~241 páginas por domínio (rh/, financeiro/, admin/, ...)
├── components/            # ~282 componentes
│   ├── ui/                # shadcn/ui (base — evitar editar à toa)
│   ├── auth/, layout/, menu/, navigation/, public/
│   └── <dominio>/         # rh/, financeiro/, inventario/, folha/, cms/, ...
├── hooks/                 # ~80 hooks use<Dominio> (camada de dados)
├── contexts/              # AuthContext, MenuContext
├── config/                # menu.config.ts, module-menus.config.ts, segadFieldsConfig.ts
├── shared/config/         # modules.config.ts (fonte da verdade dos módulos)
├── modules/               # re-exports de config + dashboards de módulo
├── types/                 # tipos de domínio (auth, rh, folha, financeiro, ...)
├── lib/                   # cálculos + geradores (PDF/Word/CNAB/eSocial) + utils
├── export/                # exportCSV.ts, exportExcel.ts
├── integrations/supabase/ # client.ts (gerado), types.ts (gerado)
└── services/              # serviços específicos
```

Alias de import: **`@` → `src/`** (use `@/...`, não caminhos relativos longos).

## Hooks (camada de dados)

Toda leitura/escrita no Supabase passa por um hook `use<Coisa>` (React Query +
`supabase`). Categorias:

- **Dashboards**: `use<Modulo>DashboardStats` (Admin, RH, Financeiro, Patrimônio,
  Compras, Contratos, Comunicação, Governança, Integridade, Programas,
  Transparência, Workflow, Gestores Escolares).
- **RH / folha**: `useServidorCompleto`, `useServidoresPorUnidade`,
  `useVinculosServidor`, `useConfigVidaFuncional`, `useGestaoLotacao`,
  `useDesignacoes`, `useComissoes` (comissões e membros), `useFrequencia`, `useFrequenciaPacotes`,
  `useParametrizacoesFrequencia`, `useGerarFrequenciaPDF`, `useFolhaPagamento`,
  `useFolhaCalculos`, `useMotorFolha`, `useFechamentoFolha`, `useContracheque`,
  `useRHIntegracoes`, `useRelatorios`, `usePortarias`, `usePreCadastro`.
- **Financeiro**: `useFinanceiro` (inclui `useResumoOrcamentario`, `useUltimaImportacaoQdd`,
  `useCriarSolicitacao`, `useCriarContaBancaria`), `useAlteracoesOrcamentarias` (inclui
  `useConfirmarAlteracaoFiplan`), `useSubEmpenhos`, `useRestosAPagar`,
  `useConciliacaoBancaria` (movimentos dos arquivos do banco, conciliação manual, reenvio Gestão MAX, detalhe do
  pagamento e chamadas à Edge Function `bb-api`: `useStatusBB`, `useValidarContaBB`, `useImportarExtratoBB`).
  Tipos da conciliação em `src/types/conciliacaoBancaria.ts`.
- **Exercício do Financeiro** (`src/hooks/useExercicioFinanceiro.ts`): ano orçamentário compartilhado pelas telas
  do módulo. Lê `?exercicio=` da URL; sem ele, o último ano escolhido no navegador (`localStorage`,
  chave `financeiro:exercicio`); sem nenhum, o ano atual. Faixa: 2024 até o ano seguinte ao atual. Devolve
  `exercicio`, `setExercicio` (grava na URL com `replace` e no navegador), `exercicios` (anos do seletor) e
  `comExercicio(href)` para links internos levarem o ano. A UI é `SeletorExercicio`
  (`src/components/financeiro/SeletorExercicio.tsx`). Tela nova do financeiro que filtra por ano deve usar este
  hook, não um `useState` próprio.
- **Patrimônio**: `usePatrimonio`, `useCadastroLote`, `useCadastroBemSimplificado`,
  `useMovimentacaoLote`, `useAlmoxarifado`, `useColetaOffline`. Inventário de
  campo: `useVistoriaInventario` (unidades da campanha, situação, fotos com URL
  assinada, importação de KML), `useFilaFotosVistoria` (fila offline de fotos),
  `useGeolocalizacao` (posição e precisão do GPS); tipos em
  `src/types/inventarioCampo.ts`.
- **Comunicação/CMS**: `useCMSConteudos`, `useCMSBanners`, `useCMSGalerias`,
  `useCalendarioComunicacao`, `useDemandasAscom`.
- **Admin/segurança**: `useAdminUsuarios`, `useUsuarios`, `usePermissions`,
  `usePermissoesUsuario`, `useRBAC`, `useApprovalRequests`, `useAuditLog`,
  `useTrilhaAuditoria` (trilha de auditoria e `useRegistrarEvento`; ver abaixo),
  `useLancamentoPorSetor` (regra de lançamento por setor; ver abaixo),
  `useBackupOffsite`, `useDatabaseSchema`, `useModuleSettings`,
  `useConfigPaginasPublicas`, `useFormFieldConfig`.
- **Organização**: `useOrganograma`, `useInstituicoes`, `useAgrupamentoUnidades`,
  `usePortalDiretoria`, `useEscolasJer`, `useFederacoesRelatorio`,
  `useGestoresEscolares`.
- **Transparência (portal público)**: `useTransparenciaPublicacoes`, `useTransparenciaCargos`
  (quadro de cargos pela RPC pública `transparencia_cargos_publicos`; como a RPC ainda não está nos
  tipos gerados, a chamada usa `supabase.rpc("…" as never)` e tipa a linha no próprio hook).
- **UI/navegação**: `useSidebarCollapse`, `useModuleRouter`, `useModulosUsuario`,
  `use-toast`.

**Padrão:** ao precisar de dados de um domínio, estenda o hook existente em vez
de chamar `supabase` direto dentro da página.

## Lib (`src/lib`)

- **PDF** (`pdf*.ts`, ~40): base em `pdfTemplate.ts`/`pdfLogos.ts`/`pdfGenerator.ts`.
  Exemplos: `pdfContracheque`, `pdfFrequenciaMensalGenerator`, `pdfPortarias`,
  `pdfOrganograma`, `pdfRelatorioFederacoes`, `pdfRelatoriosRH`,
  `pdfRelatoriosAfastamentos` (férias, licenças, viagens), blocos de unidade em `pdf/`.
- **Relatórios gerenciais de RH** (exemplo de separação hook / regras / PDF / UI):
  `src/hooks/useRelatoriosRH.ts` (queries com colunas explícitas, filtro de período por
  sobreposição no banco, paginação), `src/lib/relatoriosRHRegras.ts` (regras puras, sem
  DOM nem Supabase: agrupamento, somas, validação de período, linhas para planilha),
  `src/lib/relatoriosFolhaRegras.ts` (mesmo padrão para a folha: agregação por unidade e
  rubrica, totais, `folhaPermiteDetalhe`), `src/lib/pdfRelatoriosAfastamentos.ts`,
  `src/lib/pdfRelatoriosFolha.ts` e os cards/filtros em `src/components/rh/relatorios/`.
- **Planilhas**: `exportarPlanilha.ts`, `exportarFederacoes.ts`, e `src/export/`.
- **Fiscal/folha**: `cnabGenerator.ts` (CNAB240), `esocialGenerator.ts` +
  `esocialXmlGenerator.ts`, `folhaCalculos.ts`/`folhaCalculoService.ts` (INSS,
  IRRF, consignações), `frequenciaCalculoService.ts`. Fluxo da remessa e do eSocial em
  [Arquivos da folha](#arquivos-da-folha-remessa-cnab-e-esocial-onda-e3).
- **Arquivos bancários** (`src/lib/bancario/`, funções puras, sem Supabase nem DOM):
  `src/lib/bancario/obn600.ts` (leitor da remessa/retorno de ordens bancárias do FIPLAN, linhas de 350 posições),
  `src/lib/bancario/cnab240.ts` (leitor CNAB 240: SEGAD e Gestão MAX, segmentos A e B, ocorrências do retorno),
  `src/lib/bancario/gestaoMaxCnab240.ts` (gerador do arquivo de reenvio no leiaute BB Gestão MAX, com
  `validarRemessaGestaoMax`), `src/lib/bancario/comum.ts` (tipos, decodificação e campos por posição) e
  `src/lib/bancario/exibicao.ts` (rótulos, datas e CPF/CNPJ mascarado para a tela). Não há manual oficial do
  OBN600 no repositório: posições e códigos deduzidos dos arquivos estão marcados "conferir no manual" no código.
- **Utils**: `formatters.ts` (máscaras), `utils.ts` (`cn`, helpers),
  `matriculaUtils.ts`, `statusColors.ts`, `supabase.ts`/`supabaseClient.ts`.
- **Arquivos em bucket privado**: `src/lib/storageArquivos.ts`. Use ao gravar ou abrir arquivo de bucket
  privado do Storage: o banco guarda o **caminho** dentro do bucket (não a URL pública) e a leitura é por URL
  assinada de curta duração.
  - `abrirArquivoPrivado(bucket, valor)`: abre em nova aba por URL assinada (60 s por padrão,
    `validadeSegundos` muda). A aba abre ainda no clique, para não ser barrada pelo bloqueador de pop-up. Em
    erro lança `Error` com mensagem em português pronta para toast, sem detalhe do servidor.
  - `caminhoNoBucket(bucket, valor)`: devolve o caminho a partir de um caminho ou de uma URL antiga do Storage
    (`/object/public|sign/<bucket>/...`), o que mantém abrindo os links gravados antes, sem migração de dados.
    Devolve `null` para URL de outro bucket ou caminho inseguro (`.`/`..`, `/` inicial, `\`, `%`, `?`, `#`).
  - `abrirUrlExterna(valor)`: abre um link já gravado só se for `http(s)` (barra `javascript:` e afins). Para
    links que ainda não passaram para caminho + URL assinada (hoje, os documentos expedidos da tabela
    `documentos` na mesma aba).
  - Primeiro uso: `DocumentosServidorTab` (bucket `documentos-requerimento`, Onda B / B3).
- **Inventário de campo**: `src/lib/filaFotosOffline.ts` (IndexedDB sem dependência,
  banco `inventario-campo`, store `fotos-pendentes`; também comprime a imagem e
  calcula o SHA-256) e `src/lib/kml.ts` (lê KML no navegador com `DOMParser` e devolve
  ponto/polígono em GeoJSON por placemark).

## Fila offline de fotos (IndexedDB)

Usada na vistoria de unidade do `/patrimonio-mobile`. `useFilaFotosVistoria`
captura, comprime, calcula o hash e grava a foto (Blob + metadados) no IndexedDB;
envia ao montar, quando o navegador volta a ficar `online` e sob demanda. O envio
é idempotente: o `id` da foto é gerado no aparelho, o upload no storage usa
`upsert: false` e trata "já existe" como enviado, e violação de unicidade
(`23505`) no INSERT também conta como enviado. Diferente de `useColetaOffline`
(coleta de bens), esta fila guarda arquivos binários.

## Mapa (Leaflet)

`src/components/inventario/MapaUnidadesCampanha.tsx` usa `leaflet` +
`react-leaflet` 4.x (compatível com React 18), com camadas de satélite (Esri
World Imagery) e ruas (OpenStreetMap), ambas com atribuição visível. Os tiles
vêm direto desses serviços, sem cache offline. Os termos de uso da Esri para uso
institucional ainda precisam ser confirmados antes de produção.

## Importação de dados (`src/lib/importacao`)

Estrutura genérica para trazer dados de arquivos de outros sistemas, sempre em três passos:
**ler** (no navegador) → **simular** (o banco diz o que mudaria, nada é gravado) → **aplicar**
(transação + log em `importacoes`).

- `types.ts` — contrato `Importador<TLinha>`: `id` (vira `importacoes.tipo`), `modulo`, `permissao`,
  `aceita`, `colunas` da pré-visualização, `ler(arquivo)` → `ResultadoLeitura` (linhas + problemas
  `erro`/`aviso` + cabeçalho + parâmetros) e `enviar(leitura, arquivo, simular)` → `ResultadoBanco`
  (ação por linha: `inserir`/`atualizar`/`sem_alteracao`, cadastros criados, ausentes, totais).
- `registro.ts` — lista `IMPORTADORES` (a Central mostra os que o usuário tem permissão de usar).
- `pdfTexto.ts` — texto posicionado de PDF via pdf.js (carregado sob demanda), agrupado em linhas,
  para relatórios tabulares em que colunas vazias somem no texto corrido.
- `importadores/qddFiplan*.ts` — primeiro importador: PDF do QDD do FIPLAN → `importar_qdd_fiplan`.
- `src/lib/importacao/importadores/arquivoBancario.ts` — arquivo do banco → `importar_arquivo_bancario`
  (`id` `arquivo_bancario`, permissão `pagamento.conciliar`, aceita `.txt`, `.ret`, `.rem`). Decide o formato
  pela largura da primeira linha (350 = OBN600, 240 = CNAB 240) e usa os leitores de `src/lib/bancario/`;
  largura diferente é erro de leitura. O cabeçalho da prévia mostra formato, remessa/retorno, data, quantidade,
  total e se o total confere com o trailer. CPF/CNPJ aparece mascarado na prévia.
- `importadores/portariasPlanilha.ts` + `portariasPlanilhaParser.ts` — planilha de portarias (XLSX, XLS ou CSV) →
  `importar_portarias_planilha` (`id` `portarias_planilha`, módulo `gabinete`, permissão `gabinete.portarias.importar`).
  Uma linha por portaria, no modelo do assistente; o parser (função pura, testada com vitest) valida formato,
  obrigatórios, datas e número repetido no arquivo e monta o contrato da RPC (`paraContrato`: datas AAAA-MM-DD,
  vazio = `null`, matrículas em lista, `status_informado` `true` quando a coluna Situação veio preenchida e `false`
  quando o parser aplicou o padrão); a RPC confere tudo de novo, inclusive matrículas e o que já existe.
  Identifica o servidor só por matrícula (sem CPF). Invalida as chaves de `usePortarias` (`portarias`, `portaria`,
  `portarias-servidor`, a seção da ficha do servidor) e `portarias-para-ato` (`useGestaoLotacao`). Regras de negócio: [BANCO_DE_DADOS.md](./BANCO_DE_DADOS.md#importar-portarias-importar_portarias_planilha).
- `planilha.ts` — helpers de planilha compartilhados (mesma lógica da importação do quadro de vagas, que mantém a
  sua cópia): `lerPrimeiraAba`
  (XLSX/XLS/CSV; CSV em UTF-8 ou Windows-1252; devolve cabeçalhos e linhas com o número da linha no Excel),
  `normalizarCabecalho` (sem acento, minúsculo, `_`), `campoDoCabecalho`/`mapearColunas` (cabeçalho → chave por
  sinônimos; só chaves próprias do mapa, então "constructor"/"__proto__" não casam),
  `cabecalhosIgnorados`, `linhaVazia`, `paraTexto`, `paraDataIso` (série do Excel, `Date`, `dd/mm/aaaa` ou
  `AAAA-MM-DD`, sem deslocar o fuso; `null` vazio, `undefined` inválida) e `montarModeloPlanilha`/
  `baixarModeloPlanilha` (gera o `.xlsx`; `colunasTexto` formata colunas como texto `@` até a linha 501, para o
  Excel não converter `3/2026` em data nem tirar zero à esquerda).
- UI: `ImportacaoWizard` e `HistoricoImportacoes` (`src/components/importacao/`), usados por
  `ImportacoesPage` e por telas de módulo (ex.: `QDDPage`, `ConciliacaoBancariaPage`); hook `useImportacoes`.

**Importador novo:** (1) migração com uma RPC `importar_<algo>(…, p_simular boolean)` `SECURITY DEFINER`
que confere a permissão, valida cada linha, devolve o formato de `ResultadoBanco` e, ao aplicar, insere em
`importacoes`; (2) `importadores/<algo>.ts` implementando `Importador`; (3) incluir em `registro.ts`.
Erro de leitura bloqueia a importação; aviso só informa.

**Campos opcionais do contrato `Importador`:** `modelo` (`{ nomeArquivo, gerar }`) mostra o botão "Baixar modelo
(<arquivo>)" no assistente (o de portarias gera `modelo_portarias.xlsx` com a aba "Portarias", só com o cabeçalho e
"Número"/"Matrículas" em formato de texto, e a aba "Como preencher", com as regras e dois exemplos fictícios); `identificarLinha` cita a linha nas mensagens (ex.: "Linha 5 (001/2026)");
`aceitaArquivoVazio`. O `ResultadoBanco` traz `avisos` por linha (informam, não impedem) e `erros`
(`{ indice, mensagem }` por linha, achados pelo banco): com qualquer erro o botão de confirmar fica bloqueado
("Corrija os erros para importar"), o assistente lista os problemas e marca a linha na tabela; a aplicação com erro
não grava nada.

Fora dessa estrutura: a planilha do **quadro de vagas** (`ImportarQuadroVagasDialog`, em `/cargos/vagas`) lê
XLSX/XLS/CSV com `xlsx` e chama a RPC `rh_importar_quadro_vagas` pelo hook `src/hooks/useQuadroVagas.ts` (simular,
depois gravar); não grava em `importacoes` nem aparece na Central. As views e a RPC ainda não estão em `types.ts`:
o hook usa o client sem tipagem, como `useTrilhaAuditoria.ts`.

## Trilha de auditoria no front (onda E2)

Spec: [`superpowers/specs/2026-10-10-rh-trilha-tela-design.md`](./superpowers/specs/2026-10-10-rh-trilha-tela-design.md).
O banco grava quem fez cada lançamento (onda E1); o front consulta a trilha e registra o que não é gravação.

- **Hook** `src/hooks/useTrilhaAuditoria.ts` (as colunas novas de `audit_logs` e a RPC `registrar_evento` ainda não
  estão em `types.ts`: consulta com `supabase as unknown as SupabaseClient`, tipos no próprio hook):
  - `useTrilhaAuditoria(filtros, cursor)`: lista paginada **no servidor** por cursor na `sequencia`
    (`sequencia < cursor`, `limit(n + 1)`; a tela guarda a pilha de cursores para "Anterior"), sem
    `before_data`/`after_data`, ordem só `sequencia` desc (é o que usa os índices); filtros por período, módulo, ação,
    origem, tabela, ID do registro, usuário, servidor responsável (nome/matrícula ou ID) e recorte de ficha (`escopo`):
    servidor (`alvos` contém `s:<id>`) ou folha (`alvos` contém `f:<id>`, módulos `rh` e `folha`). `alvos` é a coluna
    gerada de `audit_logs` com índice GIN (onda E2): junta o `servidor_id`/`folha_id` do antes/depois e dos metadados e
    o `servidor_alvo_id` dos arquivos do Storage (só quando `metadata.fonte = 'storage'`). Com filtro de período, o hook
    busca antes a faixa de `sequencia` do período (com 1 h de folga nas pontas, porque `timestamp` é o início da
    transação) e manda os dois filtros juntos, para não varrer tudo o que é mais novo;
  - `useDetalheTrilha(id)` + `calcularDiff`: a linha completa ao abrir, diff campo a campo (valores já mascarados pelo
    banco; na atualização, os carimbos `updated_*` fora de `campos_alterados` não aparecem);
  - `useRegistrarEvento()`: `registrarAntes(evento)` para exportação, impressão e arquivo — espera o banco e, se
    falhar, mostra o erro e devolve `false` (quem chama **não entrega** o arquivo); `registrarSemBloquear(evento)` para
    visualização. Ações e entidades seguem as listas fechadas da RPC (tipos `AcaoEvento`/`EntidadeEvento`). Metadados
    sem dado pessoal (filtros, formato, quantidade, IDs); `servidor_id`/`folha_id` nos metadados ligam o evento às
    abas de histórico.
- **Componentes** em `src/components/auditoria/`: `TrilhaAuditoria` (filtros, tabela com fonte da linha, paginação,
  diálogo de detalhe e CSV registrado antes do download; o botão só aparece para o admin e para quem tem o módulo
  `rh`, que a RPC exige), `DetalheTrilhaDialog` e
  `HistoricoAlteracoesTab` (aba na ficha do servidor e no detalhe da folha). Descrição e metadados são texto: nada
  vira HTML.
- **CSV sem fórmula:** `celulaCsv` (`src/export/csvSeguro.ts`) põe a célula entre aspas e um apóstrofo antes de
  texto que começa com `=`, `+`, `-`, `@`, tab ou CR (números passam). Usada no CSV da trilha, em
  `src/export/exportCSV.ts` e no CSV de servidores (`src/lib/exportarPlanilha.ts`).
- **Páginas:** `/admin/auditoria` (todos os módulos) e `/rh/auditoria` (mesmo componente, travado no módulo `rh`).
- **Onde `registrar_evento` está ligado:** contracheque (`useLogAcessoContracheque`, que trocou `log_audit` pela
  RPC; impressão individual e em lote em `/rh/contracheques`, `/rh/meu-contracheque`, detalhe da folha e ficha
  financeira), XML do eSocial (baixar e copiar, no diálogo e na aba), arquivo CNAB (registrado antes de gravar a
  remessa; o "baixar de novo" registra de novo),
  planilhas (`/rh/exportar`, `ExportacaoServidoresCard`, cards de `src/components/rh/relatorios/*`, aniversariantes),
  PDFs do RH (relatórios de `/rh/relatorios` e cards avulsos, pendências cadastrais, frequência individual, em lote e
  geral, pacote de frequência, fichas e declarações do servidor, memorando de designação) e o CSV da trilha.
  Visualização sem bloquear: ficha do servidor, ficha financeira, contracheque na consulta, pré-visualização da
  frequência e documentos abertos na ficha.

## Lançamento por setor (fase 1)

Spec: [`superpowers/specs/2026-10-11-lancamento-por-setor-design.md`](./superpowers/specs/2026-10-11-lancamento-por-setor-design.md).
Quem lança no módulo é o servidor lotado no setor dele ou designado para o setor; login sem servidor só consulta. Na
fase 1 a comissão é só cadastro (não vale como fundamento). O banco decide (migração
`supabase/migrations/20261011020000_lancamento_por_setor.sql`, ver [BANCO_DE_DADOS.md](./BANCO_DE_DADOS.md)); nesta
fase só as tabelas do RH são checadas, em modo **registrar** (nada é bloqueado). O modo **exigir** só entra por
migração, módulo a módulo: o banco o recusa pela API. As tabelas e RPCs novas ainda não estão em `types.ts`: os hooks
usam o client sem tipagem, como `useTrilhaAuditoria.ts`.

- **Hook** `src/hooks/useLancamentoPorSetor.ts`:
  - `useFundamentosLancamento(habilitado?)`: RPC `meus_fundamentos_lancamento()` chamada sem argumento, uma linha por
    módulo (`modo`, `permitido`, `bloqueado` = exigir e não permitido, `via`, unidade, `lotacao_id`/`cessao_id`/
    `designacao_id`/`comissao_id` e `ato` jsonb `{tipo, numero, data, doe_numero, doe_data}`), cache de 30 s, sem
    retry; erro (42501 para usuário inativo) não quebra o layout: nenhum aviso. Expõe `doModulo(m)`. A RPC só fala de
    fundamento de **setor**: autoatendimento e chefia não aparecem nela e continuam valendo, então `bloqueado` não
    serve para travar telas do próprio servidor nem de aprovação da chefia (hoje só o aviso o lê);
  - `useRegrasLancamento`/`useSalvarModoRegra` (`regra_lancamento`, upsert por módulo, só `desligado`/`registrar`) e
    `useSetoresModulo`/`useAdicionarSetorModulo`/`useAlterarSetorModulo` (`setores_modulo`; retirar desativa a linha e
    incluir de novo a reativa). Gravar é só do papel admin (RLS);
  - `useSaneamentoLancamento` (RPC `saneamento_lancamento()`) e `useBloqueiosLancamento(filtros, habilitado)`:
    gravações (`create`, `update`, `delete`; leituras não contam) com `fundamento->>permitido = 'false'` (predicado do
    índice parcial `idx_audit_logs_fundamento_negado`) no período, sem as gravações em cascata
    (`fundamento->>em_cascata = 'true'`: levam o fundamento de quem disparou e não são checadas), lidas pelo cursor da
    `sequencia` (`buscarTrilhaParaExportar`, até 5000 linhas; lê 5001 para saber se cortou e a tela avisa).
    `useTrilhaAuditoria` ganhou os filtros `fundamentoNegado` (só com ele `via` e `em_cascata` entram no select),
    `acoes` e `semCascata`; o detalhe da linha mostra o fundamento (via, ato e se foi em cascata).
- **Regras puras** `src/lib/lancamentoSetorRegras.ts`: designação como fundamento com o critério do banco (aprovada,
  vigente, com número e data do ato, `aprovado_por` preenchido e diferente de quem criou e do próprio servidor, destino
  que é setor ativo de algum módulo, por `modulosDaUnidade`, que sobe a hierarquia quando o setor inclui as
  subordinadas; devolve o que falta), agrupamento do relatório por responsável, tabela e motivo, normalização das
  respostas das RPCs, `hojeISO` no fuso local e `MODULOS_COM_REGRA_NO_BANCO` (hoje `["rh"]`).
- **Aviso** `AvisoSomenteConsulta` (`src/components/lancamento-setor/`), no `ModuleLayout` (um ponto só, não tela por
  tela), só nos módulos de `MODULOS_COM_REGRA_NO_BANCO` e só com `bloqueado` (modo exigir): "Somente consulta" dos
  lançamentos do setor, com o motivo e o que fazer. Cita só o que o banco libera sem fundamento de setor: os pedidos do
  próprio servidor (abono, ajuste e justificativa de ponto, requerimento de documentos), a assinatura da própria
  frequência e a validação da chefia na frequência. Férias e licenças não têm autoatendimento nem chefia no banco. Em
  `registrar` nada aparece. É aviso: quem recusa é o banco.
- **Erro `RHS01`** (recusa da regra no modo exigir): `descreverErroBanco` (e `mensagemErroBanco`, que o repassa) mostra
  a mensagem do banco ("seu login não tem servidor vinculado", "você não está lotado nem designado no setor de
  <módulo>") seguida do HINT (o que vale como fundamento); o DETAIL (via e tabela) não vai para a tela.
- **Telas:**
  - `/admin/setores-modulos` (`SetoresModulosPage`): por módulo habilitado (menos `admin`, premissa 1), as unidades da
    estrutura que são o setor (busca por nome/sigla; "incluir subordinadas" desmarcado por padrão, como no banco, com o
    aviso do efeito) e o modo da regra. O modo só é editável nos módulos que o banco já checa e só entre desligado e
    registrar ("Exigir" aparece desabilitado: liga por migração, módulo a módulo; não é mostrado em verde). Retirar
    setor pede confirmação. Quantos seriam bloqueados nos últimos 30 dias só é lido quando o admin pede (botão no
    cabeçalho). Sem o papel admin, só consulta;
  - `/rh/comissoes` (`ComissoesPage`, `ComissaoFormDialog`, `MembrosComissaoDialog`): lista com ato, período, membros
    e situação, com o selo "cadastro; não vale como fundamento na fase 1"; criar/editar (react-hook-form + zod: ato
    com tipo, número e data obrigatórios, período, motivo, módulo, objeto obrigatório exceto no tipo "Outra") e
    membros (servidor, papel, período; o próprio servidor não aparece na lista). `mensagemErroComissao` traduz as
    recusas do banco (objeto obrigatório, membro repetido, autoinclusão ou criador da comissão pelo texto do RAISE);
    os servidores para escolher são lidos em todas as páginas (`buscarTodasPaginas`);
  - `/rh/designacoes`: coluna "Fundamento de lançamento" (`FundamentoDesignacaoBadge`) com os módulos em que vale ou o
    que falta (o aprovador vem de `profiles` com `servidor_id`; se a RLS não deixar ler, o banco ainda confere);
  - `/rh/auditoria`, aba "Lançamento por setor" (`RelatorioLancamentoSetor`): quem seria bloqueado no período
    (agrupado por responsável, tabela e motivo) e o saneamento (servidores ativos sem login, sem lotação vigente, com
    lotação divergente ou com fundamento autoconcedido, com a unidade da lotação, a do cadastro e login inativo).
- `SeletorBusca` (`src/components/lancamento-setor/`): combobox com busca (Popover + Command) para listas longas
  (servidores, unidades).

## Arquivos da folha: remessa CNAB e eSocial (onda E3)

Spec: [`superpowers/specs/2026-10-11-rh-vazamentos-arquivos-design.md`](./superpowers/specs/2026-10-11-rh-vazamentos-arquivos-design.md).
Regras do banco (folha fechada, número da remessa, arquivo guardado, cancelamento, índice único do eSocial) na
migração `supabase/migrations/20261011010000_rh_cnab_esocial_integridade.sql`; ver [BANCO_DE_DADOS.md](./BANCO_DE_DADOS.md).

- **Hook** `src/hooks/useArquivosFolha.ts` (as colunas novas e a RPC `cancelar_remessa` ainda não estão em
  `types.ts`: client sem tipagem, como em `useTrilhaAuditoria.ts`). `mensagemErroBanco` mostra o texto do `RAISE`
  (RHE01 folha não fechada, RHE02/RHE03, 22023, o 42501 das funções) e a mensagem dos erros do Storage, e esconde a
  recusa da RLS e o `DETAIL`.
- **Folha fechada:** no detalhe da folha (`/folha/:id`) os botões "Gerar CNAB", "Nova Remessa", "eSocial" e "Gerar
  Eventos" aparecem com fichas, mas ficam desabilitados com a explicação enquanto a folha não está `fechada`; os
  diálogos repetem o aviso. O banco recusa de qualquer forma (RHE01) e a tela mostra o erro.
- **Fichas completas:** os dois diálogos leem **todas** as fichas da folha em páginas (`buscarTodasPaginas`, de
  `useRelatoriosRH.ts`) e recusam gerar se não leram nenhuma ou se leram menos que `folhas_pagamento.quantidade_servidores`
  (`faltaFichas`: a RLS esconde fichas de outros servidores de quem não pode lê-las, e o arquivo sairia incompleto).
  Erro de consulta aparece no diálogo e o botão de gerar fica desabilitado enquanto carrega ou com erro.
- **Remessa CNAB 240** (`GerarRemessaDialog` → `useGerarRemessaCNAB`):
  1. `montarDadosRemessa` monta pagador e favorecidos (fichas com líquido > 0) e `validarRemessaCNAB` lista o que
     falta (CNPJ, razão social, banco e nome do banco da conta, dígito da conta, endereço, cidade, CEP e UF da
     instituição; por servidor: CPF, banco, agência, conta, dígito da conta; dígito com mais de 1 caractere também é
     recusado). Faltou algo: a tela recusa e diz o quê e de quem. Os dados bancários do servidor vêm da **ficha da
     folha** (copiados no processamento): a mensagem avisa que corrigir exige reabrir, reprocessar e fechar de novo;
  2. INSERT em `remessas_bancarias` sem número (o banco atribui, por conta, e devolve no `.select()`; o banco também
     recalcula `valor_total` e `quantidade_registros`) → arquivo gerado com esse número → sha256 no navegador (Web
     Crypto, `calcularSha256`) → upload em `remessas-cnab/<remessa_id>.rem` → UPDATE de `arquivo_path`/`arquivo_sha256`
     → registro na trilha (`registrarAntes`, com `remessa_id`, `numero_remessa` e o sha256) → download do mesmo Blob.
     Se o upload ou o UPDATE falhar, o arquivo não é entregue e a remessa sem arquivo é cancelada pela RPC (se isso
     também falhar, a tela pede para cancelar na aba); sem registro na trilha, o arquivo fica guardado e não é
     entregue (baixa-se pela aba). O `.select()` do INSERT lê também `valor_total` e `quantidade_registros`
     (calculados pelo banco pelas fichas com líquido > 0 e dados bancários): divergiu do arquivo, a remessa é
     cancelada sem subir nem entregar e a tela mostra a diferença. Erros com texto próprio (`mensagemErroBanco`):
     remessa ativa da mesma folha e conta (23505, índice `remessas_bancarias_folha_conta_ativa_uidx`: "cancele-a
     antes"), objeto ausente no bucket ao ligar o arquivo (P0002) e arquivo de remessa gerada por outro (42501);
  3. o gerador (`src/lib/cnabGenerator.ts`, FEBRABAN 240 v10) usa tipo de serviço `30` (salários) e **um lote por forma
     de pagamento** (`formaDoFavorecido`): `01` crédito em conta no mesmo banco, `05` poupança no mesmo banco, `41`
     TED para outro banco (câmara `018`, finalidade TED `00004`); complemento de finalidade `CC`/`PP`; tudo marcado
     "conferir no manual do banco". Sequencial, contagem e soma (em centavos inteiros) por lote; o trailer do arquivo
     conta lotes e todas as linhas. Segmento A: data e valor reais (155-177) zerados e ocorrências (231-240) em branco
     na remessa; header de lote com forma de pagamento do serviço `01` (223-224). Nome do banco de `bancos_cnab` (ou da
     lista `BANCOS` de `src/types/rh.ts`), dígitos separados de "12345-6", endereço do pagador de `config_autarquia`
     ou, sem logradouro lá, do perfil do tenant (`endereco`), e o endereço do servidor no segmento B. Linha fora de 240
     posições: erro, sem arquivo.
- **Aba Remessas:** "baixar" lê o arquivo guardado com `storage.download` (autenticado), confere o sha256 da remessa,
  registra o download (`remessas_bancarias`) e entrega. Hash divergente: registra na trilha (`download` com
  `hash_divergente: true`, `esperado` e `obtido`) e não entrega. Remessa cancelada: download desabilitado ("não envie
  ao banco"); remessa antiga sem arquivo mostra "arquivo não guardado". Não há excluir: "Cancelar" abre
  `CancelarRemessaDialog` (motivo obrigatório, zod) e chama `cancelar_remessa`. Gerar, baixar e cancelar pedem
  `financeiro.folha.processar` (o banco exige o mesmo; sem ela os botões ficam desabilitados).
- **Reabrir folha** (`ReabrirFolhaDialog`): `reabrir_folha` recusa com remessa ativa (`{success: false, error}`); o
  diálogo não fecha e mostra o motivo (além do toast). Cancele a remessa antes de reabrir.
- **Permissão de tela:** gerar e baixar eventos do eSocial também pedem `financeiro.folha.processar`. Sem
  `rh.contracheques.visualizar` nem `processar`, o detalhe da folha avisa "Você vê apenas a sua ficha" e esconde os
  totais, e o card de folha dos relatórios não soma por unidade/rubrica (ver
  [RBAC_PERMISSOES.md](./RBAC_PERMISSOES.md#contracheques-e-exportação-do-rh-rotas-onda-e3)).
- **eSocial** (`GerarESocialDialog`): rascunho, não transmitido — aviso no diálogo e na aba, status "Rascunho (não
  transmitido)", comentário `<!-- RASCUNHO NAO TRANSMITIDO -->` no XML (`COMENTARIO_RASCUNHO`) e arquivo
  `RASCUNHO_NAO_TRANSMITIDO_<evento>_<AAAA-MM>_<id do evento>.xml` (nunca o nome do servidor). Ambiente lido de
  `config_autarquia.esocial_ambiente` (`ambienteESocial`; sem ambiente, não gera). Data de pagamento (`dtPgto` do
  S-1210) informada no diálogo, sugerida pelo `dia_pagamento` de `config_fechamento_folha`; fora do mês da
  competência a geração é bloqueada (pediria o S-1299 do mês do pagamento, que a tela não gera). Fichas em ordem
  estável (matrícula, id) e `ideDmDev` derivado do id da ficha. Cada evento é gravado com `servidor_id` e o erro
  conferido um a um; conflito do índice único (23505) = o evento já existe: o diálogo mostra o gravado e oferece
  baixá-lo, sem duplicar. Na aba, cada evento baixa o XML gravado (registrado antes). Categoria, rubricas e lotação
  continuam fixas (comentado no código; onda G).

## Padrões de UI

- **shadcn/ui** (Radix) em `@/components/ui/*` + **Tailwind**. Componha; evite CSS
  solto. Use os tokens de cor existentes (ex.: `MODULO_COR_CLASSES`,
  `statusColors.ts`) e suporte a dark mode (`next-themes`).
- **Design System** (direção em
  [`superpowers/specs/2026-10-09-design-system-design.md`](./superpowers/specs/2026-10-09-design-system-design.md),
  fases em [`superpowers/plans/2026-10-09-design-system.md`](./superpowers/plans/2026-10-09-design-system.md);
  vitrine viva em `/admin/design-system`, `src/pages/admin/DesignSystemPage.tsx`):
  - **Cor só por token** (`bg-primary`, `text-muted-foreground`, `border-input`). Cor crua
    (`bg-blue-500`, hex) é contada no gate e não pode aumentar.
  - **Texto de estado:** `text-success|warning|info|accent|secondary` já resolvem para a versão
    legível do matiz (`--*-text`, configurado em `textColor` no `tailwind.config.ts`); `bg-*`
    continua sendo o preenchimento. Badge suave: `bg-warning/15 text-warning`.
  - **Contraste AA:** texto ≥ 4,5:1, borda de campo (`--input`) e foco (`--ring`) ≥ 3:1, claro e
    escuro — `npm run check:contraste` (roda no gate). `--border` é só divisória decorativa.
  - **Tipografia:** IBM Plex Sans (`font-sans`) em tudo, inclusive `h1`–`h3`; Merriweather
    (`font-serif`) só quando pedido explicitamente. Escala: `text-display`, `text-h1`, `text-h2`,
    `text-h3`, `text-body` (14px, corpo do sistema), `text-body-lg`, `text-caption` (12px, mínimo).
    Tabelas usam números tabulares por padrão. O `cn` (`@/lib/utils`) conhece essa escala, então
    `cn("text-h3", "text-lg")` fica só com `text-lg`; `CardTitle` usa `text-h3` por padrão. As tags `h1`–`h3` ainda têm o tamanho antigo
    (base de `src/index.css`); telas novas ou migradas usam as classes da escala (`text-h1`…), e
    o tamanho base é alinhado quando o `PageHeader` da Fase 2 existir.
  - **Gráficos:** série `--chart-1` a `--chart-8` via `ChartContainer`/`chartConfig` de
    `@/components/ui/chart` — nada de `fill="#…"`.
  - **Movimento:** `--duration-fast` (150ms) / `--duration-base` (200ms); `prefers-reduced-motion`
    é respeitado globalmente em `src/index.css` (exceto `animate-spin`, que sinaliza carregamento).
  - **Componentes de padrão** em `@/components/design-system` (use-os em telas novas e migradas):
    - `PageHeader` — migalhas, `h1` na escala nova, situação, descrição e ações (uma primária);
      `midia` põe foto/ícone à esquerda do título (ex.: ficha do servidor).
    - `DataTable` — busca (`buscarPor`), ordenação (`ordenarPor`), seleção + `acoesEmLote`,
      `acoesLinha`, paginação no cliente, densidade lembrada no navegador, estados
      `carregando`/`erro`/`vazio` e cartões abaixo de `md` (`mobile: "titulo" | "oculta"` por coluna).
    - `StatusBadge` — cor + ícone + texto; o tom sai do texto (`tomDaSituacao`: ativo, pendente,
      em análise, cancelado…) ou de `tom` explícito.
    - `EmptyState`, `KpiCard` (variação com sinal e ícone; `subirEhBom={false}` para despesas/faltas;
      `detalhe` para texto secundário abaixo do valor, que fica só com o número),
      `ChartCard` (gráfico com alternância para tabela de dados).
    - `FormSection` (fieldset com legenda) e `ErrorSummary` (resumo focável dos erros do
      react-hook-form, com link para cada campo; use `shouldFocusError: false` no `useForm`).
    - `Button` aceita `loading` (spinner, `disabled` e `aria-busy`).
  - **Shell (`ModuleLayout`)** já entrega "Pular para o conteúdo", marcos (`header`, `nav`
    rotulados, `main` focável), `aria-current` no menu e menu do celular como diálogo. A página não
    repete isso: começa no `PageHeader` (um único `h1`). Referência migrada: RH (painel, lista e
    ficha do servidor) e Patrimônio (painéis, listas e fichas); selos de domínio em
    `@/components/rh/SituacaoServidorBadge` e `@/components/unidades/StatusUnidadeBadge`.
  - Consulte o skill `ui-ux-pro-max` (`.claude/skills/UI-UX-PRO-MAX-VENDOR.md`) para decisões
    de UI/UX e acessibilidade.
- **Ícones**: `lucide-react`.
- **Formulários**: `react-hook-form` + `zod` (`zodResolver`).
- **Notificações**: `useToast` (`@/hooks/use-toast`) ou `sonner`.
- **Gráficos**: `recharts`. **Diagramas/fluxo**: `reactflow` (organograma, workflow).
- **Tabelas/listas**: padrões dos componentes de domínio existentes.

## Convenções de código

- Domínio, comentários e rótulos **em português** (não traduzir nomes existentes).
- **Páginas**: `*Page.tsx` (PascalCase). **Hooks**: `use<Dominio>` (camelCase).
  **Tipos**: `src/types/<dominio>.ts`.
- Combine com o estilo do arquivo vizinho (densidade de comentários, nomes).
- **Arquivos gerados — não editar**: `src/integrations/supabase/client.ts` e
  `src/integrations/supabase/types.ts`.

## Adicionando uma página (resumo)

1. Tipos em `src/types/<dominio>.ts`.
2. Hook de dados em `src/hooks/use<Dominio>.ts`.
3. Componentes em `src/components/<dominio>/`.
4. Página em `src/pages/<dominio>/<Nome>Page.tsx`.
5. Rota em `src/App.tsx` (bloco do módulo, com o guard apropriado).
6. Item de menu em `src/config/menu.config.ts` (se navegável).
7. `bun run lint` + `bun run build`.

Detalhes em [DESENVOLVIMENTO.md](./DESENVOLVIMENTO.md).

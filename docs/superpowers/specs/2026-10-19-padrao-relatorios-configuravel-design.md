# Padrão único de relatórios com configuração na tela

Data: 2026-10-19 · Módulos: todos que imprimem (`rh`, `folha`, `unidades/patrimonio`, `governanca`, `admin`,
`arbitros`, `federacoes`, `curriculo`, `reunioes`) · Classificação: **architectural** (interface usada por
todos os módulos + tela de configuração). Base: [`docs/PADRAO_DOCUMENTOS.md`](../../PADRAO_DOCUMENTOS.md)
(F0/F1, PR #89). Pedido do dono: "todos os módulos respeitam esse motor? preciso padronizar e deixar no front
algumas configurações de padronização do relatório".

## 1. Situação hoje (medida em `main` 05211a0)

- O motor `src/lib/documentos/` está pronto e testado, mas `REGISTRO` está vazio e **nenhuma tela o usa**.
- 43 arquivos `src/lib/pdf*.ts` / `src/lib/pdf/**` (cerca de 17 mil linhas) geram todos os PDFs, sobre duas
  bases concorrentes (`pdfTemplate.ts`, `pdfInstitucional.ts`). Cada um tem margem, fonte e cabeçalho próprios.
- Não há nenhuma configuração de impressão na tela: cor, logos e textos vêm do perfil do tenant e da
  "Configuração do cliente" (`dados_oficiais`), mas só pelos dados de identidade.

## 2. Objetivo

1. **Todo PDF de relatório, ficha e comprovante sai do motor** (`emitirDocumento`), com o mesmo cabeçalho,
   rodapé, tipografia e tabela. Ato formal continua fora (é do SEI).
2. **Configurações de padronização editáveis na tela**, valendo para todos os documentos de uma vez.
3. **O gate impede regressão**: nenhum gerador novo fora do motor e, ao fim, nenhum import das bases antigas.

## 3. Configurações na tela

Ficam numa seção nova **"Impressão de documentos"** da tela já existente `/admin/configuracao-cliente`.

| Configuração | Valores | Padrão |
|---|---|---|
| Cor de destaque dos documentos | cor (hex); se não tiver contraste 4,5:1 sobre branco, o motor usa o texto neutro e a tela avisa | cor primária do tenant |
| Mostrar logo do órgão | sim/não | sim |
| Mostrar logo da entidade superior | sim/não | o que o perfil já diz (`exibirEmDocumentos`) |
| Linha extra do cabeçalho | texto curto (ex.: "Secretaria de…"), abaixo do nome do órgão | vazio |
| Texto do rodapé | texto curto (ex.: endereço e telefone, aviso LGPD) | endereço do cadastro |
| Mostrar quem emitiu | sim/não ("emitido por Fulano em…") | sim |
| Tamanho da letra | compacto / normal / grande (escala tabela 8–9–10 pt, corpo 9,5–10,5–11,5 pt) | normal |
| Tabelas listradas (zebra) | sim/não | sim |
| Orientação dos relatórios | automática (pelo número de colunas) / sempre retrato / sempre paisagem | automática |

Com **pré-visualização**: um botão "Ver exemplo" gera na hora um relatório e uma ficha de amostra com as
configurações ainda não salvas.

Fora da tela (fixos, para manter o padrão): fonte (Helvetica), margens, posição do protocolo, ordem
cabeçalho/rodapé, folha A4.

## 4. Onde as configurações ficam

**Sem tabela nova.** Viram chaves da categoria nova `impressao` na tabela `dados_oficiais`, pelo mesmo
catálogo `CAMPOS_CLIENTE` (`src/core/tenant/dadosOficiais.ts`) que a tela já usa. Consequências:

- RLS já existente (`supabase/baseline/rls/mapa.csv`, linha `dados_oficiais`): leitura pública, escrita só do
  papel admin. Nenhuma configuração de impressão é sigilosa, então a leitura pública não expõe nada.
- Autoria e motivo da alteração já são gravados pela tela.
- Campo vazio volta ao padrão (comportamento atual da tela).
- `TenantConfig` ganha um bloco opcional `impressao`; `marcaDoTenant` vira `estiloDoTenant` e entrega ao motor
  marca + estilo. O núcleo continua sem ler o tenant sozinho.

## 5. Mudanças no motor

- `tipos.ts`: `EstiloImpressao` (escala de fonte, zebra, mostrar emissor, textos de cabeçalho/rodapé,
  orientação) dentro do `ContextoDocumento`; `tokens.ts` passa a ter três escalas em vez de uma.
- `core/moldura.ts`: linha extra do cabeçalho, texto de rodapé, emissor opcional, logos opcionais.
- `blocos/tabela.ts`: zebra opcional; orientação automática quando o modelo não fixa uma.
- Protocolo: os modelos de RH imprimem o `RH-AAAA-NNNNNN` quando o registro tem. Numeração para os outros
  módulos continua fora (precisa de decisão e spec próprias, `PADRAO_DOCUMENTOS.md` §5).
- Testes: cada configuração tem teste com `lerPdf` (aparece/não aparece, tamanho muda, sem `undefined`).

## 6. Migração dos geradores, por ondas

Cada onda é uma PR. Em cada gerador: modelo novo em `src/lib/documentos/modelos/`, linha no `REGISTRO`,
tela passa a chamar `emitirDocumento`, gerador antigo apagado, comparação antes/depois
(`scripts/documentos-comparar.mjs`) anexada à PR.

| Onda | Conteúdo | Geradores |
|---|---|---|
| 0 | Configurações (seções 3–5) + tela + pré-visualização | — |
| 1 | RH: relatórios | `pdfRelatoriosRH`, `pdfRelatoriosAfastamentos`, `pdfRelatoriosFolha`, `pdfRelatorioFrequencia`, `pdfRelatorioServidoresDiretoria`, `pdfRelatorioSegundoVinculo`, `pdfRelatorioSituacaoPortaria`, `pdfRelatorioAgrupadoPortaria`, `pdfRelatorioPendencias*`, `pdfRelatorioContatosEstrategicos`, `pdfRelatorioFolhaSimplificado`, `pdfRelatorioAvancado`, `pdfRelatorioEstrutura` |
| 2 | Fichas | `pdfFichaCadastroGeral`, `pdfMiniCurriculo`, `pdfFichaUnidadeLocal` + `pdf/unidades/*`, ficha cadastral de `pdfGenerator`/`pdfModelos` (unificar as 3 cópias) |
| 3 | Comprovantes (layout oficial, mais sensível) | `pdfContracheque`, `pdfFrequenciaMensalGenerator`, `pdfFrequenciaLote`, listas de `pdfRelatorioReunioes` |
| 4 | Demais relatórios | `pdfRelatorioUnidades`, `pdfListagemUnidades`, `pdfOrganograma`, `pdfRelatorioCargos`, relatório de cargos e de governança de `pdfGenerator`, `pdfRelatorioArbitros`, `pdfRelatorioFederacoes` |
| 5 | Limpeza | apagar `pdfTemplate`, `pdfInstitucional`, `pdfLogos`; gate passa a reprovar qualquer import delas |

**Fora das ondas** (decisão já tomada ou pendente do dono): atos do SEI (`pdfCPSI`, `memorandoDesignacao`,
`pdfTermoCessao`, termos/declarações/requisição de `pdfGenerator` e `pdfModelos`). Ficam como estão até o dono
decidir se cada um sai do sistema ou vira formulário.

## 7. Segurança, white label e docs

- Sem migração de schema; sem mudança de RLS, `ProtectedRoute` ou `AuthContext`. A seção nova herda a
  permissão da tela `/admin/configuracao-cliente` (módulo `admin`).
- Nenhum nome de cliente no código: padrões vêm do perfil do tenant.
- Textos livres de cabeçalho/rodapé passam por `paraWinAnsi` e têm limite de tamanho (não quebram o layout).
- Docs da matriz: `PADRAO_DOCUMENTOS.md`, `CONFIGURACAO_CLIENTE.md`, `ROADMAP.md` (P23) em cada onda.

## 8. Riscos

- **Comprovantes (onda 3)** são conferidos por terceiros (contracheque, frequência assinada): mudam de
  aparência. Mitigação: comparação antes/depois e amostra para o dono aprovar antes do merge da onda.
- **Volume**: cerca de 30 geradores nas ondas 1–4. Uma PR por onda mantém a revisão possível.

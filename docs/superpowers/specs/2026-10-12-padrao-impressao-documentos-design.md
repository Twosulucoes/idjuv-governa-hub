# Padrão de impressão de documentos — spec

> **Revisão 12/10/2026: atos formais saem do escopo (SEI).** Decisão do dono: o sistema não redige portaria,
> memorando, termo, requerimento, DFD/ETP/TR nem outro ato formal do órgão — a formalização é no SEI, e o sistema só
> acompanha o ciclo (processo SEI, número, assinatura, publicação no DOE) e registra na ficha. A família Ato e o
> modelo `requerimento` foram removidos de `src/lib/documentos/` e a fase F2 foi cancelada. Relatórios, fichas e
> comprovantes continuam no escopo. Estado vigente em [`docs/PADRAO_DOCUMENTOS.md`](../../PADRAO_DOCUMENTOS.md).

- **Data:** 2026-10-12
- **Classificação:** architectural (subsistema novo; refatora ~45 geradores chamados de 54 arquivos)
- **Pedido:** "planejar toda estrutura de impressão, criar layout padronizado, fazer protocolos,
  requerimento, tudo que o sistema exporta para ser impresso; (requerimento e demais atos saíram do escopo na
  revisão de 12/10/2026: são feitos no SEI) usar um plugin tipo ui-ux-pro-max
  para o visual; refatorar todo o sistema; documentar o padrão de criação de novos documentos."
- **Fonte visual:** skill `ui-ux-pro-max` (estilo *Accessible & Ethical*, governo) + tokens do
  [design system](./2026-10-09-design-system-design.md). Cor de marca continua vindo do tenant.
- **Aprovação do desenho em chat:** 2026-10-12 (abordagem 1: camada própria sobre jsPDF).

## 1. Estado atual (medido em 2026-10-12, `main` a3c3af4)

| Achado | Evidência |
|---|---|
| ~19 mil linhas em ~45 geradores jsPDF | `src/lib/pdf*.ts`, `src/lib/portariaPdf.ts`, `src/lib/pdf/**` |
| 54 arquivos consomem esses geradores | `grep` de `@/lib/pdf*` / `portariaPdf` em `src/` |
| Três bases de template concorrentes | `pdfTemplate.ts` (cor do tenant), `pdfInstitucional.ts` (diz "nenhum PDF fora deste padrão", mas `#004444` fixo), `pdfModelos.ts` |
| `pdfGenerator.ts` com 2.288 linhas | maior arquivo; mistura vários documentos |
| Protocolo só no RH | `RH-AAAA-NNNNNN` nas RPCs de `rhRpc.ts` (PR #88, já na `main`); `pdfMemorandoLotacao` imprime o seu à mão |
| Impressão pelo navegador em 1 tela | `OrganogramaPage.tsx` (`window.print()`) |
| Bibliotecas já instaladas | `jspdf`, `pdf-lib`, `pdfjs-dist`, `docx`, `xlsx` |

## 2. Premissas

1. **Engine fica jsPDF.** Trocar a engine nos 45 geradores é o maior risco e não traz ganho visual.
2. Refatoração **incremental, uma família por PR**; geradores antigos convivem até serem migrados.
3. **Protocolo:** a camada imprime o `protocolo` que o documento recebe. Criar protocolo para
   módulos fora do RH é decisão de banco separada (fora de escopo; ver §9).
4. **Merge na `main` = deploy automático do front** (`deploy-front.yml`). Por isso todo PR fica em
   rascunho e só é mergeado quando o usuário validar o antes/depois daquela fase; agente não faz merge.
5. Tenant-agnóstico: nenhum nome de cliente no código (invariante 4 do `AGENTS.md`).

## 3. Famílias de documento

Todo documento pertence a uma família; cada família tem um layout-base.

| Família | Exemplos | Estrutura |
|---|---|---|
| ~~Ato~~ | portaria, memorando, declaração, termo, requerimento | **removida em 12/10/2026:** ato é feito no SEI; o sistema registra processo SEI, número e DOE |
| **Relatório** | relatórios de RH, folha, unidades, federações, árbitros, pendências | cabeçalho, filtros aplicados, tabela(s) com totais, retrato ou paisagem |
| **Ficha** | ficha cadastral, mini-currículo, ficha da unidade, ficha de federação | cabeçalho, seções de campos chave-valor, foto opcional |
| **Comprovante** | contracheque, folha de frequência, lista de presença, certificado | cabeçalho enxuto, bloco principal, carimbo de autenticidade |

## 4. Arquitetura

```
src/lib/documentos/
  core/        página A4, tokens, fontes, cabeçalho, rodapé, protocolo, paginação "X de Y", cursor de escrita
  blocos/      titulo, camposChaveValor, tabela, paragrafo, assinaturas, carimbo, secao
  familias/    ato.ts, relatorio.ts, ficha.ts, comprovante.ts  (compõem core + blocos)
  modelos/     um arquivo declarativo por documento
  registro.ts  mapa tipo -> modelo (única lista de documentos do sistema)
  emitir.ts    emitirDocumento(tipo, dados, opcoes) -> { blob, nomeArquivo }
  index.ts     API pública (nada de `new jsPDF` fora de core/)
```

- **Modelo** (`DocumentoModelo<Dados>`): `tipo`, `familia`, `titulo(dados)`, `orientacao`,
  `protocolo?(dados)`, `blocos(dados) -> Bloco[]`. Não conhece jsPDF.
- **Bloco**: função pura `(ctx, props) -> void` que escreve no cursor e quebra página sozinha.
- **`emitirDocumento`** monta a família, aplica cabeçalho/rodapé em todas as páginas ao final
  (para saber o total de páginas) e devolve o blob. Download, pré-visualização e envio ficam por
  conta de quem chama.
- **Adaptador de transição:** cada gerador antigo migrado passa a ser um *wrapper* de uma linha que
  chama `emitirDocumento`, mantendo a assinatura exportada — as 54 telas não mudam no mesmo PR.
- **Marca e identidade:** logos e cor via `@/core/tenant` (`getMarcaAssets`, `getTenantSnapshot`); nome do
  sistema, nome oficial, CNPJ, endereço e dirigente vêm dos dados oficiais cadastrados no banco
  (`useNomeSistema()`/`nomeDoSistema()`, `docs/CONFIGURACAO_CLIENTE.md`) — nunca literais no modelo.

## 5. Visual (tokens de impressão)

| Token | Valor |
|---|---|
| Página | A4; margens 20 mm (laterais), 18 mm (topo e rodapé) |
| Espaço | escala 4 / 8 / 12 / 16 mm |
| Tipografia | títulos e corpo de Ato em **Times**; tabelas, fichas e metadados em **Helvetica** (nativas do PDF, peso zero) |
| Escala | título 14 pt · seção 11 pt · corpo 10,5 pt · tabela 9 pt (mínimo 8 pt) · rodapé 7,5 pt |
| Cor | `primaria` = cor do tenant; neutros slate; todo texto ≥ 4,5:1 contra o fundo |
| P&B | significado nunca só por cor; zebra leve e linhas finas nas tabelas |
| Fonte | é um token — EB Garamond/Lato (sugestão do skill) podem entrar depois, carregadas sob demanda |
| Evitar | ornamentos, gradientes, emoji como ícone, texto < 8 pt |

**Cabeçalho (todas as páginas):** logo do governo à esquerda, logo da instituição à direita, nome
da instituição ao centro; na 1ª página, título e subtítulo; **protocolo** (quando houver) no canto
superior direito. **Rodapé:** sistema, "emitido por <usuário> em <data/hora>", página X de Y e, nos
Comprovantes, linha de autenticidade.

## 6. Prova e trava

1. **Antes/depois por gerador migrado:** PDF antigo e novo rasterizados com `pdfjs-dist` e
   comparados lado a lado (ferramenta em `scripts/`). Fixtures de dados em `src/lib/documentos/__fixtures__/`.
2. **Guard no `scripts/gate.sh`:** `new jsPDF(` e `from 'jspdf'` fora de `src/lib/documentos/core/`
   contam contra um baseline em `scripts/gate-baseline.json` que só pode **diminuir** (ratchet,
   como os guards atuais). Ao fim da F5 o baseline é zero.
3. **Não há suíte de testes no repo:** a prova é o gate verde + comparação visual lida por mim e
   apresentada ao usuário; o resultado é relatado, não presumido.
4. Verificação em 390 px não se aplica (PDF); aplica-se à tela de pré-visualização, se houver.

## 7. Padrão para novos documentos (entregável permanente)

- `docs/PADRAO_DOCUMENTOS.md` — canônico: famílias, tokens, anatomia do modelo, como registrar,
  como verificar, checklist de revisão. Entra na matriz de `docs/GOVERNANCA_DOCUMENTACAO.md`.
- Skill `.claude/skills/novo-documento-idjuv/` — dado "preciso de um documento X", conduz:
  escolher família → declarar dados (tipo TS) → escrever modelo → registrar → fixture →
  comparação visual → gate. Lista no `AGENTS.md` (tabela de skills).
- Regra no `CLAUDE.md`/`AGENTS.md` do repo: **nenhum PDF novo fora de `src/lib/documentos/`**.

## 8. Fases (um PR por fase, todos em rascunho até o usuário pedir)

| Fase | Entrega | Critério de pronto |
|---|---|---|
| **F0** | Inventário: cada função exportada de PDF → família, tela que chama, dado de entrada | tabela em `docs/PADRAO_DOCUMENTOS.md`; nenhum gerador sem família |
| **F1** | `core/`, `blocos/`, `familias/`, `registro`, `emitir`, ferramenta antes/depois, guard, skill, doc | 1 documento de cada família emitido pela camada nova; gate verde |
| ~~F2~~ | **Cancelada em 12/10/2026** (atos são do SEI). Geradores de ato: remover / substituir por registro do SEI; ver `docs/PADRAO_DOCUMENTOS.md` §2 | — |
| **F3** | Migrar **Fichas** | idem |
| **F4** | Migrar **Relatórios** (maior volume) | idem |
| **F5** | Migrar **Comprovantes** (contracheque, frequência, lista de presença) | idem + conferência de valores com os do gerador antigo |

Remoção dos três templates antigos só depois que nenhum gerador os importe (verificado por `grep`).

## 9. Fora de escopo / decisões em aberto

- **Protocolo fora do RH:** hoje só o RH numera seus registros (o número do ato formal vem do SEI). Numerar demais documentos
  exige tabela/RPC com RLS (skill `migracao-segura-idjuv`) — spec própria quando o usuário decidir.
- **QR de verificação pública:** exige tabela de documentos emitidos e página pública
  (`PublicPageGuard`); fase opcional pós-F5.
- **Word/Excel:** `docx` e `xlsx` não entram; o padrão cobre PDF. Exportações de planilha seguem
  `src/export/`.
- **`window.print()` do organograma:** migra na F4 para um modelo de Relatório.

## 10. Riscos

| Risco | Mitigação |
|---|---|
| Regressão de layout em documento oficial já em uso | antes/depois por gerador; wrapper mantém a assinatura; um PR por família |
| Valores de folha/contracheque divergirem | F5 por último; conferência numérica contra o gerador antigo |
| Conflito de merge com outras frentes (RH, design system) | PRs pequenos por família; `git fetch` antes de cada fase; sem mexer em `App.tsx` |
| Quebra automática de página em tabelas longas | bloco `tabela` testado com fixture de 200+ linhas na F1 |
| Peso do bundle | fontes nativas; `emitir` carregado por `import()` dinâmico nas telas |

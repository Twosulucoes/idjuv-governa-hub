# Padrão de impressão — F2a (Portarias) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar os cinco geradores de portaria (`generatePortariaUnificadaPdf`, `generatePortariaColetivaComTabela`, `generatePortariaNomeacao`, `generatePortariaExoneracao`, `generatePortariaDesignacao`) para um único modelo `portaria` da camada `src/lib/documentos/`, preservando a redação legal palavra por palavra e resolvendo antes a pendência "assinatura sozinha numa página".

**Architecture:** Um modelo declarativo `portaria` (preâmbulo, artigos, tabela opcional depois de um artigo, local/data, assinatura) + construtores puros que montam os dados de cada tipo de portaria a partir do **perfil do tenant** (zero literal de cliente em `src/`). Os cinco geradores antigos viram fachadas finas de 1 chamada, com a mesma assinatura (agora `async`). Um novo bloco `manterJunto` mede um grupo de blocos e o leva inteiro para a página seguinte se não couber.

**Tech Stack:** TypeScript, jsPDF (só em `core/`), vitest, `pdfjs-dist` nos testes, `date-fns` (já no repo) para datas por extenso.

**Spec:** [`../specs/2026-10-12-padrao-impressao-documentos-design.md`](../specs/2026-10-12-padrao-impressao-documentos-design.md) §8 (F2). Contexto: [`2026-10-12-padrao-impressao-f0-f1.md`](./2026-10-12-padrao-impressao-f0-f1.md) e `docs/PADRAO_DOCUMENTOS.md`.

**Base:** branch `claude/padrao-impressao-f2a`, empilhada sobre `claude/padrao-impressao` (PR #89, F1, ainda não mergeada). O PR da F2a deve apontar para `claude/padrao-impressao` como base e ser reapontado para `main` quando o #89 for mergeado.

## Escopo desta fase (e o que fica fora)

Dentro: os 5 geradores de `src/lib/pdfPortarias.ts` e a fachada `src/lib/portariaPdf.ts`; bloco `manterJunto`; campo de tenant `legal.numeracaoAtos`.

Dentro também: **rodapé com o endereço do tenant em todos os documentos** (Task 2b, muda `core/moldura.ts` da F1).

Fora (cada um em plano próprio, F2b/F2c): memorandos, declarações, termos, CPSI (DFD/ETP/TR), os Atos de `pdfGenerator.ts`/`pdfModelos.ts`. Fora também: **exportação Word** das portarias (`src/lib/wordPortarias.ts`) — ela duplica o texto das portarias; fica como está e será derivada dos mesmos dados numa fase própria. Os quatro geradores sem chamador (`pdfMemorandoLotacao`, `pdfTermoAutorizacao`, `pdfTermoResponsabilidade`, `pdfFederacoesModular`) **não são migrados nem apagados**.

## Global Constraints

Valem para todas as tarefas (copiadas da spec e do `AGENTS.md` do repo).

- Engine jsPDF; `new jsPDF(` só em `src/lib/documentos/core/`. A contagem do guard (`scripts/gate-baseline.json` → `jspdfForaDoCore`) só pode **cair**.
- Página A4, margens 20 mm (laterais) / 18 mm (topo e rodapé); tipografia de **Ato = Times**; escala 14/11/10,5/9/7,5 pt; contraste ≥ 4,5:1.
- **Nenhum nome de cliente em `src/`** (nem em testes): nome do órgão, lei, cidade, dirigente e sigla de numeração vêm do perfil do tenant (`TenantConfig`). Nunca importar `tenants/<slug>` de código commitado.
- **A redação legal não muda:** preâmbulo, artigos, fecho e título produzidos para o IDJUV devem ficar idênticos aos dos geradores antigos (verificado na Task 7).
- Merge na `main` publica o front: PR em **rascunho**, sem merge, até o usuário validar o antes/depois.
- Commits em português, um por tarefa, `git add` por nome (nada de `-A`), terminando com `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Trabalhar em `/root/idjuv/impressao-f2a`. Antes da Task 1: `cd /root/idjuv/impressao-f2a && npm install --no-package-lock --no-audit --no-fund` (o worktree novo não tem `node_modules`).
- Verificação: `bash scripts/gate.sh` lido; typecheck/lint/cor crua não podem piorar.

## Review Focus

Entradas que a spec implica e os testes do caminho feliz não exercitam; cada linha tem o teste na tarefa dona.

1. **Assinatura isolada:** portaria cujo último artigo termina a poucos mm do fim da página — assinatura e fecho nunca ficam sozinhos numa página (o último artigo vai junto). → Tasks 2 e 4.
2. **Portaria coletiva longa** (300 servidores): tabela atravessa páginas com cabeçalho repetido, os artigos seguintes e a assinatura vêm depois, nada some. → Task 4.
3. **Tenant sem `numeracaoAtos`, sem lei, sem dirigente ou sem cidade:** o texto sai sem esses trechos, **nunca** com `undefined`/`null`. → Task 3.
4. **Data inválida** (`""`, `"2026-13-40"`): erro claro (`Data inválida: …`), não um PDF com "Invalid Date". → Task 3.
5. **Valor ausente na tabela** (cargo, unidade, matrícula, coluna personalizada): sai "—", nunca vazio. → Task 4.
6. **Nome com caracteres fora da fonte nativa** e `numero` sem barra ("12" em vez de "12/2026"): não quebra. → Tasks 3 e 4.
7. **Chamadores síncronos:** os geradores passam a ser `async`; nenhuma tela pode usar o resultado sem `await`. → Task 6 (typecheck + `grep`).

---

## File Structure

```
src/lib/documentos/
  core/medir.ts                          # medirAltura(ctx, blocos)
  core/moldura.ts  marca.ts  tipos.ts    # (modificam) endereço no rodapé
  blocos/manterJunto.ts                  # manterJunto(...blocos): Bloco
  blocos/index.ts                        # (modifica) reexporta manterJunto
  modelos/portaria/
    textos.ts                            # título, preâmbulo, data por extenso, CPF, assinatura do dirigente (puros, recebem TenantConfig)
    tabelaServidores.ts                  # ConfiguracaoTabela + servidores -> colunas/linhas do bloco `tabela`
    modelo.ts                            # DadosPortariaModelo + portariaModelo
    construtores.ts                      # dadosNomeacao/Exoneracao/Designacao/Coletiva/Unificada(tenant, ...)
    index.ts
  registro.ts                            # (modifica) + portaria
  __testes__/
    fixturesPortaria.ts                  # entradas no formato dos geradores antigos (nomes fictícios)
    medir.test.ts  portariaTextos.test.ts  portariaModelo.test.ts  portariaConstrutores.test.ts
src/lib/pdfPortarias.ts                  # (reescreve) fachadas async de 1 chamada
src/lib/portariaPdf.ts                   # (modifica) buildPortariaPdfDoc async
src/components/portarias/PortariaColetivaDialog.tsx   # (modifica) await
src/pages/rh/CentralPortariasPage.tsx                 # (modifica) await
src/core/tenant/types.ts                 # (modifica) TenantLegal.numeracaoAtos?
tenants/idjuv/tenant.config.ts           # (modifica) numeracaoAtos: 'IDJuv/PRESI/GAB'
docs/PADRAO_DOCUMENTOS.md  docs/WHITE_LABEL.md  scripts/gate-baseline.json
```

Observação sobre os textos: os valores que o IDJUV imprime hoje (`O PRESIDENTE DO INSTITUTO … – IDJuv`, `Lei nº 2.301, de 29 de dezembro de 2025`, `Boa Vista – RR`) **já existem** no perfil do tenant (`identidade.tratamentoDirigente`, `identidade.nomeOficial`, `legal.leiCriacao`, `endereco.cidade/uf`, `legal.dirigenteNome/Cargo`). Só a sigla de numeração `IDJuv/PRESI/GAB` não existe — entra como campo novo e opcional (Task 3).

---

### Task 1: Capturar os PDFs "antes" (antes de mexer em qualquer gerador)

**Files:**
- Create: `src/lib/documentos/__testes__/fixturesPortaria.ts`
- Create (temporário, **nunca commitar**): `src/lib/documentos/__testes__/capturarAntes.local.test.ts`

**Interfaces:**
- Produces (`fixturesPortaria.ts`): `entradasLegado`, um objeto com os argumentos de cada gerador antigo, no formato exato que eles recebem hoje: `nomeacao`, `exoneracao`, `designacao`, `coletiva`, `unificada` (nomes e CPFs fictícios). As Tasks 4 e 7 reutilizam.

- [ ] **Step 1: Escrever as fixtures (formato dos geradores antigos)**

```ts
// Entradas no formato dos geradores antigos (src/lib/pdfPortarias.ts). Dados fictícios.
const servidor = { nome_completo: 'Maria de Souza Lima', cpf: '12345678901', matricula: '000123' };
const cargo = { nome: 'Assessor Técnico', sigla: 'AT', simbolo: 'CC-3' };
const unidade = { nome: 'Divisão de Projetos', sigla: 'DIPRO' };
const portaria = { numero: '12/2026', data_documento: '2026-10-05' };

const listaServidores = Array.from({ length: 40 }, (_, i) => ({
  nome_completo: `Servidor de Teste ${i + 1}`,
  cpf: String(10000000000 + i),
  matricula: `M${i + 1}`,
  cargo: i % 3 === 0 ? 'Assessor Técnico' : 'Coordenador de Área',
  codigo: `CC-${(i % 5) + 1}`,
  unidade_nome: i % 7 === 0 ? undefined : `Unidade ${(i % 4) + 1}`,
}));

export const entradasLegado = {
  nomeacao: { portaria, servidor, cargo, unidade },
  exoneracao: { portaria, servidor, cargo, unidade, motivo: 'pedido' as const },
  designacao: {
    portaria, servidor, cargo,
    unidadeOrigem: { nome: 'Divisão de Projetos' },
    unidadeDestino: { nome: 'Gabinete da Presidência' },
    dataInicio: '2026-10-06', dataFim: '2026-12-31',
  },
  coletiva: {
    portaria,
    cabecalho: 'O PRESIDENTE DO ÓRGÃO DE TESTE, no uso das atribuições legais que lhe são conferidas, RESOLVE:',
    servidores: listaServidores,
    tipoAcao: 'nomeacao' as const,
  },
  unificada: {
    portaria,
    preambulo: 'O PRESIDENTE DO ÓRGÃO DE TESTE, no uso das atribuições legais que lhe são conferidas, e demais normas aplicáveis,',
    artigos: [
      { id: 'a1', numero: '1º', conteudo: 'DESIGNAR os servidores abaixo relacionados para compor a comissão de teste:' },
      { id: 'a2', numero: '2º', conteudo: 'A comissão funcionará pelo prazo de 90 (noventa) dias.' },
      { id: 'a3', numero: '3º', conteudo: 'Esta Portaria entra em vigor na data de sua publicação.' },
    ],
    servidores: listaServidores.slice(0, 12).map((s) => ({ ...s, observacao: 'ver ofício' })),
    configTabela: {
      habilitada: true,
      colunas: ['numero', 'nome_completo', 'cpf', 'cargo', 'unidade_setor'] as const,
      colunasPersonalizadas: [{ id: 'observacao', titulo: 'Observação', tipo: 'texto' as const }],
    },
    assinatura: { nome: 'FULANO DE TESTE', cargo: 'Presidente\ndo Órgão de Teste', local: 'Cidade de Teste' },
  },
};
```

- [ ] **Step 2: Escrever o capturador temporário e rodar com o tenant real**

`capturarAntes.local.test.ts` (temporário):

```ts
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'vitest';
import * as legado from '@/lib/pdfPortarias';
import { entradasLegado as e } from './fixturesPortaria';

const saida = process.env.PORTARIAS_ANTES!;
const gravar = (nome: string, doc: { output: (t: 'arraybuffer') => ArrayBuffer }) =>
  writeFileSync(join(saida, nome), Buffer.from(doc.output('arraybuffer')));

describe.skipIf(!saida)('capturar PDFs antes da migração', () => {
  it('grava os cinco', async () => {
    mkdirSync(saida, { recursive: true });
    gravar('nomeacao.pdf', legado.generatePortariaNomeacao(e.nomeacao.portaria, e.nomeacao.servidor, e.nomeacao.cargo, e.nomeacao.unidade));
    gravar('exoneracao.pdf', legado.generatePortariaExoneracao(e.exoneracao.portaria, e.exoneracao.servidor, e.exoneracao.cargo, e.exoneracao.unidade, e.exoneracao.motivo));
    gravar('designacao.pdf', legado.generatePortariaDesignacao(e.designacao.portaria, e.designacao.servidor, e.designacao.cargo, e.designacao.unidadeOrigem, e.designacao.unidadeDestino, e.designacao.dataInicio, e.designacao.dataFim));
    gravar('coletiva.pdf', legado.generatePortariaColetivaComTabela(e.coletiva.portaria, e.coletiva.cabecalho, e.coletiva.servidores, e.coletiva.tipoAcao));
    gravar('unificada.pdf', await legado.generatePortariaUnificadaPdf(e.unificada.portaria, e.unificada.preambulo, e.unificada.artigos, e.unificada.servidores as any, { ...e.unificada.configTabela, colunas: [...e.unificada.configTabela.colunas] } as any, e.unificada.assinatura));
  });
});
```

Run:
```bash
SP=/tmp/claude-0/-root/7f60567f-6c48-49ed-8c19-594ba9577a33/scratchpad/portarias-antes
VITE_TENANT_SLUG=idjuv PORTARIAS_ANTES=$SP npx vitest run src/lib/documentos/__testes__/capturarAntes.local.test.ts 2>&1 | tail -15
ls -la $SP
```
Expected: 5 PDFs em `$SP`. Aviso de `Não foi possível carregar logo…` na unificada é esperado (sem `Image` no Node).

**Se o legado não rodar em Node** (erro de import do tenant, `Image`, etc.): não insistir. Alternativa registrada no ledger: a prova de fidelidade da Task 7 compara **por texto** — extrai com `grep` os literais de `src/lib/pdfPortarias.ts` (preâmbulo, `Art. 1º …`, `Art. 2º …`, fechos) e exige que o PDF novo contenha cada um, e as imagens "antes" ficam para o usuário gerar na tela. Seguir para o Step 3 sem PDFs.

- [ ] **Step 3: Rasterizar e olhar o "antes"**

```bash
for f in nomeacao exoneracao designacao coletiva unificada; do pdftoppm -r 60 -png -f 1 -l 1 $SP/$f.pdf $SP/$f; done; ls $SP
```
Abrir `nomeacao-1.png` e `coletiva-1.png` com Read: anotar a aparência atual (cabeçalho, margens, fonte) para comparar na Task 7.

- [ ] **Step 4: Apagar o temporário e commitar só as fixtures**

```bash
rm src/lib/documentos/__testes__/capturarAntes.local.test.ts
git status --short   # só fixturesPortaria.ts
git add src/lib/documentos/__testes__/fixturesPortaria.ts
git commit -m "test(documentos): fixtures das portarias no formato dos geradores antigos

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: `medirAltura` e o bloco `manterJunto`

**Files:**
- Create: `src/lib/documentos/core/medir.ts`, `src/lib/documentos/blocos/manterJunto.ts`
- Modify: `src/lib/documentos/blocos/index.ts`
- Test: `src/lib/documentos/__testes__/medir.test.ts`

**Interfaces:**
- Consumes: `criarContexto`, `PAGINA`, `ALTURA_CABECALHO`, `Bloco`, `ContextoDocumento`.
- Produces: `medirAltura(ctx: ContextoDocumento, blocos: Bloco[]): { altura: number; paginas: number }` (mm, medido numa página nova de um documento descartável com a mesma marca/orientação/família) e `manterJunto(...blocos: Bloco[]): Bloco`.

- [ ] **Step 1: Escrever os testes (falham primeiro)**

```ts
import { describe, expect, it } from 'vitest';
import { assinaturas } from '../blocos/assinaturas';
import { manterJunto } from '../blocos/manterJunto';
import { paragrafo } from '../blocos/paragrafo';
import { medirAltura } from '../core/medir';
import { criarContexto } from '../core/pagina';
import { renderizarDocumento } from '../core/renderizar';
import type { Bloco, DocumentoModelo } from '../tipos';
import { emissaoTeste, marcaTeste } from './fixtures';
import { lerPdf } from './lerPdf';

const gerar = (blocos: Bloco[]) => {
  const modelo: DocumentoModelo<null> = { tipo: 't', familia: 'ato', titulo: () => 'T', nomeArquivo: () => 't.pdf', blocos: () => blocos };
  return renderizarDocumento(modelo, null, marcaTeste, emissaoTeste).doc;
};
const quase = (mm: number): Bloco => (ctx) => { ctx.y = ctx.limiteInferior - mm; };

describe('medirAltura', () => {
  it('mede um parágrafo de 3 linhas e não mexe no documento real', () => {
    const ctx = criarContexto({ marca: marcaTeste, orientacao: 'retrato', familia: 'ato' });
    const antes = { y: ctx.y, paginas: ctx.doc.getNumberOfPages() };
    const { altura, paginas } = medirAltura(ctx, [paragrafo({ texto: 'palavra '.repeat(80).trim() })]);
    expect(altura).toBeGreaterThan(10);
    expect(paginas).toBe(1);
    expect({ y: ctx.y, paginas: ctx.doc.getNumberOfPages() }).toEqual(antes);
  });

  it('conteúdo maior que uma página reporta várias páginas', () => {
    const ctx = criarContexto({ marca: marcaTeste, orientacao: 'retrato', familia: 'ato' });
    const { paginas, altura } = medirAltura(ctx, [paragrafo({ texto: 'palavra '.repeat(2500).trim() })]);
    expect(paginas).toBeGreaterThanOrEqual(2);
    expect(altura).toBeGreaterThan(200);
  });
});

describe('manterJunto', () => {
  it('se o grupo não cabe no que resta, vai INTEIRO para a página seguinte', async () => {
    const p = await lerPdf(gerar([
      quase(20),
      manterJunto(paragrafo({ texto: 'ULTIMO-ARTIGO texto do último artigo da portaria' }), assinaturas({ assinantes: [{ nome: 'Ana Souza', cargo: 'Diretora' }] })),
    ]));
    expect(p).toHaveLength(2);
    expect(p[0].texto).not.toContain('ULTIMO-ARTIGO');
    expect(p[1].texto).toContain('ULTIMO-ARTIGO');
    expect(p[1].texto).toContain('Ana Souza');
  });

  it('se o grupo cabe, permanece na mesma página', async () => {
    const p = await lerPdf(gerar([
      manterJunto(paragrafo({ texto: 'ULTIMO-ARTIGO' }), assinaturas({ assinantes: [{ nome: 'Ana Souza' }] })),
    ]));
    expect(p).toHaveLength(1);
    expect(p[0].texto).toContain('Ana Souza');
  });

  it('grupo maior que uma página flui normalmente, sem perder texto', async () => {
    const p = await lerPdf(gerar([manterJunto(paragrafo({ texto: 'palavra '.repeat(2500).trim() }), assinaturas({ assinantes: [{ nome: 'Ana Souza' }] }))]));
    expect(p.length).toBeGreaterThanOrEqual(2);
    expect(p.flatMap((x) => x.itens).reduce((n, i) => n + (i.str.match(/palavra/g)?.length ?? 0), 0)).toBe(2500);
    expect(p[p.length - 1].texto).toContain('Ana Souza');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/lib/documentos/__testes__/medir.test.ts`
Expected: FAIL — `Cannot find module '../blocos/manterJunto'`.

- [ ] **Step 3: Implementar `core/medir.ts`**

```ts
import type { Bloco, ContextoDocumento } from '../tipos';
import { criarContexto } from './pagina';
import { ALTURA_CABECALHO, PAGINA } from './tokens';

/**
 * Mede quanto um grupo de blocos ocupa se desenhado do topo de uma página de conteúdo,
 * num documento descartável (mesma marca, orientação e família). Não altera `ctx`.
 */
export function medirAltura(ctx: ContextoDocumento, blocos: Bloco[]): { altura: number; paginas: number } {
  const e = criarContexto({ marca: ctx.marca, orientacao: ctx.orientacao, familia: ctx.familia });
  const topo = PAGINA.margemTopo + ALTURA_CABECALHO.demais;
  e.y = topo;
  for (const bloco of blocos) bloco(e);
  const paginas = e.doc.getNumberOfPages();
  return { altura: (paginas - 1) * (e.limiteInferior - topo) + (e.y - topo), paginas };
}
```

- [ ] **Step 4: Implementar `blocos/manterJunto.ts` e exportar**

```ts
import { medirAltura } from '../core/medir';
import { ALTURA_CABECALHO, PAGINA } from '../core/tokens';
import type { Bloco } from '../tipos';

/**
 * Mantém os blocos juntos na mesma página: se o grupo cabe numa página mas não no que resta
 * da atual, vai inteiro para a seguinte (ex.: último artigo + local/data + assinatura).
 * Grupo maior que uma página flui normalmente.
 */
export const manterJunto =
  (...blocos: Bloco[]): Bloco =>
  (ctx) => {
    const { altura } = medirAltura(ctx, blocos);
    const capacidade = ctx.limiteInferior - (PAGINA.margemTopo + ALTURA_CABECALHO.demais);
    if (altura <= capacidade) ctx.garantirEspaco(altura);
    for (const bloco of blocos) bloco(ctx);
  };
```
Em `blocos/index.ts` acrescentar `export { manterJunto } from './manterJunto';`.

- [ ] **Step 5: Rodar e ver passar; suíte toda**

Run: `npx vitest run src/lib/documentos 2>&1 | grep -E "✓ src|×|Tests |Test Files"`
Expected: `medir.test.ts` PASS (5 testes) e a suíte inteira verde (61 + 5).

- [ ] **Step 6: Commit**

```bash
git add src/lib/documentos/core/medir.ts src/lib/documentos/blocos/manterJunto.ts src/lib/documentos/blocos/index.ts src/lib/documentos/__testes__/medir.test.ts
git commit -m "feat(documentos): medirAltura e bloco manterJunto (assinatura nunca isolada)

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2b: Endereço da instituição no rodapé de todos os documentos

**Decisão do usuário (12/10/2026):** o rodapé imprime o endereço **do perfil do tenant** (confirmado pelo comprovante de inscrição no CNPJ: Av. Brigadeiro Eduardo Gomes, 3232, Anexo IDJuv, bairro Estados, CEP 69.305-455, Boa Vista/RR). O endereço fixo dos geradores antigos (4124, Aeroporto) estava desatualizado e some com a migração.

**Files:**
- Modify: `src/lib/documentos/tipos.ts` (`MarcaImpressao`), `src/lib/documentos/marca.ts`, `src/lib/documentos/core/moldura.ts`
- Test: `src/lib/documentos/__testes__/marca.test.ts` (acrescenta), `src/lib/documentos/__testes__/renderizar.test.ts` (acrescenta)

**Interfaces:**
- Produces: `MarcaImpressao.enderecoRodape?: string`; `enderecoDoTenant(t: TenantConfig): string` em `marca.ts` → `"Av. Brigadeiro Eduardo Gomes, 3232, Anexo IDJuv – Estados – CEP 69.305-455 – Boa Vista/RR"` (junta só o que existir; vazio se o tenant não tiver endereço).

- [ ] **Step 1: Testes (falham primeiro)**

Em `marca.test.ts`, acrescentar ao tenant de teste `endereco: { logradouro: 'Av. Exemplo', numero: '10', complemento: 'Anexo X', bairro: 'Centro', cep: '00.000-000', cidade: 'Cidade Exemplo', uf: 'EX' }` e:

```ts
it('endereço do rodapé: junta só o que existe, nunca "undefined"', () => {
  expect(enderecoDoTenant(tenant)).toBe('Av. Exemplo, 10, Anexo X – Centro – CEP 00.000-000 – Cidade Exemplo/EX');
  const parcial = { ...tenant, endereco: { cidade: 'Cidade Exemplo', uf: 'EX' } } as TenantConfig;
  expect(enderecoDoTenant(parcial)).toBe('Cidade Exemplo/EX');
  expect(enderecoDoTenant({ ...tenant, endereco: undefined } as TenantConfig)).toBe('');
  expect(marcaDoTenant(tenant, { nomeSistema: 'S' }).enderecoRodape).toBe('Av. Exemplo, 10, Anexo X – Centro – CEP 00.000-000 – Cidade Exemplo/EX');
  expect(marcaDoTenant({ ...tenant, endereco: undefined } as TenantConfig, { nomeSistema: 'S' }).enderecoRodape).toBeUndefined();
});
```
Em `renderizar.test.ts`:

```ts
it('rodapé imprime o endereço da marca sem encostar no nome do sistema; sem endereço, nada é impresso', async () => {
  const marca = { ...marcaTeste, enderecoRodape: 'Av. Exemplo, 10, Anexo X – Centro – CEP 00.000-000 – Cidade Exemplo/EX' };
  const [com] = await lerPdf(renderizarDocumento(modelo, { n: 1 }, marca, emissaoTeste).doc);
  const end = com.itens.find((i) => i.str.startsWith('Av. Exemplo'))!;
  const sis = com.itens.find((i) => i.str.includes('Sistema de Teste'))!;
  expect(end.x + end.largura).toBeLessThan(sis.x);
  const [sem] = await lerPdf(renderizarDocumento(modelo, { n: 1 }, marcaTeste, emissaoTeste).doc);
  expect(sem.texto).not.toContain('Av. Exemplo');
});

it('endereço muito longo é cortado antes do nome do sistema (nunca sobrepõe)', async () => {
  const marca = { ...marcaTeste, enderecoRodape: 'Rua '.concat('muito longa '.repeat(30)) };
  const [p1] = await lerPdf(renderizarDocumento(modelo, { n: 1 }, marca, emissaoTeste).doc);
  const end = p1.itens.find((i) => i.str.startsWith('Rua'))!;
  const sis = p1.itens.find((i) => i.str.includes('Sistema de Teste'))!;
  expect(end.x + end.largura).toBeLessThan(sis.x);
});
```

- [ ] **Step 2: Rodar e ver falhar** — `npx vitest run src/lib/documentos/__testes__/marca.test.ts src/lib/documentos/__testes__/renderizar.test.ts` → FAIL (`enderecoDoTenant` inexistente; endereço não impresso).

- [ ] **Step 3: Implementar**

`tipos.ts`: em `MarcaImpressao` acrescentar `enderecoRodape?: string;`.

`marca.ts`:
```ts
export function enderecoDoTenant(t: TenantConfig): string {
  const e = t.endereco;
  if (!e) return '';
  const rua = [e.logradouro, e.numero].filter(Boolean).join(', ');
  const ruaComComplemento = [rua, e.complemento].filter(Boolean).join(', ');
  const cidade = [e.cidade, e.uf].filter(Boolean).join('/');
  return [ruaComComplemento, e.bairro, e.cep ? `CEP ${e.cep}` : '', cidade].filter(Boolean).join(' – ');
}
```
e em `marcaDoTenant`: `enderecoRodape: enderecoDoTenant(tenant) || undefined,`.

`moldura.ts` (função `rodape`): a 2ª linha do rodapé (`yBase + 8`) passa a ter o **endereço à esquerda** e o **nome do sistema alinhado à direita**:
```ts
const ySegunda = yBase + 8;
doc.setFont('helvetica', 'normal');
doc.setFontSize(FONTE.rodape);
const sistema = paraWinAnsi(marca.nomeSistema);
doc.text(sistema, esquerda + largura, ySegunda, { align: 'right' });
if (marca.enderecoRodape) {
  const folga = 4;
  const disponivel = largura - doc.getTextWidth(sistema) - folga;
  const [primeira] = quebrarEmLinhas(doc, marca.enderecoRodape, disponivel);
  doc.text(primeira, esquerda, ySegunda);
}
```
(importar `quebrarEmLinhas` de `./texto`; remover a linha antiga que desenhava `marca.nomeSistema` à esquerda). Endereço maior que o espaço é cortado na primeira linha que cabe, sem sobrepor.

- [ ] **Step 4: Rodar a suíte da camada e olhar o rodapé**

`npx vitest run src/lib/documentos` → verde. Gerar a amostra do requerimento (`DOCUMENTOS_AMOSTRAS=…`), rasterizar e abrir o PNG: conferir o rodapé (emitido por/data e "Página X de Y" na 1ª linha; endereço e sistema na 2ª) e que as páginas seguintes mantêm o mesmo.

- [ ] **Step 5: Commit**

```bash
git add src/lib/documentos/tipos.ts src/lib/documentos/marca.ts src/lib/documentos/core/moldura.ts src/lib/documentos/__testes__/marca.test.ts src/lib/documentos/__testes__/renderizar.test.ts
git commit -m "feat(documentos): rodapé imprime o endereço do perfil do tenant

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Tenant `numeracaoAtos` e textos das portarias (puros)

**Files:**
- Modify: `src/core/tenant/types.ts` (`TenantLegal`), `tenants/idjuv/tenant.config.ts`, `docs/WHITE_LABEL.md`
- Create: `src/lib/documentos/modelos/portaria/textos.ts`
- Test: `src/lib/documentos/__testes__/portariaTextos.test.ts`

**Interfaces:**
- Produces (`textos.ts`), todas puras e recebendo `TenantConfig`:
  - `parseData(iso: string): Date` — lança `Error('Data inválida: <entrada>')`.
  - `dataExtenso(iso: string): string` → `"5 de outubro de 2026"`.
  - `tituloPortaria(t, numero, dataIso): string` → `"PORTARIA Nº 12/<numeracaoAtos>/2026 DE 05 DE OUTUBRO DE 2026"` (sem `/<numeracaoAtos>` se o tenant não tiver).
  - `preambulo(t): string` → `"<tratamentoDirigente>, no uso das atribuições legais que lhe são conferidas pela <leiCriacao>, e demais normas aplicáveis,"`.
  - `assinaturaDirigente(t): { nome: string; cargo: string }`.
  - `localDoAto(t): string` → `"Cidade – UF"`.
  - `formatarCPF(cpf: string): string`.

- [ ] **Step 1: Escrever os testes (falham primeiro)**

```ts
import { describe, expect, it } from 'vitest';
import type { TenantConfig } from '@/core/tenant';
import { assinaturaDirigente, dataExtenso, formatarCPF, localDoAto, parseData, preambulo, tituloPortaria } from '../modelos/portaria/textos';

const tenant = {
  identidade: {
    nomeOficial: 'Instituto de Teste do Estado de Exemplo – ITE',
    nomeCurto: 'ITE',
    tratamentoDirigente: 'O PRESIDENTE DO INSTITUTO DE TESTE DO ESTADO DE EXEMPLO – ITE',
  },
  legal: { leiCriacao: 'Lei nº 1, de 1º de janeiro de 2000', dirigenteNome: 'Fulano de Tal', dirigenteCargo: 'Presidente', numeracaoAtos: 'ITE/PRESI/GAB' },
  endereco: { cidade: 'Cidade Exemplo', uf: 'EX' },
} as unknown as TenantConfig;
const semNada = { identidade: { nomeOficial: 'X', nomeCurto: 'X', tratamentoDirigente: 'O PRESIDENTE DO X' } } as unknown as TenantConfig;

describe('textos da portaria', () => {
  it('título no padrão oficial, com a numeração do tenant', () => {
    expect(tituloPortaria(tenant, '12/2026', '2026-10-05')).toBe('PORTARIA Nº 12/ITE/PRESI/GAB/2026 DE 05 DE OUTUBRO DE 2026');
  });
  it('número sem barra também funciona', () => {
    expect(tituloPortaria(tenant, '12', '2026-10-05')).toBe('PORTARIA Nº 12/ITE/PRESI/GAB/2026 DE 05 DE OUTUBRO DE 2026');
  });
  it('tenant sem numeração: título sem o trecho, nunca "undefined"', () => {
    const t = tituloPortaria(semNada, '12/2026', '2026-10-05');
    expect(t).toBe('PORTARIA Nº 12/2026 DE 05 DE OUTUBRO DE 2026');
    expect(t).not.toMatch(/undefined|null/);
  });
  it('preâmbulo usa o tratamento do dirigente e a lei do tenant', () => {
    expect(preambulo(tenant)).toBe('O PRESIDENTE DO INSTITUTO DE TESTE DO ESTADO DE EXEMPLO – ITE, no uso das atribuições legais que lhe são conferidas pela Lei nº 1, de 1º de janeiro de 2000, e demais normas aplicáveis,');
  });
  it('preâmbulo sem lei no tenant não imprime "undefined"', () => {
    const p = preambulo(semNada);
    expect(p).toBe('O PRESIDENTE DO X, no uso das atribuições legais que lhe são conferidas e demais normas aplicáveis,');
  });
  it('assinatura do dirigente em caixa alta; sem dados, vazia sem "undefined"', () => {
    expect(assinaturaDirigente(tenant)).toEqual({ nome: 'FULANO DE TAL', cargo: 'Presidente do ITE' });
    expect(assinaturaDirigente(semNada)).toEqual({ nome: '', cargo: 'X' });
  });
  it('local do ato: "Cidade – UF" e vazio quando não há endereço', () => {
    expect(localDoAto(tenant)).toBe('Cidade Exemplo – EX');
    expect(localDoAto(semNada)).toBe('');
  });
  it('data por extenso e data inválida com erro claro', () => {
    expect(dataExtenso('2026-10-05')).toBe('5 de outubro de 2026');
    for (const ruim of ['', '2026-13-40', 'abc']) expect(() => parseData(ruim)).toThrow(/Data inválida/);
  });
  it('CPF com e sem máscara; entrada curta não é mutilada', () => {
    expect(formatarCPF('12345678901')).toBe('123.456.789-01');
    expect(formatarCPF('123.456.789-01')).toBe('123.456.789-01');
    expect(formatarCPF('123')).toBe('123');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/lib/documentos/__testes__/portariaTextos.test.ts`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Campo novo e opcional no tenant**

Em `src/core/tenant/types.ts`, dentro de `TenantLegal`, depois de `dirigenteDecretoNomeacao?: string;`:
```ts
  /** Sigla de numeração dos atos: "IDJuv/PRESI/GAB" em "PORTARIA Nº 12/IDJuv/PRESI/GAB/2026". Ausente: o título sai sem ela. */
  numeracaoAtos?: string;
```
Em `tenants/idjuv/tenant.config.ts`, dentro de `legal: {…}`, depois de `dirigenteDecretoNomeacao: …,`:
```ts
    // Forma já impressa nas portarias emitidas — mantida byte a byte.
    numeracaoAtos: 'IDJuv/PRESI/GAB',
```
Em `docs/WHITE_LABEL.md`, no ponto que lista os campos de `legal`/`tratamentoDirigente` (linha ~165), acrescentar uma linha descrevendo `numeracaoAtos` (opcional; sigla de numeração dos atos). Conferir o formato do arquivo antes de editar.

- [ ] **Step 4: Implementar `textos.ts`**

```ts
import { format, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { TenantConfig } from '@/core/tenant';

export function parseData(iso: string): Date {
  const d = new Date(`${iso}T00:00:00`);
  if (!iso || !isValid(d)) throw new Error(`Data inválida: "${iso}"`);
  return d;
}

export const dataExtenso = (iso: string): string => format(parseData(iso), "d 'de' MMMM 'de' yyyy", { locale: ptBR });

/** "PORTARIA Nº 12/<numeração do tenant>/2026 DE 05 DE OUTUBRO DE 2026". */
export function tituloPortaria(t: TenantConfig, numero: string, dataIso: string): string {
  const data = parseData(dataIso);
  const ano = format(data, 'yyyy');
  const numeroLimpo = numero.split('/')[0];
  const sufixo = t.legal?.numeracaoAtos ? `/${t.legal.numeracaoAtos}` : '';
  const dataCaixaAlta = `${format(data, 'dd')} DE ${format(data, 'MMMM', { locale: ptBR }).toUpperCase()} DE ${ano}`;
  return `PORTARIA Nº ${numeroLimpo}${sufixo}/${ano} DE ${dataCaixaAlta}`;
}

export function preambulo(t: TenantConfig): string {
  const lei = t.legal?.leiCriacao ? ` pela ${t.legal.leiCriacao},` : '';
  return `${t.identidade.tratamentoDirigente}, no uso das atribuições legais que lhe são conferidas${lei} e demais normas aplicáveis,`;
}

export function assinaturaDirigente(t: TenantConfig): { nome: string; cargo: string } {
  const cargo = t.legal?.dirigenteCargo ? `${t.legal.dirigenteCargo} do ${t.identidade.nomeCurto}` : t.identidade.nomeCurto;
  return { nome: (t.legal?.dirigenteNome ?? '').toUpperCase(), cargo };
}

export function localDoAto(t: TenantConfig): string {
  const { cidade, uf } = t.endereco ?? {};
  return [cidade, uf].filter(Boolean).join(' – ');
}

export function formatarCPF(cpf: string): string {
  const n = String(cpf ?? '').replace(/\D/g, '');
  return n.length === 11 ? n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : String(cpf ?? '');
}
```
Atenção ao `preambulo` com lei: o texto esperado é `"...conferidas pela Lei nº 1, de 1º de janeiro de 2000, e demais normas aplicáveis,"` — a vírgula depois da lei vem do `lei` (`" pela <lei>,"`) e o espaço antes de "e demais" do template; sem lei fica `"...conferidas e demais normas aplicáveis,"`. Os dois casos estão nos testes.

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run src/lib/documentos/__testes__/portariaTextos.test.ts && npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -E "src/lib/documentos|src/core/tenant|tenants/" | head`
Expected: testes PASS (9) e nenhum erro de tipo nos arquivos tocados.

- [ ] **Step 6: Commit**

```bash
git add src/core/tenant/types.ts tenants/idjuv/tenant.config.ts docs/WHITE_LABEL.md src/lib/documentos/modelos/portaria/textos.ts src/lib/documentos/__testes__/portariaTextos.test.ts
git commit -m "feat(documentos): textos da portaria a partir do perfil do tenant (legal.numeracaoAtos)

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Modelo `portaria`, tabela de servidores e construtores

**Files:**
- Create: `src/lib/documentos/modelos/portaria/tabelaServidores.ts`, `modelo.ts`, `construtores.ts`, `index.ts`
- Modify: `src/lib/documentos/registro.ts`
- Test: `src/lib/documentos/__testes__/portariaModelo.test.ts`, `portariaConstrutores.test.ts`

**Interfaces:**
- Consumes: Task 2 (`manterJunto`), Task 3 (`textos`), blocos existentes, `ColunaTabela`/`ConfiguracaoTabela`/`Artigo`/`ConfiguracaoAssinatura`/`COLUNA_LABELS` de `@/types/portariaUnificada`.
- Produces:
  - `tabelaServidores.ts`: `ServidorTabela = { nome_completo: string; cpf: string; matricula?: string; cargo: string; codigo: string; unidade_nome?: string; [k: string]: string | undefined }` e `tabelaDeServidores(config: ConfiguracaoTabela, servidores: ServidorTabela[], rotulos?: Partial<Record<string, string>>): { colunas: ColunaTabelaBloco[]; linhas: Record<string, Celula>[] }`.
  - `modelo.ts`: `DadosPortariaModelo` e `portariaModelo: DocumentoModelo<DadosPortariaModelo>`.
  - `construtores.ts`: `dadosNomeacao`, `dadosExoneracao`, `dadosDesignacao`, `dadosColetiva`, `dadosUnificada` — todas `(t: TenantConfig, …) => DadosPortariaModelo` (assinaturas na Step 5).
  - `REGISTRO.portaria`.

```ts
// modelo.ts — formato dos dados
export interface DadosPortariaModelo {
  /** Já montado pelos construtores: "PORTARIA Nº 12/…/2026 DE 05 DE OUTUBRO DE 2026". */
  titulo: string;
  /** ISO yyyy-mm-dd; usada na linha de local e data. */
  dataDocumento: string;
  preambulo: string;
  /** Imprime "RESOLVE:" depois do preâmbulo (as portarias simples têm; a unificada traz no preâmbulo). */
  resolve?: boolean;
  artigos: { numero: string; conteudo: string }[];
  /** Tabela impressa DEPOIS do artigo de número `depoisDoArtigo` (1 = depois do 1º). */
  tabela?: { colunas: ColunaTabela[]; linhas: Record<string, Celula>[]; depoisDoArtigo?: number };
  /** Linha "Local, data por extenso." antes da assinatura (as portarias simples não têm). */
  local?: string;
  assinatura: { nome: string; cargo: string };
  protocolo?: string;
  unidadeEmissora?: string[];
}
```

- [ ] **Step 1: Testes do modelo (falham primeiro)**

`portariaModelo.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { renderizarDocumento } from '../core/renderizar';
import { portariaModelo, type DadosPortariaModelo } from '../modelos/portaria/modelo';
import { emissaoTeste, marcaTeste } from './fixtures';
import { lerPdf } from './lerPdf';

const base: DadosPortariaModelo = {
  titulo: 'PORTARIA Nº 12/2026 DE 05 DE OUTUBRO DE 2026', dataDocumento: '2026-10-05',
  preambulo: 'O PRESIDENTE DO ÓRGÃO DE TESTE, no uso das atribuições legais, e demais normas aplicáveis,',
  resolve: true,
  artigos: [
    { numero: '1º', conteudo: 'NOMEAR FULANO DE TESTE para o cargo de Assessor.' },
    { numero: '2º', conteudo: 'Esta Portaria entra em vigor na data de sua publicação.' },
  ],
  assinatura: { nome: 'BELTRANO DE TESTE', cargo: 'Presidente do Órgão' },
};
const gerar = (d: DadosPortariaModelo) => renderizarDocumento(portariaModelo, d, marcaTeste, emissaoTeste);

describe('portariaModelo', () => {
  it('título, preâmbulo, RESOLVE, artigos em ordem e assinatura', async () => {
    const [p1] = await lerPdf(gerar(base).doc);
    const t = p1.texto;
    expect(t).toContain('PORTARIA Nº 12');
    expect(t.indexOf('O PRESIDENTE')).toBeLessThan(t.indexOf('RESOLVE:'));
    expect(t.indexOf('RESOLVE:')).toBeLessThan(t.indexOf('Art. 1º'));
    expect(t.indexOf('Art. 1º')).toBeLessThan(t.indexOf('Art. 2º'));
    expect(t.indexOf('Art. 2º')).toBeLessThan(t.indexOf('BELTRANO DE TESTE'));
  });

  it('sem `resolve` não imprime RESOLVE:; sem `local` não imprime linha de local/data', async () => {
    const [p1] = await lerPdf(gerar({ ...base, resolve: false }).doc);
    expect(p1.texto).not.toContain('RESOLVE:');
    expect(p1.texto).not.toMatch(/ de outubro de 2026\./);
  });

  it('com `local` imprime "Local, data por extenso."', async () => {
    const [p1] = await lerPdf(gerar({ ...base, local: 'Cidade de Teste' }).doc);
    expect(p1.texto).toContain('Cidade de Teste, 5 de outubro de 2026.');
  });

  it('a tabela vem DEPOIS do artigo indicado e os artigos seguintes depois dela', async () => {
    const d: DadosPortariaModelo = { ...base, artigos: [...base.artigos, { numero: '3º', conteudo: 'Revogam-se as disposições em contrário.' }],
      tabela: { colunas: [{ chave: 'nome', titulo: 'NOME' }], linhas: [{ nome: 'SERVIDOR-A' }, { nome: 'SERVIDOR-B' }] } };
    const [p1] = await lerPdf(gerar(d).doc);
    const t = p1.texto;
    expect(t.indexOf('Art. 1º')).toBeLessThan(t.indexOf('SERVIDOR-A'));
    expect(t.indexOf('SERVIDOR-B')).toBeLessThan(t.indexOf('Art. 2º'));
  });

  it('protocolo e unidade emissora aparecem no cabeçalho', async () => {
    const [p1] = await lerPdf(gerar({ ...base, protocolo: 'RH-2026-000999', unidadeEmissora: ['GABINETE DA PRESIDÊNCIA'] }).doc);
    expect(p1.texto).toContain('Protocolo: RH-2026-000999');
    expect(p1.texto).toContain('GABINETE DA PRESIDÊNCIA');
  });

  it('REVIEW FOCUS 1: último artigo termina rente ao fim da página → artigo, local e assinatura vão juntos para a página seguinte', async () => {
    // preenche a 1ª página com artigos até restar muito pouco espaço
    const artigos = Array.from({ length: 17 }, (_, i) => ({ numero: `${i + 1}º`, conteudo: 'Texto do artigo número de teste com extensão razoável para ocupar linhas. '.repeat(4) }));
    for (let n = 14; n <= 20; n++) {
      const d: DadosPortariaModelo = { ...base, local: 'Cidade de Teste', artigos: artigos.slice(0, n).map((a, i) => ({ ...a, conteudo: i === n - 1 ? 'ULTIMO-ARTIGO texto final' : a.conteudo })) };
      const p = await lerPdf(gerar(d).doc);
      const comAssinatura = p.find((x) => x.texto.includes('BELTRANO DE TESTE'))!;
      expect(comAssinatura.texto).toContain('ULTIMO-ARTIGO');
      expect(comAssinatura.texto).toContain('Cidade de Teste, 5 de outubro de 2026.');
    }
  });

  it('REVIEW FOCUS 6: nome com símbolos fora da fonte (emoji, ł, ✓) não quebra o PDF', async () => {
    const [p1] = await lerPdf(gerar({ ...base, artigos: [{ numero: '1º', conteudo: 'NOMEAR JOÃO ✓ ŁÓDŹ 😀 para o cargo.' }] }).doc);
    expect(p1.texto).toContain('PORTARIA Nº 12');
    expect(p1.texto).toContain('NOMEAR JOÃO');
  });

  it('data do documento inválida lança erro claro ao montar a linha de local e data', () => {
    expect(() => gerar({ ...base, local: 'Cidade de Teste', dataDocumento: '2026-13-40' })).toThrow(/Data inválida/);
  });
});

```
- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/lib/documentos/__testes__/portariaModelo.test.ts`
Expected: FAIL — `Cannot find module '../modelos/portaria/modelo'`.

- [ ] **Step 3: Implementar `tabelaServidores.ts`**

```ts
import type { Celula, ColunaTabela as ColunaBloco } from '../../blocos';
import { COLUNA_LABELS, type ColunaTabela, type ConfiguracaoTabela } from '@/types/portariaUnificada';
import { formatarCPF } from './textos';

export interface ServidorTabela {
  nome_completo: string;
  cpf: string;
  matricula?: string;
  cargo: string;
  codigo: string;
  unidade_nome?: string;
  [chave: string]: string | undefined;
}

// Larguras relativas herdadas do gerador antigo (mm base, escaladas para caber).
const PESOS: Record<ColunaTabela, number> = { numero: 8, nome_completo: 45, cpf: 28, matricula: 20, cargo: 35, unidade_setor: 30, codigo: 10, custom: 20 };
const CENTRALIZADAS: ColunaTabela[] = ['numero', 'cpf', 'codigo'];

const valorDaColuna = (s: ServidorTabela, col: ColunaTabela, i: number): Celula => {
  switch (col) {
    case 'numero': return String(i + 1);
    case 'nome_completo': return s.nome_completo?.toUpperCase();
    case 'cpf': return s.cpf ? formatarCPF(s.cpf) : undefined;
    case 'matricula': return s.matricula;
    case 'cargo': return s.cargo;
    case 'unidade_setor': return s.unidade_nome;
    case 'codigo': return s.codigo;
    default: return undefined;
  }
};

/** Colunas e linhas do bloco `tabela` a partir da configuração da portaria. Valor ausente vira "—" no bloco. */
export function tabelaDeServidores(
  config: ConfiguracaoTabela,
  servidores: ServidorTabela[],
  rotulos: Partial<Record<ColunaTabela, string>> = {},
): { colunas: ColunaBloco[]; linhas: Record<string, Celula>[] } {
  const colunas: ColunaBloco[] = [
    ...config.colunas.map((c) => ({
      chave: c, titulo: rotulos[c] ?? COLUNA_LABELS[c] ?? c, peso: PESOS[c] ?? 20,
      alinhamento: CENTRALIZADAS.includes(c) ? ('centro' as const) : ('esquerda' as const),
    })),
    ...config.colunasPersonalizadas.map((c) => ({ chave: c.id, titulo: c.titulo.toUpperCase(), peso: 20 })),
  ];
  const linhas = servidores.map((s, i) => {
    const linha: Record<string, Celula> = {};
    for (const c of config.colunas) linha[c] = valorDaColuna(s, c, i);
    for (const c of config.colunasPersonalizadas) linha[c.id] = s[c.id];
    return linha;
  });
  return { colunas, linhas };
}
```
Antes de seguir: `sed -n 1,40p src/types/portariaUnificada.ts | grep -n COLUNA_LABELS -A12` para conferir os rótulos reais; a coletiva usa os rótulos legados `Nº`, `NOME COMPLETO`, `CPF`, `CARGO`, `UNIDADE/SETOR`, `CÓD.` — passados explicitamente no construtor da coletiva (Step 5) se `COLUNA_LABELS` diferir.

- [ ] **Step 4: Implementar `modelo.ts` e registrar**

```ts
import { assinaturas, localData, manterJunto, paragrafo, tabela } from '../../blocos';
import type { Bloco } from '../../tipos';
import type { DocumentoModelo } from '../../tipos';
import { paraNomeArquivo } from '../../core/texto';
import type { Celula, ColunaTabela } from '../../blocos';
import { dataExtenso } from './textos';

export interface DadosPortariaModelo {
  /** Título já montado ("PORTARIA Nº 12/…/2026 DE 05 DE OUTUBRO DE 2026"). */
  titulo: string;
  /** ISO yyyy-mm-dd; usada na linha de local e data. */
  dataDocumento: string;
  preambulo: string;
  resolve?: boolean;
  artigos: { numero: string; conteudo: string }[];
  tabela?: { colunas: ColunaTabela[]; linhas: Record<string, Celula>[]; depoisDoArtigo?: number };
  local?: string;
  assinatura: { nome: string; cargo: string };
  protocolo?: string;
  unidadeEmissora?: string[];
}

export const portariaModelo: DocumentoModelo<DadosPortariaModelo> = {
  tipo: 'portaria',
  familia: 'ato',
  titulo: (d) => d.titulo,
  protocolo: (d) => d.protocolo,
  unidadeEmissora: (d) => d.unidadeEmissora ?? [],
  nomeArquivo: (d) => `${paraNomeArquivo(d.titulo.split(' DE ')[0])}.pdf`,
  blocos: (d) => {
    const corpo: { bloco: Bloco; artigo: boolean }[] = [];
    const apos = d.tabela?.depoisDoArtigo ?? 1;
    d.artigos.forEach((a, i) => {
      corpo.push({ bloco: paragrafo({ texto: `Art. ${a.numero} ${a.conteudo}`, alinhamento: 'justificado' }), artigo: true });
      if (d.tabela && i === apos - 1) corpo.push({ bloco: tabela({ colunas: d.tabela.colunas, linhas: d.tabela.linhas }), artigo: false });
    });
    if (d.tabela && d.artigos.length < apos) corpo.push({ bloco: tabela({ colunas: d.tabela.colunas, linhas: d.tabela.linhas }), artigo: false });

    // O último artigo (quando não é seguido por tabela) viaja com o local/data e a assinatura: nunca assinatura isolada.
    const ultimo = corpo[corpo.length - 1]?.artigo ? corpo.pop()!.bloco : undefined;
    const fecho: Bloco[] = [
      ...(d.local ? [localData({ local: d.local, data: dataExtenso(d.dataDocumento) })] : []),
      assinaturas({ assinantes: [{ nome: d.assinatura.nome, cargo: d.assinatura.cargo }] }),
    ];
    return [
      paragrafo({ texto: d.preambulo, alinhamento: 'justificado' }),
      ...(d.resolve ? [paragrafo({ texto: 'RESOLVE:', negrito: true })] : []),
      ...corpo.map((c) => c.bloco),
      manterJunto(...(ultimo ? [ultimo] : []), ...fecho),
    ];
  },
};
```
Em `registro.ts`: `import { portariaModelo } from './modelos/portaria/modelo';` e acrescentar `portaria: portariaModelo,` em `REGISTRO`. `modelos/portaria/index.ts` reexporta `portariaModelo`, `DadosPortariaModelo`, os construtores e `tabelaDeServidores`. O nome do arquivo sai `PORTARIA-N-12.pdf`-like — se o legado usava `Portaria_<numero>_<servidor>.pdf` (função `savePortariaPdf` de `portariaPdf.ts`, que continua dono do nome), `nomeArquivo` do modelo só vale para `emitirDocumento`.

- [ ] **Step 5: Construtores + testes de fidelidade da redação**

`construtores.ts`:

```ts
import type { TenantConfig } from '@/core/tenant';
import type { Artigo, ConfiguracaoAssinatura, ConfiguracaoTabela } from '@/types/portariaUnificada';
import type { DadosPortariaModelo } from './modelo';
import { tabelaDeServidores, type ServidorTabela } from './tabelaServidores';
import { assinaturaDirigente, formatarCPF, localDoAto, preambulo, tituloPortaria } from './textos';

type Portaria = { numero: string; data_documento: string };
type Servidor = { nome_completo: string; cpf: string; matricula?: string };
type Cargo = { nome: string; sigla?: string; simbolo?: string };
type Unidade = { nome: string; sigla?: string };

const base = (t: TenantConfig, p: Portaria) => ({
  titulo: tituloPortaria(t, p.numero, p.data_documento),
  dataDocumento: p.data_documento,
  assinatura: assinaturaDirigente(t),
});
const ARTIGO_VIGOR = { numero: '2º', conteudo: 'Esta Portaria entra em vigor na data de sua publicação.' };

export function dadosNomeacao(t: TenantConfig, p: Portaria, s: Servidor, c: Cargo): DadosPortariaModelo {
  const simbolo = c.simbolo ? `, código ${c.simbolo}` : '';
  return {
    ...base(t, p), preambulo: preambulo(t), resolve: true,
    artigos: [
      { numero: '1º', conteudo: `NOMEAR ${s.nome_completo.toUpperCase()}, para exercer o cargo em comissão de ${c.nome.toUpperCase()}${simbolo}, integrante da estrutura organizacional do ${t.identidade.nomeOficial}.` },
      ARTIGO_VIGOR,
    ],
  };
}

export function dadosExoneracao(t: TenantConfig, p: Portaria, s: Servidor, c: Cargo, u: Unidade, motivo: 'pedido' | 'oficio' = 'pedido'): DadosPortariaModelo {
  const motivoTexto = motivo === 'pedido' ? 'a pedido' : 'de ofício';
  return {
    ...base(t, p), preambulo: preambulo(t), resolve: true,
    artigos: [
      { numero: '1º', conteudo: `EXONERAR, ${motivoTexto}, ${s.nome_completo.toUpperCase()}, inscrito(a) no CPF nº ${formatarCPF(s.cpf)}, do cargo de ${c.nome}, no(a) ${u.nome}, do ${t.identidade.nomeOficial}.` },
      ARTIGO_VIGOR,
    ],
  };
}

export function dadosDesignacao(t: TenantConfig, p: Portaria, s: Servidor, c: Cargo, origem: Unidade, destino: Unidade): DadosPortariaModelo {
  return {
    ...base(t, p), preambulo: preambulo(t), resolve: true,
    artigos: [
      { numero: '1º', conteudo: `DESIGNAR ${s.nome_completo.toUpperCase()}, inscrito(a) no CPF nº ${formatarCPF(s.cpf)}, ocupante do cargo de ${c.nome}, lotado(a) no(a) ${origem.nome}, para exercer suas atividades no(a) ${destino.nome}.` },
      ARTIGO_VIGOR,
    ],
  };
}

const COLUNAS_COLETIVA: ConfiguracaoTabela = {
  habilitada: true, colunasPersonalizadas: [],
  colunas: ['numero', 'nome_completo', 'cpf', 'cargo', 'unidade_setor', 'codigo'],
};
const ROTULOS_COLETIVA = { numero: 'Nº', nome_completo: 'NOME COMPLETO', cpf: 'CPF', cargo: 'CARGO', unidade_setor: 'UNIDADE/SETOR', codigo: 'CÓD.' } as const;

export function dadosColetiva(t: TenantConfig, p: Portaria, cabecalho: string, servidores: ServidorTabela[], tipoAcao: 'nomeacao' | 'exoneracao' = 'nomeacao'): DadosPortariaModelo {
  const verbo = tipoAcao === 'nomeacao' ? 'NOMEAR' : 'EXONERAR';
  const { colunas, linhas } = tabelaDeServidores(COLUNAS_COLETIVA, servidores, ROTULOS_COLETIVA);
  return {
    ...base(t, p), preambulo: cabecalho,
    artigos: [
      { numero: '1º', conteudo: `${verbo} os servidores abaixo relacionados para os respectivos cargos em comissão do ${t.identidade.nomeOficial}:` },
      { numero: '2º', conteudo: `Os nomeados farão jus à remuneração correspondente aos respectivos cargos${t.legal?.leiCriacao ? `, conforme disposto no Anexo I da ${t.legal.leiCriacao}` : ''}.` },
      { numero: '3º', conteudo: 'Esta Portaria entra em vigor na data de sua publicação.' },
    ],
    tabela: { colunas, linhas, depoisDoArtigo: 1 },
    local: localDoAto(t),
  };
}

export function dadosUnificada(t: TenantConfig, p: Portaria, pre: string, artigos: Artigo[], servidores: ServidorTabela[], config: ConfiguracaoTabela, assinatura: ConfiguracaoAssinatura): DadosPortariaModelo {
  const tabela = config.habilitada && servidores.length > 0 ? { ...tabelaDeServidores(config, servidores), depoisDoArtigo: 1 } : undefined;
  return {
    titulo: tituloPortaria(t, p.numero, p.data_documento),
    dataDocumento: p.data_documento,
    preambulo: pre,
    artigos: artigos.map((a) => ({ numero: a.numero, conteudo: a.conteudo })),
    tabela,
    local: assinatura.local,
    assinatura: { nome: assinatura.nome, cargo: assinatura.cargo },
  };
}
```
Notas de fidelidade já conferidas no código antigo: nomeação/exoneração/designação **não** têm linha de local/data (sem `local`); a coletiva e a unificada têm; `tipoNomeacao`, `dataEfeitos`, `dataInicio` e `dataFim` são aceitos pelos geradores antigos e **não usados no texto** — por isso não entram nos construtores; a "ementa" também não é impressa.

`portariaConstrutores.test.ts` (usa um tenant fictício; os textos esperados são montados do próprio tenant, o que prova ausência de literal de cliente):

```ts
import { describe, expect, it } from 'vitest';
import type { TenantConfig } from '@/core/tenant';
import { dadosColetiva, dadosDesignacao, dadosExoneracao, dadosNomeacao, dadosUnificada } from '../modelos/portaria/construtores';
import { renderizarDocumento } from '../core/renderizar';
import { portariaModelo } from '../modelos/portaria/modelo';
import { emissaoTeste, marcaTeste } from './fixtures';
import { entradasLegado as e } from './fixturesPortaria';
import { lerPdf } from './lerPdf';

const t = {
  identidade: { nomeOficial: 'Instituto de Teste do Estado de Exemplo – ITE', nomeCurto: 'ITE', tratamentoDirigente: 'O PRESIDENTE DO INSTITUTO DE TESTE DO ESTADO DE EXEMPLO – ITE' },
  legal: { leiCriacao: 'Lei nº 1, de 1º de janeiro de 2000', dirigenteNome: 'Fulano de Tal', dirigenteCargo: 'Presidente', numeracaoAtos: 'ITE/PRESI/GAB' },
  endereco: { cidade: 'Cidade Exemplo', uf: 'EX' },
} as unknown as TenantConfig;
const norm = (s: string) => s.replace(/\s+/g, ' ');
const pdfDe = async (d: ReturnType<typeof dadosNomeacao>) => norm((await lerPdf(renderizarDocumento(portariaModelo, d, marcaTeste, emissaoTeste).doc)).map((p) => p.texto).join(' '));

describe('construtores das portarias', () => {
  it('nomeação: redação do Art. 1º e do Art. 2º', async () => {
    const d = dadosNomeacao(t, e.nomeacao.portaria, e.nomeacao.servidor, e.nomeacao.cargo);
    expect(d.artigos[0].conteudo).toBe('NOMEAR MARIA DE SOUZA LIMA, para exercer o cargo em comissão de ASSESSOR TÉCNICO, código CC-3, integrante da estrutura organizacional do Instituto de Teste do Estado de Exemplo – ITE.');
    expect(d.artigos[1]).toEqual({ numero: '2º', conteudo: 'Esta Portaria entra em vigor na data de sua publicação.' });
    expect(d.resolve).toBe(true);
    expect(d.local).toBeUndefined();
    const texto = await pdfDe(d);
    expect(texto).toContain('RESOLVE:');
    expect(texto).toContain('FULANO DE TAL');
    expect(texto).toContain('Presidente do ITE');
  });

  it('nomeação sem símbolo no cargo não imprime ", código undefined"', () => {
    const d = dadosNomeacao(t, e.nomeacao.portaria, e.nomeacao.servidor, { nome: 'Assessor' });
    expect(d.artigos[0].conteudo).not.toMatch(/código|undefined/);
  });

  it('exoneração a pedido e de ofício, CPF formatado', () => {
    const a = dadosExoneracao(t, e.exoneracao.portaria, e.exoneracao.servidor, e.exoneracao.cargo, e.exoneracao.unidade, 'pedido');
    expect(a.artigos[0].conteudo).toBe('EXONERAR, a pedido, MARIA DE SOUZA LIMA, inscrito(a) no CPF nº 123.456.789-01, do cargo de Assessor Técnico, no(a) Divisão de Projetos, do Instituto de Teste do Estado de Exemplo – ITE.');
    expect(dadosExoneracao(t, e.exoneracao.portaria, e.exoneracao.servidor, e.exoneracao.cargo, e.exoneracao.unidade, 'oficio').artigos[0].conteudo).toContain('EXONERAR, de ofício,');
  });

  it('designação: origem e destino', () => {
    const d = dadosDesignacao(t, e.designacao.portaria, e.designacao.servidor, e.designacao.cargo, e.designacao.unidadeOrigem, e.designacao.unidadeDestino);
    expect(d.artigos[0].conteudo).toBe('DESIGNAR MARIA DE SOUZA LIMA, inscrito(a) no CPF nº 123.456.789-01, ocupante do cargo de Assessor Técnico, lotado(a) no(a) Divisão de Projetos, para exercer suas atividades no(a) Gabinete da Presidência.');
  });

  it('coletiva: 3 artigos, tabela depois do 1º, local do tenant, 40 servidores em várias páginas sem perder ninguém', async () => {
    const d = dadosColetiva(t, e.coletiva.portaria, e.coletiva.cabecalho, e.coletiva.servidores, 'nomeacao');
    expect(d.artigos.map((a) => a.numero)).toEqual(['1º', '2º', '3º']);
    expect(d.artigos[0].conteudo).toBe('NOMEAR os servidores abaixo relacionados para os respectivos cargos em comissão do Instituto de Teste do Estado de Exemplo – ITE:');
    expect(d.artigos[1].conteudo).toBe('Os nomeados farão jus à remuneração correspondente aos respectivos cargos, conforme disposto no Anexo I da Lei nº 1, de 1º de janeiro de 2000.');
    expect(d.local).toBe('Cidade Exemplo – EX');
    const texto = await pdfDe(d);
    for (let i = 1; i <= 40; i++) expect(texto).toContain(`SERVIDOR DE TESTE ${i}`);
    expect(texto.indexOf('Art. 1º')).toBeLessThan(texto.indexOf('SERVIDOR DE TESTE 1 '));
    expect(texto.indexOf('SERVIDOR DE TESTE 40')).toBeLessThan(texto.indexOf('Art. 3º'));
  });

  it('REVIEW FOCUS 2/5: coletiva com 300 servidores e campos ausentes — nada some, ausente vira "—"', async () => {
    const muitos = Array.from({ length: 300 }, (_, i) => ({ nome_completo: `Pessoa ${i + 1}`, cpf: String(20000000000 + i), cargo: '', codigo: '', unidade_nome: undefined }));
    const d = dadosColetiva(t, e.coletiva.portaria, 'cabeçalho', muitos, 'exoneracao');
    const p = await lerPdf(renderizarDocumento(portariaModelo, d, marcaTeste, emissaoTeste).doc);
    expect(p.length).toBeGreaterThanOrEqual(6);
    const todo = p.flatMap((x) => x.itens.map((i) => i.str));
    expect(todo.filter((s) => /^PESSOA \d+$/.test(s))).toHaveLength(300);
    expect(todo).toContain('—');
    expect(p[p.length - 1].texto).toContain('FULANO DE TAL');
    for (const pg of p) expect(pg.texto).toContain('NOME COMPLETO');
  });

  it('unificada: artigos, tabela com coluna personalizada, assinatura e local informados pelo usuário', async () => {
    const d = dadosUnificada(t, e.unificada.portaria, e.unificada.preambulo, e.unificada.artigos, e.unificada.servidores as any,
      { ...e.unificada.configTabela, colunas: [...e.unificada.configTabela.colunas] } as any, e.unificada.assinatura);
    const texto = await pdfDe(d);
    expect(texto).toContain('PORTARIA Nº 12/ITE/PRESI/GAB/2026 DE 05 DE OUTUBRO DE 2026');
    expect(texto).toContain('OBSERVAÇÃO');
    expect(texto).toContain('ver ofício');
    expect(texto).toContain('Cidade de Teste, 5 de outubro de 2026.');
    expect(texto).toContain('FULANO DE TESTE');
    expect(texto.indexOf('Art. 1º')).toBeLessThan(texto.indexOf('SERVIDOR DE TESTE 1 '));
    expect(texto.indexOf('SERVIDOR DE TESTE 12')).toBeLessThan(texto.indexOf('Art. 2º'));
  });

  it('unificada com tabela desabilitada ou sem servidores não imprime tabela', () => {
    const cfg = { ...e.unificada.configTabela, habilitada: false, colunas: [...e.unificada.configTabela.colunas] } as any;
    expect(dadosUnificada(t, e.unificada.portaria, 'p', e.unificada.artigos, e.unificada.servidores as any, cfg, e.unificada.assinatura).tabela).toBeUndefined();
  });

  it('REVIEW FOCUS 4/6: data inválida e número sem barra', () => {
    expect(() => dadosNomeacao(t, { numero: '1/2026', data_documento: '' }, e.nomeacao.servidor, e.nomeacao.cargo)).toThrow(/Data inválida/);
    expect(dadosNomeacao(t, { numero: '7', data_documento: '2026-10-05' }, e.nomeacao.servidor, e.nomeacao.cargo).titulo).toBe('PORTARIA Nº 7/ITE/PRESI/GAB/2026 DE 05 DE OUTUBRO DE 2026');
  });
});
```
Nota sobre `pdfDe`: o texto do PDF pode separar palavras em itens; a comparação normaliza espaços. Se um `toContain` de frase longa falhar só por quebra de linha entre itens, comparar com `norm()` dos dois lados já está feito; não relaxar para "contém a primeira palavra".

- [ ] **Step 6: Rodar tudo, tipos, e ver passar**

Run: `npx vitest run src/lib/documentos 2>&1 | grep -E "✓ src|×|Tests |Test Files|AssertionError"; npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -E "src/lib/documentos" | head`
Expected: tudo PASS; nenhum erro de tipo em `src/lib/documentos`. Se o teste "REVIEW FOCUS 1" falhar, o defeito está em `manterJunto`/`modelo.ts` (o último artigo não viajou com a assinatura) — corrigir na causa, não no teste.

- [ ] **Step 7: Commit**

```bash
git add src/lib/documentos/modelos/portaria src/lib/documentos/registro.ts src/lib/documentos/__testes__/portariaModelo.test.ts src/lib/documentos/__testes__/portariaConstrutores.test.ts
git commit -m "feat(documentos): modelo de portaria, tabela de servidores e construtores por tipo

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Fachadas assíncronas no lugar dos geradores antigos

**Files:**
- Rewrite: `src/lib/pdfPortarias.ts`
- Modify: `src/lib/portariaPdf.ts`, `src/components/portarias/PortariaColetivaDialog.tsx`, `src/pages/rh/CentralPortariasPage.tsx`

**Interfaces:**
- Produces (todas `async`, devolvem `Promise<jsPDF>`, **mesmos parâmetros de antes**):
  `generatePortariaUnificadaPdf(portaria, preambulo, artigos, servidores, configTabela, assinatura)`, `generatePortariaColetivaComTabela(portaria, cabecalho, servidores, tipoAcao?)`, `generatePortariaNomeacao(portaria, servidor, cargo, unidade, tipoNomeacao?, dataEfeitos?)`, `generatePortariaExoneracao(portaria, servidor, cargo, unidade, motivo?)`, `generatePortariaDesignacao(portaria, servidor, cargo, unidadeOrigem, unidadeDestino, dataInicio, dataFim?)`; e `buildPortariaPdfDoc(params): Promise<jsPDF>`.

- [ ] **Step 1: Listar todos os chamadores (a mudança de `sync` para `async` quebra quem não faz `await`)**

Run:
```bash
grep -rn "generatePortariaNomeacao\|generatePortariaExoneracao\|generatePortariaDesignacao\|generatePortariaColetivaComTabela\|generatePortariaUnificadaPdf\|buildPortariaPdfDoc" src --include=*.ts --include=*.tsx | grep -v "^src/lib/pdfPortarias.ts"
```
Expected: `portariaPdf.ts` (3 chamadas), `PortariaColetivaDialog.tsx:190`, `NovaPortariaUnificada.tsx:343` (já `await`), `CentralPortariasPage.tsx:171`. Qualquer outro chamador achado aqui entra no Step 4.

- [ ] **Step 2: Reescrever `src/lib/pdfPortarias.ts` como fachada**

```ts
/**
 * Fachada de compatibilidade das portarias: mesmas funções e parâmetros de antes, agora
 * desenhadas pelo modelo `portaria` de src/lib/documentos/ (padrão único de impressão).
 * Passaram a ser assíncronas (os logos do tenant carregam de forma assíncrona).
 * Ver docs/PADRAO_DOCUMENTOS.md.
 */
import type jsPDF from 'jspdf';
import { getTenantSnapshot } from '@/core/tenant';
import type { Artigo, ConfiguracaoAssinatura, ConfiguracaoTabela } from '@/types/portariaUnificada';
import { emitirDocumento } from './documentos';
import {
  dadosColetiva, dadosDesignacao, dadosExoneracao, dadosNomeacao, dadosUnificada,
} from './documentos/modelos/portaria/construtores';
import type { ServidorTabela } from './documentos/modelos/portaria/tabelaServidores';

type Portaria = { numero: string; data_documento: string; ementa?: string; conteudo?: string };
type Servidor = { nome_completo: string; cpf: string; matricula?: string };
type Cargo = { nome: string; sigla?: string; simbolo?: string };
type Unidade = { nome: string; sigla?: string };

const gerar = async (dados: ReturnType<typeof dadosNomeacao>): Promise<jsPDF> => (await emitirDocumento('portaria', dados)).doc;

export const generatePortariaUnificadaPdf = (
  portaria: { numero: string; data_documento: string }, preambulo: string, artigos: Artigo[],
  servidores: ServidorTabela[], configTabela: ConfiguracaoTabela, assinatura: ConfiguracaoAssinatura,
): Promise<jsPDF> => gerar(dadosUnificada(getTenantSnapshot(), portaria, preambulo, artigos, servidores, configTabela, assinatura));

export const generatePortariaColetivaComTabela = (
  portaria: { numero: string; data_documento: string }, cabecalho: string, servidores: ServidorTabela[],
  tipoAcao: 'nomeacao' | 'exoneracao' = 'nomeacao',
): Promise<jsPDF> => gerar(dadosColetiva(getTenantSnapshot(), portaria, cabecalho, servidores, tipoAcao));

/** `tipoNomeacao` e `dataEfeitos` eram aceitos e nunca usados no texto; mantidos só pela assinatura. */
export const generatePortariaNomeacao = (
  portaria: Portaria, servidor: Servidor, cargo: Cargo, _unidade: Unidade,
  _tipoNomeacao: 'comissionado' | 'efetivo' = 'comissionado', _dataEfeitos?: string,
): Promise<jsPDF> => gerar(dadosNomeacao(getTenantSnapshot(), portaria, servidor, cargo));

export const generatePortariaExoneracao = (
  portaria: Portaria, servidor: Servidor, cargo: Cargo, unidade: Unidade, motivo: 'pedido' | 'oficio' = 'pedido',
): Promise<jsPDF> => gerar(dadosExoneracao(getTenantSnapshot(), portaria, servidor, cargo, unidade, motivo));

/** `dataInicio` e `dataFim` eram aceitos e nunca usados no texto; mantidos só pela assinatura. */
export const generatePortariaDesignacao = (
  portaria: Portaria, servidor: Servidor, cargo: Cargo, unidadeOrigem: Unidade, unidadeDestino: Unidade,
  _dataInicio: string, _dataFim?: string,
): Promise<jsPDF> => gerar(dadosDesignacao(getTenantSnapshot(), portaria, servidor, cargo, unidadeOrigem, unidadeDestino));
```

- [ ] **Step 3: `portariaPdf.ts` — `buildPortariaPdfDoc` assíncrono**

Trocar `export function buildPortariaPdfDoc(params: {…}): jsPDF {` por `export async function buildPortariaPdfDoc(params: {…}): Promise<jsPDF> {` e, nas três chamadas, `return generatePortaria…(` → `return await generatePortaria…(`. O corpo do `switch`, os parâmetros e `savePortariaPdf` (que continua dono do nome do arquivo) ficam como estão.

- [ ] **Step 4: Chamadores síncronos**

- `PortariaColetivaDialog.tsx:190`: `const doc = generatePortariaColetivaComTabela(` → `const doc = await generatePortariaColetivaComTabela(` (conferir que a função envolvente é `async`; se não for, marcá-la `async`).
- `CentralPortariasPage.tsx:171`: `const doc = buildPortariaPdfDoc({` → `const doc = await buildPortariaPdfDoc({` (idem).
- Qualquer outro chamador do Step 1: mesmo tratamento.
- `NovaPortariaUnificada.tsx:343` já usa `await`: nada a fazer.

- [ ] **Step 5: Tipos, lint e gate parcial**

Run:
```bash
npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -E "Portaria|portaria|documentos" | head
node scripts/check-jspdf-fora-do-core.mjs
npx vitest run src/lib/documentos 2>&1 | grep -E "Tests |Test Files"
```
Expected: nenhum erro de tipo nos arquivos de portaria (um erro "Promise<jsPDF> não tem `.save`" aponta chamador sem `await`); guard imprime **45** (o `pdfPortarias.ts` deixou de importar jsPDF por valor); vitest verde.

- [ ] **Step 6: Baseline do guard e commit**

Editar `scripts/gate-baseline.json`: `"jspdfForaDoCore": 45`.

```bash
git add src/lib/pdfPortarias.ts src/lib/portariaPdf.ts src/components/portarias/PortariaColetivaDialog.tsx src/pages/rh/CentralPortariasPage.tsx scripts/gate-baseline.json
git commit -m "refactor(portarias): geradores de PDF viram fachadas do modelo portaria (async)

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Prova de fidelidade da redação e do layout (antes × depois)

**Files:**
- Create (temporário, **nunca commitar**): `src/lib/documentos/__testes__/fidelidade.local.test.ts`

**Interfaces:**
- Consumes: PDFs "antes" da Task 1 (`$SP`), fachadas da Task 5, `entradasLegado`.
- Produces: PDFs "depois" + saída de `scripts/documentos-comparar.mjs` para cada um dos cinco; relatório de diferenças de redação (esperado: nenhuma).

- [ ] **Step 1: Gerar os PDFs "depois" com o tenant real**

```ts
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'vitest';
import * as novo from '@/lib/pdfPortarias';
import { entradasLegado as e } from './fixturesPortaria';

const saida = process.env.PORTARIAS_DEPOIS!;
const gravar = (nome: string, doc: { output: (t: 'arraybuffer') => ArrayBuffer }) => writeFileSync(join(saida, nome), Buffer.from(doc.output('arraybuffer')));

describe.skipIf(!saida)('gerar depois', () => {
  it('grava os cinco', async () => {
    mkdirSync(saida, { recursive: true });
    gravar('nomeacao.pdf', await novo.generatePortariaNomeacao(e.nomeacao.portaria, e.nomeacao.servidor, e.nomeacao.cargo, e.nomeacao.unidade));
    gravar('exoneracao.pdf', await novo.generatePortariaExoneracao(e.exoneracao.portaria, e.exoneracao.servidor, e.exoneracao.cargo, e.exoneracao.unidade, e.exoneracao.motivo));
    gravar('designacao.pdf', await novo.generatePortariaDesignacao(e.designacao.portaria, e.designacao.servidor, e.designacao.cargo, e.designacao.unidadeOrigem, e.designacao.unidadeDestino, e.designacao.dataInicio, e.designacao.dataFim));
    gravar('coletiva.pdf', await novo.generatePortariaColetivaComTabela(e.coletiva.portaria, e.coletiva.cabecalho, e.coletiva.servidores, e.coletiva.tipoAcao));
    gravar('unificada.pdf', await novo.generatePortariaUnificadaPdf(e.unificada.portaria, e.unificada.preambulo, e.unificada.artigos, e.unificada.servidores as any, { ...e.unificada.configTabela, colunas: [...e.unificada.configTabela.colunas] } as any, e.unificada.assinatura));
  });
});
```
Run (`emitirDocumento` usa `Image`/`document` para os logos; em Node `carregarLogo` cai no `catch` e devolve `undefined` — documento sem logos, esperado):
```bash
A=/tmp/claude-0/-root/7f60567f-6c48-49ed-8c19-594ba9577a33/scratchpad/portarias-antes
D=/tmp/claude-0/-root/7f60567f-6c48-49ed-8c19-594ba9577a33/scratchpad/portarias-depois
VITE_TENANT_SLUG=idjuv PORTARIAS_DEPOIS=$D npx vitest run src/lib/documentos/__testes__/fidelidade.local.test.ts 2>&1 | tail -8
for f in nomeacao exoneracao designacao coletiva unificada; do echo "=== $f"; node scripts/documentos-comparar.mjs $A/$f.pdf $D/$f.pdf --saida $D/cmp-$f | head -30; done
```
Se `emitirDocumento` não funcionar em Node (usa `@/core/tenant` + `logoOrgao()` ⇒ import de PNG), registrar no ledger e substituir o Step por `renderizarDocumento(portariaModelo, dados, marca, emissao)` com `marcaDoTenant(getTenantSnapshot(), { nomeSistema: 'x' })` dentro do teste temporário.

- [ ] **Step 2: Conferir a redação**

Expected, para cada PDF: na seção "texto que SUMIU" não aparece **nenhuma frase de artigo, preâmbulo, fecho ou título** (só cabeçalho/rodapé antigos: nome do órgão por linhas, endereço do rodapé, "Página X de Y" no formato antigo); na seção "texto NOVO" aparecem cabeçalho/rodapé padronizados. Diferenças de **redação** são bug e voltam para Task 3/4. Diferenças esperadas e a registrar para o usuário: marcador de célula vazia (`-` antigo → `—` novo), rodapé sem o endereço (ver "Decisões do usuário" abaixo), título e preâmbulo em Times justificado (antes Helvetica à esquerda).

- [ ] **Step 3: Olhar os PNGs lado a lado e anotar**

Abrir com Read `antes-1.png` e `depois-1.png` de `nomeacao`, `coletiva` e `unificada` em `$D/cmp-*`. Verificar a olho: título, preâmbulo, "RESOLVE:", artigos, tabela (cabeçalho repetido, zebra), local/data, assinatura **nunca isolada**, cabeçalho com protocolo ausente (sem linha vazia). Defeito visual → teste que o prenda + correção na tarefa dona antes de seguir.

- [ ] **Step 4: Apagar o temporário; guardar as imagens para o usuário**

```bash
rm src/lib/documentos/__testes__/fidelidade.local.test.ts
git status --short   # nada novo para commitar
```
Copiar os PNGs de comparação para um lugar que o usuário consiga abrir e citar os caminhos no relatório final. Nenhum commit nesta tarefa.

---

### Task 7: Docs, gate completo e revisão

**Files:**
- Modify: `docs/PADRAO_DOCUMENTOS.md`, `docs/GOVERNANCA_DOCUMENTACAO.md` (só se algo novo for cobrado)

- [ ] **Step 1: Atualizar `docs/PADRAO_DOCUMENTOS.md`**

- §2 (inventário): na linha de `pdfPortarias.ts` e `portariaPdf.ts`, trocar a coluna fase para "F2a — migrado (fachada async sobre o modelo `portaria`)" e a contagem de linhas pelo valor real (`wc -l`); rodar `node scripts/documentos-inventario.mjs` e conferir os "exports" e "telas".
- §4 (anatomia): acrescentar `modelos/portaria/` e `core/medir.ts`/`blocos/manterJunto.ts`.
- §6 (limitações): **remover** a pendência "assinatura isolada em página" e, no §3, citar `manterJunto` como o jeito de manter um grupo junto; acrescentar "Exportação Word das portarias (`wordPortarias.ts`) ainda duplica o texto; migrar na fase seguinte" e "geradores `pdfMemorandoLotacao`, `pdfTermoAutorizacao`, `pdfTermoResponsabilidade`, `pdfFederacoesModular` seguem sem chamador".
- Atualizar a skill `.claude/skills/novo-documento-idjuv/SKILL.md`: remover o item "Migrar Atos antes de resolver 'assinatura isolada'" e acrescentar "use `manterJunto` para agrupar o último parágrafo com a assinatura".
- `docs/WHITE_LABEL.md`: já recebeu `numeracaoAtos` na Task 3; conferir.

- [ ] **Step 2: Gate completo e leitura do resultado**

Run: `bash scripts/gate.sh > $SP/gate-f2a.log 2>&1; sed 's/\x1b\[[0-9;]*m//g' $SP/gate-f2a.log | grep -aE "✔|✘|▸ (typecheck|lint|cor crua|jsPDF)|Gate |Tests "`
Expected: "Gate verde"; typecheck/lint/cor crua ≤ baseline; `jsPDF fora de documentos/core: 45 arquivos (baseline 45)`; vitest com a contagem de testes impressa (colar o número na resposta final).

- [ ] **Step 3: Conferir escopo e tenant-agnóstico**

```bash
git diff claude/padrao-impressao...HEAD --name-only | grep -vE "^(src/lib/documentos|src/lib/pdfPortarias|src/lib/portariaPdf|src/components/portarias/PortariaColetivaDialog|src/pages/rh/CentralPortariasPage|src/core/tenant/types|tenants/idjuv/tenant.config|docs/|scripts/gate-baseline|\.claude/skills/novo-documento)" || echo "OK: só arquivos do plano"
grep -rniE "idjuv|roraima|boa vista|2\.301|PRESI" src/lib/documentos src/lib/pdfPortarias.ts src/lib/portariaPdf.ts || echo "OK: nenhum literal de cliente"
git status --short | head
```
Expected: duas linhas "OK" e árvore limpa. Qualquer literal encontrado volta para o tenant.

- [ ] **Step 4: Revisão independente e relatório**

Despachar `revisor-codigo-idjuv` (ou `agent-skills:code-reviewer`) sobre `git diff claude/padrao-impressao...HEAD` com: este plano e a spec; o Review Focus verbatim; as regras do `AGENTS.md` (invariantes 4, 7, 8); e a pergunta "algum bloqueante? a redação legal mudou?". Corrigir Críticos/Importantes com teste que falha antes; menores → relatório.

- [ ] **Step 5: Commit das docs e PR em rascunho (só com o pedido do usuário)**

```bash
git add docs/PADRAO_DOCUMENTOS.md .claude/skills/novo-documento-idjuv/SKILL.md
git commit -m "docs: portarias migradas para o padrão; manterJunto e fim da pendência da assinatura isolada

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```
Push e PR: o usuário já autorizou PR em rascunho para esta frente; `GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=url.git@github.com:.insteadOf GIT_CONFIG_VALUE_0=https://github.com/ /root/abrir-pr.sh -d -B claude/padrao-impressao -t "Portarias no padrão único de impressão (F2a)" -b "…"` (o push roda o gate do pre-push, ~3 min: usar `timeout` alto ou background). **Não mergear.**

---

## Decisões do usuário (levar ao relatório; não bloqueiam a execução)

1. ~~Rodapé sem endereço~~ **Decidido (12/10/2026):** o rodapé de todos os documentos imprime o endereço do perfil do tenant (Task 2b). O comprovante de inscrição no CNPJ confirma o endereço do perfil (3232, Anexo IDJuv, Estados); o endereço fixo antigo (4124, Aeroporto) estava desatualizado. Observação ao usuário: o portal público diz "Sede: Parque Anauá", que não bate com o cadastro.
2. **Layout:** as portarias passam de Helvetica à esquerda (margem esquerda 25 mm) para **Times justificado** (margens 20 mm). É a padronização pedida; o usuário valida pelo antes/depois da Task 6.
3. **Marcador de célula vazia:** `-` (antigo) → `—` (padrão).
4. **`numeracaoAtos`:** campo novo, opcional, no perfil do tenant (`legal.numeracaoAtos`); outros clientes preenchem o seu.

## Self-Review

**Cobertura da spec (§8 F2 + pendência da F1):** assinatura isolada → Task 2 (`manterJunto`) + Task 4 (último artigo + local/data + assinatura no grupo); portarias (5 geradores) → Tasks 3–5; "wrapper de uma linha mantém a assinatura" → Task 5; antes/depois aprovado pelo usuário → Task 6 (a aprovação em si é do usuário, depois); baseline do guard cai → Task 5; sem nome de cliente → Tasks 3/7; docs e skill → Task 7.

**Placeholders:** nenhum "TBD/TODO". Duas ramificações condicionais têm ação definida (Task 1 Step 2 se o legado não rodar em Node; Task 6 Step 1 se `emitirDocumento` não rodar em Node).

**Consistência de tipos:** `DadosPortariaModelo` (campos `titulo`, `dataDocumento`, `preambulo`, `resolve?`, `artigos`, `tabela?`, `local?`, `assinatura`, `protocolo?`, `unidadeEmissora?`) é o mesmo em modelo, construtores e testes; `tabelaDeServidores(config, servidores, rotulos?)` idem; `manterJunto(...blocos)` e `medirAltura(ctx, blocos)` idem. **Review Focus:** itens 1–7 mapeados a testes (1: Task 2 e Task 4 "REVIEW FOCUS 1"; 2/5: Task 4 "REVIEW FOCUS 2/5"; 3: Task 3; 4/6: Task 3 e Task 4; 7: Task 5 Step 1/5).

**Riscos que este plano não elimina:** (a) o legado pode não rodar em Node — há alternativa por texto; (b) o `align: 'justify'` e a medição de `manterJunto` são aproximações do jsPDF — o teste "REVIEW FOCUS 1" varre 7 tamanhos de página para pegar o caso de borda; (c) logos e fontes reais só se veem no navegador — o usuário valida na tela antes do merge; (d) este plano **não foi executado**: erros de digitação/tipo aparecem no primeiro `vitest`/`tsc` de cada tarefa.

# Padrão de impressão — F0 + F1 Implementation Plan

> **Parcialmente superado:** a família Ato e o requerimento foram removidos em 12/10/2026 (atos são do SEI).
> Estado vigente em [`docs/PADRAO_DOCUMENTOS.md`](../../PADRAO_DOCUMENTOS.md).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar o inventário dos geradores de PDF (F0) e a camada única de impressão em `src/lib/documentos/` — núcleo, blocos, famílias, registro, `emitirDocumento`, ferramenta antes/depois, guard no gate, doc do padrão e skill `/novo-documento` (F1) — sem migrar ainda nenhum gerador existente.

**Architecture:** `renderizarDocumento(modelo, dados, marca, emissao)` é uma função pura sobre o jsPDF (testável em Node): cria a página, escreve o título, executa os blocos do modelo e, no fim, desenha cabeçalho/rodapé em todas as páginas (para saber o total). `emitirDocumento` é a casca do navegador: monta a marca a partir do tenant, carrega os logos e chama o renderizador. Cada documento é um `DocumentoModelo` declarativo (lista de blocos) registrado em `REGISTRO`.

**Tech Stack:** TypeScript 5.8, jsPDF 4.2.1 (já instalado), `pdfjs-dist` 4.10.38 (já instalado; só nos testes), **vitest ^2.1.9 (nova devDependency, compatível com Vite 5)**, poppler (`pdftoppm`/`pdftotext`, só na ferramenta de comparação local).

**Spec:** [`../specs/2026-10-12-padrao-impressao-documentos-design.md`](../specs/2026-10-12-padrao-impressao-documentos-design.md)

**Escopo deste plano:** F0 e F1 da spec. As fases F2 (Atos), F3 (Fichas), F4 (Relatórios) e F5 (Comprovantes) ganham **um plano cada**, escritos depois do F0, porque dependem do inventário e porque cada uma termina em validação visual do usuário antes do merge.

## Global Constraints

Copiadas da spec e do `AGENTS.md`/`CLAUDE.md` do repo; valem para todas as tarefas.

- Engine **jsPDF**; nada de trocar a engine. `new jsPDF(` só dentro de `src/lib/documentos/core/` (guard da Task 12).
- Página **A4**; margens **20 mm** laterais, **18 mm** topo e rodapé; escala de espaço **4 / 8 / 12 / 16 mm**.
- Tipografia: títulos e corpo de **Ato em Times**; tabelas, fichas e metadados em **Helvetica** (fontes nativas do PDF, peso zero).
- Escala: título **14 pt**, seção **11 pt**, corpo **10,5 pt**, tabela **9 pt** (mínimo **8 pt**), rodapé **7,5 pt**.
- Todo texto ≥ **4,5:1** de contraste contra o fundo; significado nunca só por cor (legível em preto e branco).
- Cor primária e identidade (nome do órgão, entidade superior, nome do sistema) vêm do tenant; **nenhum nome de cliente em `src/`** nem em testes; nunca importar `tenants/<slug>` de `src/`.
- Quatro famílias: `ato`, `relatorio`, `ficha`, `comprovante`.
- Cabeçalho em todas as páginas (logo da entidade superior à esquerda, logo do órgão à direita, nomes ao centro); **protocolo** no canto superior direito quando houver; rodapé com sistema, "emitido por … em …" e **página X de Y**.
- Português em nomes de domínio, comentários e UI (convenção do repo). Diffs focados: **não tocar** `App.tsx`, nem em geradores `src/lib/pdf*.ts` existentes (migração é F2–F5).
- Verificação: `bash scripts/gate.sh` (resultado **lido**, não presumido). Typecheck/lint/cor crua não podem piorar vs. `scripts/gate-baseline.json`.
- Commits em português, um por tarefa, **adicionando arquivos pelo nome** (nada de `git add -A`), terminando com `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. **Não abrir PR, não dar push, não mergear** (merge na `main` = deploy automático do front).
- Trabalhar sempre em `/root/idjuv/impressao` (branch `claude/padrao-impressao`).

## Review Focus

Entradas que a spec implica mas que não são o caminho feliz; cada linha tem o teste que a fixa na tarefa dona.

1. **Texto fora do alfabeto das fontes nativas** (emoji, `ł`, `ź`, `✓`, aspas curvas, travessão): não pode quebrar o PDF nem sumir calado — vira `?`, e aspas/travessão/`º` permanecem. → Task 3 (`texto.test.ts`) e Task 5 (parágrafo com emoji).
2. **Tabela sem linhas**: deve mostrar "Nenhum registro encontrado.", nunca só o cabeçalho solto. → Task 7.
3. **Palavra sem espaço maior que a coluna/linha** (e-mail, UUID, nome composto): não pode ultrapassar a margem direita. → Task 7.
4. **Valor `null`/`undefined`/vazio**: imprime "—", nunca a palavra `null` ou `undefined`. → Tasks 6 e 7.
5. **Documento de várias páginas**: "Página X de Y" correto, cabeçalho e protocolo em **todas** as páginas, conteúdo nunca invade cabeçalho nem rodapé, cabeçalho da tabela repetido. → Tasks 4 e 7.
6. **Protocolo ausente**: nenhuma linha "Protocolo:" vazia. → Task 4.

---

## File Structure

```
scripts/
  documentos-inventario.mjs        # F0: lista geradores, exports e quem chama
  documentos-comparar.mjs          # antes/depois: PNG + diff de texto (usa poppler)
  check-jspdf-fora-do-core.mjs     # guard (ratchet)
vitest.config.ts
src/lib/documentos/
  tipos.ts                         # Familia, MarcaImpressao, ContextoDocumento, Bloco, DocumentoModelo…
  core/
    tokens.ts                      # medidas, fontes, neutros, contraste
    texto.ts                       # paraWinAnsi, ouTraco, paraNomeArquivo, quebrarEmLinhas
    pintura.ts                     # usarTexto / usarTraco / usarPreenchimento
    familias.ts                    # FAMILIAS: config por família
    pagina.ts                      # criarContexto (único lugar com `new jsPDF`)
    moldura.ts                     # aplicarMoldura: cabeçalho + rodapé + "Página X de Y"
    renderizar.ts                  # renderizarDocumento (puro)
  blocos/
    titulo.ts  secao.ts  paragrafo.ts  localData.ts
    camposChaveValor.ts  tabela.ts  assinaturas.ts  carimbo.ts
    index.ts
  modelos/
    requerimento.ts                # 1º modelo real (Ato)
  registro.ts                      # REGISTRO, TipoDocumento, DadosDe<T>
  marca.ts                         # marcaDoTenant (puro)
  logos.ts                         # carregarLogo (navegador)
  emitir.ts                        # emitirDocumento, baixarDocumento (navegador)
  index.ts                         # API pública
  __testes__/
    lerPdf.ts  fixtures.ts  modelosReferencia.ts
    *.test.ts
docs/PADRAO_DOCUMENTOS.md          # padrão canônico + inventário F0
.claude/skills/novo-documento-idjuv/SKILL.md
```

Desvio consciente da spec: `familias/ato.ts … comprovante.ts` viram **um** `core/familias.ts` (tabela de configuração). Quatro arquivos de 5 linhas cada seriam estrutura sem comportamento (YAGNI); se uma família ganhar lógica própria, ela ganha arquivo.

---

### Task 1: F0 — Inventário dos geradores

**Files:**
- Create: `scripts/documentos-inventario.mjs`
- Create: `docs/PADRAO_DOCUMENTOS.md` (esqueleto + seção "Inventário")
- Modify: `scripts/check-doc-links.mjs` (incluir a doc nova em `LIVING_DOCS`)

**Interfaces:**
- Produces: tabela de inventário em `docs/PADRAO_DOCUMENTOS.md` (arquivo → família → documentos → chamadores). Os planos F2–F5 consomem esta tabela.

- [ ] **Step 1: Escrever o script de inventário**

```js
#!/usr/bin/env node
// F0 do padrão de impressão: lista cada gerador de PDF de src/lib (arquivo, linhas,
// funções exportadas) e quem o chama (telas fora de src/lib e outros módulos de src/lib).
// Uso: node scripts/documentos-inventario.mjs   → tabela markdown no stdout
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(RAIZ, 'src');

function* arquivos(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* arquivos(p);
    else if (/\.(ts|tsx)$/.test(e.name)) yield p;
  }
}

const todos = [...arquivos(SRC)].filter((p) => !p.includes(`${join('lib', 'documentos')}`));
const geradores = todos.filter((p) => {
  const rel = relative(SRC, p);
  return /^lib\/(pdf[A-Za-z]*|portariaPdf)\.ts$/.test(rel) || /^lib\/pdf\//.test(rel);
});

const modulo = (p) => relative(SRC, p).replace(/\.(ts|tsx)$/, '').replace(/\/index$/, '');
const exportadas = (fonte) =>
  [...fonte.matchAll(/^export\s+(?:async\s+)?(?:function|const)\s+([A-Za-z0-9_]+)/gm)].map((m) => m[1]);

const linhas = [];
for (const g of geradores.sort()) {
  const mod = modulo(g); // ex.: lib/pdfPortarias
  const alvo = new RegExp(`from\\s+['"](?:@/${mod}|\\./${basename(mod)}|\\.\\./${basename(mod)})['"]`);
  const telas = new Set();
  const libs = new Set();
  for (const o of todos) {
    if (o === g) continue;
    if (alvo.test(readFileSync(o, 'utf8'))) {
      (relative(SRC, o).startsWith('lib/') ? libs : telas).add(relative(SRC, o));
    }
  }
  const fonte = readFileSync(g, 'utf8');
  linhas.push(
    `| \`${relative(RAIZ, g)}\` | ${fonte.split('\n').length} | ${exportadas(fonte).map((e) => `\`${e}\``).join(', ') || '—'} | ${telas.size} | ${libs.size} |`,
  );
}
console.log('| arquivo | linhas | exports | telas que chamam | libs que chamam |');
console.log('|---|---|---|---|---|');
console.log(linhas.join('\n'));
```

- [ ] **Step 2: Rodar e conferir que enxerga os geradores conhecidos**

Run: `node scripts/documentos-inventario.mjs | tee /tmp/claude-0/-root/7f60567f-6c48-49ed-8c19-594ba9577a33/scratchpad/inventario.md | head -60`
Expected: tabela com ~45 linhas; `src/lib/pdfPortarias.ts` com exports `generatePortariaNomeacao…` e ao menos 1 tela chamadora; `src/lib/pdfGenerator.ts` com 2288 linhas. Se alguma linha de arquivo conhecido estiver ausente, corrigir o filtro antes de seguir.

- [ ] **Step 3: Ler os quatro arquivos ambíguos e registrar o que há dentro**

`pdfGenerator.ts` (2288 linhas), `pdfModelos.ts` (1334), `pdfCPSI.ts` e `pdfInstitucional.ts`: rodar `grep -nE "^export|^(async )?function [a-zA-Z]+" <arquivo>` em cada um e anotar, para cada documento gerado, o nome e a família. Registrar na seção "Documentos dentro de arquivos multiuso" do doc (Step 4).

- [ ] **Step 4: Criar `docs/PADRAO_DOCUMENTOS.md` com o esqueleto e o inventário**

Estrutura (preencher a tabela com a saída do Step 2 e a coluna "família" com a classificação inicial abaixo, corrigindo onde a leitura do código contradisser):

```markdown
# Padrão de impressão de documentos

> **Estado:** F0 concluída em 2026-10-12 (inventário). A camada `src/lib/documentos/` é entregue na F1;
> até cada gerador ser migrado (F2–F5) ele continua valendo como está. Spec:
> [`superpowers/specs/2026-10-12-padrao-impressao-documentos-design.md`](./superpowers/specs/2026-10-12-padrao-impressao-documentos-design.md).

## 1. Famílias
(ato · relatório · ficha · comprovante — tabela da spec §3)

## 2. Inventário dos geradores (F0, medido em 2026-10-12)

| arquivo | linhas | exports | telas | libs | família | fase |
|---|---|---|---|---|---|---|
(uma linha por gerador, vinda do script)

### Documentos dentro de arquivos multiuso
(resultado do Step 3)

## 3. Como criar um documento novo
(preenchido na Task 13)
```

Classificação inicial por nome do arquivo (confirmar lendo): **Ato** — `pdfPortarias`, `portariaPdf`, `pdfMemorandoLotacao`, `pdf/rh/memorandoDesignacao`, `pdfDeclaracoes`, `pdfTermoAutorizacao`, `pdfTermoCessao`, `pdfTermoResponsabilidade`. **Ficha** — `pdfFichaCadastroGeral`, `pdfFichaUnidadeLocal`, `pdfMiniCurriculo`, `pdf/unidades/*` (blocos da ficha de unidade), parte ficha de `pdfFederacoesModular`. **Comprovante** — `pdfContracheque`, `pdfFrequenciaMensalGenerator`, `pdfFrequenciaLote`, lista de presença/convocados de `pdfRelatorioReunioes`. **Relatório** — todos `pdfRelatorio*`, `pdfRelatoriosRH/Folha/Afastamentos`, `pdfListagemUnidades`, `pdfOrganograma`, `pdfRelatorioSituacaoPortaria`. **Base a eliminar na F5** — `pdfTemplate`, `pdfInstitucional`, `pdfModelos` (se for só base), `pdfLogos`. Coluna "fase": Ato→F2, Ficha→F3, Relatório→F4, Comprovante→F5.

- [ ] **Step 5: Incluir a doc em `LIVING_DOCS`**

Run: `grep -n "LIVING_DOCS" -A25 scripts/check-doc-links.mjs | head -50` para ver o formato da lista; adicionar `"docs/PADRAO_DOCUMENTOS.md"` seguindo o mesmo formato.

- [ ] **Step 6: Verificar os links da doc**

Run: `node scripts/check-doc-links.mjs`
Expected: sem referência quebrada (exit 0).

- [ ] **Step 7: Commit**

```bash
git add scripts/documentos-inventario.mjs docs/PADRAO_DOCUMENTOS.md scripts/check-doc-links.mjs
git commit -m "docs: F0 do padrão de impressão — inventário dos geradores de PDF

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Infra de teste (vitest + leitor de PDF)

**Files:**
- Modify: `package.json` (devDependency `vitest`, scripts `test`)
- Create: `vitest.config.ts`
- Create: `src/lib/documentos/__testes__/lerPdf.ts`
- Test: `src/lib/documentos/__testes__/lerPdf.test.ts`

**Interfaces:**
- Produces: `lerPdf(doc: jsPDF): Promise<PaginaLida[]>` e `mmParaPt(mm: number): number`, onde `PaginaLida = { texto: string; itens: ItemTexto[]; largura: number; altura: number }` e `ItemTexto = { str: string; x: number; y: number; largura: number }` (unidade: pontos; `y` medido de baixo para cima, como no PDF).

- [ ] **Step 1: Instalar vitest**

Run: `npm install --no-package-lock --no-audit --no-fund -D vitest@^2.1.9`
Expected: `package.json` ganha `vitest` em `devDependencies`. (`bun.lock` não é usado pelo CI — `quality.yml` roda `npm install --no-package-lock`; não mexer nele.)

- [ ] **Step 2: Criar `vitest.config.ts`**

```ts
import path from 'node:path';
import { defineConfig } from 'vitest/config';

// Config separada do vite.config.ts para não carregar o plugin de PWA nos testes.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tenants': path.resolve(__dirname, './tenants'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 3: Adicionar o script em `package.json`**

Em `"scripts"`, depois de `"preview": "vite preview",`, inserir `"test": "vitest run",`.

- [ ] **Step 4: Escrever o teste do leitor (falha primeiro)**

`src/lib/documentos/__testes__/lerPdf.test.ts`:

```ts
import jsPDF from 'jspdf';
import { describe, expect, it } from 'vitest';
import { lerPdf, mmParaPt } from './lerPdf';

describe('lerPdf', () => {
  it('devolve texto, posição e tamanho de cada página', async () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    doc.text('Olá mundo', 20, 30);
    doc.addPage();
    doc.text('Segunda', 20, 40);

    const paginas = await lerPdf(doc);

    expect(paginas).toHaveLength(2);
    expect(paginas[0].texto).toContain('Olá mundo');
    expect(paginas[1].texto).toContain('Segunda');
    expect(Math.round(paginas[0].largura)).toBe(Math.round(mmParaPt(210)));
    expect(paginas[0].itens[0].x).toBeCloseTo(mmParaPt(20), 0);
  });
});
```

- [ ] **Step 5: Rodar e ver falhar**

Run: `npx vitest run src/lib/documentos/__testes__/lerPdf.test.ts`
Expected: FAIL — `Cannot find module './lerPdf'`.

- [ ] **Step 6: Implementar `lerPdf.ts`**

```ts
import type jsPDF from 'jspdf';

export interface ItemTexto {
  str: string;
  x: number;
  y: number;
  largura: number;
}
export interface PaginaLida {
  texto: string;
  itens: ItemTexto[];
  largura: number;
  altura: number;
}

export const mmParaPt = (mm: number): number => (mm * 72) / 25.4;

/** Lê o PDF gerado e devolve, por página, o texto e a posição de cada trecho (em pt). */
export async function lerPdf(doc: jsPDF): Promise<PaginaLida[]> {
  const pdfjs: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const data = new Uint8Array(doc.output('arraybuffer') as ArrayBuffer);
  const pdf = await pdfjs.getDocument({
    data,
    useWorkerFetch: false,
    isEvalSupported: false,
    disableFontFace: true,
    verbosity: 0,
  }).promise;

  const paginas: PaginaLida[] = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    const pagina = await pdf.getPage(n);
    const vp = pagina.getViewport({ scale: 1 });
    const conteudo = await pagina.getTextContent();
    const itens: ItemTexto[] = conteudo.items
      .filter((i: any) => typeof i.str === 'string' && i.str.trim() !== '')
      .map((i: any) => ({ str: i.str, x: i.transform[4], y: i.transform[5], largura: i.width }));
    paginas.push({ texto: itens.map((i) => i.str).join(' '), itens, largura: vp.width, altura: vp.height });
  }
  return paginas;
}
```

- [ ] **Step 7: Rodar e ver passar**

Run: `npx vitest run src/lib/documentos/__testes__/lerPdf.test.ts`
Expected: PASS (1 teste).

- [ ] **Step 8: Commit**

```bash
git add package.json vitest.config.ts src/lib/documentos/__testes__/lerPdf.ts src/lib/documentos/__testes__/lerPdf.test.ts
git commit -m "test: vitest e leitor de PDF para a camada de impressão

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Tipos, tokens e tratamento de texto

**Files:**
- Create: `src/lib/documentos/tipos.ts`, `core/tokens.ts`, `core/texto.ts`, `core/pintura.ts`
- Test: `src/lib/documentos/__testes__/tokens.test.ts`, `texto.test.ts`

**Interfaces:**
- Produces (`tipos.ts`):
  - `type Familia = 'ato' | 'relatorio' | 'ficha' | 'comprovante'`; `type Orientacao = 'retrato' | 'paisagem'`; `interface RGB { r; g; b: number }`
  - `interface LogoImpressao { dataUrl: string; largura: number; altura: number; formato: 'PNG' | 'JPEG' }`
  - `interface MarcaImpressao { nomeOrgao: string; entidadeSuperior?: string; nomeSistema: string; corPrimaria: RGB; logoOrgao?: LogoImpressao; logoEntidadeSuperior?: LogoImpressao }`
  - `interface Emissao { emitidoPor?: string; emitidoEm: Date }`
  - `interface ContextoDocumento { doc: jsPDF; marca: MarcaImpressao; orientacao: Orientacao; familia: Familia; fonteCorpo: 'times' | 'helvetica'; esquerda: number; largura: number; larguraPagina: number; alturaPagina: number; limiteInferior: number; y: number; novaPagina(): void; garantirEspaco(altura: number): void }` (unidades: mm)
  - `type Bloco = (ctx: ContextoDocumento) => void`
  - `interface DocumentoModelo<D> { tipo: string; familia: Familia; titulo(d: D): string; subtitulo?(d: D): string | undefined; orientacao?: Orientacao; protocolo?(d: D): string | undefined; unidadeEmissora?(d: D): string[]; blocos(d: D): Bloco[]; nomeArquivo(d: D): string }`
- Produces (`tokens.ts`): `A4`, `PAGINA`, `ESPACO`, `FONTE`, `ALTURA_CABECALHO`, `NEUTROS`, `ptParaMm(pt)`, `alturaLinha(pt)` (mm), `contraste(a, b)`, `corLegivel(cor, fundo?)`, `hexParaRGB(hex)`.
- Produces (`texto.ts`): `paraWinAnsi(v: unknown): string`, `ouTraco(v: unknown): string`, `paraNomeArquivo(s: string): string`, `quebrarEmLinhas(doc, texto, largura): string[]`.
- Produces (`pintura.ts`): `usarTexto(doc, c)`, `usarTraco(doc, c)`, `usarPreenchimento(doc, c)`.

- [ ] **Step 1: Escrever os testes de tokens e texto (falham primeiro)**

`tokens.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { contraste, corLegivel, hexParaRGB, NEUTROS, alturaLinha, ptParaMm } from '../core/tokens';

describe('tokens', () => {
  it('textos neutros têm contraste >= 4,5:1 sobre o branco e traços >= 3:1', () => {
    expect(contraste(NEUTROS.texto, NEUTROS.branco)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(NEUTROS.textoSuave, NEUTROS.branco)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(NEUTROS.linha, NEUTROS.branco)).toBeGreaterThanOrEqual(3);
  });

  it('texto escuro também é legível sobre o fundo de cabeçalho de tabela e a zebra', () => {
    expect(contraste(NEUTROS.texto, NEUTROS.fundoCabecalhoTabela)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(NEUTROS.textoSuave, NEUTROS.zebra)).toBeGreaterThanOrEqual(4.5);
  });

  it('corLegivel mantém cor escura e troca cor clara demais por texto neutro', () => {
    const escura = hexParaRGB('#164069');
    expect(corLegivel(escura)).toEqual(escura);
    expect(corLegivel(hexParaRGB('#ffee00'))).toEqual(NEUTROS.texto);
  });

  it('hexParaRGB aceita 3 e 6 dígitos, com ou sem #', () => {
    expect(hexParaRGB('#164069')).toEqual({ r: 22, g: 64, b: 105 });
    expect(hexParaRGB('fff')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('converte pontos em milímetros', () => {
    expect(ptParaMm(72)).toBeCloseTo(25.4, 5);
    expect(alturaLinha(10)).toBeGreaterThan(ptParaMm(10));
  });
});
```

`texto.test.ts`:

```ts
import jsPDF from 'jspdf';
import { describe, expect, it } from 'vitest';
import { ouTraco, paraNomeArquivo, paraWinAnsi, quebrarEmLinhas } from '../core/texto';

describe('paraWinAnsi', () => {
  it('mantém acentos, aspas curvas, travessão e º; troca o que a fonte nativa não tem por "?"', () => {
    expect(paraWinAnsi('João “ok” — 3º ✓😀 łódź')).toBe('João “ok” — 3º ?? ?ód?');
  });
  it('null e undefined viram string vazia, nunca "null"/"undefined"', () => {
    expect(paraWinAnsi(null)).toBe('');
    expect(paraWinAnsi(undefined)).toBe('');
  });
  it('normaliza quebras de linha e tabs', () => {
    expect(paraWinAnsi('a\r\nb\tc')).toBe('a\nb c');
  });
});

describe('ouTraco', () => {
  it('vazio, só espaços, null e undefined viram "—"', () => {
    for (const v of ['', '   ', null, undefined]) expect(ouTraco(v)).toBe('—');
  });
  it('números e textos passam', () => {
    expect(ouTraco(0)).toBe('0');
    expect(ouTraco(' ok ')).toBe('ok');
  });
});

describe('paraNomeArquivo', () => {
  it('remove acentos e símbolos', () => {
    expect(paraNomeArquivo('Requerimento nº 12/2026 — João')).toBe('Requerimento-n-12-2026-Joao');
  });
  it('nunca devolve vazio', () => {
    expect(paraNomeArquivo('???')).toBe('documento');
  });
});

describe('quebrarEmLinhas', () => {
  it('quebra palavra sem espaço maior que a largura em vez de estourar a margem', () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const linhas = quebrarEmLinhas(doc, 'x'.repeat(200), 40);
    expect(linhas.length).toBeGreaterThan(1);
    for (const l of linhas) expect(doc.getTextWidth(l)).toBeLessThanOrEqual(40.01);
    expect(linhas.join('')).toBe('x'.repeat(200));
  });
  it('texto vazio devolve uma linha vazia (altura mínima de uma linha)', () => {
    const doc = new jsPDF();
    expect(quebrarEmLinhas(doc, '', 40)).toEqual(['']);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/lib/documentos/__testes__/tokens.test.ts src/lib/documentos/__testes__/texto.test.ts`
Expected: FAIL — módulos inexistentes.

- [ ] **Step 3: Implementar `tipos.ts`**

```ts
import type jsPDF from 'jspdf';

export type Familia = 'ato' | 'relatorio' | 'ficha' | 'comprovante';
export type Orientacao = 'retrato' | 'paisagem';

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface LogoImpressao {
  dataUrl: string;
  /** Dimensões originais (px); só a proporção importa. */
  largura: number;
  altura: number;
  formato: 'PNG' | 'JPEG';
}

/** Identidade impressa. Vem do tenant (ver `marca.ts`); o núcleo nunca a lê sozinho. */
export interface MarcaImpressao {
  nomeOrgao: string;
  entidadeSuperior?: string;
  nomeSistema: string;
  corPrimaria: RGB;
  logoOrgao?: LogoImpressao;
  logoEntidadeSuperior?: LogoImpressao;
}

export interface Emissao {
  emitidoPor?: string;
  emitidoEm: Date;
}

/** Estado de escrita compartilhado pelos blocos. Todas as medidas em mm. */
export interface ContextoDocumento {
  doc: jsPDF;
  marca: MarcaImpressao;
  orientacao: Orientacao;
  familia: Familia;
  fonteCorpo: 'times' | 'helvetica';
  esquerda: number;
  largura: number;
  larguraPagina: number;
  alturaPagina: number;
  /** Y máximo do conteúdo (acima do rodapé). */
  limiteInferior: number;
  /** Cursor vertical: topo do próximo elemento. */
  y: number;
  novaPagina(): void;
  /** Abre nova página se `altura` não couber no que resta. */
  garantirEspaco(altura: number): void;
}

export type Bloco = (ctx: ContextoDocumento) => void;

export interface DocumentoModelo<D> {
  tipo: string;
  familia: Familia;
  titulo(dados: D): string;
  subtitulo?(dados: D): string | undefined;
  /** Padrão da família quando omitido. */
  orientacao?: Orientacao;
  protocolo?(dados: D): string | undefined;
  /** Até 2 linhas abaixo do nome do órgão (diretoria, divisão…). Dado do documento, não do código. */
  unidadeEmissora?(dados: D): string[];
  blocos(dados: D): Bloco[];
  nomeArquivo(dados: D): string;
}
```

- [ ] **Step 4: Implementar `core/tokens.ts`**

```ts
import type { RGB } from '../tipos';

export const A4 = { largura: 210, altura: 297 } as const;
/** `margemRodape` inclui a faixa do rodapé (régua + 2 linhas). */
export const PAGINA = { margemLateral: 20, margemTopo: 18, margemRodape: 22 } as const;
export const ESPACO = { sm: 4, md: 8, lg: 12, xl: 16 } as const;
export const FONTE = { titulo: 14, secao: 11, corpo: 10.5, tabela: 9, rotulo: 8, rodape: 7.5 } as const;
export const ALTURA_CABECALHO = { primeira: 28, demais: 10 } as const;

export const NEUTROS = {
  texto: { r: 15, g: 23, b: 42 },
  textoSuave: { r: 71, g: 85, b: 105 },
  /** Traço fino: visível também em preto e branco. */
  linha: { r: 100, g: 116, b: 139 },
  fundoCabecalhoTabela: { r: 226, g: 232, b: 240 },
  zebra: { r: 241, g: 245, b: 249 },
  branco: { r: 255, g: 255, b: 255 },
} as const satisfies Record<string, RGB>;

const MM_POR_PT = 25.4 / 72;
export const ptParaMm = (pt: number): number => pt * MM_POR_PT;
/** Altura de uma linha de texto (mm) com entrelinha 1,35. */
export const alturaLinha = (pt: number): number => ptParaMm(pt) * 1.35;

const canal = (v: number): number => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminancia = ({ r, g, b }: RGB): number => 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);

/** Razão de contraste WCAG 2.x entre duas cores. */
export function contraste(a: RGB, b: RGB): number {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (escuro + 0.05);
}

/** A própria cor se der >= 4,5:1 sobre o fundo; senão o texto neutro. */
export function corLegivel(cor: RGB, fundo: RGB = NEUTROS.branco): RGB {
  return contraste(cor, fundo) >= 4.5 ? cor : NEUTROS.texto;
}

export function hexParaRGB(hex: string): RGB {
  const limpo = hex.replace('#', '');
  const cheio = limpo.length === 3 ? limpo.split('').map((c) => c + c).join('') : limpo;
  return { r: parseInt(cheio.slice(0, 2), 16), g: parseInt(cheio.slice(2, 4), 16), b: parseInt(cheio.slice(4, 6), 16) };
}
```

- [ ] **Step 5: Implementar `core/texto.ts`**

```ts
import type jsPDF from 'jspdf';

// O que as fontes nativas do PDF (WinAnsi) desenham: ASCII, Latin-1 e os símbolos do cp1252.
const PERMITIDO =
  /[ -~ -ÿ€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ\n]/;

/** Texto seguro para as fontes nativas: o que elas não têm vira "?" (nunca some calado nem quebra o PDF). */
export function paraWinAnsi(entrada: unknown): string {
  if (entrada === null || entrada === undefined) return '';
  const s = String(entrada).normalize('NFC').replace(/\r\n?/g, '\n').replace(/\t/g, ' ');
  let saida = '';
  for (const ch of s) saida += PERMITIDO.test(ch) ? ch : '?';
  return saida;
}

/** Valor para exibir em campo/célula: vazio vira "—" (documento impresso nunca mostra "null"). */
export function ouTraco(valor: unknown): string {
  const s = paraWinAnsi(valor).trim();
  return s === '' ? '—' : s;
}

export function paraNomeArquivo(texto: string): string {
  const s = texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return s || 'documento';
}

/**
 * Quebra em linhas que cabem em `largura` (mm), com a fonte e o corpo JÁ definidos no `doc`.
 * Palavra maior que a largura é cortada por caractere em vez de estourar a margem.
 */
export function quebrarEmLinhas(doc: jsPDF, texto: string, largura: number): string[] {
  const saida: string[] = [];
  for (const linha of doc.splitTextToSize(paraWinAnsi(texto), largura) as string[]) {
    if (doc.getTextWidth(linha) <= largura) {
      saida.push(linha);
      continue;
    }
    let atual = '';
    for (const ch of linha) {
      if (atual && doc.getTextWidth(atual + ch) > largura) {
        saida.push(atual);
        atual = ch;
      } else {
        atual += ch;
      }
    }
    saida.push(atual);
  }
  return saida.length ? saida : [''];
}
```

- [ ] **Step 6: Implementar `core/pintura.ts`**

```ts
import type jsPDF from 'jspdf';
import type { RGB } from '../tipos';

export const usarTexto = (doc: jsPDF, c: RGB): void => void doc.setTextColor(c.r, c.g, c.b);
export const usarTraco = (doc: jsPDF, c: RGB): void => void doc.setDrawColor(c.r, c.g, c.b);
export const usarPreenchimento = (doc: jsPDF, c: RGB): void => void doc.setFillColor(c.r, c.g, c.b);
```

- [ ] **Step 7: Rodar e ver passar**

Run: `npx vitest run src/lib/documentos/__testes__/tokens.test.ts src/lib/documentos/__testes__/texto.test.ts`
Expected: PASS (todos). Se o teste de `quebrarEmLinhas` falhar por arredondamento de largura, a tolerância (`40.01`) já cobre; não relaxar mais que isso.

- [ ] **Step 8: Commit**

```bash
git add src/lib/documentos/tipos.ts src/lib/documentos/core/tokens.ts src/lib/documentos/core/texto.ts src/lib/documentos/core/pintura.ts src/lib/documentos/__testes__/tokens.test.ts src/lib/documentos/__testes__/texto.test.ts
git commit -m "feat(documentos): tipos, tokens de impressão e tratamento de texto

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Página, moldura (cabeçalho/rodapé), título e pipeline

**Files:**
- Create: `core/familias.ts`, `core/pagina.ts`, `core/moldura.ts`, `core/renderizar.ts`, `blocos/titulo.ts`
- Create: `__testes__/fixtures.ts`
- Test: `__testes__/renderizar.test.ts`

**Interfaces:**
- Consumes: tudo da Task 3.
- Produces:
  - `FAMILIAS: Record<Familia, { fonteCorpo: 'times'|'helvetica'; orientacaoPadrao: Orientacao; linhaAutenticidade: boolean }>`
  - `criarContexto(o: { marca: MarcaImpressao; orientacao: Orientacao; familia: Familia }): ContextoDocumento`
  - `aplicarMoldura(ctx, o: { protocolo?: string; unidadeEmissora?: string[]; linhaAutenticidade: boolean; emissao: Emissao }): void`
  - `titulo(p: { texto: string; subtitulo?: string }): Bloco`
  - `renderizarDocumento<D>(modelo: DocumentoModelo<D>, dados: D, marca: MarcaImpressao, emissao: Emissao): { doc: jsPDF; nomeArquivo: string }`
  - fixtures: `PNG_1X1: string`, `marcaTeste: MarcaImpressao`, `emissaoTeste: Emissao`.

- [ ] **Step 1: Criar as fixtures de teste**

`__testes__/fixtures.ts`:

```ts
import type { Emissao, MarcaImpressao } from '../tipos';

/** PNG 1x1 válido; esticado vira um bloco cinza — suficiente para ver onde o logo cai. */
export const PNG_1X1 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

export const marcaTeste: MarcaImpressao = {
  nomeOrgao: 'INSTITUTO DE TESTE',
  entidadeSuperior: 'GOVERNO DE TESTE',
  nomeSistema: 'Sistema de Teste / TST',
  corPrimaria: { r: 22, g: 64, b: 105 },
  logoOrgao: { dataUrl: PNG_1X1, largura: 4, altura: 1, formato: 'PNG' },
  logoEntidadeSuperior: { dataUrl: PNG_1X1, largura: 4, altura: 1, formato: 'PNG' },
};

export const emissaoTeste: Emissao = { emitidoPor: 'Fulana de Tal', emitidoEm: new Date('2026-10-12T14:30:00Z') };
```

- [ ] **Step 2: Escrever o teste do pipeline (falha primeiro)**

`__testes__/renderizar.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { ALTURA_CABECALHO, PAGINA } from '../core/tokens';
import { renderizarDocumento } from '../core/renderizar';
import type { DocumentoModelo } from '../tipos';
import { emissaoTeste, marcaTeste } from './fixtures';
import { lerPdf, mmParaPt } from './lerPdf';

interface Dados {
  n: number;
  protocolo?: string;
}

const modelo: DocumentoModelo<Dados> = {
  tipo: 'teste',
  familia: 'ato',
  titulo: () => 'Documento de teste',
  subtitulo: () => 'subtítulo de teste',
  protocolo: (d) => d.protocolo,
  unidadeEmissora: () => ['DIRETORIA DE TESTE'],
  nomeArquivo: () => 'teste.pdf',
  blocos: (d) => [
    (ctx) => {
      ctx.doc.setFontSize(10);
      for (let i = 0; i < d.n; i++) {
        ctx.garantirEspaco(5);
        ctx.doc.text(`Linha ${i + 1}`, ctx.esquerda, ctx.y + 4);
        ctx.y += 5;
      }
    },
  ],
};

const renderizar = (d: Dados, m = modelo) => renderizarDocumento(m, d, marcaTeste, emissaoTeste);

describe('renderizarDocumento', () => {
  it('120 linhas ocupam 3 páginas e o rodapé numera "Página X de 3"', async () => {
    const { doc, nomeArquivo } = renderizar({ n: 120 });
    const p = await lerPdf(doc);
    expect(nomeArquivo).toBe('teste.pdf');
    expect(p).toHaveLength(3);
    expect(p[0].texto).toContain('Página 1 de 3');
    expect(p[1].texto).toContain('Página 2 de 3');
    expect(p[2].texto).toContain('Página 3 de 3');
  });

  it('protocolo aparece em todas as páginas; sem protocolo não existe rótulo vazio', async () => {
    const com = await lerPdf(renderizar({ n: 120, protocolo: 'RH-2026-000123' }).doc);
    for (const pagina of com) expect(pagina.texto).toContain('Protocolo: RH-2026-000123');

    const sem = await lerPdf(renderizar({ n: 120 }).doc);
    for (const pagina of sem) expect(pagina.texto).not.toContain('Protocolo');
  });

  it('primeira página tem título em caixa alta, subtítulo, órgão, entidade superior e unidade emissora', async () => {
    const [p1] = await lerPdf(renderizar({ n: 1 }).doc);
    for (const trecho of ['DOCUMENTO DE TESTE', 'subtítulo de teste', 'INSTITUTO DE TESTE', 'GOVERNO DE TESTE', 'DIRETORIA DE TESTE']) {
      expect(p1.texto).toContain(trecho);
    }
  });

  it('páginas seguintes têm cabeçalho compacto (sem título repetido)', async () => {
    const p = await lerPdf(renderizar({ n: 120 }).doc);
    expect(p[1].texto).toContain('INSTITUTO DE TESTE');
    expect(p[1].texto).not.toContain('DOCUMENTO DE TESTE');
  });

  it('rodapé traz sistema, quem emitiu e quando', async () => {
    const [p1] = await lerPdf(renderizar({ n: 1 }).doc);
    expect(p1.texto).toContain('Sistema de Teste / TST');
    expect(p1.texto).toContain('Fulana de Tal');
    expect(p1.texto).toMatch(/\d{2}\/\d{2}\/\d{2,4}/);
  });

  it('o conteúdo nunca invade cabeçalho nem rodapé', async () => {
    const p = await lerPdf(renderizar({ n: 120 }).doc);
    const topoMin = PAGINA.margemTopo + ALTURA_CABECALHO.demais;
    const baseMax = 297 - PAGINA.margemRodape;
    for (const pagina of p.slice(1)) {
      for (const item of pagina.itens.filter((i) => i.str.startsWith('Linha'))) {
        const topoMm = ((pagina.altura - item.y) * 25.4) / 72;
        expect(topoMm).toBeGreaterThanOrEqual(topoMin);
        expect(topoMm).toBeLessThanOrEqual(baseMax);
      }
    }
  });

  it('paisagem inverte a página e mantém as margens laterais', async () => {
    const [p1] = await lerPdf(renderizar({ n: 1 }, { ...modelo, orientacao: 'paisagem' }).doc);
    expect(p1.largura).toBeGreaterThan(p1.altura);
    const minX = Math.min(...p1.itens.map((i) => i.x));
    expect(minX).toBeGreaterThanOrEqual(mmParaPt(PAGINA.margemLateral) - 1);
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run src/lib/documentos/__testes__/renderizar.test.ts`
Expected: FAIL — `Cannot find module '../core/renderizar'`.

- [ ] **Step 4: Implementar `core/familias.ts`**

```ts
import type { Familia, Orientacao } from '../tipos';

export interface ConfigFamilia {
  fonteCorpo: 'times' | 'helvetica';
  orientacaoPadrao: Orientacao;
  /** Imprime "Documento emitido eletronicamente…" acima do rodapé. */
  linhaAutenticidade: boolean;
}

export const FAMILIAS: Record<Familia, ConfigFamilia> = {
  ato: { fonteCorpo: 'times', orientacaoPadrao: 'retrato', linhaAutenticidade: false },
  relatorio: { fonteCorpo: 'helvetica', orientacaoPadrao: 'retrato', linhaAutenticidade: false },
  ficha: { fonteCorpo: 'helvetica', orientacaoPadrao: 'retrato', linhaAutenticidade: false },
  comprovante: { fonteCorpo: 'helvetica', orientacaoPadrao: 'retrato', linhaAutenticidade: true },
};
```

- [ ] **Step 5: Implementar `core/pagina.ts` (único lugar com `new jsPDF`)**

```ts
import jsPDF from 'jspdf';
import type { ContextoDocumento, Familia, MarcaImpressao, Orientacao } from '../tipos';
import { FAMILIAS } from './familias';
import { A4, ALTURA_CABECALHO, PAGINA } from './tokens';

export function criarContexto(o: { marca: MarcaImpressao; orientacao: Orientacao; familia: Familia }): ContextoDocumento {
  const paisagem = o.orientacao === 'paisagem';
  const larguraPagina = paisagem ? A4.altura : A4.largura;
  const alturaPagina = paisagem ? A4.largura : A4.altura;
  const doc = new jsPDF({ orientation: paisagem ? 'landscape' : 'portrait', unit: 'mm', format: 'a4', compress: true });

  const ctx: ContextoDocumento = {
    doc,
    marca: o.marca,
    orientacao: o.orientacao,
    familia: o.familia,
    fonteCorpo: FAMILIAS[o.familia].fonteCorpo,
    esquerda: PAGINA.margemLateral,
    largura: larguraPagina - 2 * PAGINA.margemLateral,
    larguraPagina,
    alturaPagina,
    limiteInferior: alturaPagina - PAGINA.margemRodape,
    y: PAGINA.margemTopo + ALTURA_CABECALHO.primeira,
    novaPagina() {
      doc.addPage();
      ctx.y = PAGINA.margemTopo + ALTURA_CABECALHO.demais;
    },
    garantirEspaco(altura) {
      if (ctx.y + altura > ctx.limiteInferior) ctx.novaPagina();
    },
  };
  doc.setFont(ctx.fonteCorpo, 'normal');
  return ctx;
}
```

- [ ] **Step 6: Implementar `core/moldura.ts`**

```ts
import type { ContextoDocumento, Emissao, LogoImpressao } from '../tipos';
import { usarTexto, usarTraco } from './pintura';
import { ALTURA_CABECALHO, FONTE, NEUTROS, PAGINA, corLegivel } from './tokens';
import { paraWinAnsi } from './texto';

export interface OpcoesMoldura {
  protocolo?: string;
  unidadeEmissora?: string[];
  linhaAutenticidade: boolean;
  emissao: Emissao;
}

const ALTURA_LOGO = 14;
const LARGURA_MAX_LOGO = 45;

const formatarData = (d: Date): string =>
  new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(d).replace(', ', ' às ');

function logo(ctx: ContextoDocumento, l: LogoImpressao | undefined, aDireita: boolean, y0: number): number {
  if (!l) return 0;
  const w = Math.min((ALTURA_LOGO * l.largura) / l.altura, LARGURA_MAX_LOGO);
  const x = aDireita ? ctx.esquerda + ctx.largura - w : ctx.esquerda;
  ctx.doc.addImage(l.dataUrl, l.formato, x, y0, w, ALTURA_LOGO);
  return w;
}

function protocoloNoCanto(ctx: ContextoDocumento, protocolo: string | undefined, y: number, tamanho: number): void {
  if (!protocolo) return;
  const { doc } = ctx;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(tamanho);
  usarTexto(doc, NEUTROS.texto);
  doc.text(paraWinAnsi(`Protocolo: ${protocolo}`), ctx.esquerda + ctx.largura, y, { align: 'right' });
}

function cabecalhoCompleto(ctx: ContextoDocumento, o: OpcoesMoldura): void {
  const { doc, marca, esquerda, largura } = ctx;
  const y0 = PAGINA.margemTopo;
  const reservado = Math.max(logo(ctx, marca.logoEntidadeSuperior, false, y0), logo(ctx, marca.logoOrgao, true, y0));
  const larguraTexto = largura - 2 * reservado - 6;
  const centro = esquerda + largura / 2;

  const linhas: { texto: string; negrito: boolean }[] = [
    ...(marca.entidadeSuperior ? [{ texto: marca.entidadeSuperior, negrito: true }] : []),
    { texto: marca.nomeOrgao, negrito: true },
    ...(o.unidadeEmissora ?? []).slice(0, 2).map((texto) => ({ texto, negrito: false })),
  ];
  usarTexto(doc, NEUTROS.texto);
  let y = y0 + 3.5;
  for (const { texto, negrito } of linhas) {
    doc.setFont('helvetica', negrito ? 'bold' : 'normal');
    doc.setFontSize(negrito ? 9 : 8);
    for (const parte of doc.splitTextToSize(paraWinAnsi(texto), larguraTexto) as string[]) {
      if (y > y0 + 19) break;
      doc.text(parte, centro, y, { align: 'center' });
      y += 3.8;
    }
  }
  usarTraco(doc, corLegivel(marca.corPrimaria));
  doc.setLineWidth(0.4);
  doc.line(esquerda, y0 + 22, esquerda + largura, y0 + 22);
  protocoloNoCanto(ctx, o.protocolo, y0 + 26.5, 8.5);
}

function cabecalhoCompacto(ctx: ContextoDocumento, o: OpcoesMoldura): void {
  const { doc, marca, esquerda, largura } = ctx;
  const y0 = PAGINA.margemTopo;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  usarTexto(doc, NEUTROS.textoSuave);
  doc.text(paraWinAnsi(marca.nomeOrgao), esquerda, y0 + 3);
  protocoloNoCanto(ctx, o.protocolo, y0 + 3, 8);
  usarTraco(doc, NEUTROS.linha);
  doc.setLineWidth(0.2);
  doc.line(esquerda, y0 + 5.5, esquerda + largura, y0 + 5.5);
  void ALTURA_CABECALHO;
}

function rodape(ctx: ContextoDocumento, o: OpcoesMoldura, pagina: number, total: number): void {
  const { doc, marca, esquerda, largura } = ctx;
  const yBase = ctx.alturaPagina - 16;
  usarTraco(doc, NEUTROS.linha);
  doc.setLineWidth(0.2);
  doc.line(esquerda, yBase, esquerda + largura, yBase);

  usarTexto(doc, NEUTROS.textoSuave);
  doc.setFontSize(FONTE.rodape);
  if (o.linhaAutenticidade) {
    doc.setFont('helvetica', 'italic');
    const prot = o.protocolo ? ` — protocolo ${o.protocolo}` : '';
    doc.text(paraWinAnsi(`Documento emitido eletronicamente${prot}.`), esquerda, yBase - 2);
  }
  doc.setFont('helvetica', 'normal');
  const quem = o.emissao.emitidoPor ? ` por ${o.emissao.emitidoPor}` : '';
  doc.text(paraWinAnsi(`Emitido${quem} em ${formatarData(o.emissao.emitidoEm)}`), esquerda, yBase + 4);
  doc.text(paraWinAnsi(marca.nomeSistema), esquerda, yBase + 8);
  doc.text(`Página ${pagina} de ${total}`, esquerda + largura, yBase + 4, { align: 'right' });
}

/** Desenha cabeçalho e rodapé em TODAS as páginas, ao final (só então se sabe o total). */
export function aplicarMoldura(ctx: ContextoDocumento, o: OpcoesMoldura): void {
  const total = ctx.doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    ctx.doc.setPage(i);
    if (i === 1) cabecalhoCompleto(ctx, o);
    else cabecalhoCompacto(ctx, o);
    rodape(ctx, o, i, total);
  }
}
```

Observação para quem implementa: a linha `void ALTURA_CABECALHO;` e o import dela existem só porque a altura reservada (10 mm) é a que `cabecalhoCompacto` respeita (régua em `y0 + 5.5`, conteúdo começa em `y0 + 10`). Se preferir, apague o import e a linha — nada depende deles.

- [ ] **Step 7: Implementar `blocos/titulo.ts`**

```ts
import { usarTexto } from '../core/pintura';
import { quebrarEmLinhas } from '../core/texto';
import { ESPACO, FONTE, NEUTROS, alturaLinha, ptParaMm } from '../core/tokens';
import type { Bloco } from '../tipos';

/** Título centralizado em caixa alta e subtítulo opcional. A moldura (cabeçalho) fica por conta de `aplicarMoldura`. */
export const titulo =
  (p: { texto: string; subtitulo?: string }): Bloco =>
  (ctx) => {
    const { doc } = ctx;
    const centro = ctx.esquerda + ctx.largura / 2;

    doc.setFont(ctx.fonteCorpo, 'bold');
    doc.setFontSize(FONTE.titulo);
    usarTexto(doc, NEUTROS.texto);
    for (const linha of quebrarEmLinhas(doc, p.texto.toUpperCase(), ctx.largura)) {
      ctx.garantirEspaco(alturaLinha(FONTE.titulo));
      doc.text(linha, centro, ctx.y + ptParaMm(FONTE.titulo), { align: 'center' });
      ctx.y += alturaLinha(FONTE.titulo);
    }
    if (p.subtitulo) {
      doc.setFont(ctx.fonteCorpo, 'normal');
      doc.setFontSize(10);
      usarTexto(doc, NEUTROS.textoSuave);
      for (const linha of quebrarEmLinhas(doc, p.subtitulo, ctx.largura)) {
        ctx.garantirEspaco(alturaLinha(10));
        doc.text(linha, centro, ctx.y + ptParaMm(10), { align: 'center' });
        ctx.y += alturaLinha(10);
      }
    }
    ctx.y += ESPACO.md;
    usarTexto(doc, NEUTROS.texto);
  };
```

- [ ] **Step 8: Implementar `core/renderizar.ts`**

```ts
import type jsPDF from 'jspdf';
import { titulo } from '../blocos/titulo';
import type { DocumentoModelo, Emissao, MarcaImpressao } from '../tipos';
import { FAMILIAS } from './familias';
import { aplicarMoldura } from './moldura';
import { criarContexto } from './pagina';

/** Núcleo puro: modelo + dados + marca → PDF. Não toca em tenant, rede nem DOM. */
export function renderizarDocumento<D>(
  modelo: DocumentoModelo<D>,
  dados: D,
  marca: MarcaImpressao,
  emissao: Emissao,
): { doc: jsPDF; nomeArquivo: string } {
  const familia = FAMILIAS[modelo.familia];
  const ctx = criarContexto({ marca, orientacao: modelo.orientacao ?? familia.orientacaoPadrao, familia: modelo.familia });

  titulo({ texto: modelo.titulo(dados), subtitulo: modelo.subtitulo?.(dados) })(ctx);
  for (const bloco of modelo.blocos(dados)) bloco(ctx);

  aplicarMoldura(ctx, {
    protocolo: modelo.protocolo?.(dados),
    unidadeEmissora: modelo.unidadeEmissora?.(dados),
    linhaAutenticidade: familia.linhaAutenticidade,
    emissao,
  });
  return { doc: ctx.doc, nomeArquivo: modelo.nomeArquivo(dados) };
}
```

- [ ] **Step 9: Rodar e ver passar**

Run: `npx vitest run src/lib/documentos/__testes__/renderizar.test.ts`
Expected: PASS (7 testes). Se "o conteúdo nunca invade" falhar por centímetros, o erro está em `ALTURA_CABECALHO`/`limiteInferior` — corrigir a causa em `pagina.ts`, não relaxar o teste.

- [ ] **Step 10: Commit**

```bash
git add src/lib/documentos/core/familias.ts src/lib/documentos/core/pagina.ts src/lib/documentos/core/moldura.ts src/lib/documentos/core/renderizar.ts src/lib/documentos/blocos/titulo.ts src/lib/documentos/__testes__/fixtures.ts src/lib/documentos/__testes__/renderizar.test.ts
git commit -m "feat(documentos): página A4, cabeçalho/rodapé com protocolo e pipeline de renderização

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Blocos de texto (seção, parágrafo, local e data)

**Files:**
- Create: `blocos/secao.ts`, `blocos/paragrafo.ts`, `blocos/localData.ts`
- Test: `__testes__/blocosTexto.test.ts`

**Interfaces:**
- Consumes: `Bloco`, `ContextoDocumento`, tokens, `quebrarEmLinhas`, `usarTexto/usarTraco`.
- Produces:
  - `secao(p: { texto: string }): Bloco`
  - `paragrafo(p: { texto: string; alinhamento?: 'esquerda' | 'justificado'; recuoPrimeiraLinha?: number; negrito?: boolean }): Bloco`
  - `localData(p: { local: string; data: string }): Bloco`

- [ ] **Step 1: Escrever os testes (falham primeiro)**

`__testes__/blocosTexto.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { localData } from '../blocos/localData';
import { paragrafo } from '../blocos/paragrafo';
import { secao } from '../blocos/secao';
import { renderizarDocumento } from '../core/renderizar';
import type { Bloco, DocumentoModelo } from '../tipos';
import { emissaoTeste, marcaTeste } from './fixtures';
import { lerPdf, mmParaPt } from './lerPdf';

const gerar = (blocos: Bloco[]) => {
  const modelo: DocumentoModelo<null> = {
    tipo: 't', familia: 'ato', titulo: () => 'T', nomeArquivo: () => 't.pdf', blocos: () => blocos,
  };
  return renderizarDocumento(modelo, null, marcaTeste, emissaoTeste).doc;
};

describe('paragrafo', () => {
  it('texto longo atravessa páginas sem perder nem repetir palavras', async () => {
    const palavras = Array.from({ length: 1500 }, (_, i) => `p${i}`);
    const p = await lerPdf(gerar([paragrafo({ texto: palavras.join(' ') })]));
    expect(p.length).toBeGreaterThanOrEqual(2);
    const lidas = p.flatMap((pg) => pg.itens.map((i) => i.str)).join(' ').match(/\bp\d+\b/g);
    expect(lidas).toEqual(palavras);
  });

  it('emoji e símbolos fora da fonte viram "?" e o resto do texto sobrevive', async () => {
    const [p1] = await lerPdf(gerar([paragrafo({ texto: 'Aprovado ✓ 😀 em “reunião” — 3º ponto' })]));
    expect(p1.texto).toContain('Aprovado');
    expect(p1.texto).toContain('reunião');
    expect(p1.texto).toContain('3º ponto');
  });

  it('justificado e recuo não estouram a margem direita', async () => {
    const texto = Array.from({ length: 200 }, () => 'palavra').join(' ');
    const [p1] = await lerPdf(gerar([paragrafo({ texto, alinhamento: 'justificado', recuoPrimeiraLinha: 12 })]));
    const limite = p1.largura - mmParaPt(20) + 1;
    for (const i of p1.itens) expect(i.x + i.largura).toBeLessThanOrEqual(limite);
  });

  it('negrito e quebras de linha explícitas funcionam', async () => {
    const [p1] = await lerPdf(gerar([paragrafo({ texto: 'linha A\nlinha B', negrito: true })]));
    expect(p1.texto).toContain('linha A');
    expect(p1.texto).toContain('linha B');
  });
});

describe('secao', () => {
  it('título de seção nunca fica sozinho no fim da página', async () => {
    const encher: Bloco = (ctx) => {
      ctx.y = ctx.limiteInferior - 8; // só cabe o título, não o conteúdo seguinte
    };
    const p = await lerPdf(gerar([encher, secao({ texto: 'Fundamentação' }), paragrafo({ texto: 'corpo da seção' })]));
    const pagSecao = p.findIndex((pg) => pg.texto.includes('Fundamentação'));
    const pagCorpo = p.findIndex((pg) => pg.texto.includes('corpo da seção'));
    expect(pagSecao).toBe(pagCorpo);
  });
});

describe('localData', () => {
  it('imprime "Local, data."', async () => {
    const [p1] = await lerPdf(gerar([localData({ local: 'Boa Vista', data: '12 de outubro de 2026' })]));
    expect(p1.texto).toContain('Boa Vista, 12 de outubro de 2026.');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/lib/documentos/__testes__/blocosTexto.test.ts`
Expected: FAIL — módulos de bloco inexistentes.

- [ ] **Step 3: Implementar `blocos/secao.ts`**

```ts
import { usarTexto, usarTraco } from '../core/pintura';
import { quebrarEmLinhas } from '../core/texto';
import { ESPACO, FONTE, NEUTROS, alturaLinha, corLegivel, ptParaMm } from '../core/tokens';
import type { Bloco } from '../tipos';

/** Título de seção com régua. Reserva espaço para a primeira linha do que vem depois (evita título órfão). */
export const secao =
  (p: { texto: string }): Bloco =>
  (ctx) => {
    const { doc } = ctx;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(FONTE.secao);
    const linhas = quebrarEmLinhas(doc, p.texto, ctx.largura);
    ctx.garantirEspaco(ESPACO.sm + linhas.length * alturaLinha(FONTE.secao) + ESPACO.sm + 12);
    ctx.y += ESPACO.sm;
    usarTexto(doc, corLegivel(ctx.marca.corPrimaria));
    for (const linha of linhas) {
      doc.text(linha, ctx.esquerda, ctx.y + ptParaMm(FONTE.secao));
      ctx.y += alturaLinha(FONTE.secao);
    }
    usarTraco(doc, NEUTROS.linha);
    doc.setLineWidth(0.3);
    doc.line(ctx.esquerda, ctx.y, ctx.esquerda + ctx.largura, ctx.y);
    ctx.y += ESPACO.sm;
    usarTexto(doc, NEUTROS.texto);
  };
```

- [ ] **Step 4: Implementar `blocos/paragrafo.ts`**

```ts
import { usarTexto } from '../core/pintura';
import { quebrarEmLinhas } from '../core/texto';
import { ESPACO, FONTE, NEUTROS, alturaLinha, ptParaMm } from '../core/tokens';
import type { Bloco } from '../tipos';

export interface PropsParagrafo {
  texto: string;
  alinhamento?: 'esquerda' | 'justificado';
  /** Recuo (mm) só da primeira linha. */
  recuoPrimeiraLinha?: number;
  negrito?: boolean;
}

export const paragrafo =
  (p: PropsParagrafo): Bloco =>
  (ctx) => {
    const { doc } = ctx;
    const h = alturaLinha(FONTE.corpo);
    doc.setFont(ctx.fonteCorpo, p.negrito ? 'bold' : 'normal');
    doc.setFontSize(FONTE.corpo);
    usarTexto(doc, NEUTROS.texto);

    // Cada linha de texto original (separada por \n) é um parágrafo próprio; o recuo vale para a 1ª de cada.
    for (const original of String(p.texto ?? '').split('\n')) {
      const recuo = p.recuoPrimeiraLinha ?? 0;
      const linhas = quebrarEmLinhas(doc, original, ctx.largura - recuo);
      linhas.forEach((linha, i) => {
        ctx.garantirEspaco(h);
        const x = ctx.esquerda + (i === 0 ? recuo : 0);
        const ultima = i === linhas.length - 1;
        if (p.alinhamento === 'justificado' && !ultima && linha.includes(' ')) {
          doc.text(linha, x, ctx.y + ptParaMm(FONTE.corpo), { align: 'justify', maxWidth: ctx.largura - (i === 0 ? recuo : 0) });
        } else {
          doc.text(linha, x, ctx.y + ptParaMm(FONTE.corpo));
        }
        ctx.y += h;
      });
    }
    ctx.y += ESPACO.sm;
  };
```

Atenção: a quebra é calculada com a largura menor da 1ª linha (`ctx.largura - recuo`) para **todas** as linhas do parágrafo recuado — as demais ficam um pouco mais curtas que o possível. É uma simplificação aceita (sem reflow por linha); se a validação visual achar feio, a correção é quebrar a 1ª linha à parte.

- [ ] **Step 5: Implementar `blocos/localData.ts`**

```ts
import { usarTexto } from '../core/pintura';
import { quebrarEmLinhas } from '../core/texto';
import { ESPACO, FONTE, NEUTROS, alturaLinha, ptParaMm } from '../core/tokens';
import type { Bloco } from '../tipos';

export const localData =
  (p: { local: string; data: string }): Bloco =>
  (ctx) => {
    const { doc } = ctx;
    doc.setFont(ctx.fonteCorpo, 'normal');
    doc.setFontSize(FONTE.corpo);
    usarTexto(doc, NEUTROS.texto);
    const linhas = quebrarEmLinhas(doc, `${p.local}, ${p.data}.`, ctx.largura);
    ctx.garantirEspaco(ESPACO.md + linhas.length * alturaLinha(FONTE.corpo));
    ctx.y += ESPACO.md;
    for (const linha of linhas) {
      doc.text(linha, ctx.esquerda, ctx.y + ptParaMm(FONTE.corpo));
      ctx.y += alturaLinha(FONTE.corpo);
    }
    ctx.y += ESPACO.sm;
  };
```

- [ ] **Step 6: Rodar e ver passar**

Run: `npx vitest run src/lib/documentos/__testes__/blocosTexto.test.ts`
Expected: PASS. Se o teste do justificado falhar (`x + largura` além do limite), é o `maxWidth`/`align: 'justify'` do jsPDF: trocar para `doc.text(linha, x, y)` sem `justify` **somente neste bloco** e registrar a limitação em `docs/PADRAO_DOCUMENTOS.md` (seção "Limitações"). Não relaxar a tolerância.

- [ ] **Step 7: Commit**

```bash
git add src/lib/documentos/blocos/secao.ts src/lib/documentos/blocos/paragrafo.ts src/lib/documentos/blocos/localData.ts src/lib/documentos/__testes__/blocosTexto.test.ts
git commit -m "feat(documentos): blocos de seção, parágrafo e local/data

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Bloco de campos chave-valor

**Files:**
- Create: `blocos/camposChaveValor.ts`
- Test: `__testes__/camposChaveValor.test.ts`

**Interfaces:**
- Produces: `interface Campo { rotulo: string; valor?: string | number | null }` e `camposChaveValor(p: { campos: Campo[]; colunas?: 1 | 2 | 3 }): Bloco` (padrão 2 colunas).

- [ ] **Step 1: Escrever o teste (falha primeiro)**

```ts
import { describe, expect, it } from 'vitest';
import { camposChaveValor } from '../blocos/camposChaveValor';
import { renderizarDocumento } from '../core/renderizar';
import type { Bloco, DocumentoModelo } from '../tipos';
import { emissaoTeste, marcaTeste } from './fixtures';
import { lerPdf, mmParaPt } from './lerPdf';

const gerar = (blocos: Bloco[]) => {
  const modelo: DocumentoModelo<null> = { tipo: 't', familia: 'ficha', titulo: () => 'T', nomeArquivo: () => 't.pdf', blocos: () => blocos };
  return renderizarDocumento(modelo, null, marcaTeste, emissaoTeste).doc;
};

describe('camposChaveValor', () => {
  it('valor null, undefined e vazio imprime "—", nunca "null"/"undefined"', async () => {
    const [p1] = await lerPdf(gerar([camposChaveValor({ campos: [
      { rotulo: 'A', valor: null }, { rotulo: 'B', valor: undefined }, { rotulo: 'C', valor: '' }, { rotulo: 'D', valor: 0 },
    ] })]));
    expect(p1.texto).not.toMatch(/null|undefined/);
    expect(p1.itens.filter((i) => i.str === '—')).toHaveLength(3);
    expect(p1.itens.some((i) => i.str === '0')).toBe(true);
  });

  it('duas colunas põem campos vizinhos lado a lado (mesmo y, x diferente)', async () => {
    const [p1] = await lerPdf(gerar([camposChaveValor({ colunas: 2, campos: [
      { rotulo: 'Nome', valor: 'Ana' }, { rotulo: 'Cargo', valor: 'Analista' },
    ] })]));
    const nome = p1.itens.find((i) => i.str === 'Ana')!;
    const cargo = p1.itens.find((i) => i.str === 'Analista')!;
    expect(Math.abs(nome.y - cargo.y)).toBeLessThan(1);
    expect(cargo.x).toBeGreaterThan(nome.x + mmParaPt(40));
  });

  it('valor longo quebra dentro da coluna e não invade a vizinha', async () => {
    const longo = 'palavra '.repeat(40).trim();
    const [p1] = await lerPdf(gerar([camposChaveValor({ colunas: 2, campos: [
      { rotulo: 'Descrição', valor: longo }, { rotulo: 'Outro', valor: 'x' },
    ] })]));
    const limiteColuna1 = mmParaPt(20) + mmParaPt((170 - 6) / 2) + 1;
    for (const i of p1.itens.filter((it) => it.str.startsWith('palavra'))) expect(i.x + i.largura).toBeLessThanOrEqual(limiteColuna1);
  });

  it('muitos campos atravessam a página sem cortar um campo ao meio', async () => {
    const campos = Array.from({ length: 80 }, (_, i) => ({ rotulo: `Rótulo ${i}`, valor: `Valor ${i}` }));
    const p = await lerPdf(gerar([camposChaveValor({ campos, colunas: 1 })]));
    expect(p.length).toBeGreaterThanOrEqual(2);
    for (const pg of p) {
      for (let i = 0; i < 80; i++) {
        expect(pg.texto.includes(`Rótulo ${i}`)).toBe(pg.texto.includes(`Valor ${i}`));
      }
    }
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/lib/documentos/__testes__/camposChaveValor.test.ts`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar `blocos/camposChaveValor.ts`**

```ts
import { usarTexto } from '../core/pintura';
import { ouTraco, quebrarEmLinhas } from '../core/texto';
import { ESPACO, FONTE, NEUTROS, alturaLinha, ptParaMm } from '../core/tokens';
import type { Bloco } from '../tipos';

export interface Campo {
  rotulo: string;
  valor?: string | number | null;
}

const FOLGA_ENTRE_COLUNAS = 6;

/** Grade de "rótulo pequeno + valor". Valor vazio sai como "—" (documento impresso não deixa lacuna muda). */
export const camposChaveValor =
  (p: { campos: Campo[]; colunas?: 1 | 2 | 3 }): Bloco =>
  (ctx) => {
    const { doc } = ctx;
    const colunas = p.colunas ?? 2;
    const w = (ctx.largura - FOLGA_ENTRE_COLUNAS * (colunas - 1)) / colunas;
    const hRotulo = alturaLinha(FONTE.rotulo);
    const hValor = alturaLinha(FONTE.corpo);

    for (let i = 0; i < p.campos.length; i += colunas) {
      const linha = p.campos.slice(i, i + colunas);
      doc.setFont(ctx.fonteCorpo, 'normal');
      doc.setFontSize(FONTE.corpo);
      const valores = linha.map((c) => quebrarEmLinhas(doc, ouTraco(c.valor), w));
      const altura = hRotulo + Math.max(...valores.map((v) => v.length)) * hValor + ESPACO.sm / 2;
      ctx.garantirEspaco(altura);

      linha.forEach((c, k) => {
        const x = ctx.esquerda + k * (w + FOLGA_ENTRE_COLUNAS);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(FONTE.rotulo);
        usarTexto(doc, NEUTROS.textoSuave);
        doc.text(quebrarEmLinhas(doc, c.rotulo, w)[0], x, ctx.y + ptParaMm(FONTE.rotulo));

        doc.setFont(ctx.fonteCorpo, 'normal');
        doc.setFontSize(FONTE.corpo);
        usarTexto(doc, NEUTROS.texto);
        valores[k].forEach((v, j) => doc.text(v, x, ctx.y + hRotulo + ptParaMm(FONTE.corpo) + j * hValor));
      });
      ctx.y += altura;
    }
    ctx.y += ESPACO.sm / 2;
  };
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/lib/documentos/__testes__/camposChaveValor.test.ts`
Expected: PASS (4 testes).

- [ ] **Step 5: Commit**

```bash
git add src/lib/documentos/blocos/camposChaveValor.ts src/lib/documentos/__testes__/camposChaveValor.test.ts
git commit -m "feat(documentos): bloco de campos chave-valor em até 3 colunas

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Bloco de tabela

**Files:**
- Create: `blocos/tabela.ts`
- Test: `__testes__/tabela.test.ts`

**Interfaces:**
- Produces: `interface ColunaTabela { chave: string; titulo: string; peso?: number; alinhamento?: 'esquerda' | 'centro' | 'direita' }`, `type Celula = string | number | null | undefined` e `tabela(p: { colunas: ColunaTabela[]; linhas: Record<string, Celula>[]; totais?: Record<string, Celula> }): Bloco`. `peso` é relativo (padrão 1).

- [ ] **Step 1: Escrever o teste (falha primeiro)**

```ts
import { describe, expect, it } from 'vitest';
import { tabela, type ColunaTabela } from '../blocos/tabela';
import { renderizarDocumento } from '../core/renderizar';
import type { Bloco, DocumentoModelo, Orientacao } from '../tipos';
import { emissaoTeste, marcaTeste } from './fixtures';
import { lerPdf, mmParaPt } from './lerPdf';

const colunas: ColunaTabela[] = [
  { chave: 'nome', titulo: 'Nome', peso: 3 },
  { chave: 'matricula', titulo: 'Matrícula', peso: 1, alinhamento: 'centro' },
  { chave: 'valor', titulo: 'Valor', peso: 1, alinhamento: 'direita' },
];

const gerar = (blocos: Bloco[], orientacao?: Orientacao) => {
  const modelo: DocumentoModelo<null> = { tipo: 't', familia: 'relatorio', orientacao, titulo: () => 'T', nomeArquivo: () => 't.pdf', blocos: () => blocos };
  return renderizarDocumento(modelo, null, marcaTeste, emissaoTeste).doc;
};

describe('tabela', () => {
  it('200 linhas: várias páginas, cabeçalho repetido em todas, nenhuma linha perdida', async () => {
    const linhas = Array.from({ length: 200 }, (_, i) => ({ nome: `Servidor ${i}`, matricula: `M${i}`, valor: `R$ ${i},00` }));
    const p = await lerPdf(gerar([tabela({ colunas, linhas })]));
    expect(p.length).toBeGreaterThanOrEqual(4);
    for (const pg of p) expect(pg.texto).toContain('Matrícula');
    const lidas = p.flatMap((pg) => pg.itens.map((i) => i.str)).filter((s) => /^Servidor \d+$/.test(s));
    expect(lidas).toEqual(linhas.map((l) => l.nome));
    for (const [n, pg] of p.entries()) expect(pg.texto).toContain(`Página ${n + 1} de ${p.length}`);
  });

  it('sem linhas mostra "Nenhum registro encontrado." junto do cabeçalho', async () => {
    const [p1] = await lerPdf(gerar([tabela({ colunas, linhas: [] })]));
    expect(p1.texto).toContain('Matrícula');
    expect(p1.texto).toContain('Nenhum registro encontrado.');
  });

  it('palavra sem espaço maior que a coluna não ultrapassa a margem direita', async () => {
    const uuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890-a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const p = await lerPdf(gerar([tabela({ colunas, linhas: [{ nome: uuid, matricula: 'x'.repeat(60), valor: '1' }] })]));
    const limite = p[0].largura - mmParaPt(20) + 1;
    for (const i of p[0].itens) expect(i.x + i.largura).toBeLessThanOrEqual(limite);
    expect(p[0].itens.map((i) => i.str).join('').replace(/\s/g, '')).toContain('a1b2c3d4');
  });

  it('null, undefined e vazio viram "—"', async () => {
    const [p1] = await lerPdf(gerar([tabela({ colunas, linhas: [{ nome: null, matricula: undefined, valor: '' }] })]));
    expect(p1.texto).not.toMatch(/null|undefined/);
    expect(p1.itens.filter((i) => i.str === '—')).toHaveLength(3);
  });

  it('linha de totais em negrito aparece depois das linhas, só com as colunas informadas', async () => {
    const [p1] = await lerPdf(gerar([tabela({ colunas, linhas: [{ nome: 'A', matricula: '1', valor: '10' }], totais: { nome: 'TOTAL', valor: '10' } })]));
    expect(p1.texto).toContain('TOTAL');
    expect(p1.itens.filter((i) => i.str === '—')).toHaveLength(0);
  });

  it('em paisagem a tabela usa a largura toda', async () => {
    const p = await lerPdf(gerar([tabela({ colunas, linhas: [{ nome: 'A', matricula: '1', valor: '10' }] })], 'paisagem'));
    const valor = p[0].itens.find((i) => i.str === '10')!;
    expect(valor.x + valor.largura).toBeGreaterThan(mmParaPt(250));
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/lib/documentos/__testes__/tabela.test.ts`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar `blocos/tabela.ts`**

```ts
import { usarPreenchimento, usarTexto, usarTraco } from '../core/pintura';
import { ouTraco, paraWinAnsi, quebrarEmLinhas } from '../core/texto';
import { ESPACO, FONTE, NEUTROS, alturaLinha, corLegivel, ptParaMm } from '../core/tokens';
import type { Bloco } from '../tipos';

export interface ColunaTabela {
  chave: string;
  titulo: string;
  /** Largura relativa (padrão 1). */
  peso?: number;
  alinhamento?: 'esquerda' | 'centro' | 'direita';
}
export type Celula = string | number | null | undefined;

const PAD = 1.5;

export const tabela =
  (p: { colunas: ColunaTabela[]; linhas: Record<string, Celula>[]; totais?: Record<string, Celula> }): Bloco =>
  (ctx) => {
    const { doc } = ctx;
    const lh = alturaLinha(FONTE.tabela);
    const soma = p.colunas.reduce((s, c) => s + (c.peso ?? 1), 0);
    const larguras = p.colunas.map((c) => (ctx.largura * (c.peso ?? 1)) / soma);

    const quebrar = (valor: Celula, i: number, negrito: boolean, vazioComoTraco: boolean): string[] => {
      doc.setFont('helvetica', negrito ? 'bold' : 'normal');
      doc.setFontSize(FONTE.tabela);
      const texto = vazioComoTraco ? ouTraco(valor) : paraWinAnsi(valor);
      return quebrarEmLinhas(doc, texto, larguras[i] - 2 * PAD);
    };
    const alturaDe = (celulas: string[][]): number => Math.max(...celulas.map((c) => c.length)) * lh + 2 * PAD;
    const xDe = (i: number): number => ctx.esquerda + larguras.slice(0, i).reduce((s, w) => s + w, 0);
    const escrever = (celulas: string[][], negrito: boolean): void => {
      doc.setFont('helvetica', negrito ? 'bold' : 'normal');
      doc.setFontSize(FONTE.tabela);
      usarTexto(doc, NEUTROS.texto);
      celulas.forEach((linhas, i) => {
        const a = p.colunas[i].alinhamento ?? 'esquerda';
        const x0 = xDe(i);
        const x = a === 'direita' ? x0 + larguras[i] - PAD : a === 'centro' ? x0 + larguras[i] / 2 : x0 + PAD;
        linhas.forEach((l, k) => doc.text(l, x, ctx.y + PAD + ptParaMm(FONTE.tabela) + k * lh, { align: a === 'esquerda' ? 'left' : a === 'centro' ? 'center' : 'right' }));
      });
    };
    const regua = (y: number, forte: boolean): void => {
      usarTraco(doc, forte ? corLegivel(ctx.marca.corPrimaria) : NEUTROS.linha);
      doc.setLineWidth(forte ? 0.4 : 0.15);
      doc.line(ctx.esquerda, y, ctx.esquerda + ctx.largura, y);
    };

    const cabecalho = (): void => {
      const celulas = p.colunas.map((c, i) => quebrar(c.titulo, i, true, true));
      const h = alturaDe(celulas);
      ctx.garantirEspaco(h + lh + 2 * PAD); // o cabeçalho nunca fica sozinho no fim da página
      usarPreenchimento(doc, NEUTROS.fundoCabecalhoTabela);
      doc.rect(ctx.esquerda, ctx.y, ctx.largura, h, 'F');
      escrever(celulas, true);
      regua(ctx.y + h, true);
      ctx.y += h;
    };

    const linha = (valores: Record<string, Celula>, indice: number, negrito = false, vazioComoTraco = true): void => {
      const celulas = p.colunas.map((c, i) => quebrar(valores[c.chave], i, negrito, vazioComoTraco));
      const h = alturaDe(celulas);
      if (ctx.y + h > ctx.limiteInferior) {
        ctx.novaPagina();
        cabecalho();
      }
      if (indice % 2 === 1 && !negrito) {
        usarPreenchimento(doc, NEUTROS.zebra);
        doc.rect(ctx.esquerda, ctx.y, ctx.largura, h, 'F');
      }
      escrever(celulas, negrito);
      regua(ctx.y + h, false);
      ctx.y += h;
    };

    cabecalho();
    if (p.linhas.length === 0) {
      ctx.garantirEspaco(lh + 2 * PAD);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(FONTE.tabela);
      usarTexto(doc, NEUTROS.textoSuave);
      doc.text('Nenhum registro encontrado.', ctx.esquerda + PAD, ctx.y + PAD + ptParaMm(FONTE.tabela));
      ctx.y += lh + 2 * PAD;
      regua(ctx.y, false);
    } else {
      p.linhas.forEach((v, i) => linha(v, i));
    }
    if (p.totais) linha(p.totais, 0, true, false);
    ctx.y += ESPACO.sm;
  };
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/lib/documentos/__testes__/tabela.test.ts`
Expected: PASS (6 testes). Falha no teste de 200 linhas por ordem/duplicação indica bug em `linha` (nova página sem redesenhar cabeçalho) — corrigir na causa.

- [ ] **Step 5: Commit**

```bash
git add src/lib/documentos/blocos/tabela.ts src/lib/documentos/__testes__/tabela.test.ts
git commit -m "feat(documentos): bloco de tabela com cabeçalho repetido, zebra e totais

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Blocos de assinaturas e carimbo

**Files:**
- Create: `blocos/assinaturas.ts`, `blocos/carimbo.ts`, `blocos/index.ts`
- Test: `__testes__/assinaturasCarimbo.test.ts`

**Interfaces:**
- Produces: `interface Assinante { nome: string; cargo?: string; documento?: string }`; `assinaturas(p: { assinantes: Assinante[] }): Bloco`; `carimbo(p: { linhas: string[] }): Bloco`; `blocos/index.ts` reexporta todos os blocos e seus tipos (`titulo, secao, paragrafo, localData, camposChaveValor, tabela, assinaturas, carimbo`, `Campo`, `ColunaTabela`, `Celula`, `Assinante`).

- [ ] **Step 1: Escrever o teste (falha primeiro)**

```ts
import { describe, expect, it } from 'vitest';
import { assinaturas } from '../blocos/assinaturas';
import { carimbo } from '../blocos/carimbo';
import { renderizarDocumento } from '../core/renderizar';
import type { Bloco, DocumentoModelo } from '../tipos';
import { emissaoTeste, marcaTeste } from './fixtures';
import { lerPdf } from './lerPdf';

const gerar = (blocos: Bloco[]) => {
  const modelo: DocumentoModelo<null> = { tipo: 't', familia: 'ato', titulo: () => 'T', nomeArquivo: () => 't.pdf', blocos: () => blocos };
  return renderizarDocumento(modelo, null, marcaTeste, emissaoTeste).doc;
};
const quase: Bloco = (ctx) => { ctx.y = ctx.limiteInferior - 10; };

describe('assinaturas', () => {
  it('duas assinaturas ficam lado a lado, com nome e cargo', async () => {
    const [p1] = await lerPdf(gerar([assinaturas({ assinantes: [{ nome: 'Ana', cargo: 'Diretora' }, { nome: 'Beto', cargo: 'Chefe' }] })]));
    const ana = p1.itens.find((i) => i.str === 'Ana')!;
    const beto = p1.itens.find((i) => i.str === 'Beto')!;
    expect(Math.abs(ana.y - beto.y)).toBeLessThan(1);
    expect(beto.x).toBeGreaterThan(ana.x);
    expect(p1.texto).toContain('Diretora');
  });

  it('o bloco de assinatura nunca se parte: nome e cargo ficam na mesma página, mesmo perto do fim', async () => {
    const p = await lerPdf(gerar([quase, assinaturas({ assinantes: [{ nome: 'Ana Souza', cargo: 'Diretora', documento: 'Mat. 123' }] })]));
    const pg = p.find((x) => x.texto.includes('Ana Souza'))!;
    expect(pg.texto).toContain('Diretora');
    expect(pg.texto).toContain('Mat. 123');
    expect(p.length).toBe(2);
  });

  it('nome muito longo quebra e não passa da margem; campos ausentes não geram "undefined"', async () => {
    const [p1] = await lerPdf(gerar([assinaturas({ assinantes: [{ nome: 'Maria '.repeat(20).trim() }] })]));
    expect(p1.texto).not.toContain('undefined');
  });

  it('número ímpar de assinantes (3) imprime os três', async () => {
    const [p1] = await lerPdf(gerar([assinaturas({ assinantes: [{ nome: 'A1' }, { nome: 'B2' }, { nome: 'C3' }] })]));
    for (const n of ['A1', 'B2', 'C3']) expect(p1.texto).toContain(n);
  });
});

describe('carimbo', () => {
  it('imprime todas as linhas dentro de uma caixa e quebra linha longa', async () => {
    const [p1] = await lerPdf(gerar([carimbo({ linhas: ['Emitido eletronicamente', 'palavra '.repeat(60).trim()] })]));
    expect(p1.texto).toContain('Emitido eletronicamente');
    expect(p1.itens.filter((i) => i.str.startsWith('palavra')).length).toBeGreaterThan(1);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/lib/documentos/__testes__/assinaturasCarimbo.test.ts`
Expected: FAIL — módulos inexistentes.

- [ ] **Step 3: Implementar `blocos/assinaturas.ts`**

```ts
import { usarTexto, usarTraco } from '../core/pintura';
import { quebrarEmLinhas } from '../core/texto';
import { ESPACO, FONTE, NEUTROS, alturaLinha, ptParaMm } from '../core/tokens';
import type { Bloco } from '../tipos';

export interface Assinante {
  nome: string;
  cargo?: string;
  documento?: string;
}

const ESPACO_PARA_ASSINAR = 14;
const FOLGA = 12;
const LARGURA_MAX = 80;

/** Linhas de assinatura, no máximo 2 por fileira, centralizadas. Cada fileira é indivisível. */
export const assinaturas =
  (p: { assinantes: Assinante[] }): Bloco =>
  (ctx) => {
    const { doc } = ctx;
    const porFileira = p.assinantes.length === 1 ? 1 : 2;
    const w = Math.min(LARGURA_MAX, (ctx.largura - FOLGA * (porFileira - 1)) / porFileira);
    const h = alturaLinha(FONTE.corpo);

    for (let i = 0; i < p.assinantes.length; i += porFileira) {
      const fileira = p.assinantes.slice(i, i + porFileira);
      doc.setFontSize(FONTE.corpo);
      doc.setFont(ctx.fonteCorpo, 'bold');
      const nomes = fileira.map((a) => quebrarEmLinhas(doc, a.nome, w));
      doc.setFont(ctx.fonteCorpo, 'normal');
      const detalhes = fileira.map((a) => [a.cargo, a.documento].filter(Boolean).flatMap((t) => quebrarEmLinhas(doc, String(t), w)));
      const linhasMax = Math.max(...nomes.map((n, k) => n.length + detalhes[k].length));
      const altura = ESPACO_PARA_ASSINAR + linhasMax * h + ESPACO.sm;
      ctx.garantirEspaco(altura);

      const total = fileira.length * w + (fileira.length - 1) * FOLGA;
      const x0 = ctx.esquerda + (ctx.largura - total) / 2;
      fileira.forEach((_, k) => {
        const x = x0 + k * (w + FOLGA);
        const centro = x + w / 2;
        usarTraco(doc, NEUTROS.texto);
        doc.setLineWidth(0.3);
        doc.line(x, ctx.y + ESPACO_PARA_ASSINAR, x + w, ctx.y + ESPACO_PARA_ASSINAR);
        usarTexto(doc, NEUTROS.texto);
        let y = ctx.y + ESPACO_PARA_ASSINAR + 1;
        doc.setFont(ctx.fonteCorpo, 'bold');
        for (const l of nomes[k]) { doc.text(l, centro, y + ptParaMm(FONTE.corpo), { align: 'center' }); y += h; }
        doc.setFont(ctx.fonteCorpo, 'normal');
        for (const l of detalhes[k]) { doc.text(l, centro, y + ptParaMm(FONTE.corpo), { align: 'center' }); y += h; }
      });
      ctx.y += altura;
    }
  };
```

- [ ] **Step 4: Implementar `blocos/carimbo.ts`**

```ts
import { usarTexto, usarTraco } from '../core/pintura';
import { quebrarEmLinhas } from '../core/texto';
import { ESPACO, NEUTROS, alturaLinha, ptParaMm } from '../core/tokens';
import type { Bloco } from '../tipos';

const TAMANHO = 8.5;
const PAD = 3;

/** Caixa com texto de autenticidade/observação (comprovantes). Indivisível. */
export const carimbo =
  (p: { linhas: string[] }): Bloco =>
  (ctx) => {
    const { doc } = ctx;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(TAMANHO);
    const linhas = p.linhas.flatMap((l) => quebrarEmLinhas(doc, l, ctx.largura - 2 * PAD));
    const h = linhas.length * alturaLinha(TAMANHO) + 2 * PAD;
    ctx.garantirEspaco(h + ESPACO.sm);
    usarTraco(doc, NEUTROS.linha);
    doc.setLineWidth(0.3);
    doc.rect(ctx.esquerda, ctx.y, ctx.largura, h);
    usarTexto(doc, NEUTROS.texto);
    linhas.forEach((l, i) => doc.text(l, ctx.esquerda + PAD, ctx.y + PAD + ptParaMm(TAMANHO) + i * alturaLinha(TAMANHO)));
    ctx.y += h + ESPACO.sm;
  };
```

- [ ] **Step 5: Criar `blocos/index.ts`**

```ts
export { titulo } from './titulo';
export { secao } from './secao';
export { paragrafo } from './paragrafo';
export type { PropsParagrafo } from './paragrafo';
export { localData } from './localData';
export { camposChaveValor } from './camposChaveValor';
export type { Campo } from './camposChaveValor';
export { tabela } from './tabela';
export type { ColunaTabela, Celula } from './tabela';
export { assinaturas } from './assinaturas';
export type { Assinante } from './assinaturas';
export { carimbo } from './carimbo';
```

- [ ] **Step 6: Rodar tudo da camada até aqui e ver passar**

Run: `npx vitest run src/lib/documentos`
Expected: PASS em todos os arquivos (lerPdf, tokens, texto, renderizar, blocosTexto, camposChaveValor, tabela, assinaturasCarimbo).

- [ ] **Step 7: Commit**

```bash
git add src/lib/documentos/blocos/assinaturas.ts src/lib/documentos/blocos/carimbo.ts src/lib/documentos/blocos/index.ts src/lib/documentos/__testes__/assinaturasCarimbo.test.ts
git commit -m "feat(documentos): blocos de assinaturas e carimbo, índice dos blocos

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Marca do tenant, registro, `emitirDocumento` e o modelo `requerimento`

**Files:**
- Create: `marca.ts`, `logos.ts`, `registro.ts`, `emitir.ts`, `index.ts`, `modelos/requerimento.ts`
- Test: `__testes__/marca.test.ts`, `__testes__/requerimento.test.ts`

**Interfaces:**
- Consumes: `renderizarDocumento`, blocos, `TenantConfig` (tipo de `@/core/tenant`), `nomeDoSistema(tenant)`, `getTenantSnapshot()`, `logoOrgao('claro')`, `logoEntidadeSuperior('claro')`, `hexParaRGB`.
- Produces:
  - `marcaDoTenant(tenant: TenantConfig, extras: { nomeSistema: string; logoOrgao?: LogoImpressao; logoEntidadeSuperior?: LogoImpressao }): MarcaImpressao` (puro)
  - `carregarLogo(src: string | undefined): Promise<LogoImpressao | undefined>` (navegador; cache; nunca lança)
  - `interface DadosRequerimento` e `requerimentoModelo: DocumentoModelo<DadosRequerimento>`
  - `REGISTRO`, `type TipoDocumento = keyof typeof REGISTRO`, `type DadosDe<T extends TipoDocumento>`
  - `emitirDocumento<T extends TipoDocumento>(tipo: T, dados: DadosDe<T>, opcoes?: { emitidoPor?: string }): Promise<DocumentoEmitido>` com `DocumentoEmitido = { doc: jsPDF; blob: Blob; nomeArquivo: string }`; `baixarDocumento(d: DocumentoEmitido): void`.

- [ ] **Step 1: Escrever os testes (falham primeiro)**

`__testes__/marca.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { TenantConfig } from '@/core/tenant';
import { marcaDoTenant } from '../marca';
import { PNG_1X1 } from './fixtures';

const tenant = {
  identidade: { nomeOficial: 'Instituto de Exemplo', nomeParaDocumentos: undefined },
  entidadeSuperior: { nome: 'Governo de Exemplo', exibirEmDocumentos: true },
  marca: { corPrimariaHex: '#164069' },
} as unknown as TenantConfig;

describe('marcaDoTenant', () => {
  it('usa o nome para documentos quando houver, senão o nome oficial em caixa alta', () => {
    expect(marcaDoTenant(tenant, { nomeSistema: 'S' }).nomeOrgao).toBe('INSTITUTO DE EXEMPLO');
    const com = { ...tenant, identidade: { ...tenant.identidade, nomeParaDocumentos: 'INSTITUTO X' } } as TenantConfig;
    expect(marcaDoTenant(com, { nomeSistema: 'S' }).nomeOrgao).toBe('INSTITUTO X');
  });

  it('entidade superior só entra se exibirEmDocumentos', () => {
    expect(marcaDoTenant(tenant, { nomeSistema: 'S' }).entidadeSuperior).toBe('GOVERNO DE EXEMPLO');
    const oculta = { ...tenant, entidadeSuperior: { nome: 'G', exibirEmDocumentos: false } } as TenantConfig;
    expect(marcaDoTenant(oculta, { nomeSistema: 'S' }).entidadeSuperior).toBeUndefined();
    const sem = { ...tenant, entidadeSuperior: undefined } as TenantConfig;
    expect(marcaDoTenant(sem, { nomeSistema: 'S' }).entidadeSuperior).toBeUndefined();
  });

  it('converte a cor primária e repassa nome do sistema e logos', () => {
    const logo = { dataUrl: PNG_1X1, largura: 1, altura: 1, formato: 'PNG' as const };
    const m = marcaDoTenant(tenant, { nomeSistema: 'Sistema / EX', logoOrgao: logo });
    expect(m.corPrimaria).toEqual({ r: 22, g: 64, b: 105 });
    expect(m.nomeSistema).toBe('Sistema / EX');
    expect(m.logoOrgao).toBe(logo);
    expect(m.logoEntidadeSuperior).toBeUndefined();
  });
});
```

`__testes__/requerimento.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { renderizarDocumento } from '../core/renderizar';
import { requerimentoModelo, type DadosRequerimento } from '../modelos/requerimento';
import { emissaoTeste, marcaTeste } from './fixtures';
import { lerPdf } from './lerPdf';

const dados: DadosRequerimento = {
  requerente: { nome: 'João da Silva', cpf: '000.000.000-00', matricula: '1234', cargo: 'Analista', unidade: 'Divisão de Teste' },
  destinatario: 'Ao Ilmo. Sr. Presidente do Instituto',
  assunto: 'Solicitação de férias',
  texto: 'Venho requerer o gozo de férias regulamentares referentes ao exercício de 2026.',
  local: 'Boa Vista',
  data: '12 de outubro de 2026',
  protocolo: 'RH-2026-000123',
  unidadeEmissora: ['DIVISÃO DE TESTE'],
};

const gerar = (d: DadosRequerimento) => renderizarDocumento(requerimentoModelo, d, marcaTeste, emissaoTeste);

describe('requerimento', () => {
  it('imprime título, requerente, assunto, texto, local/data, fecho, assinatura e protocolo', async () => {
    const { doc } = gerar(dados);
    const [p1] = await lerPdf(doc);
    for (const t of ['REQUERIMENTO', 'João da Silva', 'Solicitação de férias', 'gozo de férias', 'Boa Vista, 12 de outubro de 2026.', 'pede deferimento', 'Protocolo: RH-2026-000123', 'DIVISÃO DE TESTE']) {
      expect(p1.texto).toContain(t);
    }
  });

  it('campos opcionais ausentes não geram "undefined"; fundamentação e anexos só aparecem quando informados', async () => {
    const enxuto: DadosRequerimento = { ...dados, requerente: { nome: 'Maria' }, protocolo: undefined, unidadeEmissora: undefined };
    const [sem] = await lerPdf(gerar(enxuto).doc);
    expect(sem.texto).not.toMatch(/undefined|null/);
    expect(sem.texto).not.toContain('Fundamentação');
    expect(sem.texto).not.toContain('Anexos');
    expect(sem.texto).not.toContain('Protocolo');

    const [com] = await lerPdf(gerar({ ...dados, fundamentacao: 'Art. 1º da lei X.', anexos: ['Cópia do RG', 'Comprovante'] }).doc);
    expect(com.texto).toContain('Fundamentação');
    expect(com.texto).toContain('1. Cópia do RG');
    expect(com.texto).toContain('2. Comprovante');
  });

  it('nome do arquivo usa o protocolo, ou o requerente quando não há protocolo', () => {
    expect(gerar(dados).nomeArquivo).toBe('Requerimento_RH-2026-000123.pdf');
    expect(gerar({ ...dados, protocolo: undefined }).nomeArquivo).toBe('Requerimento_Joao-da-Silva.pdf');
  });

  it('texto muito longo atravessa páginas e a assinatura vai para o fim', async () => {
    const longo = 'Considerando o exposto, solicito providências. '.repeat(120);
    const p = await lerPdf(gerar({ ...dados, texto: longo }).doc);
    expect(p.length).toBeGreaterThanOrEqual(2);
    expect(p[p.length - 1].texto).toContain('João da Silva');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/lib/documentos/__testes__/marca.test.ts src/lib/documentos/__testes__/requerimento.test.ts`
Expected: FAIL — módulos inexistentes.

- [ ] **Step 3: Implementar `marca.ts`**

```ts
import type { TenantConfig } from '@/core/tenant';
import { hexParaRGB } from './core/tokens';
import type { LogoImpressao, MarcaImpressao } from './tipos';

/** Identidade impressa a partir do tenant. Pura: nome do sistema e logos já carregados vêm de fora. */
export function marcaDoTenant(
  tenant: TenantConfig,
  extras: { nomeSistema: string; logoOrgao?: LogoImpressao; logoEntidadeSuperior?: LogoImpressao },
): MarcaImpressao {
  const { identidade, entidadeSuperior } = tenant;
  return {
    nomeOrgao: identidade.nomeParaDocumentos ?? identidade.nomeOficial.toUpperCase(),
    entidadeSuperior: entidadeSuperior?.exibirEmDocumentos ? entidadeSuperior.nome.toUpperCase() : undefined,
    nomeSistema: extras.nomeSistema,
    corPrimaria: hexParaRGB(tenant.marca.corPrimariaHex),
    logoOrgao: extras.logoOrgao,
    logoEntidadeSuperior: extras.logoEntidadeSuperior,
  };
}
```

- [ ] **Step 4: Implementar `logos.ts` (navegador)**

```ts
import type { LogoImpressao } from './tipos';

const cache = new Map<string, LogoImpressao>();

/** Carrega a imagem como PNG em data URL. Nunca lança: sem logo o documento sai sem logo (e avisa no console). */
export async function carregarLogo(src: string | undefined): Promise<LogoImpressao | undefined> {
  if (!src) return undefined;
  const guardado = cache.get(src);
  if (guardado) return guardado;
  try {
    const logo = await new Promise<LogoImpressao>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const c2d = canvas.getContext('2d');
        if (!c2d) return reject(new Error('canvas indisponível'));
        c2d.drawImage(img, 0, 0);
        resolve({ dataUrl: canvas.toDataURL('image/png'), largura: img.naturalWidth, altura: img.naturalHeight, formato: 'PNG' });
      };
      img.onerror = () => reject(new Error('imagem não carregou'));
      img.src = src;
    });
    cache.set(src, logo);
    return logo;
  } catch (e) {
    console.warn('[documentos] logo não carregado; o documento sai sem ele', e);
    return undefined;
  }
}
```

- [ ] **Step 5: Implementar `modelos/requerimento.ts`**

```ts
import { assinaturas, camposChaveValor, localData, paragrafo, secao } from '../blocos';
import { paraNomeArquivo } from '../core/texto';
import type { DocumentoModelo } from '../tipos';

export interface DadosRequerimento {
  requerente: { nome: string; cpf?: string; matricula?: string; cargo?: string; unidade?: string };
  /** Ex.: "Ao Ilmo. Sr. Presidente do Instituto". */
  destinatario: string;
  assunto: string;
  texto: string;
  fundamentacao?: string;
  anexos?: string[];
  local: string;
  /** Já formatada por quem chama (ex.: "12 de outubro de 2026"). */
  data: string;
  /** Protocolo já numerado pelo sistema de origem; este modelo apenas o imprime. */
  protocolo?: string;
  unidadeEmissora?: string[];
}

export const requerimentoModelo: DocumentoModelo<DadosRequerimento> = {
  tipo: 'requerimento',
  familia: 'ato',
  titulo: () => 'Requerimento',
  protocolo: (d) => d.protocolo,
  unidadeEmissora: (d) => d.unidadeEmissora ?? [],
  nomeArquivo: (d) => `Requerimento_${paraNomeArquivo(d.protocolo ?? d.requerente.nome)}.pdf`,
  blocos: (d) => [
    paragrafo({ texto: d.destinatario, negrito: true }),
    camposChaveValor({
      colunas: 2,
      campos: [
        { rotulo: 'Requerente', valor: d.requerente.nome },
        { rotulo: 'CPF', valor: d.requerente.cpf },
        { rotulo: 'Matrícula', valor: d.requerente.matricula },
        { rotulo: 'Cargo', valor: d.requerente.cargo },
        { rotulo: 'Unidade de lotação', valor: d.requerente.unidade },
      ],
    }),
    secao({ texto: 'Assunto' }),
    paragrafo({ texto: d.assunto }),
    secao({ texto: 'Requerimento' }),
    paragrafo({ texto: d.texto, alinhamento: 'justificado', recuoPrimeiraLinha: 12 }),
    ...(d.fundamentacao
      ? [secao({ texto: 'Fundamentação' }), paragrafo({ texto: d.fundamentacao, alinhamento: 'justificado', recuoPrimeiraLinha: 12 })]
      : []),
    ...(d.anexos?.length ? [secao({ texto: 'Anexos' }), paragrafo({ texto: d.anexos.map((a, i) => `${i + 1}. ${a}`).join('\n') })] : []),
    paragrafo({ texto: 'Nestes termos, pede deferimento.' }),
    localData({ local: d.local, data: d.data }),
    assinaturas({ assinantes: [{ nome: d.requerente.nome, cargo: d.requerente.cargo }] }),
  ],
};
```

- [ ] **Step 6: Implementar `registro.ts`**

```ts
import { requerimentoModelo } from './modelos/requerimento';
import type { DocumentoModelo } from './tipos';

/** ÚNICA lista de documentos do sistema. Documento novo = modelo novo + uma linha aqui. */
export const REGISTRO = {
  requerimento: requerimentoModelo,
} as const;

export type TipoDocumento = keyof typeof REGISTRO;
export type DadosDe<T extends TipoDocumento> = (typeof REGISTRO)[T] extends DocumentoModelo<infer D> ? D : never;
```

- [ ] **Step 7: Implementar `emitir.ts` (navegador) e `index.ts`**

`emitir.ts`:

```ts
import type jsPDF from 'jspdf';
import { getTenantSnapshot, logoEntidadeSuperior, logoOrgao, nomeDoSistema } from '@/core/tenant';
import { renderizarDocumento } from './core/renderizar';
import { carregarLogo } from './logos';
import { marcaDoTenant } from './marca';
import { REGISTRO, type DadosDe, type TipoDocumento } from './registro';
import type { DocumentoModelo } from './tipos';

export interface DocumentoEmitido {
  doc: jsPDF;
  blob: Blob;
  nomeArquivo: string;
}

/** Ponto único de entrada das telas: tipo + dados → PDF com a identidade do tenant. */
export async function emitirDocumento<T extends TipoDocumento>(
  tipo: T,
  dados: DadosDe<T>,
  opcoes: { emitidoPor?: string } = {},
): Promise<DocumentoEmitido> {
  const tenant = getTenantSnapshot();
  const [logoDoOrgao, logoDaEntidade] = await Promise.all([
    carregarLogo(logoOrgao('claro')),
    carregarLogo(logoEntidadeSuperior('claro')),
  ]);
  const marca = marcaDoTenant(tenant, {
    nomeSistema: nomeDoSistema(tenant),
    logoOrgao: logoDoOrgao,
    logoEntidadeSuperior: logoDaEntidade,
  });
  const modelo = REGISTRO[tipo] as unknown as DocumentoModelo<DadosDe<T>>;
  const { doc, nomeArquivo } = renderizarDocumento(modelo, dados, marca, { emitidoPor: opcoes.emitidoPor, emitidoEm: new Date() });
  return { doc, blob: doc.output('blob'), nomeArquivo };
}

export function baixarDocumento(d: DocumentoEmitido): void {
  d.doc.save(d.nomeArquivo);
}
```

`index.ts`:

```ts
export { emitirDocumento, baixarDocumento } from './emitir';
export type { DocumentoEmitido } from './emitir';
export { REGISTRO } from './registro';
export type { TipoDocumento, DadosDe } from './registro';
export type { DadosRequerimento } from './modelos/requerimento';
export type { DocumentoModelo, Bloco, Familia, Orientacao } from './tipos';
export * from './blocos';
```

- [ ] **Step 8: Rodar tudo e ver passar; checar tipos dos arquivos novos**

Run: `npx vitest run src/lib/documentos && npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -E "src/lib/documentos" | head`
Expected: testes PASS; o `grep` não imprime nada (nenhum erro de tipo em `src/lib/documentos`). Erro de tipo aqui conta contra o baseline do gate — corrigir.

- [ ] **Step 9: Commit**

```bash
git add src/lib/documentos/marca.ts src/lib/documentos/logos.ts src/lib/documentos/registro.ts src/lib/documentos/emitir.ts src/lib/documentos/index.ts src/lib/documentos/modelos/requerimento.ts src/lib/documentos/__testes__/marca.test.ts src/lib/documentos/__testes__/requerimento.test.ts
git commit -m "feat(documentos): marca do tenant, registro, emitirDocumento e modelo de requerimento

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Modelos de referência das outras famílias + amostras para ver

**Files:**
- Create: `__testes__/modelosReferencia.ts`
- Test: `__testes__/familias.test.ts`, `__testes__/amostras.test.ts`

**Interfaces:**
- Produces (`modelosReferencia.ts`): `relatorioReferencia`, `fichaReferencia`, `comprovanteReferencia` (cada um um `DocumentoModelo<...>` das famílias `relatorio`, `ficha`, `comprovante`), com `dadosRelatorio`, `dadosFicha`, `dadosComprovante`. Servem de exemplo no `PADRAO_DOCUMENTOS.md` e na skill. **Não** entram em `REGISTRO` (não são documentos do sistema).

- [ ] **Step 1: Escrever os modelos de referência**

`__testes__/modelosReferencia.ts`:

```ts
import { camposChaveValor, carimbo, secao, tabela } from '../blocos';
import type { DocumentoModelo } from '../tipos';

export interface DadosRelatorio { filtros: { rotulo: string; valor: string }[]; linhas: { nome: string; unidade: string; valor: number }[] }
export const dadosRelatorio: DadosRelatorio = {
  filtros: [{ rotulo: 'Período', valor: 'Setembro/2026' }, { rotulo: 'Unidade', valor: 'Todas' }],
  linhas: Array.from({ length: 60 }, (_, i) => ({ nome: `Servidor ${i + 1}`, unidade: `Unidade ${(i % 5) + 1}`, valor: 1000 + i })),
};
export const relatorioReferencia: DocumentoModelo<DadosRelatorio> = {
  tipo: 'ref-relatorio', familia: 'relatorio', orientacao: 'paisagem',
  titulo: () => 'Relatório de exemplo', subtitulo: (d) => `${d.linhas.length} registros`,
  nomeArquivo: () => 'relatorio-exemplo.pdf',
  blocos: (d) => [
    secao({ texto: 'Filtros aplicados' }),
    camposChaveValor({ colunas: 3, campos: d.filtros }),
    secao({ texto: 'Resultado' }),
    tabela({
      colunas: [{ chave: 'nome', titulo: 'Nome', peso: 3 }, { chave: 'unidade', titulo: 'Unidade', peso: 2 }, { chave: 'valor', titulo: 'Valor (R$)', alinhamento: 'direita' }],
      linhas: d.linhas,
      totais: { nome: 'TOTAL', valor: d.linhas.reduce((s, l) => s + l.valor, 0) },
    }),
  ],
};

export interface DadosFicha { nome: string; cpf: string; cargo?: string; unidade?: string; observacoes?: string }
export const dadosFicha: DadosFicha = { nome: 'Maria de Souza', cpf: '000.000.000-00', cargo: 'Analista', unidade: undefined, observacoes: 'Sem observações.' };
export const fichaReferencia: DocumentoModelo<DadosFicha> = {
  tipo: 'ref-ficha', familia: 'ficha', titulo: () => 'Ficha cadastral', nomeArquivo: (d) => `ficha-${d.cpf}.pdf`,
  blocos: (d) => [
    secao({ texto: 'Identificação' }),
    camposChaveValor({ campos: [{ rotulo: 'Nome', valor: d.nome }, { rotulo: 'CPF', valor: d.cpf }, { rotulo: 'Cargo', valor: d.cargo }, { rotulo: 'Unidade', valor: d.unidade }] }),
    secao({ texto: 'Observações' }),
    camposChaveValor({ colunas: 1, campos: [{ rotulo: 'Observações', valor: d.observacoes }] }),
  ],
};

export interface DadosComprovante { competencia: string; servidor: string; protocolo: string; itens: { descricao: string; valor: string }[] }
export const dadosComprovante: DadosComprovante = {
  competencia: '09/2026', servidor: 'João da Silva', protocolo: 'FP-2026-000045',
  itens: [{ descricao: 'Vencimento', valor: '5.000,00' }, { descricao: 'Desconto previdenciário', valor: '-550,00' }],
};
export const comprovanteReferencia: DocumentoModelo<DadosComprovante> = {
  tipo: 'ref-comprovante', familia: 'comprovante', titulo: () => 'Comprovante de rendimentos', subtitulo: (d) => `Competência ${d.competencia}`,
  protocolo: (d) => d.protocolo, nomeArquivo: (d) => `comprovante-${d.competencia.replace('/', '-')}.pdf`,
  blocos: (d) => [
    camposChaveValor({ campos: [{ rotulo: 'Servidor', valor: d.servidor }, { rotulo: 'Competência', valor: d.competencia }] }),
    tabela({ colunas: [{ chave: 'descricao', titulo: 'Descrição', peso: 3 }, { chave: 'valor', titulo: 'Valor (R$)', alinhamento: 'direita' }], linhas: d.itens }),
    carimbo({ linhas: ['Este comprovante foi gerado eletronicamente pelo sistema.'] }),
  ],
};
```

- [ ] **Step 2: Teste das famílias**

`__testes__/familias.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { renderizarDocumento } from '../core/renderizar';
import { emissaoTeste, marcaTeste } from './fixtures';
import { lerPdf } from './lerPdf';
import { comprovanteReferencia, dadosComprovante, dadosFicha, dadosRelatorio, fichaReferencia, relatorioReferencia } from './modelosReferencia';

describe('uma amostra de cada família', () => {
  it('relatório: paisagem, várias páginas, totais e filtros', async () => {
    const p = await lerPdf(renderizarDocumento(relatorioReferencia, dadosRelatorio, marcaTeste, emissaoTeste).doc);
    expect(p[0].largura).toBeGreaterThan(p[0].altura);
    expect(p.length).toBeGreaterThanOrEqual(2);
    expect(p.map((x) => x.texto).join(' ')).toContain('TOTAL');
    expect(p[0].texto).toContain('Setembro/2026');
  });

  it('ficha: campo ausente vira "—"', async () => {
    const [p1] = await lerPdf(renderizarDocumento(fichaReferencia, dadosFicha, marcaTeste, emissaoTeste).doc);
    expect(p1.texto).toContain('Maria de Souza');
    expect(p1.itens.some((i) => i.str === '—')).toBe(true);
  });

  it('comprovante: protocolo no cabeçalho e linha de autenticidade no rodapé', async () => {
    const [p1] = await lerPdf(renderizarDocumento(comprovanteReferencia, dadosComprovante, marcaTeste, emissaoTeste).doc);
    expect(p1.texto).toContain('Protocolo: FP-2026-000045');
    expect(p1.texto).toContain('Documento emitido eletronicamente — protocolo FP-2026-000045.');
  });
});
```

- [ ] **Step 3: Teste de amostras (só grava quando pedido)**

`__testes__/amostras.test.ts`:

```ts
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'vitest';
import { renderizarDocumento } from '../core/renderizar';
import { requerimentoModelo } from '../modelos/requerimento';
import { emissaoTeste, marcaTeste } from './fixtures';
import { comprovanteReferencia, dadosComprovante, dadosFicha, dadosRelatorio, fichaReferencia, relatorioReferencia } from './modelosReferencia';

// Gera os PDFs de amostra em DOCUMENTOS_AMOSTRAS=<pasta> para inspeção visual (pdftoppm). Sem a variável, não faz nada.
const saida = process.env.DOCUMENTOS_AMOSTRAS;

describe.skipIf(!saida)('amostras para inspeção visual', () => {
  it('grava uma amostra por família', () => {
    mkdirSync(saida!, { recursive: true });
    const gravar = (nome: string, doc: { output: (t: 'arraybuffer') => ArrayBuffer }) =>
      writeFileSync(join(saida!, nome), Buffer.from(doc.output('arraybuffer')));
    gravar('ato-requerimento.pdf', renderizarDocumento(requerimentoModelo, {
      requerente: { nome: 'João da Silva', cpf: '000.000.000-00', matricula: '1234', cargo: 'Analista', unidade: 'Divisão de Teste' },
      destinatario: 'Ao Ilmo. Sr. Presidente do Instituto', assunto: 'Solicitação de férias',
      texto: 'Venho, respeitosamente, requerer o gozo de férias regulamentares referentes ao exercício de 2026. '.repeat(6),
      fundamentacao: 'Nos termos do estatuto dos servidores.', anexos: ['Cópia do RG', 'Comprovante de residência'],
      local: 'Boa Vista', data: '12 de outubro de 2026', protocolo: 'RH-2026-000123', unidadeEmissora: ['DIVISÃO DE TESTE'],
    }, marcaTeste, emissaoTeste).doc);
    gravar('relatorio.pdf', renderizarDocumento(relatorioReferencia, dadosRelatorio, marcaTeste, emissaoTeste).doc);
    gravar('ficha.pdf', renderizarDocumento(fichaReferencia, dadosFicha, marcaTeste, emissaoTeste).doc);
    gravar('comprovante.pdf', renderizarDocumento(comprovanteReferencia, dadosComprovante, marcaTeste, emissaoTeste).doc);
  });
});
```

- [ ] **Step 4: Rodar os testes e ver passar**

Run: `npx vitest run src/lib/documentos`
Expected: PASS (amostras fica `skipped`).

- [ ] **Step 5: Gerar as amostras e olhar de verdade**

Run:
```bash
SP=/tmp/claude-0/-root/7f60567f-6c48-49ed-8c19-594ba9577a33/scratchpad/amostras
DOCUMENTOS_AMOSTRAS=$SP npx vitest run src/lib/documentos/__testes__/amostras.test.ts
for f in ato-requerimento relatorio ficha comprovante; do pdftoppm -r 70 -png $SP/$f.pdf $SP/$f; done; ls $SP
```
Depois abrir cada PNG com a ferramenta Read e conferir **a olho**: logos nos cantos, nomes centralizados, régua, protocolo à direita, rodapé com "Página X de Y", tabela com cabeçalho cinza e zebra, assinatura centralizada, texto justificado sem buracos feios. Anotar qualquer defeito e corrigir na tarefa dona (token, bloco ou moldura) com teste que o prenda, antes do commit.

- [ ] **Step 6: Commit**

```bash
git add src/lib/documentos/__testes__/modelosReferencia.ts src/lib/documentos/__testes__/familias.test.ts src/lib/documentos/__testes__/amostras.test.ts
git commit -m "test(documentos): modelos de referência das quatro famílias e gerador de amostras

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Ferramenta de comparação antes/depois

**Files:**
- Create: `scripts/documentos-comparar.mjs`

**Interfaces:**
- Produces: `node scripts/documentos-comparar.mjs <antes.pdf> <depois.pdf> [--saida <pasta>] [--dpi 70]` → imprime nº de páginas de cada um, linhas de texto que sumiram/apareceram e grava `antes-N.png` / `depois-N.png` na pasta (padrão: pasta temporária impressa na saída). Exit code 0 sempre (é ferramenta de leitura, não guard). Requer `pdftoppm` e `pdftotext` (poppler) — **uso local; não roda no CI**.

- [ ] **Step 1: Implementar o script**

```js
#!/usr/bin/env node
// Compara dois PDFs (gerador antigo × camada nova): páginas, diferença de texto e PNGs para olhar.
// Uso: node scripts/documentos-comparar.mjs antes.pdf depois.pdf [--saida pasta] [--dpi 70]
// Requer poppler (pdftoppm, pdftotext). Uso local; não roda no CI.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);
const opcao = (nome, padrao) => { const i = args.indexOf(nome); return i >= 0 ? args.splice(i, 2)[1] : padrao; };
const dpi = opcao('--dpi', '70');
const saida = resolve(opcao('--saida', mkdtempSync(join(tmpdir(), 'comparar-pdf-'))));
const [antes, depois] = args;
if (!antes || !depois) { console.error('uso: documentos-comparar.mjs antes.pdf depois.pdf [--saida pasta] [--dpi 70]'); process.exit(2); }
mkdirSync(saida, { recursive: true });

const sh = (cmd, a) => execFileSync(cmd, a, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const paginas = (pdf) => Number(/Pages:\s+(\d+)/.exec(execFileSync('pdfinfo', [pdf], { encoding: 'utf8' }))[1]);
const linhas = (pdf) => new Set(sh('pdftotext', ['-layout', pdf, '-']).split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean));

const [pa, pd] = [paginas(antes), paginas(depois)];
console.log(`páginas: antes ${pa} · depois ${pd}${pa === pd ? '' : '  ← DIFERENTE'}`);

const [la, ld] = [linhas(antes), linhas(depois)];
const sumiram = [...la].filter((l) => !ld.has(l));
const apareceram = [...ld].filter((l) => !la.has(l));
console.log(`\ntexto que SUMIU (${sumiram.length}):`); sumiram.slice(0, 40).forEach((l) => console.log(`  - ${l}`));
console.log(`\ntexto NOVO (${apareceram.length}):`); apareceram.slice(0, 40).forEach((l) => console.log(`  + ${l}`));

execFileSync('pdftoppm', ['-r', dpi, '-png', antes, join(saida, 'antes')]);
execFileSync('pdftoppm', ['-r', dpi, '-png', depois, join(saida, 'depois')]);
console.log(`\nPNGs em ${saida} (antes-N.png / depois-N.png)`);
```

- [ ] **Step 2: Verificar com dois PDFs reais (as amostras da Task 10)**

Run:
```bash
SP=/tmp/claude-0/-root/7f60567f-6c48-49ed-8c19-594ba9577a33/scratchpad/amostras
node scripts/documentos-comparar.mjs $SP/ficha.pdf $SP/comprovante.pdf --saida $SP/cmp && ls $SP/cmp
```
Expected: imprime "páginas: antes 1 · depois 1", listas de texto que sumiu/apareceu (os dois documentos são diferentes, então há diferenças), e `antes-1.png` + `depois-1.png` em `$SP/cmp`. Se `pdfinfo` não existir, instalar não é permitido por esta tarefa: trocar `paginas()` por contagem de arquivos PNG gerados.

- [ ] **Step 3: Commit**

```bash
git add scripts/documentos-comparar.mjs
git commit -m "feat(documentos): ferramenta de comparação antes/depois de PDF

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Guard "jsPDF fora do core" e testes no gate

**Files:**
- Create: `scripts/check-jspdf-fora-do-core.mjs`
- Modify: `scripts/gate.sh`, `scripts/gate-baseline.json`, `package.json` (script `check:jspdf`)

**Interfaces:**
- Produces: `node scripts/check-jspdf-fora-do-core.mjs [--arquivos]` → imprime a quantidade de arquivos de `src/` (fora de `src/lib/documentos/core/`) que fazem `import` **de valor** de `jspdf` (import de tipo não conta); `--arquivos` lista. Chave `jspdfForaDoCore` na baseline; o gate falha se a contagem **subir**.

- [ ] **Step 1: Escrever o guard**

```js
#!/usr/bin/env node
// Conta arquivos de src/ que importam `jspdf` (valor, não tipo) fora de src/lib/documentos/core/.
// Padrão de impressão: PDF novo nasce como modelo em src/lib/documentos/, nunca com `new jsPDF` solto.
// O gate compara com `jspdfForaDoCore` em scripts/gate-baseline.json e falha se SUBIR (ratchet);
// ao migrar geradores (F2–F5) rode `bash scripts/gate.sh --update-baseline` e a dívida cai até zero.
// Uso: node scripts/check-jspdf-fora-do-core.mjs [--arquivos]
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const CORE = join(RAIZ, 'src', 'lib', 'documentos', 'core') + '/';
// `import jsPDF from 'jspdf'`, `import { jsPDF } from "jspdf"`, `import('jspdf')`, `require('jspdf')`; `import type` não conta.
const IMPORTA = /import\s+(?!type\b)[^;]*?from\s+['"]jspdf['"]|import\(\s*['"]jspdf['"]\s*\)|require\(\s*['"]jspdf['"]\s*\)/;

function* arquivos(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* arquivos(p);
    else if (/\.(ts|tsx)$/.test(e.name)) yield p;
  }
}

const achados = [...arquivos(join(RAIZ, 'src'))]
  .filter((p) => !p.startsWith(CORE) && IMPORTA.test(readFileSync(p, 'utf8')))
  .map((p) => relative(RAIZ, p))
  .sort();

if (process.argv.includes('--arquivos')) achados.forEach((a) => console.log(a));
else console.log(achados.length);
```

- [ ] **Step 2: Medir**

Run: `node scripts/check-jspdf-fora-do-core.mjs; node scripts/check-jspdf-fora-do-core.mjs --arquivos | head -5`
Expected: um número (em 2026-10-12 a medição antes desta camada foi **47**: 46 em `src/lib/pdf*`/`portariaPdf` + `RelatorioPortariasDialog.tsx`; `src/lib/documentos/**` só pode ter import de tipo, então não soma). Se o número for maior que 47, algum arquivo novo de `src/lib/documentos/` fora de `core/` importa o jsPDF por valor — corrigir no arquivo, não no guard.

- [ ] **Step 3: Ligar no `gate.sh`**

Em `scripts/gate.sh`:

1. Depois da linha `cor_crua()   { node scripts/check-cor-crua.mjs; }` acrescentar:
```bash
jspdf_fora() { node scripts/check-jspdf-fora-do-core.mjs; }
```
2. Substituir a linha do `printf` do `--update-baseline` por:
```bash
  printf '{\n  "typecheck": %s,\n  "lint": %s,\n  "corCrua": %s,\n  "jspdfForaDoCore": %s\n}\n' "$(ts_erros)" "$(lint_erros)" "$(cor_crua)" "$(jspdf_fora)" > "$BASE"
```
3. Depois de `comparar "cor crua em .tsx" "$(cor_crua)" corCrua ocorrências` acrescentar:
```bash
comparar "jsPDF fora de documentos/core" "$(jspdf_fora)" jspdfForaDoCore arquivos
guard "testes da camada de documentos" npx vitest run --reporter=dot
```
4. No comentário do topo, trocar `# Não há suíte de testes. Uso:` por `# Testes automatizados só existem em src/lib/documentos (vitest). Uso:`.

- [ ] **Step 4: Gravar a chave na baseline com o valor medido**

Editar `scripts/gate-baseline.json` acrescentando `"jspdfForaDoCore": <número do Step 2>` (os três valores existentes ficam **como estão**; não rodar `--update-baseline` aqui, para não reescrever typecheck/lint/corCrua à toa).

- [ ] **Step 5: Script npm**

Em `package.json`, em `"scripts"`, depois de `"check:cor-crua": ...`, acrescentar `"check:jspdf": "node scripts/check-jspdf-fora-do-core.mjs --arquivos",`.

- [ ] **Step 6: Rodar o gate completo e LER o resultado**

Run: `bash scripts/gate.sh 2>&1 | tail -40`
Expected: "Gate verde". Linhas esperadas: `jsPDF fora de documentos/core: 47 arquivos (baseline 47)` ✔ e `testes da camada de documentos` ✔; typecheck/lint/cor crua **não** acima da baseline (typecheck 10, lint 613, corCrua 914). Se algum subiu por causa de `src/lib/documentos/**`, corrigir o arquivo.

- [ ] **Step 7: Provar que o guard morde**

Run: `printf "import jsPDF from 'jspdf';\nexport const x = jsPDF;\n" > src/lib/__guard_teste.ts && node scripts/check-jspdf-fora-do-core.mjs; rm src/lib/__guard_teste.ts`
Expected: imprime **48** (um a mais que a baseline) — o gate falharia. O arquivo temporário é removido no mesmo comando; conferir `git status --short` sem `__guard_teste`.

- [ ] **Step 8: Commit**

```bash
git add scripts/check-jspdf-fora-do-core.mjs scripts/gate.sh scripts/gate-baseline.json package.json
git commit -m "chore(gate): guard de jsPDF fora de documentos/core e testes da camada no gate

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Documentar o padrão e a skill `/novo-documento`

**Files:**
- Modify: `docs/PADRAO_DOCUMENTOS.md` (completar), `docs/GOVERNANCA_DOCUMENTACAO.md`, `AGENTS.md`, `CLAUDE.md`
- Create: `.claude/skills/novo-documento-idjuv/SKILL.md`

**Interfaces:**
- Consumes: tudo que as Tasks 1–12 produziram. Produces: o procedimento canônico "pedir/criar um documento novo".

- [ ] **Step 1: Completar `docs/PADRAO_DOCUMENTOS.md`**

Trocar o aviso do topo para "**Estado:** camada `src/lib/documentos/` entregue na F1 (2026-10-12); geradores antigos seguem valendo até a migração (F2–F5)" e substituir a seção "3. Como criar um documento novo" e acrescentar as seções abaixo (texto integral):

```markdown
## 3. Como criar um documento novo

Regra: **nenhum PDF novo fora de `src/lib/documentos/`**. O gate conta `import` de `jspdf` fora de
`core/` e não deixa subir.

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
6. **Veja o PDF**: `DOCUMENTOS_AMOSTRAS=<pasta> npx vitest run …/amostras.test.ts` (acrescente o novo
   modelo ao arquivo de amostras), `pdftoppm -r 70 -png`, e abra o PNG. Para migração de gerador
   antigo, use `node scripts/documentos-comparar.mjs antes.pdf depois.pdf`.
7. **Use na tela** com `emitirDocumento('<tipo>', dados, { emitidoPor })` e `baixarDocumento(...)`.
8. **Gate**: `bash scripts/gate.sh` verde.

Se faltar um bloco (ex.: lista numerada, QR), crie em `blocos/`, exporte em `blocos/index.ts` e teste;
não desenhe direto no `doc` dentro de um modelo.

## 4. Anatomia

(tabela de tokens da spec §5, o cabeçalho/rodapé, e o diagrama de pastas)

## 5. Protocolo

A camada **imprime** o protocolo que o modelo devolve em `protocolo(dados)`; ela não numera. Hoje só o
RH numera atos (`RH-AAAA-NNNNNN`, RPCs de `src/lib/rhRpc.ts`). Numerar documentos de outros módulos
exige tabela/RPC com RLS (decisão e spec próprias).

## 6. Limitações conhecidas

- Fontes nativas do PDF (Times/Helvetica): caracteres fora do WinAnsi (emoji, `ł`, `✓`…) saem como `?`.
- Texto recuado justifica pela largura da 1ª linha (ver comentário em `blocos/paragrafo.ts`).
- Não há QR de verificação pública (fase opcional pós-F5).
```

(Substituir a linha "(tabela de tokens …)" pelo conteúdo real: copiar a tabela da spec §5 e a árvore de pastas da seção "File Structure" deste plano.)

- [ ] **Step 2: Criar a skill**

`.claude/skills/novo-documento-idjuv/SKILL.md`:

```markdown
---
name: novo-documento-idjuv
description: Cria ou migra um documento imprimível (PDF) do IDJUV Governa Hub pelo padrão único de impressão em src/lib/documentos/. Use quando o usuário pedir "gerar PDF de X", "imprimir X", "novo requerimento/portaria/relatório/ficha/comprovante", "criar modelo de documento" ou quando for migrar um gerador antigo de src/lib/pdf*.ts.
---

# Novo documento imprimível — IDJUV Governa Hub

Padrão canônico: `docs/PADRAO_DOCUMENTOS.md`. Spec: `docs/superpowers/specs/2026-10-12-padrao-impressao-documentos-design.md`.
**Nunca** crie `new jsPDF` fora de `src/lib/documentos/core/` — o gate falha.

## Antes de começar
1. Descubra com o usuário (ou pelo pedido): **qual documento**, **quem emite** (unidade), **que dados entram**, **precisa de protocolo?**
   (a camada só imprime protocolo já numerado; numerar é decisão de banco — `migracao-segura-idjuv`).
2. Procure o que já existe: `src/lib/documentos/registro.ts` e o inventário em `docs/PADRAO_DOCUMENTOS.md` §2.
   Se já existe gerador antigo, é **migração**: leia-o, gere o PDF "antes" com dados de fixture antes de mexer.

## Passo a passo
1. **Família**: `ato` (texto corrido + assinatura) · `relatorio` (tabela, pode ser paisagem) · `ficha` (rótulo/valor) · `comprovante` (conferência de valores, tem linha de autenticidade).
2. **Dados**: interface TS em `src/lib/documentos/modelos/<nome>.ts`. Nada de nome de órgão/cliente no modelo; unidade emissora, local e data vêm nos dados.
3. **Modelo**: `DocumentoModelo<Dados>` com `tipo`, `familia`, `titulo`, `nomeArquivo`, `blocos(dados)`; use só blocos de `../blocos`
   (`secao, paragrafo, camposChaveValor, tabela, assinaturas, localData, carimbo`). Copie a forma de `modelos/requerimento.ts`.
4. **Registre** em `src/lib/documentos/registro.ts`.
5. **Teste** em `src/lib/documentos/__testes__/<nome>.test.ts` (`renderizarDocumento` + `lerPdf`): campos principais, campo ausente
   sem `undefined`, texto longo em várias páginas, protocolo presente/ausente.
6. **Veja o PDF** (obrigatório): gere a amostra, rasterize com `pdftoppm -r 70 -png` e abra o PNG com Read.
   Migração: `node scripts/documentos-comparar.mjs antes.pdf depois.pdf` e mostre ao usuário.
7. **Tela**: `emitirDocumento('<tipo>', dados, { emitidoPor })` + `baixarDocumento`. Em migração, mantenha a função exportada do gerador
   antigo como wrapper de uma linha até todas as telas migrarem.
8. **Gate**: `bash scripts/gate.sh` verde (leia o resultado). Atualize `docs/PADRAO_DOCUMENTOS.md` (inventário/fase) no mesmo PR.

## Não faça
- Desenhar direto no `doc` dentro de um modelo (crie um bloco).
- Texto fixo de órgão/cargo/sigla; cor fixa (`#004444`) — a cor vem da marca do tenant.
- Mergear: merge na `main` publica o front. Deixe o PR em rascunho para o usuário validar o PDF.
```

- [ ] **Step 3: Matriz de documentação**

Run: `sed -n 27,31p docs/GOVERNANCA_DOCUMENTACAO.md; sed -n 59,66p docs/GOVERNANCA_DOCUMENTACAO.md` para ver o formato exato das duas tabelas; acrescentar **uma linha em cada**, no mesmo formato:
- Mapa canônico (§2): `| [`docs/PADRAO_DOCUMENTOS.md`](./PADRAO_DOCUMENTOS.md) | Padrão único de impressão: famílias, tokens, como criar documento novo, inventário dos geradores |`
- Matriz (§3): `| Documento/PDF novo ou alterado (`src/lib/documentos/`, `src/lib/pdf*.ts`) | `docs/PADRAO_DOCUMENTOS.md` | Skill `novo-documento-idjuv` |`

- [ ] **Step 4: `AGENTS.md` e `CLAUDE.md`**

- `AGENTS.md`, linha "Verificação": trocar `não há testes. Use` por `testes automatizados só em src/lib/documentos (vitest, rodam no gate). Use`.
- `AGENTS.md`, tabela de skills: acrescentar `| `novo-documento-idjuv` | IDJUV | Qualquer PDF/documento imprimível novo ou migração de gerador antigo (`src/lib/documentos/`) |` depois da linha de `onboarding-cliente-idjuv`.
- `CLAUDE.md` §6 "Geração de documentos": substituir o primeiro marcador por: `- **PDF novo nasce em `src/lib/documentos/`** (modelo declarativo + blocos; ver `docs/PADRAO_DOCUMENTOS.md` e skill `novo-documento-idjuv`). Os geradores antigos `src/lib/pdf*.ts` (jsPDF/pdf-lib) e `src/lib/word*.ts` (docx) são migrados por fases; o gate impede novo `import` de `jspdf` fora de `src/lib/documentos/core/`.` Manter os marcadores de planilha e geradores fiscais como estão.
- `CLAUDE.md` §3: na nota "Não há suíte de testes", acrescentar "(exceto `src/lib/documentos`, com vitest, rodando dentro do gate)".

- [ ] **Step 5: Verificar links e docs**

Run: `node scripts/check-doc-links.mjs`
Expected: exit 0, sem referência quebrada (a skill e os arquivos citados existem).

- [ ] **Step 6: Commit**

```bash
git add docs/PADRAO_DOCUMENTOS.md docs/GOVERNANCA_DOCUMENTACAO.md AGENTS.md CLAUDE.md .claude/skills/novo-documento-idjuv/SKILL.md
git commit -m "docs: padrão de criação de documentos e skill novo-documento-idjuv

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 14: Verificação final e revisão

**Files:** nenhum novo (só correções se a revisão achar algo).

- [ ] **Step 1: Gate completo, resultado lido**

Run: `bash scripts/gate.sh 2>&1 | tail -45`
Expected: "Gate verde"; guards todos ✔; testes da camada ✔; typecheck/lint/cor crua ≤ baseline; build ✔. Colar na resposta final as linhas de resultado (números), não "passou".

- [ ] **Step 2: Testes da camada com contagem**

Run: `npx vitest run src/lib/documentos 2>&1 | tail -15`
Expected: todos os arquivos PASS; anotar "N tests passed".

- [ ] **Step 3: Conferir escopo e tenant-agnóstico**

Run:
```bash
git diff --stat origin/main...HEAD | tail -40
git diff origin/main...HEAD --name-only | grep -E "^src/(lib/pdf|App\.tsx|pages|components)" || echo "nenhum gerador antigo/tela/rota tocado"
grep -rniE "idjuv|roraima|dirae|diraf" src/lib/documentos || echo "nenhum nome de cliente em src/lib/documentos"
```
Expected: só arquivos do plano; as duas últimas linhas confirmam "nenhum gerador antigo…" e "nenhum nome de cliente…". Qualquer ocorrência: corrigir.

- [ ] **Step 4: Revisão independente**

Despachar o subagente `revisor-codigo-idjuv` (`.claude/agents/`) sobre `git diff origin/main...HEAD`, com brief: tarefa (camada de impressão F0+F1), seções aplicáveis do `CLAUDE.md`/`AGENTS.md` (invariantes 4, 7 e 8; §6 tenant; §7 convenções), spec e este plano, e a pergunta "algum bloqueante?". Corrigir bloqueantes com teste que os prenda; registrar os não-bloqueantes no resumo final. (Sem segurança de dados/RLS/RBAC tocada, `revisor-seguranca-idjuv` não é necessário — a camada não faz I/O além de carregar imagens do tenant.)

- [ ] **Step 5: Relatório ao usuário (sem push, sem PR)**

Entregar: número de testes, saída do gate, PNGs das 4 amostras (caminhos), estado do inventário (quantos geradores por família) e o que fica para F2. Perguntar se quer **push + PR rascunho** (o `AGENTS.md` do repo exige pedido explícito). Lembrar que merge na `main` publica o front.

---

## Self-Review

**1. Cobertura da spec**
- §3 famílias → `core/familias.ts` (T4) + modelos de referência (T10) + `requerimento` (T9). ✔
- §4 arquitetura (`core/`, `blocos/`, `modelos/`, `registro`, `emitir`, `index`) → T3–T9; `familias/` virou arquivo único (desvio declarado). ✔ Adaptador de transição (wrapper do gerador antigo) → regra na skill/doc; aplicado de fato na F2. ✔
- §5 visual (A4, margens, escala, Times/Helvetica, cor do tenant, contraste, P&B, fonte como token) → `tokens.ts` (T3) + testes de contraste; cabeçalho/rodapé/protocolo/página X de Y → T4. "Fonte é um token" cobre-se só em parte: `FAMILIAS.fonteCorpo` troca Times/Helvetica; EB Garamond sob demanda é declarado fora desta fase.
- §6 prova e trava → comparador (T11), guard ratchet (T12), gate lido (T14). Fixtures `__fixtures__` da spec viraram `__testes__/` (nome do diretório). Golden/rasterização automatizada no CI não existe (poppler só local) — dito no T11.
- §7 padrão para novos documentos → T13 (doc, skill, AGENTS/CLAUDE, matriz). ✔
- §8 F0 → T1; F1 → T2–T14. F2–F5 → planos próprios (declarado). ✔
- §9 fora de escopo (protocolo fora do RH, QR, Word/Excel, organograma `window.print`) → registrado no doc (T13 §5/§6); nada implementado. ✔
- §10 riscos → tabela cobre-se por testes (tabela 200+ linhas, T7) e escopo do T14.

**2. Placeholders:** nenhum "TBD/TODO". Duas instruções condicionais existem de propósito e têm ação definida: T5 Step 6 (se o `justify` do jsPDF falhar → cair para texto à esquerda neste bloco e registrar a limitação) e T11 Step 2 (sem `pdfinfo` → contar PNGs). T13 Step 1 manda copiar a tabela da spec §5 e a árvore de pastas deste plano para dentro da seção 4 do doc.

**3. Consistência de tipos/nomes:** `ContextoDocumento` (campos `esquerda, largura, larguraPagina, alturaPagina, limiteInferior, y, novaPagina, garantirEspaco, fonteCorpo, marca`) é o mesmo em T3, T4 e todos os blocos. `Bloco`, `DocumentoModelo`, `MarcaImpressao`, `Emissao`, `LogoImpressao` idênticos entre T3/T4/T9. `quebrarEmLinhas(doc, texto, largura)` e `ouTraco`/`paraWinAnsi` usados com a mesma assinatura em T5–T8. `renderizarDocumento(modelo, dados, marca, emissao)` igual em T4, T9, T10. `lerPdf(doc)`/`mmParaPt` iguais em T2 e usos. `REGISTRO`/`TipoDocumento`/`DadosDe` (T9) usados em `emitir.ts` (T9) e `index.ts`.

**4. Review Focus:** itens 1–6 mapeados a testes: (1) `texto.test.ts` + parágrafo com emoji; (2) tabela vazia; (3) palavra longa em `texto.test.ts` + tabela + parágrafo justificado; (4) `texto.test.ts`, campos e tabela; (5) `renderizar.test.ts` + tabela de 200 linhas; (6) `renderizar.test.ts` e `requerimento.test.ts`.

**Riscos que este plano NÃO elimina (e como aparecem):** (a) o `align: 'justify'` do jsPDF pode se comportar diferente do esperado — o teste de margem direita acusa; (b) não rodei este código: o plano foi escrito a partir de spikes (jsPDF e pdfjs em Node funcionam; poppler existe no host), então erros de digitação/tipo aparecem no primeiro `vitest`/`tsc` de cada tarefa; (c) os logos reais do tenant só serão vistos no navegador — as amostras usam um PNG 1×1 esticado, e a conferência com logos de verdade acontece na F2 antes do merge.

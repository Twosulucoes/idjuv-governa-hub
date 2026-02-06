
# Plano: Segunda Versao do Hot Site - Seletivas Estudantis (Layout Minimalista)

## Objetivo
Criar uma versao alternativa do hot site `/selecoes` com design minimalista baseado nos cards de referencia (fundo claro, tipografia black em maiusculas, silhuetas de atletas, elementos geometricos decorativos), mantendo unicidade visual para melhor conversao. Adicionar texto de exemplo ao regulamento com botao de download.

---

## Analise das Imagens de Referencia

Os cards compartilham:
- Fundo cinza claro (#f5f5f5 / zinc-100)
- Tipografia ultra-bold em maiusculas com letter-spacing expandido
- Silhuetas de atletas em circulos decorativos (preto)
- Elementos geometricos: linhas curvas, retangulos arredondados nos cantos
- Indicadores de pagina (dots) no topo de cada card
- Rodape institucional: "Diretoria de Esporte" + IDJuv + Governo de Roraima
- Estrutura: MODALIDADE grande + "15 A 17 ANOS" + naipes separados

---

## Mudancas Propostas

### 1. Criar Nova Versao V2 do Hot Site

**Arquivo:** `src/pages/eventos/SeletivaEstudantilV2Page.tsx`

Design Minimalista:
- Fundo: `bg-zinc-100` (cinza claro consistente com cards)
- Tipografia: `font-black tracking-[0.3em] uppercase` para titulos
- Paleta: Preto e branco primariamente, acentos sutis
- Elementos decorativos: SVG de linhas curvas nos cantos
- Cards de modalidade em estilo "poster" como nas imagens

**Estrutura da Hero:**
```text
+------------------------------------------+
|  [dots indicator: ●●●●○]                 |
|                                          |
|     SELETIVA DAS                         |
|     S E L E C O E S                      |
|     ESTUDANTIS                           |
|                                          |
|  [silhuetas de atletas central]          |
|                                          |
|  19/FEV a 01/MAR | 15 a 17 ANOS          |
+------------------------------------------+
```

**Cards de Modalidade (Full-Page Style):**
Cada modalidade com layout identico aos cards de referencia:
- Dots indicator no topo
- Nome da modalidade em tipografia massiva
- Silhueta do atleta em circulo decorativo
- Secoes FEMININO e MASCULINO separadas
- Datas, horarios e locais
- Footer institucional

### 2. Componente de Card Estilo Poster

**Arquivo:** `src/pages/eventos/components/ModalidadePoster.tsx`

```text
+------------------------------------------+
|           ●●●○●                          |
|                           [silhueta]     |
|   V O L E I             [em circulo]     |
|   15 A 17 ANOS                           |
|                                          |
|        FEMININO                          |
|   📅 28 DE FEVEREIRO, 08H30              |
|   📍 GINASIO HELIO DA COSTA CAMPOS       |
|      R. PRES. JUSCELINO KUBITSCHECK...   |
|                                          |
|        MASCULINO                         |
|   📅 28 DE FEVEREIRO, 15H                |
|   📍 GINASIO HELIO DA COSTA CAMPOS       |
|                                          |
| [Diretoria de Esporte] [IDJuv] [Governo] |
+------------------------------------------+
```

### 3. Componentes de Decoracao

**Arquivo:** `src/pages/eventos/components/DecorativeElements.tsx`

SVGs para:
- Linhas curvas nos cantos (estilo do futsal card)
- Retangulos arredondados decorativos
- Circulo com atleta (silhueta)
- Dots indicator de navegacao

### 4. Atualizar Regulamento com Texto Exemplo

**Arquivo:** `src/pages/eventos/components/SeletivaRegulamentoV2.tsx`

Adicionar texto de exemplo do regulamento:

```text
REGULAMENTO DA SELETIVA 2026

1. OBJETIVO
A Seletiva das Selecoes Estudantis tem como objetivo 
identificar e selecionar atletas estudantis para 
representar o Estado de Roraima nos Jogos da Juventude 2026.

2. PARTICIPACAO
Podem participar estudantes regularmente matriculados 
em instituicoes de ensino do Estado de Roraima, com 
idade entre 15 e 17 anos completos no ano da competicao.

3. MODALIDADES
- Futsal (Masculino e Feminino)
- Handebol (Masculino e Feminino)
- Basquete (Masculino e Feminino)
- Volei (Masculino e Feminino)

4. DOCUMENTACAO NECESSARIA
- Documento de identificacao com foto
- Declaracao de matricula escolar
- Autorizacao dos pais ou responsaveis (para menores)
- Atestado medico de aptidao fisica

5. CRITERIOS DE SELECAO
Os atletas serao avaliados por comissao tecnica 
designada pelo IDJuv, considerando habilidades 
tecnicas, taticas e comportamentais.

[BOTAO: Baixar Regulamento Completo (PDF)]
```

### 5. Rota Alternativa

**Arquivo:** `src/App.tsx`

Adicionar rota para a versao V2:
```typescript
<Route path="/selecoes-v2" element={<SeletivaEstudantilV2Page />} />
```

---

## Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| `src/pages/eventos/SeletivaEstudantilV2Page.tsx` | Criar - Pagina principal V2 |
| `src/pages/eventos/components/ModalidadePoster.tsx` | Criar - Card estilo poster |
| `src/pages/eventos/components/DecorativeElements.tsx` | Criar - SVGs decorativos |
| `src/pages/eventos/components/SeletivaRegulamentoV2.tsx` | Criar - Regulamento com texto |
| `src/pages/eventos/components/SeletivaHeaderV2.tsx` | Criar - Header minimalista |
| `src/pages/eventos/components/SeletivaFooterV2.tsx` | Criar - Footer institucional |
| `src/App.tsx` | Modificar - Adicionar rota /selecoes-v2 |

---

## Detalhes Tecnicos

### Paleta de Cores V2
```css
--background: #f5f5f5 (zinc-100)
--foreground: #18181b (zinc-900)
--accent-line: #000000
--muted: #a1a1aa (zinc-400)
```

### Tipografia
- Titulos: `font-black text-5xl tracking-[0.3em] uppercase`
- Subtitulos: `font-bold text-xl tracking-[0.2em] uppercase`
- Corpo: `font-medium text-base tracking-wide uppercase`

### Animacoes
- Transicoes suaves com framer-motion
- Fade-in sequencial para cards
- Hover sutil nos elementos interativos

---

## Comparacao das Versoes

| Aspecto | V1 (Atual) | V2 (Nova) |
|---------|------------|-----------|
| Estilo | Colorido, gradientes | Minimalista, P&B |
| Cards | Grid 2 colunas | Full-width posters |
| Tipografia | Normal | Ultra-bold, espacada |
| Elementos | Emojis | Silhuetas SVG |
| Hero | Grande, animado | Clean, tipografico |
| Regulamento | Placeholder | Texto completo |

---

## Resultado Esperado

Apos implementacao, o usuario tera duas versoes para comparar:
- `/selecoes` - Versao atual (colorida, dinamica)
- `/selecoes-v2` - Versao minimalista (P&B, tipografica)

Ambas com:
- Regulamento com texto de exemplo e botao de download
- Mesmas informacoes de datas/locais
- Espacos para galeria e resultados
- Branding institucional consistente

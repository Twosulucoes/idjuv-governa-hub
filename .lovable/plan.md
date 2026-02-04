
# Plano Corrigido: Aumentar Fontes do Bloco 2 + Correções Visuais

## Resumo das Alterações

O usuário solicitou:
1. **Aumentar fontes** no Bloco 2 (exceto nome do servidor que está bom em 11pt)
2. Adicionar **hífen central** nas células de sábado/domingo/feriados no Bloco 3
3. Corrigir **vazamento na coluna DIA** do Bloco 3

---

## Solução: Aumentar Fontes + Altura do Bloco

Para acomodar fontes maiores sem vazamento, aumentaremos a altura do Bloco 2 de **26mm para 30mm**.

### Novas Especificações de Fonte (AUMENTADAS)

| Campo | Tamanho Atual | Novo Tamanho |
|-------|---------------|--------------|
| Nome do Servidor | 11pt | **11pt** (mantém - já está bom) |
| Labels (MATRÍCULA, CARGO...) | 6pt | **8pt** (+2pt) |
| Valores dos campos | 8pt | **10pt** (+2pt) |
| Badge de jornada | 7pt | **9pt** (+2pt) |
| Label Unidade de Lotação | 6pt | **7pt** (+1pt) |
| Valor Unidade de Lotação | 7pt | **9pt** (+2pt) |
| Carga Semanal | 8pt | **10pt** (+2pt) |

### Nova Altura do Bloco 2

```text
ANTES: 26mm (apertado com fontes pequenas)
DEPOIS: 30mm (confortável com fontes maiores)
```

### Nova Distribuição Vertical (dentro dos 30mm)

```text
+------------------------------------------+  y + 0
|▌                                         |
|▌ NOME DO SERVIDOR EM DESTAQUE    [8h/dia]|  y + 5mm (nome 11pt)
|▌                                         |
|▌ MATRÍCULA     CARGO / FUNÇÃO    COMPET. |  y + 12mm (labels 8pt)
|▌ 12345         Analista Admin... JAN/2026|  y + 17mm (valores 10pt)
|▌                                         |
|▌ UNIDADE DE LOTAÇÃO              C.SEMANAL|  y + 22mm (labels 7pt)
|▌ Gerência de Tecnologia da...   40h      |  y + 27mm (valores 9pt)
+------------------------------------------+  y + 30mm
```

---

## Alteração na Constante de Altura

```typescript
// ANTES
export const BLOCO_ALTURAS = {
  cabecalho: 22,
  dadosServidor: 26,  // ← apertado
  assinaturas: 22,
  rodape: 8
};

// DEPOIS
export const BLOCO_ALTURAS = {
  cabecalho: 22,
  dadosServidor: 30,  // ← aumentado para acomodar fontes maiores
  assinaturas: 22,
  rodape: 8
};
```

---

## Correções Adicionais no Bloco 3

### 1. Hífen em Dias Não Úteis

Nas células de entrada/saída (ent1, sai1, ent2, sai2, abo1, abo2), quando for sábado, domingo ou feriado:
- Renderizar um **"—"** (travessão) centralizado
- Fonte 8pt, cor cinza médio

### 2. Coluna DIA Centralizada

Corrigir o vazamento renderizando "DD Xxx" como texto único centralizado:
```typescript
const texto = `${String(dia).padStart(2, '0')} ${diaSemana}`;
doc.text(texto, centerX, textY, { align: 'center' });
```

---

## Arquivo a Modificar

| Arquivo | Alterações |
|---------|------------|
| `src/lib/pdfFrequenciaMensalGenerator.ts` | Aumentar altura do Bloco 2, aumentar fontes, ajustar espaçamento, adicionar hífen nos dias não úteis, centralizar coluna DIA |

---

## Resultado Visual Esperado

```text
+------------------------------------------+
|        BLOCO 2: DADOS DO SERVIDOR        |  30mm
|                                          |
| MATRÍCULA     CARGO / FUNÇÃO    COMPETÊNCIA  ← Fontes MAIORES
| 12345         Analista Admin... JAN / 2026   ← Mais legível
|                                          |
| UNIDADE DE LOTAÇÃO                C. SEMANAL
| Gerência de Tecnologia da Info... 40h    
+------------------------------------------+

+------------------------------------------+
|       BLOCO 3: CORPO DA FREQUÊNCIA       |
|  DIA  | ENT | SAÍ | ASSIN. | ENT | SAÍ...|
|-------|-----|-----|--------|-----|-------|
| 01 Qua|  —  |  —  | FERIADO|  —  |  —  ..|  ← Hífen nos dias não úteis
| 02 Qui| 8:00|12:00|________|13:00|17:00..|
| 03 Sáb|  —  |  —  | SÁBADO |  —  |  —  ..|
+------------------------------------------+
```

---

## Impacto no Layout Geral

Com o Bloco 2 aumentando de 26mm para 30mm (+4mm), o Bloco 3 (corpo da tabela) terá 4mm a menos de espaço. A altura das linhas será recalculada automaticamente pelo algoritmo de compressão existente, mantendo tudo dentro de uma única página A4.

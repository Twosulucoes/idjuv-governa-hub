
# Refatoração do PDF de Frequência Mensal

## Problemas Identificados

1. **Linha diagonal feia na coluna de assinatura** (linhas 488-493) - Quando é sábado, domingo ou feriado, uma linha diagonal cruza toda a coluna de assinatura, causando poluição visual

2. **Separador desnecessário entre Saída e Assinatura** (linhas 358-363 e 480-484) - Há uma coluna "separador" de 3mm com linhas duplas verticais que ocupa espaço e não agrega valor visual

3. **Ordem do cabeçalho invertida** (linhas 232-247) - Atualmente:
   - Título: "FOLHA DE FREQUÊNCIA MENSAL" (primeiro)
   - "Governo do Estado de Roraima" (segundo)
   - "Instituto de Desporto..." (terceiro)
   
   **Deve ser:**
   - "Governo do Estado de Roraima" (destacado - primeiro)
   - "Instituto de Desporto, Juventude e Lazer..." (destacado - segundo)  
   - Título: "FOLHA DE FREQUÊNCIA MENSAL" (terceiro)

---

## Solução Proposta

### 1. Remover a Linha Diagonal na Coluna de Assinatura

**De:**
```typescript
if (isNaoUtil) {
  doc.setDrawColor(CORES.textoSecundario.r, ...);
  doc.setLineWidth(0.4);
  doc.line(colX + 2, y + rowHeight - 1, colX + colWidths.assinatura - 2, y + 1);
}
```

**Para:** Substituir por um preenchimento suave em cinza (hachura leve) indicando que o campo não precisa de assinatura, usando apenas a cor de fundo já existente — sem nenhum desenho adicional.

### 2. Remover o Separador entre Saída e Assinatura

**Mudanças:**
- Remover `separador: 3` do objeto `colWidths`
- Recalcular `assinatura` para ocupar o espaço liberado: `contentWidth - 115`
- Remover as linhas duplas verticais no header (linhas 358-363)
- Remover a linha grossa verde no corpo da tabela (linhas 480-484)
- Adicionar apenas uma linha vertical fina padrão entre Saída e Assinatura

### 3. Inverter a Ordem do Cabeçalho

**Nova ordem:**
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo Gov]   GOVERNO DO ESTADO DE RORAIMA      [Logo IDJuv] │
│              Instituto de Desporto, Juventude...            │
│              ─────────────────────────────────              │
│              FOLHA DE FREQUÊNCIA MENSAL                     │
└─────────────────────────────────────────────────────────────┘
```

**Implementação:**
- Linha 1: "GOVERNO DO ESTADO DE RORAIMA" — fonte bold, tamanho 10, cor primária
- Linha 2: "Instituto de Desporto, Juventude e Lazer do Estado de Roraima" — fonte normal, tamanho 8, cor texto
- Linha 3: "FOLHA DE FREQUÊNCIA MENSAL" — fonte bold, tamanho 12, cor primária (título destacado)

---

## Detalhamento Técnico

### Arquivo: `src/lib/pdfFrequenciaMensalGenerator.ts`

#### Mudança 1: Redefinir `colWidths` (linha 326-334)
```typescript
const colWidths = {
  dia: 13,
  diaSemana: 18,
  tipo: 36,
  entrada: 24,
  saida: 24,
  assinatura: contentWidth - 115, // Espaço maior sem separador
};
```

#### Mudança 2: Cabeçalho da tabela — Remover separador (linhas 344-365)
- Desenhar colunas: DIA, SEMANA, TIPO DO DIA, ENTRADA, SAÍDA, ASSINATURA
- Sem linhas duplas verticais entre Saída e Assinatura

#### Mudança 3: Corpo da tabela — Simplificar transição Saída→Assinatura (linhas 471-484)
- Após desenhar Saída, adicionar apenas linha vertical fina padrão
- Pular direto para a coluna Assinatura (sem separador intermediário)

#### Mudança 4: Remover linha diagonal nos dias não úteis (linhas 486-493)
- Remover completamente o bloco `if (isNaoUtil) { ... }` que desenha a diagonal
- O fundo diferenciado (bgFeriado ou bgCinza) já indica visualmente que é um dia sem registro

#### Mudança 5: Inverter cabeçalho institucional (linhas 232-247)
```typescript
// ===== CABEÇALHO INSTITUCIONAL =====
const textoY = y + maxLogoHeight / 2 - 6;

// Linha 1: Governo do Estado de Roraima (destacado)
doc.setTextColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
doc.setFont('helvetica', 'bold');
doc.setFontSize(10);
doc.text('GOVERNO DO ESTADO DE RORAIMA', pageWidth / 2, textoY, { align: 'center' });

// Linha 2: Nome do Instituto (destacado)
doc.setFont('helvetica', 'bold');
doc.setFontSize(8);
doc.setTextColor(CORES.texto.r, CORES.texto.g, CORES.texto.b);
doc.text('Instituto de Desporto, Juventude e Lazer do Estado de Roraima', pageWidth / 2, textoY + 4.5, { align: 'center' });

// Linha 3: Título do documento
doc.setTextColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
doc.setFont('helvetica', 'bold');
doc.setFontSize(12);
doc.text('FOLHA DE FREQUÊNCIA MENSAL', pageWidth / 2, textoY + 11, { align: 'center' });
```

---

## Resultado Visual Esperado

### Antes (problemático):
```
      FOLHA DE FREQUÊNCIA MENSAL
      Governo do Estado de Roraima
      Instituto de Desporto...
┌─────┬─────┬────────┬────────┬───────┬───║───┬────────────────┐
│ DIA │ SEM │  TIPO  │ENTRADA │ SAÍDA │   ║   │  ASSINATURA    │
├─────┼─────┼────────┼────────┼───────┼───║───┼────────────────┤
│ 01  │ SÁB │ Sábado │        │       │   ║   │  ╱╱╱╱╱╱╱╱╱╱╱   │  ← Diagonal feia
│ 02  │ DOM │Domingo │        │       │   ║   │  ╱╱╱╱╱╱╱╱╱╱╱   │  ← Diagonal feia
```

### Depois (limpo):
```
      GOVERNO DO ESTADO DE RORAIMA
      Instituto de Desporto, Juventude e Lazer do Estado de Roraima
      FOLHA DE FREQUÊNCIA MENSAL
┌─────┬─────┬────────┬────────┬───────┬────────────────────────┐
│ DIA │ SEM │  TIPO  │ENTRADA │ SAÍDA │      ASSINATURA        │
├─────┼─────┼────────┼────────┼───────┼────────────────────────┤
│ 01  │ SÁB │ Sábado │        │       │  (fundo cinza suave)   │  ← Limpo
│ 02  │ DOM │Domingo │        │       │  (fundo cinza suave)   │  ← Limpo
```

---

## Arquivos Afetados

| Arquivo | Ação |
|---------|------|
| `src/lib/pdfFrequenciaMensalGenerator.ts` | Refatorar cabeçalho, remover separador e diagonal |

## Estimativa

- **Complexidade:** Baixa
- **Linhas afetadas:** ~40 linhas
- **Risco:** Baixo (mudanças visuais apenas)
